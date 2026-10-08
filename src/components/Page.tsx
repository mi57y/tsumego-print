import type { ReactNode } from "react";
import { Container } from "@mui/material";

export default function Page({ children }: { children: ReactNode }) {
  return (
    <Container
      maxWidth="lg"
      sx={{ py: 4, flexGrow: 1, display: "flex", flexDirection: "column" }}
    >
      {children}
    </Container>
  );
}
