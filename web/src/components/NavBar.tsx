import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  TextField,
  Autocomplete,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface SearchResult {
  id: number;
  name: string;
}

const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/search/${encodeURIComponent(query)}`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      } else {
        console.error('Search failed:', response.statusText);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSelect = (event: React.SyntheticEvent, value: SearchResult | null) => {
    if (value) {
      navigate(`/item/${value.id}`);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const navigationItems = [
    { label: 'Crafting Planner', path: '/crafting-planner' },
    { label: 'Group Crafting', path: '/group-crafting' },
    { label: 'Help', path: '/help' },
  ];

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ cursor: 'pointer', mr: 4 }}
          onClick={() => navigate('/')}
        >
          Frontier Crafter
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mr: 'auto' }}>
          {navigationItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        <Box sx={{ minWidth: 300 }}>
          <Autocomplete
            options={searchResults}
            getOptionLabel={(option) => option.name}
            loading={loading}
            inputValue={searchQuery}
            value={null}
            onInputChange={(event, newInputValue) => {
              setSearchQuery(newInputValue);
            }}
            onChange={handleSearchSelect}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search items..."
                variant="outlined"
                size="small"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'white' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'white',
                    },
                    '& input': {
                      color: 'white',
                    },
                    '& input::placeholder': {
                      color: 'rgba(255, 255, 255, 0.7)',
                      opacity: 1,
                    },
                  },
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name}
              </li>
            )}
            noOptionsText={searchQuery ? "No items found" : "Start typing to search..."}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar; 