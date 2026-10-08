import type { FormEvent } from "react";
import { Button, Stack, TextField } from "@mui/material";

export default function CollectionsSearchForm({
  query,
  onQueryChange,
  onSubmit,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
}) {
  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    onSubmit();
  }

  return (
    <Stack
      component="form"
      direction="row"
      spacing={1}
      onSubmit={handleSubmit}
      sx={{ alignItems: "center" }}
    >
      <TextField
        size="small"
        fullWidth
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search collections by name"
      />
      <Button type="submit" variant="contained">
        Search
      </Button>
    </Stack>
  );
}
