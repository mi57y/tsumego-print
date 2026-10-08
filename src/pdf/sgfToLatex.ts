import { parse, parseVertex, stringifyVertex, type Types } from "@sabaki/sgf";
import { boardSize } from "../puzzle/board";
import type { Puzzle } from "../puzzle/types";

const MARKERS = ["C", "S", "T", "X"];
const CROP_MARGIN_EMPTY_ROWS = 1;
const CROP_KEEP_EDGE_LINES = 4;

type Color = "B" | "W";

function nodeColor(node: Types.NodeObject): Color | undefined {
  if ((node.data["B"]?.length ?? 0) > 0) return "B";
  if ((node.data["W"]?.length ?? 0) > 0) return "W";
  return undefined;
}

interface Stone {
  color: Color;
  row: number;
  col: number;
  number: number | undefined;
  marker: string | undefined;
}

const STAR_POINTS: Record<number, Record<number, number[]>> = {
  9: {
    2: [2, 6],
    6: [2, 6],
    4: [4],
  },
  13: {
    3: [3, 6, 9],
    6: [3, 6, 9],
    9: [3, 6, 9],
  },
  19: {
    3: [3, 9, 15],
    9: [3, 9, 15],
    15: [3, 9, 15],
  },
};

export interface GnosFigure {
  diagram: string;
  description: string;
}

class GnosDiagram {
  private readonly size: number;
  private readonly wholeBoard: boolean;
  private readonly stones = new Map<number, Stone>();
  private readonly descriptions: string[] = [];
  private nextMarker = 0;
  private moveCount = 0;

  constructor(size: number, nodes: Types.NodeObject[], wholeBoard = false) {
    this.size = size;
    this.wholeBoard = wholeBoard;
    for (const node of nodes) {
      this.addSetupStones(node);
      this.addMove(node);
    }
  }

  private stoneAt(row: number, col: number): Stone | undefined {
    return this.stones.get(row * this.size + col);
  }

  private addSetupStones(node: Types.NodeObject): void {
    for (const [property, color] of [
      ["AB", "B"],
      ["AW", "W"],
    ] as const) {
      for (const point of node.data[property] ?? []) {
        if (point === "") continue;
        const [col, row] = parseVertex(point);
        this.stones.set(row * this.size + col, {
          color,
          row,
          col,
          number: undefined,
          marker: undefined,
        });
      }
    }
  }

  private addMove(node: Types.NodeObject): void {
    const color = nodeColor(node);
    if (color === undefined) return;
    const point = node.data[color]?.at(0);
    this.moveCount += 1;
    if (point === undefined || point === "") {
      this.descriptions.push(`${this.moveCount} pass`);
      return;
    }
    const [col, row] = parseVertex(point);
    const existing = this.stoneAt(row, col);
    if (existing === undefined) {
      this.stones.set(row * this.size + col, {
        color,
        row,
        col,
        number: this.moveCount,
        marker: undefined,
      });
      return;
    }
    this.addMoveDescription(existing, row, col);
  }

  private addAtNumberDescription(stone: Stone): void {
    this.descriptions.push(`${this.moveCount} at ${stone.number}`);
  }

  private addAtMarkerDescription(stone: Stone): void {
    this.descriptions.push(`${this.moveCount} at {\\gnos ${stone.marker}}`);
  }

  private addCoordinateDescription(row: number, col: number): void {
    this.descriptions.push(
      `${this.moveCount} at ${stringifyVertex([col, row])}`,
    );
  }

  private markStoneAndAddDescription(stone: Stone): void {
    const symbol = MARKERS[this.nextMarker++]!;
    const marker = stone.color === "B" ? symbol : symbol.toLowerCase();
    stone.marker = marker;
    this.descriptions.push(`${this.moveCount} at {\\gnos ${marker}}`);
  }

  private addMoveDescription(stone: Stone, row: number, col: number): void {
    if (stone.number !== undefined) {
      this.addAtNumberDescription(stone);
    } else if (stone.marker !== undefined) {
      this.addAtMarkerDescription(stone);
    } else if (this.nextMarker < MARKERS.length) {
      this.markStoneAndAddDescription(stone);
    } else {
      this.addCoordinateDescription(row, col);
    }
  }

  private stoneGlyph(stone: Stone): string {
    if (stone.marker !== undefined) return stone.marker;
    if (stone.number === undefined) return stone.color === "B" ? "@" : "!";
    if (stone.color === "B") {
      return `\\gnosOverlap{@}{\\color{white}\\footnotesize{${stone.number}}}`;
    }
    return `\\gnosOverlap{!}{\\footnotesize{${stone.number}}}`;
  }

  private isStarPoint(row: number, col: number): boolean {
    const rowStars = STAR_POINTS[this.size]?.[row];
    return rowStars !== undefined && rowStars.includes(col);
  }

  private emptyBoardGlyph(row: number, col: number): string {
    if (this.isStarPoint(row, col)) return "*";
    const last = this.size - 1;
    if (row === 0 && col === 0) return "<";
    if (row === 0 && col === last) return ">";
    if (row === last && col === 0) return ",";
    if (row === last && col === last) return ".";
    if (row === 0) return "(";
    if (row === last) return ")";
    if (col === 0) return "\\char91";
    if (col === last) return "]";
    return "+";
  }

  private croppedBounds(): { minRow: number; maxRow: number } {
    if (this.wholeBoard) return { minRow: 0, maxRow: this.size - 1 };
    const rows = [...this.stones.values()].map((stone) => stone.row);
    if (rows.length === 0) return { minRow: 0, maxRow: this.size - 1 };
    let minRow = Math.min(...rows);
    let maxRow = Math.max(...rows);
    if (minRow <= CROP_KEEP_EDGE_LINES - 1) {
      minRow = 0;
    } else {
      minRow -= CROP_MARGIN_EMPTY_ROWS;
    }
    if (maxRow >= this.size - CROP_KEEP_EDGE_LINES) {
      maxRow = this.size - 1;
    } else {
      maxRow += CROP_MARGIN_EMPTY_ROWS;
    }
    return { minRow, maxRow };
  }

  rows(): string {
    const bounds = this.croppedBounds();
    const firstRow = bounds.minRow;
    const lastRow = bounds.maxRow;
    const lines: string[] = [];
    for (let row = firstRow; row <= lastRow; row++) {
      let line = "";
      for (let col = 0; col < this.size; col++) {
        const stone = this.stoneAt(row, col);
        line +=
          stone !== undefined
            ? this.stoneGlyph(stone)
            : this.emptyBoardGlyph(row, col);
      }
      lines.push(row < lastRow ? `${line}\\\\` : line);
    }
    return lines.join("\n");
  }

  figure(): GnosFigure {
    return {
      diagram: this.rows(),
      description: this.descriptions.join(", "),
    };
  }
}

function answerOf(
  node: Types.NodeObject | undefined,
): "CORRECT" | "WRONG" | undefined {
  const value = (node?.data as Partial<Record<string, string[]>>)[
    "ANSWER"
  ]?.[0];
  if (value === "CORRECT" || value === "WRONG") {
    return value;
  }
  return undefined;
}

function collectBranches(root: Types.NodeObject, out: Types.NodeObject[][]) {
  const walk = (node: Types.NodeObject, seq: Types.NodeObject[]) => {
    seq.push(node);
    if (answerOf(node) !== undefined || node.children.length === 0) {
      out.push(seq);
      return;
    }
    const prefix = [...seq];
    node.children.forEach((child, i) =>
      walk(child, i === 0 ? seq : [...prefix]),
    );
  };
  for (const child of root.children) {
    walk(child, [root]);
  }
}

const CHAR_TO_COLOR: Record<Puzzle["toPlay"], Color> = {
  black: "B",
  white: "W",
};

export interface GnosOutputs {
  initial: GnosFigure;
  correct: GnosFigure[];
  wrong: GnosFigure[];
  toPlay: Color;
  description?: string;
}

export function sgfToGnosPuzzle(
  puzzle: Puzzle,
  wholeBoard = false,
): GnosOutputs {
  const root = parse(puzzle.sgf)[0];
  if (root === undefined) {
    throw new Error("no game tree in sgf");
  }
  const size = boardSize(root);
  const render = (nodes: Types.NodeObject[]): GnosFigure =>
    new GnosDiagram(size, nodes, wholeBoard).figure();
  const branches: Types.NodeObject[][] = [];
  collectBranches(root, branches);
  return {
    toPlay: CHAR_TO_COLOR[puzzle.toPlay],
    description: puzzle.description,
    initial: render([root]),
    correct: branches
      .filter((seq) => answerOf(seq.at(-1)) === "CORRECT")
      .map(render),
    wrong: branches
      .filter((seq) => answerOf(seq.at(-1)) === "WRONG")
      .map(render),
  };
}
