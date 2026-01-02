import React, { useState, useRef } from 'react';
import { Box, TextField, IconButton, Paper, Typography, Tooltip } from '@mui/material';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

const ChatInput = ({ onSend, onTyping, disabled }) => {
    const [text, setText] = useState('');
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);

    const handleSend = () => {
        if ((!text.trim() && !file) || disabled) return;

        let fileData = null;
        if (file) {
            fileData = file;
        }

        onSend(text, fileData);
        setText('');
        setFile(null);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleChange = (e) => {
        setText(e.target.value);
        if (onTyping) onTyping();
    };

    const handleFileSelect = (e) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
        }
        e.target.value = "";
    };

    return (
        <Box sx={{ p: 3, pb: 4, position: 'relative' }}>
            {/* Floating File Preview */}
            {file && (
                <Paper
                    elevation={6}
                    sx={{
                        position: 'absolute',
                        top: -60,
                        left: 24,
                        p: 1.5,
                        px: 2,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1.5,
                        background: 'rgba(28, 30, 40, 0.95)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid #00f2ea',
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        color: '#fff',
                        maxWidth: '80%',
                        zIndex: 10
                    }}
                >
                    <InsertDriveFileRoundedIcon sx={{ color: '#00f2ea' }} />
                    <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {file.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            Attached
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setFile(null)} sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#ff0055' } }}>
                        <CloseRoundedIcon fontSize="small" />
                    </IconButton>
                </Paper>
            )}

            <Paper
                elevation={0}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: '6px 8px',
                    borderRadius: 4,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:focus-within': {
                        border: '1px solid #00f2ea',
                        background: 'rgba(0, 242, 234, 0.02)',
                        boxShadow: '0 0 25px rgba(0, 242, 234, 0.15), 0 0 10px rgba(0, 242, 234, 0.1)'
                    }
                }}
            >
                <Tooltip title="Attach File">
                    <IconButton
                        sx={{
                            p: '12px',
                            color: file ? '#00f2ea' : 'text.secondary',
                            transition: 'all 0.2s',
                            '&:hover': { color: '#00f2ea', transform: 'scale(1.1)' }
                        }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <AttachFileRoundedIcon />
                    </IconButton>
                </Tooltip>

                <input
                    type="file"
                    hidden
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                />

                <TextField
                    sx={{ ml: 1, flex: 1 }}
                    placeholder="Type a message..."
                    variant="standard"
                    multiline
                    maxRows={4}
                    value={text}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    InputProps={{
                        disableUnderline: true,
                        sx: {
                            color: '#fff',
                            fontSize: '1rem',
                            '&::placeholder': {
                                color: 'rgba(255, 255, 255, 0.3)',
                                fontStyle: 'italic'
                            }
                        }
                    }}
                />

                <Box
                    sx={{
                        height: 40,
                        width: 40,
                        ml: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <IconButton
                        onClick={handleSend}
                        disabled={disabled || (!text.trim() && !file)}
                        sx={{
                            backgroundColor: (!text.trim() && !file) ? 'rgba(255,255,255,0.05)' : '#00f2ea',
                            color: (!text.trim() && !file) ? 'rgba(255,255,255,0.1)' : '#000',
                            width: 40,
                            height: 40,
                            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            '&:hover': {
                                backgroundColor: '#00c2ff',
                                transform: 'scale(1.1) rotate(-10deg)',
                                boxShadow: '0 0 15px rgba(0, 242, 234, 0.6)'
                            },
                            '&:disabled': {
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                color: 'rgba(255,255,255,0.1)'
                            }
                        }}
                    >
                        <SendRoundedIcon sx={{ fontSize: 20, ml: 0.5 }} />
                    </IconButton>
                </Box>
            </Paper>
        </Box>
    );
};

export default ChatInput;
