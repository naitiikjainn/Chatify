import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Box, Avatar, Typography
} from '@mui/material';
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from '../Firebase/Firebase';

const ProfileSettings = ({ open, onClose, currentUser }) => {
    const [name, setName] = useState(currentUser?.displayName || '');
    const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || '');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateProfile(currentUser, {
                displayName: name,
                photoURL: photoURL
            });

            // Should also calculate and update in 'users' collection if we used it as source of truth.
            // But we use Auth state mostly.
            // Update in firestore just in case for searches
            await updateDoc(doc(db, "users", currentUser.uid), {
                name: name,
                photoURL: photoURL
            });

            onClose();
            // Might need page reload to reflect everywhere or context update
            window.location.reload();
        } catch (e) {
            console.error(e);
            alert("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    background: '#161b22',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    minWidth: 350
                }
            }}
        >
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 1 }}>
                    <Avatar
                        src={photoURL}
                        sx={{ width: 80, height: 80, border: '2px solid #00f2ea' }}
                    />

                    <TextField
                        fullWidth
                        label="Display Name"
                        variant="outlined"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        InputProps={{
                            sx: { color: 'white' }
                        }}
                        InputLabelProps={{
                            sx: { color: 'rgba(255,255,255,0.7)' }
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Avatar URL"
                        variant="outlined"
                        value={photoURL}
                        onChange={(e) => setPhotoURL(e.target.value)}
                        placeholder="https://..."
                        helperText="Paste a direct image link"
                        InputProps={{
                            sx: { color: 'white' }
                        }}
                        InputLabelProps={{
                            sx: { color: 'rgba(255,255,255,0.7)' }
                        }}
                        FormHelperTextProps={{
                            sx: { color: 'rgba(255,255,255,0.5)' }
                        }}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
                <Button onClick={handleSave} variant="contained" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProfileSettings;
