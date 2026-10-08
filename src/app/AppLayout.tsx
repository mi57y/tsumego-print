import { useEffect, useRef, useState } from "react";
import { Box, Button, Container, Link, Typography } from "@mui/material";
import {
  Link as RouterLink,
  Outlet,
  useLocation,
  useNavigate,
  useNavigationType,
} from "react-router";
import AboutDialog from "./AboutDialog";
import { LANDING_PATH, SELECT_COLLECTION_PATH } from "./routes";
import { usePrintSession } from "./PrintSession";

export default function AppLayout() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const { collection } = usePrintSession();
  const previousPathname = useRef<string | undefined>(undefined);

  useEffect(() => {
    const from = previousPathname.current;
    previousPathname.current = location.pathname;
    if (
      navigationType === "POP" &&
      from === LANDING_PATH &&
      location.pathname === SELECT_COLLECTION_PATH &&
      collection !== undefined
    ) {
      navigate(collection.path);
    }
  }, [location.key]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Box component="header" sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Container
          maxWidth="lg"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 3,
          }}
        >
          <Typography component="h1" variant="h4">
            <Link
              component={RouterLink}
              to={LANDING_PATH}
              color="inherit"
              underline="none"
            >
              Tsumego Print
            </Link>
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setAboutOpen(true)}
          >
            About
          </Button>
        </Container>
      </Box>
      <Outlet />
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </Box>
  );
}
