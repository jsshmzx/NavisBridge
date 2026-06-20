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
export async function deleteUser(userUuid: string): Promise<void> {
  const res = await fetch(`${getApiUrl()}/api/v1/admin/users/${userUuid}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('删除用户失败');
}

/** 批量删除用户 */
export async function batchDeleteUsers(
  userUuids: string[],
): Promise<{ deleted: number }> {
  const res = await fetch(`${getApiUrl()}/api/v1/admin/users/batch`, {
    method: 'DELETE',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ uuids: userUuids }),
  });
  if (!res.ok) throw new Error('批量删除用户失败');
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
