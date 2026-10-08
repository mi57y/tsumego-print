import { LatexCompiler } from "./latex-api.js";

const BASE_URL = new URL(`${import.meta.env.BASE_URL}latex`, location.href)
  .href;

const compiler = new LatexCompiler({ baseUrl: BASE_URL });

export function texToPdf(tex: string): Promise<Uint8Array<ArrayBuffer>> {
  return compiler.compile(tex);
}
