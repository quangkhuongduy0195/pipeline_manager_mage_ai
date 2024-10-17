import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Button, 
  Box, 
  CircularProgress, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery,
  alpha,
  tableCellClasses
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { fetchPipelineSchedules } from '../services/api';
import { defineCron, formatDate } from '../utils/dateUtils';
import { useTrail, animated } from 'react-spring';

interface PipelineSchedule {
  id: string;
  name: string;
  schedule_interval: string | null;
  status: 'active' | 'inactive';
  next_pipeline_run_date: string | null;
  last_enabled_at: string | null;
  last_pipeline_run_status: 'success' | 'failed' | 'running' | null;
  token: string;
}

const AnimatedTableRow = animated(TableRow);

const PipelineSchedules: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [schedules, setSchedules] = useState<PipelineSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const loadSchedules = async () => {
      if (!id) return;
      try {
        const data = await fetchPipelineSchedules(id);
        setSchedules(data.pipeline_schedules);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching pipeline schedules:', err);
        setError('Failed to load pipeline schedules. Please try again later.');
        setLoading(false);
      }
    };

    loadSchedules();
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'running':
        return 'info';
      default:
        return 'warning';
    }
  };

  const trail = useTrail(schedules.length, {
    from: { opacity: 0, transform: 'scale(0.9)' },
    to: { opacity: 1, transform: 'scale(1)' },
    config: {
      tension: 1000,
      friction: 50
    },
  });

  const handleRowClick = (id: string, name: string, token: string, status: string) => {
    navigate(`/pipelines/${id}/runs/${encodeURIComponent(name)}/${token}/${status}`);
  };

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
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Back to Pipelines
          </Button>
          <Typography 
            variant="h6" 
            component="h1" 
            sx={{ 
              color: theme.palette.primary.main,
            }}
          >
            / {decodeURIComponent(id || '')}
          </Typography>
        </Box>
      </Box>
      
      <TableContainer 
        component={Paper} 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          boxShadow: 3,
          backgroundColor: alpha(theme.palette.background.paper, 0.01),
          backdropFilter: 'blur(1px)'
        }}
      >
        <Table stickyHeader sx={{
          [`& .${tableCellClasses.root}`]: {
            borderBottom: "0.5px solid #1976d2",
          }
        }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: alpha(theme.palette.primary.main, 1), color: 'white' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: alpha(theme.palette.primary.main, 1), color: 'white' }}>Cron</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: alpha(theme.palette.primary.main, 1), color: 'white' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: alpha(theme.palette.primary.main, 1), color: 'white' }}>Next Run</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: alpha(theme.palette.primary.main, 1), color: 'white' }}>Last Run</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: alpha(theme.palette.primary.main, 1), color: 'white' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trail.map((style, index) => (
              <AnimatedTableRow 
                key={schedules[index].id}
                onClick={() => handleRowClick(schedules[index].id, schedules[index].name, schedules[index].token, schedules[index].status)}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  },
                }}
                style={style}
              >
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{schedules[index].name}</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                  <Typography variant="body2" fontWeight="bold">
                    {schedules[index].schedule_interval || 'N/A'}
                  </Typography>
                  <Typography variant="caption">
                    {schedules[index].schedule_interval ? defineCron(schedules[index].schedule_interval) : 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                  <Chip
                    label={schedules[index].status} 
                    color={schedules[index].status === 'active' ? 'success' : 'info'}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{schedules[index].next_pipeline_run_date ? formatDate(schedules[index].next_pipeline_run_date) : 'N/A'}</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                  {schedules[index].last_enabled_at ? formatDate(schedules[index].last_enabled_at) : 'N/A'}
                  <Chip 
                    label={schedules[index].last_pipeline_run_status || 'N/A'} 
                    color={getStatusColor(schedules[index].last_pipeline_run_status)}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle edit action
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle delete action
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </AnimatedTableRow>
            ))}
            
            {schedules.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography sx={{ mt: 4, color: 'white', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    No schedules found for this pipeline.
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

export default PipelineSchedules;
