import React, { useState, useEffect } from 'react';
import { Typography, Table, Tag, Space, Card, Tooltip, Button, List } from 'antd';
import { fetchPipelineRunHistories } from '../services/api';
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, SyncOutlined, TagOutlined, ScheduleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { formatDateWithTimezone } from '../utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import { useHeader } from '../contexts/HeaderContext';

dayjs.extend(duration);

const { Title, Text } = Typography;

interface PipelineRun {
  id: number;
  pipeline_uuid: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  execution_date: string;
  pipeline_tags: string[];
  pipeline_schedule_name: string;
  pipeline_schedule_id: string;
  pipeline_schedule_token: string;
  completed_block_runs_count: number;
  block_runs_count: number;
}

const PipelineHistories: React.FC = () => {
  const [data, setData] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const { setTitle, setShowBackButton } = useHeader();
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 768);
  const _limit = 30;
  const navigate = useNavigate();

  useEffect(() => {
    setTitle('Pipeline Run History');
    setShowBackButton(false);
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async (loadMore = false) => {
    if (!loadMore) {
      setOffset(0);
      setData([]);
    }
    setLoading(true);
    try {
      const response = await fetchPipelineRunHistories({
        _limit: _limit,
        _offset: offset,
        disable_retries_grouping: true,
        include_pipeline_tags: true,
        include_pipeline_uuids: true,
      });
      if (loadMore) {
        setData(prevData => [...prevData, ...response.pipeline_runs]);
      } else {
        setData(response.pipeline_runs);
      }
      setHasMore(response.pipeline_runs.length === _limit);
      setOffset(prevOffset => prevOffset + response.pipeline_runs.length);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLoadMore = () => {
    fetchData(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'running':
        return 'processing';
      case 'cancelled':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircleOutlined />;
      case 'failed':
        return <CloseCircleOutlined />;
      case 'running':
        return <SyncOutlined spin />;
      case 'cancelled':
        return <ClockCircleOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const handleUUIDClick = (uuid: string) => {
    navigate(`/pipelines/${uuid}/schedules`);
  };

  const handleTriggerClick = (record: PipelineRun) => {
    navigate(`/pipelines/${record.pipeline_uuid}/runs/${record.pipeline_schedule_id}/${record.pipeline_schedule_name}/${record.pipeline_schedule_token}/${record.status}`);
  };

  const columns = [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: PipelineRun) => (
        <Space direction="vertical" size="small">
          <Tag icon={getStatusIcon(status)} color={getStatusColor(status)}>
            {status.toUpperCase()}
          </Tag>
          <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
            {`${record.completed_block_runs_count}/${record.block_runs_count} blocks`}
          </Typography.Text>
        </Space>
      ),
      width: '10%',
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <a>{text}</a>,
    },
    {
      title: 'Pipeline UUID',
      dataIndex: 'pipeline_uuid',
      key: 'pipeline_uuid',
      render: (text: string) => (
        <Tooltip title="Click to view schedules">
          <a onClick={() => handleUUIDClick(text)}>{text}</a>
        </Tooltip>
      ),
      width: '15%',
    },
    {
      title: 'Trigger',
      dataIndex: 'pipeline_schedule_name',
      key: 'pipeline_schedule_name',
      render: (text: string, record: PipelineRun) => (
        <Tooltip title="Click to view pipeline run">
          <Tag 
            icon={<ScheduleOutlined />} 
            color="purple" 
            style={{ cursor: 'pointer' }}
            onClick={() => handleTriggerClick(record)}
          >
            {text}
          </Tag>
        </Tooltip>
      ),
      width: '15%',
    },
    {
      title: 'Tags',
      dataIndex: 'pipeline_tags',
      key: 'pipeline_tags',
      render: (tags: string[]) => (
        <Space size={[0, 8]} wrap>
          {tags.map((tag, index) => (
            <Tag key={index} icon={<TagOutlined />} color="blue">
              {tag}
            </Tag>
          ))}
        </Space>
      ),
      width: '15%',
    },
    {
      title: 'Start Time',
      dataIndex: 'started_at',
      key: 'started_at',
      render: (text: string) => formatDateWithTimezone(text),
    },
    {
      title: 'End Time',
      dataIndex: 'completed_at',
      key: 'completed_at',
      render: (text: string) => text ? formatDateWithTimezone(text) : '-',
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_: any, record: PipelineRun) => {
        if (record.completed_at && record.started_at) {
          const duration = dayjs.duration(dayjs(record.completed_at).diff(dayjs(record.started_at)));
          return `${duration.hours()}h ${duration.minutes()}m ${duration.seconds()}s`;
        }
        return '-';
      },
    },
  ];

  const renderCardItem = (item: PipelineRun) => (
    <Card
      key={item.id}
      style={{ marginBottom: 16 }}
      actions={[
        <Button type="link" onClick={() => handleUUIDClick(item.pipeline_uuid)}>View Schedules</Button>,
        <Button type="link" onClick={() => handleTriggerClick(item)}>View Run</Button>
      ]}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Space>
          <Tag icon={getStatusIcon(item.status)} color={getStatusColor(item.status)}>
            {item.status.toUpperCase()}
          </Tag>
          <Text type="secondary">{`${item.completed_block_runs_count}/${item.block_runs_count} blocks`}</Text>
        </Space>
        <Text strong>ID: {item.id}</Text>
        <Text>UUID: {item.pipeline_uuid}</Text>
        <Text>Trigger: {item.pipeline_schedule_name}</Text>
        <Space size={[0, 8]} wrap>
          {item.pipeline_tags.map((tag, index) => (
            <Tag key={index} icon={<TagOutlined />} color="blue">
              {tag}
            </Tag>
          ))}
        </Space>
        <Text>Start: {formatDateWithTimezone(item.started_at)}</Text>
        <Text>End: {item.completed_at ? formatDateWithTimezone(item.completed_at) : '-'}</Text>
        <Text>Duration: {
          item.completed_at && item.started_at
            ? (() => {
                const duration = dayjs.duration(dayjs(item.completed_at).diff(dayjs(item.started_at)));
                return `${duration.hours()}h ${duration.minutes()}m ${duration.seconds()}s`;
              })()
            : '-'
        }</Text>
      </Space>
    </Card>
  );

  return (
    <Card>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Title level={2}>Pipeline Run History</Title>
        {isSmallScreen ? (
          <List
            dataSource={data}
            renderItem={renderCardItem}
            loading={loading}
          />
        ) : (
          <Table 
            dataSource={data} 
            columns={columns} 
            rowKey="id"
            pagination={false}
            loading={loading}
            style={{ overflowX: 'auto' }}
          />
        )}
        {hasMore && (
          <Button 
            onClick={handleLoadMore} 
            loading={loading} 
            style={{ marginTop: 16 }}
            type="primary"
            ghost
            block
          >
            Load More
          </Button>
        )}
      </Space>
    </Card>
  );
};

export default PipelineHistories;
