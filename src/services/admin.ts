import { getApiUrl } from '@/utils/apiUrl';
import { getToken } from './tinder';

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** 搜索用户列表 */
export async function searchUsers(params: {
  limit?: number;
  offset?: number;
  keyword?: string;
  status?: string;
  role?: string;
}): Promise<API.AdminUser[]> {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.offset !== undefined) query.set('offset', String(params.offset));
  if (params.keyword) query.set('keyword', params.keyword);
  if (params.status) query.set('status', params.status);
  if (params.role) query.set('role', params.role);

  const res = await fetch(
    `${getApiUrl()}/api/v1/admin/users?${query.toString()}`,
    {
      headers: authHeaders(),
    },
  );
  if (!res.ok) throw new Error('获取用户列表失败');
  return res.json();
}

/** 获取用户总数 */
export async function getUsersTotal(params?: {
  keyword?: string;
  status?: string;
  role?: string;
}): Promise<API.TotalResponse> {
  const query = new URLSearchParams();
  if (params?.keyword) query.set('keyword', params.keyword);
  if (params?.status) query.set('status', params.status);
  if (params?.role) query.set('role', params.role);

  const res = await fetch(
    `${getApiUrl()}/api/v1/admin/users/total?${query.toString()}`,
    {
      headers: authHeaders(),
    },
  );
  if (!res.ok) throw new Error('获取用户总数失败');
  return res.json();
}

/** 获取用户统计 */
export async function getUserStats(): Promise<API.UserStats> {
  const res = await fetch(`${getApiUrl()}/api/v1/admin/users/stats`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('获取用户统计失败');
  return res.json();
}

/** 创建用户 */
export async function createUser(
  data: Record<string, unknown>,
): Promise<API.AdminUser> {
  const res = await fetch(`${getApiUrl()}/api/v1/admin/users`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('创建用户失败');
  return res.json();
}

/** 更新用户 */
export async function updateUser(
  userUuid: string,
  data: Record<string, unknown>,
): Promise<API.AdminUser> {
  const res = await fetch(`${getApiUrl()}/api/v1/admin/users/${userUuid}`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('更新用户失败');
  return res.json();
}

/** 删除用户 */
export async function deleteUser(
  userUuid: string,
  superPassword: string,
): Promise<void> {
  const res = await fetch(`${getApiUrl()}/api/v1/admin/users/${userUuid}`, {
    method: 'DELETE',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ super_password: superPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || '删除用户失败');
  }
}

/** 批量删除用户 */
export async function batchDeleteUsers(
  userUuids: string[],
  superPassword: string,
): Promise<{ deleted: number }> {
  const res = await fetch(`${getApiUrl()}/api/v1/admin/users/batch`, {
    method: 'DELETE',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ uuids: userUuids, super_password: superPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || '批量删除用户失败');
  }
  return res.json();
}

/** 批量更新用户 */
export async function batchUpdateUsers(
  userUuids: string[],
  data: Record<string, unknown>,
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  await Promise.all(
    userUuids.map(async (uuid) => {
      try {
        await updateUser(uuid, data);
        success++;
      } catch {
        failed++;
      }
    }),
  );
  return { success, failed };
}

/** 封禁用户 */
export async function banUser(userUuid: string): Promise<void> {
  const res = await fetch(`${getApiUrl()}/api/v1/admin/users/${userUuid}/ban`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('封禁用户失败');
}

/** 解封用户 */
export async function unbanUser(userUuid: string): Promise<void> {
  const res = await fetch(
    `${getApiUrl()}/api/v1/admin/users/${userUuid}/unban`,
    {
      method: 'POST',
      headers: authHeaders(),
    },
  );
  if (!res.ok) throw new Error('解封用户失败');
}

/** 禁用用户 */
export async function disableUser(userUuid: string): Promise<void> {
  const res = await fetch(
    `${getApiUrl()}/api/v1/admin/users/${userUuid}/disable`,
    {
      method: 'POST',
      headers: authHeaders(),
    },
  );
  if (!res.ok) throw new Error('禁用用户失败');
}

/** 启用用户 */
export async function enableUser(userUuid: string): Promise<void> {
  const res = await fetch(
    `${getApiUrl()}/api/v1/admin/users/${userUuid}/enable`,
    {
      method: 'POST',
      headers: authHeaders(),
    },
  );
  if (!res.ok) throw new Error('启用用户失败');
}

/** 管理员重置用户密码 */
export async function resetPassword(
  userUuid: string,
  superPassword: string,
  newPassword: string,
): Promise<{ message: string }> {
  const res = await fetch(
    `${getApiUrl()}/api/v1/admin/users/${userUuid}/reset-password`,
    {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        super_password: superPassword,
        new_password: newPassword,
      }),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || '重置密码失败');
  }
  return res.json();
}

/** 查看用户敏感信息（真实姓名、班级） */
export async function getSensitiveData(
  superPassword: string,
  uuids: string[],
): Promise<API.SensitiveDataMap> {
  const res = await fetch(`${getApiUrl()}/api/v1/admin/users/sensitive-data`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ super_password: superPassword, uuids }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || '获取敏感信息失败');
  }
  return res.json();
}

// ─── 注册问题管理 ───────────────────────────────────────────────────────

/** 搜索题目列表 */
export async function searchQuestions(params: {
  limit?: number;
  offset?: number;
  keyword?: string;
  type?: string;
  status?: string;
}): Promise<API.RegisterQuestion[]> {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.offset !== undefined) query.set('offset', String(params.offset));
  if (params.keyword) query.set('keyword', params.keyword);
  if (params.type) query.set('type', params.type);
  if (params.status) query.set('status', params.status);
  const res = await fetch(
    `${getApiUrl()}/api/v1/admin/questions?${query.toString()}`,
    { headers: authHeaders() },
  );
  if (!res.ok) throw new Error('获取题目列表失败');
  return res.json();
}

/** 获取题目总数 */
export async function getQuestionsTotal(params?: {
  keyword?: string;
  type?: string;
  status?: string;
}): Promise<API.TotalResponse> {
  const query = new URLSearchParams();
  if (params?.keyword) query.set('keyword', params.keyword);
  if (params?.type) query.set('type', params.type);
  if (params?.status) query.set('status', params.status);
  const res = await fetch(
    `${getApiUrl()}/api/v1/admin/questions/total?${query.toString()}`,
    { headers: authHeaders() },
  );
  if (!res.ok) throw new Error('获取题目总数失败');
  return res.json();
}

/** 获取题目统计 */
export async function getQuestionStats(): Promise<API.QuestionStats> {
  const res = await fetch(`${getApiUrl()}/api/v1/admin/questions/stats`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('获取题目统计失败');
  return res.json();
}

/** 创建题目 */
export async function createQuestion(
  data: Record<string, unknown>,
): Promise<API.RegisterQuestion> {
  const res = await fetch(`${getApiUrl()}/api/v1/admin/questions`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || '创建题目失败');
  }
  return res.json();
}

/** 编辑题目 */
export async function updateQuestion(
  questionUuid: string,
  data: Record<string, unknown>,
): Promise<API.RegisterQuestion> {
  const res = await fetch(
    `${getApiUrl()}/api/v1/admin/questions/${questionUuid}`,
    {
      method: 'PATCH',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || '更新题目失败');
  }
  return res.json();
}

/** 删除单题 */
export async function deleteQuestion(questionUuid: string): Promise<void> {
  const res = await fetch(
    `${getApiUrl()}/api/v1/admin/questions/${questionUuid}`,
    { method: 'DELETE', headers: authHeaders() },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || '删除题目失败');
  }
}

/** 批量删除题目 */
export async function batchDeleteQuestions(
  uuids: string[],
): Promise<{ deleted: number }> {
  const res = await fetch(
    `${getApiUrl()}/api/v1/admin/questions/batch-delete`,
    {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ uuids }),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || '批量删除失败');
  }
  return res.json();
}

/** 批量切换题目状态 */
export async function batchUpdateQuestionStatus(
  uuids: string[],
  status: string,
): Promise<{ updated: number }> {
  const res = await fetch(
    `${getApiUrl()}/api/v1/admin/questions/batch-status`,
    {
      method: 'PATCH',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ uuids, status }),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || '批量状态更新失败');
  }
  return res.json();
}

/** 单题切换状态 */
export async function updateQuestionStatus(
  questionUuid: string,
  status: string,
): Promise<API.RegisterQuestion> {
  const res = await fetch(
    `${getApiUrl()}/api/v1/admin/questions/${questionUuid}/status`,
    {
      method: 'PATCH',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || '状态更新失败');
  }
  return res.json();
}

// ─── 系统配置 ──────────────────────────────────────────────────────────

/** 查看系统配置（需要超级密码） */
export async function getSystemConfig(
  superPassword: string,
): Promise<API.SystemConfig> {
  const res = await fetch(`${getApiUrl()}/api/v1/admin/config`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ super_password: superPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || '获取系统配置失败');
  }
  return res.json();
}
