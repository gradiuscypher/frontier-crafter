import React from 'react';
import {
  Typography,
  Box,
  Paper,
  Alert,
} from '@mui/material';

const GroupCrafting: React.FC = () => {
  return (
    <Box>
      <Typography variant="h3" component="h1" gutterBottom>
        Group Crafting
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Coming Soon
        </Typography>
        <Typography variant="body1" paragraph>
          The Group Crafting feature will enable collaborative manufacturing planning,
          resource sharing coordination, and team production management.
        </Typography>
        <Alert severity="info">
          This feature is currently under development. Check back soon for updates!
        </Alert>
      </Paper>
    </Box>
  );
};

export default GroupCrafting; 