import React, { useEffect, useState } from 'react';
import {
    Drawer, Box, Typography, Avatar, List, ListItem,
    ListItemAvatar, ListItemText, IconButton, Badge, Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import CircleIcon from '@mui/icons-material/Circle';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../Firebase/Firebase';

const ChannelMembers = ({ open, onClose, channelId, currentUser, channelOwnerUid }) => {
    const [members, setMembers] = useState([]);

    useEffect(() => {
        if (!channelId || !open) return;

        // Query users who have this channelId in their 'joinedChannels' map/array?
        // Our structure logic in useRooms was:
        // user -> joinedChannels (subcollection) -> docId = channelId
        // So we can't query "users where joinedChannels contains channelId" easily efficiently without a collectionGroup query or similar.
        // ALTERNATIVE: When user joins, add them to `channels/{id}/members` subcollection.
        // CURRENTLY: We only added to `users/{uid}/joinedChannels/{channelId}`. 

        // TO FIX THIS properly for "Admin Kick", we should probably start tracking members in the channel document or subcollection.
        // FOR NOW (Retrofitting): We'll use a hacky fetch or assuming we add a 'members' subcollection from now on?
        // Let's implement a listener on `users` collection is too expensive.
        // Let's change the Join Logic to ALSO add to `channels/{id}/buddies/{uid}`.
        // AND for this component, we listen to `channels/{id}/buddies`.

        const q = collection(db, "channels", channelId, "buddies");
        const unsub = onSnapshot(q, (snap) => {
            const list = [];
            snap.forEach(d => list.push({ uid: d.id, ...d.data() }));
            setMembers(list);
        });
        return () => unsub();

    }, [channelId, open]);

    const handleKick = async (targetUid) => {
        if (!window.confirm("Kick this user?")) return;
        try {
            // 1. Remove from channel buddies
            await updateDoc(doc(db, "channels", channelId, "buddies", targetUid), { kicked: true }); // Soft delete or hard delete? 
            // Better: hard delete from buddies
            // But actually we need to remove from the User's joinedChannels list so they don't see it sidebar.

            // This requires Admin permissions on 'users' collection which we might not have in strict rules, but for this demo we assume yes.
            await updateDoc(doc(db, "users", targetUid, "joinedChannels", channelId), {
                kickedAt: Date.now()
            });

            // Also delete from buddies list
            // deleteDoc(doc(db, "channels", channelId, "buddies", targetUid));
            // But we need to refresh the list; listener handles it if we delete.
        } catch (e) {
            console.error(e);
            alert("Could not kick user (Permissions?)");
        }
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: 300,
                    background: 'rgba(22, 27, 34, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderLeft: '1px solid rgba(255,255,255,0.1)'
                }
            }}
        >
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff' }}>
                    Members
                </Typography>
                <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            <List sx={{ p: 2 }}>
                {members.length === 0 && (
                    <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', mt: 4 }}>
                        No active members found
                    </Typography>
                )}
                {members.map(m => (
                    <ListItem
                        key={m.uid}
                        secondaryAction={
                            (currentUser.uid === channelOwnerUid && m.uid !== currentUser.uid) && (
                                <Tooltip title="Kick User">
                                    <IconButton edge="end" onClick={() => handleKick(m.uid)} sx={{ color: '#ff0055' }}>
                                        <PersonRemoveIcon />
                                    </IconButton>
                                </Tooltip>
                            )
                        }
                    >
                        <ListItemAvatar>
                            <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                badgeContent={
                                    <CircleIcon sx={{ fontSize: 12, color: '#00f2ea' }} />
                                }
                            >
                                <Avatar src={m.photoURL} alt={m.name} />
                            </Badge>
                        </ListItemAvatar>
                        <ListItemText
                            primary={m.name}
                            primaryTypographyProps={{ color: '#fff' }}
                            secondary={m.uid === channelOwnerUid ? "Owner" : "Member"}
                            secondaryTypographyProps={{ sx: { color: m.uid === channelOwnerUid ? '#00f2ea' : 'text.secondary' } }}
                        />
                    </ListItem>
                ))}
            </List>
        </Drawer>
    );
};

export default ChannelMembers;
