/** localStorage 中存储运行时 API 地址的键名 */
const STORAGE_KEY = 'tinder_api_url';

/**
 * 构建时通过环境变量注入的 API 地址。
 * 在 .umirc.ts 中通过 define: { 'process.env.TINDER_API_URL': ... } 注入。
 */
const BUILD_URL: string = process.env.TINDER_API_URL || '';

/**
 * 获取当前生效的 Tinder API 地址。
 * 优先级：运行时（localStorage）> 构建时环境变量。
 */
export function getApiUrl(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || BUILD_URL;
  } catch {
    // localStorage 不可用（如 SSR / 隐私模式阻止）时退回到构建时地址
    return BUILD_URL;
  }
}

/**
 * 设置运行时 API 地址，写入 localStorage。
 * 传入空字符串时清除运行时覆盖，退回到构建时环境变量。
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

/** 获取构建时注入的 API 地址（不含运行时覆盖）。 */
export function getBuildApiUrl(): string {
  return BUILD_URL;
}
