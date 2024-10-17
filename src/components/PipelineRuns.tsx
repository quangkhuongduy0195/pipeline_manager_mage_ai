import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Button, 
  Box, 
  CircularProgress, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Tooltip,
  useMediaQuery,
  useTheme,
  alpha,
  tableCellClasses
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import HelpIcon from '@mui/icons-material/Help';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import { fetchPipelineRuns, togglePipelineSchedule, runPipelineOnce } from '../services/api';
import { formatDate } from '../utils/dateUtils';
import { useTrail, animated } from 'react-spring';

interface PipelineRun {
  id: string;
  status: string;
  started_at: string;
  completed_at: string;
}

const AnimatedTableRow = animated(TableRow);

const PipelineRuns: React.FC = () => {
  const { scheduleId, name, token, status: initialStatus } = useParams<{ scheduleId: string; name: string; token: string; status: string }>();
  const navigate = useNavigate();
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(initialStatus);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const loadPipelineRuns = async () => {
      if (!scheduleId) return;
      try {
        const data = await fetchPipelineRuns(scheduleId);
        setRuns(data.pipeline_runs);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching pipeline runs:', err);
        setError('Failed to load pipeline runs. Please try again later.');
        setLoading(false);
      }
    };

    loadPipelineRuns();
  }, [scheduleId]);

  const handleBack = () => {
    navigate(-1);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'running':
        return <HourglassEmptyIcon color="primary" />;
      default:
        return <HelpIcon color="disabled" />;
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
        // Cập nhật URL với trạng thái mới
        navigate(`/pipelines/${scheduleId}/runs/${name}/${token}/${response.pipeline_schedule.status}`, { replace: true });
      }
    } catch (err) {
      console.error('Error toggling pipeline schedule:', err);
      setError('Failed to toggle pipeline schedule. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunOnce = async () => {
    if (!scheduleId || !token) return;
    try {
      setLoading(true);
      const response = await runPipelineOnce(scheduleId, token);
      // Xử lý response nếu cần
      console.log('Pipeline run started:', response);
      // Refresh danh sách runs
      const updatedRuns = await fetchPipelineRuns(scheduleId);
      setRuns(updatedRuns.pipeline_runs);
    } catch (err) {
      console.error('Error running pipeline:', err);
      setError('Failed to start pipeline run. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTrigger = () => {
    // Implement edit trigger logic
    console.log('Edit trigger clicked');
  };

  const trail = useTrail(runs.length, {
    from: { opacity: 0, transform: 'scale(0.9)' },
    to: { opacity: 1, transform: 'scale(1)' },
    config: {
      tension: 1000,
      friction: 50
    },
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: isSmallScreen ? 'auto' : 'hidden',
      p: 3
    }}>
      <Box sx={{ mb: 4 }}> {/* Increase bottom margin */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ color: 'white', fontWeight: 'bold' }}
          >
            Pipeline Schedules
          </Button>
          <Typography
            component="h1" 
            sx={{ 
              display: { xs: 'none', sm: 'block' },
              color: 'white',
              fontWeight: 'bold'
            }}>
            / {decodeURIComponent(name || '')}
          </Typography>
        </Box>
        <Box sx={{ 
          mb: 3, 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          alignItems: 'center',
          gap: 2 // Add gap between buttons
        }}>
          <Tooltip title={status === 'active' ? 'Disable Trigger' : 'Enable Trigger'}>
            <Button
              startIcon={status === 'active' ? <PauseCircleOutlineIcon /> : <PlayCircleOutlineIcon />}
              onClick={handleDisableTrigger}
              variant="contained"
              color="primary"
              sx={{ width: { xs: '100%', sm: 'auto' } }}
              disabled={loading}
            >
              {status === 'active' ? 'Disable Trigger' : 'Enable Trigger'}
            </Button>
          </Tooltip>
          <Tooltip title="Run@once">
            <Button
              startIcon={<PlayCircleOutlineIcon />}
              onClick={handleRunOnce}
              variant="contained"
              color="secondary"
              sx={{ width: { xs: '100%', sm: 'auto' } }}
              disabled={loading}
            >
              Run@once
            </Button>
          </Tooltip>
          <Tooltip title="Edit Trigger">
            <Button
              startIcon={<EditIcon />}
              onClick={handleEditTrigger}
              variant="outlined"
              color="primary"
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Edit Trigger
            </Button>
          </Tooltip>
        </Box>
      </Box>
      <TableContainer 
        component={Paper} 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          boxShadow: 3,
          backgroundColor: alpha(theme.palette.background.paper, 0.01), // Adjust opacity here
          backdropFilter: 'blur(1px)' // This adds a blur effect
        }}
      >
        <Table stickyHeader sx={{
          [`& .${tableCellClasses.root}`]: {
            borderBottom: "0.5px solid #1976d2",
          }
        }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: alpha(theme.palette.primary.main, 1), color: 'white' }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: alpha(theme.palette.primary.main, 1), color: 'white' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: alpha(theme.palette.primary.main, 1), color: 'white' }}>Started At</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: alpha(theme.palette.primary.main, 1), color: 'white' }}>Finished At</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: alpha(theme.palette.primary.main, 1), color: 'white' }}>Execution Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trail.map((style, index) => (
              <AnimatedTableRow 
                key={runs[index].id}
                style={style}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  },
                }}
              >
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{runs[index].id}</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {getStatusIcon(runs[index].status || '')}
                    <Typography sx={{ ml: 1 }}>{runs[index].status || 'N/A'}</Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{runs[index].started_at ? formatDate(runs[index].started_at) : 'N/A'}</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{runs[index].completed_at ? formatDate(runs[index].completed_at) : 'N/A'}</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{runs[index].completed_at || runs[index].started_at ? calculateExecutionTime(runs[index].started_at, runs[index].completed_at) : 'N/A'}</TableCell>
              </AnimatedTableRow>
            ))}
            {runs.length === 0 && (
              <TableRow>
              <TableCell colSpan={5}>
                  <Typography sx={{ mt: 4, color: 'white', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    No pipeline runs found for this schedule.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PipelineRuns;
