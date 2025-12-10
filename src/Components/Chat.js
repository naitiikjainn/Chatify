import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../Firebase/Firebase";
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
} from "@mui/material";

function Chat({ user }) {
  const { channelId } = useParams();
  const [channelName, setChannelName] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  // channel name
  useEffect(() => {
    if (!channelId) return;

    const fetchChannel = async () => {
      const ref = doc(db, "channels", channelId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setChannelName(snap.data().channelName);
      }
    };

    fetchChannel();
  }, [channelId]);

  // messages listener
  useEffect(() => {
    if (!channelId) return;

    const messagesRef = collection(db, "channels", channelId, "messages");
    const q = query(messagesRef, orderBy("createdAt"));

    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });

    return () => unsub();
  }, [channelId]);

  const sendMessage = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "channels", channelId, "messages"), {
      text,
      uid: user.uid,
      name: user.displayName,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
    });

    setText("");
  };

  if (!channelId) {
    return <Typography>Select a channel</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        #{channelName || "loading..."}
      </Typography>

      {/* messages list */}
      <Box
        sx={{
          maxHeight: 420,
          overflowY: "auto",
          mb: 2,
          border: "1px solid #333",
          borderRadius: 1,
          p: 1.5,
        }}
      >
        {messages.map((msg) => (
          <Box
            key={msg.id}
            sx={{ display: "flex", gap: 1, mb: 1.5 }}
          >
            <Avatar src={msg.photoURL} />
            <Box>
              <Typography variant="subtitle2">{msg.name}</Typography>
              <Typography variant="body2">{msg.text}</Typography>
            </Box>
          </Box>
        ))}

        {messages.length === 0 && (
          <Typography variant="body2" sx={{ color: "#888" }}>
            No messages yet. Say hi 👋
          </Typography>
        )}
      </Box>

      {/* input + send */}
      <Box sx={{ display: "flex", gap: 1 }}>
        <TextField
          fullWidth
          placeholder={`Message #${channelName}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button variant="contained" onClick={sendMessage}>
          Send
        </Button>
      </Box>
    </Box>
  );
}

export default Chat;
