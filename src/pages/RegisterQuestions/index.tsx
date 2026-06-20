import {
  batchDeleteQuestions,
  batchUpdateQuestionStatus,
  createQuestion,
  deleteQuestion,
  getQuestionStats,
  getQuestionsTotal,
  searchQuestions,
  updateQuestion,
  updateQuestionStatus,
} from '@/services/admin';
import {
  ActionType,
  FooterToolbar,
  PageContainer,
  ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import {
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Form,
  Input,
  message,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Statistic,
  Tag,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';

const QUESTION_TYPE_LABELS: Record<string, string> = {
  choice: '选择题',
  true_false: '判断题',
  fill_blank: '填空题',
};

const QUESTION_TYPE_COLORS: Record<string, string> = {
  choice: 'blue',
  true_false: 'purple',
  fill_blank: 'cyan',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'green',
  inactive: 'default',
};

const STATUS_LABELS: Record<string, string> = {
  active: '启用',
  inactive: '禁用',
};

const LEVEL_LABELS: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

const RegisterQuestions: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [stats, setStats] = useState<API.QuestionStats | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<API.RegisterQuestion[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] =
    useState<API.RegisterQuestion | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] =
    useState<API.RegisterQuestion | null>(null);
  const [form] = Form.useForm();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [pendingDeleteUuid, setPendingDeleteUuid] = useState<string | null>(
    null,
  );
  const [batchStatusModalVisible, setBatchStatusModalVisible] = useState(false);
  const [batchStatusForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // 加载统计
  useEffect(() => {
    getQuestionStats()
      .then(setStats)
      .catch(() => {});
  }, []);

  // Typed columns
  const columns: ProColumns<API.RegisterQuestion>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      search: false,
    },
    {
      title: '题目',
      dataIndex: 'question',
      width: 300,
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'question_type',
      width: 80,
      valueType: 'select',
      valueEnum: {
        choice: { text: '选择题', status: 'Processing' },
        true_false: { text: '判断题', status: 'Processing' },
        fill_blank: { text: '填空题', status: 'Processing' },
      },
      render: (_, record) => (
        <Tag color={QUESTION_TYPE_COLORS[record.question_type]}>
          {QUESTION_TYPE_LABELS[record.question_type] || record.question_type}
        </Tag>
      ),
    },
    {
      title: '难度',
      dataIndex: 'question_level',
      width: 80,
      search: false,
      render: (_, record) =>
        record.question_level ? (
          <Tag>
            {LEVEL_LABELS[record.question_level] || record.question_level}
          </Tag>
        ) : (
          '-'
        ),
    },
    {
      title: '状态',
      dataIndex: 'current_status',
      width: 80,
      valueType: 'select',
      valueEnum: {
        active: { text: '启用', status: 'Success' },
        inactive: { text: '禁用', status: 'Default' },
      },
      render: (_, record) => (
        <Badge
          status={
            (STATUS_COLORS[record.current_status || ''] || 'default') as
              | 'success'
              | 'default'
          }
          text={
            STATUS_LABELS[record.current_status || ''] ||
            record.current_status ||
            '未知'
          }
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 160,
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '操作',
      width: 160,
      key: 'option',
      valueType: 'option',
      render: (_, record) => [
        <a
          key="detail"
          onClick={() => {
            setSelectedQuestion(record);
            setDrawerOpen(true);
          }}
        >
          详情
        </a>,
        <a
          key="edit"
          onClick={() => {
            setEditingQuestion(record);
            form.setFieldsValue({
              question: record.question,
              question_type: record.question_type,
              question_level: record.question_level,
              answer: record.answer,
              options: record.options || [],
            });
            setModalOpen(true);
          }}
        >
          编辑
        </a>,
        <a
          key="delete"
          style={{ color: 'red' }}
          onClick={() => {
            setPendingDeleteUuid(record.uuid);
            setDeleteModalVisible(true);
          }}
        >
          删除
        </a>,
      ],
    },
  ];

  const showCreate = () => {
    setEditingQuestion(null);
    form.resetFields();
    form.setFieldsValue({ question_type: 'choice', options: ['', ''] });
    setModalOpen(true);
  };

  const refreshStats = () => {
    getQuestionStats()
      .then(setStats)
      .catch(() => {});
  };

  // Handle form submit for create/edit
  const handleFormSubmit = async () => {
    setSubmitting(true);
    try {
      const values = await form.validateFields();
      const payload: Record<string, unknown> = {
        question: values.question,
        question_type: values.question_type,
        answer: values.answer,
      };
      if (values.question_level) payload.question_level = values.question_level;
      if (values.question_type === 'choice' && values.options) {
        payload.options = values.options.filter((o: string) => o.trim() !== '');
      }
      if (editingQuestion) {
        await updateQuestion(editingQuestion.uuid, payload);
        message.success('更新成功');
      } else {
        await createQuestion(payload);
        message.success('创建成功');
      }
      setModalOpen(false);
      actionRef.current?.reload();
      refreshStats();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  // Single delete
  const handleDeleteConfirm = async () => {
    if (!pendingDeleteUuid) return;
    setDeleteSubmitting(true);
    try {
      await deleteQuestion(pendingDeleteUuid);
      message.success('删除成功');
      actionRef.current?.reload();
      refreshStats();
      setDrawerOpen(false);
    } catch (err: any) {
      message.error(err?.message || '删除失败');
    } finally {
      setDeleteModalVisible(false);
      setPendingDeleteUuid(null);
      setDeleteSubmitting(false);
    }
  };

  // Batch delete
  const handleBatchDelete = () => {
    Modal.confirm({
      title: '批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个题目吗？`,
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          const result = await batchDeleteQuestions(
            selectedRows.map((r) => r.uuid),
          );
          message.success(`已成功删除 ${result.deleted} 个题目`);
          setSelectedRowKeys([]);
          setSelectedRows([]);
          actionRef.current?.reload();
          refreshStats();
        } catch (err: any) {
          message.error(err?.message || '批量删除失败');
        }
      },
    });
  };

  // Batch status update
  const handleBatchStatus = async () => {
    setBatchSubmitting(true);
    try {
      const values = await batchStatusForm.validateFields();
      const result = await batchUpdateQuestionStatus(
        selectedRows.map((r) => r.uuid),
        values.status,
      );
      message.success(`已成功更新 ${result.updated} 个题目的状态`);
      setBatchStatusModalVisible(false);
      setSelectedRowKeys([]);
      setSelectedRows([]);
      batchStatusForm.resetFields();
      actionRef.current?.reload();
      refreshStats();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.message || '批量状态更新失败');
    } finally {
      setBatchSubmitting(false);
    }
  };

  // Toggle single status
  const handleToggleStatus = async (record: API.RegisterQuestion) => {
    const newStatus =
      record.current_status === 'active' ? 'inactive' : 'active';
    try {
      await updateQuestionStatus(record.uuid, newStatus);
      message.success(newStatus === 'active' ? '已启用' : '已禁用');
      actionRef.current?.reload();
      setDrawerOpen(false);
    } catch (err: any) {
      message.error(err?.message || '状态更新失败');
    }
  };

  // Watch question_type to show/hide options field
  const questionType = Form.useWatch('question_type', form);

  return (
    <PageContainer header={{ title: '注册问题管理' }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="总题目" value={stats?.total || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="选择题"
              value={stats?.choice || 0}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="判断题"
              value={stats?.true_false || 0}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="填空题"
              value={stats?.fill_blank || 0}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 题目列表 */}
      <ProTable<API.RegisterQuestion>
        actionRef={actionRef}
        rowKey="uuid"
        columns={columns}
        request={async (params) => {
          const { current, pageSize, ...rest } = params as any;
          const keyword = (rest.keyword as string) || undefined;
          const type = (rest.question_type as string) || undefined;
          const status = (rest.current_status as string) || undefined;
          const [data, totalRes] = await Promise.all([
            searchQuestions({
              limit: pageSize || 20,
              offset: ((current || 1) - 1) * (pageSize || 20),
              keyword,
              type,
              status,
            }),
            getQuestionsTotal({ keyword, type, status }),
          ]);
          return { data, success: true, total: totalRes.total };
        }}
        toolBarRender={() => [
          <Button key="create" type="primary" onClick={showCreate}>
            新建题目
          </Button>,
        ]}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
          optionRender: (searchConfig, props, dom) => [...dom.reverse()],
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          pageSizeOptions: [20, 50, 100, 200, 500],
        }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys, rows) => {
            setSelectedRowKeys(keys);
            setSelectedRows(rows);
          },
        }}
      />

      {/* 批量操作栏 */}
      {selectedRowKeys.length > 0 && (
        <FooterToolbar
          extra={
            <div>
              已选择 <a style={{ fontWeight: 600 }}>{selectedRowKeys.length}</a>{' '}
              个题目
            </div>
          }
        >
          <Button onClick={() => setBatchStatusModalVisible(true)}>
            批量切换状态
          </Button>
          <Button danger onClick={handleBatchDelete}>
            批量删除
          </Button>
        </FooterToolbar>
      )}

      {/* 详情抽屉 */}
      <Drawer
        width={560}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="题目详情"
      >
        {selectedQuestion && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="UUID">
                {selectedQuestion.uuid}
              </Descriptions.Item>
              <Descriptions.Item label="题目">
                {selectedQuestion.question}
              </Descriptions.Item>
              <Descriptions.Item label="类型">
                <Tag
                  color={QUESTION_TYPE_COLORS[selectedQuestion.question_type]}
                >
                  {QUESTION_TYPE_LABELS[selectedQuestion.question_type]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="难度">
                {selectedQuestion.question_level
                  ? LEVEL_LABELS[selectedQuestion.question_level] ||
                    selectedQuestion.question_level
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="正确答案">
                {selectedQuestion.answer}
              </Descriptions.Item>
              <Descriptions.Item label="选项">
                {selectedQuestion.options && selectedQuestion.options.length > 0
                  ? selectedQuestion.options.join(' / ')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Badge
                  status={
                    (STATUS_COLORS[selectedQuestion.current_status || ''] ||
                      'default') as any
                  }
                  text={
                    STATUS_LABELS[selectedQuestion.current_status || ''] ||
                    selectedQuestion.current_status ||
                    '未知'
                  }
                />
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {selectedQuestion.created_at || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建者">
                {selectedQuestion.created_by || '-'}
              </Descriptions.Item>
            </Descriptions>
            <Space style={{ marginTop: 16 }}>
              <Button
                type={
                  selectedQuestion.current_status === 'active'
                    ? 'default'
                    : 'primary'
                }
                onClick={() => handleToggleStatus(selectedQuestion)}
              >
                {selectedQuestion.current_status === 'active' ? '禁用' : '启用'}
              </Button>
            </Space>
          </>
        )}
      </Drawer>

      {/* 新建/编辑弹窗 */}
      <Modal
        title={editingQuestion ? '编辑题目' : '新建题目'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleFormSubmit}
        confirmLoading={submitting}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="题目内容"
            name="question"
            rules={[{ required: true, message: '请输入题目内容' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            label="题目类型"
            name="question_type"
            rules={[{ required: true, message: '请选择题目类型' }]}
          >
            <Select
              options={[
                { label: '选择题', value: 'choice' },
                { label: '判断题', value: 'true_false' },
                { label: '填空题', value: 'fill_blank' },
              ]}
            />
          </Form.Item>
          <Form.Item label="难度" name="question_level">
            <Select
              allowClear
              placeholder="请选择难度"
              options={[
                { label: '简单', value: 'easy' },
                { label: '中等', value: 'medium' },
                { label: '困难', value: 'hard' },
              ]}
            />
          </Form.Item>

          {/* 选择题选项区域 */}
          {questionType === 'choice' && (
            <Form.List name="options">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }, index) => (
                    <Row
                      key={key}
                      gutter={8}
                      align="middle"
                      style={{ marginBottom: 8 }}
                    >
                      <Col>
                        <Tag>{String.fromCharCode(65 + index)}</Tag>
                      </Col>
                      <Col flex="auto">
                        <Form.Item
                          {...restField}
                          name={name}
                          rules={[
                            { required: true, message: '请输入选项内容' },
                          ]}
                          noStyle
                        >
                          <Input
                            placeholder={`选项 ${String.fromCharCode(
                              65 + index,
                            )}`}
                          />
                        </Form.Item>
                      </Col>
                      <Col>
                        {fields.length > 2 && (
                          <Button
                            type="link"
                            danger
                            onClick={() => remove(name)}
                          >
                            删除
                          </Button>
                        )}
                      </Col>
                    </Row>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add('', fields.length)}
                      block
                    >
                      + 添加选项
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          )}

          {/* 正确答案 */}
          <Form.Item
            label="正确答案"
            rules={[{ required: true, message: '请输入正确答案' }]}
          >
            {questionType === 'choice' ? (
              // For choice, the answer is selected from options
              <>
                <Form.Item
                  noStyle
                  name="answer"
                  rules={[{ required: true, message: '请选择正确答案' }]}
                >
                  <Select placeholder="请选择正确答案">
                    {(() => {
                      const opts = form.getFieldValue('options') || [];
                      return opts
                        .filter((o: string) => o.trim() !== '')
                        .map((o: string, i: number) => (
                          <Select.Option key={o} value={o}>
                            {String.fromCharCode(65 + i)}. {o}
                          </Select.Option>
                        ));
                    })()}
                  </Select>
                </Form.Item>
              </>
            ) : questionType === 'true_false' ? (
              <Radio.Group>
                <Radio value="true">正确</Radio>
                <Radio value="false">错误</Radio>
              </Radio.Group>
            ) : (
              <Input placeholder="请输入正确答案" />
            )}
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量状态切换弹窗 */}
      <Modal
        title={`批量切换状态（已选 ${selectedRowKeys.length} 个题目）`}
        open={batchStatusModalVisible}
        onCancel={() => {
          setBatchStatusModalVisible(false);
          batchStatusForm.resetFields();
        }}
        onOk={handleBatchStatus}
        confirmLoading={batchSubmitting}
        width={400}
        destroyOnClose
      >
        <Form
          form={batchStatusForm}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="目标状态"
            name="status"
            rules={[{ required: true, message: '请选择目标状态' }]}
          >
            <Select
              options={[
                { label: '启用', value: 'active' },
                { label: '禁用', value: 'inactive' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal
        title="确认删除"
        open={deleteModalVisible}
        onCancel={() => {
          setDeleteModalVisible(false);
          setPendingDeleteUuid(null);
        }}
        onOk={handleDeleteConfirm}
        confirmLoading={deleteSubmitting}
        okText="确认删除"
        okType="danger"
        cancelText="取消"
        width={400}
      >
        <p>确定要删除这个题目吗？此操作不可恢复。</p>
      </Modal>
    </PageContainer>
  );
};

export default RegisterQuestions;
