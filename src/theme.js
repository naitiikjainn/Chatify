import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00f2ea', // Neon Cyan
      contrastText: '#090b10',
    },
    secondary: {
      main: '#ff0055', // Neon Pink
      contrastText: '#fff',
    },
    background: {
      default: '#090b10', // Deep Space
      paper: '#161b22',   // Slightly lighter
    },
    text: {
      primary: '#f2f3f5',
      secondary: '#a1a1aa',
    },
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'radial-gradient(circle at 10% 20%, rgb(15, 18, 30) 0%, rgb(9, 11, 16) 90%)',
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(22, 27, 34, 0.7)', // Glass base
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '8px 20px',
        },
        containedPrimary: {
          boxShadow: '0 0 15px rgba(0, 242, 234, 0.3)',
          '&:hover': {
            boxShadow: '0 0 25px rgba(0, 242, 234, 0.5)',
          },
        },
      },
    },
  },
});

export default theme;
