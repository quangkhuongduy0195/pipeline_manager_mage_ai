import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, Tabs, message, Typography, Layout, Tooltip } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, SyncOutlined, PauseCircleOutlined, BarChartOutlined } from '@ant-design/icons';
import { fetchMonitorStats } from '../services/api';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title as ChartTitle, Tooltip as ChartTooltip, Legend, ChartOptions } from 'chart.js';
import { subDays, format } from 'date-fns';
import '../styles/Dashboard.css';
import { useHeader } from '../contexts/HeaderContext';

const { Title, Text } = Typography;
const { Content } = Layout;

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, ChartTooltip, Legend);

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
        const startDate = subDays(endDate, 6); // 7 days including today
        const dates: string[] = [];
        for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
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
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      },
      {
        label: 'Failed',
        data: weeklyStats.map(s => s.failed),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1
      },
      {
        label: 'Running',
        data: weeklyStats.map(s => s.running),
        borderColor: 'rgb(54, 162, 235)',
        tension: 0.1
      },
      {
        label: 'Cancelled',
        data: weeklyStats.map(s => s.cancelled),
        borderColor: 'rgb(255, 159, 64)',
        tension: 0.1
      }
    ]
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  const items = [
    { key: 'total', label: 'Total', children: renderStatistics(todayStats.total) },
    { key: 'streaming', label: 'Streaming', children: renderStatistics(todayStats.streaming) },
    { key: 'integration', label: 'Integration', children: renderStatistics(todayStats.integration) },
    { key: 'standard', label: 'Standard', children: renderStatistics(todayStats.standard) },
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout className="dashboard-layout">
      <Content className="dashboard-content">
        <div className="content-wrapper">
          <div className="dashboard-header">
            <Title level={2}>Pipeline Run Statistics</Title>
            <Text type="secondary">Real-time overview of pipeline performance and status</Text>
          </div>
          
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
              <Line data={chartData} options={chartOptions} />
            </div>
          </Card>
        </div>
      </Content>
    </Layout>
  );
};

export default Dashboard;
