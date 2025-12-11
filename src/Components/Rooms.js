import React, { useState, useEffect } from "react";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Divider,
  Snackbar,
  Fade,
  Box,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import { IoChatbubbles } from "react-icons/io5";
import { BiHash } from "react-icons/bi";
import { theme } from "../theme";
import { db } from "../Firebase/Firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
} from "firebase/firestore";
import CreateRoom from "./CreateRoom";
import { useNavigate, useLocation } from "react-router-dom";

function Rooms() {
  const [open, setOpen] = useState(true);
  const [channelList, setChannelList] = useState([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [alert, setAlert] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const currentChannelId = location.pathname.startsWith("/channel/")
    ? location.pathname.split("/")[2]
    : null;

  useEffect(() => {
    const q = query(collection(db, "channels"), orderBy("channelName", "asc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((channel) => ({
        id: channel.id,
        channelName: channel.data().channelName,
      }));
      setChannelList(list);
    });

    return () => unsub();
  }, []);

  const handleClick = () => {
    setOpen((prev) => !prev);
  };

  const manageCreateRoomModal = () => {
    setShowCreateRoom((prev) => !prev);
  };

  const goToChannel = (id) => {
    navigate(`/channel/${id}`);
  };

  const handleAlert = () => {
    setAlert((prev) => !prev);
  };

  const addChannel = async (cName) => {
    if (!cName) {
      handleAlert();
      return;
    }

    cName = cName.toLowerCase().trim();

    if (cName === "") {
      handleAlert();
      return;
    }

    for (let i = 0; i < channelList.length; i++) {
      if (cName === channelList[i].channelName) {
        handleAlert();
        return;
      }
    }

    try {
      await addDoc(collection(db, "channels"), {
        channelName: cName,
      });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Box sx={{ color: theme.textPrimary }}>
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={alert}
        onClose={handleAlert}
        TransitionComponent={Fade}
        message="Room name already exists or invalid!"
        key="room-alert"
        action={
          <IconButton aria-label="close" color="inherit" onClick={handleAlert}>
            <CloseIcon />
          </IconButton>
        }
      />

      {showCreateRoom && (
        <CreateRoom create={addChannel} manage={manageCreateRoomModal} />
      )}

      {/* Server / app title */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${theme.bgMain}`,
          backgroundColor: theme.bgSidebar,
        }}
      >
        <Typography sx={{ fontWeight: 700, color: theme.textPrimary }}>
          Chatify Server
        </Typography>
        <Typography variant="caption" sx={{ color: theme.textMuted }}>
          Channels
        </Typography>
      </Box>

      {/* Create channel row */}
      <ListItem sx={{ paddingTop: 0.5, paddingBottom: 0.5 }}>
        <ListItemText
          primary="Create New Channel"
          primaryTypographyProps={{
            sx: { fontSize: 14, color: theme.textMuted },
          }}
        />
        <IconButton edge="end" aria-label="add" onClick={manageCreateRoomModal}>
          <AddIcon sx={{ color: theme.accent }} />
        </IconButton>
      </ListItem>
      <Divider sx={{ borderColor: theme.bgMain }} />

      {/* Channels header */}
      <List component="nav" aria-labelledby="nested-list-subheader">
        <ListItemButton onClick={handleClick}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <IoChatbubbles style={{ fontSize: "1.25em", color: theme.accent }} />
          </ListItemIcon>
          <ListItemText
            primary="TEXT CHANNELS"
            primaryTypographyProps={{
              sx: { fontSize: 12, color: theme.textMuted, fontWeight: 600 },
            }}
          />
          {open ? (
            <ExpandLess sx={{ color: theme.textMuted }} />
          ) : (
            <ExpandMore sx={{ color: theme.textMuted }} />
          )}
        </ListItemButton>

        {/* Channels list */}
        <Collapse in={open} timeout="auto">
          <List component="div" disablePadding>
            {channelList.map((channel) => {
              const isActive = channel.id === currentChannelId;

              return (
                <ListItemButton
                  key={channel.id}
                  sx={{
                    pl: 4,
                    py: 0.8,
                    borderRadius: 1,
                    mx: 1,
                    backgroundColor: isActive ? theme.bgInput : "transparent",
                    "&:hover": {
                      backgroundColor: "#30323a",
                    },
                  }}
                  onClick={() => goToChannel(channel.id)}
                >
                  <ListItemIcon sx={{ minWidth: 26 }}>
                    <BiHash
                      style={{
                        fontSize: "1.2em",
                        color: isActive ? "#ffffff" : theme.textMuted,
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={channel.channelName}
                    primaryTypographyProps={{
                      sx: {
                        color: isActive ? theme.textPrimary : theme.textMuted,
                        fontWeight: isActive ? 500 : 400,
                      },
                    }}
                  />
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
