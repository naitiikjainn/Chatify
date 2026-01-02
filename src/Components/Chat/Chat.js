
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, IconButton, CircularProgress } from '@mui/material';
import { useAuth } from '../../Context/AuthContext';
import { useChat } from '../../Hooks/useChat';
import ChatInput from './ChatInput';
import MessageBubble from '../Message/MessageBubble';
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db, storage } from '../../Firebase/Firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import GroupIcon from '@mui/icons-material/Group';
import ChannelMembers from '../ChannelMembers';

const Chat = () => {
    const { channelId } = useParams();
    const { currentUser } = useAuth();
    const { messages, loading, typingUsers, sendMessage, sendTyping, deleteForMe, deleteForEveryone, toggleReaction } = useChat(channelId);
    const messagesContainerRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [channelName, setChannelName] = useState('');
    const [channelOwnerId, setChannelOwnerId] = useState(null);
    const [membersOpen, setMembersOpen] = useState(false);

    useEffect(() => {
        if (channelId) {
            const unsub = onSnapshot(doc(db, "channels", channelId), (doc) => {
                if (doc.exists()) {
                    const data = doc.data();
                    setChannelName(data.channelName);
                    setChannelOwnerId(data.ownerUid);
                }
            });

            // Self-healing: Ensure current user is in the 'buddies' list (Backwards compatibility)
            if (currentUser) {
                setDoc(doc(db, "channels", channelId, "buddies", currentUser.uid), {
                    name: currentUser.displayName,
                    photoURL: currentUser.photoURL,
                    lastSeen: Date.now()
                }, { merge: true });
            }

            return () => unsub();
        }
    }, [channelId, currentUser]);

    const handleSend = async (text, file) => {
        if (uploading) return;

        let fileData = null;
        if (file) {
            setUploading(true);
            try {
                const path = `uploads / ${channelId}/${Date.now()}-${file.name}`;
                const storageRef = ref(storage, path);
                const uploadTask = await uploadBytesResumable(storageRef, file);
                const url = await getDownloadURL(uploadTask.ref);

                fileData = {
                    fileUrl: url,
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    storagePath: path
                };
            } catch (error) {
                console.error("Upload failed", error);
                alert("Upload failed");
                setUploading(false);
                return;
            }
        }

        try {
            await sendMessage(text, fileData);
        } catch (e) {
            console.error(e);
        } finally {
            setUploading(false);
        }
    };

    // Scroll to bottom
    useEffect(() => {
        if (messagesContainerRef.current) {
            const el = messagesContainerRef.current;
            el.scrollTop = el.scrollHeight;
        }
    }, [messages]);

    if (!channelId) {
        return (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'text.secondary', textAlign: 'center', p: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: '#f2f3f5' }}>Welcome to Chatify</Typography>
                <Typography>Select a channel from the sidebar to start chatting</Typography>
            </Box>
        )
    }

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Header */}
            <Box
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(22, 27, 34, 0.5)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 10
                }}
            >
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span style={{ color: '#00f2ea' }}>#</span> {channelName || '...'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {typingUsers.length > 0
                            ? `${typingUsers.join(', ')} is typing...`
                            : 'Active now'}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {uploading && <CircularProgress size={20} sx={{ color: '#00f2ea' }} />}
                    <IconButton onClick={() => setMembersOpen(true)} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#00f2ea' } }}>
                        <GroupIcon />
                    </IconButton>
                </Box>
            </Box>

            {/* Messages Area */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    // scrollBehavior: 'smooth' 
                }}
                ref={messagesContainerRef}
            >
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : messages.length === 0 ? (
                    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                        <Typography>No messages here yet. Say Hi! 👋</Typography>
                    </Box>
                ) : (
                    messages.map((msg) => (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            isOwn={currentUser?.uid === msg.uid}
                            currentUserId={currentUser?.uid}
                            onDeleteForMe={deleteForMe}
                            onDeleteForEveryone={deleteForEveryone}
                            onToggleReaction={toggleReaction}
                        />
                    ))
                )}
            </Box>

            {/* Input Area */}
            <ChatInput onSend={handleSend} onTyping={sendTyping} disabled={uploading} />

            {/* Members Drawer */}
            <ChannelMembers
                open={membersOpen}
                onClose={() => setMembersOpen(false)}
                channelId={channelId}
                currentUser={currentUser}
                channelOwnerUid={channelOwnerId}
            />
        </Box>
    );
};

export default Chat;
