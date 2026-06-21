/** localStorage 中存储运行时 API 地址的键名 */
const STORAGE_KEY = 'tinder_api_url';

/** 运行时通过 env.js 注入的 API 地址 */
const RUNTIME_URL: string =
  (typeof window !== 'undefined' && (window as any).__TINDER_API_URL__) || '';

/**
 * 获取当前生效的 Tinder API 地址。
 * 优先级：运行时（localStorage）> 运行时（env.js）> 空字符串
 */
export function getApiUrl(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || RUNTIME_URL || '';
  } catch {
    // localStorage 不可用（如 SSR / 隐私模式阻止）时退回到运行时地址
    return RUNTIME_URL || '';
  }
}

/**
 * 设置运行时 API 地址，写入 localStorage。
 * 传入空字符串时清除运行时覆盖，退回到 env.js 中的值。
 */
export function setApiUrl(url: string): void {
  try {
    if (url) {
      localStorage.setItem(STORAGE_KEY, url);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // localStorage 写入失败时静默忽略
  }
}

/** 获取构建时/运行时注入的 API 地址（不含 localStorage 覆盖）。 */
export function getBuildApiUrl(): string {
  return RUNTIME_URL;
}
