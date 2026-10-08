import { LatexCompiler } from "./latex-api.js";

const SMOKE = [
  "\\documentclass{article}",
  "\\usepackage{amsmath,amssymb}",
  "\\usepackage{url}",
  "\\usepackage[colorlinks=true]{hyperref}",
  "",
  "\\title{A tiny LaTeX to PDF demo}",
  "\\author{latex-wasm}",
  "\\date{\\today}",
  "",
  "\\begin{document}",
  "\\maketitle",
  "",
  "\\section{Math}",
  "Inline $E = mc^2$ and a display",
  "\\begin{equation}",
  "  \\int_0^\\infty e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}",
  "\\end{equation}",
  "",
  "\\section{Tools}",
  "A hyperlink: \\url{https://example.com}.",
  "",
  "\\LaTeX{} ran entirely inside WebAssembly \\cite{wasm}.",
  "\\begin{thebibliography}{9}",
  "\\bibitem{wasm} WebAssembly, \\url{https://webassembly.org}",
  "\\end{thebibliography}",
  "",
  "\\end{document}",
  "",
].join("\n");

const editor = document.getElementById("editor");
const buildBtn = document.getElementById("build");
const loadSmokeBtn = document.getElementById("load-smoke");
const status = document.getElementById("status");
const log = document.getElementById("log");
const pdf = document.getElementById("pdf");

editor.value = SMOKE;

const compiler = new LatexCompiler({
  onReady: () => {
    status.textContent = "Engine ready.";
  },
  onError: (err) => {
    status.textContent = "Engine failed to load: " + err.message;
  },
});
status.textContent = "Loading engine...";

loadSmokeBtn.addEventListener("click", () => {
  editor.value = SMOKE;
  status.textContent = "Smoke test loaded.";
  log.textContent = "";
});

buildBtn.addEventListener("click", async () => {
  buildBtn.disabled = true;
  status.textContent = "Compiling...";
  log.textContent = "";
  try {
    const bytes = await compiler.compile(editor.value);
    status.textContent = "OK \u2014 " + bytes.length + " bytes";
    log.textContent = "Compiled in the wasm sandbox; PDF rendered below.";
    const blob = new Blob([bytes], { type: "application/pdf" });
    pdf.src = URL.createObjectURL(blob);
  } catch (err) {
    status.textContent = "Failed: " + err.message;
    log.textContent = "";
  } finally {
    buildBtn.disabled = false;
  }
});