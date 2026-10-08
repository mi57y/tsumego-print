import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router";
import { SELECT_COLLECTION_PATH } from "../../app/routes";
import examplePageOne from "./example-sheet-1.jpg";
import examplePageTwo from "./example-sheet-2.jpg";

const sheetShadow = "0 8px 24px rgba(0, 0, 0, 0.18)";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <Box
      component="main"
      sx={{
        flex: "1 1 0px",
        minHeight: "min-content",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <title>Tsumego Print</title>
      <Box
        sx={{
          flex: "none",
          bgcolor: "primary.main",
          color: "common.white",
          pt: { xs: 6, md: 10 },
          pb: { xs: 6, md: 8 },
        }}
      >
        <Container maxWidth="md">
          <Stack spacing={3} sx={{ alignItems: "center", textAlign: "center" }}>
            <Typography component="h2" variant="h2" sx={{ fontWeight: 700 }}>
              Print tsumego collections
            </Typography>
            <Typography
              component="p"
              variant="h6"
              sx={{ fontWeight: 400, opacity: 0.9 }}
            >
              Generate customizable PDFs with Go problems.
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              onClick={() => navigate(SELECT_COLLECTION_PATH)}
            >
              Get started
            </Button>
          </Stack>
        </Container>
      </Box>
      <Box
        sx={{
          position: "relative",
          flex: "1 1 0",
          minHeight: 0,
          width: "100%",
          maxWidth: 760,
          mx: "auto",
          mt: { xs: 4, md: 5 },
        }}
      >
        <Box
          component="img"
          src={examplePageOne}
          alt="Example printed tsumego page, first sheet"
          sx={{
            position: "absolute",
            top: 0,
            transform: "translateY(10%)",
            left: 0,
            width: "70%",
            height: "auto",
            zIndex: 1,
            bgcolor: "common.white",
            boxShadow: sheetShadow,
          }}
        />
        <Box
          component="img"
          src={examplePageTwo}
          alt="Example printed tsumego page, second sheet"
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "60%",
            height: "auto",
            zIndex: 0,
            bgcolor: "common.white",
            boxShadow: sheetShadow,
          }}
        />
      </Box>
    </Box>
  );
}
