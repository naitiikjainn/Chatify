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
    <Box sx={{ color: "#dcddde" }}>
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
          borderBottom: "1px solid #202225",
          backgroundColor: "#2f3136",
        }}
      >
        <Typography sx={{ fontWeight: 700 }}>Chatify Server</Typography>
        <Typography variant="caption" sx={{ color: "#b9bbbe" }}>
          Channels
        </Typography>
      </Box>

      {/* Create channel row */}
      <ListItem sx={{ paddingTop: 0.5, paddingBottom: 0.5 }}>
        <ListItemText
          primary="Create New Channel"
          primaryTypographyProps={{ sx: { fontSize: 14, color: "#b9bbbe" } }}
        />
        <IconButton edge="end" aria-label="add" onClick={manageCreateRoomModal}>
          <AddIcon sx={{ color: "#5865f2" }} />
        </IconButton>
      </ListItem>
      <Divider sx={{ borderColor: "#202225" }} />

      {/* Channels header */}
      <List component="nav" aria-labelledby="nested-list-subheader">
        <ListItemButton onClick={handleClick}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <IoChatbubbles
              style={{ fontSize: "1.25em", color: "#5865f2" }}
            />
          </ListItemIcon>
          <ListItemText
            primary="TEXT CHANNELS"
            primaryTypographyProps={{
              sx: { fontSize: 12, color: "#8e9297", fontWeight: 600 },
            }}
          />
          {open ? (
            <ExpandLess sx={{ color: "#8e9297" }} />
          ) : (
            <ExpandMore sx={{ color: "#8e9297" }} />
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
                    py: 0.5,
                    backgroundColor: isActive ? "#36393f" : "transparent",
                    borderLeft: isActive
                      ? "3px solid #5865f2"
                      : "3px solid transparent",
                    "&:hover": { backgroundColor: "#393c43" },
                  }}
                  onClick={() => goToChannel(channel.id)}
                >
                  <ListItemIcon sx={{ minWidth: 26 }}>
                    <BiHash
                      style={{
                        fontSize: "1.2em",
                        color: isActive ? "#ffffff" : "#8e9297",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      channel.channelName.length <= 18
                        ? channel.channelName
                        : `${channel.channelName.substr(0, 18)}...`
                    }
                    primaryTypographyProps={{
                      sx: {
                        color: isActive ? "#ffffff" : "#dcddde",
                        fontSize: 14,
                        fontWeight: isActive ? 600 : 400,
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
