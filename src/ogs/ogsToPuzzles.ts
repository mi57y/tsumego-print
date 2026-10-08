import { stringifyVertex } from "@sabaki/sgf";
import type { MoveTreeNode, OgsPuzzle, PuzzleEntry } from "./ogsApi";
import { checkBoardSize } from "../puzzle/board";
import type { Puzzle } from "../puzzle/types";

// initial_state is already SGF coordinates ("aabc" = stones at aa and bc).
function splitInitialState(state: string): string {
  const vertices = state.match(/../g) ?? [];
  if (!vertices.every((vertex) => /^[a-z]{2}$/.test(vertex))) {
    throw new Error(`invalid coordinate in initial_state: ${state}`);
  }
  return vertices.join("][");
}

function blackInitialState(puzzle: PuzzleEntry["puzzle"]): string {
  return `AB[${splitInitialState(puzzle.initial_state.black)}]`;
}

function whiteInitialState(puzzle: PuzzleEntry["puzzle"]): string {
  return `AW[${splitInitialState(puzzle.initial_state.white)}]`;
}

function moveColor(first: "B" | "W", index: number): "B" | "W" {
  if (index % 2 === 0) return first;
  return first === "B" ? "W" : "B";
}

function puzzleToSgf(puzzle: PuzzleEntry["puzzle"]): string {
  const firstColor = puzzle.initial_player === "white" ? "W" : "B";

  function renderNode(node: MoveTreeNode, index: number): string {
    const s = `;${moveColor(firstColor, index)}[${stringifyVertex([node.x, node.y])}]`;
    if (node.correct_answer === true) return `${s}ANSWER[CORRECT]`;
    if (node.wrong_answer === true) return `${s}ANSWER[WRONG]`;
    const branches = node.branches ?? [];
    return s + branches.map((b) => `(${renderNode(b, index + 1)})`).join("");
  }

  const children = (puzzle.move_tree.branches ?? [])
    .map((b) => `(${renderNode(b, 0)})`)
    .join("");
  return [
    `(;FF[4]GM[1]CA[UTF-8]SZ[${checkBoardSize(puzzle.width)}]PL[${firstColor}]`,
    blackInitialState(puzzle),
    whiteInitialState(puzzle),
    children,
    ")",
  ].join("\n");
}

function plainTextDescription(html: string | undefined): string | undefined {
  const text = (html ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "")
    .join("\n");
  return text === "" ? undefined : text;
}

interface AnswerCounts {
  correct: number;
  wrong: number;
}

function countAnsweredBranches(node: MoveTreeNode, counts: AnswerCounts): void {
  for (const child of node.branches ?? []) {
    if (child.correct_answer === true) {
      counts.correct += 1;
    } else if (child.wrong_answer === true) {
      counts.wrong += 1;
    } else {
      countAnsweredBranches(child, counts);
    }
  }
}

export function puzzlesFromOgsResponse(items: OgsPuzzle[]): {
  puzzles: Puzzle[];
  failed: number;
} {
  const puzzles: Puzzle[] = [];
  let failed = 0;
  for (const item of items) {
    try {
      const sgf = puzzleToSgf(item.puzzle);
      const counts: AnswerCounts = { correct: 0, wrong: 0 };
      countAnsweredBranches(item.puzzle.move_tree, counts);
      puzzles.push({
        name: item.name,
        sgf,
        toPlay: item.puzzle.initial_player === "white" ? "white" : "black",
        noOfSolutions: counts.correct,
        noOfWrongVariations: counts.wrong,
        description: plainTextDescription(item.puzzle.puzzle_description),
      });
    } catch {
      failed += 1;
    }
  }
  return { puzzles, failed };
}
