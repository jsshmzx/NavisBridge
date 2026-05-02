/** 允许进入后台的角色列表（superadmin 和 songlist_editor） */
const ADMIN_ROLES: API.UserRole[] = ['superadmin', 'songlist_editor'];

export default (initialState: API.CurrentUser | null | undefined) => {
  // canAdmin: 已登录且角色为 superadmin 或 songlist_editor 时为 true
  const canAdmin = !!(
    initialState?.role && ADMIN_ROLES.includes(initialState.role)
  );
  return { canAdmin };
};
