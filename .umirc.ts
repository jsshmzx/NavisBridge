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
      redirect: '/home',
    },
    {
      name: '首页',
      path: '/home',
      component: './Home',
    },
    {
      name: '权限演示',
      path: '/access',
      component: './Access',
    },
    {
      name: 'CRUD 示例',
      path: '/table',
      component: './Table',
    },
  ],
  npmClient: 'pnpm',
});

