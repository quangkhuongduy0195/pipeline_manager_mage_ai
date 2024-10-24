import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, Tabs, message, Typography, Layout, Tooltip, Skeleton } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, SyncOutlined, PauseCircleOutlined, BarChartOutlined } from '@ant-design/icons';
import { fetchMonitorStats } from '../services/api';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title as ChartTitle, Tooltip as ChartTooltip, Legend, ChartOptions } from 'chart.js';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import '../styles/Dashboard.css';
import { useHeader } from '../contexts/HeaderContext';

const { Title, Text } = Typography;
const { Content } = Layout;

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTitle, ChartTooltip, Legend);

interface PipelineTypeStats {
  completed: number;
  failed: number;
  running: number;
  cancelled: number;
}

interface PipelineStats {
  streaming: PipelineTypeStats;
  integration: PipelineTypeStats;
  standard: PipelineTypeStats;
  total: PipelineTypeStats;
}

interface DailyStats {
  date: string;
  completed: number;
  failed: number;
  running: number;
  cancelled: number;
}

const initialStats: PipelineStats = {
  streaming: { completed: 0, failed: 0, running: 0, cancelled: 0 },
  integration: { completed: 0, failed: 0, running: 0, cancelled: 0 },
  standard: { completed: 0, failed: 0, running: 0, cancelled: 0 },
  total: { completed: 0, failed: 0, running: 0, cancelled: 0 },
};

const Dashboard: React.FC = () => {
  const { setTitle, setShowBackButton } = useHeader();
  const [todayStats, setTodayStats] = useState<PipelineStats>(initialStats);
  const [weeklyStats, setWeeklyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState({ today: true, weekly: true });

  useEffect(() => {
    setTitle('Dashboard');
    setShowBackButton(false);
    fetchTodayStats();
    fetchWeeklyStats();
  }, []);

  const fetchTodayStats = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const result = await fetchMonitorStats(today);
      const processedStats = processTodayStats(result.monitor_stat.stats);
      setTodayStats(processedStats);
    } catch (error) {
      console.error('Error fetching today\'s statistics:', error);
      message.error('Unable to fetch today\'s statistics. Please try again later.');
    } finally {
      setLoading(prev => ({ ...prev, today: false }));
    }
  };

  const fetchWeeklyStats = async () => {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, 6); // Get data for the last 7 days
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');

      const result = await fetchMonitorStats(formattedStartDate);
      const processedStats = processWeeklyStats(result.monitor_stat.stats, startDate, endDate);
      setWeeklyStats(processedStats);
    } catch (error) {
      console.error('Error fetching weekly statistics:', error);
      message.error('Unable to fetch weekly statistics. Please try again later.');
    } finally {
      setLoading(prev => ({ ...prev, weekly: false }));
    }
  };

  const processTodayStats = (data: Record<string, any>): PipelineStats => {
    const stats: PipelineStats = {
      streaming: { completed: 0, failed: 0, running: 0, cancelled: 0 },
      integration: { completed: 0, failed: 0, running: 0, cancelled: 0 },
      standard: { completed: 0, failed: 0, running: 0, cancelled: 0 },
      total: { completed: 0, failed: 0, running: 0, cancelled: 0 },
    };

    const today = format(new Date(), 'yyyy-MM-dd');

    Object.values(data).forEach((pipeline: any) => {
      const todayData = pipeline.data[today];
      if (todayData) {
        Object.entries(todayData).forEach(([pipelineType, typeData]: [string, any]) => {
          const category = pipelineType === 'streaming' ? 'streaming' :
                           pipelineType === 'integration' ? 'integration' : 'standard';
          Object.entries(typeData).forEach(([status, count]) => {
            if (typeof count === 'number' && status in stats[category]) {
              stats[category][status as keyof PipelineTypeStats] += count;
              stats.total[status as keyof PipelineTypeStats] += count;
            }
          });
        });
      }
    });

    return stats;
  };

  const processWeeklyStats = (data: Record<string, any>, startDate: Date, endDate: Date): DailyStats[] => {
    const processedStats: Record<string, DailyStats> = {};
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

    dateRange.forEach(date => {
      const formattedDate = format(date, 'yyyy-MM-dd');
      processedStats[formattedDate] = {
        date: formattedDate,
        completed: 0,
        failed: 0,
        running: 0,
        cancelled: 0,
      };
    });

    Object.values(data).forEach((pipeline: any) => {
      Object.entries(pipeline.data).forEach(([date, dateData]: [string, any]) => {
        if (processedStats[date]) {
          Object.values(dateData).forEach((typeData: any) => {
            Object.entries(typeData).forEach(([status, count]) => {
              if (typeof count === 'number' && status in processedStats[date]) {
                processedStats[date][status as keyof Omit<DailyStats, 'date'>] += count;
              }
            });
          });
        }
      });
    });

    return Object.values(processedStats).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const renderSkeletonStatistics = () => (
    <Row gutter={[16, 16]}>
      {[1, 2, 3, 4].map((key) => (
        <Col xs={24} sm={12} md={6} key={key}>
          <Card>
            <Skeleton active paragraph={{ rows: 1 }} />
          </Card>
        </Col>
      ))}
    </Row>
  );

  const renderSkeletonChart = () => (
    <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spin size="large" />
    </div>
  );

  const renderStatistics = (typeStats: PipelineTypeStats) => (
    <Row gutter={[16, 16]}>
      {Object.entries(typeStats).map(([key, value]) => (
        <Col xs={24} sm={12} md={6} key={key}>
          <Tooltip title={`Total ${key} pipelines`}>
            <Card hoverable className={`statistic-card ${key}-card`}>
              <Statistic
                title={key.charAt(0).toUpperCase() + key.slice(1)}
                value={value}
                prefix={getIconForStatus(key)}
              />
            </Card>
          </Tooltip>
        </Col>
      ))}
    </Row>
  );

  const getIconForStatus = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleOutlined className="status-icon completed" />;
      case 'failed': return <CloseCircleOutlined className="status-icon failed" />;
      case 'running': return <SyncOutlined spin className="status-icon running" />;
      case 'cancelled': return <PauseCircleOutlined className="status-icon cancelled" />;
      default: return <BarChartOutlined className="status-icon" />;
    }
  };

  const chartData = {
    labels: weeklyStats.map(s => s.date),
    datasets: [
      {
        label: 'Completed',
        data: weeklyStats.map(s => s.completed),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1
      },
      {
        label: 'Failed',
        data: weeklyStats.map(s => s.failed),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 1
      },
      {
        label: 'Running',
        data: weeklyStats.map(s => s.running),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1
      },
      {
        label: 'Cancelled',
        data: weeklyStats.map(s => s.cancelled),
        backgroundColor: 'rgba(255, 159, 64, 0.6)',
        borderColor: 'rgb(255, 159, 64)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Pipeline Run Statistics (Last 7 Days)',
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        beginAtZero: true,
      },
    },
  };

  const items = [
    { key: 'total', label: 'Total', children: loading.today ? renderSkeletonStatistics() : renderStatistics(todayStats.total) },
    { key: 'streaming', label: 'Streaming', children: loading.today ? renderSkeletonStatistics() : renderStatistics(todayStats.streaming) },
    { key: 'integration', label: 'Integration', children: loading.today ? renderSkeletonStatistics() : renderStatistics(todayStats.integration) },
    { key: 'standard', label: 'Standard', children: loading.today ? renderSkeletonStatistics() : renderStatistics(todayStats.standard) },
  ];

  const renderContent = () => (
    <>
      <Card 
        title={<Title level={4}>Today's Statistics</Title>} 
        className="dashboard-card"
      >
        <Tabs defaultActiveKey="total" items={items} />
      </Card>
      
      <Card 
        title={<Title level={4}>Weekly Trend</Title>} 
        className="dashboard-card"
      >
        <div className="chart-container">
          {loading.weekly ? renderSkeletonChart() : <Bar data={chartData} options={chartOptions} />}
        </div>
      </Card>
    </>
  );

  return (
    <Layout className="dashboard-layout">
      <Content className="dashboard-content">
        <div className="dashboard-header">
          <Title level={2}>Pipeline Run Statistics</Title>
          <Text type="secondary">Real-time overview of pipeline performance and status</Text>
        </div>
        <div className="content-wrapper">
          {renderContent()}
        </div>
      </Content>
    </Layout>
  );
};

export default Dashboard;
