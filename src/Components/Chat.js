import React, { useEffect, useState, useRef } from "react";
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
  const messagesEndRef = useRef(null);

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

  // auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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

  const formatTime = (ts) => {
    if (!ts || !ts.toDate) return "";
    const d = ts.toDate();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!channelId) {
    return (
      <Typography sx={{ color: "#b9bbbe" }}>
        Select a channel from the sidebar.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Channel header */}
      <Box
        sx={{
          height: 48,
          borderBottom: "1px solid #202225",
          display: "flex",
          alignItems: "center",
          px: 2,
          gap: 1,
          backgroundColor: "#36393f",
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <span style={{ color: "#8e9297" }}>#</span>
          {channelName}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "#b9bbbe", ml: 2, fontSize: 12 }}
        >
          This is the beginning of #{channelName}
        </Typography>
      </Box>

      {/* Messages area */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 2,
          backgroundColor: "#36393f",
        }}
      >
        {messages.map((msg) => {
          const isOwn = msg.uid === user.uid;

          return (
            <Box
              key={msg.id}
              sx={{
                display: "flex",
                gap: 1,
                mb: 1.5,
                flexDirection: isOwn ? "row-reverse" : "row",
                textAlign: isOwn ? "right" : "left",
              }}
            >
              <Avatar src={msg.photoURL} />

              <Box
                sx={{
                  maxWidth: "75%",
                  backgroundColor: isOwn ? "#5865f2" : "#2f3136",
                  borderRadius: 2,
                  p: 1,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, color: "#fff" }}
                >
                  {isOwn ? "You" : msg.name}
                </Typography>
                <Typography variant="body2" sx={{ color: "#f5f5f5" }}>
                  {msg.text}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#aaa", display: "block", mt: 0.5 }}
                >
                  {formatTime(msg.createdAt)}
                </Typography>
              </Box>
            </Box>
          );
        })}

        {messages.length === 0 && (
          <Typography variant="body2" sx={{ color: "#888" }}>
            No messages yet. Say hi 👋
          </Typography>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input area */}
      <Box
        sx={{
          borderTop: "1px solid #202225",
          p: 1.5,
          backgroundColor: "#36393f",
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 1,
          }}
        >
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#40444b",
                color: "#dcddde",
              },
            }}
            placeholder={`Message #${channelName}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            sx={{
              backgroundColor: "#5865f2",
              "&:hover": { backgroundColor: "#4752c4" },
            }}
          >
            Send
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default Chat;
