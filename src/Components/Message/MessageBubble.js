
import React, { useState } from 'react';
import { Box, Typography, Avatar, IconButton, Menu, MenuItem, Zoom, Tooltip } from '@mui/material';

import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddReactionIcon from '@mui/icons-material/AddReaction';

const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "🔥", "👍"];

const MessageBubble = ({ message, isOwn, onDeleteForMe, onDeleteForEveryone, onToggleReaction, currentUserId }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    // Reaction Drawer State (Simple Hover or Click)
    const [showReactionPicker, setShowReactionPicker] = useState(false);

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleDeleteMe = () => {
        onDeleteForMe(message.id);
        handleClose();
    };

    const handleDeleteEveryone = () => {
        onDeleteForEveryone(message.id);
        handleClose();
    };

    if (message.deletedForEveryone) {
        return (
            <Box sx={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', mb: 2, gap: 1.5, opacity: 0.6 }}>
                {!isOwn && <Avatar sx={{ width: 32, height: 32 }} />}
                <Box
                    sx={{
                        p: '8px 16px',
                        borderRadius: 4,
                        border: '1px solid rgba(255,255,255,0.05)',
                        background: 'rgba(255,255,255,0.03)',
                        fontStyle: 'italic'
                    }}
                >
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Message deleted
                    </Typography>
                </Box>
            </Box>
        )
    }

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: isOwn ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
                gap: 1.5,
                mb: 2, // Space between message groups
                maxWidth: '100%',
                '&:hover .message-actions': { opacity: 1, pointerEvents: 'auto' }
            }}
        >
            {!isOwn && (
                <Avatar
                    src={message.photoURL}
                    alt={message.name}
                    sx={{ width: 32, height: 32, mb: 0.5, border: '1px solid rgba(255,255,255,0.1)' }}
                />
            )}

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isOwn ? 'flex-end' : 'flex-start',
                    maxWidth: '70%',
                }}
            >
                {!isOwn && (
                    <Typography variant="caption" sx={{ ml: 1, mb: 0.5, color: 'text.secondary', fontSize: '0.7rem' }}>
                        {message.name}
                    </Typography>
                )}

                <Box
                    sx={{
                        px: 2.5,
                        py: 1.5,
                        borderRadius: 3,
                        // Fluid shape: rounded on all corners except the one pointing to the avatar/edge
                        borderTopLeftRadius: 3 * 8,
                        borderTopRightRadius: 3 * 8,
                        borderBottomLeftRadius: isOwn ? 3 * 8 : 4,
                        borderBottomRightRadius: isOwn ? 4 : 3 * 8,

                        // Premium Gradients
                        background: isOwn
                            ? 'linear-gradient(135deg, #00f2ea 0%, #00c2ff 100%)' // Bright Cyan -> Blue
                            : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)', // Glass

                        backdropFilter: isOwn ? 'none' : 'blur(10px)',
                        border: isOwn ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                        boxShadow: isOwn
                            ? '0 4px 15px rgba(0, 242, 234, 0.2), 0 2px 4px rgba(0,0,0,0.1)'
                            : '0 2px 5px rgba(0,0,0,0.05)',

                        color: isOwn ? '#000' : '#fff', // Black text on cyan, White on glass
                        transition: 'transform 0.1s ease',
                        position: 'relative',
                    }}
                >
                    {message.text && (
                        <Typography
                            variant="body1"
                            sx={{
                                wordBreak: 'break-word',
                                fontSize: '0.95rem',
                                lineHeight: 1.5,
                                fontWeight: 500
                            }}
                        >
                            {message.text}
                        </Typography>
                    )}

                    {message.fileUrl && message.fileType?.startsWith('image/') && (
                        <Box
                            component="img"
                            src={message.fileUrl}
                            alt="attachment"
                            sx={{
                                mt: message.text ? 1 : 0,
                                maxWidth: '100%',
                                borderRadius: 2,
                                maxHeight: 300,
                                border: '1px solid rgba(255,255,255,0.1)',
                                display: 'block'
                            }}
                        />
                    )}

                    {message.fileUrl && !message.fileType?.startsWith('image/') && (
                        <Typography
                            variant="caption"
                            sx={{
                                display: 'block',
                                mt: 0.5,
                                color: isOwn ? 'rgba(0,0,0,0.7)' : 'primary.main',
                                textDecoration: 'underline',
                                fontWeight: 600
                            }}
                            component="a"
                            href={message.fileUrl}
                            target="_blank"
                        >
                            {message.fileName || "Download File"}
                        </Typography>
                    )}

                </Box>
                <Typography
                    variant="caption"
                    sx={{
                        mt: 0.5,
                        px: 1,
                        color: 'rgba(255,255,255,0.3)',
                        fontSize: '0.65rem'
                    }}
                >
                    {message.createdAt?.toDate ? message.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </Typography>

                {/* Reaction Chips */}
                {message.reactions && Object.keys(message.reactions).length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
                        {Object.entries(message.reactions).map(([emoji, userIds]) => {
                            const count = userIds.length;
                            const iReacted = userIds.includes(currentUserId);
                            return (
                                <Box
                                    key={emoji}
                                    onClick={() => onToggleReaction(message.id, emoji)}
                                    sx={{
                                        borderRadius: 4,
                                        px: 1,
                                        py: 0.2,
                                        background: iReacted ? 'rgba(0, 242, 234, 0.2)' : 'rgba(255,255,255,0.05)',
                                        border: iReacted ? '1px solid rgba(0, 242, 234, 0.4)' : '1px solid rgba(255,255,255,0.1)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        fontSize: '0.75rem',
                                        color: '#fff',
                                        '&:hover': { background: 'rgba(255,255,255,0.1)' }
                                    }}
                                >
                                    <span>{emoji}</span>
                                    <span style={{ opacity: 0.7 }}>{count}</span>
                                </Box>
                            )
                        })}
                    </Box>
                )}
            </Box>

            {/* Actions Group (Menu + Reaction Trigger) */}
            <Box
                className="message-actions"
                sx={{
                    opacity: open ? 1 : 0,
                    pointerEvents: open ? 'auto' : 'none',
                    transition: 'opacity 0.2s',
                    alignSelf: 'center',
                    mx: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative'
                }}
            >
                {/* Picker Popup */}
                <Zoom in={showReactionPicker}>
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 40,
                            right: isOwn ? 0 : 'auto',
                            left: isOwn ? 'auto' : 0,
                            borderRadius: 50,
                            background: 'rgba(22, 27, 34, 0.9)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            p: 0.5,
                            display: 'flex',
                            gap: 0.5,
                            zIndex: 10,
                            boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                        }}
                        onMouseLeave={() => setShowReactionPicker(false)}
                    >
                        {REACTION_EMOJIS.map(emoji => (
                            <IconButton
                                key={emoji}
                                size="small"
                                onClick={() => {
                                    onToggleReaction(message.id, emoji);
                                    setShowReactionPicker(false);
                                }}
                                sx={{
                                    fontSize: '1.2rem',
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'scale(1.4)' }
                                }}
                            >
                                {emoji}
                            </IconButton>
                        ))}
                    </Box>
                </Zoom>

                <IconButton
                    size="small"
                    onClick={() => setShowReactionPicker(!showReactionPicker)}
                    sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#ff0055' } }}
                >
                    <AddReactionIcon fontSize="small" />
                </IconButton>

                <IconButton size="small" onClick={handleMenu} sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#fff' } }}>
                    <MoreVertIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Menu */}
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                    sx: {
                        background: '#161b22',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'text.primary',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                    }
                }}
            >
                <MenuItem onClick={handleDeleteMe}>Delete for me</MenuItem>
                {isOwn && <MenuItem onClick={handleDeleteEveryone} sx={{ color: 'error.main' }}>Delete for everyone</MenuItem>}
            </Menu>

        </Box>
    );
};

export default MessageBubble;
