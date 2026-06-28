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
    {
      name: '注册问题管理',
      path: '/register-questions',
      component: './RegisterQuestions',
    },
    {
      name: '系统配置',
      path: '/system-config',
      component: './SystemConfig',
    },
  ],
  npmClient: 'pnpm',
});
