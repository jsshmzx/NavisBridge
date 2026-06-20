import { getApiUrl } from '@/utils/apiUrl';

/** localStorage 中存储 JWT token 的键名 */
const TOKEN_KEY = 'tinder_token';

// ─── Token 工具 ─────────────────────────────────────────────────────────────

/** 读取本地存储的 JWT token。 */
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** 将 JWT token 写入本地存储。 */
export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // 写入失败时静默忽略
  }
}

/** 从本地存储中清除 JWT token。 */
export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // 清除失败时静默忽略
  }
}

// ─── API 调用 ────────────────────────────────────────────────────────────────

/** 使用 Web Crypto API 计算 SHA256 hex 字符串。 */
async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 用户登录。
 * 调用 POST /api/v1/auth/login（JSON 格式）。
 * 成功时返回 access_token，失败时抛出错误。
 */
export async function login(
  username: string,
  password: string,
): Promise<string> {
  // SHA256 双重哈希后发送，与后端 core/security/password.py 约定一致
  const hashedPassword = await sha256Hex(await sha256Hex(password));

  const res = await fetch(`${getApiUrl()}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password: hashedPassword }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any)?.detail || '登录失败，请检查用户名和密码');
  }

  const data: API.LoginResponse = await res.json();
  return data.access_token;
}

/**
 * 获取当前登录用户信息。
 * 调用 GET /api/v1/users/me，需要有效 token。
 * token 过期或无效时清除本地 token 并抛出错误。
 */
export async function getMe(): Promise<API.CurrentUser> {
  const token = getToken();
  if (!token) throw new Error('未登录');

  const res = await fetch(`${getApiUrl()}/api/v1/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    // token 无效或已过期，清除本地缓存
    clearToken();
    throw new Error('登录已过期，请重新登录');
  }

  if (!res.ok) throw new Error('获取用户信息失败');

  return res.json() as Promise<API.CurrentUser>;
}
