import {
  ActionType,
  PageContainer,
  ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import {
  App,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Tag,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import {
  banUser,
  createUser,
  deleteUser,
  disableUser,
  enableUser,
  getUserStats,
  searchUsers,
  unbanUser,
  updateUser,
} from '@/services/admin';

/** 状态标签颜色 */
const STATUS_COLORS: Record<string, string> = {
  normal: 'green',
  disabled: 'orange',
  banned: 'red',
  pending_deletion: 'default',
};

const STATUS_LABELS: Record<string, string> = {
  normal: '正常',
  disabled: '已禁用',
  banned: '已封禁',
  pending_deletion: '待删除',
};

const ROLE_LABELS: Record<string, string> = {
  superadmin: '超级管理员',
  songlist_editor: '歌单编辑',
  normal_user: '普通用户',
};

const UserManage: React.FC = () => {
  const { message, modal } = App.useApp();
  const actionRef = useRef<ActionType>();
  const [stats, setStats] = useState<API.UserStats | null>(null);
  const [selectedUser, setSelectedUser] = useState<API.AdminUser | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<API.AdminUser | null>(null);
  const [editForm] = Form.useForm();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();

  // 加载统计
  useEffect(() => {
    getUserStats().then(setStats).catch(() => {});
  }, []);

  // 查看详情
  const showDetail = (user: API.AdminUser) => {
    setSelectedUser(user);
    setDrawerOpen(true);
  };

  // 编辑用户
  const showEdit = (user: API.AdminUser) => {
    setEditUser(user);
    editForm.setFieldsValue({
      username: user.username,
      email: user.email,
      nickname: user.nickname,
      real_name: user.real_name,
      class: user.class,
      class_type: user.class_type,
      user_role: user.user_role,
      current_status: user.current_status,
      title: user.title,
      score: user.score,
      is_verified: user.is_verified,
    });
    setEditModalOpen(true);
  };

  const handleEdit = async () => {
    if (!editUser) return;
    try {
      const values = await editForm.validateFields();
      // 移除空值和不传的字段
      const payload: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(values)) {
        if (value !== undefined && value !== null) {
          payload[key] = value;
        }
      }
      if (payload.role) payload.user_role = payload.role;
      delete payload.role;
      delete payload.password; // 不在此处改密码

      await updateUser(editUser.uuid, payload);
      message.success('更新成功');
      setEditModalOpen(false);
      actionRef.current?.reload();
    } catch (err: any) {
      if (err?.errorFields) return; // 表单校验失败
      message.error(err?.message || '更新失败');
    }
  };

  // 创建用户
  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      await createUser(values);
      message.success('创建成功');
      setCreateModalOpen(false);
      createForm.resetFields();
      actionRef.current?.reload();
      getUserStats().then(setStats).catch(() => {});
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.message || '创建失败');
    }
  };

  // 删除确认
  const handleDelete = (user: API.AdminUser) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除用户 ${user.real_name || user.username || user.uuid} 吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteUser(user.uuid);
          message.success('删除成功');
          actionRef.current?.reload();
          getUserStats().then(setStats).catch(() => {});
          setDrawerOpen(false);
        } catch (err: any) {
          message.error(err?.message || '删除失败');
        }
      },
    });
  };

  // 状态变更操作
  const handleStatusAction = async (
    user: API.AdminUser,
    action: 'ban' | 'unban' | 'disable' | 'enable',
  ) => {
    try {
      const actionMap = {
        ban: { fn: banUser, msg: '封禁成功' },
        unban: { fn: unbanUser, msg: '已解封' },
        disable: { fn: disableUser, msg: '已禁用' },
        enable: { fn: enableUser, msg: '已启用' },
      };
      const { fn, msg } = actionMap[action];
      await fn(user.uuid);
      message.success(msg);
      actionRef.current?.reload();
      getUserStats().then(setStats).catch(() => {});
      setDrawerOpen(false);
    } catch (err: any) {
      message.error(err?.message || '操作失败');
    }
  };

  const columns: ProColumns<API.AdminUser>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      search: false,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      width: 120,
      render: (_, record) => record.username || '-',
    },
    {
      title: '真实姓名',
      dataIndex: 'real_name',
      width: 100,
      render: (_, record) => record.real_name || '-',
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      width: 100,
      search: false,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 160,
      search: false,
    },
    {
      title: '班级',
      dataIndex: 'class',
      width: 100,
      search: false,
      render: (_, record) => record.class || '-',
    },
    {
      title: '角色',
      dataIndex: 'user_role',
      width: 100,
      valueType: 'select',
      valueEnum: {
        superadmin: { text: '超级管理员', status: 'Success' },
        songlist_editor: { text: '歌单编辑', status: 'Processing' },
        'normal-user': { text: '普通用户', status: 'Default' },
      },
      render: (_, record) => (
        <Tag>{ROLE_LABELS[record.user_role] || record.user_role}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'current_status',
      width: 80,
      valueType: 'select',
      valueEnum: {
        normal: { text: '正常', status: 'Success' },
        disabled: { text: '已禁用', status: 'Warning' },
        banned: { text: '已封禁', status: 'Error' },
        pending_deletion: { text: '待删除', status: 'Default' },
      },
      render: (_, record) => (
        <Badge
          status={
            (STATUS_COLORS[record.current_status || ''] ||
              'default') as 'success' | 'error' | 'warning' | 'default'
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
      title: '加入时间',
      dataIndex: 'joined_at',
      width: 160,
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '积分',
      dataIndex: 'score',
      width: 60,
      search: false,
    },
    {
      title: '操作',
      width: 180,
      key: 'option',
      valueType: 'option',
      render: (_, record) => [
        <a
          key="detail"
          onClick={() => {
            showDetail(record);
          }}
        >
          详情
        </a>,
        <a
          key="edit"
          onClick={() => {
            showEdit(record);
          }}
        >
          编辑
        </a>,
        <a
          key="delete"
          style={{ color: 'red' }}
          onClick={() => {
            handleDelete(record);
          }}
        >
          删除
        </a>,
      ],
    },
  ];

  return (
    <PageContainer header={{ title: '用户管理' }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card size="small">
            <Statistic title="总用户" value={stats?.total || 0} />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small">
            <Statistic
              title="正常"
              value={stats?.normal || 0}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small">
            <Statistic
              title="已禁用"
              value={stats?.disabled || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small">
            <Statistic
              title="已封禁"
              value={stats?.banned || 0}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small">
            <Statistic
              title="待删除"
              value={stats?.pending_deletion || 0}
              valueStyle={{ color: '#999' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 用户列表 */}
      <ProTable<API.AdminUser>
        actionRef={actionRef}
        rowKey="uuid"
        columns={columns}
        request={async (params) => {
          // @ts-ignore
          const { current, pageSize, ...rest } = params;
          const keyword =
            (rest.keyword as string) ||
            (rest.username as string) ||
            (rest.real_name as string) ||
            undefined;
          const data = await searchUsers({
            limit: pageSize || 20,
            offset: ((current || 1) - 1) * (pageSize || 20),
            keyword,
            status: rest.current_status as string | undefined,
            role: rest.user_role as string | undefined,
          });
          return { data, success: true, total: data.length };
        }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            onClick={() => setCreateModalOpen(true)}
          >
            新建用户
          </Button>,
        ]}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
          optionRender: (searchConfig, props, dom) => [
            ...dom.reverse(),
          ],
        }}
        pagination={{ pageSize: 20, showSizeChanger: false }}
      />

      {/* 详情抽屉 */}
      <Drawer
        width={560}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="用户详情"
      >
        {selectedUser && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="UUID" span={2}>
              {selectedUser.uuid}
            </Descriptions.Item>
            <Descriptions.Item label="用户名">
              {selectedUser.username || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="邮箱">
              {selectedUser.email || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="真实姓名">
              {selectedUser.real_name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="昵称">
              {selectedUser.nickname || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="班级">
              {selectedUser.class || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="学段">
              {selectedUser.class_type === 'high-school' ? '中学' : selectedUser.class_type === 'university' ? '大学' : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="角色">
              <Tag>{ROLE_LABELS[selectedUser.user_role] || selectedUser.user_role}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Badge
                status={(STATUS_COLORS[selectedUser.current_status || ''] || 'default') as any}
                text={STATUS_LABELS[selectedUser.current_status || ''] || selectedUser.current_status || '未知'}
              />
            </Descriptions.Item>
            <Descriptions.Item label="头衔">
              {selectedUser.title || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="积分">
              {selectedUser.score ?? 0}
            </Descriptions.Item>
            <Descriptions.Item label="是否认证">
              {selectedUser.is_verified ? '是' : '否'}
            </Descriptions.Item>
            <Descriptions.Item label="邀请人">
              {selectedUser.invited_by || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="浏览量">
              {selectedUser.views ?? 0}
            </Descriptions.Item>
            <Descriptions.Item label="加入时间">
              {selectedUser.joined_at || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="最后登录">
              {selectedUser.last_login_at || '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
        <Space style={{ marginTop: 16 }}>
          {selectedUser?.current_status === 'normal' && (
            <>
              <Button
                danger
                onClick={() =>
                  selectedUser && handleStatusAction(selectedUser, 'disable')
                }
              >
                禁用
              </Button>
              <Button
                danger
                onClick={() =>
                  selectedUser && handleStatusAction(selectedUser, 'ban')
                }
              >
                封禁
              </Button>
            </>
          )}
          {selectedUser?.current_status === 'disabled' && (
            <Button
              type="primary"
              onClick={() =>
                selectedUser && handleStatusAction(selectedUser, 'enable')
              }
            >
              启用
            </Button>
          )}
          {selectedUser?.current_status === 'banned' && (
            <Button
              onClick={() =>
                selectedUser && handleStatusAction(selectedUser, 'unban')
              }
            >
              解封
            </Button>
          )}
        </Space>
      </Drawer>

      {/* 编辑弹窗 */}
      <Modal
        title="编辑用户"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleEdit}
        width={500}
      >
        <Form
          form={editForm}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item label="用户名" name="username">
            <Input />
          </Form.Item>
          <Form.Item label="邮箱" name="email">
            <Input />
          </Form.Item>
          <Form.Item label="昵称" name="nickname">
            <Input />
          </Form.Item>
          <Form.Item label="真实姓名" name="real_name">
            <Input />
          </Form.Item>
          <Form.Item label="班级" name="class">
            <Input />
          </Form.Item>
          <Form.Item label="学段" name="class_type">
            <Select
              allowClear
              options={[
                { label: '中学', value: 'high-school' },
                { label: '大学', value: 'university' },
              ]}
            />
          </Form.Item>
          <Form.Item label="角色" name="user_role">
            <Select
              options={[
                { label: '超级管理员', value: 'superadmin' },
                { label: '歌单编辑', value: 'songlist_editor' },
                { label: '普通用户', value: 'normal-user' },
              ]}
            />
          </Form.Item>
          <Form.Item label="状态" name="current_status">
            <Select
              options={[
                { label: '正常', value: 'normal' },
                { label: '已禁用', value: 'disabled' },
                { label: '已封禁', value: 'banned' },
              ]}
            />
          </Form.Item>
          <Form.Item label="头衔" name="title">
            <Input />
          </Form.Item>
          <Form.Item label="积分" name="score">
            <Input type="number" />
          </Form.Item>
          <Form.Item label="是否认证" name="is_verified">
            <Select
              options={[
                { label: '是', value: true },
                { label: '否', value: false },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 新建用户弹窗 */}
      <Modal
        title="新建用户"
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          createForm.resetFields();
        }}
        onOk={handleCreate}
        width={500}
      >
        <Form
          form={createForm}
          layout="vertical"
          style={{ marginTop: 16 }}
          initialValues={{ user_role: 'normal-user' }}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item label="真实姓名" name="real_name">
            <Input />
          </Form.Item>
          <Form.Item label="昵称" name="nickname">
            <Input />
          </Form.Item>
          <Form.Item label="邮箱" name="email">
            <Input />
          </Form.Item>
          <Form.Item label="班级" name="class">
            <Input />
          </Form.Item>
          <Form.Item label="学段" name="class_type">
            <Select
              allowClear
              options={[
                { label: '中学', value: 'high-school' },
                { label: '大学', value: 'university' },
              ]}
            />
          </Form.Item>
          <Form.Item label="角色" name="user_role">
            <Select
              options={[
                { label: '超级管理员', value: 'superadmin' },
                { label: '歌单编辑', value: 'songlist_editor' },
                { label: '普通用户', value: 'normal-user' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default UserManage;
