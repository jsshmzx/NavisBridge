# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Start dev server (hot reload)
pnpm build            # Production build
pnpm lint             # Lint (via `max lint`)
pnpm format           # Auto-format with Prettier
pnpm start            # Alias for `pnpm dev`
pnpm setup            # Run after initial clone / deps install
```

- Lint-staged runs on `git commit` via Husky: ESLint + Prettier on staged files.
- There are no tests configured (no test runner in deps).
- Set env `TINDER_API_URL` at build time to target a specific backend server.
- Registry is configured to `https://registry.npmmirror.com/` in `.npmrc`.

## Architecture

This is a **React SPA admin panel** built with **UmiJS 4** (`@umijs/max` — the full-featured Umi distribution). It manages users for a service called "Tinder" (the backend API, not the dating app).

### Tech stack

- **Framework**: UmiJS 4 (`@umijs/max`) — provides routing, build, lint, plugins
- **UI**: Ant Design 5 + `@ant-design/pro-components`
- **Language**: TypeScript (TSX)
- **Package manager**: pnpm (lockfile: `pnpm-lock.yaml`)
- **Auth**: JWT (Bearer token in localStorage under key `tinder_token`)
- **API client**: Raw `fetch` (no Axios/umi-request abstraction)
- **State**: Umi model plugin (`@/models/global.ts`) + `initialState`

### Project layout

```
src/
├── app.ts              # Runtime config: initial state, layout hooks, request interceptors
├── access.ts           # Permission definition (canAdmin based on user_role)
├── constants/          # Shared constants
├── utils/
│   ├── apiUrl.ts       # Runtime API URL management (localStorage override)
│   └── format.ts       # Format helpers
├── typings/tinder.d.ts # API namespace types (UserRole, CurrentUser, AdminUser, etc.)
├── models/global.ts    # Umi model (global shared state via `useModel`)
├── services/
│   ├── tinder.ts       # Auth service: login, getMe, token helpers
│   └── admin.ts        # Admin service: user CRUD, ban/unban/enable/disable
├── components/
│   ├── Guide/          # Boilerplate guide component
│   └── ApiUrlModal/    # Global modal (triggered by O→D→M keys) to override API base URL
└── pages/
    ├── Login/          # Login page (no global layout)
    ├── Home/           # Dashboard dashboard
    ├── Access/         # Permission demo page
    ├── Table/          # CRUD demo table
    ├── UserManage/     # User management page (search, create, edit, ban, delete)
    └── 403/            # Forbidden page (no layout)
```

### Key flows

**Authentication**: Login sends SHA256 double-hashed password (`sha256(sha256(password))`) as JSON to `POST /api/v1/auth/login`. On success, the JWT is stored in localStorage. `app.ts` runs `getInitialState()` at startup — if a token exists, it calls `GET /api/v1/users/me` to hydrate the current user. The layout's `onPageChange` redirects unauthenticated users to `/login` (preserving the redirect path) and non-admin users to `/403`.

**API requests**: All service calls use raw `fetch` with the base URL from `getApiUrl()`. The request interceptor in `app.ts` injects `Authorization: Bearer <token>`. The API base URL can be overridden at runtime via a hidden keyboard-triggered modal (press O → D → M in sequence).

**User roles**: Three roles — `superadmin`, `songlist_editor` (both can access the admin panel), `normal-user` (gets 403).

**Routing**: Routes are defined in `.umirc.ts` using Umi's file-path component convention (e.g. `component: './Login'` maps to `pages/Login/index.tsx`). The login and 403 pages opt out of the global layout (`layout: false`).

### Build / env config

- Umi config in `.umirc.ts`
- ESLint via `@umijs/max/eslint`
- Stylelint via `@umijs/max/stylelint`
- Prettier config in `.prettierrc` (single quotes, trailing commas, organize-imports plugin)
- `process.env.TINDER_API_URL` is injected at build time via Umi's `define` — falls back to runtime localStorage override at `tinder_api_url` key
- Mock API data in `mock/userAPI.ts` (served by Umi dev server)
