import { createContext, useContext, useState, type ReactNode } from "react";
import { usePdfGenerator, type PdfGenerator } from "../pdf/usePdfGenerator";
import { DEFAULT_OPTIONS, type Options } from "../pdf/options";
import type { Puzzle } from "../puzzle/types";

export interface LoadedCollection {
  path: string;
  name: string;
  puzzles: Puzzle[];
  failed: number;
}

interface PrintSession {
  collection: LoadedCollection | undefined;
  setCollection: (collection: LoadedCollection) => void;
  options: Options;
  setOptions: (options: Options) => void;
  pdf: PdfGenerator;
}

const PrintSessionContext = createContext<PrintSession | undefined>(undefined);

export function PrintSessionProvider({ children }: { children: ReactNode }) {
  const [collection, setCollection] = useState<LoadedCollection>();
  const [options, setOptions] = useState<Options>(DEFAULT_OPTIONS);
  const pdf = usePdfGenerator({
    puzzles: collection?.puzzles,
    options,
    collectionName: collection?.name ?? "",
  });

  return (
    <PrintSessionContext.Provider
      value={{ collection, setCollection, options, setOptions, pdf }}
    >
      {children}
    </PrintSessionContext.Provider>
  );
}

export function usePrintSession(): PrintSession {
  const session = useContext(PrintSessionContext);
  if (session === undefined) {
    throw new Error("usePrintSession must be used inside PrintSessionProvider");
  }
  return session;
}
