import { useState } from "react";
import { Alert, Button, Stack } from "@mui/material";

export default function SgfUploadForm({
  onUpload,
}: {
  onUpload: (file: File) => Promise<void>;
}) {
  const [error, setError] = useState<string>();

  async function handleFile(file: File): Promise<void> {
    setError(undefined);
    try {
      await onUpload(file);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(
        `Failed to parse the file.\nCheck "Format info" for details on the expected file format.\nError: ${message}`,
      );
    }
  }

  return (
    <Stack spacing={2}>
      <Button component="label" variant="contained">
        Choose SGF file
        <input
          type="file"
          accept=".sgf"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file !== undefined) void handleFile(file);
          }}
        />
      </Button>
      {error !== undefined && (
        <Alert severity="error" sx={{ whiteSpace: "pre-line" }}>
          {error}
        </Alert>
      )}
    </Stack>
  );
}
