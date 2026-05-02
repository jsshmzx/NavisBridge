import ApiUrlModal from '@/components/ApiUrlModal';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { history, useModel } from '@umijs/max';
import { message } from 'antd';
import React from 'react';
import { login, setToken } from '@/services/tinder';
import styles from './index.less';

const LoginPage: React.FC = () => {
  // 登录成功后刷新 initialState，触发权限重新计算
  const { refresh } = useModel('@@initialState');

  const handleLogin = async (values: {
    username: string;
    password: string;
  }) => {
    try {
      const token = await login(values.username, values.password);
      setToken(token);
      // 刷新用户信息（initialState），layout 的 onPageChange 会据此决定跳转
      await refresh();
      message.success('登录成功');
      // 跳转到 redirect 参数指定的页面，或默认首页
      const { search } = history.location;
      const params = new URLSearchParams(search);
      history.push(params.get('redirect') || '/');
    } catch (err: any) {
      message.error(err?.message || '登录失败');
    }
  };

  return (
    <div className={styles.container}>
      {/* 在登录页也挂载 ApiUrlModal，使其键盘监听在登录页同样生效 */}
      <ApiUrlModal />
      <LoginForm
        title="NavisBridge"
        subTitle="管理后台"
        onFinish={handleLogin}
      >
        <ProFormText
          name="username"
          fieldProps={{ prefix: <UserOutlined /> }}
          placeholder="用户名"
          rules={[{ required: true, message: '请输入用户名' }]}
        />
        <ProFormText.Password
          name="password"
          fieldProps={{ prefix: <LockOutlined /> }}
          placeholder="密码"
          rules={[{ required: true, message: '请输入密码' }]}
        />
      </LoginForm>
    </div>
  );
};

export default LoginPage;
