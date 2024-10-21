import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, Tabs, message, Typography, Layout, Tooltip, Skeleton } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, SyncOutlined, PauseCircleOutlined, BarChartOutlined } from '@ant-design/icons';
import { fetchMonitorStats } from '../services/api';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title as ChartTitle, Tooltip as ChartTooltip, Legend, ChartOptions } from 'chart.js';
import { format, subMonths } from 'date-fns';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTitle('Dashboard');
    setShowBackButton(false);
    const fetchStats = async () => {
      try {
        const endDate = new Date();
        //const startDate = subDays(endDate, 6); // 7 days including today
        const startMonthDate = subMonths(endDate, 1);
        const dates: string[] = [];
        for (let d = startMonthDate; d <= endDate; d.setDate(d.getDate() + 1)) {
          dates.push(format(d, 'yyyy-MM-dd'));
        }

        const statsPromises = dates.map(date => fetchMonitorStats(date));
        const statsResults = await Promise.all(statsPromises);

        const processedWeeklyStats = statsResults.map((result, index) => {
          const dailyStats = calculateDailyStats(result.monitor_stat.stats);
          return { date: dates[index], ...dailyStats };
        });

        setWeeklyStats(processedWeeklyStats);

        // Set today's stats
        const todayResult = statsResults[statsResults.length - 1];
        const todayPipelineStats = calculateStats(todayResult.monitor_stat.stats);
        setTodayStats(todayPipelineStats);
      } catch (error) {
        console.error('Error fetching monitor stats:', error);
        message.error('Failed to fetch statistics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const calculateStats = (data: Record<string, any>): PipelineStats => {
    const stats: PipelineStats = JSON.parse(JSON.stringify(initialStats));
    Object.values(data).forEach((pipeline: any) => {
      const dateData = pipeline.data[Object.keys(pipeline.data)[0]];
      Object.entries(dateData).forEach(([pipelineType, typeData]: [string, any]) => {
        const pipelineCategory = pipelineType === 'streaming' ? 'streaming' :
                                 pipelineType === 'integration' ? 'integration' : 'standard';
        Object.entries(typeData).forEach(([status, count]) => {
          if (typeof count === 'number') {
            const statusKey = status as keyof PipelineTypeStats;
            stats[pipelineCategory][statusKey] += count;
            stats.total[statusKey] += count;
          }
        });
      });
    });
    return stats;
  };

  const calculateDailyStats = (data: Record<string, any>): Omit<DailyStats, 'date'> => {
    const dailyStats = { completed: 0, failed: 0, running: 0, cancelled: 0 };
    Object.values(data).forEach((pipeline: any) => {
      const dateData = pipeline.data[Object.keys(pipeline.data)[0]];
      Object.values(dateData).forEach((typeData: any) => {
        Object.entries(typeData).forEach(([status, count]) => {
          if (typeof count === 'number' && status in dailyStats) {
            dailyStats[status as keyof typeof dailyStats] += count;
          }
        });
      });
    });
    return dailyStats;
  };

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
    { key: 'total', label: 'Total', children: renderStatistics(todayStats.total) },
    { key: 'streaming', label: 'Streaming', children: renderStatistics(todayStats.streaming) },
    { key: 'integration', label: 'Integration', children: renderStatistics(todayStats.integration) },
    { key: 'standard', label: 'Standard', children: renderStatistics(todayStats.standard) },
  ];

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
          <Bar data={chartData} options={chartOptions} />
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
          {loading ? (
            <>
              <Card 
                title={<Skeleton.Input style={{ width: 200 }} active size="small" />}
                className="dashboard-card"
              >
                {renderSkeletonStatistics()}
              </Card>
              <Card 
                title={<Skeleton.Input style={{ width: 200 }} active size="small" />}
                className="dashboard-card"
              >
                {renderSkeletonChart()}
              </Card>
            </>
          ) : renderContent()}
        </div>
      </Content>
    </Layout>
  );
};

export default Dashboard;
