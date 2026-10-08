import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

type AboutDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function AboutDialog({ open, onClose }: AboutDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        About
        <IconButton aria-label="close" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1}>
          <Typography>
            All PDF generation on this website happens client side. Problem
            collections listed on the website are loaded by your browser
            directly from online-go.com via their API. They are not stored by or
            provided by tsumego-print server. This website has no backend of its
            own and does not process your personal information.
          </Typography>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
