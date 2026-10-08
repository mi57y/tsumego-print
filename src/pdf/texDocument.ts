import { type GnosFigure, type GnosOutputs } from "./sgfToLatex";
import {
  DEFAULT_OPTIONS,
  DIAGRAM_SIZES_PT,
  MAX_FONT_SIZE_PT,
  MIN_FONT_SIZE_PT,
  type Options,
} from "./options";
import { escapeTex } from "./escapeTex";

function diagramCall(
  title: string,
  subheading: string,
  figure: GnosFigure,
): string {
  return `\\puzzleDiagram{${title}}{${subheading}}{${figure.diagram}}{${figure.description}}`;
}

function toPlayLabel(outputs: GnosOutputs): string {
  return outputs.toPlay === "B" ? "Black to play" : "White to play";
}

function problemSubheading(outputs: GnosOutputs, options: Options): string {
  const lines: string[] = [];
  if (options.includeToPlayText) lines.push(toPlayLabel(outputs));
  if (options.includeDescriptions && outputs.description !== undefined) {
    lines.push(...outputs.description.split("\n").map(escapeTex));
  }
  return lines.join("\\\\");
}

function puzzleProblemDiagrams(
  name: string,
  outputs: GnosOutputs,
  options: Options,
): string[] {
  return [
    diagramCall(name, problemSubheading(outputs, options), outputs.initial),
  ];
}

function puzzleSolutionDiagrams(
  name: string,
  outputs: GnosOutputs,
  options: Options,
): string[] {
  const diagrams: string[] = [];
  if (options.includeSolutions) {
    const figures = options.includeOnlyOneSolution
      ? outputs.correct.slice(0, 1)
      : outputs.correct;
    figures.forEach((figure, i) => {
      const title =
        figures.length === 1
          ? `${name} Solution`
          : `${name} Solution ${i + 1}/${figures.length}`;
      diagrams.push(diagramCall(title, "", figure));
    });
  }
  if (options.includeIncorrectVariations) {
    outputs.wrong.forEach((figure, i) => {
      diagrams.push(
        diagramCall(
          `${name} Incorrect variation ${i + 1}/${outputs.wrong.length}`,
          "",
          figure,
        ),
      );
    });
  }
  return diagrams;
}

function sectionBody(blocks: string[], columns: number): string {
  const open = columns === 1 ? "" : `\n\\begin{multicols}{${columns}}`;
  const close = columns === 1 ? "" : `\n\\end{multicols}`;
  return `${open}\n\n${blocks.join("\n\n")}\n${close}`;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function fontCommand(size: number, lineSpacing: number): string {
  return `\\fontsize{${round2(size)}}{${round2(lineSpacing)}}\\selectfont`;
}

function puzzleTexCommands(fontSizePt: number, diagramSizePt: number): string {
  const nameFont = fontCommand(fontSizePt, fontSizePt * 1.2);
  const descriptionFont = fontCommand(fontSizePt * 0.9, fontSizePt * 1.1);
  const boardNoteFont = fontCommand(diagramSizePt, diagramSizePt * 1.2);
  const textToBoardGap = round2(fontSizePt * 0.2);
  return `\\newsavebox{\\puzzleBoard}
\\newcommand{\\puzzleDiagram}[4]{%
  \\par\\noindent\\begin{minipage}{\\linewidth}\\centering
    {${nameFont} #1\\strut\\par}
    \\ifx\\relax#2\\relax\\else{${descriptionFont} #2\\strut\\par}\\fi
    \\vspace{${textToBoardGap}pt}%
    \\sbox{\\puzzleBoard}{\\begin{varwidth}{80in}%
      \\gnosfontsize{${diagramSizePt}}\\gnos #3\\end{varwidth}}%
    \\adjustbox{max width=\\linewidth}{\\parbox{\\wd\\puzzleBoard}{\\centering
      \\usebox{\\puzzleBoard}%
      \\ifx\\relax#4\\relax\\else\\par\\vspace{6pt}${boardNoteFont}\\itshape #4\\fi}}\\par
  \\end{minipage}\\par\\vspace{\\baselineskip}}
\\newcommand{\\puzzleHeading}[1]{\\begin{center}\\Large\\bfseries #1\\end{center}}`;
}

export function assembleTexDocument(
  puzzles: { name: string; outputs: GnosOutputs }[],
  options: Options,
  collectionName: string,
): string {
  const problemBlocks: string[] = [];
  const solutionBlocks: string[] = [];
  for (const [index, { name, outputs }] of puzzles.entries()) {
    const displayName = options.useOriginalProblemNames
      ? name
      : `Problem ${index + 1}`;
    const escapedName = escapeTex(displayName);
    problemBlocks.push(...puzzleProblemDiagrams(escapedName, outputs, options));
    solutionBlocks.push(
      ...puzzleSolutionDiagrams(escapedName, outputs, options),
    );
  }
  const columns = Math.max(1, Math.floor(options.columns));
  const paperSize = options.paperSize === "a4" ? "a4paper" : "letterpaper";
  const packages =
    columns === 1
      ? ""
      : `\n\\usepackage{multicol}\n\\setlength{\\columnsep}{0.5cm}`;
  const marginCm =
    isFinite(options.marginCm) && options.marginCm > 0 ? options.marginCm : 1;
  const fontSizePt =
    isFinite(options.fontSizePt) &&
    options.fontSizePt >= MIN_FONT_SIZE_PT &&
    options.fontSizePt <= MAX_FONT_SIZE_PT
      ? options.fontSizePt
      : DEFAULT_OPTIONS.fontSizePt;
  const diagramSizePt = DIAGRAM_SIZES_PT.includes(options.diagramSizePt)
    ? options.diagramSizePt
    : DEFAULT_OPTIONS.diagramSizePt;
  const geometryPreamble = `\\usepackage{geometry}\n\\geometry{top=${marginCm}cm,left=${marginCm}cm,right=${marginCm}cm,bottom=${marginCm * 2}cm,footskip=${marginCm}cm}`;
  const name = escapeTex(collectionName || "").trim();
  const footerPreamble = options.includeCollectionNameFooter
    ? `\\usepackage{fancyhdr}\n\\pagestyle{fancy}\n\\fancyhf{}\n\\fancyfoot[L]{${name}}\n\\fancyfoot[R]{\\thepage}\n\\renewcommand{\\headrulewidth}{0pt}\n\\renewcommand{\\footrulewidth}{0.4pt}`
    : "";
  const title =
    options.collectionNameAtTop && name !== ""
      ? `\n\\puzzleHeading{${name}}`
      : "";
  const solutionsSection =
    solutionBlocks.length > 0
      ? `\n\n\\clearpage\n\\puzzleHeading{Solutions}${sectionBody(solutionBlocks, columns)}`
      : "";
  // fix-cm lets text use any font size, not only Computer Modern's design sizes.
  return `\\documentclass[${paperSize}]{article}
\\usepackage{fix-cm,color,gnos,adjustbox}
${puzzleTexCommands(fontSizePt, diagramSizePt)}${geometryPreamble}${footerPreamble}${packages}
\\begin{document}${title}${sectionBody(problemBlocks, columns)}${solutionsSection}

\\end{document}
`;
}
