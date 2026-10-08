import { texToPdf } from "./latex";
import { assembleTexDocument } from "./texDocument";
import { sgfToGnosPuzzle } from "./sgfToLatex";
import { transformPuzzle } from "./puzzleTransform";
import type { Puzzle } from "../puzzle/types";
import type { Options } from "./options";

console.log("[latexWorker] worker module loaded");

export interface GenerateRequest {
  type: "generate";
  id: number;
  puzzles: Puzzle[];
  options: Options;
  collectionName: string;
}

type GenerateResponse =
  | {
      ok: true;
      id: number;
      pdf: ArrayBufferLike;
      tex: string;
    }
  | { ok: false; id: number; error: string };

function shuffled<T>(items: T[]): T[] {
  return items
    .map((item) => ({ item, key: Math.random() }))
    .sort((a, b) => a.key - b.key)
    .map(({ item }) => item);
}

async function generate(request: GenerateRequest): Promise<GenerateResponse> {
  const { id, puzzles: requestedPuzzles, options, collectionName } = request;
  console.log("[latexWorker] generate start", {
    id,
    puzzles: requestedPuzzles.length,
  });
  const puzzles = options.randomizeProblemOrder
    ? shuffled(requestedPuzzles)
    : requestedPuzzles;
  const outputs = puzzles.map((puzzle) => {
    const transformed = transformPuzzle(puzzle, options);
    return {
      name: transformed.name,
      outputs: sgfToGnosPuzzle(transformed, options.renderWholeBoard),
    };
  });
  const tex = assembleTexDocument(outputs, options, collectionName);
  console.log("[latexWorker] tex generated", { id, chars: tex.length });
  const pdf = await texToPdf(tex);
  console.log("[latexWorker] pdf compiled", { id, bytes: pdf.length });
  return {
    ok: true,
    id,
    pdf: pdf.buffer,
    tex,
  };
}

self.onmessage = (event: MessageEvent<GenerateRequest>): void => {
  const request = event.data;
  if (request?.type !== "generate") return;
  console.log("[latexWorker] request received", request.id);
  void generate(request)
    .then((response) => {
      console.log("[latexWorker] posting response", {
        id: response.id,
        ok: response.ok,
      });
      const pdf = response.ok ? response.pdf : undefined;
      if (typeof pdf === "object" && pdf !== null && "byteLength" in pdf) {
        self.postMessage(response, { transfer: [pdf] });
      } else {
        self.postMessage(response);
      }
    })
    .catch((err: unknown) => {
      console.error("[latexWorker] generate failed", err);
      const response: GenerateResponse = {
        ok: false,
        id: request.id,
        error: err instanceof Error ? err.message : String(err),
      };
      self.postMessage(response);
    });
};
