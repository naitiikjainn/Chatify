// src/App.js
import React, { useEffect, useState } from "react";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { auth, provider } from "./Firebase/Firebase";
import { Button, Typography, Avatar, Box } from "@mui/material";
import { Routes, Route } from "react-router-dom";
import Rooms from "./Components/Rooms";
import Chat from "./Components/Chat";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
    });
    return () => unsub();
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      alert(err.message);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  if (!user) {
    return (
      <Box
        sx={{
          height: "100vh",
          backgroundColor: "#202225",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography variant="h3" sx={{ fontWeight: 700 }}>
          Chatify
        </Typography>
        <Typography variant="body1" sx={{ color: "#b9bbbe", mb: 2 }}>
          A simple Discord-like chat built with React & Firebase
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={login}
          sx={{
            backgroundColor: "#5865f2",
            "&:hover": { backgroundColor: "#4752c4" },
          }}
        >
          Sign in with Google
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#202225",
        color: "#fff",
      }}
    >
      {/* Top bar */}
      <Box
        sx={{
          height: 56,
          borderBottom: "1px solid #2f3136",
          display: "flex",
          alignItems: "center",
          px: 2,
          gap: 1.5,
          backgroundColor: "#202225",
        }}
      >
        <Avatar src={user.photoURL} />
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {user.displayName}
          </Typography>
          <Typography variant="caption" sx={{ color: "#b9bbbe" }}>
            {user.email}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          onClick={logout}
          sx={{
            marginLeft: "auto",
            borderColor: "#b9bbbe",
            color: "#b9bbbe",
            "&:hover": { borderColor: "#fff", color: "#fff" },
          }}
        >
          Logout
        </Button>
      </Box>

      {/* Main layout */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* Sidebar */}
        <Box
          sx={{
            width: 260,
            backgroundColor: "#2f3136",
            borderRight: "1px solid #202225",
            overflowY: "auto",
          }}
        >
          <Rooms />
        </Box>

        {/* Chat area */}
        <Box
          sx={{
            flex: 1,
            backgroundColor: "#36393f",
            p: 2,
            overflow: "hidden",
          }}
        >
          <Routes>
            <Route
              path="/"
              element={
                <Typography sx={{ color: "#b9bbbe" }}>
                  Select a channel from the left or create a new one.
                </Typography>
              }
            />
            <Route path="/channel/:channelId" element={<Chat user={user} />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}

export default App;
