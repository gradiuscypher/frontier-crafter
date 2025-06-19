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
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
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
