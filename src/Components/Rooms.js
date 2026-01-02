// src/Components/Rooms.js
import React, { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  deleteDoc,
  getDocs,
  setDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "../Firebase/Firebase";
import {
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";
import CreateRoom from "./CreateRoom";

function Rooms({ user }) {
  const [joined, setJoined] = useState([]);
  const [allChannels, setAllChannels] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);
  const navigate = useNavigate();

  // 1️⃣ Load ALL channels
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "channels"), (snap) => {
      setAllChannels(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // 2️⃣ Load channels this user joined
  useEffect(() => {
    if (!user) return;

    const joinedRef = collection(db, "users", user.uid, "joinedChannels");

    const unsub = onSnapshot(joinedRef, (snap) => {
      const joinedIds = snap.docs.map((d) => d.id);

      // Filter only channels still existing
      const filtered = allChannels.filter((c) =>
        joinedIds.includes(c.id)
      );

      setJoined(filtered);
    });

    return () => unsub();
  }, [user, allChannels]);

  // 3️⃣ Create Channel
  const createChannel = async (channelName) => {
    try {
      const newChannel = await addDoc(collection(db, "channels"), {
        channelName,
        ownerUid: user.uid,
        ownerName: user.displayName,
        createdAt: Date.now(),
      });

      // Auto-join creator
      await setDoc(
        doc(db, "users", user.uid, "joinedChannels", newChannel.id),
        { joinedAt: Date.now() }
      );

      setOpenCreate(false);
      navigate(`/channel/${newChannel.id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to create channel.");
    }
  };

  // 4️⃣ Delete Channel → for all users
  const deleteChannel = async (channel) => {
    if (!window.confirm(`Delete #${channel.channelName} permanently?`)) return;

    try {
      const channelId = channel.id;

      // Remove from channels collection
      await deleteDoc(doc(db, "channels", channelId));

      // Remove channel from EVERY user
      const usersSnap = await getDocs(collection(db, "users"));
      usersSnap.forEach(async (u) => {
        const ref = doc(db, "users", u.id, "joinedChannels", channelId);
        await deleteDoc(ref).catch(() => {});
      });

      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Error deleting channel.");
    }
  };

  return (
    <Box sx={{ width: "100%", color: "#fff", p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6" sx={{ color: "#fff" }}>
          Your Channels
        </Typography>

        <IconButton
          onClick={() => setOpenCreate(true)}
          sx={{ color: "#7c7cff" }}
        >
          <AddIcon />
        </IconButton>
      </Box>

      {joined.length === 0 && (
        <Typography sx={{ color: "#aaa", my: 2 }}>
          You haven't joined any channels.
        </Typography>
      )}

      {joined.map((c) => {
        const isOwner = c.ownerUid === user?.uid;

        return (
          <Box
            key={c.id}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              p: 1,
              mb: 1,
              background: "#2b2d34",
              borderRadius: 2,
              cursor: "pointer",
            }}
            onClick={() => navigate(`/channel/${c.id}`)}
          >
            <Typography># {c.channelName}</Typography>

            {isOwner && (
              <IconButton
                size="small"
                sx={{ color: "red" }}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChannel(c);
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        );
      })}

      <Divider sx={{ my: 2, borderColor: "#555" }} />

      <Button
        fullWidth
        variant="contained"
        sx={{ background: "#7c7cff" }}
        onClick={() => navigate("/explore")}
      >
        Explore Channels
      </Button>

      {openCreate && (
        <CreateRoom create={createChannel} manage={() => setOpenCreate(false)} />
      )}
    </Box>
  );
}

export default Rooms;
