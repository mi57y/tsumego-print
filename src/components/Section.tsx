import type { ReactNode } from "react";
import { Paper, Stack, Typography } from "@mui/material";

export default function Section({
  title,
  spacing = 2,
  children,
}: {
  title?: ReactNode;
  spacing?: number;
  children: ReactNode;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={spacing}>
        {title !== undefined && (
          <Typography component="h2" variant="h6">
            {title}
          </Typography>
        )}
        {children}
      </Stack>
    </Paper>
  );
}
