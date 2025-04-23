import { lazy, Suspense, useState } from "react";
import { AppMeta } from "../types";
import { Box, Button, Card, CardActionArea, CardContent, CircularProgress, Grid, Paper, Typography } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Lazy load the games components
const WordFactory = lazy(() => import("./WordFactory"));
const ScheduleFinder = lazy(() => import("../apps/ScheduleFinder/ScheduleFinder"));

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
  }
];

export const AppList = () => {
  const [activeApp, setActiveApp] = useState<string | null>(null);

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