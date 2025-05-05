'use client'
import { fetchAuthSession, signOut } from "aws-amplify/auth";
import { useState } from "react"
import { useAsyncEffectOnce } from "../hooks/useAsyncEffectOnce";
import { useAuthenticator } from "@aws-amplify/ui-react";

// Material UI imports
import { 
  Button, 
  Typography, 
  Container,
  CircularProgress,
  AppBar,
  Toolbar
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { AppRouter } from "./AppRouter";
import { AuthView } from "./AuthView";

export const Main = () => {
  const [id, setId] = useState<string | undefined>('');
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { user, route, authStatus } = useAuthenticator((context) => [context.user, context.route, context.authStatus]);
  
  // Define your games collection - easy to add more games in the future

  // Get the current authentication state
  useAsyncEffectOnce(async () => {
    try {
      setLoading(true);
      const session = await fetchAuthSession();
      setId(session.identityId);
      
      // Check if we have an identityId but no user - this means we're a guest
      if (session.identityId && !user) {
        setIsGuest(true);
      }
      setLoading(false)
    } catch (error) {
      setLoading(false)
      console.error('Error fetching auth session:', error);
    }
  });

  // Handle guest access
  const handleGuestAccess = async () => {
    try {
      setLoading(true);
      // For guest access, just call fetchAuthSession to get credentials
      const session = await fetchAuthSession();
      if (session.identityId) {
        setId(session.identityId);
        setIsGuest(true);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error accessing as guest:', error);
      setLoading(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      setIsGuest(false);
      setId(undefined);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if(authStatus === 'configuring' || loading){
    return <>
      <CircularProgress />
    </>
  }
  return (
    <>
      {route !== 'authenticated' && !isGuest ? (
        <AuthView
          loading={loading} 
          handleGuestAccess={handleGuestAccess}
        />
      ) : (
        <>
          <AppBar position="static" color="primary" elevation={0}>
            <Toolbar>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                {isGuest 
                  ? 'App Center (Guest)' 
                  : `Welcome, ${user?.signInDetails?.loginId || 'User'}`}
              </Typography>
              <Button 
                color="inherit" 
                endIcon={<LogoutIcon />}
                onClick={handleSignOut}
              >
                Sign out
              </Button>
            </Toolbar>
          </AppBar>
          
          <Container sx={{ p: 0.5 }}>
            <AppRouter />
          </Container>
        </>
      )}
    </>
  )
}