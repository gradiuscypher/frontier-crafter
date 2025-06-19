import React from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import BuildIcon from '@mui/icons-material/Build';
import GroupIcon from '@mui/icons-material/Group';
import HelpIcon from '@mui/icons-material/Help';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Crafting Planner',
      description: 'Plan your crafting operations with detailed blueprints and material requirements.',
      icon: <BuildIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      path: '/crafting-planner',
    },
    {
      title: 'Group Crafting',
      description: 'Coordinate crafting activities with your team and optimize resource allocation.',
      icon: <GroupIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      path: '/group-crafting',
    },
    {
      title: 'Help & Documentation',
      description: 'Learn how to use the Frontier Crafter tools and get support.',
      icon: <HelpIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      path: '/help',
    },
  ];

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to Frontier Crafter
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
          Your comprehensive tool for EVE Online crafting and production planning
        </Typography>
        <Paper sx={{ p: 3, backgroundColor: 'primary.main', color: 'white' }}>
          <Typography variant="h6" gutterBottom>
            Getting Started
          </Typography>
          <Typography>
            Use the search bar above to find items, view their blueprints, and plan your crafting operations.
            Explore the different tools available to optimize your manufacturing workflow.
          </Typography>
        </Paper>
      </Box>

      <Grid container spacing={4}>
        {features.map((feature, index) => (
          <Grid size={{ xs: 12, md: 4 }} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 4 }}>
                <Box sx={{ mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                <Button 
                  variant="contained" 
                  onClick={() => navigate(feature.path)}
                  size="large"
                >
                  Get Started
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default HomePage; 