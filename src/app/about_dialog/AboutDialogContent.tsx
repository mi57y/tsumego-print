import { Stack, Typography } from "@mui/material";

export default function AboutDialogContent() {
  return (
    <Stack spacing={1}>
      <Typography>Tsumego Print made by mi57y.</Typography>
      <Typography>
        All PDF generation on this website happens client side. Problem
        collections listed on the website are loaded by your browser directly
        from online-go.com via their API. They are not stored by or provided by
        tsumego-print server. This website has no backend of its own and does
        not process your personal information.
      </Typography>
    </Stack>
  );
}
