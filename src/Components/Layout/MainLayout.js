import React from 'react';
import { Box } from '@mui/material';
import Sidebar from '../Sidebar/Sidebar'; // We will create this next
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
    return (
        <Box
            sx={{
                display: 'flex',
                height: '100vh',
                width: '100vw',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #090b10 0%, #161b22 100%)',
                color: 'text.primary',
                position: 'relative',
            }}
        >
            {/* Ambient background blobs for neon effect */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '-10%',
                    left: '-10%',
                    width: '40vw',
                    height: '40vw',
                    background: 'radial-gradient(circle, rgba(0, 242, 234, 0.15) 0%, rgba(0,0,0,0) 70%)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: 0,
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    bottom: '-10%',
                    right: '-10%',
                    width: '40vw',
                    height: '40vw',
                    background: 'radial-gradient(circle, rgba(255, 0, 85, 0.15) 0%, rgba(0,0,0,0) 70%)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: 0,
                }}
            />

            {/* Glass Container */}
            <Box
                sx={{
                    zIndex: 1,
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    backdropFilter: 'blur(20px)',
                }}
            >
                <Sidebar />
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};

export default MainLayout;
