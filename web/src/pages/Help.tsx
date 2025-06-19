import React from 'react';
import {
  Typography,
  Box,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const Help: React.FC = () => {
  const faqs = [
    {
      question: 'How do I search for items?',
      answer: 'Use the search bar in the top navigation. Start typing an item name and select from the dropdown results to view its blueprints.',
    },
    {
      question: 'What information is shown for each item?',
      answer: 'Each item shows its blueprints, required materials, production time, structures needed, and production quantities.',
    },
    {
      question: 'How does the API work?',
      answer: 'The application uses a FastAPI backend that provides endpoints for searching items and retrieving blueprint details.',
    },
  ];

  return (
    <Box>
      <Typography variant="h3" component="h1" gutterBottom>
        Help & Documentation
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Getting Started
        </Typography>
        <Typography variant="body1" paragraph>
          Welcome to Frontier Crafter! This tool helps you plan and manage your EVE Online
          manufacturing operations. Use the search functionality to find items and explore
          their production requirements.
        </Typography>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Frequently Asked Questions
        </Typography>
        {faqs.map((faq, index) => (
          <Accordion key={index}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">{faq.question}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2">{faq.answer}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Technical Information
        </Typography>
        <Typography variant="body1" paragraph>
          This application is built with:
        </Typography>
        <ul>
          <li>React with TypeScript</li>
          <li>Material UI for the user interface</li>
          <li>FastAPI backend for data processing</li>
          <li>EVE Online blueprint data</li>
        </ul>
      </Paper>
    </Box>
  );
};

export default Help; 