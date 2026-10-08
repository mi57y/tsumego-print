export interface Puzzle {
  name: string;
  sgf: string;
  toPlay: "black" | "white";
  noOfSolutions: number;
  noOfWrongVariations: number;
  description?: string;
}
