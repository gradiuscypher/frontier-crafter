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
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';

interface CraftingSessionInfo {
  id: string;
  name: string;
  createdAt: string;
  url: string;
}

const API_BASE_URL = 'http://localhost:8000';

const CraftingPlanner: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [sessions, setSessions] = useState<CraftingSessionInfo[]>([]);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

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

  const shareSession = (session: CraftingSessionInfo) => {
    setShareUrl(session.url);
    setShareDialogOpen(true);
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
  };

  const currentSession = sessions.find(session => session.id === currentSessionId);

  return (
    <Box>
      <Typography variant="h3" component="h1" gutterBottom>
        Crafting Planner
      </Typography>
      
      {currentSessionId && currentSession && (
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
              startIcon={<ShareIcon />}
              onClick={() => shareSession(currentSession)}
              sx={{ mr: 2 }}
            >
              Share Session
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setCurrentSessionId(null);
                setSearchParams({});
              }}
              sx={{ color: 'inherit', borderColor: 'currentColor' }}
            >
              Leave Session
            </Button>
          </Box>
        </Paper>
      )}

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
          <Grid container spacing={2}>
            {sessions.map((session) => (
              <Grid item xs={12} md={6} lg={4} key={session.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    bgcolor: currentSessionId === session.id ? 'primary.light' : 'background.paper'
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography variant="h6" component="h3" noWrap>
                        {session.name}
                      </Typography>
                      {currentSessionId === session.id && (
                        <Chip label="Active" size="small" color="primary" />
                      )}
                    </Box>
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
                      disabled={currentSessionId === session.id}
                    >
                      {currentSessionId === session.id ? 'Current' : 'Load'}
                    </Button>
                    <IconButton 
                      size="small" 
                      onClick={() => shareSession(session)}
                      title="Share session"
                    >
                      <ShareIcon />
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
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {!currentSessionId && (
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

      {/* Share Session Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Share Crafting Session</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Share this URL with others to give them access to this crafting session:
          </Typography>
          <Box display="flex" alignItems="center" gap={1} mt={2}>
            <TextField
              fullWidth
              variant="outlined"
              value={shareUrl}
              InputProps={{
                readOnly: true,
              }}
              size="small"
            />
            <IconButton 
              onClick={() => copyToClipboard(shareUrl)}
              title="Copy to clipboard"
            >
              <CopyIcon />
            </IconButton>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
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