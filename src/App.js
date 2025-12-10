// src/App.js
import React, { useEffect, useState } from "react";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { auth, provider } from "./Firebase/Firebase";
import {
  Button,
  Container,
  Typography,
  Avatar,
} from "@mui/material";
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
      <Container style={{ marginTop: 60, textAlign: "center" }}>
        <Typography variant="h4" gutterBottom>
          Chatify Clone
        </Typography>

        <Button variant="contained" onClick={login}>
          Sign in with Google
        </Button>
      </Container>
    );
  }

  return (
    <Container style={{ marginTop: 30 }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar src={user.photoURL} />
        <div>
          <Typography>{user.displayName}</Typography>
          <Typography variant="caption">{user.email}</Typography>
        </div>

        <Button
          style={{ marginLeft: "auto" }}
          variant="outlined"
          onClick={logout}
        >
          Logout
        </Button>
      </div>

      {/* Layout */}
      <div
        style={{
          display: "flex",
          marginTop: 24,
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        <div style={{ width: 280, borderRight: "1px solid #333" }}>
          <Rooms />
        </div>

        <div style={{ flex: 1 }}>
          <Routes>
            <Route
              path="/"
              element={
                <Typography>
                  Select a channel from the left or create a new one.
                </Typography>
              }
            />
            <Route path="/channel/:channelId" element={<Chat user={user} />} />
          </Routes>
        </div>
      </div>
    </Container>
  );
}

export default App;
