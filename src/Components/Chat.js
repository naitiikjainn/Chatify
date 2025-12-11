// src/Components/Chat.js
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
  IconButton,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
} from "@mui/material";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DownloadIcon from "@mui/icons-material/Download";
import { storage } from "../Firebase/Firebase";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${sizes[i]}`;
}

function Chat({ user }) {
  const { channelId } = useParams();
  const [channelName, setChannelName] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);

  // file selection + preview state
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null); // File object
  const [previewUrl, setPreviewUrl] = useState(""); // object URL or data URL
  const [previewOpen, setPreviewOpen] = useState(false);
  const [caption, setCaption] = useState("");

  // upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // channel name
  useEffect(() => {
    if (!channelId) {
      setChannelName("");
      return;
    }

    const fetchChannel = async () => {
      const docRef = doc(db, "channels", channelId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setChannelName(snap.data().channelName);
      } else {
        setChannelName("");
      }
    };

    fetchChannel();
  }, [channelId]);

  // messages listener
  useEffect(() => {
    if (!channelId) {
      setMessages([]);
      return;
    }

    const messagesRef = collection(db, "channels", channelId, "messages");
    const q = query(messagesRef, orderBy("createdAt"));

    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [channelId]);

  // auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    // cleanup object URL when selectedFile changes or component unmounts
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const sendMessage = async () => {
    if ((!text.trim() && !channelId) || !channelId) return;
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

  // when user picks a file — we create preview but DO NOT upload yet
  const onFilePicked = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // create preview URL for images; for other files keep null and show doc card
    if (file.type && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(""); // no image preview
    }

    setSelectedFile(file);
    setCaption(""); // reset caption
    setPreviewOpen(true);

    // reset input so same file can be picked later if canceled
    e.target.value = "";
  };

  const cancelPreview = () => {
    // cleanup preview URL
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl("");
    setCaption("");
    setPreviewOpen(false);
  };

  const uploadAndSend = async () => {
    if (!selectedFile || !channelId) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const path = `uploads/${channelId}/${Date.now()}-${selectedFile.name}`;
      const sRef = storageRef(storage, path);
      const task = uploadBytesResumable(sRef, selectedFile);

      task.on(
        "state_changed",
        (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(pct);
        },
        (err) => {
          console.error("Upload error:", err);
          setUploading(false);
        },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);

          // Save message with caption + file metadata
          await addDoc(collection(db, "channels", channelId, "messages"), {
            text: caption || "", // caption becomes the text of the message
            uid: user.uid,
            name: user.displayName,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            fileUrl: url,
            fileName: selectedFile.name,
            fileType: selectedFile.type,
            fileSize: selectedFile.size,
          });

          // cleanup
          setUploading(false);
          setUploadProgress(0);
          cancelPreview();
        }
      );
    } catch (err) {
      console.error(err);
      setUploading(false);
    }
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
          height: 56,
          borderBottom: "1px solid rgba(0,0,0,0.25)",
          display: "flex",
          alignItems: "center",
          px: 2,
          gap: 1,
          backgroundColor: "#2b2d34",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: 16,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            color: "#f2f3f5",
          }}
        >
          <span style={{ color: "#a1a1aa" }}>#</span>
          {channelName}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "#a1a1aa", ml: 2, fontSize: 12 }}
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
          backgroundColor: "#2b2d34",
        }}
      >
        {messages.map((msg) => {
          const isOwn = msg.uid === user.uid;

          const bubbleColor = isOwn ? "#25D366" : "#3a3f46";
          const textColor = isOwn ? "#012b0f" : "#eaeaea";

          return (
            <Box
              key={msg.id}
              sx={{
                display: "flex",
                gap: 1,
                mb: 1.5,
                flexDirection: isOwn ? "row-reverse" : "row",
                alignItems: "flex-end",
              }}
            >
              <Avatar src={msg.photoURL} sx={{ width: 36, height: 36 }} />

              <Box
                sx={{
                  maxWidth: "72%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isOwn ? "flex-end" : "flex-start",
                }}
              >
                <Box
                  sx={{
                    backgroundColor: msg.fileUrl ? "transparent" : bubbleColor,
                    color: textColor,
                    borderRadius: 2,
                    px: msg.fileUrl ? 0 : 1.25,
                    py: msg.fileUrl ? 0 : 0.75,
                    overflow: "hidden",
                  }}
                >
                  {!isOwn && (
                    <Typography variant="caption" sx={{ color: "#a1a1aa", pl: 0.5 }}>
                      {msg.name}
                    </Typography>
                  )}

                  {/* message text / caption */}
                  {msg.text ? (
                    <Typography
                      variant="body2"
                      sx={{
                        color: textColor,
                        mt: msg.fileUrl ? 0.5 : 0,
                        px: msg.fileUrl ? 1 : 0,
                      }}
                    >
                      {msg.text}
                    </Typography>
                  ) : null}

                  {/* image preview */}
                  {msg.fileUrl && msg.fileType && msg.fileType.startsWith("image/") && (
                    <Box
                      sx={{
                        mt: 1,
                        position: "relative",
                        borderRadius: 2,
                        overflow: "hidden",
                        boxShadow: "0 1px 6px rgba(0,0,0,0.4)",
                      }}
                    >
                      <img
                        src={msg.fileUrl}
                        alt={msg.fileName || "image"}
                        style={{
                          display: "block",
                          width: "100%",
                          height: "auto",
                          maxWidth: 420,
                          cursor: "pointer",
                        }}
                        onClick={() => window.open(msg.fileUrl, "_blank")}
                      />
                      {msg.fileName && (
                        <Typography variant="caption" sx={{ color: "#a1a1aa", mt: 0.5, px: 1 }}>
                          {msg.fileName}
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* non-image file card */}
                  {msg.fileUrl && (!msg.fileType || !msg.fileType.startsWith("image/")) && (
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        alignItems: "center",
                        p: 1,
                        mt: 1,
                        backgroundColor: isOwn ? "#e6f7ea" : "#3a3f46",
                        borderRadius: 1.5,
                      }}
                    >
                      <InsertDriveFileIcon sx={{ fontSize: 36, color: isOwn ? "#017a36" : "#bdbdbd" }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ color: isOwn ? "#012b0f" : "#eaeaea", fontWeight: 600 }}>
                          {msg.fileName || "Document"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: isOwn ? "#084f2b" : "#a1a1aa" }}>
                          {formatBytes(msg.fileSize)}
                        </Typography>
                      </Box>
                      <IconButton
                        component="a"
                        href={msg.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        sx={{ color: isOwn ? "#017a36" : "#eaeaea" }}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Box>
                  )}
                </Box>

                <Typography variant="caption" sx={{ color: "#a1a1aa", mt: 0.5 }}>
                  {formatTime(msg.createdAt)}
                </Typography>
              </Box>
            </Box>
          );
        })}

        {messages.length === 0 && (
          <Typography variant="body2" sx={{ color: "#a1a1aa" }}>
            No messages yet. Say hi 👋
          </Typography>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input area */}
      <Box
        sx={{
          borderTop: "1px solid rgba(0,0,0,0.25)",
          p: 1.25,
          backgroundColor: "#2b2d34",
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "center",
          }}
        >
          <IconButton
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            sx={{ color: "#7c7cff" }}
            disabled={uploading}
            aria-label="attach-file"
          >
            <AttachFileIcon />
          </IconButton>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={onFilePicked}
          />

          <TextField
            fullWidth
            size="small"
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#34363d",
                borderRadius: 3,
                color: "#f2f3f5",
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
              backgroundColor: "#7c7cff",
              "&:hover": { backgroundColor: "#6b6bff" },
              textTransform: "none",
            }}
          >
            Send
          </Button>
        </Box>

        {/* upload progress bar / percent (global while uploading) */}
        {uploading && (
          <Box sx={{ mt: 1, px: 1 }}>
            <Typography variant="caption" sx={{ color: "#a1a1aa" }}>
              Uploading: {uploadProgress}%
            </Typography>
          </Box>
        )}
      </Box>

      {/* Preview dialog (before sending) */}
      <Dialog open={previewOpen} onClose={cancelPreview} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Preview & caption</span>
          <IconButton onClick={cancelPreview} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {/* Image preview */}
          {selectedFile && selectedFile.type && selectedFile.type.startsWith("image/") ? (
            <Box sx={{ textAlign: "center" }}>
              <img
                src={previewUrl}
                alt={selectedFile.name}
                style={{ maxWidth: "100%", maxHeight: "420px", borderRadius: 8 }}
              />
              <Typography variant="caption" sx={{ display: "block", color: "#a1a1aa", mt: 1 }}>
                {selectedFile.name} • {formatBytes(selectedFile.size)}
              </Typography>
            </Box>
          ) : (
            // Non-image document preview
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", p: 1 }}>
              <InsertDriveFileIcon sx={{ fontSize: 56 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1">{selectedFile?.name || "Document"}</Typography>
                <Typography variant="caption" sx={{ color: "#a1a1aa" }}>
                  {formatBytes(selectedFile?.size)}
                </Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ color: "#a1a1aa", mb: 0.5 }}>
              Add a caption (optional)
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              multiline
              minRows={1}
              maxRows={4}
            />
          </Box>

          {/* show immediate progress if uploading started */}
          {uploading && (
            <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={18} />
              <Typography variant="caption" sx={{ color: "#a1a1aa" }}>
                Uploading {uploadProgress}%
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={cancelPreview} disabled={uploading}>Cancel</Button>
          <Button
            variant="contained"
            onClick={uploadAndSend}
            disabled={uploading}
            sx={{ backgroundColor: "#7c7cff", "&:hover": { backgroundColor: "#6b6bff" } }}
          >
            {uploading ? `Sending (${uploadProgress}%)` : "Send"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Chat;
