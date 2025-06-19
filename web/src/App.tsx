import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import NavBar from './components/NavBar';
import HomePage from './pages/HomePage';
import CraftingPlanner from './pages/CraftingPlanner';
import GroupCrafting from './pages/GroupCrafting';
import Help from './pages/Help';
import ItemDetails from './pages/ItemDetails';
import './App.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#616161', // Medium grey
      light: '#8e8e8e',
      dark: '#373737',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#424242', // Dark grey
      light: '#6d6d6d',
      dark: '#1b1b1b',
      contrastText: '#ffffff',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Remove uppercase transformation
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: '#e0e0e0',
          color: '#424242',
          '&.MuiChip-outlined': {
            borderColor: '#bdbdbd',
          },
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <NavBar />
        <Container maxWidth="lg" sx={{ mt: 2 }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/crafting-planner" element={<CraftingPlanner />} />
            <Route path="/group-crafting" element={<GroupCrafting />} />
            <Route path="/help" element={<Help />} />
            <Route path="/item/:itemId" element={<ItemDetails />} />
          </Routes>
        </Container>
      </Router>
    </ThemeProvider>
  );
}

export default App;
