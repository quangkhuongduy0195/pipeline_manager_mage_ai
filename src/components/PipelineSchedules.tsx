import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Button, 
  Table, 
  Tag, 
  Space, 
  Card,
  List,
  Row,
  Col,
  Input,
  Statistic,
  Skeleton,
  message,
  Modal,
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { fetchPipelineSchedules, deletePipelineSchedule, fetchPipeline } from '../services/api';
import { defineCron, formatDate } from '../utils/dateUtils';
import { useHeader } from '../contexts/HeaderContext';
import { useMediaQuery } from 'react-responsive';
import { motion } from 'framer-motion';

const { Title, Text, Paragraph } = Typography;

const { confirm } = Modal;

interface PipelineSchedule {
  id: string;
  name: string;
  schedule_interval: string | null;
  status: 'active' | 'inactive';
  next_pipeline_run_date: string | null;
  last_enabled_at: string | null;
  last_pipeline_run_status: 'completed' | 'failed' | 'running' | null;
  token: string;
}

interface Pipeline {
  uuid: string;
  name: string;
}

const PipelineSchedules: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [schedules, setSchedules] = useState<PipelineSchedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<PipelineSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { setTitle, setShowBackButton } = useHeader();
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);

  useEffect(() => {
    setShowBackButton(true);
    const loadData = async () => {
      if (!id) return;
      try {
        const [schedulesData, pipelineData] = await Promise.all([
          fetchPipelineSchedules(id),
          fetchPipeline(id)
        ]);
        setSchedules(schedulesData.pipeline_schedules);
        setFilteredSchedules(schedulesData.pipeline_schedules);
        setPipeline(pipelineData);
        setTitle(`Schedules: ${pipelineData.name}`);
        setLoading(false);
      } catch (err) {
        message.error('Failed to load data. Please try again.');
        setLoading(false);
      }
    };

    loadData();
  }, [id, setTitle, setShowBackButton]);

  useEffect(() => {
    const filtered = schedules.filter(schedule => 
      schedule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.schedule_interval?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSchedules(filtered);
  }, [searchTerm, schedules]);

  const handleRowClick = (scheduleId: string, name: string, token: string, status: string) => {
    navigate(`/pipelines/${id}/runs/${scheduleId}/${encodeURIComponent(name)}/${token}/${status}`);
  };

  const handleCreateTrigger = () => {
    navigate(`/pipelines/${id}/schedules/create`);
  };

  const handleEditTrigger = (e: React.MouseEvent, scheduleId: string) => {
    e.stopPropagation(); // Prevent row click event
    navigate(`/pipelines/${id}/schedules/edit/${scheduleId}`);
  };

  const handleDeleteSchedule = (e: React.MouseEvent, scheduleId: string) => {
    e.stopPropagation();
    confirm({
      title: 'Are you sure you want to delete this schedule?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deletePipelineSchedule(scheduleId);
          message.success('Schedule deleted successfully');
          // Refresh the schedules list
          const updatedSchedules = schedules.filter(schedule => schedule.id !== scheduleId);
          setSchedules(updatedSchedules);
          setFilteredSchedules(updatedSchedules);
        } catch (error) {
          message.error('Failed to delete schedule. Please try again.');
        }
      },
    });
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Cron',
      dataIndex: 'schedule_interval',
      key: 'schedule_interval',
      render: (text: string | null) => (
        <Space direction="vertical">
          <span>{text || 'N/A'}</span>
          <span>{text ? defineCron(text) : 'N/A'}</span>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'blue'}>{status}</Tag>
      ),
    },
    {
      title: 'Next Run',
      dataIndex: 'next_pipeline_run_date',
      key: 'next_pipeline_run_date',
      render: (date: string | null) => date ? formatDate(date) : 'N/A',
    },
    {
      title: 'Last Run',
      key: 'last_run',
      render: (_: any, record: PipelineSchedule) => (
        <Space>
          <span>{record.last_enabled_at ? formatDate(record.last_enabled_at) : 'N/A'}</span>
          {record.last_pipeline_run_status && (
            <Tag color={record.last_pipeline_run_status === 'completed' ? 'green' : 'red'}>
              {record.last_pipeline_run_status}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: PipelineSchedule) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            onClick={(e) => handleEditTrigger(e, record.id)}
          >
          </Button>
          <Button 
            icon={<DeleteOutlined />} 
            danger
            onClick={(e) => handleDeleteSchedule(e, record.id)}
          >
          </Button>
        </Space>
      ),
    },
  ];

  const renderSkeletons = () => {
    return Array(5).fill(null).map((_, index) => (
      <Card key={index} style={{ marginBottom: 16 }}>
        <Skeleton active avatar paragraph={{ rows: 3 }} />
      </Card>
    ));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Space direction="vertical" size="middle" style={{ display: 'flex', width: '100%' }}>
        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Statistic 
                title="Total Schedules" 
                value={schedules.length} 
                prefix={<ClockCircleOutlined />} 
              />
            </Col>
            <Col xs={24} md={8}>
              <Statistic 
                title="Active Schedules" 
                value={schedules.filter(schedule => schedule.status === 'active').length}
                valueStyle={{ color: '#3f8600' }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col xs={24} md={8}>
              <Statistic 
                title="Inactive Schedules" 
                value={schedules.filter(schedule => schedule.status === 'inactive').length}
                valueStyle={{ color: '#cf1322' }}
                prefix={<CloseCircleOutlined />}
              />
            </Col>
          </Row>
        </Card>
        <Card>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12}>
              <Input
                placeholder="Search schedules"
                prefix={<SearchOutlined />}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Col>
            <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleCreateTrigger}
              >
                Create Trigger
              </Button>
            </Col>
          </Row>
        </Card>
        {loading ? (
          renderSkeletons()
        ) : isMobile ? (
          <List
            dataSource={filteredSchedules}
            renderItem={(item: PipelineSchedule) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card 
                  style={{ marginBottom: 16 }}
                  onClick={() => handleRowClick(item.id, item.name, item.token, item.status)}
                  hoverable
                >
                  <Title level={5}>{item.name}</Title>
                  <Paragraph>
                    <Text strong>Cron:</Text> {item.schedule_interval || 'N/A'}
                    <br />
                    {item.schedule_interval && (
                      <Text type="secondary">{defineCron(item.schedule_interval)}</Text>
                    )}
                  </Paragraph>
                  <Tag color={item.status === 'active' ? 'green' : 'blue'}>{item.status}</Tag>
                  <Paragraph>
                    <Text strong>Next Run:</Text> {item.next_pipeline_run_date ? formatDate(item.next_pipeline_run_date) : 'N/A'}
                  </Paragraph>
                  <Paragraph>
                    <Text strong>Last Run:</Text> {item.last_enabled_at ? formatDate(item.last_enabled_at) : 'N/A'}
                    {item.last_pipeline_run_status && (
                      <Tag color={item.last_pipeline_run_status === 'completed' ? 'green' : 'red'} style={{ marginLeft: 8 }}>
                        {item.last_pipeline_run_status}
                      </Tag>
                    )}
                  </Paragraph>
                  <Space style={{ marginTop: 8 }}>
                    <Button icon={<EditOutlined />} onClick={(e) => handleEditTrigger(e, item.id)}>
                      Edit
                    </Button>
                    <Button icon={<DeleteOutlined />} danger onClick={(e) => handleDeleteSchedule(e, item.id)}>
                      Delete
                    </Button>
                  </Space>
                </Card>
              </motion.div>
            )}
          />
        ) : (
          <Table 
            columns={columns} 
            dataSource={filteredSchedules} 
            rowKey="id"
            onRow={(record) => ({
              onClick: () => handleRowClick(record.id, record.name, record.token, record.status),
            })}
            scroll={{ x: 'max-content' }}
          />
        )}
      </Space>
    </motion.div>
  );
};

export default PipelineSchedules;
