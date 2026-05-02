// 运行时配置
import ApiUrlModal from '@/components/ApiUrlModal';
import { clearToken, getMe, getToken } from '@/services/tinder';
import { getApiUrl } from '@/utils/apiUrl';
import { history } from '@umijs/max';
import React from 'react';

/** 登录页路径 */
const LOGIN_PATH = '/login';
/** 403 无权限页路径 */
const FORBIDDEN_PATH = '/403';
/** 允许进入后台的角色 */
const ADMIN_ROLES: API.UserRole[] = ['superadmin', 'songlist_editor'];

/**
 * getInitialState
 *
 * 应用启动时执行，尝试用本地 token 获取当前用户信息。
 * 返回 CurrentUser 表示已登录；返回 null 表示未登录或 token 已失效。
 */
export async function getInitialState(): Promise<API.CurrentUser | null> {
  const token = getToken();
  if (!token) return null;

  try {
    return await getMe();
  } catch {
    // token 无效或网络错误，清除本地 token
    clearToken();
    return null;
  }
}

/**
 * layout 运行时配置
 *
 * - onPageChange：路由变化时检查登录态与权限，按需跳转。
 * - childrenRender：全局注入 ApiUrlModal（监听 O→D→M 键序列）。
 */
export const layout = ({
  initialState,
}: {
  initialState: API.CurrentUser | null;
}) => {
  return {
    logo: 'https://img.alicdn.com/tfs/TB1YHEpwUT1gK0jSZFhXXaAtVXa-28-27.svg',
    menu: { locale: false },

    onPageChange: () => {
      const { pathname } = history.location;

      // 登录页与 403 页不做重定向，防止循环
      if (pathname === LOGIN_PATH || pathname === FORBIDDEN_PATH) return;

      // 未登录：跳转到登录页，并记录原始路径以便登录后跳回
      if (!initialState) {
        history.push(
          `${LOGIN_PATH}?redirect=${encodeURIComponent(pathname)}`,
        );
        return;
      }

      // 已登录但无管理权限：跳转到 403 页
      if (!ADMIN_ROLES.includes(initialState.role)) {
        history.push(FORBIDDEN_PATH);
      }
    },

    // 通过 React.createElement 避免在 .ts 文件中使用 JSX 语法，
    // 同时将 ApiUrlModal 全局挂载（处理所有有 layout 的页面）。
    childrenRender: (children: React.ReactNode) =>
      React.createElement(
        React.Fragment,
        null,
        children,
        React.createElement(ApiUrlModal, null),
      ),
  };
};

/**
 * request 插件配置
 *
 * - baseURL：从 getApiUrl() 读取，优先使用 localStorage 运行时覆盖。
 * - requestInterceptors：在每个请求头中注入 Bearer token。
 */
export const request = {
  baseURL: getApiUrl(),
  requestInterceptors: [
    (config: Record<string, any>) => {
      const token = getToken();
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
      return config;
    },
  ],
};
