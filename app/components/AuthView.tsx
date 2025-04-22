import { Authenticator } from "@aws-amplify/ui-react"
import { Box, Button, CircularProgress, Container, Divider, Paper, Typography } from "@mui/material"
import PersonIcon from '@mui/icons-material/Person';

export const AuthView = ({
  handleGuestAccess,
  loading
}: {
  handleGuestAccess: () => Promise<void>,
  loading: boolean
}) => {
  return (
    <Container maxWidth="sm">
      <Paper
        elevation={3}
        sx={{
          mt: 8,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2
        }}
      >
        <Typography variant="h4" align="center" gutterBottom>
          Welcome
        </Typography>

        <Authenticator>
          {/* This slot provides the default Sign In form */}
        </Authenticator>

        <Box sx={{ mt: 3, mb: 2 }}>
          <Divider>
            <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
              OR
            </Typography>
          </Divider>
        </Box>

        <Button
          variant="outlined"
          color="primary"
          size="large"
          startIcon={<PersonIcon />}
          onClick={handleGuestAccess}
          disabled={loading}
          sx={{
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none'
          }}
        >
          {loading ? <CircularProgress size={24} /> : 'Continue as Guest'}
        </Button>
      </Paper>
    </Container>
  )
}