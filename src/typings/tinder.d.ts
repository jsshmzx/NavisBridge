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

  /** 注册问题列表项 */
  interface RegisterQuestion {
    id: number;
    uuid: string;
    question: string;
    question_type: 'choice' | 'true_false' | 'fill_blank';
    answer: string;
    options: string[] | null;
    question_level: string | null;
    current_status: string | null;
    created_by: string | null;
    created_at: string | null;
  }

  /** 注册问题统计 */
  interface QuestionStats {
    total: number;
    choice: number;
    true_false: number;
    fill_blank: number;
  }

  /** 敏感信息映射：uuid → { real_name, class } */
  interface SensitiveDataMap {
    data: Record<string, { real_name: string | null; class: string | null }>;
  }

  /** 系统配置项 */
  interface ConfigItem {
    key: string;
    value: string | number | boolean | null;
    description: string;
  }

  /** 系统配置分组 */
  interface ConfigGroup {
    group: string;
    items: ConfigItem[];
  }

  /** 系统配置查询响应 */
  interface SystemConfig {
    groups: ConfigGroup[];
  }

  /** 日志类型：系统日志 / 个人日志 */
  type LogKind = 'system' | 'personal';

  /** 日志严重程度 */
  type LogSeverity = 'INFO' | 'WARN' | 'ERROR';

  /** 日志结果状态 */
  type LogStatus = 'SUCCESS' | 'FAIL' | 'PARTIAL';

  /** 日志基础字段 */
  interface BaseLog {
    uuid: string;
    log_level: string;
    log_type: string | null;
    event_type: string | null;
    status: LogStatus | null;
    severity: LogSeverity | null;
    content: string | null;
    client_ip: string | null;
    request_method: string | null;
    request_url: string | null;
    user_agent: string | null;
    trace_id: string | null;
    extra_data: Record<string, unknown> | null;
    created_at: string | null;
  }

  /** 系统日志 */
  interface SystemLog extends BaseLog {
    service_name: string | null;
  }

  /** 个人日志 */
  interface PersonalLog extends BaseLog {
    user_uuid: string | null;
    target_type: string | null;
    target_id: string | null;
    target_name: string | null;
    before_data: Record<string, unknown> | null;
    after_data: Record<string, unknown> | null;
  }

  /** 日志分页查询响应 */
  interface PaginatedLogs<T = BaseLog> {
    total: number;
    items: T[];
  }

  /** 日志查询参数 */
  interface LogSearchParams {
    event_type?: string;
    log_type?: string;
    status?: string;
    severity?: string;
    trace_id?: string;
    client_ip?: string;
    keyword?: string;
    start_time?: string;
    end_time?: string;
    user_uuid?: string;
    target_type?: string;
    target_id?: string;
    limit?: number;
    offset?: number;
  }
}
