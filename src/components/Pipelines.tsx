import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  CircularProgress, 
  Box,
  Chip,
  Modal,
  Paper
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { fetchPipelines } from '../services/api';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useNavigate } from 'react-router-dom';
import { useTrail, animated, config } from 'react-spring';

interface Pipeline {
  uuid: string;
  name: string;
  description?: string;
  status?: string;
}

const AnimatedGrid = animated(Grid);

const Pipelines: React.FC = () => {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPipelines = async () => {
      try {
        const data = await fetchPipelines();
        setPipelines(data.pipelines);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching pipelines:', err);
        setError('Failed to load pipelines. Please try again later.');
        setLoading(false);
      }
    };

    loadPipelines();
  }, []);

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedPipeline(null);
  };

  const handlePipelineClick = (pipelineId: string) => {
    navigate(`/pipelines/${pipelineId}/schedules`);
  };

  const trail = useTrail(pipelines.length, {
    from: { opacity: 0, transform: 'translate3d(0,40px,0)' },
    to: { opacity: 1, transform: 'translate3d(0,0px,0)' },
    config: config.gentle,
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
    <Box sx={{ height: '100%', overflow: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#1976d2' }}>
        Pipelines
      </Typography>
      <Grid container spacing={3} justifyContent="start" alignItems="center">
        {trail.map((style, index) => (
          <AnimatedGrid
            size={{xs:12, sm:6, md:4, lg:3}}
            columnSpacing={{xs:12, sm:6, md:4, lg:3}}
            rowSpacing={{xs:12, sm:6, md:4, lg:3}}
            key={pipelines[index].uuid}
            container
            justifyContent="center"
            alignItems="center"
            style={style}
          >
            <Card 
              sx={{ 
                height: '100%',
                width: '100%',
                display: 'flex', 
                flexDirection: 'column',
                cursor: 'pointer'
              }}
              onClick={() => handlePipelineClick(pipelines[index].uuid)}
            >
              <CardContent sx={{ flexGrow: 1, width: '100%', textAlign: 'left' }}>
                <Typography variant="h6" component="div" gutterBottom noWrap>
                  {pipelines[index].name}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    height: '3em',
                  }}
                >
                  {pipelines[index].description || 'No description available'}
                </Typography>
                {pipelines[index].status && (
                  <Box display="flex" justifyContent="center" mt={1}>
                    <Chip 
                      label={pipelines[index].status} 
                      color={pipelines[index].status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                )}
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                <Button size="small" variant="contained" startIcon={<PlayArrowIcon />}>
                  Run
                </Button>
              </CardActions>
            </Card>
          </AnimatedGrid>
        ))}
      </Grid>
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="pipeline-detail-modal"
        aria-describedby="pipeline-detail-description"
      >
        <Paper sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
        }}>
          <Typography id="pipeline-detail-modal" variant="h6" component="h2">
            {selectedPipeline?.name}
          </Typography>
          <Typography id="pipeline-detail-description" sx={{ mt: 2 }}>
            {selectedPipeline?.description || 'No description available'}
          </Typography>
          <Typography sx={{ mt: 2 }}>
            Status: {selectedPipeline?.status || 'Unknown'}
          </Typography>
          <Button onClick={handleCloseModal} sx={{ mt: 2 }}>
            Close
          </Button>
        </Paper>
      </Modal>
    </Box>
  );
};

export default Pipelines;
