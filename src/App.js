import React from "react";
import { ThemeProvider, CssBaseline, Box, Typography, Button } from "@mui/material";
import theme from "./theme";
import { Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./Context/AuthContext";
import MainLayout from "./Components/Layout/MainLayout";
import Chat from "./Components/Chat/Chat";
import ExploreChannels from "./Components/ExploreChannels";

function LoginScreen() {
  const { login } = useAuth();
  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 3,
        background: 'radial-gradient(circle at 50% 50%, #1a1d26 0%, #090b10 100%)'
      }}
    >
      <Typography variant="h2" sx={{
        fontWeight: 900,
        letterSpacing: 2,
        background: 'linear-gradient(45deg, #00f2ea, #ff0055)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        textFillColor: 'transparent',
        WebkitTextFillColor: 'transparent'
      }}>
        CHATIFY
      </Typography>
      <Typography variant="h6" sx={{ color: 'text.secondary' }}>
        Glassmorphism. Neon. Future.
      </Typography>
      <Button
        variant="contained"
        size="large"
        onClick={login}
        sx={{
          mt: 2,
          fontSize: '1.2rem',
          background: 'linear-gradient(90deg, #00f2ea 0%, #00c2ff 100%)',
          color: '#000',
          fontWeight: 800
        }}
      >
        Login with Google
      </Button>
    </Box>
  )
}

function AppContent() {
  const { currentUser } = useAuth();

  if (!currentUser) return <LoginScreen />;

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Chat />} />
        <Route path="channel/:channelId" element={<Chat />} />
        <Route path="explore" element={<ExploreChannels />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
