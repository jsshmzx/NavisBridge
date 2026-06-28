import { getApiUrl } from '@/utils/apiUrl';
import { getToken } from './tinder';

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function buildQuery(params: API.LogSearchParams): URLSearchParams {
  const query = new URLSearchParams();
  (
    [
      'event_type',
      'log_type',
      'status',
      'severity',
      'trace_id',
      'client_ip',
      'keyword',
      'start_time',
      'end_time',
      'user_uuid',
      'target_type',
      'target_id',
      'limit',
      'offset',
    ] as const
  ).forEach((key) => {
    const value = params[key];
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  return query;
}

/** 查询系统日志（仅 superadmin 可访问） */
export async function searchSystemLogs(
  params: API.LogSearchParams = {},
): Promise<API.PaginatedLogs<API.SystemLog>> {
  const query = buildQuery(params);
  const res = await fetch(
    `${getApiUrl()}/api/v1/logs/system?${query.toString()}`,
    {
      headers: authHeaders(),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || '获取系统日志失败');
  }
  return res.json();
}

/** 查询个人日志 */
export async function searchPersonalLogs(
  params: API.LogSearchParams = {},
): Promise<API.PaginatedLogs<API.PersonalLog>> {
  const query = buildQuery(params);
  const res = await fetch(
    `${getApiUrl()}/api/v1/logs/personal?${query.toString()}`,
    {
      headers: authHeaders(),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || '获取个人日志失败');
  }
  return res.json();
}

/** 按用户 UUID 查询个人日志 */
export async function searchPersonalLogsByUser(
  userUuid: string,
  params: Omit<API.LogSearchParams, 'user_uuid'> = {},
): Promise<API.PaginatedLogs<API.PersonalLog>> {
  return searchPersonalLogs({ ...params, user_uuid: userUuid });
}
