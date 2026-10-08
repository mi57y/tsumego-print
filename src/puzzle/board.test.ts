import { parse } from "@sabaki/sgf";
import { describe, expect, it } from "vitest";
import { boardSize, checkBoardSize } from "./board";

function root(sgf: string) {
  return parse(sgf)[0]!;
}

describe("boardSize", () => {
  it("defaults to 19 without SZ", () => {
    expect(boardSize(root("(;GM[1])"))).toBe(19);
  });

  it("reads SZ", () => {
    expect(boardSize(root("(;SZ[9])"))).toBe(9);
    expect(boardSize(root("(;SZ[26])"))).toBe(26);
  });

  it("rejects sizes the renderer cannot draw", () => {
    expect(() => boardSize(root("(;SZ[4])"))).toThrow(
      "unsupported board size: 4",
    );
    expect(() => boardSize(root("(;SZ[27])"))).toThrow(
      "unsupported board size: 27",
    );
    expect(() => boardSize(root("(;SZ[smol])"))).toThrow(
      "unsupported board size",
    );
  });
});

describe("checkBoardSize", () => {
  it("rejects non-integers", () => {
    expect(() => checkBoardSize(9.5)).toThrow("unsupported board size");
  });
});
