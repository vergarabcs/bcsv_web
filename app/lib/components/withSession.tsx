import React, { useState } from 'react';


import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Paper,
  CircularProgress
} from '@mui/material';
import { SessionContext } from '../../constants';
import { useAsyncEffectOnce } from '../hooks/useAsyncEffectOnce';

// Local storage key for the session ID
const SESSION_ID_KEY = 'app_session_id';

// Function to generate a random 6-digit number
const generateSessionId = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to validate a session ID (must be a 6-digit number)
const isValidSessionId = (sessionId: string): boolean => {
  return /^\d{6}$/.test(sessionId);
};

export interface WithSessionProps {
  sessionId: string;
}

// Interface for models that can be used with sessions
interface SessionableModel {
  get: (args: { id: string }) => Promise<{ data: any | null }>;
  create: (args: { id: string }) => Promise<any>;
  delete: (args: { id: string }) => Promise<any>;
}

export function withSession<P extends WithSessionProps>(
  WrappedComponent: React.ComponentType<P>,
  model: SessionableModel
) {
  return function WithSession(props: Omit<P, keyof WithSessionProps>) {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [inputSessionId, setInputSessionId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Check for existing session ID in localStorage on component mount
    useAsyncEffectOnce(async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlSessionId = urlParams.get('sessionId');
      const storedSessionId = urlSessionId ?? localStorage.getItem(SESSION_ID_KEY);

      
      if (storedSessionId) {
        // Validate the stored session ID
        if (isValidSessionId(storedSessionId)) {
          verifySession(storedSessionId);
        } else {
          // Invalid stored session ID, open dialog to create a new one
          setLoading(false);
          setIsDialogOpen(true);
        }
      } else {
        // No stored session ID, open dialog to create a new one
        setLoading(false);
        setIsDialogOpen(true);
      }
    });

    // Verify session exists in database
    const verifySession = async (id: string) => {
      setLoading(true);
      setError(null);
      
      try {
        // Check if there's any ScheduleFinder with this session ID
        // This is just a placeholder - adjust based on your actual data model
        const result = await model.get({ id });
        if (result.data) {
          // Session exists, store and use it
          localStorage.setItem(SESSION_ID_KEY, id);
          setSessionId(id);
        } else {
          // Session doesn't exist
          setError(`Session ${id} not found`);
          setIsDialogOpen(true);
        }
      } catch (err) {
        console.error('Error verifying session:', err);
        setError('Error verifying session. Please try again.');
        setIsDialogOpen(true);
      }
      
      setLoading(false);
    };

    // Create a new session
    const createNewSession = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const newSessionId = generateSessionId();
        
        // Create a new game state with the generated session ID
        await model.create({
          id: newSessionId,
        });
        
        // Store the new session ID
        localStorage.setItem(SESSION_ID_KEY, newSessionId);
        setSessionId(newSessionId);
        setIsDialogOpen(false);
      } catch (err) {
        console.error('Error creating session:', err);
        setError('Error creating new session. Please try again.');
      }
      
      setLoading(false);
    };

    // Join an existing session
    const joinSession = async () => {
      if (!isValidSessionId(inputSessionId)) {
        setError('Please enter a valid 6-digit session ID');
        return;
      }
      
      await verifySession(inputSessionId);
    };

    // Handle dialog close
    const handleCloseDialog = () => {
      // Only allow closing if we have a valid session
      if (sessionId) {
        setIsDialogOpen(false);
      }
    };

    // Handle leave session
    const handleLeaveSession = () => {
      localStorage.removeItem(SESSION_ID_KEY)
      setSessionId(null)
      setIsDialogOpen(true)
    }

    const handleDeleteSession = () => {
      model.delete({id: sessionId ?? ''})
      handleLeaveSession()
    }

    // If we're still loading or don't have a session ID and the dialog isn't open, show a loading spinner
    if (loading) {
      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
        >
          <CircularProgress aria-label="Loading session" />
        </Box>
      );
    }

    // If we have a valid session ID, render the wrapped component with the session ID prop
    if (sessionId) {
      return (
        <SessionContext.Provider value={{ sessionId, leaveSession: handleLeaveSession, deleteSession: handleDeleteSession }}>
          <WrappedComponent {...(props as P)}/>
        </SessionContext.Provider>
      );
    }

    // Render the session dialog
    return (
      <>
        <Dialog 
          open={isDialogOpen} 
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          aria-labelledby="session-dialog-title"
          aria-describedby="session-dialog-description"
        >
          <DialogTitle id="session-dialog-title">Session Required</DialogTitle>
          <DialogContent>
            <Box my={2} id="session-dialog-description">
              <Typography variant="body1" gutterBottom>
                Please enter an existing 6-digit session ID or create a new session.
              </Typography>
              
              {error && (
                <Typography variant="body2" color="error" gutterBottom role="alert">
                  {error}
                </Typography>
              )}
              
              <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Join Existing Session
                </Typography>
                <TextField
                  label="Session ID"
                  variant="outlined"
                  fullWidth
                  value={inputSessionId}
                  onChange={(e) => setInputSessionId(e.target.value)}
                  margin="normal"
                  placeholder="Enter 6-digit session ID"
                  inputProps={{ maxLength: 6, "aria-label": "Session ID" }}
                  helperText="Please enter a 6-digit session ID"
                  error={!!error && error.includes('valid')}
                  aria-invalid={!!error && error.includes('valid')}
                  aria-describedby="session-id-helper-text"
                />
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={joinSession}
                  fullWidth
                  sx={{ mt: 1 }}
                  disabled={loading}
                  aria-label="Join existing session"
                >
                  {loading ? <CircularProgress size={24} aria-hidden="true" /> : 'Join Session'}
                </Button>
              </Paper>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={createNewSession} 
              variant="contained" 
              color="secondary"
              disabled={loading}
              aria-label="Create new session"
            >
              {loading ? <CircularProgress size={24} aria-hidden="true" /> : 'Create New Session'}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  };
}

export default withSession;