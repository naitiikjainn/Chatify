// src/Components/Chat.js
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

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
  setDoc,
  deleteDoc,
  runTransaction,
  updateDoc,
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
  Chip,
  Menu,
  MenuItem,
} from "@mui/material";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DownloadIcon from "@mui/icons-material/Download";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ThumbUpAltOutlinedIcon from "@mui/icons-material/ThumbUpAltOutlined";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import { storage } from "../Firebase/Firebase";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

const INSTAGRAM_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏"];

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

  // message container + scroll state
  const messagesContainerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const prevMessagesLenRef = useRef(0);
  const navigate = useNavigate();

  // file selection + preview state
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [caption, setCaption] = useState("");

  // upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // typing indicator state
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimerRef = useRef(null);

  // reaction picker state
  const [openPickerFor, setOpenPickerFor] = useState(null);

  // delete / menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuMessage, setMenuMessage] = useState(null);

  // messages hidden for this user (delete for me)
  const [hiddenMessagesSet, setHiddenMessagesSet] = useState(new Set());

  
  // ---------------- fetch channel name ----------------
  useEffect(() => {
    if (!channelId) {
      setChannelName("");
      return;
    }
    let mounted = true;
    const fetchChannel = async () => {
      try {
        const docRef = doc(db, "channels", channelId);
        const snap = await getDoc(docRef);
        if (!mounted) return;
        if (snap.exists()) setChannelName(snap.data().channelName || "");
        else setChannelName("");
      } catch (err) {
        console.error("fetchChannel error:", err);
      }
    };
    fetchChannel();
    return () => {
      mounted = false;
    };
  }, [channelId]);

  // ---------------- messages listener ----------------
  useEffect(() => {
    if (!channelId) {
      setMessages([]);
      prevMessagesLenRef.current = 0;
      return;
    }
    const messagesRef = collection(db, "channels", channelId, "messages");
    const q = query(messagesRef, orderBy("createdAt"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMessages(docs);

        // compute how many new messages arrived
        const prevLen = prevMessagesLenRef.current || 0;
        const newLen = docs.length;
        const delta = Math.max(0, newLen - prevLen);
        prevMessagesLenRef.current = newLen;

        // check scroll position immediately and decide scrolling / counter
        const el = messagesContainerRef.current;
        const threshold = 50; // px (tweakable)
        const atBottomNow = el ? el.scrollHeight - (el.scrollTop + el.clientHeight) <= threshold : true;

        if (atBottomNow) {
          // auto-scroll if at bottom
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
          setNewMessagesCount(0);
          setIsAtBottom(true);
        } else {
          // increment by actual delta (fallback to +1)
          setNewMessagesCount((c) => c + (delta || 1));
        }
      },
      (err) => {
        console.error("messages onSnapshot error", err);
      }
    );

    return () => unsub();
  }, [channelId]);

  // ---------------- robust scroll detection ----------------
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const checkAtBottom = () => {
      const threshold = 50; // px
      const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
      const atBottom = distanceFromBottom <= threshold;
      setIsAtBottom(atBottom);
      if (atBottom) setNewMessagesCount(0);
    };

    // initial check after layout
    setTimeout(checkAtBottom, 0);

    el.addEventListener("scroll", checkAtBottom, { passive: true });
    return () => el.removeEventListener("scroll", checkAtBottom);
  }, []);
useEffect(() => {
  if (!channelId) return;

  const ref = doc(db, "channels", channelId);
  const unsub = onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      // Channel deleted → redirect to default
      navigate("/");
    }
  });

  return () => unsub();
}, [channelId]);

  // ensure we scroll when messages change and user is at bottom
  useEffect(() => {
    if (!messagesContainerRef.current) return;
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setNewMessagesCount(0);
    }
  }, [messages, isAtBottom]);

  // ---------------- mark channel read on enter and cleanup typing on leave ----------------
  useEffect(() => {
    if (!channelId || !user) return;
    const myReadRef = doc(db, "users", user.uid, "channelReads", channelId);
    setDoc(myReadRef, { lastRead: serverTimestamp() }, { merge: true }).catch(() => {});

    // cleanup typing doc on leave
    return () => {
      deleteDoc(doc(db, "channels", channelId, "typing", user.uid)).catch(() => {});
    };
  }, [channelId, user]);

  // ---------------- typing listener ----------------
  useEffect(() => {
    if (!channelId) {
      setTypingUsers([]);
      return;
    }
    const typingCol = collection(db, "channels", channelId, "typing");
    const unsub = onSnapshot(typingCol, (snap) => {
      const now = Date.now();
      const active = [];
      snap.docs.forEach((d) => {
        const data = d.data();
        const lastSeen = data.lastSeen && data.lastSeen.toDate ? data.lastSeen.toDate().getTime() : 0;
        if (now - lastSeen < 6000) {
          if (data.name && d.id !== user?.uid) active.push(data.name);
        }
      });
      setTypingUsers(active);
    });
    return () => unsub();
  }, [channelId, user]);

  // ---------------- load user's deletedMessages ----------------
  useEffect(() => {
    if (!user) {
      setHiddenMessagesSet(new Set());
      return;
    }
    const colRef = collection(db, "users", user.uid, "deletedMessages");
    const unsub = onSnapshot(colRef, (snap) => {
      const s = new Set();
      snap.docs.forEach((d) => s.add(d.id));
      setHiddenMessagesSet(s);
    });
    return () => unsub();
  }, [user]);

  // ---------------- send typing presence ----------------
  const sendTyping = async () => {
    if (!channelId || !user) return;
    const typingDoc = doc(db, "channels", channelId, "typing", user.uid);
    try {
      await setDoc(typingDoc, { name: user.displayName, lastSeen: serverTimestamp() }, { merge: true });
    } catch (err) {
      // ignore transient errors
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(async () => {
      try {
        await deleteDoc(typingDoc);
      } catch (e) {
        // ignore
      }
    }, 5000);
  };

  // ---------------- send text message ----------------
  const sendMessage = async () => {
    if (!channelId || !text.trim() || !user) return;
    try {
      await addDoc(collection(db, "channels", channelId, "messages"), {
        text,
        uid: user.uid,
        name: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
      });
      // mark sender's lastRead
      await setDoc(doc(db, "users", user.uid, "channelReads", channelId), { lastRead: serverTimestamp() }, { merge: true });
      setText("");
    } catch (err) {
      console.error("sendMessage error:", err);
    }
  };

  // ---------------- file picked -> preview ----------------
  const onFilePicked = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl("");
    }
    setSelectedFile(file);
    setCaption("");
    setPreviewOpen(true);
    e.target.value = "";
  };

  const cancelPreview = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl("");
    setCaption("");
    setPreviewOpen(false);
  };

  // ---------------- upload file and send ----------------
  const uploadAndSend = async () => {
    if (!selectedFile || !channelId || !user) return;
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
          try {
            const url = await getDownloadURL(task.snapshot.ref);
            await addDoc(collection(db, "channels", channelId, "messages"), {
              text: caption || "",
              uid: user.uid,
              name: user.displayName,
              photoURL: user.photoURL,
              createdAt: serverTimestamp(),
              fileUrl: url,
              fileName: selectedFile.name,
              fileType: selectedFile.type,
              fileSize: selectedFile.size,
              storagePath: path,
            });
            await setDoc(doc(db, "users", user.uid, "channelReads", channelId), { lastRead: serverTimestamp() }, { merge: true });
          } catch (err) {
            console.error("uploadAndSend finalization error:", err);
          } finally {
            setUploading(false);
            setUploadProgress(0);
            cancelPreview();
          }
        }
      );
    } catch (err) {
      console.error(err);
      setUploading(false);
    }
  };

  // ---------- Reactions: Instagram style ----------
  const toggleReactionInstagram = async (messageId, emoji) => {
    if (!channelId || !messageId || !user) return;
    const msgRef = doc(db, "channels", channelId, "messages", messageId);

    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(msgRef);
        if (!snap.exists()) return;
        const data = snap.data();
        const reactions = data.reactions || {};

        let previousEmoji = null;
        for (const [key, arr] of Object.entries(reactions)) {
          if (Array.isArray(arr) && arr.includes(user.uid)) {
            previousEmoji = key;
            break;
          }
        }

        if (previousEmoji === emoji) {
          const newArr = (reactions[emoji] || []).filter((u) => u !== user.uid);
          const newReactions = { ...reactions, [emoji]: newArr };
          if (newArr.length === 0) delete newReactions[emoji];
          tx.update(msgRef, { reactions: newReactions });
          return;
        }

        const newReactions = { ...reactions };
        if (previousEmoji) {
          newReactions[previousEmoji] = (newReactions[previousEmoji] || []).filter((u) => u !== user.uid);
          if (newReactions[previousEmoji].length === 0) delete newReactions[previousEmoji];
        }
        newReactions[emoji] = Array.from(new Set([...(newReactions[emoji] || []), user.uid]));
        tx.update(msgRef, { reactions: newReactions });
      });
    } catch (err) {
      console.error("Reaction transaction failed:", err);
    }
  };

  const getUserReaction = (msg) => {
    if (!msg?.reactions || !user) return null;
    for (const [emoji, arr] of Object.entries(msg.reactions)) {
      if (Array.isArray(arr) && arr.includes(user.uid)) return emoji;
    }
    return null;
  };

  // ---------- Delete for me & Delete for everyone ----------
  const openMenuForMessage = (event, message) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuMessage(message);
  };
  const closeMenu = () => {
    setMenuAnchorEl(null);
    setMenuMessage(null);
  };

  const deleteForMe = async (messageId) => {
    if (!user || !messageId) return;
    try {
      await setDoc(doc(db, "users", user.uid, "deletedMessages", messageId), { deletedAt: serverTimestamp() });
      closeMenu();
    } catch (err) {
      console.error("deleteForMe failed:", err);
    }
  };

  // IMPORTANT: client-side guard + safe update
  const deleteForEveryone = async (message) => {
    if (!message || !message.id || !user) return;

    // Client-side guard: allow only author OR admin
    // NOTE: server rules MUST enforce this — client checks are only UX improvements.
    const isAuthor = message.uid === user.uid;
    const isAdmin = !!user.isAdmin; // adjust if you store admin differently (e.g. user.customClaims.admin)
    if (!isAuthor && !isAdmin) {
      console.warn("deleteForEveryone blocked on client: not author or admin");
      closeMenu();
      return;
    }

    const msgDocRef = doc(db, "channels", channelId, "messages", message.id);

    try {
      // Use a merge so we don't replace unrelated fields accidentally
      await setDoc(
        msgDocRef,
        {
          deletedForEveryone: true,
          deletedBy: user.uid,
          deletedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // attempt to delete storage object if storagePath exists (best-effort)
      if (message.storagePath) {
        try {
          const fileRef = storageRef(storage, message.storagePath);
          await deleteObject(fileRef);
        } catch (err) {
          // warn but continue; file might not exist or permission denied
          console.warn("Storage delete failed (non-fatal):", err.message || err);
        }
      }

      closeMenu();
    } catch (err) {
      console.error("deleteForEveryone failed:", err);
    }
  };

  // UI helpers for reaction picker
  const openPicker = (messageId) => setOpenPickerFor(messageId);
  const closePicker = () => setOpenPickerFor(null);

  // Helper: render message content (handles deletedForEveryone and hidden messages)
  const renderMessageContent = (msg, isOwn) => {
    if (msg.deletedForEveryone) {
      return (
        <Box sx={{ px: 1 }}>
          <Typography variant="body2" sx={{ fontStyle: "italic", color: "#a1a1aa" }}>
            This message was deleted
          </Typography>
          <Typography variant="caption" sx={{ color: "#888" }}>
            {msg.deletedBy === user?.uid ? "You deleted this message" : "Deleted"}
          </Typography>
        </Box>
      );
    }

    return (
      <>
        {msg.text ? (
          <Typography
            variant="body2"
            sx={{
              color: isOwn ? "#012b0f" : "#eaeaea",
              mt: msg.fileUrl ? 0.5 : 0,
              px: msg.fileUrl ? 1 : 0,
            }}
          >
            {msg.text}
          </Typography>
        ) : null}

        {/* Images */}
        {msg.fileUrl && msg.fileType && msg.fileType.startsWith("image/") && (
          <Box sx={{ mt: 1, position: "relative", borderRadius: 2, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.4)" }}>
            <img
              src={msg.fileUrl}
              alt={msg.fileName || "image"}
              style={{ display: "block", width: "100%", height: "auto", maxWidth: 420, cursor: "pointer" }}
              onClick={() => window.open(msg.fileUrl, "_blank")}
            />
            {msg.fileName && <Typography variant="caption" sx={{ color: "#a1a1aa", mt: 0.5, px: 1 }}>{msg.fileName}</Typography>}
          </Box>
        )}

        {/* Non-image file */}
        {msg.fileUrl && (!msg.fileType || !msg.fileType.startsWith("image/")) && (
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", p: 1, mt: 1, backgroundColor: isOwn ? "#e6f7ea" : "#3a3f46", borderRadius: 1.5 }}>
            <InsertDriveFileIcon sx={{ fontSize: 36, color: isOwn ? "#017a36" : "#bdbdbd" }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ color: isOwn ? "#012b0f" : "#eaeaea", fontWeight: 600 }}>{msg.fileName || "Document"}</Typography>
              <Typography variant="caption" sx={{ color: isOwn ? "#084f2b" : "#a1a1aa" }}>{formatBytes(msg.fileSize)}</Typography>
            </Box>
            <IconButton component="a" href={msg.fileUrl} target="_blank" rel="noreferrer" sx={{ color: isOwn ? "#017a36" : "#eaeaea" }}>
              <DownloadIcon />
            </IconButton>
          </Box>
        )}
      </>
    );
  };

  const formatTime = (ts) => {
    if (!ts || !ts.toDate) return "";
    const d = ts.toDate();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <Box sx={{ height: 56, borderBottom: "1px solid rgba(0,0,0,0.25)", display: "flex", alignItems: "center", px: 2, gap: 1, backgroundColor: "#2b2d34" }}>
        <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5, color: "#f2f3f5" }}>
          <span style={{ color: "#a1a1aa" }}>#</span>
          {channelName}
        </Typography>
        <Typography variant="body2" sx={{ color: "#a1a1aa", ml: 2, fontSize: 12 }}>
          This is the beginning of #{channelName}
        </Typography>
      </Box>

      {/* Messages container */}
      <Box ref={messagesContainerRef} sx={{ flex: 1, overflowY: "auto", p: 2, backgroundColor: "#2b2d34", position: "relative" }}>
        {messages.map((msg) => {
          // skip if deleted for this user
          if (hiddenMessagesSet.has(msg.id)) return null;

          const isOwn = msg.uid === user?.uid;
          const bubbleColor = isOwn ? "#25D366" : "#3a3f46";
          const textColor = isOwn ? "#012b0f" : "#eaeaea";

          return (
            <Box key={msg.id} sx={{ display: "flex", gap: 1, mb: 1.5, flexDirection: isOwn ? "row-reverse" : "row", alignItems: "flex-end", position: "relative" }}>
              <Avatar src={msg.photoURL} sx={{ width: 36, height: 36 }} />

              <Box sx={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isOwn ? "flex-end" : "flex-start" }}>
                <Box sx={{ backgroundColor: msg.fileUrl ? "transparent" : bubbleColor, color: textColor, borderRadius: 2, px: msg.fileUrl ? 0 : 1.25, py: msg.fileUrl ? 0 : 0.75, overflow: "hidden", position: "relative" }}>
                  {!isOwn && <Typography variant="caption" sx={{ color: "#a1a1aa", pl: 0.5 }}>{msg.name}</Typography>}

                  {/* content or deleted placeholder */}
                  {renderMessageContent(msg, isOwn)}
                </Box>

                {/* actions row: reactions + menu */}
                <Box sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", flexWrap: "wrap" }}>
                    {msg.reactions &&
                      Object.entries(msg.reactions).map(([emoji, arr]) => {
                        const count = Array.isArray(arr) ? arr.length : 0;
                        const reactedByMe = Array.isArray(arr) && arr.includes(user.uid);
                        return (
                          <Chip
                            key={emoji}
                            label={`${emoji}${count > 1 ? ` ${count}` : ""}`.trim()}
                            size="small"
                            variant={reactedByMe ? "filled" : "outlined"}
                            onClick={() => toggleReactionInstagram(msg.id, emoji)}
                            sx={{
                              cursor: "pointer",
                              fontSize: 13,
                              backgroundColor: reactedByMe ? "#5865f2" : undefined,
                              color: reactedByMe ? "#fff" : undefined,
                              minWidth: 36,
                            }}
                          />
                        );
                      })}
                  </Box>

                  <IconButton
                    size="small"
                    onClick={() => {
                      if (openPickerFor === msg.id) closePicker();
                      else openPicker(msg.id);
                    }}
                    sx={{ ml: 0.5, color: "#a1a1aa" }}
                  >
                    <ThumbUpAltOutlinedIcon fontSize="small" />
                  </IconButton>

                  {/* menu trigger */}
                  <IconButton size="small" onClick={(e) => openMenuForMessage(e, msg)} sx={{ color: "#a1a1aa", ml: 0.5 }}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Typography variant="caption" sx={{ color: "#a1a1aa", mt: 0.5 }}>{formatTime(msg.createdAt)}</Typography>
              </Box>

              {/* picker popup (simple inline) */}
              {openPickerFor === msg.id && (
                <Box
                  sx={{
                    position: "absolute",
                    right: isOwn ? 120 : "auto",
                    left: isOwn ? "auto" : 80,
                    transform: "translateY(-10px)",
                    mt: -1,
                    display: "flex",
                    gap: 0.5,
                    p: 0.5,
                    borderRadius: 2,
                    background: "rgba(255,255,255,0.03)",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
                    zIndex: 40,
                  }}
                >
                  {INSTAGRAM_EMOJIS.map((emoji) => {
                    const usersArr = msg.reactions?.[emoji] || [];
                    const reacted = Array.isArray(usersArr) && usersArr.includes(user?.uid);
                    return (
                      <Box
                        key={emoji}
                        onClick={() => {
                          toggleReactionInstagram(msg.id, emoji);
                          setOpenPickerFor(null);
                        }}
                        sx={{
                          cursor: "pointer",
                          fontSize: 20,
                          px: 0.5,
                          py: 0.25,
                          borderRadius: 1,
                          border: reacted ? "1px solid rgba(255,255,255,0.12)" : "none",
                          background: reacted ? "rgba(88,101,242,0.12)" : "transparent",
                        }}
                        role="button"
                        aria-label={`react-${emoji}`}
                      >
                        {emoji}
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          );
        })}

        {messages.length === 0 && <Typography variant="body2" sx={{ color: "#a1a1aa" }}>No messages yet. Say hi 👋</Typography>}

        <div ref={messagesEndRef} />

        {/* New messages floating button */}
        {newMessagesCount > 0 && !isAtBottom && (
          <Button
            variant="contained"
            onClick={() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
              setNewMessagesCount(0);
            }}
            sx={{
              position: "fixed",
              right: 24,
              bottom: { xs: 96, sm: 88 },
              backgroundColor: "#7c7cff",
              color: "#fff",
              textTransform: "none",
              boxShadow: "0 8px 26px rgba(0,0,0,0.45)",
              zIndex: 1400,
              minWidth: 110,
              borderRadius: 20,
              py: 1,
              px: 2,
              fontWeight: 600,
              transition: "transform 200ms ease, opacity 200ms ease",
            }}
          >
            {newMessagesCount > 1 ? `${newMessagesCount} new` : "New message"}
          </Button>
        )}
      </Box>

      {/* Typing indicator */}
      <Box sx={{ px: 2, py: 0.5, minHeight: 28 }}>
        {typingUsers.length > 0 && <Typography variant="caption" sx={{ color: "#a1a1aa" }}>{typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...</Typography>}
      </Box>

      {/* Input area */}
      <Box sx={{ borderTop: "1px solid rgba(0,0,0,0.25)", p: 1.25, backgroundColor: "#2b2d34" }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <IconButton onClick={() => fileInputRef.current && fileInputRef.current.click()} sx={{ color: "#7c7cff" }} disabled={uploading} aria-label="attach-file">
            <AttachFileIcon />
          </IconButton>

          <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={onFilePicked} />

          <TextField
            fullWidth
            size="small"
            variant="outlined"
            sx={{ "& .MuiOutlinedInput-root": { backgroundColor: "#34363d", borderRadius: 3, color: "#f2f3f5" } }}
            placeholder={`Message #${channelName}`}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              sendTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button variant="contained" onClick={sendMessage} sx={{ backgroundColor: "#7c7cff", "&:hover": { backgroundColor: "#6b6bff" }, textTransform: "none" }}>
            Send
          </Button>
        </Box>

        {uploading && (
          <Box sx={{ mt: 1, px: 1 }}>
            <Typography variant="caption" sx={{ color: "#a1a1aa" }}>Uploading: {uploadProgress}%</Typography>
            <Box sx={{ width: "100%", height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 1, mt: 0.5 }}>
              <Box sx={{ width: `${uploadProgress}%`, height: "100%", background: "#7c7cff", borderRadius: 1 }} />
            </Box>
          </Box>
        )}
      </Box>

      {/* Preview dialog (before sending) */}
      <Dialog open={previewOpen} onClose={cancelPreview} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Preview & caption</span>
          <IconButton onClick={cancelPreview} size="small"><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {selectedFile && selectedFile.type && selectedFile.type.startsWith("image/") ? (
            <Box sx={{ textAlign: "center" }}>
              <img src={previewUrl} alt={selectedFile.name} style={{ maxWidth: "100%", maxHeight: "420px", borderRadius: 8 }} />
              <Typography variant="caption" sx={{ display: "block", color: "#a1a1aa", mt: 1 }}>{selectedFile.name} • {formatBytes(selectedFile.size)}</Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", p: 1 }}>
              <InsertDriveFileIcon sx={{ fontSize: 56 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1">{selectedFile?.name || "Document"}</Typography>
                <Typography variant="caption" sx={{ color: "#a1a1aa" }}>{formatBytes(selectedFile?.size)}</Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ color: "#a1a1aa", mb: 0.5 }}>Add a caption (optional)</Typography>
            <TextField fullWidth size="small" placeholder="Write a caption..." value={caption} onChange={(e) => setCaption(e.target.value)} multiline minRows={1} maxRows={4} />
          </Box>

          {uploading && (
            <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={18} />
              <Typography variant="caption" sx={{ color: "#a1a1aa" }}>Uploading {uploadProgress}%</Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={cancelPreview} disabled={uploading}>Cancel</Button>
          <Button variant="contained" onClick={uploadAndSend} disabled={uploading} sx={{ backgroundColor: "#7c7cff", "&:hover": { backgroundColor: "#6b6bff" } }}>
            {uploading ? `Sending (${uploadProgress}%)` : "Send"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Message menu (Delete for me / Delete for everyone) */}
      <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={closeMenu} anchorOrigin={{ vertical: "top", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
        <MenuItem onClick={() => { if (menuMessage) deleteForMe(menuMessage.id); }}>Delete for me</MenuItem>

        {/* show Delete for everyone only if current user is author or admin */}
        {menuMessage && (menuMessage.uid === user?.uid || !!user?.isAdmin) ? (
          <MenuItem onClick={() => { if (menuMessage) deleteForEveryone(menuMessage); }}>Delete for everyone</MenuItem>
        ) : null}
      </Menu>
    </Box>
  );
}

export default Chat;
