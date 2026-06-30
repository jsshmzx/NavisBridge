import {
  searchPersonalLogs,
  searchPersonalLogsByUser,
  searchSystemLogs,
} from '@/services/logs';
import {
  ActionType,
  PageContainer,
  ProColumns,
  ProFormDateTimePicker,
  ProFormSelect,
  ProFormText,
  ProTable,
  QueryFilter,
} from '@ant-design/pro-components';
import { useAccess, useModel } from '@umijs/max';
import { Card, Descriptions, Tabs, Tag, Typography, message } from 'antd';
import React, { useRef, useState } from 'react';

const { Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: 'success',
  FAIL: 'error',
  PARTIAL: 'warning',
};

const SEVERITY_COLORS: Record<string, string> = {
  INFO: 'blue',
  WARN: 'orange',
  ERROR: 'red',
};

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleString() : '-';

const renderJson = (value: Record<string, unknown> | null) => {
  if (!value || Object.keys(value).length === 0) return '-';
  return (
    <pre style={{ margin: 0, maxHeight: 240, overflow: 'auto' }}>
      {JSON.stringify(value, null, 2)}
    </pre>
  );
};

/** 将单元格值安全渲染为文本。
 * ProTable 在 valueType='text' 默认渲染时，render 第一个参数实际是一个
 * <Typography.Text copyable ellipsis> 元素（来自 pro-utils 的 genCopyable），
 * record 中的对应字段也可能被替换成 React 元素。直接 JSON.stringify 会输出
 * `{"type":{},...}`。这里递归从 React 元素的 props（copyable.text、
 * ellipsis.tooltip、children）中提取真实文本，避免 [object Object] / JSON 化
 * 的 React 元素。 */
const extractReactText = (value: unknown, fallback: string): string => {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  if (Array.isArray(value)) {
    const parts = value
      .map((v) => extractReactText(v, ''))
      .filter((s) => s && s !== fallback);
    return parts.length ? parts.join('') : fallback;
  }
  if (React.isValidElement(value)) {
    const props = (value.props ?? {}) as {
      copyable?: { text?: unknown } | boolean;
      ellipsis?: { tooltip?: unknown };
      children?: unknown;
      title?: unknown;
    };
    // genCopyable 会把原始文本放在 copyable.text / ellipsis.tooltip 上
    if (
      props.copyable &&
      typeof props.copyable === 'object' &&
      props.copyable.text !== undefined
    ) {
      return extractReactText(props.copyable.text, fallback);
    }
    if (props.ellipsis && typeof props.ellipsis === 'object') {
      const tip = props.ellipsis.tooltip;
      if (tip !== undefined && tip !== null && tip !== false) {
        return extractReactText(tip, fallback);
      }
    }
    if (props.title !== undefined) {
      return extractReactText(props.title, fallback);
    }
    if (props.children !== undefined) {
      return extractReactText(props.children, fallback);
    }
    return fallback;
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }
  return String(value);
};

/** 取单元格对应的原始字符串。优先用 record[dataIndex]（绝大多数情况是字符串），
 * 退化到第一个参数（默认渲染的 DOM）。 */
const pickCellText = (
  value: unknown,
  record: Record<string, unknown> | undefined,
  field: string,
  fallback = '-',
): string => {
  if (record && record[field] !== undefined && record[field] !== null) {
    const fromRecord = extractReactText(record[field], '');
    if (fromRecord && fromRecord !== fallback) return fromRecord;
  }
  return extractReactText(value, fallback);
};

const baseColumns: ProColumns<API.BaseLog>[] = [
  {
    title: '时间',
    dataIndex: 'created_at',
    width: 170,
    resizable: true,
    render: (_, record) => formatDate(record.created_at),
  },
  {
    title: '事件类型',
    dataIndex: 'event_type',
    width: 140,
    resizable: true,
    render: (_, record) => record.event_type || '-',
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 90,
    resizable: true,
    render: (_, record) =>
      record.status ? (
        <Tag color={STATUS_COLORS[record.status] ?? 'default'}>
          {record.status}
        </Tag>
      ) : (
        '-'
      ),
  },
  {
    title: '严重级别',
    dataIndex: 'severity',
    width: 90,
    resizable: true,
    render: (_, record) =>
      record.severity ? (
        <Tag color={SEVERITY_COLORS[record.severity] ?? 'default'}>
          {record.severity}
        </Tag>
      ) : (
        '-'
      ),
  },
  {
    title: '内容',
    dataIndex: 'content',
    ellipsis: true,
    resizable: true,
    render: (value, record) => {
      const text = pickCellText(value, record as any, 'content');
      return text !== '-' ? (
        <Text style={{ maxWidth: 360 }} ellipsis={{ tooltip: true }}>
          {text}
        </Text>
      ) : (
        '-'
      );
    },
  },
  {
    title: 'IP',
    dataIndex: 'client_ip',
    width: 120,
    resizable: true,
    render: (_, record) => record.client_ip || '-',
  },
  {
    title: '请求',
    dataIndex: 'request_method',
    width: 120,
    resizable: true,
    render: (_, record) =>
      record.request_method ? (
        <span>
          {record.request_method} {record.request_url ? '…' : ''}
        </span>
      ) : (
        '-'
      ),
  },
  {
    title: 'Trace ID',
    dataIndex: 'trace_id',
    width: 160,
    ellipsis: true,
    resizable: true,
    render: (value, record) => {
      const text = pickCellText(value, record as any, 'trace_id');
      return text !== '-' ? (
        <Text copyable style={{ maxWidth: 140 }} ellipsis>
          {text}
        </Text>
      ) : (
        '-'
      );
    },
  },
];

const systemLogColumns: ProColumns<API.SystemLog>[] = [
  ...(baseColumns as ProColumns<API.SystemLog>[]),
  {
    title: '服务名',
    dataIndex: 'service_name',
    width: 120,
    resizable: true,
    render: (_, record) => record.service_name || '-',
  },
];

const personalLogColumns: ProColumns<API.PersonalLog>[] = [
  ...(baseColumns as ProColumns<API.PersonalLog>[]),
  {
    title: '用户 UUID',
    dataIndex: 'user_uuid',
    width: 160,
    ellipsis: true,
    resizable: true,
    render: (value, record) => {
      const text = pickCellText(value, record as any, 'user_uuid');
      return text !== '-' ? (
        <Text copyable style={{ maxWidth: 140 }} ellipsis>
          {text}
        </Text>
      ) : (
        '-'
      );
    },
  },
  {
    title: '操作对象',
    dataIndex: 'target_type',
    width: 160,
    resizable: true,
    render: (_, record) => {
      const type = extractReactText(record.target_type, '');
      const id = extractReactText(record.target_id, '');
      if (!type) return '-';
      return (
        <span>
          {type}
          {id ? `: ${id}` : ''}
        </span>
      );
    },
  },
];

const expandable = {
  expandedRowRender: (record: API.BaseLog) => (
    <Descriptions bordered column={1} size="small">
      <Descriptions.Item label="日志 UUID">{record.uuid}</Descriptions.Item>
      <Descriptions.Item label="日志级别">{record.log_level}</Descriptions.Item>
      <Descriptions.Item label="日志类型">
        {record.log_type || '-'}
      </Descriptions.Item>
      <Descriptions.Item label="请求 URL">
        {record.request_url || '-'}
      </Descriptions.Item>
      <Descriptions.Item label="User Agent">
        {record.user_agent || '-'}
      </Descriptions.Item>
      <Descriptions.Item label="额外数据">
        {renderJson(record.extra_data)}
      </Descriptions.Item>
      {'before_data' in record && (
        <Descriptions.Item label="变更前数据">
          {renderJson(
            (record as API.PersonalLog).before_data as Record<
              string,
              unknown
            > | null,
          )}
        </Descriptions.Item>
      )}
      {'after_data' in record && (
        <Descriptions.Item label="变更后数据">
          {renderJson(
            (record as API.PersonalLog).after_data as Record<
              string,
              unknown
            > | null,
          )}
        </Descriptions.Item>
      )}
    </Descriptions>
  ),
};

interface LogTableProps<T extends API.BaseLog> {
  columns: ProColumns<T>[];
  fetchData: (params: API.LogSearchParams) => Promise<API.PaginatedLogs<T>>;
  showUserFilter?: boolean;
}

function LogTable<T extends API.BaseLog>({
  columns,
  fetchData,
  showUserFilter,
}: LogTableProps<T>) {
  const actionRef = useRef<ActionType>();
  const [filters, setFilters] = useState<API.LogSearchParams>({});

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <QueryFilter
          defaultCollapsed={false}
          onFinish={async (values) => {
            setFilters(values as API.LogSearchParams);
            actionRef.current?.reload();
          }}
          onReset={() => {
            setFilters({});
            actionRef.current?.reload();
          }}
        >
          <ProFormText name="keyword" label="关键词" placeholder="内容关键词" />
          <ProFormText
            name="event_type"
            label="事件类型"
            placeholder="如 LOGIN"
          />
          <ProFormText name="log_type" label="日志类型" placeholder="如 auth" />
          <ProFormSelect
            name="status"
            label="状态"
            options={[
              { label: 'SUCCESS', value: 'SUCCESS' },
              { label: 'FAIL', value: 'FAIL' },
              { label: 'PARTIAL', value: 'PARTIAL' },
            ]}
            placeholder="全部"
            allowClear
          />
          <ProFormSelect
            name="severity"
            label="严重级别"
            options={[
              { label: 'INFO', value: 'INFO' },
              { label: 'WARN', value: 'WARN' },
              { label: 'ERROR', value: 'ERROR' },
            ]}
            placeholder="全部"
            allowClear
          />
          <ProFormText name="trace_id" label="Trace ID" />
          <ProFormText name="client_ip" label="客户端 IP" />
          {showUserFilter && <ProFormText name="user_uuid" label="用户 UUID" />}
          <ProFormDateTimePicker
            name="start_time"
            label="开始时间"
            fieldProps={{ showTime: true }}
          />
          <ProFormDateTimePicker
            name="end_time"
            label="结束时间"
            fieldProps={{ showTime: true }}
          />
        </QueryFilter>
      </Card>

      <ProTable<T>
        actionRef={actionRef}
        rowKey="uuid"
        columns={columns}
        expandable={expandable}
        request={async (params) => {
          const { current = 1, pageSize = 20 } = params;
          try {
            const data = await fetchData({
              ...filters,
              limit: pageSize,
              offset: (current - 1) * pageSize,
            });
            return {
              data: data.items,
              success: true,
              total: data.total,
            };
          } catch (err: any) {
            message.error(err.message || '查询失败');
            return { data: [], success: false, total: 0 };
          }
        }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
        }}
        search={false}
        toolBarRender={false}
        scroll={{ x: 1500 }}
      />
    </>
  );
}

const Logs: React.FC = () => {
  const access = useAccess();
  const { initialState } = useModel('@@initialState');
  const currentUserUuid = initialState?.uuid;

  // 非 superadmin 默认只展示个人日志，且只能看自己的
  const defaultUserUuid = access.canViewSystemLogs
    ? undefined
    : currentUserUuid;

  const items = [] as {
    key: string;
    label: string;
    children: React.ReactNode;
  }[];

  if (access.canViewSystemLogs) {
    items.push({
      key: 'system',
      label: '系统日志',
      children: (
        <LogTable<API.SystemLog>
          columns={systemLogColumns}
          fetchData={searchSystemLogs}
        />
      ),
    });
  }

  items.push({
    key: 'personal',
    label: '个人日志',
    children: (
      <LogTable<API.PersonalLog>
        columns={personalLogColumns}
        fetchData={(params) =>
          defaultUserUuid
            ? searchPersonalLogsByUser(defaultUserUuid, params)
            : searchPersonalLogs(params)
        }
        showUserFilter={access.canViewSystemLogs}
      />
    ),
  });

  const [activeTab, setActiveTab] = useState<string>(
    items[0]?.key ?? 'personal',
  );

  return (
    <PageContainer title="日志查询" subTitle="查询系统与个人操作日志">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={items}
        destroyInactiveTabPane
      />
    </PageContainer>
  );
};

export default Logs;
