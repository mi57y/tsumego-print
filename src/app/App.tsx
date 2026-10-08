import { RouterProvider } from "react-router";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { PrintSessionProvider } from "./PrintSession";
import { router } from "./router";
import { theme } from "./theme";

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PrintSessionProvider>
        <RouterProvider router={router} />
      </PrintSessionProvider>
    </ThemeProvider>
  );
}
