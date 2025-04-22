'use client'
import { fetchAuthSession, signOut } from "aws-amplify/auth";
import { useState, Suspense } from "react"
import { useAsyncEffectOnce } from "../hooks/useAsyncEffectOnce";
import { useAuthenticator } from "@aws-amplify/ui-react";

// Material UI imports
import { 
  Button, 
  Box, 
  Typography, 
  Divider, 
  Paper, 
  Container,
  CircularProgress,
  AppBar,
  Toolbar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LogoutIcon from '@mui/icons-material/Logout';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Grid from '@mui/material/Grid';
import { appList } from "./appList";
import { AuthView } from "./AuthView";

export const Main = () => {
  const [id, setId] = useState<string | undefined>('');
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { user, route } = useAuthenticator((context) => [context.user, context.route]);
  
  // Define your games collection - easy to add more games in the future

  // Get the current authentication state
  useAsyncEffectOnce(async () => {
    try {
      const session = await fetchAuthSession();
      setId(session.identityId);
      
      // Check if we have an identityId but no user - this means we're a guest
      if (session.identityId && !user) {
        setIsGuest(true);
      }
    } catch (error) {
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

  // Render the active game or show the game selection grid
  const renderContent = () => {
    if (activeApp) {
      const app = appList.find(g => g.id === activeApp);
      
      if (app) {
        const AppComponent = app.component;
        
        return (
          <Box sx={{ width: '100%' }}>
            <Button 
              variant="contained" 
              startIcon={<ArrowBackIcon />}
              onClick={() => setActiveApp(null)}
              sx={{ mb: 2 }}
            >
              Back to Apps
            </Button>
            <Typography variant="h4" gutterBottom>{app.title}</Typography>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Suspense fallback={
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              }>
                <AppComponent />
              </Suspense>
            </Paper>
          </Box>
        );
      }
    }

    return (
      <>
        <Typography variant="h4" component="h2" sx={{ mb: 3 }}>
          My Apps Collection
        </Typography>
        <Grid container spacing={3}>
          {appList.map((app) => (
            <Grid key={app.id}>
              <Card 
                elevation={3} 
                sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}
              >
                <CardActionArea 
                  sx={{ height: '100%' }} 
                  onClick={() => setActiveApp(app.id)}
                >
                  <CardContent>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {app.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {app.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </>
    );
  };

  return (
    <>
      {route === 'signIn' && !isGuest ? (
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
          
          <Container sx={{ py: 4 }}>
            {renderContent()}
          </Container>
        </>
      )}
    </>
  )
}