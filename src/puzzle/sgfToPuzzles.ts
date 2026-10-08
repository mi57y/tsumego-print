import { parse, type Types } from "@sabaki/sgf";
import { boardSize } from "./board";
import type { Puzzle } from "./types";

interface Move {
  color: "B" | "W";
  point: string;
}

interface CollectedTree {
  setupNodes: Types.NodeObject[];
  solutions: Move[][];
}

function moveOf(node: Types.NodeObject): Move | undefined {
  const black = node.data["B"]?.[0];
  if (black !== undefined) return { color: "B", point: black };
  const white = node.data["W"]?.[0];
  if (white !== undefined) return { color: "W", point: white };
  return undefined;
}

function collect(
  node: Types.NodeObject,
  path: Move[],
  out: CollectedTree,
): void {
  const move = moveOf(node);
  if (move === undefined && path.length === 0) out.setupNodes.push(node);
  const moves = move === undefined ? path : [...path, move];
  if (node.children.length === 0) {
    if (moves.length > 0) out.solutions.push(moves);
    return;
  }
  for (const child of node.children) {
    collect(child, moves, out);
  }
}

function propertyList(id: string, points: string[]): string {
  return points.length === 0 ? "" : `${id}[${points.join("][")}]`;
}

function renderSolution(moves: Move[]): string {
  const nodes = moves.map((move, i) =>
    i === moves.length - 1
      ? `;${move.color}[${move.point}]ANSWER[CORRECT]`
      : `;${move.color}[${move.point}]`,
  );
  return `(${nodes.join("")})`;
}

function puzzleFromTree(root: Types.NodeObject, number: number): Puzzle {
  const collected: CollectedTree = { setupNodes: [], solutions: [] };
  collect(root, [], collected);
  const firstMove = collected.solutions[0]?.[0];
  if (firstMove === undefined) {
    throw new Error(`game tree ${number} has no moves`);
  }
  const black = collected.setupNodes.flatMap((node) => node.data["AB"] ?? []);
  const white = collected.setupNodes.flatMap((node) => node.data["AW"] ?? []);
  const size = boardSize(root);
  const sgf =
    `(;FF[4]GM[1]CA[UTF-8]SZ[${size}]` +
    propertyList("AB", black) +
    propertyList("AW", white) +
    collected.solutions.map(renderSolution).join("") +
    ")";
  return {
    name: `Problem ${number}`,
    sgf,
    toPlay: firstMove.color === "B" ? "black" : "white",
    noOfSolutions: collected.solutions.length,
    noOfWrongVariations: 0,
  };
}

export function puzzlesFromSgf(text: string): {
  puzzles: Puzzle[];
  failed: number;
} {
  const trees = parse(text);
  if (trees.length === 0) {
    throw new Error("no game trees in sgf file");
  }
  const puzzles: Puzzle[] = [];
  let failed = 0;
  trees.forEach((root, i) => {
    try {
      puzzles.push(puzzleFromTree(root, i + 1));
    } catch {
      failed += 1;
    }
  });
  return { puzzles, failed };
}
