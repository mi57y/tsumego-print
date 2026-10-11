import type { ReactNode } from "react";
import { Paper, Stack, Typography } from "@mui/material";

export default function Section({
  title,
  action,
  spacing = 2,
  children,
}: {
  title?: ReactNode;
  action?: ReactNode;
  spacing?: number;
  children: ReactNode;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={spacing}>
        {(title !== undefined || action !== undefined) && (
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <Typography component="h2" variant="h6">
              {title}
            </Typography>
            {action}
          </Stack>
        )}
        {children}
      </Stack>
    </Paper>
  );
}
