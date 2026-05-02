import { getBuildApiUrl, getApiUrl, setApiUrl } from '@/utils/apiUrl';
import { Alert, Button, Form, Input, Modal, Space } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';

/** 触发弹窗的键序列（依次按下 O → D → M）。 */
const TRIGGER_SEQUENCE = ['o', 'd', 'm'];

/** 键序列检测的超时时长（毫秒）：超时后重新开始检测。 */
const SEQUENCE_TIMEOUT_MS = 2000;

/**
 * ApiUrlModal
 *
 * 全局挂载的组件，负责两件事：
 * 1. 监听全局键盘事件，检测 O→D→M 序列，匹配后弹出修改弹窗。
 * 2. 提供弹窗 UI，允许用户在运行时覆盖 API 地址（优先级高于构建时环境变量）。
 */
const ApiUrlModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<{ apiUrl: string }>();

  // 已匹配的键序列缓冲区（用 ref 避免在事件监听器闭包中捕获旧 state）
  const keyBuffer = useRef<string[]>([]);
  // 序列超时定时器
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** 重置键序列缓冲区并清除超时定时器。 */
  const resetBuffer = useCallback(() => {
    keyBuffer.current = [];
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /** 全局 keydown 处理函数：检测 O→D→M 序列。 */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // 在输入框等可编辑元素内不触发（避免误触）
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const expectedKey = TRIGGER_SEQUENCE[keyBuffer.current.length];

      if (key === expectedKey) {
        keyBuffer.current.push(key);

        // 重置超时（每次成功匹配后重新计时）
        if (timerRef.current !== null) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(resetBuffer, SEQUENCE_TIMEOUT_MS);

        // 序列完整：打开弹窗
        if (keyBuffer.current.length === TRIGGER_SEQUENCE.length) {
          resetBuffer();
          setOpen(true);
        }
      } else {
        // 当前键不在序列中；若与序列首字符匹配，则从头开始
        resetBuffer();
        if (key === TRIGGER_SEQUENCE[0]) {
          keyBuffer.current.push(key);
          timerRef.current = setTimeout(resetBuffer, SEQUENCE_TIMEOUT_MS);
        }
      }
    },
    [resetBuffer],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      resetBuffer();
    };
  }, [handleKeyDown, resetBuffer]);

  /** 弹窗打开时将当前 API 地址填入表单。 */
  useEffect(() => {
    if (open) {
      form.setFieldsValue({ apiUrl: getApiUrl() });
    }
  }, [open, form]);

  /** 保存新 API 地址，提示用户刷新页面。 */
  const handleSave = async () => {
    const { apiUrl } = await form.validateFields();
    setApiUrl(apiUrl.trim());
    setOpen(false);
    Modal.confirm({
      title: 'API 地址已更新',
      content: '需要刷新页面才能使新地址生效，是否立即刷新？',
      okText: '立即刷新',
      cancelText: '稍后手动刷新',
      onOk: () => window.location.reload(),
    });
  };

  /** 重置为构建时默认地址。 */
  const handleReset = () => {
    setApiUrl('');
    form.setFieldsValue({ apiUrl: getBuildApiUrl() });
  };

  return (
    <Modal
      title="修改 API 地址"
      open={open}
      onCancel={() => setOpen(false)}
      destroyOnClose
      footer={
        <Space>
          <Button onClick={handleReset}>重置为默认</Button>
          <Button onClick={() => setOpen(false)}>取消</Button>
          <Button type="primary" onClick={handleSave}>
            保存
          </Button>
        </Space>
      }
    >
      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        message={`构建时地址：${getBuildApiUrl() || '（未设置）'}`}
        description="运行时设置的地址优先级高于构建时环境变量，保存后刷新页面生效。"
      />
      <Form form={form} layout="vertical">
        <Form.Item
          name="apiUrl"
          label="API 地址"
          rules={[
            { required: true, message: '请输入 API 地址' },
            { type: 'url', message: '请输入合法的 URL（含协议，如 https://）' },
          ]}
        >
          <Input placeholder="https://tinder.dev" allowClear />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ApiUrlModal;
