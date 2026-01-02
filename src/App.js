import React from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "./theme"; // Note: changed from named export if using default in theme.js, check theme.js
import { Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./Context/AuthContext";
import MainLayout from "./Components/Layout/MainLayout";
import Chat from "./Components/Chat/Chat";
import ExploreChannels from "./Components/ExploreChannels";
import { Box, Typography, Button } from "@mui/material";
import themeDefault from "./theme"; // I used 'export default' in my previous tool call for theme.js

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
        textFillColor: 'transparent',
        // Webkit prefix needed for some browsers in practice, adding just in case
        WebkitBackgroundClip: 'text',
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
        {/* Note: ExploreChannels logic might need tweaks to fit new layout effectively, but keeping it simple for now */}
        <Route path="explore" element={<ExploreChannels />} />
      </Route>
    </Routes>
  );
}

function App() {
  // themeDefault because I exported it as default
  return (
    <ThemeProvider theme={themeDefault}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
