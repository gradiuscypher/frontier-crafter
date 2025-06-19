import React from 'react';
import {
  Typography,
  Box,
  Paper,
  Alert,
} from '@mui/material';

const CraftingPlanner: React.FC = () => {
  return (
    <Box>
      <Typography variant="h3" component="h1" gutterBottom>
        Crafting Planner
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Coming Soon
        </Typography>
        <Typography variant="body1" paragraph>
          The Crafting Planner will help you plan complex manufacturing operations,
          calculate material requirements, and optimize your production chains.
        </Typography>
        <Alert severity="info">
          This feature is currently under development. Check back soon for updates!
        </Alert>
      </Paper>
    </Box>
  );
};

export default CraftingPlanner; 