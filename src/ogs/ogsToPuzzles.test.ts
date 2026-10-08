import { describe, expect, it } from "vitest";
import { puzzlesFromOgsResponse } from "./ogsToPuzzles";
import type { MoveTreeNode, OgsPuzzle } from "./ogsApi";

function ogsPuzzle(
  name: string,
  move_tree: MoveTreeNode,
  options: {
    initial_player?: string;
    width?: number;
    initial_state?: { black: string; white: string };
    puzzle_description?: string;
  } = {},
): OgsPuzzle {
  return {
    id: 1,
    name,
    puzzle: {
      initial_player: options.initial_player ?? "black",
      width: options.width ?? 19,
      height: options.width ?? 19,
      initial_state: options.initial_state ?? { black: "aa", white: "bb" },
      puzzle_description: options.puzzle_description,
      move_tree,
    },
  };
}

describe("puzzlesFromOgsResponse", () => {
  it("generates sgf with initial stones, board size and answer tags", () => {
    const out = puzzlesFromOgsResponse([
      ogsPuzzle(
        "one",
        {
          x: -1,
          y: -1,
          branches: [{ x: 1, y: 0, correct_answer: true }],
        },
        {
          initial_state: { black: "abbc", white: "cd" },
        },
      ),
    ]);
    expect(out.failed).toBe(0);
    expect(out.puzzles).toEqual([
      {
        name: "one",
        sgf: "(;FF[4]GM[1]CA[UTF-8]SZ[19]PL[B]\nAB[ab][bc]\nAW[cd]\n(;B[ba]ANSWER[CORRECT])\n)",
        toPlay: "black",
        noOfSolutions: 1,
        noOfWrongVariations: 0,
      },
    ]);
  });

  it("generates sgf from the configured board size and colors from initial_player", () => {
    const out = puzzlesFromOgsResponse([
      ogsPuzzle(
        "nine",
        {
          x: -1,
          y: -1,
          branches: [{ x: 2, y: 2, correct_answer: true }],
        },
        { width: 9 },
      ),
      ogsPuzzle(
        "white first",
        {
          x: -1,
          y: -1,
          branches: [
            { x: 0, y: 0, branches: [{ x: 1, y: 1, correct_answer: true }] },
          ],
        },
        { initial_player: "white" },
      ),
    ]);
    expect(out.failed).toBe(0);
    expect(out.puzzles).toEqual([
      {
        name: "nine",
        sgf: "(;FF[4]GM[1]CA[UTF-8]SZ[9]PL[B]\nAB[aa]\nAW[bb]\n(;B[cc]ANSWER[CORRECT])\n)",
        toPlay: "black",
        noOfSolutions: 1,
        noOfWrongVariations: 0,
      },
      {
        name: "white first",
        sgf: "(;FF[4]GM[1]CA[UTF-8]SZ[19]PL[W]\nAB[aa]\nAW[bb]\n(;W[aa](;B[bb]ANSWER[CORRECT]))\n)",
        toPlay: "white",
        noOfSolutions: 1,
        noOfWrongVariations: 0,
      },
    ]);
  });

  it("counts tagged branches per puzzle, matching the generated sgf", () => {
    const tree: MoveTreeNode = {
      x: -1,
      y: -1,
      branches: [
        { x: 0, y: 1, correct_answer: true },
        {
          x: 1,
          y: 2,
          branches: [
            { x: 2, y: 3, branches: [{ x: 3, y: 4, correct_answer: true }] },
            { x: 4, y: 5, wrong_answer: true },
          ],
        },
        { x: 5, y: 6 },
      ],
    };
    const out = puzzlesFromOgsResponse([ogsPuzzle("counts", tree)]);
    expect(out.failed).toBe(0);
    expect(out.puzzles).toEqual([
      {
        name: "counts",
        sgf:
          "(;FF[4]GM[1]CA[UTF-8]SZ[19]PL[B]\n" +
          "AB[aa]\n" +
          "AW[bb]\n" +
          "(;B[ab]ANSWER[CORRECT])(;B[bc](;W[cd](;B[de]ANSWER[CORRECT]))(;W[ef]ANSWER[WRONG]))(;B[fg])\n" +
          ")",
        toPlay: "black",
        noOfSolutions: 2,
        noOfWrongVariations: 1,
      },
    ]);
    const puzzle = out.puzzles[0]!;
    expect((puzzle.sgf.match(/ANSWER\[CORRECT\]/g) ?? []).length).toBe(
      puzzle.noOfSolutions,
    );
    expect((puzzle.sgf.match(/ANSWER\[WRONG\]/g) ?? []).length).toBe(
      puzzle.noOfWrongVariations,
    );
  });

  it("converts puzzle descriptions to plain text lines", () => {
    const out = puzzlesFromOgsResponse([
      ogsPuzzle(
        "described",
        { x: -1, y: -1, branches: [] },
        {
          puzzle_description:
            '<b>Rate it.</b>\n\nSee <a href="x">list</a>:<br><br>- one<br>- two',
        },
      ),
      ogsPuzzle(
        "plain",
        { x: -1, y: -1, branches: [] },
        {
          puzzle_description: "\n<br>\n",
        },
      ),
    ]);
    expect(out.puzzles.map((p) => p.description)).toEqual([
      "Rate it.\nSee list:\n- one\n- two",
      undefined,
    ]);
  });

  it("counts zero for puzzles without marked answers", () => {
    const out = puzzlesFromOgsResponse([
      ogsPuzzle("unmarked", {
        x: -1,
        y: -1,
        branches: [
          { x: 0, y: 2, branches: [{ x: 1, y: 3 }] },
          { x: 2, y: 4, branches: [{ x: 3, y: 5 }] },
        ],
      }),
      ogsPuzzle("empty", { x: -1, y: -1 }),
    ]);
    expect(out.failed).toBe(0);
    expect(out.puzzles.map((p) => p.noOfSolutions)).toEqual([0, 0]);
    expect(out.puzzles.map((p) => p.noOfWrongVariations)).toEqual([0, 0]);
    expect(out.puzzles).toHaveLength(2);
  });

  it("counts parse failures and skips failed puzzles", () => {
    const good = ogsPuzzle("good", {
      x: -1,
      y: -1,
      branches: [{ x: 1, y: 0, correct_answer: true }],
    });
    const badState = ogsPuzzle(
      "bad state",
      { x: -1, y: -1, branches: [] },
      {
        initial_state: { black: "%a", white: "" },
      },
    );
    const out = puzzlesFromOgsResponse([badState, good]);
    expect(out.failed).toBe(1);
    expect(out.puzzles).toHaveLength(1);
    expect(out.puzzles[0]!.name).toBe("good");
    expect(out.puzzles[0]!.sgf).toBe(
      "(;FF[4]GM[1]CA[UTF-8]SZ[19]PL[B]\nAB[aa]\nAW[bb]\n(;B[ba]ANSWER[CORRECT])\n)",
    );
  });

  it("writes pass moves as empty SGF moves", () => {
    const out = puzzlesFromOgsResponse([
      ogsPuzzle("pass", {
        x: -1,
        y: -1,
        branches: [
          { x: -1, y: -1, branches: [{ x: 1, y: 0, correct_answer: true }] },
        ],
      }),
    ]);
    expect(out.puzzles[0]!.sgf).toContain("(;B[](;W[ba]ANSWER[CORRECT]))");
  });

  it("counts puzzles with unsupported board sizes as failed", () => {
    const tree = {
      x: -1,
      y: -1,
      branches: [{ x: 1, y: 0, correct_answer: true }],
    };
    const out = puzzlesFromOgsResponse([
      ogsPuzzle("too big", tree, { width: 30 }),
      ogsPuzzle("fine", tree),
    ]);
    expect(out.failed).toBe(1);
    expect(out.puzzles.map((p) => p.name)).toEqual(["fine"]);
  });
});
