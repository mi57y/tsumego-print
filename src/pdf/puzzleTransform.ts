import {
  parse,
  parseCompressedVertices,
  parseVertex,
  stringify,
  stringifyVertex,
  type Types,
} from "@sabaki/sgf";
import { boardSize } from "../puzzle/board";
import type { Puzzle } from "../puzzle/types";
import type { ColorMode, Options } from "./options";

interface TransformParams {
  swapAxes: boolean;
  mirrorAlongX: boolean;
  mirrorAlongY: boolean;
  flipColors: boolean;
  boardSize: number;
}

const MOVE_PROPERTIES = new Set(["B", "W"]);
const POINT_LIST_PROPERTIES = new Set(["AB", "AW", "AE"]);
const COLOR_FLIP: Record<string, string> = {
  B: "W",
  W: "B",
  AB: "AW",
  AW: "AB",
};

export function transformPuzzle(
  puzzle: Puzzle,
  options: Options,
  rng: () => number = Math.random,
): Puzzle {
  const params: Omit<TransformParams, "boardSize"> = {
    swapAxes: options.randomizeOrientation && rng() < 0.5,
    mirrorAlongX: options.randomizeOrientation && rng() < 0.5,
    mirrorAlongY: options.randomizeOrientation && rng() < 0.5,
    flipColors: shouldFlipColors(puzzle.toPlay, options.colors, rng),
  };
  return {
    ...puzzle,
    sgf: transformSgf(puzzle.sgf, params),
    toPlay: params.flipColors ? otherColor(puzzle.toPlay) : puzzle.toPlay,
  };
}

function shouldFlipColors(
  toPlay: Puzzle["toPlay"],
  mode: ColorMode,
  rng: () => number,
): boolean {
  switch (mode) {
    case "randomize":
      return rng() < 0.5;
    case "original":
      return false;
    case "black":
      return toPlay === "white";
    case "white":
      return toPlay === "black";
  }
}

function otherColor(color: Puzzle["toPlay"]): Puzzle["toPlay"] {
  return color === "black" ? "white" : "black";
}

function transformSgf(
  sgf: string,
  params: Omit<TransformParams, "boardSize">,
): string {
  const trees = parse(sgf);
  if (trees.length === 0) {
    throw new Error("no game tree in sgf");
  }
  return trees
    .map((tree) =>
      stringify(transformTree(tree, { ...params, boardSize: boardSize(tree) })),
    )
    .join("\n");
}

function transformTree(
  node: Types.NodeObject,
  params: TransformParams,
): Types.NodeObject {
  return {
    ...node,
    data: transformData(node.data, params),
    children: node.children.map((child) => transformTree(child, params)),
  };
}

function transformData(
  data: Types.NodeObject["data"],
  params: TransformParams,
): Types.NodeObject["data"] {
  const next: Partial<Record<string, string[]>> = {};
  for (const [id, values] of Object.entries(data)) {
    if (values === undefined) continue;
    const key = params.flipColors ? (COLOR_FLIP[id] ?? id) : id;
    const transformed = transformValues(id, values, params);
    if (transformed.length > 0) {
      next[key] = transformed;
    }
  }
  return next as Types.NodeObject["data"];
}

function transformValues(
  id: string,
  values: string[],
  params: TransformParams,
): string[] {
  if (MOVE_PROPERTIES.has(id) || POINT_LIST_PROPERTIES.has(id)) {
    return values.flatMap((value) =>
      value.includes(":")
        ? transformPointList(value, params)
        : [transformPoint(value, params)],
    );
  }
  if (id === "PL" && params.flipColors) {
    return values.map((value) =>
      value === "B" ? "W" : value === "W" ? "B" : value,
    );
  }
  return values;
}

function transformPoint(value: string, params: TransformParams): string {
  const [x, y] = parseVertex(value);
  const mapped = mapVertex([x, y], params);
  return mapped !== undefined ? stringifyVertex(mapped) : value;
}

function transformPointList(value: string, params: TransformParams): string[] {
  const points: string[] = [];
  for (const [x, y] of parseCompressedVertices(value)) {
    const mapped = mapVertex([x, y], params);
    if (mapped !== undefined) {
      points.push(stringifyVertex(mapped));
    }
  }
  return points;
}

function mapVertex(
  vertex: Vertex,
  params: TransformParams,
): Vertex | undefined {
  if (!isOnBoard(vertex, params.boardSize)) {
    return undefined;
  }
  let mapped = vertex;
  if (params.swapAxes) {
    mapped = swapAxes(mapped);
  }
  if (params.mirrorAlongX) {
    mapped = mirrorAlongX(mapped, params.boardSize);
  }
  if (params.mirrorAlongY) {
    mapped = mirrorAlongY(mapped, params.boardSize);
  }
  return mapped;
}

type Vertex = [number, number];

function isOnBoard([x, y]: Vertex, size: number): boolean {
  return x >= 0 && y >= 0 && x < size && y < size;
}

function swapAxes([x, y]: Vertex): Vertex {
  return [y, x];
}

function mirrorAlongX([x, y]: Vertex, size: number): Vertex {
  return [x, size - 1 - y];
}

function mirrorAlongY([x, y]: Vertex, size: number): Vertex {
  return [size - 1 - x, y];
}
