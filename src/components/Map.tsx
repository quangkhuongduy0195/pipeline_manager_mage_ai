import React from 'react';
import { Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Map: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Map
      </Typography>
      <Button variant="contained" onClick={() => navigate(-1)}>
        Back
      </Button>
    </Box>
  );
};

export default Map;
