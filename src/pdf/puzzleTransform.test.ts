import { describe, expect, it } from "vitest";
import { parse, stringify, type Types } from "@sabaki/sgf";
import { transformPuzzle } from "./puzzleTransform";
import type { Puzzle } from "../puzzle/types";
import { DEFAULT_OPTIONS, type Options } from "./options";

const SGF_9 = `(;FF[4]GM[1]CA[UTF-8]SZ[9]
AB[bg]
AW[ce]
(;B[gh])
(;W[aa]))`;

const PL_SGF = `(;FF[4]GM[1]CA[UTF-8]SZ[9]
AB[bc]
AW[ed]
PL[B]
(;B[gh])
(;W[aa]))`;

const ANSWER_SGF = `(;FF[4]GM[1]CA[UTF-8]SZ[9]
AB[bc]
AW[ed]
(;B[cc]ANSWER[CORRECT])
(;B[dd]ANSWER[WRONG]))`;

const PASS_SGF = `(;FF[4]GM[1]CA[UTF-8]SZ[9]
AB[bc]
AW[ed]
(;B[]))`;

const TWO_TREES_SGF = `(;GM[1]SZ[9];B[ea])(;GM[1]SZ[9];B[ee])`;

function options(partial: Partial<Options> = {}): Options {
  return { ...DEFAULT_OPTIONS, ...partial };
}

function puzzleOf(sgf: string, toPlay: Puzzle["toPlay"] = "black"): Puzzle {
  return {
    name: "test",
    sgf,
    toPlay,
    noOfSolutions: 1,
    noOfWrongVariations: 2,
  };
}

function rngOf(...rolls: number[]): () => number {
  const queue = [...rolls];
  return () => queue.shift() ?? 1;
}

function rootOf(sgf: string): Types.NodeObject {
  const root = parse(sgf)[0];
  if (root === undefined) {
    throw new Error("no game tree in sgf");
  }
  return root;
}

function moves(sgf: string): Array<{ color: string; point: string }> {
  const result: Array<{ color: string; point: string }> = [];
  const walk = (node: Types.NodeObject): void => {
    for (const color of ["B", "W"] as const) {
      const values = node.data[color];
      if (values !== undefined) {
        result.push({ color, point: values[0] ?? "" });
      }
    }
    node.children.forEach(walk);
  };
  for (const tree of parse(sgf)) {
    walk(tree);
  }
  return result;
}

describe("transformPuzzle", () => {
  it("returns an unchanged puzzle when no option is enabled", () => {
    const puzzle = puzzleOf(SGF_9);
    const output = transformPuzzle(puzzle, options());
    expect(output.sgf).toBe(stringify(rootOf(SGF_9)));
    expect(output.toPlay).toBe("black");
    expect(output.noOfSolutions).toBe(1);
    expect(output.noOfWrongVariations).toBe(2);
  });

  it("swaps the x and y axes of all points", () => {
    const output = transformPuzzle(
      puzzleOf(SGF_9),
      options({ randomizeOrientation: true }),
      rngOf(0.4),
    );
    const root = rootOf(output.sgf);
    expect(root.data["AB"]).toEqual(["gb"]);
    expect(root.data["AW"]).toEqual(["ec"]);
    expect(moves(output.sgf)).toEqual([
      { color: "B", point: "hg" },
      { color: "W", point: "aa" },
    ]);
    expect(root.data["SZ"]).toEqual(["9"]);
    expect(output.toPlay).toBe("black");
  });

  it("mirrors along the x axis, flipping the vertical coordinate", () => {
    const output = transformPuzzle(
      puzzleOf(SGF_9),
      options({ randomizeOrientation: true }),
      rngOf(0.6, 0.4),
    );
    expect(rootOf(output.sgf).data["AB"]).toEqual(["bc"]);
    expect(rootOf(output.sgf).data["AW"]).toEqual(["ce"]);
    expect(moves(output.sgf)).toEqual([
      { color: "B", point: "gb" },
      { color: "W", point: "ai" },
    ]);
  });

  it("mirrors along the y axis, flipping the horizontal coordinate", () => {
    const output = transformPuzzle(
      puzzleOf(SGF_9),
      options({ randomizeOrientation: true }),
      rngOf(0.6, 0.6, 0.4),
    );
    expect(rootOf(output.sgf).data["AB"]).toEqual(["hg"]);
    expect(rootOf(output.sgf).data["AW"]).toEqual(["ge"]);
    expect(moves(output.sgf)).toEqual([
      { color: "B", point: "ch" },
      { color: "W", point: "ia" },
    ]);
  });

  it("randomize colors flips black and white", () => {
    const output = transformPuzzle(
      puzzleOf(PL_SGF, "black"),
      options({ colors: "randomize" }),
      rngOf(0.4),
    );
    const root = rootOf(output.sgf);
    expect(root.data["AB"]).toEqual(["ed"]);
    expect(root.data["AW"]).toEqual(["bc"]);
    expect(root.data["PL"]).toEqual(["W"]);
    expect(moves(output.sgf)).toEqual([
      { color: "W", point: "gh" },
      { color: "B", point: "aa" },
    ]);
    expect(output.toPlay).toBe("white");
  });

  it("randomize colors can keep the original colors", () => {
    const output = transformPuzzle(
      puzzleOf(PL_SGF, "black"),
      options({ colors: "randomize" }),
      rngOf(0.6),
    );
    expect(output.sgf).toBe(stringify(rootOf(PL_SGF)));
    expect(output.toPlay).toBe("black");
  });

  it("applies every transformation in swap, mirror x, mirror y order", () => {
    const output = transformPuzzle(
      puzzleOf(PL_SGF),
      options({
        randomizeOrientation: true,
        colors: "randomize",
      }),
      rngOf(0.4, 0.4, 0.4, 0.4),
    );
    expect(rootOf(output.sgf).data["AB"]).toEqual(["fe"]);
    expect(rootOf(output.sgf).data["AW"]).toEqual(["gh"]);
    expect(output.toPlay).toBe("white");
  });

  it("preserves ANSWER properties and transforms their coordinates", () => {
    const output = transformPuzzle(
      puzzleOf(ANSWER_SGF),
      options({
        randomizeOrientation: true,
        colors: "randomize",
      }),
      rngOf(0.4, 0.4, 0.4, 0.4),
    );
    const answers: (string | undefined)[] = [];
    const walk = (node: Types.NodeObject): void => {
      const answer = (node.data as Partial<Record<string, string[]>>)[
        "ANSWER"
      ]?.[0];
      if (answer !== undefined) {
        answers.push(answer);
      }
      node.children.forEach(walk);
    };
    walk(rootOf(output.sgf));
    expect(answers).toEqual(["CORRECT", "WRONG"]);
    expect(moves(output.sgf)).toEqual([
      { color: "W", point: "gg" },
      { color: "W", point: "ff" },
    ]);
  });

  it("keeps pass moves empty while transforming other points", () => {
    const output = transformPuzzle(
      puzzleOf(PASS_SGF),
      options({ randomizeOrientation: true }),
      rngOf(0.4, 0.4, 0.6),
    );
    expect(rootOf(output.sgf).data["AB"]).toEqual(["ch"]);
    expect(rootOf(output.sgf).data["AW"]).toEqual(["de"]);
    expect(moves(output.sgf)).toEqual([{ color: "B", point: "" }]);
  });

  it("transforms each of multiple game trees separately", () => {
    const output = transformPuzzle(
      puzzleOf(TWO_TREES_SGF),
      options({ randomizeOrientation: true }),
      rngOf(0.4),
    );
    expect(moves(output.sgf)).toEqual([
      { color: "B", point: "ae" },
      { color: "B", point: "ee" },
    ]);
  });

  it("make all black to play flips colors only when white plays first", () => {
    const flipped = transformPuzzle(
      puzzleOf(SGF_9, "white"),
      options({ colors: "black" }),
    );
    const root = rootOf(flipped.sgf);
    expect(root.data["AB"]).toEqual(["ce"]);
    expect(root.data["AW"]).toEqual(["bg"]);
    expect(moves(flipped.sgf)).toEqual([
      { color: "W", point: "gh" },
      { color: "B", point: "aa" },
    ]);
    expect(flipped.toPlay).toBe("black");

    const alreadyBlack = transformPuzzle(
      puzzleOf(SGF_9, "black"),
      options({ colors: "black" }),
    );
    expect(alreadyBlack.sgf).toBe(stringify(rootOf(SGF_9)));
    expect(alreadyBlack.toPlay).toBe("black");
  });

  it("make all white to play flips colors only when black plays first", () => {
    const flipped = transformPuzzle(
      puzzleOf(SGF_9, "black"),
      options({ colors: "white" }),
    );
    expect(rootOf(flipped.sgf).data["AB"]).toEqual(["ce"]);
    expect(rootOf(flipped.sgf).data["AW"]).toEqual(["bg"]);
    expect(flipped.toPlay).toBe("white");

    const alreadyWhite = transformPuzzle(
      puzzleOf(SGF_9, "white"),
      options({ colors: "white" }),
    );
    expect(alreadyWhite.sgf).toBe(stringify(rootOf(SGF_9)));
    expect(alreadyWhite.toPlay).toBe("white");
  });

  it("throws on malformed sgf", () => {
    expect(() =>
      transformPuzzle(puzzleOf("(;B[dd]C[unterminated"), options()),
    ).toThrow();
    expect(() => transformPuzzle(puzzleOf("()"), options())).toThrow();
  });
});
