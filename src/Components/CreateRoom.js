// src/Components/CreateRoom.js
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
} from "@mui/material";

function CreateRoom({ create, manage }) {
  const [value, setValue] = useState("");

  const normalize = (str) =>
    str
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");

  const handleCreate = () => {
    const cleaned = normalize(value);
    if (!cleaned) return;
    create(cleaned);
    setValue("");
    manage();
  };

  return (
    <Dialog
      open
      onClose={manage}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "#2f3136",
          color: "#fff",
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 18 }}>
          Create Text Channel
        </Typography>
        <Typography variant="caption" sx={{ color: "#b9bbbe" }}>
          Channels organize conversations by topic.
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Typography
            variant="caption"
            sx={{ color: "#8e9297", fontWeight: 600 }}
          >
            CHANNEL NAME
          </Typography>

          <TextField
            autoFocus
            fullWidth
            placeholder="e.g. general"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreate();
              }
            }}
            sx={{
              mt: 1,
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#40444b",
                color: "#dcddde",
              },
            }}
          />

          <Typography
            variant="caption"
            sx={{ color: "#8e9297", mt: 1, display: "block" }}
          >
            Automatically converted to lowercase-with-dashes.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={manage}
          sx={{ color: "#b9bbbe", "&:hover": { backgroundColor: "#3c3f45" } }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleCreate}
          sx={{
            backgroundColor: "#5865f2",
            "&:hover": { backgroundColor: "#4752c4" },
          }}
        >
          Create Channel
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreateRoom;
