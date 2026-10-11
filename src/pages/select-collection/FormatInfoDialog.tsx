import { Stack, Typography } from "@mui/material";
import InfoDialog from "../../components/InfoDialog";
import CodeBlock from "../../components/CodeBlock";

type FormatInfoDialogProps = {
  open: boolean;
  onClose: () => void;
};

const EXAMPLE = [
  "(;GM[1]FF[4]SZ[9]",
  "AB[da][ab][bb][cb][db]AW[ea][eb][ac][bc][cc][dc][ec]",
  ";W[ba])",
  "(;GM[1]FF[4]SZ[9]",
  "AB[da][ab][bb][cb][db]AW[ea][eb][ac][bc][cc][dc][ec]",
  ";B[ba])",
].join("\n");

export default function FormatInfoDialog({
  open,
  onClose,
}: FormatInfoDialogProps) {
  return (
    <InfoDialog title="Format info" open={open} onClose={onClose}>
      <Stack spacing={1}>
        <Typography>
          Upload a single SGF file containing one or more game trees. Each game
          tree should be a separate problem.
        </Typography>
        <Typography>
          Stones added with AB/AW are treated as the initial setup, and then
          each variation is treated as a separate correct solution that can be
          printed. Wrong-answer variations are currently not supported.
        </Typography>
        <Typography>Example file with two problems:</Typography>
        <CodeBlock>{EXAMPLE}</CodeBlock>
      </Stack>
    </InfoDialog>
  );
}
