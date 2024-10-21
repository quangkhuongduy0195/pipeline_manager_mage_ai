import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Button, 
  Space, 
  Typography, 
  Card, 
  Table, 
  Tag, 
  Row,
  Col,
  Skeleton, 
  message,
  Tooltip,
  Popconfirm,
  Modal,
  Statistic,
  List,
  Tabs,
  Collapse,
  Affix,
  Badge
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  SyncOutlined, 
  PauseCircleOutlined, 
  PlayCircleOutlined, 
  EditOutlined, 
  ClockCircleOutlined,
  FileTextOutlined,
  StopOutlined,
  QuestionCircleOutlined,
  CodeOutlined
} from '@ant-design/icons';
import { fetchPipelineRuns, togglePipelineSchedule, runPipelineOnce, cancelPipelineRun, fetchPipelineLogs } from '../services/api';
import { formatDuration, formatDateWithTimezone } from '../utils/dateUtils';
import { useHeader } from '../contexts/HeaderContext';
import { motion } from 'framer-motion';
import { useMediaQuery } from 'react-responsive';

const { Text } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

interface PipelineRun {
  id: string;
  status: string;
  started_at: string;
  completed_at: string;
}

interface LogData {
  block_run_logs: { name: string; path: string; content: string }[];
  pipeline_run_logs: { name: string; path: string; content: string }[];
}

const PipelineRuns: React.FC = () => {
  const { id, scheduleId, name, token, status: initialStatus } = useParams<{ id: string; scheduleId: string; name: string; token: string; status: string }>();
  const navigate = useNavigate();
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(initialStatus);
  const { setTitle, setShowBackButton } = useHeader();
  const [messageApi, contextHolder] = message.useMessage();
  const [isLogModalVisible, setIsLogModalVisible] = useState(false);
  const [logData, setLogData] = useState<LogData | null>(null);
  const isMobile = useMediaQuery({ maxWidth: 768 });

  useEffect(() => {
    setTitle(`Pipeline Runs: ${decodeURIComponent(name || '')}`);
    setShowBackButton(true);
    const loadPipelineRuns = async () => {
      if (!scheduleId) return;
      try {
        const data = await fetchPipelineRuns(scheduleId);
        setRuns(data.pipeline_runs);
        setLoading(false);
      } catch (err) {
        messageApi.error('Failed to load pipeline runs. Please try again later.');
        setLoading(false);
      }
    };

    loadPipelineRuns();
  }, [scheduleId, name, setTitle, setShowBackButton, messageApi]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'running': return 'processing';
      case 'initial': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <CheckCircleOutlined />;
      case 'failed': return <CloseCircleOutlined />;
      case 'running': return <SyncOutlined spin />;
      case 'initial': return <ClockCircleOutlined />;
      default: return <QuestionCircleOutlined />;
    }
  };

  const handleDisableTrigger = async () => {
    if (!scheduleId) return;
    try {
      setLoading(true);
      const response = await togglePipelineSchedule(scheduleId, status || '');
      if (response && response.pipeline_schedule) {
        setStatus(response.pipeline_schedule.status);
        navigate(`/pipelines/${id}/runs/${scheduleId}/${name}/${token}/${response.pipeline_schedule.status}`, { replace: true });
        messageApi.success(`Trigger ${response.pipeline_schedule.status === 'active' ? 'enabled' : 'disabled'} successfully`);
      }
      setLoading(false);
    } catch (err) {
      messageApi.error('Failed to toggle pipeline schedule. Please try again later.');
      setLoading(false);
    }
  };

  const handleRunOnce = async () => {
    if (!scheduleId || !token) return;
    try {
      setLoading(true);
      await runPipelineOnce(scheduleId, token);
      messageApi.success('Pipeline run started successfully');
      const updatedRuns = await fetchPipelineRuns(scheduleId);
      setRuns(updatedRuns.pipeline_runs);
      setLoading(false);
    } catch (err) {
      messageApi.error('Failed to start pipeline run. Please try again later.');
      setLoading(false);
    }
  };

  const handleEditTrigger = () => {
    if (id && scheduleId) {
      navigate(`/pipelines/${id}/schedules/edit/${scheduleId}`);
    }
  };

  const handleViewLog = async (runId: string) => {
    try {
      if (!id) return;
      const logData = await fetchPipelineLogs(id, runId);
      setLogData(logData.logs[0]);
      setIsLogModalVisible(true);
    } catch (err) {
      messageApi.error('Failed to fetch run log. Please try again later.');
    }
  };

  const handleCancelRun = async (runId: string) => {
    try {
      setLoading(true);
      await cancelPipelineRun(runId);
      messageApi.success('Run canceled successfully');
      const updatedRuns = await fetchPipelineRuns(scheduleId!);
      setRuns(updatedRuns.pipeline_runs);
    } catch (err) {
      console.error('Error cancelling pipeline run:', err);
      messageApi.error('Failed to cancel pipeline run. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge
          status={getStatusColor(status)}
          text={
            <Space>
              {getStatusIcon(status)}
              <Text strong>{status.toUpperCase()}</Text>
            </Space>
          }
        />
      ),
    },
    {
      title: 'Run ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Started At',
      dataIndex: 'started_at',
      key: 'started_at',
      render: (date: string) => formatDateWithTimezone(date),
    },
    {
      title: 'Finished At',
      dataIndex: 'completed_at',
      key: 'completed_at',
      render: (date: string) => date ? formatDateWithTimezone(date) : '-',
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_: string, record: PipelineRun) => (
        record.completed_at 
          ? formatDuration(new Date(record.started_at), new Date(record.completed_at))
          : formatDuration(new Date(record.started_at), new Date())
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: string, record: PipelineRun) => (
        <Space size="middle">
          <Button icon={<FileTextOutlined />} onClick={() => handleViewLog(record.id)}>
            Log
          </Button>
          {(record.status.toLowerCase() === 'running' || record.status.toLowerCase() === 'initial') && (
            <Popconfirm
              title="Are you sure you want to cancel this run?"
              onConfirm={() => handleCancelRun(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button icon={<StopOutlined />} danger>
                Cancel
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const renderLogContent = (content: string) => (
    <pre style={{ maxHeight: '200px', overflow: 'auto' }}>{content}</pre>
  );

  const renderRunCard = (run: PipelineRun) => (
    <Card
      key={run.id}
      style={{ marginBottom: 16 }}
      actions={[
        <Button icon={<FileTextOutlined />} onClick={() => handleViewLog(run.id)}>View Log</Button>,
        (run.status.toLowerCase() === 'running' || run.status.toLowerCase() === 'initial') && (
          <Popconfirm
            title="Are you sure you want to cancel this run?"
            onConfirm={() => handleCancelRun(run.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<StopOutlined />} danger>Cancel</Button>
          </Popconfirm>
        )
      ].filter(Boolean)}
    >
      <Card.Meta
        avatar={
          <Badge
            status={getStatusColor(run.status)}
            text={getStatusIcon(run.status)}
          />
        }
        title={
          <Space direction="vertical" size={0}>
            <Text strong>Run ID: {run.id}</Text>
            <Text type="secondary" style={{ fontSize: '0.9em' }}>
              {run.status.toUpperCase()}
            </Text>
          </Space>
        }
        description={
          <Space direction="vertical">
            <Text>Started: {formatDateWithTimezone(run.started_at)}</Text>
            <Text>Finished: {run.completed_at ? formatDateWithTimezone(run.completed_at) : '-'}</Text>
            <Text>
              Duration: {
                run.completed_at 
                  ? formatDuration(new Date(run.started_at), new Date(run.completed_at))
                  : formatDuration(new Date(run.started_at), new Date())
              }
            </Text>
          </Space>
        }
      />
    </Card>
  );

  return (
    <>
      {contextHolder}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Space direction="vertical" size="large" style={{ display: 'flex', width: '100%' }}>
          <Card>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Statistic 
                  title="Total Runs" 
                  value={runs.length} 
                  prefix={<ClockCircleOutlined />} 
                />
              </Col>
              <Col xs={24} md={8}>
                <Statistic 
                  title="Successful Runs" 
                  value={runs.filter(run => run.status.toLowerCase() === 'completed').length}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col xs={24} md={8}>
                <Statistic 
                  title="Failed Runs" 
                  value={runs.filter(run => run.status.toLowerCase() === 'failed').length}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<CloseCircleOutlined />}
                />
              </Col>
            </Row>
          </Card>
          <Card>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Tooltip title={status === 'active' ? 'Disable Trigger' : 'Enable Trigger'}>
                  <Button
                    type={status === 'active' ? 'primary' : 'default'}
                    icon={status === 'active' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                    onClick={handleDisableTrigger}
                    style={{ width: '100%' }}
                    danger={status === 'active'}
                  >
                    {status === 'active' ? 'Disable' : 'Enable'}
                  </Button>
                </Tooltip>
              </Col>
              <Col xs={24} sm={8}>
                <Tooltip title="Run pipeline once">
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={handleRunOnce}
                    style={{ width: '100%' }}
                  >
                    Run Once
                  </Button>
                </Tooltip>
              </Col>
              <Col xs={24} sm={8}>
                <Tooltip title="Edit trigger settings">
                  <Button
                    icon={<EditOutlined />}
                    onClick={handleEditTrigger}
                    style={{ width: '100%' }}
                  >
                    Edit Trigger
                  </Button>
                </Tooltip>
              </Col>
            </Row>
          </Card>
          {loading ? (
            <Skeleton active />
          ) : (
            <Card>
              {isMobile ? (
                <List
                  dataSource={runs}
                  renderItem={renderRunCard}
                  pagination={{
                    pageSize: 10,
                    showQuickJumper: true,
                  }}
                />
              ) : (
                <Table 
                  columns={columns} 
                  dataSource={runs}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    // showSizeChanger: true,
                    showQuickJumper: true,
                  }}
                />
              )}
            </Card>
          )}
        </Space>
      </motion.div>
      
      <Modal
        title={
          <Affix offsetTop={0}>
            <div style={{ background: '#fff', padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
              <Space>
                <FileTextOutlined />
                <span>Pipeline Run Log</span>
              </Space>
            </div>
          </Affix>
        }
        open={isLogModalVisible}
        onCancel={() => setIsLogModalVisible(false)}
        footer={null}
        width={1200}
        style={{ top: 20 }}
        styles={{
          body: { padding: 0, maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }
        }}
      >
        <div style={{ padding: '16px' }}>
          {logData && (
            <Tabs defaultActiveKey="1" type="card">
              <TabPane
              tab={
                <span>
                  <CodeOutlined />
                  Block Run Logs
                </span>
              } 
              key="1">
                <Collapse accordion>
                  {logData.block_run_logs.map((log, index) => (
                    <Panel 
                      header={
                        <Space>
                          <FileTextOutlined />
                          <Text strong>{log.name}</Text>
                          <Tag color="blue">{log.path}</Tag>
                        </Space>
                      } 
                      key={index}
                    >
                      <Card
                        styles={{
                          body: { maxHeight: '400px', overflow: 'auto' }
                        }}
                      >
                        {renderLogContent(log.content)}
                      </Card>
                    </Panel>
                  ))}
                </Collapse>
              </TabPane>
              <TabPane
              tab={
                <span>
                  <CodeOutlined />
                  Pipeline Run Logs
                </span>
              } 
              key="2">
                <Collapse accordion>
                  {logData.pipeline_run_logs.map((log, index) => (
                    <Panel 
                      header={
                        <Space>
                          <FileTextOutlined />
                          <Text strong>{log.name}</Text>
                          <Tag color="green">{log.path}</Tag>
                        </Space>
                      } 
                      key={index}
                    >
                      <Card
                        styles={{
                          body: { maxHeight: '400px', overflow: 'auto' }
                        }}
                      >
                        {renderLogContent(log.content)}
                      </Card>
                    </Panel>
                  ))}
                </Collapse>
              </TabPane>
            </Tabs>
          )}
        </div>
      </Modal>
    </>
  );
};

export default PipelineRuns;
