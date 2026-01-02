import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import { useRooms } from "../Hooks/useRooms";
import { useAuth } from "../Context/AuthContext";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../Firebase/Firebase";
import TagIcon from '@mui/icons-material/Tag';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

function ExploreChannels() {
  const { allRooms, joinedRooms } = useRooms();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Password Dialog State
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [error, setError] = useState("");

  const handleJoinClick = (room) => {
    if (room.password) {
      setSelectedRoom(room);
      setPasswordInput("");
      setError("");
      setPasswordDialogOpen(true);
    } else {
      joinRoom(room);
    }
  };

  const joinRoom = async (room) => {
    if (!currentUser) return;
    try {
      await setDoc(
        doc(db, "users", currentUser.uid, "joinedChannels", room.id),
        { joinedAt: Date.now() }
      );
      // ADDITION: Add to channel buddies list for "Online Users" feature
      await setDoc(
        doc(db, "channels", room.id, "buddies", currentUser.uid),
        {
          name: currentUser.displayName,
          photoURL: currentUser.photoURL,
          joinedAt: Date.now()
        }
      );
      setPasswordDialogOpen(false);
    } catch (error) {
      console.error("Error joining room", error); // ignore
    }
  };

  const handlePasswordSubmit = () => {
    if (!selectedRoom) return;
    if (passwordInput === selectedRoom.password) {
      joinRoom(selectedRoom);
    } else {
      setError("Incorrect password");
    }
  };

  const isJoined = (roomId) => joinedRooms.some(r => r.id === roomId);

  // Filter logic
  const filteredRooms = allRooms.filter(room => {
    const search = searchTerm.toLowerCase();
    // Match Name or ID
    return room.channelName.toLowerCase().includes(search) || room.id.toLowerCase().includes(search);
  });

  return (
    <Box sx={{ p: 4, height: '100%', overflowY: 'auto' }}>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: '#f2f3f5', textAlign: 'center' }}>
          Find Communities
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', textAlign: 'center' }}>
          Search via Channel Name or Room ID
        </Typography>

        {/* Search Bar */}
        <Paper
          elevation={0}
          sx={{
            p: '2px 4px',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            mb: 6,
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s',
            '&:focus-within': {
              border: '1px solid #00f2ea',
              boxShadow: '0 0 15px rgba(0, 242, 234, 0.2)'
            }
          }}
        >
          <InputAdornment position="start" sx={{ pl: 2 }}>
            <SearchIcon sx={{ color: 'text.secondary' }} />
          </InputAdornment>
          <TextField
            fullWidth
            placeholder="Search channels..."
            variant="standard"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              disableUnderline: true,
              sx: { ml: 1, color: 'text.primary', p: 1 }
            }}
          />
        </Paper>

        <Grid container spacing={3}>
          {filteredRooms.map((room) => {
            const joined = isJoined(room.id);
            const isLocked = !!room.password;

            return (
              <Grid item xs={12} sm={6} key={room.id}>
                <Paper
                  sx={{
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 4,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                      border: '1px solid rgba(0, 242, 234, 0.3)'
                    }
                  }}
                >
                  {/* ID Badge for Verification */}
                  <Typography variant="caption" sx={{ position: 'absolute', top: 12, right: 12, opacity: 0.3, fontFamily: 'monospace' }}>
                    ID: {room.id.slice(0, 6)}...
                  </Typography>

                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {isLocked ? <LockIcon sx={{ color: '#ff0055', mr: 1, fontSize: 20 }} /> : <TagIcon sx={{ color: '#00f2ea', mr: 1, fontSize: 20 }} />}
                      <Typography variant="h6" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {room.channelName}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                      <PersonIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        By {room.ownerName || 'Unknown'}
                      </Typography>
                    </Box>
                  </Box>

                  <Button
                    variant={joined ? "outlined" : "contained"}
                    fullWidth
                    disabled={joined}
                    onClick={() => handleJoinClick(room)}
                    sx={{
                      borderRadius: 3,
                      textTransform: 'none',
                      ...(joined ? {
                        color: 'text.secondary',
                        borderColor: 'rgba(255,255,255,0.1)'
                      } : {
                        background: isLocked
                          ? 'linear-gradient(90deg, #ff0055 0%, #ff5588 100%)'
                          : 'linear-gradient(90deg, #5865f2 0%, #4752c4 100%)',
                        color: '#fff',
                        boxShadow: isLocked ? '0 0 10px rgba(255, 0, 85, 0.4)' : 'none'
                      })
                    }}
                  >
                    {joined ? "Joined" : isLocked ? "Unlock & Join" : "Join Channel"}
                  </Button>
                </Paper>
              </Grid>
            )
          })}
          {filteredRooms.length === 0 && (
            <Box sx={{ width: '100%', textAlign: 'center', mt: 4, opacity: 0.5 }}>
              <Typography>No channels found matching "{searchTerm}"</Typography>
            </Box>
          )}
        </Grid>
      </Box>

      {/* Password Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        PaperProps={{
          sx: {
            background: '#161b22',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'text.primary',
            minWidth: 300
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockOpenIcon sx={{ color: '#ff0055' }} />
          Enter Password
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            This channel is protected. Please enter the password to join.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            variant="outlined"
            type="password"
            placeholder="Password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            error={!!error}
            helperText={error}
            InputProps={{
              sx: { color: 'white' }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" onClick={handlePasswordSubmit} color="secondary">Unlock</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ExploreChannels;
