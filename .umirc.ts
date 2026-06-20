import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: 'NavisBridge',
  },
  // 将构建时环境变量 TINDER_API_URL 注入到前端代码中
  define: {
    'process.env.TINDER_API_URL': process.env.TINDER_API_URL || '',
  },
  routes: [
    // 登录页：不使用全局 layout
    {
      path: '/login',
      component: './Login',
      layout: false,
    },
    // 403 无权限页：不使用全局 layout
    {
      path: '/403',
      component: './403',
      layout: false,
    },
    {
      path: '/',
      redirect: '/user-manage',
    },
    {
      name: '用户管理',
      path: '/user-manage',
      component: './UserManage',
    },
  ],
  npmClient: 'pnpm',
});
