import { lazy, Suspense, useState, useEffect } from "react";
import { AppMeta } from "../types";
import { Box, Button, Card, CardActionArea, CardContent, CircularProgress, Grid, Paper, Typography } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

// Lazy load the games components
const WordFactory = lazy(() => import("../word-factory/WordFactory"));
const ScheduleFinder = lazy(() => import("../apps/ScheduleFinder/ScheduleFinder"));
const ServerSideValidationApp = lazy(() => import("../serverSideValidationApp/ServerSideValidationApp"));

const appList: AppMeta[] = [
  {
    id: 'word-factory',
    title: 'Word Factory',
    description: 'Create words from a set of letters in this fun word game!',
    component: WordFactory
  },
  {
    id: 'scheduleFinder',
    title: 'Schedule Finder',
    description: 'Find common schedule with your friends',
    component: ScheduleFinder
  },
  {
    id: 'serverSideValidationApp',
    title: 'Form Validation',
    description: 'Demo of server-side validation with Next.js API routes',
    component: ServerSideValidationApp
  }
];

export const AppRouter = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [activeApp, setActiveApp] = useState<string | null>(null);

  // Effect to sync URL with active app
  useEffect(() => {
    // Extract app ID from pathname (e.g., /scheduleFinder -> scheduleFinder)
    const path = pathname?.substring(1); // Remove leading slash
    
    // If we have a path and it matches an app ID
    if (path && appList.some(app => app.id === path)) {
      setActiveApp(path);
    } else if (pathname === '/') {
      // We're at the root, show app list
      setActiveApp(null);
    }
  }, [pathname]);

  // Handle going back to apps list
  const handleBackToApps = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveApp(null);
    router.push('/');
  };

  console.log('billy', pathname)

  if (activeApp) {
    const app = appList.find(g => g.id === activeApp);

    if (app) {
      const AppComponent = app.component;

      return (
        <Box sx={{ width: '100%' }}>
          <Link href="/" passHref>
            <Button
              variant="contained"
              startIcon={<ArrowBackIcon />}
              onClick={handleBackToApps}
              sx={{ mb: 2 }}
            >
              Back to Apps
            </Button>
          </Link>
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
          <Grid key={app.id} sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4' } }}>
            <Link href={`/${app.id}`} passHref>
              <Card
                sx={{ 
                  height: '100%', 
                  transition: 'transform 0.2s', 
                  '&:hover': { transform: 'translateY(-4px)' },
                  textDecoration: 'none',
                  display: 'block'
                }}
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
            </Link>
          </Grid>
        ))}
      </Grid>
    </>
  );
};