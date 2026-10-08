import { describe, expect, it } from "vitest";
import { puzzlesFromSgf } from "./sgfToPuzzles";

const SAMPLE = [
  "(;GM[1]FF[3]",
  "SZ[19];AW[pb][qb][rb][rc][rd]AB[ob][nc][pc][qc][qe][re]PL[2];W[sa];",
  "B[sd];W[sc]",
  ")",
  "(;GM[1]FF[3]",
  "SZ[19];;AW[bn][bo][do][ap][cp][ep][eq][er]AB[ao][bp][bq][cq][dq][dr]",
  "(;B[bs];W[ar];B[br])",
  "(;B[br]TR[br];W[cs];B[ds];W[bs])",
  ")",
  "(;GM[1]FF[3]",
  "SZ[19];AW[mb][nb][oc][pc][qd][sd][qe][re]AB[na][ob][pb][qc][rc][rd]",
  "PL[1]",
  "(;B[ra];W[sb];B[sc];W[oa];B[pa])",
  "(;B[rb];W[qa];B[ra])",
  "(;B[sc]TR[sc];W[rb];B[qb];W[ra])",
  "(;B[qa]TR[qa];W[sb];B[rb];W[sc];B[oa];W[ra]C[Ko.])",
  ")",
].join("\n");

describe("puzzlesFromSgf", () => {
  it("creates one puzzle per game tree, named by position", () => {
    const out = puzzlesFromSgf(SAMPLE);
    expect(out.failed).toBe(0);
    expect(out.puzzles.map((p) => p.name)).toEqual([
      "Problem 1",
      "Problem 2",
      "Problem 3",
    ]);
  });

  it("merges setup stones from every node before the first move", () => {
    const out = puzzlesFromSgf(SAMPLE);
    expect(out.puzzles[1]).toEqual({
      name: "Problem 2",
      sgf:
        "(;FF[4]GM[1]CA[UTF-8]SZ[19]AB[ao][bp][bq][cq][dq][dr]AW[bn][bo][do][ap][cp][ep][eq][er]" +
        "(;B[bs];W[ar];B[br]ANSWER[CORRECT])" +
        "(;B[br];W[cs];B[ds];W[bs]ANSWER[CORRECT]))",
      toPlay: "black",
      noOfSolutions: 2,
      noOfWrongVariations: 0,
    });
  });

  it("treats every root-to-leaf line as a correct solution", () => {
    const out = puzzlesFromSgf(SAMPLE);
    expect(out.puzzles.map((p) => p.noOfSolutions)).toEqual([1, 2, 4]);
    expect(out.puzzles.map((p) => p.noOfWrongVariations)).toEqual([0, 0, 0]);
    expect(out.puzzles[0]!.sgf).toBe(
      "(;FF[4]GM[1]CA[UTF-8]SZ[19]AB[ob][nc][pc][qc][qe][re]AW[pb][qb][rb][rc][rd]" +
        "(;W[sa];B[sd];W[sc]ANSWER[CORRECT]))",
    );
  });

  it("takes toPlay from the color of the first move", () => {
    const out = puzzlesFromSgf(SAMPLE);
    expect(out.puzzles.map((p) => p.toPlay)).toEqual([
      "white",
      "black",
      "black",
    ]);
  });

  it("counts game trees without moves as failed", () => {
    const out = puzzlesFromSgf(
      "(;GM[1]FF[4]SZ[9]AB[aa])(;GM[1]FF[4]SZ[9];B[bb])",
    );
    expect(out.failed).toBe(1);
    expect(out.puzzles.map((p) => p.name)).toEqual(["Problem 2"]);
  });

  it("counts game trees with unsupported board sizes as failed", () => {
    const out = puzzlesFromSgf(
      "(;GM[1]FF[4]SZ[4];B[bb])(;GM[1]FF[4]SZ[9];B[bb])",
    );
    expect(out.failed).toBe(1);
    expect(out.puzzles.map((p) => p.name)).toEqual(["Problem 2"]);
  });

  it("throws when the file contains no game trees", () => {
    expect(() => puzzlesFromSgf("")).toThrow("no game trees in sgf file");
  });
});
