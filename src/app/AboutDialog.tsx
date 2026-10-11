import { Link, Stack, Typography } from "@mui/material";
import InfoDialog from "../components/InfoDialog";

type AboutDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function AboutDialog({ open, onClose }: AboutDialogProps) {
  return (
    <InfoDialog title="About" open={open} onClose={onClose}>
      <Stack spacing={1}>
        <Typography>Tsumego Print made by mi57y.</Typography>
        <Typography>
          All PDF generation on this website happens client side. Problem
          collections listed on the website are loaded by your browser directly
          from online-go.com via their API. They are not stored by or provided
          by tsumego-print server. This website has no backend of its own and
          does not process your personal information.
        </Typography>
        <Typography>
          This app is licensed under AGPL (v3 or later) and made possible by
          other free software under various licenses. Please check{" "}
          <Link
            href="https://github.com/mi57y/tsumego-print"
            target="_blank"
            rel="noopener noreferrer"
          >
            README on Github
          </Link>{" "}
          for details.
        </Typography>
      </Stack>
    </InfoDialog>
  );
}
