export interface LatexCompilerOptions {
  baseUrl?: string;
  onReady?: () => void;
  onError?: (err: Error) => void;
}

export class LatexCompiler {
  constructor(opts?: LatexCompilerOptions);
  readonly ready: Promise<unknown>;
  compile(tex: string): Promise<Uint8Array<ArrayBuffer>>;
}
