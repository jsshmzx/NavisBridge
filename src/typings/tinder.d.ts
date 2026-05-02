/**
 * Tinder 后端 API 相关类型声明。
 * 扩展全局 API 命名空间，与 src/services/demo/typings.d.ts 合并。
 */
declare namespace API {
  /** 用户角色 */
  type UserRole = 'superadmin' | 'songlist_editor' | 'normal-user';

  /** POST /api/v1/auth/login 响应体 */
  interface LoginResponse {
    access_token: string;
    token_type: 'bearer';
  }

  /** GET /api/v1/auth/me 响应体 */
  interface CurrentUser {
    uuid: string;
    real_name: string;
    role: UserRole;
  }
}
