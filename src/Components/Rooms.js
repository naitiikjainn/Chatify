import React, { useState, useEffect } from "react";
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Divider,
  Snackbar,
  Fade,
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
import { useNavigate } from "react-router-dom";

function Rooms() {
  const [open, setOpen] = useState(true);
  const [channelList, setChannelList] = useState([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [alert, setAlert] = useState(false);
  const navigate = useNavigate(); // ✅ proper init

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
    // ✅ channel pe click → route change
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

    // duplicate check
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
      console.log("added new channel");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div>
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

      {/* Create channel row */}
      <ListItem sx={{ paddingTop: 0, paddingBottom: 0 }}>
        <ListItemText primary="Create New Channel" />
        <IconButton edge="end" aria-label="add" onClick={manageCreateRoomModal}>
          <AddIcon sx={{ color: "#cb43fc" }} />
        </IconButton>
      </ListItem>
      <Divider />

      {/* Channels header */}
      <List component="nav" aria-labelledby="nested-list-subheader">
        <ListItem button onClick={handleClick}>
          <ListItemIcon>
            <IoChatbubbles
              style={{ fontSize: "1.5em", color: "#cb43fc" }}
            />
          </ListItemIcon>
          <ListItemText primary="CHANNELS" sx={{ color: "#8e9297" }} />
          {open ? (
            <ExpandLess sx={{ color: "#cb43fc" }} />
          ) : (
            <ExpandMore sx={{ color: "#cb43fc" }} />
          )}
        </ListItem>

        {/* Channels list */}
        <Collapse in={open} timeout="auto">
          <List component="div" disablePadding>
            {channelList.map((channel) => (
              <ListItem
                key={channel.id}
                button
                sx={{ pl: 4 }}
                onClick={() => goToChannel(channel.id)} // ✅ yahi main change
              >
                <ListItemIcon sx={{ minWidth: "30px" }}>
                  <BiHash
                    style={{
                      fontSize: "1.3em",
                      color: "#b9bbbe",
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={
                    channel.channelName.length <= 12
                      ? channel.channelName
                      : `${channel.channelName.substr(0, 12)}...`
                  }
                  sx={{ color: "#dcddde" }}
                />
              </ListItem>
            ))}
          </List>
        </Collapse>
      </List>
    </div>
  );
}

export default Rooms;
