import { Button, Grid, Stack, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router";
import OptionsForm from "./OptionsForm";
import PdfPreview from "./PdfPreview";
import { SELECT_COLLECTION_PATH } from "../../app/routes";
import { usePrintSession, type LoadedCollection } from "../../app/PrintSession";
import Section from "../../components/Section";

export default function CollectionPreview({
  collection,
}: {
  collection: LoadedCollection;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { options, setOptions, pdf } = usePrintSession();
  const { puzzles, failed } = collection;

  function changeCollection(): void {
    if (location.key === "default") {
      navigate(SELECT_COLLECTION_PATH, { replace: true });
    } else {
      navigate(-1);
    }
  }

  return (
    <Stack spacing={3} sx={{ flexGrow: 1 }}>
      <Section spacing={1}>
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ alignItems: "center", flexWrap: "wrap" }}
        >
          <Button
            size="small"
            variant="outlined"
            onClick={changeCollection}
            sx={{ whiteSpace: "nowrap" }}
          >
            ← Change collection...
          </Button>
          <Typography>
            <strong>Selected collection:</strong> {collection.name}
          </Typography>
        </Stack>
        <Stack>
          <Typography>Collection loaded successfully.</Typography>
          <Typography>
            {puzzles.length}/{puzzles.length + failed} problems successfully
            parsed
          </Typography>
          <Typography>
            {puzzles.filter((p) => p.noOfSolutions > 0).length}/{puzzles.length}{" "}
            problems have solutions
          </Typography>
          <Typography>
            {puzzles.filter((p) => p.noOfWrongVariations > 0).length}/
            {puzzles.length} problems include responses to incorrect moves
          </Typography>
        </Stack>
      </Section>
      <Grid container spacing={3} sx={{ flexGrow: { md: 1 } }}>
        <Grid size={{ xs: 12, md: "auto" }}>
          <Section title="Options" spacing={1}>
            <OptionsForm
              options={options}
              onChange={setOptions}
              hasSolutions={puzzles.some((p) => p.noOfSolutions > 0)}
              hasWrongVariations={puzzles.some(
                (p) => p.noOfWrongVariations > 0,
              )}
            />
          </Section>
        </Grid>
        <Grid size={{ xs: 12, md: "grow" }}>
          <PdfPreview
            url={pdf.url}
            texUrl={pdf.texUrl}
            error={pdf.error}
            generating={pdf.generating}
          />
        </Grid>
      </Grid>
    </Stack>
  );
}
