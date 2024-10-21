import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Button, 
  Table, 
  Space, 
  Typography,
  Card,
  List,
  Tag,
  Row,
  Col,
  Statistic,
  Skeleton,
  message,
  Modal,
  Tabs,
  Timeline,
  Tooltip,
  Collapse,
  Divider,
  Affix
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  LoadingOutlined,
  QuestionCircleOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  EditOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  CalendarOutlined,
  FieldTimeOutlined,
  CodeOutlined
} from '@ant-design/icons';
import { fetchPipelineRuns, togglePipelineSchedule, runPipelineOnce, fetchPipelineLogs } from '../services/api';
import { formatDate } from '../utils/dateUtils';
import { useHeader } from '../contexts/HeaderContext';
import { useMediaQuery } from 'react-responsive';
import { motion } from 'framer-motion';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

interface PipelineRun {
  id: string;
  status: string;
  started_at: string;
  completed_at: string;
}

interface LogData {
  block_run_logs: { name: string; content: string, path: string }[];
  pipeline_run_logs: { name: string; content: string, path: string }[];
}

const PipelineRuns: React.FC = () => {
  const { id, scheduleId, name, token, status: initialStatus } = useParams<{ id: string; scheduleId: string; name: string; token: string; status: string }>();
  const navigate = useNavigate();
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(initialStatus);
  const { setTitle, setShowBackButton } = useHeader();
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedRunLog, setSelectedRunLog] = useState<string | null>(null);
  const [isLogModalVisible, setIsLogModalVisible] = useState(false);
  const [pipelineLogs, setPipelineLogs] = useState<string | null>(null);
  const [isPipelineLogsModalVisible, setIsPipelineLogsModalVisible] = useState(false);
  const [logData, setLogData] = useState<LogData | null>(null);

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

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
      case 'running':
        return <LoadingOutlined style={{ color: '#1890ff' }} />;
      default:
        return <QuestionCircleOutlined style={{ color: '#faad14' }} />;
    }
  };

  const calculateExecutionTime = (startedAt: string | null, completedAt: string | null) => {
    if (!completedAt || !startedAt) return 'N/A';
    const start = new Date(startedAt).getTime();
    const end = new Date(completedAt).getTime();
    const diff = end - start;
    const minutes = Math.floor(diff / 60000);
    const seconds = ((diff % 60000) / 1000).toFixed(0);
    return `${minutes}m ${seconds}s`;
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

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Space>
          {getStatusIcon(status)}
          <span>{status}</span>
        </Space>
      ),
    },
    {
      title: 'Started At',
      dataIndex: 'started_at',
      key: 'started_at',
      render: (date: string | null) => formatDate(date),
    },
    {
      title: 'Finished At',
      dataIndex: 'completed_at',
      key: 'completed_at',
      render: (date: string | null) => formatDate(date),
    },
    {
      title: 'Execution Time',
      key: 'execution_time',
      render: (_: any, record: PipelineRun) => calculateExecutionTime(record.started_at, record.completed_at),
    },
    {
      title: 'Logs',
      key: 'actions',
      render: (_: any, record: PipelineRun) => (
        <Button 
          icon={<FileTextOutlined />} 
          onClick={() => handleViewLog(record.id)}
        >
          View Log
        </Button>
      ),
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'green';
      case 'failed': return 'red';
      case 'running': return 'blue';
      default: return 'default';
    }
  };

  const renderRunCard = (run: PipelineRun) => (
    <Card
      key={run.id}
      hoverable
      style={{ marginBottom: 16 }}
    >
      <Row gutter={[16, 16]} align="middle">
        <Col span={6}>
          <Statistic
            title="Status"
            value={run.status}
            valueStyle={{ color: getStatusColor(run.status) }}
            prefix={getStatusIcon(run.status)}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Started At"
            value={formatDate(run.started_at)}
            prefix={<CalendarOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Finished At"
            value={run.completed_at ? formatDate(run.completed_at) : 'N/A'}
            prefix={<CalendarOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Execution Time"
            value={calculateExecutionTime(run.started_at, run.completed_at)}
            prefix={<FieldTimeOutlined />}
          />
        </Col>
      </Row>
      <Row style={{ marginTop: 16 }}>
        <Col span={24}>
          <Button 
            type="primary"
            icon={<FileTextOutlined />}
            onClick={() => handleViewLog(run.id)}
          >
            View Log
          </Button>
        </Col>
      </Row>
    </Card>
  );

  const renderTimeline = () => (
    <Timeline mode="left">
      {runs.map((run) => (
        <Timeline.Item
          key={run.id}
          color={getStatusColor(run.status)}
          label={formatDate(run.started_at)}
        >
          <Text strong>{`Run ${run.id}`}</Text>
          <Tag color={getStatusColor(run.status)} style={{ marginLeft: 8 }}>
            {run.status}
          </Tag>
          <br />
          <Text type="secondary">
            {`Duration: ${calculateExecutionTime(run.started_at, run.completed_at)}`}
          </Text>
          <br />
          <Button 
            type="link" 
            icon={<FileTextOutlined />}
            onClick={() => handleViewLog(run.id)}
          >
            View Log
          </Button>
        </Timeline.Item>
      ))}
    </Timeline>
  );

  const renderLogContent = (content: string) => {
    return (
      <SyntaxHighlighter language="plaintext" style={docco} showLineNumbers>
        {content}
      </SyntaxHighlighter>
    );
  };

  return (
    <>
      {contextHolder}
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
            <Tabs defaultActiveKey="1">
              <TabPane tab="Card View" key="1">
                <List
                  grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 }}
                  dataSource={runs}
                  renderItem={renderRunCard}
                />
              </TabPane>
              <TabPane tab="Timeline View" key="2">
                {renderTimeline()}
              </TabPane>
              <TabPane tab="Table View" key="3">
                <Table 
                  columns={columns} 
                  dataSource={runs} 
                  rowKey="id"
                  scroll={{ x: 'max-content' }}
                />
              </TabPane>
            </Tabs>
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
