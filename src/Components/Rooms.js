// src/Components/Rooms.js
import React, { useEffect, useState } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Snackbar,
  Fade,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CloseIcon from "@mui/icons-material/Close";
import { IoChatbubbles } from "react-icons/io5";
import { BiHash } from "react-icons/bi";
import CreateRoom from "./CreateRoom";
import { useNavigate, useLocation } from "react-router-dom";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  deleteDoc,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "../Firebase/Firebase";

function Rooms() {
  const navigate = useNavigate();
  const location = useLocation();

  const [openGroup, setOpenGroup] = useState(true);
  const [channels, setChannels] = useState([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);

  // delete confirmation dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // current channel id from URL
  const currentChannelId = location.pathname.startsWith("/channel/")
    ? location.pathname.split("/")[2]
    : null;

  useEffect(() => {
    const q = query(collection(db, "channels"), orderBy("channelName", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setChannels(list);
    }, (err) => {
      console.error("Channels snapshot error:", err);
      setChannels([]);
    });

    return () => unsub();
  }, []);

  const toggleGroup = () => setOpenGroup((s) => !s);
  const toggleCreateRoom = () => setShowCreateRoom((s) => !s);
  const closeAlert = () => setAlertOpen(false);

  const goToChannel = (id) => {
    navigate(`/channel/${id}`);
  };

  // create channel (called from CreateRoom)
  const addChannel = async (name) => {
    if (!name) {
      setAlertOpen(true);
      return;
    }
    const cName = name.toLowerCase().trim();
    if (!cName) {
      setAlertOpen(true);
      return;
    }
    // check duplicate locally (helps UX)
    if (channels.some((c) => c.channelName === cName)) {
      setAlertOpen(true);
      return;
    }
    try {
      await addDoc(collection(db, "channels"), { channelName: cName });
      setShowCreateRoom(false);
    } catch (err) {
      console.error("addChannel error:", err);
      setAlertOpen(true);
    }
  };

  // prepare delete: open confirm dialog
  const confirmDeleteChannel = (channel) => {
    setChannelToDelete(channel);
    setDeleteConfirmOpen(true);
  };
  const cancelDelete = () => {
    setChannelToDelete(null);
    setDeleteConfirmOpen(false);
  };

  // Delete channel: delete subcollection messages first (batched), then delete channel doc.
  // NOTE: Firestore doesn't support server-side recursive delete in client SDK directly.
  // We'll fetch messages (limited) and delete them in batches. For large collections consider Cloud Function or firebase-tools.
  const deleteChannel = async () => {
    if (!channelToDelete) return;
    setDeleting(true);
    try {
      const messagesCol = collection(db, "channels", channelToDelete.id, "messages");
      const msgsSnap = await getDocs(messagesCol);
      // batched deletes (100 ops per batch recommended)
      const batch = writeBatch(db);
      msgsSnap.forEach((m) => batch.delete(doc(db, "channels", channelToDelete.id, "messages", m.id)));
      // commit deletes of messages
      await batch.commit();
      // delete the channel doc itself
      await deleteDoc(doc(db, "channels", channelToDelete.id));
      // close dialog
      setDeleteConfirmOpen(false);
      setChannelToDelete(null);
    } catch (err) {
      console.error("deleteChannel error:", err);
      // if fails, still close and inform user
      setDeleteConfirmOpen(false);
      setChannelToDelete(null);
      setAlertOpen(true);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ color: "#f2f3f5", width: "100%" }}>
      {/* Snackbar alert */}
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={alertOpen}
        onClose={closeAlert}
        TransitionComponent={Fade}
        message="Invalid or duplicate channel name"
        action={
          <IconButton size="small" aria-label="close" color="inherit" onClick={closeAlert}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />

      {/* Create room modal */}
      {showCreateRoom && <CreateRoom create={addChannel} manage={toggleCreateRoom} />}

      {/* Header */}
      <Box sx={{ px: 2, py: 1.25, backgroundColor: "#2b2d34", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
        <Typography sx={{ fontWeight: 700 }}>Chatify Server</Typography>
        <Typography variant="caption" sx={{ color: "#a1a1aa" }}>
          Channels
        </Typography>
      </Box>

      {/* Create row */}
      <ListItem sx={{ paddingTop: 0.5, paddingBottom: 0.5 }}>
        <ListItemText
          primary="Create New Channel"
          primaryTypographyProps={{ sx: { fontSize: 14, color: "#b9bbbe" } }}
        />
        <IconButton edge="end" aria-label="add" onClick={toggleCreateRoom}>
          <AddIcon sx={{ color: "#7c7cff" }} />
        </IconButton>
      </ListItem>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.03)" }} />

      {/* Channels header */}
      <List component="nav" aria-labelledby="channels-header">
        <ListItemButton onClick={toggleGroup} sx={{ px: 2 }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <IoChatbubbles style={{ fontSize: 18, color: "#7c7cff" }} />
          </ListItemIcon>
          <ListItemText
            primary="TEXT CHANNELS"
            primaryTypographyProps={{ sx: { fontSize: 12, color: "#a1a1aa", fontWeight: 600 } }}
          />
          {openGroup ? <ExpandLess sx={{ color: "#a1a1aa" }} /> : <ExpandMore sx={{ color: "#a1a1aa" }} />}
        </ListItemButton>

        {/* list */}
        {openGroup && (
          <Box>
            {channels.map((channel) => {
              const isActive = channel.id === currentChannelId;
              return (
                <Box
                  key={channel.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    px: 1,
                    my: 0.5,
                    // add a class-like selector to show delete button on hover:
                    "&:hover .channel-delete": { opacity: 1 },
                  }}
                >
                  <ListItemButton
                    onClick={() => goToChannel(channel.id)}
                    sx={{
                      pl: 3.5,
                      flex: 1,
                      borderRadius: 1,
                      mx: 1,
                      py: 1,
                      backgroundColor: isActive ? "rgba(124,124,255,0.12)" : "transparent",
                      "&:hover": { backgroundColor: isActive ? "rgba(124,124,255,0.16)" : "rgba(255,255,255,0.02)" },
                      cursor: "pointer",
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <BiHash style={{ fontSize: 16, color: isActive ? "#7c7cff" : "#8e9297" }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={channel.channelName}
                      primaryTypographyProps={{
                        sx: {
                          color: isActive ? "#f2f3f5" : "#d1d1d6",
                          fontWeight: isActive ? 600 : 400,
                          fontSize: 14,
                        },
                      }}
                    />
                  </ListItemButton>

                  {/* delete icon (hidden until hover) */}
                  <Box
                    className="channel-delete"
                    sx={{
                      opacity: 0,
                      transition: "opacity 140ms",
                      display: "flex",
                      alignItems: "center",
                      pr: 0.5,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tooltip title="Delete channel" placement="right">
                      <IconButton
                        size="small"
                        onClick={() => confirmDeleteChannel(channel)}
                        sx={{ color: "#ff6b6b" }}
                        aria-label={`delete-${channel.channelName}`}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              );
            })}

            {channels.length === 0 && (
              <Box sx={{ px: 3.5, py: 1 }}>
                <Typography variant="body2" sx={{ color: "#a1a1aa" }}>
                  No channels yet — create one!
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </List>

      {/* Delete confirm dialog */}
      <Dialog open={deleteConfirmOpen} onClose={cancelDelete}>
        <DialogTitle>Delete channel?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "#666" }}>
            Deleting <strong>{channelToDelete?.channelName}</strong> will remove the channel and its messages.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} disabled={deleting}>Cancel</Button>
          <Button onClick={deleteChannel} color="error" variant="contained" disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Rooms;
