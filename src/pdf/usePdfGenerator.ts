import { useEffect, useRef, useState } from "react";
import type { Puzzle } from "../puzzle/types";
import type { Options } from "./options";
import type { GenerateRequest } from "./latexWorker";

let worker: Worker | undefined;

function getWorker(): Worker {
  worker ??= new Worker(new URL("./latexWorker.ts", import.meta.url), {
    type: "module",
  });
  return worker;
}

export interface PdfGenerator {
  url: string | undefined;
  texUrl: string | undefined;
  error: string | undefined;
  generating: boolean;
}

interface Output {
  url: string;
  texUrl: string;
}

const GENERATE_DELAY_MS = 500;

function shortError(message: string): string {
  const texError = /^! .*$/m.exec(message)?.[0];
  return texError === undefined
    ? `Failed to generate the PDF: ${message.split("\n")[0]}`
    : `Failed to generate the PDF. LaTeX error: ${texError.slice(2)}`;
}

export function usePdfGenerator({
  puzzles,
  options,
  collectionName,
}: {
  puzzles: Puzzle[] | undefined;
  options: Options;
  collectionName: string;
}): PdfGenerator {
  const [output, setOutput] = useState<Output>();
  const [error, setError] = useState<string>();
  const [generating, setGenerating] = useState(false);
  const jobIdRef = useRef(0);
  const crashedRef = useRef(false);
  const outputRef = useRef<Output>(undefined);

  useEffect(() => {
    function replaceOutput(next: Output | undefined): void {
      if (outputRef.current !== undefined) {
        URL.revokeObjectURL(outputRef.current.url);
        URL.revokeObjectURL(outputRef.current.texUrl);
      }
      outputRef.current = next;
      setOutput(next);
    }

    function fail(message: string): void {
      replaceOutput(undefined);
      setError(message);
      setGenerating(false);
    }

    function onMessage(event: MessageEvent): void {
      if (event.data.id !== jobIdRef.current) return;
      if (!event.data.ok) {
        console.error(
          "[tsumego-print] PDF generation failed",
          event.data.error,
        );
        fail(shortError(event.data.error));
        return;
      }
      replaceOutput({
        url: URL.createObjectURL(
          new Blob([event.data.pdf], { type: "application/pdf" }),
        ),
        texUrl: URL.createObjectURL(
          new Blob([event.data.tex], { type: "text/x-tex" }),
        ),
      });
      setError(undefined);
      setGenerating(false);
    }

    function onCrash(event: Event): void {
      console.error("[tsumego-print] worker error", event);
      crashedRef.current = true;
      fail("The PDF generator stopped working. Reload the page to try again.");
    }

    const w = getWorker();
    w.addEventListener("message", onMessage);
    w.addEventListener("error", onCrash);
    w.addEventListener("messageerror", onCrash);
    return () => {
      w.removeEventListener("message", onMessage);
      w.removeEventListener("error", onCrash);
      w.removeEventListener("messageerror", onCrash);
      replaceOutput(undefined);
    };
  }, []);

  useEffect(() => {
    if (puzzles === undefined || crashedRef.current) return undefined;
    setGenerating(true);
    const timer = setTimeout(() => {
      const request: GenerateRequest = {
        type: "generate",
        id: ++jobIdRef.current,
        puzzles,
        options,
        collectionName,
      };
      getWorker().postMessage(request);
    }, GENERATE_DELAY_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [puzzles, options, collectionName]);

  return {
    url: output?.url,
    texUrl: output?.texUrl,
    error,
    generating,
  };
}
