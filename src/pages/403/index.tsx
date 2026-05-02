import { history } from '@umijs/max';
import { Button, Result } from 'antd';
import React from 'react';

/** 403 无权限页面 */
const ForbiddenPage: React.FC = () => (
  <Result
    status="403"
    title="403"
    subTitle="您没有权限访问该页面。"
    extra={
      <Button type="primary" onClick={() => history.push('/')}>
        返回首页
      </Button>
    }
  />
);

export default ForbiddenPage;
