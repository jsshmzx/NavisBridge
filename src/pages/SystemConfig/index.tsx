import { getSystemConfig } from '@/services/admin';
import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Collapse,
  Descriptions,
  Input,
  message,
  Modal,
  Space,
  Tag,
  Typography,
} from 'antd';
import React, { useCallback, useState } from 'react';

/** 敏感配置项 key — 与后端 _SENSITIVE_KEYS 保持一致 */
const SENSITIVE_KEYS = new Set([
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET_KEY',
  'SUPER_PASSWORD',
]);

/** 布尔值的中文映射 */
const BOOL_LABELS: Record<string, string> = {
  true: '是',
  false: '否',
};

/** 格式化配置值为可读字符串 */
function formatValue(
  key: string,
  value: string | number | boolean | null,
): string {
  if (value === null || value === undefined || value === '') {
    return '（未设置）';
  }
  if (SENSITIVE_KEYS.has(key)) {
    return String(value); // 已经被后端替换为 ******
  }
  if (typeof value === 'boolean') {
    return BOOL_LABELS[String(value)] ?? String(value);
  }
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  return String(value);
}

const SystemConfig: React.FC = () => {
  const [passwordModalOpen, setPasswordModalOpen] = useState(true);
  const [superPassword, setSuperPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [configData, setConfigData] = useState<API.SystemConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetchConfig = useCallback(async () => {
    if (!superPassword.trim()) {
      message.warning('请输入超级密码');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getSystemConfig(superPassword.trim());
      setConfigData(data);
      setPasswordModalOpen(false);
    } catch (err: any) {
      setError(err.message || '验证失败');
      message.error(err.message || '超级密码错误');
    } finally {
      setLoading(false);
    }
  }, [superPassword]);

  const handleCancel = useCallback(() => {
    setPasswordModalOpen(false);
    if (!configData) {
      window.history.back();
    }
  }, [configData]);

  const handleReEnterPassword = useCallback(() => {
    setSuperPassword('');
    setPasswordModalOpen(true);
  }, []);

  return (
    <PageContainer
      title="系统配置"
      subTitle="只读查看当前系统运行配置"
      extra={
        configData
          ? [
              <Button key="refresh" onClick={handleReEnterPassword}>
                重新验证
              </Button>,
            ]
          : undefined
      }
    >
      {/* 超管密码输入弹窗 */}
      <Modal
        title="查看系统配置"
        open={passwordModalOpen}
        onOk={handleFetchConfig}
        onCancel={handleCancel}
        okText="确认查看"
        cancelText={configData ? '关闭' : '取消'}
        confirmLoading={loading}
        width={420}
        maskClosable={false}
      >
        <p style={{ marginBottom: 16 }}>
          请输入超级密码以查看系统配置。敏感字段（数据库连接串、密钥等）将用星号屏蔽。
        </p>
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Input.Password
          placeholder="请输入超级密码"
          value={superPassword}
          onChange={(e) => setSuperPassword(e.target.value)}
          onPressEnter={handleFetchConfig}
          autoFocus
        />
      </Modal>

      {/* 配置展示区域 */}
      {configData && (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Alert
            message="以下为系统当前运行配置，所有值均为只读。敏感字段已用星号屏蔽。"
            type="info"
            showIcon
          />
          <Collapse
            defaultActiveKey={configData.groups.map((_, i) => String(i))}
            items={configData.groups.map((group, index) => ({
              key: String(index),
              label: (
                <span>
                  <strong>{group.group}</strong>
                  <Tag
                    color="blue"
                    style={{ marginLeft: 8 }}
                  >
                    {group.items.length} 项
                  </Tag>
                </span>
              ),
              children: (
                <Descriptions
                  bordered
                  column={1}
                  size="small"
                  labelStyle={{ width: 320, fontWeight: 500 }}
                >
                  {group.items.map((item) => (
                    <Descriptions.Item key={item.key} label={item.description}>
                      <Space>
                        <Typography.Text
                          code
                          copyable={
                            !SENSITIVE_KEYS.has(item.key) &&
                            item.value !== null &&
                            item.value !== ''
                          }
                        >
                          {formatValue(item.key, item.value)}
                        </Typography.Text>
                        {SENSITIVE_KEYS.has(item.key) && (
                          <Tag color="red">敏感</Tag>
                        )}
                      </Space>
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              ),
            }))}
          />
        </Space>
      )}
    </PageContainer>
  );
};

export default SystemConfig;
