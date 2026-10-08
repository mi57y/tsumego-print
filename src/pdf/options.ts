export type ColorMode = "randomize" | "original" | "black" | "white";

export type PaperSize = "a4" | "letter";

// The only sizes \gnosfontsize actually uses
// Other sizes just snap to these
export const DIAGRAM_SIZES_PT = [8, 9, 10, 11, 12, 14, 16, 20];

export const MIN_FONT_SIZE_PT = 5;
export const MAX_FONT_SIZE_PT = 30;

export interface Options {
  randomizeOrientation: boolean;
  colors: ColorMode;
  includeSolutions: boolean;
  includeOnlyOneSolution: boolean;
  includeIncorrectVariations: boolean;
  paperSize: PaperSize;
  columns: number;
  renderWholeBoard: boolean;
  marginCm: number;
  fontSizePt: number;
  diagramSizePt: number;
  collectionNameAtTop: boolean;
  includeCollectionNameFooter: boolean;
  includeToPlayText: boolean;
  includeDescriptions: boolean;
  useOriginalProblemNames: boolean;
  randomizeProblemOrder: boolean;
}

export const DEFAULT_OPTIONS: Options = {
  randomizeOrientation: false,
  colors: "original",
  includeSolutions: true,
  includeOnlyOneSolution: true,
  includeIncorrectVariations: false,
  paperSize: "a4",
  columns: 2,
  renderWholeBoard: false,
  marginCm: 1,
  fontSizePt: 10,
  diagramSizePt: 12,
  collectionNameAtTop: true,
  includeCollectionNameFooter: true,
  includeToPlayText: false,
  includeDescriptions: true,
  useOriginalProblemNames: true,
  randomizeProblemOrder: false,
};
