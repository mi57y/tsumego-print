import { describe, expect, it } from "vitest";
import { sgfToGnosPuzzle } from "./sgfToLatex";
import type { Puzzle } from "../puzzle/types";

function puzzleOf(sgf: string, toPlay: Puzzle["toPlay"] = "black"): Puzzle {
  return {
    name: "test",
    sgf,
    toPlay,
    noOfSolutions: 0,
    noOfWrongVariations: 0,
  };
}

const BS = "\\";

function rowsBlock(rows: string[]): string {
  return rows
    .map((row, i) => (i < rows.length - 1 ? row + BS + BS : row))
    .join("\n");
}

function figure(
  rows: string[],
  description = "",
): { diagram: string; description: string } {
  return { diagram: rowsBlock(rows), description };
}

const NUM = (n: number, color: "B" | "W"): string =>
  color === "B"
    ? BS +
      "gnosOverlap{@}{" +
      BS +
      "color{white}" +
      BS +
      "footnotesize{" +
      n +
      "}}"
    : BS + "gnosOverlap{!}{" + BS + "footnotesize{" + n + "}}";

const NUM_1_B = NUM(1, "B");
const NUM_2_W = NUM(2, "W");

const EMPTY_BOARD_9_ROWS = [
  "<(((((((>",
  BS + "char91+++++++]",
  BS + "char91+*+++*+]",
  BS + "char91+++++++]",
  BS + "char91+++*+++]",
  BS + "char91+++++++]",
  BS + "char91+*+++*+]",
  BS + "char91+++++++]",
  ",))))))).",
];

const EMPTY_BOARD_13_ROWS = [
  "<(((((((((((>",
  BS + "char91+++++++++++]",
  BS + "char91+++++++++++]",
  BS + "char91++*++*++*++]",
  BS + "char91+++++++++++]",
  BS + "char91+++++++++++]",
  BS + "char91++*++*++*++]",
  BS + "char91+++++++++++]",
  BS + "char91+++++++++++]",
  BS + "char91++*++*++*++]",
  BS + "char91+++++++++++]",
  BS + "char91+++++++++++]",
  ",))))))))))).",
];

const EMPTY_BOARD_19_ROWS = [
  "<(((((((((((((((((>",
  BS + "char91+++++++++++++++++]",
  BS + "char91+++++++++++++++++]",
  BS + "char91++*+++++*+++++*++]",
  BS + "char91+++++++++++++++++]",
  BS + "char91+++++++++++++++++]",
  BS + "char91+++++++++++++++++]",
  BS + "char91+++++++++++++++++]",
  BS + "char91+++++++++++++++++]",
  BS + "char91++*+++++*+++++*++]",
  BS + "char91+++++++++++++++++]",
  BS + "char91+++++++++++++++++]",
  BS + "char91+++++++++++++++++]",
  BS + "char91+++++++++++++++++]",
  BS + "char91+++++++++++++++++]",
  BS + "char91++*+++++*+++++*++]",
  BS + "char91+++++++++++++++++]",
  BS + "char91+++++++++++++++++]",
  ",))))))))))))))))).",
];

const MOVES_SGF_9 = `(;FF[4]GM[1]CA[UTF-8]SZ[9]
(;B[cc]
;W[gg]
;B[ff]
;W[ee]
;B[aa]
;W[ia]
;B[ai]
;W[ii]
;B[da]
;W[di]
;B[ad]
;W[id]
;B[]
;W[gh]ANSWER[CORRECT]))`;

const MOVES_ROWS = [
  NUM(5, "B") + "((" + NUM(9, "B") + "((((" + NUM(6, "W"),
  BS + "char91+++++++]",
  BS + "char91+" + NUM(1, "B") + "+++*+]",
  NUM(11, "B") + "+++++++" + NUM(12, "W"),
  BS + "char91+++" + NUM(4, "W") + "+++]",
  BS + "char91++++" + NUM(3, "B") + "++]",
  BS + "char91+*+++" + NUM(2, "W") + "+]",
  BS + "char91+++++" + NUM(14, "W") + "+]",
  NUM(7, "B") + "))" + NUM(10, "W") + "))))" + NUM(8, "W"),
];

const HANDICAP_SGF_9 = `(;FF[4]GM[1]CA[UTF-8]SZ[9]
AB[cc][gg]
AW[ff][db]
(;B[dd]
;W[fg]
;B[eh]ANSWER[CORRECT]))`;

const HANDICAP_ROWS = [
  "<(((((((>",
  BS + "char91++!++++]",
  BS + "char91+@+++*+]",
  BS + "char91++" + NUM_1_B + "++++]",
  BS + "char91+++*+++]",
  BS + "char91++++!++]",
  BS + "char91+*++" + NUM(2, "W") + "@+]",
  BS + "char91+++" + NUM(3, "B") + "+++]",
  ",))))))).",
];

const KO_OSCILLATION_SGF = `(;FF[4]GM[1]CA[UTF-8]SZ[9]
AB[be][cd][cf]
AW[ee][dd][df]
(;W[ce]
;B[gh]
;W[hg]
;B[de]
;W[cb]
;B[db]
;W[ce]
;B[eb]
;W[fb]
;B[de]
;W[gb]
;B[hb]
;W[ce]
;B[bc]
;W[dc]
;B[de]ANSWER[CORRECT]))`;

const KO_OSCILLATION_ROWS = [
  "<(((((((>",
  BS +
    "char91+" +
    NUM(5, "W") +
    NUM(6, "B") +
    NUM(8, "B") +
    NUM(9, "W") +
    NUM(11, "W") +
    NUM(12, "B") +
    "]",
  BS + "char91" + NUM(14, "B") + "*" + NUM(15, "W") + "++*+]",
  BS + "char91+@!++++]",
  BS + "char91@" + NUM(1, "W") + NUM(4, "B") + "!+++]",
  BS + "char91+@!++++]",
  BS + "char91+*+++*" + NUM(3, "W") + "]",
  BS + "char91+++++" + NUM(2, "B") + "+]",
  ",))))))).",
];

const KO_TAKE_ALL_SGF = `(;FF[4]GM[1]CA[UTF-8]SZ[9]
AB[ab][ba][bc][eb][fa][fc][ae][bd][bf][ee][fd][ff][ah][bg][bi][gb][ge]
AW[db][ca][cc][hb][ga][gc][de][cd][cf][he][gd][gf][dh][cg][ci][bb][be][bh]
(;B[cb]
;W[fb]
;B[ce]
;W[fe]
;B[ch]
;W[bb]
;B[gb]
;W[be]
;B[ge]
;W[bh]ANSWER[CORRECT]))`;

const KO_TAKE_ALL_ROWS = [
  "<@!((@!(>",
  "@c" + NUM(1, "B") + "!@" + NUM(2, "W") + "S!]",
  BS + "char91@!++@!+]",
  BS + "char91@!++@!+]",
  "@t" + NUM(3, "B") + "!@" + NUM(4, "W") + "X!]",
  BS + "char91@!++@!+]",
  BS + "char91@!+++*+]",
  "@!" + NUM(5, "B") + "!++++]",
  ",@!))))).",
];

describe("sgfToGnosPuzzle", () => {
  it("renders initial and one diagram per answer branch, classified by tag", () => {
    const sgf = `(;FF[4]GM[1]CA[UTF-8]SZ[9]
AB[bb][db]
AW[ed]
(;B[cc]ANSWER[CORRECT])
(;B[dd]ANSWER[WRONG])
(;B[gc]ANSWER[CORRECT])
(;B[hi]ANSWER[WRONG]))`;

    const setupRows = [
      "<(((((((>",
      BS + "char91@+@++++]",
      BS + "char91+*+++*+]",
      BS + "char91+++!+++]",
      BS + "char91+++*+++]",
      BS + "char91+++++++]",
      BS + "char91+*+++*+]",
      BS + "char91+++++++]",
      ",))))))).",
    ];

    const out = sgfToGnosPuzzle(puzzleOf(sgf));
    expect(out.initial).toEqual(figure(setupRows.slice(0, 5)));

    const ccRows = [...setupRows.slice(0, 5)];
    ccRows[2] = BS + "char91+" + NUM_1_B + "+++*+]";
    const gcRows = [...setupRows.slice(0, 5)];
    gcRows[2] = BS + "char91+*+++" + NUM_1_B + "+]";
    const ddRows = [...setupRows.slice(0, 5)];
    ddRows[3] = BS + "char91++" + NUM_1_B + "!+++]";
    const hiRows = [...setupRows];
    hiRows[8] = ",))))))" + NUM_1_B + ".";
    expect(out.correct).toEqual([figure(ccRows), figure(gcRows)]);
    expect(out.wrong).toEqual([figure(ddRows), figure(hiRows)]);
  });

  it("drops untagged leaf branches from both lists", () => {
    const untaggedOnly = sgfToGnosPuzzle(
      puzzleOf(
        `(;FF[4]GM[1]CA[UTF-8]SZ[9]
(;B[cc])
(;B[dd]))`,
      ),
    );
    expect(untaggedOnly.correct).toEqual([]);
    expect(untaggedOnly.wrong).toEqual([]);
    expect(untaggedOnly.initial).toEqual(figure(EMPTY_BOARD_9_ROWS));

    const mixed = sgfToGnosPuzzle(
      puzzleOf(
        `(;FF[4]GM[1]CA[UTF-8]SZ[9]
AB[bb][db]
AW[ed]
(;B[cc]ANSWER[CORRECT])
(;B[hi]))`,
      ),
    );
    expect(mixed.wrong).toEqual([]);
    expect(mixed.correct).toEqual([
      figure([
        "<(((((((>",
        BS + "char91@+@++++]",
        BS + "char91+" + NUM_1_B + "+++*+]",
        BS + "char91+++!+++]",
        BS + "char91+++*+++]",
      ]),
    ]);
  });

  it("renders the whole board for every figure when the flag passes true", () => {
    const sgf = `(;FF[4]GM[1]CA[UTF-8]SZ[9]
AB[dd]
(;B[ee]ANSWER[CORRECT]))`;
    const wholeSetup = [
      "<(((((((>",
      BS + "char91+++++++]",
      BS + "char91+*+++*+]",
      BS + "char91++@++++]",
      BS + "char91+++*+++]",
      BS + "char91+++++++]",
      BS + "char91+*+++*+]",
      BS + "char91+++++++]",
      ",))))))).",
    ];
    const wholeBranch = [...wholeSetup];
    wholeBranch[4] = BS + "char91+++" + NUM_1_B + "+++]";

    const whole = sgfToGnosPuzzle(puzzleOf(sgf), true);
    expect(whole.initial).toEqual(figure(wholeSetup));
    expect(whole.correct).toEqual([figure(wholeBranch)]);
    expect(whole.wrong).toEqual([]);

    const cropped = sgfToGnosPuzzle(puzzleOf(sgf));
    expect(cropped.initial).toEqual(figure(wholeSetup.slice(0, 5)));
    expect(cropped.correct).toEqual([figure(wholeBranch.slice(0, 6))]);
  });

  it("renders the full board for empty boards regardless of the flag", () => {
    const sgf = "(;FF[4]GM[1]CA[UTF-8]SZ[9])";
    expect(sgfToGnosPuzzle(puzzleOf(sgf)).initial).toEqual(
      figure(EMPTY_BOARD_9_ROWS),
    );
    expect(sgfToGnosPuzzle(puzzleOf(sgf), true).initial).toEqual(
      figure(EMPTY_BOARD_9_ROWS),
    );
  });

  it("renders empty 13x13 and 19x19 boards with star points", () => {
    expect(
      sgfToGnosPuzzle(puzzleOf("(;FF[4]GM[1]CA[UTF-8]SZ[13])")).initial,
    ).toEqual(figure(EMPTY_BOARD_13_ROWS));
    expect(
      sgfToGnosPuzzle(puzzleOf("(;FF[4]GM[1]CA[UTF-8]SZ[19])")).initial,
    ).toEqual(figure(EMPTY_BOARD_19_ROWS));
  });

  it("crops to one empty row above and below stones away from the edges", () => {
    const sgf = `(;FF[4]GM[1]CA[UTF-8]SZ[9]
(;B[ee];W[ge]ANSWER[CORRECT]))`;
    expect(sgfToGnosPuzzle(puzzleOf(sgf)).correct).toEqual([
      figure([
        BS + "char91+++++++]",
        BS + "char91+++" + NUM_1_B + "+" + NUM_2_W + "+]",
        BS + "char91+++++++]",
      ]),
    ]);
  });

  it("ignores empty setup properties when cropping", () => {
    const sgf =
      "(;FF[4]GM[1]CA[UTF-8]SZ[19]PL[B]\nAB[]\nAW[jj]\n(;B[aa]ANSWER[CORRECT]))";
    const out = sgfToGnosPuzzle(puzzleOf(sgf));
    expect(out.initial.diagram.split("\n")).toHaveLength(3);
  });

  it("crops puzzle diagrams from both ends", () => {
    const sgf = `(;FF[4]GM[1]CA[UTF-8]SZ[13]
AB[ff][gg]
AW[ge][hh]
(;B[fg]ANSWER[CORRECT]))`;
    const out = sgfToGnosPuzzle(puzzleOf(sgf));
    expect(out.initial).toEqual(
      figure([
        BS + "char91++*++*++*++]",
        BS + "char91+++++!+++++]",
        BS + "char91++++@++++++]",
        BS + "char91++*++@++*++]",
        BS + "char91++++++!++++]",
        BS + "char91+++++++++++]",
      ]),
    );
  });

  it("throws on malformed sgf", () => {
    expect(() => sgfToGnosPuzzle(puzzleOf("(;B[dd]C[unterminated)"))).toThrow();
  });
});

describe("branch rendering", () => {
  it("renders numbered moves covering corners, edges and star points", () => {
    const out = sgfToGnosPuzzle(puzzleOf(MOVES_SGF_9));
    expect(out.correct).toEqual([figure(MOVES_ROWS, "13 pass")]);
    expect(out.wrong).toEqual([]);
  });

  it("renders handicap stones unmarked and played stones numbered", () => {
    expect(sgfToGnosPuzzle(puzzleOf(HANDICAP_SGF_9)).correct).toEqual([
      figure(HANDICAP_ROWS),
    ]);
  });

  it("marks replays of ko points by earlier move number", () => {
    const out = sgfToGnosPuzzle(puzzleOf(KO_OSCILLATION_SGF));
    expect(out.correct).toEqual([
      figure(KO_OSCILLATION_ROWS, "7 at 1, 10 at 4, 13 at 1, 16 at 4"),
    ]);
  });

  it("falls back to board markers and coordinates for replay descriptions", () => {
    const out = sgfToGnosPuzzle(puzzleOf(KO_TAKE_ALL_SGF));
    expect(out.correct).toEqual([
      figure(
        KO_TAKE_ALL_ROWS,
        "6 at {" +
          BS +
          "gnos c}, 7 at {" +
          BS +
          "gnos S}, 8 at {" +
          BS +
          "gnos t}, 9 at {" +
          BS +
          "gnos X}, 10 at bh",
      ),
    ]);
  });
});
