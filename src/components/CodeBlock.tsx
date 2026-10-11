import type { ReactNode } from "react";
import { Box } from "@mui/material";

export default function CodeBlock({ children }: { children: ReactNode }) {
  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 1,
        overflowX: "auto",
        bgcolor: "action.hover",
        borderRadius: 1,
        fontFamily: "ui-monospace, Menlo, Consolas, monospace",
        fontSize: "0.875rem",
        lineHeight: 1.5,
      }}
    >
      {children}
    </Box>
  );
}
