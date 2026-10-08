// @vitest-environment node
/*
This test just replicates the whole build E2E in node for simple collection
*/
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect, it } from "vitest";
import { assembleTexDocument } from "./texDocument";
import { puzzlesFromOgsResponse } from "../ogs/ogsToPuzzles";
import { transformPuzzle } from "./puzzleTransform";
import { sgfToGnosPuzzle } from "./sgfToLatex";
import type { OgsPuzzle } from "../ogs/ogsApi";
import { DEFAULT_OPTIONS, type Options } from "./options";

const LATEX_DIR = fileURLToPath(
  new URL("../../public/latex/", import.meta.url),
);

async function compileWithLocalServer(tex: string): Promise<Uint8Array> {
  const server = createServer(async (req, res) => {
    const name = (req.url ?? "").slice(1);
    if (!/^[\w.-]+$/.test(name)) {
      res.writeHead(400).end();
      return;
    }
    res.writeHead(200, { "content-type": "application/octet-stream" });
    res.end(await readFile(join(LATEX_DIR, name)));
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  const { port } = server.address() as AddressInfo;

  try {
    const { LatexCompiler } = await import(
      /* @vite-ignore */ pathToFileURL(join(LATEX_DIR, "latex-api.js")).href
    );
    return await new LatexCompiler({
      baseUrl: `http://127.0.0.1:${port}`,
    }).compile(tex);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((r) => server.close(() => r()));
  }
}

function expectPdf(pdf: Uint8Array): void {
  expect(new TextDecoder().decode(pdf.subarray(0, 5))).toBe("%PDF-");
}

function puzzleListItem(name: string, id: number): OgsPuzzle {
  return {
    id,
    name,
    puzzle: {
      initial_player: "black",
      width: 9,
      height: 9,
      initial_state: { black: "bbdb", white: "ed" },
      move_tree: {
        x: -1,
        y: -1,
        branches: [
          { x: 2, y: 2, correct_answer: true },
          { x: 3, y: 3, wrong_answer: true },
        ],
      },
    },
  };
}

const OPTIONS: Options = {
  ...DEFAULT_OPTIONS,
  includeOnlyOneSolution: false,
  includeIncorrectVariations: true,
  includeToPlayText: true,
  includeDescriptions: true,
};

it("compiles a full generated document through the engine", async () => {
  const tex = assembleTexDocument(
    puzzlesFromOgsResponse([puzzleListItem("P1", 1), puzzleListItem("P2", 2)])
      .puzzles.map((puzzle) => transformPuzzle(puzzle, OPTIONS))
      .map((puzzle) => ({
        name: puzzle.name,
        outputs: sgfToGnosPuzzle(puzzle, OPTIONS.renderWholeBoard),
      })),
    OPTIONS,
    "Test Collection",
  );
  expectPdf(await compileWithLocalServer(tex));
}, 120_000);
