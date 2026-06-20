/**
 * Tinder 后端 API 相关类型声明。
 * 扩展全局 API 命名空间，与 src/services/demo/typings.d.ts 合并。
 */
declare namespace API {
  /** 用户角色 */
  type UserRole = 'superadmin' | 'songlist_editor' | 'normal-user';

  /** 用户状态 */
  type UserStatus = 'normal' | 'disabled' | 'banned' | 'pending_deletion';

  /** POST /api/v1/auth/login 响应体 */
  interface LoginResponse {
    access_token: string;
    refresh_token: string;
    token_type: 'bearer';
  }

  /** GET /api/v1/users/me 响应体（完整用户信息） */
  interface CurrentUser {
    uuid: string;
    username: string | null;
    email: string | null;
    avatar_url: string | null;
    nickname: string | null;
    real_name: string | null;
    class: string | null;
    class_type: string | null;
    joined_at: string | null;
    current_status: UserStatus | null;
    last_login_at: string | null;
    score: number | null;
    user_role: UserRole;
    title: string | null;
    invited_by: string | null;
    views: number | null;
    is_verified: boolean | null;
  }

  /** 用户管理列表项 */
  interface AdminUser {
    id: number;
    uuid: string;
    username: string | null;
    email: string | null;
    nickname: string | null;
    real_name: string | null;
    class: string | null;
    class_type: string | null;
    joined_at: string | null;
    current_status: string | null;
    last_login_at: string | null;
    score: number | null;
    user_role: UserRole;
    title: string | null;
    invited_by: string | null;
    views: number | null;
    is_verified: boolean | null;
    other_info: Record<string, unknown> | null;
    deletion_scheduled_at: string | null;
  }

  /** 用户统计信息 */
  interface UserStats {
    total: number;
    normal: number;
    disabled: number;
    banned: number;
    pending_deletion: number;
  }

  /** 用户总数查询响应 */
  interface TotalResponse {
    total: number;
  }
}
