# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Start dev server (hot reload)
pnpm build            # Production build
pnpm format           # Auto-format with Prettier (cache-aware)
pnpm start            # Alias for `pnpm dev`
pnpm setup            # Run after initial clone / deps install (`max setup`)
```

- **No test runner** is configured (no testing deps).
- **No standalone `pnpm lint`** — linting runs via Husky pre-commit hook: `lint-staged` executes `max lint --fix --eslint-only` + Prettier on staged files. To lint manually, run `npx max lint --fix --eslint-only src/` (or `--eslint-only` for JS/TS, `--stylelint-only` for CSS/Less).
- **Registry**: `https://registry.npmmirror.com/` (configured in `.npmrc`).
- **Commit messages** are validated by Husky `commit-msg` hook via `max verify-commit`.
- Set env `TINDER_API_URL` at build time to target a specific backend server (e.g. `TINDER_API_URL=https://api.example.com pnpm build`).

## Architecture

This is a **React SPA admin panel** built with **UmiJS 4** (`@umijs/max` — the full-featured Umi distribution). It manages users and registration questions for a service called "Tinder" (the backend API, not the dating app).

### Tech stack

- **Framework**: UmiJS 4 (`@umijs/max`) — routing, build, lint, plugins
- **UI**: Ant Design 5 + `@ant-design/pro-components` (ProTable, ProColumns, FooterToolbar, PageContainer)
- **Language**: TypeScript (TSX)
- **Package manager**: pnpm (lockfile: `pnpm-lock.yaml`)
- **Auth**: JWT (Bearer token in localStorage under key `tinder_token`)
- **API client**: Raw `fetch` (no Axios / umi-request / @umijs/plugin-request abstraction)
- **State**: `initialState` (UMI runtime config) — no Umi models or global state beyond `app.ts`'s `getInitialState()`

### Project layout

```
src/
├── app.ts                    # Runtime config: getInitialState, layout onPageChange, request interceptors
├── access.ts                 # Access/permission: canAdmin based on user_role (superadmin | songlist_editor)
├── typings/tinder.d.ts       # API namespace types (RegisterQuestion, LoginResponse, CurrentUser, AdminUser, QuestionStats, TotalResponse)
├── services/
│   ├── tinder.ts             # Auth service: login (SHA256 double-hash), getMe, token helper functions
│   └── admin.ts              # Admin service: user CRUD + question CRUD
├── components/
│   └── ApiUrlModal/          # Global modal (keyboard-triggered: press O→D→M) to override API base URL at runtime
└── pages/
    ├── Login/                # Login page (no global layout)
    ├── 403/                  # Forbidden page (no layout)
    └── UserManage/           # User management (ProTable CRUD: search, create, edit, ban, disable, delete)
    └── RegisterQuestions/    # Registration question management (ProTable CRUD: search, create, edit, delete, batch operations)
```

### Key flows

**Authentication**: Login sends SHA256 double-hashed password (`sha256(sha256(password))`) as JSON to `POST /api/v1/auth/login`. The JWT is stored in localStorage under `tinder_token`. `app.ts` runs `getInitialState()` at startup — if a token exists, it calls `GET /api/v1/users/me` to hydrate the current user. On 401, the token is cleared and user is redirected to `/login`.

**Layout & routing**: Routes are defined in `.umirc.ts` using Umi's path-to-component mapping (e.g. `component: './UserManage'` → `pages/UserManage/index.tsx`). Login and 403 pages opt out of the global layout (`layout: false`). All other routes are nested under `ant-design-pro-layout` which provides the sidebar menu and header. `onPageChange` redirects unauthenticated users to `/login` (preserving the redirect path) and non-admin users (`normal-user` role) to `/403`.

**User roles**: `superadmin`, `songlist_editor` — both can access the admin panel. `normal-user` gets 403. This is checked in `access.ts` via the `canAdmin` permission.

**API base URL resolution**: `getApiUrl()` in `utils/apiUrl.ts` checks localStorage key `tinder_api_url` first (runtime override), falls back to build-time env var `TINDER_API_URL` (injected via Umi's `define` in `.umirc.ts`). The runtime override can be set via a hidden keyboard-triggered modal (press O → D → M in sequence while not in an input), implemented in `components/ApiUrlModal`.

**API error handling**: All `admin.ts` service functions parse `err.detail` from the response JSON and throw it as the error message. The backend typically returns Pydantic-style validation errors (`{ "detail": "...validation error..." }` or `{ "detail": [{ "msg": "...", "loc": [...], ... }] }`). The frontend code catches these in `message.error(err.message)`. When the backend returns a list under `detail`, the current code only shows `err.message` which becomes `[object Object]` — this is a known rough edge.

### Page patterns

Both `UserManage` and `RegisterQuestions` follow the same ProTable CRUD pattern:

1. **Stats cards** row at top (fetched from dedicated stats endpoint)
2. **ProTable** with search filters (keyword, type, status) and pagination
3. **Row selection** for batch operations (batch delete, batch status toggle) via FooterToolbar
4. **Detail drawer** (Descriptions component) triggered by "详情" link
5. **Create/Edit modal** (Modal + Form) with `destroyOnClose`
6. **Single delete** via confirmation modal

### Build / env config

- Umi config in `.umirc.ts`
- ESLint + Stylelint via `@umijs/max` (no standalone config files — Umi manages these internally)
- Prettier config in `.prettierrc` (single quotes, trailing commas, organize-imports plugin)
- `process.env.TINDER_API_URL` injected via Umi's `define` at build time
- Mock API data in `mock/userAPI.ts` (served by Umi dev server)
