// src/Components/Rooms.js
import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Divider,
  Typography,
  Badge,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { IoChatbubbles } from "react-icons/io5";
import { BiHash } from "react-icons/bi";
import { db } from "../Firebase/Firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  where,
} from "firebase/firestore";
import CreateRoom from "./CreateRoom";
import { useNavigate, useLocation } from "react-router-dom";

function Rooms({ user }) {
  const [open, setOpen] = useState(true);
  const [channels, setChannels] = useState([]); // { id, channelName, unread }
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentChannelId = location.pathname.startsWith("/channel/") ? location.pathname.split("/")[2] : null;

  // store unsub functions for each channel in a map { [channelId]: { unsubLastRead, unsubMsgs } }
  const listenersRef = useRef({});

  // subscribe to list of channels
  useEffect(() => {
    const col = collection(db, "channels");
    const q = query(col, orderBy("channelName", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, channelName: d.data().channelName, unread: 0 }));
      setChannels(list);
    });

    return () => {
      unsub();
      // cleanup any per-channel listeners
      Object.values(listenersRef.current).forEach((obj) => {
        try {
          obj.unsubLastRead && obj.unsubLastRead();
        } catch {}
        try {
          obj.unsubMsgs && obj.unsubMsgs();
        } catch {}
      });
      listenersRef.current = {};
    };
  }, []);

  // whenever channels list or user changes, (re)create per-channel listeners safely
  useEffect(() => {
    // cleanup old listeners first
    Object.entries(listenersRef.current).forEach(([channelId, obj]) => {
      try {
        obj.unsubLastRead && obj.unsubLastRead();
      } catch {}
      try {
        obj.unsubMsgs && obj.unsubMsgs();
      } catch {}
      delete listenersRef.current[channelId];
    });

    if (!user) {
      // if no user, reset unread counts
      setChannels((prev) => prev.map((c) => ({ ...c, unread: 0 })));
      return;
    }

    // create listeners for each channel
    channels.forEach((ch) => {
      const channelId = ch.id;

      // listener for user's lastRead doc
      const lastReadRef = doc(db, "users", user.uid, "channelReads", channelId);
      const unsubLastRead = onSnapshot(lastReadRef, (snap) => {
        // compute query for messages after lastRead (or all messages if none)
        let msgsQuery;
        if (snap.exists() && snap.data().lastRead) {
          msgsQuery = query(collection(db, "channels", channelId, "messages"), where("createdAt", ">", snap.data().lastRead));
        } else {
          msgsQuery = query(collection(db, "channels", channelId, "messages"));
        }

        // if there's already a messages unsub for this channel, remove it before creating a new one
        if (listenersRef.current[channelId] && listenersRef.current[channelId].unsubMsgs) {
          try {
            listenersRef.current[channelId].unsubMsgs();
          } catch {}
          listenersRef.current[channelId].unsubMsgs = null;
        }

        // listen to messages after lastRead and update unread count
        const unsubMsgs = onSnapshot(msgsQuery, (snapMsgs) => {
          const count = snapMsgs.size;
          setChannels((prev) => prev.map((p) => (p.id === channelId ? { ...p, unread: count } : p)));
        });

        // store both unsub functions in the central map
        listenersRef.current[channelId] = {
          unsubLastRead,
          unsubMsgs,
        };
      });

      // store unsubLastRead early (unsubMsgs will be added inside snapshot callback)
      listenersRef.current[channelId] = {
        unsubLastRead,
        unsubMsgs: listenersRef.current[channelId]?.unsubMsgs || null,
      };
    });

    // cleanup when this effect runs next time
    return () => {
      Object.values(listenersRef.current).forEach((obj) => {
        try {
          obj.unsubLastRead && obj.unsubLastRead();
        } catch {}
        try {
          obj.unsubMsgs && obj.unsubMsgs();
        } catch {}
      });
      listenersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channels.length, user]);

  const handleClick = () => setOpen((p) => !p);

  const manageCreateRoomModal = () => setShowCreateRoom((p) => !p);

  const goToChannel = (id) => navigate(`/channel/${id}`);

  return (
    <Box sx={{ color: "#dcddde" }}>
      {showCreateRoom && <CreateRoom create={() => {}} manage={manageCreateRoomModal} />}

      {/* Server header */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid #202225", backgroundColor: "#2f3136" }}>
        <Typography sx={{ fontWeight: 700 }}>Chatify Server</Typography>
        <Typography variant="caption" sx={{ color: "#b9bbbe" }}>Channels</Typography>
      </Box>

      {/* create channel row */}
      <ListItem sx={{ paddingTop: 0.5, paddingBottom: 0.5 }}>
        <ListItemText primary="Create New Channel" primaryTypographyProps={{ sx: { fontSize: 14, color: "#b9bbbe" } }} />
        <IconButton edge="end" aria-label="add" onClick={manageCreateRoomModal}><AddIcon sx={{ color: "#5865f2" }} /></IconButton>
      </ListItem>
      <Divider sx={{ borderColor: "#202225" }} />

      <List component="nav" aria-labelledby="nested-list-subheader">
        <ListItemButton onClick={handleClick}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <IoChatbubbles style={{ fontSize: "1.25em", color: "#5865f2" }} />
          </ListItemIcon>
          <ListItemText primary="TEXT CHANNELS" primaryTypographyProps={{ sx: { fontSize: 12, color: "#8e9297", fontWeight: 600 } }} />
          {open ? <ExpandLess sx={{ color: "#8e9297" }} /> : <ExpandMore sx={{ color: "#8e9297" }} />}
        </ListItemButton>

        <Collapse in={open} timeout="auto">
          <List component="div" disablePadding>
            {channels.map((channel) => {
              const isActive = channel.id === currentChannelId;
              return (
                <ListItemButton
                  key={channel.id}
                  sx={{ pl: 4, py: 0.8, borderRadius: 1, mx: 1, backgroundColor: isActive ? "#34363d" : "transparent", "&:hover": { backgroundColor: "#30323a" } }}
                  onClick={() => goToChannel(channel.id)}
                >
                  <ListItemIcon sx={{ minWidth: 26 }}>
                    <BiHash style={{ fontSize: "1.2em", color: isActive ? "#fff" : "#8e9297" }} />
                  </ListItemIcon>

                  <ListItemText primary={channel.channelName} primaryTypographyProps={{ sx: { color: isActive ? "#f2f3f5" : "#a1a1aa", fontWeight: isActive ? 700 : 500 } }} />

                  {channel.unread > 0 && <Badge color="error" badgeContent={channel.unread > 99 ? "99+" : channel.unread} sx={{ mr: 1 }} />}
                </ListItemButton>
              );
            })}
          </List>
        </Collapse>
      </List>
    </Box>
  );
}

export default Rooms;
