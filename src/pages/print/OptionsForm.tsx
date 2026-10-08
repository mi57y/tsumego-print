import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Checkbox,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import { keyframes } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  DIAGRAM_SIZES_PT,
  MAX_FONT_SIZE_PT,
  MIN_FONT_SIZE_PT,
  type ColorMode,
  type Options,
  type PaperSize,
} from "../../pdf/options";

interface OptionsFormProps {
  options: Options;
  onChange: (options: Options) => void;
  hasSolutions: boolean;
  hasWrongVariations: boolean;
}

const COLOR_MODE_ITEMS: { value: ColorMode; label: string }[] = [
  { value: "randomize", label: "Randomize stone colors" },
  { value: "original", label: "Keep original stone colors" },
  { value: "black", label: "Make all problems black to play" },
  { value: "white", label: "Make all problems white to play" },
];

const popIn = keyframes`
  0% { transform: scale(0); }
  20% { transform: scale(1.6); }
  33%, 67% { transform: scale(1); }
  87% { transform: scale(1.6); }
  100% { transform: scale(1); }
`;

const PAPER_SIZES: { value: PaperSize; label: string }[] = [
  { value: "a4", label: "A4" },
  { value: "letter", label: "Letter" },
];

export default function OptionsForm({
  options,
  onChange,
  hasSolutions,
  hasWrongVariations,
}: OptionsFormProps) {
  function checkbox(
    key:
      | "randomizeOrientation"
      | "includeSolutions"
      | "includeOnlyOneSolution"
      | "includeIncorrectVariations"
      | "renderWholeBoard"
      | "collectionNameAtTop"
      | "includeCollectionNameFooter"
      | "includeToPlayText"
      | "includeDescriptions"
      | "useOriginalProblemNames"
      | "randomizeProblemOrder",
    label: string,
    help?: string,
    warning?: string,
  ): React.ReactElement {
    const disabled =
      ((key === "includeSolutions" || key === "includeOnlyOneSolution") &&
        !hasSolutions) ||
      (key === "includeIncorrectVariations" && !hasWrongVariations) ||
      (key === "includeOnlyOneSolution" && !options.includeSolutions);
    const checked = disabled ? false : options[key];
    function onChangeEvent(event: React.ChangeEvent<HTMLInputElement>): void {
      const checked = event.target.checked;
      if (key === "includeSolutions" && !checked) {
        onChange({
          ...options,
          includeSolutions: false,
          includeOnlyOneSolution: true,
        });
        return;
      }
      onChange({ ...options, [key]: checked });
    }
    return (
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={checked}
            disabled={disabled}
            onChange={onChangeEvent}
          />
        }
        label={
          help === undefined && warning === undefined ? (
            label
          ) : (
            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
              <span>{label}</span>
              {help !== undefined && (
                <Tooltip title={help}>
                  <InfoOutlinedIcon fontSize="small" color="action" />
                </Tooltip>
              )}
              {warning !== undefined && (
                <Tooltip title={warning}>
                  <WarningAmberIcon
                    fontSize="small"
                    color="warning"
                    sx={{ animation: `${popIn} 1.5s ease-out` }}
                  />
                </Tooltip>
              )}
            </Stack>
          )
        }
      />
    );
  }

  return (
    <Stack spacing={1}>
      <TextField
        select
        fullWidth
        size="small"
        label="Stone colors"
        value={options.colors}
        onChange={(event) =>
          onChange({ ...options, colors: event.target.value as ColorMode })
        }
      >
        {COLOR_MODE_ITEMS.map(({ value, label }) => (
          <MenuItem key={value} value={value}>
            {label}
          </MenuItem>
        ))}
      </TextField>
      <FormGroup>
        {checkbox("randomizeProblemOrder", "Randomize problem order")}
        {checkbox("randomizeOrientation", "Randomize board orientation")}
        {checkbox("includeSolutions", "Include solutions")}
        {checkbox(
          "includeOnlyOneSolution",
          "Include only one solution variation",
          "Some collections include many alternative correct moves. By default, only one of them is included in the PDF.",
        )}
        {checkbox(
          "includeIncorrectVariations",
          "Include incorrect variations",
          "Some collections include responses to incorrect moves. Usually there are many such variations, so check the document size before printing.",
        )}
        {checkbox(
          "includeDescriptions",
          "Include descriptions",
          undefined,
          options.colors === "original"
            ? undefined
            : "Stone colors are changed, so descriptions mentioning Black or White may be wrong.",
        )}
        {checkbox("includeToPlayText", 'Include "Black/White to play" text')}
        {checkbox(
          "useOriginalProblemNames",
          "Use original problem names",
          'If disabled, generic names ("Problem 1", "Problem 2", ...) are used instead of the original ones.',
        )}
      </FormGroup>
      <Accordion
        variant="outlined"
        disableGutters
        sx={{ borderRadius: 1, "&::before": { display: "none" } }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          Page layout
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1}>
            <FormGroup>
              {checkbox("renderWholeBoard", "Always render the whole board")}
              {checkbox("collectionNameAtTop", "Collection name at the top")}
              {checkbox(
                "includeCollectionNameFooter",
                "Include collection name on every page",
              )}
            </FormGroup>
            <Stack spacing={2}>
              <TextField
                select
                fullWidth
                size="small"
                label="Paper size"
                value={options.paperSize}
                onChange={(event) =>
                  onChange({
                    ...options,
                    paperSize: event.target.value as PaperSize,
                  })
                }
              >
                {PAPER_SIZES.map(({ value, label }) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                fullWidth
                size="small"
                label="Columns"
                value={options.columns}
                onChange={(event) =>
                  onChange({
                    ...options,
                    columns: parseInt(event.target.value, 10),
                  })
                }
              >
                {[1, 2, 3, 4].map((n) => (
                  <MenuItem key={n} value={n}>
                    {n}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                type="number"
                fullWidth
                size="small"
                label="Margin (cm)"
                slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
                value={options.marginCm > 0 ? options.marginCm : ""}
                onChange={(event) => {
                  const value = parseFloat(event.target.value);
                  onChange({
                    ...options,
                    marginCm: Number.isNaN(value) ? 0 : value,
                  });
                }}
              />
              <TextField
                type="number"
                fullWidth
                size="small"
                label="Problem name and description font size (pt)"
                slotProps={{
                  htmlInput: {
                    min: MIN_FONT_SIZE_PT,
                    max: MAX_FONT_SIZE_PT,
                    step: 0.5,
                  },
                }}
                value={options.fontSizePt > 0 ? options.fontSizePt : ""}
                onChange={(event) => {
                  const value = parseFloat(event.target.value);
                  onChange({
                    ...options,
                    fontSizePt: Number.isNaN(value) ? 0 : value,
                  });
                }}
              />
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Diagram size (pt)"
                  value={options.diagramSizePt}
                  onChange={(event) =>
                    onChange({
                      ...options,
                      diagramSizePt: parseInt(event.target.value, 10),
                    })
                  }
                >
                  {DIAGRAM_SIZES_PT.map((n) => (
                    <MenuItem key={n} value={n}>
                      {n}
                    </MenuItem>
                  ))}
                </TextField>
                <Tooltip title="Diagrams will always scale down if needed to fit inside the configured columns. Reduce the number of columns to actually use the bigger sizes.">
                  <InfoOutlinedIcon fontSize="small" color="action" />
                </Tooltip>
              </Stack>
            </Stack>
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
}
