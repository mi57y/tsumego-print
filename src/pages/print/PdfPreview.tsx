import {
  Alert,
  Stack,
  Button,
  Box,
  CircularProgress,
  Paper,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

export default function PdfPreview({
  url,
  texUrl,
  error,
  generating,
}: {
  url: string | undefined;
  texUrl: string | undefined;
  error: string | undefined;
  generating: boolean;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
      <Stack spacing={2} sx={{ alignItems: "flex-start", height: "100%" }}>
        {error !== undefined && !generating && (
          <Alert severity="error" sx={{ width: "100%" }}>
            {error}
          </Alert>
        )}
        <Box
          sx={{
            position: "relative",
            width: "100%",
            flexGrow: 1,
            minHeight: "50vh",
          }}
        >
          {url === undefined ? (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {generating && <CircularProgress />}
            </Box>
          ) : (
            <>
              <Box
                component="iframe"
                title="Puzzles PDF preview"
                src={url}
                sx={{
                  width: "100%",
                  height: "100%",
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  filter: generating ? "grayscale(60%)" : undefined,
                }}
              />
              {generating && (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    bgcolor: (theme) =>
                      alpha(theme.palette.background.paper, 0.7),
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <CircularProgress />
                </Box>
              )}
            </>
          )}
        </Box>
        {url !== undefined && texUrl !== undefined && (
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              href={url}
              download="tsumego-print.pdf"
              disabled={generating}
            >
              Download PDF
            </Button>
            <Button
              variant="outlined"
              href={texUrl}
              download="puzzles.tex"
              disabled={generating}
            >
              Download LaTeX file
            </Button>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
