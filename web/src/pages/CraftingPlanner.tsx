import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Autocomplete,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Download as ImportIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

interface CraftingSessionInfo {
  id: string;
  name: string;
  createdAt: string;
  url: string;
}

interface CraftingTarget {
  id: number;
  item_id: number;
  needed_quantity: number;
  blueprint_id: number;
  crafted_quantity: number;
}

interface SearchResult {
  id: number;
  name: string;
}

interface Blueprint {
  bp_id: number;
  structures: string[];
  materials: { typeID: number; quantity: number; name: string }[];
  time: number;
  max_production: number;
  product_count: number;
  product_name: string;
}

const API_BASE_URL = 'http://localhost:8000';

const CraftingPlanner: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [sessions, setSessions] = useState<CraftingSessionInfo[]>([]);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importSessionName, setImportSessionName] = useState('');
  const [sessionToImport, setSessionToImport] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const [sessionTargets, setSessionTargets] = useState<CraftingTarget[]>([]);
  const [loadingTargets, setLoadingTargets] = useState(false);

  // New search and add target states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addTargetDialogOpen, setAddTargetDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const [availableBlueprints, setAvailableBlueprints] = useState<Blueprint[]>([]);
  const [selectedBlueprint, setSelectedBlueprint] = useState<number | ''>('');
  const [targetQuantity, setTargetQuantity] = useState<number>(1);
  const [loadingBlueprints, setLoadingBlueprints] = useState(false);

  // New states for item names and bill of materials
  const [itemNames, setItemNames] = useState<Record<number, string>>({});
  const [billOfMaterials, setBillOfMaterials] = useState<Record<number, { name: string; quantity: number }>>({});
  const [loadingBillOfMaterials, setLoadingBillOfMaterials] = useState(false);
  const [ownedMaterials, setOwnedMaterials] = useState<Record<number, number>>({});

  // Load sessions from localStorage on component mount
  useEffect(() => {
    console.log('Loading sessions from localStorage...');
    const savedSessions = localStorage.getItem('crafting-sessions');
    console.log('Raw localStorage content:', savedSessions);
    
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        console.log('Parsed sessions:', parsed);
        setSessions(parsed);
      } catch (error) {
        console.error('Error parsing saved sessions:', error);
        localStorage.removeItem('crafting-sessions'); // Clear corrupted data
      }
    }
    
    setHasLoadedFromStorage(true); // Mark that we've loaded from storage

    // Check if there's a session ID in the URL (shared link takes priority)
    const sessionIdFromUrl = searchParams.get('session');
    if (sessionIdFromUrl) {
      console.log('Found session in URL:', sessionIdFromUrl);
      setCurrentSessionId(sessionIdFromUrl);
      // Save to localStorage for persistence
      localStorage.setItem('current-session-id', sessionIdFromUrl);
      // Verify the session exists on the server
      verifySession(sessionIdFromUrl);
    } else {
      // No URL session parameter, check localStorage for last selected session
      const savedCurrentSession = localStorage.getItem('current-session-id');
      if (savedCurrentSession) {
        console.log('Found saved current session:', savedCurrentSession);
        setCurrentSessionId(savedCurrentSession);
        // Add to URL for consistency (but don't trigger reload)
        setSearchParams({ session: savedCurrentSession });
        // Verify the session still exists on the server
        verifySession(savedCurrentSession);
      }
    }
  }, [searchParams]);

  // Save sessions to localStorage whenever sessions change (but only after initial load)
  useEffect(() => {
    if (!hasLoadedFromStorage) {
      console.log('Skipping save - not loaded from storage yet');
      return;
    }
    
    console.log('Saving sessions to localStorage:', sessions);
    localStorage.setItem('crafting-sessions', JSON.stringify(sessions));
    
    // Verify it was saved
    const saved = localStorage.getItem('crafting-sessions');
    console.log('Verified localStorage content:', saved);
  }, [sessions, hasLoadedFromStorage]);

  // Save current session ID to localStorage whenever it changes
  useEffect(() => {
    if (currentSessionId) {
      console.log('Saving current session ID to localStorage:', currentSessionId);
      localStorage.setItem('current-session-id', currentSessionId);
    } else {
      console.log('Clearing current session ID from localStorage');
      localStorage.removeItem('current-session-id');
    }
  }, [currentSessionId]);

  // Check if current session should be imported (after sessions are loaded)
  useEffect(() => {
    if (hasLoadedFromStorage && currentSessionId) {
      const existingSession = sessions.find(session => session.id === currentSessionId);
      if (!existingSession) {
        // Session not in local storage, offer to import it
        console.log('Session not found in local storage, offering to import:', currentSessionId);
        setSessionToImport(currentSessionId);
        fetchSessionForImport(currentSessionId);
      }
    }
  }, [hasLoadedFromStorage, currentSessionId, sessions]);

  const verifySession = async (sessionId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/crafting-session/${sessionId}`);
      if (!response.ok) {
        setSnackbar({ 
          open: true, 
          message: 'Session not found or invalid', 
          severity: 'error' 
        });
        // Remove invalid session from URL
        setSearchParams({});
        setCurrentSessionId(null);
      } else {
        // If session is valid, fetch its targets
        fetchSessionTargets(sessionId);
      }
    } catch (error) {
      console.error('Error verifying session:', error);
      setSnackbar({ 
        open: true, 
        message: 'Error connecting to server', 
        severity: 'error' 
      });
    }
  };

  const fetchSessionTargets = async (sessionId: string) => {
    setLoadingTargets(true);
    try {
      const response = await fetch(`${API_BASE_URL}/crafting-session/${sessionId}/targets`);
      if (response.ok) {
        const targets = await response.json();
        setSessionTargets(targets);
        // Fetch item names and calculate bill of materials
        await fetchItemNamesForTargets(targets);
        await calculateBillOfMaterials(targets);
      } else {
        console.error('Failed to fetch session targets');
        setSessionTargets([]);
      }
    } catch (error) {
      console.error('Error fetching session targets:', error);
      setSessionTargets([]);
    } finally {
      setLoadingTargets(false);
    }
  };

  const fetchItemNamesForTargets = async (targets: CraftingTarget[]) => {
    const nameMap: Record<number, string> = {};
    
    // Get unique item IDs
    const itemIds = [...new Set(targets.map(t => t.item_id))];
    
    // Fetch names for each item from the blueprint endpoint
    for (const itemId of itemIds) {
      try {
        const response = await fetch(`${API_BASE_URL}/items/${itemId}`);
        if (response.ok) {
          const blueprints: Blueprint[] = await response.json();
          if (blueprints.length > 0) {
            nameMap[itemId] = blueprints[0].product_name;
          }
        }
      } catch (error) {
        console.error(`Error fetching name for item ${itemId}:`, error);
      }
    }
    
    setItemNames(nameMap);
  };

  const calculateBillOfMaterials = async (targets: CraftingTarget[]) => {
    setLoadingBillOfMaterials(true);
    const materialTotals: Record<number, { name: string; quantity: number }> = {};
    
    try {
      for (const target of targets) {
        // Fetch blueprint details for this target
        const response = await fetch(`${API_BASE_URL}/items/${target.item_id}`);
        if (response.ok) {
          const blueprints: Blueprint[] = await response.json();
          const blueprint = blueprints.find(bp => bp.bp_id === target.blueprint_id);
          
          if (blueprint) {
            // Calculate how many runs needed
            const runsNeeded = Math.ceil(target.needed_quantity / blueprint.product_count);
            
            // Add materials to totals
            for (const material of blueprint.materials) {
              const totalNeeded = material.quantity * runsNeeded;
              
              if (materialTotals[material.typeID]) {
                materialTotals[material.typeID].quantity += totalNeeded;
              } else {
                materialTotals[material.typeID] = {
                  name: material.name,
                  quantity: totalNeeded
                };
              }
            }
          }
        }
      }
      
      setBillOfMaterials(materialTotals);
    } catch (error) {
      console.error('Error calculating bill of materials:', error);
    } finally {
      setLoadingBillOfMaterials(false);
    }
  };

  const fetchSessionForImport = async (sessionId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/crafting-session/${sessionId}`);
      if (response.ok) {
        setImportSessionName(`Imported Session - ${new Date().toLocaleDateString()}`);
        setImportDialogOpen(true);
      }
    } catch (error) {
      console.error('Error fetching session for import:', error);
    }
  };

  const importSession = () => {
    if (!sessionToImport || !importSessionName.trim()) {
      setSnackbar({ 
        open: true, 
        message: 'Please enter a session name', 
        severity: 'error' 
      });
      return;
    }

    const sessionUrl = `${window.location.origin}/crafting-planner?session=${sessionToImport}`;
    
    const newSession: CraftingSessionInfo = {
      id: sessionToImport,
      name: importSessionName.trim(),
      createdAt: new Date().toISOString(),
      url: sessionUrl,
    };

    setSessions(prev => {
      // Check if session already exists to avoid duplicates
      if (prev.some(session => session.id === sessionToImport)) {
        return prev;
      }
      return [...prev, newSession];
    });

    setImportDialogOpen(false);
    setImportSessionName('');
    setSessionToImport(null);
    
    setSnackbar({ 
      open: true, 
      message: 'Session imported successfully!', 
      severity: 'success' 
    });
  };

  const createNewSession = async () => {
    if (!newSessionName.trim()) {
      setSnackbar({ 
        open: true, 
        message: 'Please enter a session name', 
        severity: 'error' 
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/crafting-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const sessionId = await response.json();
      console.log('API Response - Session ID:', sessionId, 'Type:', typeof sessionId);
      
      const sessionUrl = `${window.location.origin}/crafting-planner?session=${sessionId}`;
      
      const newSession: CraftingSessionInfo = {
        id: sessionId,
        name: newSessionName.trim(),
        createdAt: new Date().toISOString(),
        url: sessionUrl,
      };

      console.log('New session object:', newSession);
      
      setSessions(prev => {
        const updated = [...prev, newSession];
        console.log('Updated sessions array:', updated);
        return updated;
      });
      
      setCurrentSessionId(sessionId);
      setSearchParams({ session: sessionId });
      setIsCreateDialogOpen(false);
      setNewSessionName('');
      
      setSnackbar({ 
        open: true, 
        message: 'Session created successfully!', 
        severity: 'success' 
      });
    } catch (error) {
      console.error('Error creating session:', error);
      setSnackbar({ 
        open: true, 
        message: 'Failed to create session', 
        severity: 'error' 
      });
    }
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(session => session.id !== sessionId));
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
      setSearchParams({});
      // localStorage will be cleared by the useEffect when currentSessionId becomes null
    }
    setSnackbar({ 
      open: true, 
      message: 'Session deleted from local storage', 
      severity: 'success' 
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSnackbar({ 
        open: true, 
        message: 'URL copied to clipboard!', 
        severity: 'success' 
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setSnackbar({ 
        open: true, 
        message: 'Failed to copy to clipboard', 
        severity: 'error' 
      });
    }
  };

  const loadSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setSearchParams({ session: sessionId });
    fetchSessionTargets(sessionId);
  };

  // New search and add target functions
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/search/${encodeURIComponent(query)}`);
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
      setSearchLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearchSelect = async (_event: React.SyntheticEvent, value: SearchResult | null) => {
    if (value && currentSessionId) {
      setSelectedItem(value);
      setSearchQuery('');
      setSearchResults([]);
      
      // Fetch blueprints for the selected item
      setLoadingBlueprints(true);
      try {
        const response = await fetch(`${API_BASE_URL}/items/${value.id}`);
        if (response.ok) {
          const blueprints = await response.json();
          setAvailableBlueprints(blueprints);
          if (blueprints.length === 1) {
            // Auto-select if only one blueprint
            setSelectedBlueprint(blueprints[0].bp_id);
          } else {
            setSelectedBlueprint('');
          }
          setAddTargetDialogOpen(true);
        } else {
          setSnackbar({
            open: true,
            message: 'Failed to fetch item blueprints',
            severity: 'error'
          });
        }
      } catch (error) {
        console.error('Error fetching blueprints:', error);
        setSnackbar({
          open: true,
          message: 'Error fetching item blueprints',
          severity: 'error'
        });
      } finally {
        setLoadingBlueprints(false);
      }
    }
  };

  const addTargetToSession = async () => {
    if (!selectedItem || !selectedBlueprint || !currentSessionId || targetQuantity <= 0) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/crafting-session/${currentSessionId}/target`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_id: selectedItem.id,
          needed_quantity: targetQuantity,
          blueprint_id: selectedBlueprint,
          crafted_quantity: 0,
        }),
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Target item added successfully!',
          severity: 'success'
        });
        // Refresh session targets (this will also refresh item names and bill of materials)
        fetchSessionTargets(currentSessionId);
        // Close dialog and reset form
        setAddTargetDialogOpen(false);
        setSelectedItem(null);
        setSelectedBlueprint('');
        setTargetQuantity(1);
        setAvailableBlueprints([]);
      } else {
        throw new Error('Failed to add target');
      }
    } catch (error) {
      console.error('Error adding target:', error);
      setSnackbar({
        open: true,
        message: 'Failed to add target item',
        severity: 'error'
      });
    }
  };

  const currentSession = sessions.find(session => session.id === currentSessionId);

  return (
    <Box>
      <Typography variant="h3" component="h1" gutterBottom>
        Crafting Planner
      </Typography>
      
      {/* When viewing a session, show session details */}
      {currentSessionId && (
        <>
          {currentSession ? (
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <Typography variant="h6" gutterBottom>
                Current Session: {currentSession.name}
              </Typography>
              <Typography variant="body2">
                Session ID: {currentSessionId}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<CopyIcon />}
                  onClick={() => copyToClipboard(currentSession.url)}
                  sx={{ mr: 2 }}
                >
                  Copy Session URL
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setCurrentSessionId(null);
                    setSearchParams({});
                    setSessionTargets([]);
                  }}
                  sx={{ color: 'inherit', borderColor: 'currentColor' }}
                >
                  Leave Session
                </Button>
              </Box>
            </Paper>
          ) : (
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
              <Typography variant="h6" gutterBottom>
                Viewing Shared Session
              </Typography>
              <Typography variant="body2" gutterBottom>
                Session ID: {currentSessionId}
              </Typography>
              <Typography variant="body2" paragraph>
                This session is not saved to your local storage. You can import it to access it later.
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<ImportIcon />}
                  onClick={() => {
                    setSessionToImport(currentSessionId);
                    setImportSessionName(`Imported Session - ${new Date().toLocaleDateString()}`);
                    setImportDialogOpen(true);
                  }}
                  sx={{ mr: 2 }}
                >
                  Import Session
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setCurrentSessionId(null);
                    setSearchParams({});
                    setSessionTargets([]);
                  }}
                  sx={{ color: 'inherit', borderColor: 'currentColor' }}
                >
                  Leave Session
                </Button>
              </Box>
            </Paper>
          )}

          {/* Session Target Items */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" component="h2">
                Target Items
              </Typography>
              
              {/* Search interface for adding items */}
              <Box sx={{ minWidth: 300 }}>
                <Autocomplete
                  options={searchResults}
                  getOptionLabel={(option) => option.name}
                  loading={searchLoading}
                  inputValue={searchQuery}
                  value={null}
                  onInputChange={(_event, newInputValue) => {
                    setSearchQuery(newInputValue);
                  }}
                  onChange={handleSearchSelect}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search items to add..."
                      variant="outlined"
                      size="small"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
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
            </Box>
            
            {loadingTargets ? (
              <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
                Loading target items...
              </Typography>
            ) : sessionTargets.length === 0 ? (
              <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
                No target items added to this session yet. Use the search above to add items.
              </Typography>
            ) : (
              <Box 
                display="grid" 
                gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" 
                gap={2}
              >
                {sessionTargets.map((target) => (
                  <Card key={target.id}>
                    <CardContent>
                      <Typography variant="h6" component="h3" gutterBottom>
                        {itemNames[target.item_id] || `Item ID: ${target.item_id}`}
                        {itemNames[target.item_id] && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            ID: {target.item_id}
                          </Typography>
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Blueprint ID: {target.blueprint_id}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        Needed: {target.needed_quantity.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Crafted: {target.crafted_quantity.toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>

          {/* Bill of Materials Section */}
          {sessionTargets.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Total Bill of Materials
              </Typography>
              
              {loadingBillOfMaterials ? (
                <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
                  Calculating materials...
                </Typography>
              ) : Object.keys(billOfMaterials).length === 0 ? (
                <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
                  No materials calculated yet.
                </Typography>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                    Complete list of all materials needed to craft your target items:
                  </Typography>
                  
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Material</strong></TableCell>
                          <TableCell align="right"><strong>Total Needed</strong></TableCell>
                          <TableCell align="right"><strong>You Have</strong></TableCell>
                          <TableCell align="right"><strong>Still Need</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(billOfMaterials)
                          .sort(([, a], [, b]) => b.quantity - a.quantity) // Sort by quantity descending
                          .map(([materialId, material]) => {
                            const owned = ownedMaterials[parseInt(materialId)] || 0;
                            const stillNeed = Math.max(0, material.quantity - owned);
                            
                            return (
                              <TableRow key={materialId} hover>
                                <TableCell>
                                  <Box>
                                    <Typography variant="body2">
                                      {material.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      ID: {materialId}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2">
                                    {material.quantity.toLocaleString()}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={owned}
                                    onChange={(e) => {
                                      const value = Math.max(0, parseInt(e.target.value) || 0);
                                      setOwnedMaterials(prev => ({
                                        ...prev,
                                        [parseInt(materialId)]: value
                                      }));
                                    }}
                                    inputProps={{ 
                                      min: 0,
                                      style: { textAlign: 'right' }
                                    }}
                                    sx={{ width: 100 }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <Typography 
                                    variant="body2" 
                                    color={stillNeed > 0 ? 'error.main' : 'success.main'}
                                    fontWeight={stillNeed > 0 ? 'bold' : 'normal'}
                                  >
                                    {stillNeed.toLocaleString()}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  <Alert severity="info" sx={{ mt: 3 }}>
                    <Typography variant="body2">
                      <strong>Tip:</strong> Enter the quantities you already have in the "You Have" column 
                      to see what materials you still need to collect. Materials you still need are shown in red, 
                      while materials you have enough of are shown in green.
                    </Typography>
                  </Alert>
                </>
              )}
            </Paper>
          )}
        </>
      )}

      {/* When not viewing a session, show sessions list */}
      {!currentSessionId && (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" component="h2">
                My Crafting Sessions
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setIsCreateDialogOpen(true)}
              >
                Create New Session
              </Button>
            </Box>

            {sessions.length === 0 ? (
              <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
                No crafting sessions yet. Create your first session to start planning!
              </Typography>
            ) : (
              <Box 
                display="grid" 
                gridTemplateColumns="repeat(auto-fill, minmax(350px, 1fr))" 
                gap={2}
              >
                {sessions.map((session) => (
                  <Card key={session.id}>
                    <CardContent>
                      <Typography variant="h6" component="h3" noWrap gutterBottom>
                        {session.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Created: {new Date(session.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        ID: {session.id}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        onClick={() => loadSession(session.id)}
                      >
                        Load
                      </Button>
                      <IconButton 
                        size="small" 
                        onClick={() => copyToClipboard(session.url)}
                        title="Copy session URL"
                      >
                        <CopyIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => deleteSession(session.id)}
                        title="Delete session"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Getting Started
            </Typography>
            <Typography variant="body1" paragraph>
              Create a new crafting session to start planning your manufacturing operations.
              You can share sessions with others by copying the session URL.
            </Typography>
            <Alert severity="info">
              Session data is stored locally on your device. Make sure to share the session URL 
              with others if you want them to collaborate on the same crafting plan.
            </Alert>
          </Paper>
        </>
      )}

      {/* Create Session Dialog */}
      <Dialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Crafting Session</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Session Name"
            fullWidth
            variant="outlined"
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            placeholder="e.g., Capital Ship Components, Mining Operation"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={createNewSession} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Import Session Dialog */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <ImportIcon />
            Import Shared Session
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            This session is not in your local storage. Give it a name to save it to your sessions:
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Session Name"
            fullWidth
            variant="outlined"
            value={importSessionName}
            onChange={(e) => setImportSessionName(e.target.value)}
            placeholder="e.g., John's Capital Ship Build"
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            The session will be saved locally and you can access it anytime from your sessions list.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setImportDialogOpen(false);
            setImportSessionName('');
            setSessionToImport(null);
          }}>
            Skip
          </Button>
          <Button onClick={importSession} variant="contained">
            Import Session
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Target Dialog */}
      <Dialog open={addTargetDialogOpen} onClose={() => setAddTargetDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Target Item</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                {selectedItem.name}
              </Typography>
              
              {availableBlueprints.length > 1 && (
                <FormControl fullWidth margin="dense">
                  <InputLabel>Blueprint</InputLabel>
                  <Select
                    value={selectedBlueprint}
                    onChange={(e) => setSelectedBlueprint(e.target.value as number)}
                    label="Blueprint"
                  >
                    {availableBlueprints.map((bp) => (
                      <MenuItem key={bp.bp_id} value={bp.bp_id}>
                        Blueprint {bp.bp_id} - {bp.product_count} per run
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              
              {availableBlueprints.length === 1 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                  Blueprint: {availableBlueprints[0].bp_id} - {availableBlueprints[0].product_count} per run
                </Typography>
              )}

              {/* Blueprint Details Section */}
              {selectedBlueprint && availableBlueprints.length > 0 && (
                <>
                  {(() => {
                    const selectedBp = availableBlueprints.find(bp => bp.bp_id === selectedBlueprint);
                    if (!selectedBp) return null;

                    return (
                      <Paper sx={{ p: 2, mt: 2, mb: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="h6" gutterBottom>
                          Blueprint Details
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 3, mb: 2, flexWrap: 'wrap' }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Production Time:</strong>
                            </Typography>
                            <Typography variant="body2">
                              {(() => {
                                const hours = Math.floor(selectedBp.time / 3600);
                                const minutes = Math.floor((selectedBp.time % 3600) / 60);
                                const seconds = selectedBp.time % 60;
                                if (hours > 0) {
                                  return `${hours}h ${minutes}m ${seconds}s`;
                                } else if (minutes > 0) {
                                  return `${minutes}m ${seconds}s`;
                                } else {
                                  return `${seconds}s`;
                                }
                              })()}
                            </Typography>
                          </Box>
                          
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Products per Run:</strong>
                            </Typography>
                            <Typography variant="body2">
                              {selectedBp.product_count.toLocaleString()}
                            </Typography>
                          </Box>
                          
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Max Production:</strong>
                            </Typography>
                            <Typography variant="body2">
                              {selectedBp.max_production.toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>

                        {selectedBp.structures.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              <strong>Required Structures:</strong>
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {selectedBp.structures.map((structure, idx) => (
                                <Chip key={idx} label={structure} size="small" variant="outlined" />
                              ))}
                            </Box>
                          </Box>
                        )}

                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Materials Required:</strong>
                        </Typography>
                        <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                          {selectedBp.materials.map((material, idx) => (
                            <Box 
                              key={idx} 
                              sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                py: 0.5,
                                px: 1,
                                bgcolor: idx % 2 === 0 ? 'transparent' : 'grey.100',
                                borderRadius: 1
                              }}
                            >
                              <Typography variant="body2">
                                {material.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {material.quantity.toLocaleString()}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Paper>
                    );
                  })()}
                </>
              )}
              
              <TextField
                margin="dense"
                label="Quantity Needed"
                type="number"
                fullWidth
                variant="outlined"
                value={targetQuantity}
                onChange={(e) => setTargetQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                inputProps={{ min: 1 }}
                helperText={selectedBlueprint && availableBlueprints.find(bp => bp.bp_id === selectedBlueprint) 
                  ? `This will require ${Math.ceil(targetQuantity / availableBlueprints.find(bp => bp.bp_id === selectedBlueprint)!.product_count)} production runs`
                  : ''}
              />
              
              {loadingBlueprints && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Loading blueprint information...
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAddTargetDialogOpen(false);
            setSelectedItem(null);
            setSelectedBlueprint('');
            setTargetQuantity(1);
            setAvailableBlueprints([]);
          }}>
            Cancel
          </Button>
          <Button 
            onClick={addTargetToSession} 
            variant="contained"
            disabled={!selectedBlueprint || loadingBlueprints}
          >
            Add Target
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CraftingPlanner; 