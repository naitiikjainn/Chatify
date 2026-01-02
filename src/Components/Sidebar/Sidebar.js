import React, { useState } from 'react';
import {
    Box, Typography, Button, List, ListItem,
    ListItemText, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField,
    IconButton, ListItemIcon, Drawer
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import TagIcon from '@mui/icons-material/Tag';
import ExploreIcon from '@mui/icons-material/Explore';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { useRooms } from '../../Hooks/useRooms';
import ProfileSettings from '../ProfileSettings';



const Sidebar = () => {
    const { joinedRooms, createRoom } = useRooms();
    const { logout, currentUser } = useAuth();
    const navigate = useNavigate();
    const { channelId } = useParams();
    const [profileOpen, setProfileOpen] = useState(false);

    // Create Room State
    const [openCreate, setOpenCreate] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [newRoomPassword, setNewRoomPassword] = useState('');

    const handleCreate = async () => {
        if (!newRoomName.trim()) return;
        try {
            const id = await createRoom(newRoomName, newRoomPassword);
            setOpenCreate(false);
            setNewRoomName('');
            setNewRoomPassword('');
            navigate(`/channel/${id}`);
        } catch (e) {
            alert("Error creating room");
        }
    };

    return (
        <Box
            sx={{
                width: 280,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid rgba(255,255,255,0.05)',
                backgroundColor: 'rgba(0,0,0,0.2)',
            }}
        >
            {/* Header */}
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 1, background: 'linear-gradient(45deg, #00f2ea, #ff0055)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                    Chatify
                </Typography>
                <Box>
                    <IconButton onClick={() => setProfileOpen(true)} size="small" sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#00f2ea' } }}>
                        <SettingsIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'white' } }} onClick={() => navigate('/explore')}>
                        <ExploreIcon /> {/* Changed from TravelExploreIcon to ExploreIcon based on import */}
                    </IconButton>
                </Box>
            </Box>

            {/* Channels List */}
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
                <Box sx={{ px: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 700 }}>
                        Channels
                    </Typography>
                    <IconButton size="small" onClick={() => setOpenCreate(true)} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                        <AddIcon fontSize="small" />
                    </IconButton>
                </Box>

                <List dense>
                    {joinedRooms.map((room) => {
                        const active = room.id === channelId;
                        return (
                            <ListItem
                                key={room.id}
                                button
                                onClick={() => navigate(`/channel/${room.id}`)}
                                sx={{
                                    mx: 1,
                                    width: 'auto',
                                    borderRadius: 1,
                                    mb: 0.5,
                                    backgroundColor: active ? 'rgba(0, 242, 234, 0.1)' : 'transparent',
                                    color: active ? 'primary.main' : 'text.secondary',
                                    '&:hover': {
                                        backgroundColor: active ? 'rgba(0, 242, 234, 0.15)' : 'rgba(255,255,255,0.05)',
                                        color: active ? 'primary.main' : 'text.primary'
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                                    <TagIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={room.channelName}
                                    primaryTypographyProps={{ fontWeight: active ? 600 : 400 }}
                                />
                            </ListItem>
                        )
                    })}
                </List>
            </Box>

            {/* User Profile Footer */}
            <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                    component="img"
                    src={currentUser?.photoURL}
                    sx={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid #00f2ea' }}
                />
                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                    <Typography variant="subtitle2" noWrap>{currentUser?.displayName}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Online</Typography>
                </Box>
                <IconButton onClick={logout} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
                    <LogoutIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Create Dialog */}
            <Dialog open={openCreate} onClose={() => setOpenCreate(false)} PaperProps={{ sx: { background: '#161b22', border: '1px solid rgba(255,255,255,0.1)' } }}>
                <DialogTitle>Create Channel</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        variant="outlined"
                        label="Channel Name"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        sx={{ mt: 1 }}
                        InputProps={{
                            sx: { color: 'white' }
                        }}
                        InputLabelProps={{
                            sx: { color: 'rgba(255,255,255,0.7)' }
                        }}
                    />
                    <TextField
                        fullWidth
                        variant="outlined"
                        label="Password (Optional)"
                        type="password"
                        value={newRoomPassword}
                        onChange={(e) => setNewRoomPassword(e.target.value)}
                        sx={{ mt: 2 }}
                        InputProps={{
                            sx: { color: 'white' }
                        }}
                        InputLabelProps={{
                            sx: { color: 'rgba(255,255,255,0.7)' }
                        }}
                        helperText="Leave empty for public channel"
                        FormHelperTextProps={{ sx: { color: 'rgba(255,255,255,0.5)' } }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreate}>Create</Button>
                </DialogActions>
            </Dialog>
            {/* Profile Dialog */}
            <ProfileSettings
                open={profileOpen}
                onClose={() => setProfileOpen(false)}
                currentUser={currentUser}
            />
        </Box>
    );
};

export default Sidebar;
