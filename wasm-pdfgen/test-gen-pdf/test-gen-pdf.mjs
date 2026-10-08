import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { extname } from "node:path";
import { fileURLToPath } from "node:url";
import { LatexCompiler } from "./latex-api.js";

function usage() {
  console.log(
    [
      "usage: test-gen-pdf <input.tex> [-o output.pdf]",
      "",
      "  -o, --output FILE   write the PDF to FILE (default: <input>.pdf)",
      "  -h, --help          show this help",
    ].join("\n")
  );
}

const args = process.argv.slice(2);
let input;
let output;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  switch (a) {
    case "-o":
    case "--output":
      output = args[++i];
      break;
    case "-h":
    case "--help":
      usage();
      process.exit(0);
    default:
      if (a.startsWith("-")) {
        console.error("test-gen-pdf: unknown option: " + a);
        usage();
        process.exit(2);
      } else if (!input) {
        input = a;
      } else {
        console.error("test-gen-pdf: unexpected extra argument: " + a);
        usage();
        process.exit(2);
      }
  }
}

if (!input) {
  usage();
  process.exit(2);
}
output = output || input.replace(/\.tex$/i, "") + ".pdf";

let tex;
try {
  tex = await readFile(input, "utf8");
} catch (err) {
  console.error(`test-gen-pdf: cannot read ${input}: ${err.message}`);
  process.exit(1);
}

const dir = fileURLToPath(new URL("./", import.meta.url));
const mime = {
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
};

const server = createServer(async (req, res) => {
  const rel = req.url.split("?")[0].replace(/^\/+/, "");
  let path;
  try {
    path = fileURLToPath(new URL(rel, new URL("./", import.meta.url)));
  } catch {
    res.writeHead(400).end("bad request");
    return;
  }
  if (!path.startsWith(dir)) {
    res.writeHead(403).end("forbidden");
    return;
  }
  try {
    const body = await readFile(path);
    res.writeHead(200, {
      "content-type": mime[extname(path)] || "application/octet-stream",
    }).end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const { port } = server.address();

const compiler = new LatexCompiler({
  baseUrl: `http://127.0.0.1:${port}/`,
});
let pdf;
try {
  pdf = await compiler.compile(tex);
} catch (err) {
  console.error(`test-gen-pdf: compile failed (${input}):`);
  console.error(err && err.message ? err.message : err);
  server.close();
  process.exit(1);
}
server.close();
await writeFile(output, pdf);
console.error(`test-gen-pdf: ${input} -> ${output} (${pdf.length} bytes)`);
