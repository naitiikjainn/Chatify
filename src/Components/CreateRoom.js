import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";

function CreateRoom({ create, manage }) {
  const [value, setValue] = useState("");

  const handleCreate = () => {
    create(value);
    setValue("");
    manage();
  };

  return (
    <Dialog open onClose={manage}>
      <DialogTitle>Create New Channel</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          margin="dense"
          label="Channel name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={manage}>Cancel</Button>
        <Button variant="contained" onClick={handleCreate}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreateRoom;
