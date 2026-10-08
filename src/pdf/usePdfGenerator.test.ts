import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Puzzle } from "../puzzle/types";
import { DEFAULT_OPTIONS } from "./options";
import type { GenerateRequest } from "./latexWorker";

class FakeWorker extends EventTarget {
  static instance: FakeWorker | undefined;
  readonly requests: GenerateRequest[] = [];

  constructor() {
    super();
    FakeWorker.instance = this;
  }

  postMessage(request: GenerateRequest): void {
    this.requests.push(request);
  }

  reply(data: unknown): void {
    act(() => {
      this.dispatchEvent(new MessageEvent("message", { data }));
    });
  }

  lastId(): number {
    return this.requests.at(-1)!.id;
  }
}

function worker(): FakeWorker {
  return FakeWorker.instance!;
}

const PUZZLES: Puzzle[] = [
  {
    name: "P1",
    sgf: "(;SZ[9])",
    toPlay: "black",
    noOfSolutions: 0,
    noOfWrongVariations: 0,
  },
];

let createdUrls = 0;
const revokeObjectURL = vi.fn();

async function renderGenerator() {
  const { usePdfGenerator } = await import("./usePdfGenerator");
  const hook = renderHook(
    ({ options }) =>
      usePdfGenerator({ puzzles: PUZZLES, options, collectionName: "C" }),
    { initialProps: { options: DEFAULT_OPTIONS } },
  );
  act(() => {
    vi.runAllTimers();
  });
  return hook;
}

function succeed(): void {
  worker().reply({
    ok: true,
    id: worker().lastId(),
    pdf: new ArrayBuffer(4),
    tex: "tex",
  });
}

beforeEach(() => {
  // usePdfGenerator keeps its worker in a module variable; start fresh each test.
  vi.resetModules();
  vi.useFakeTimers();
  vi.stubGlobal("Worker", FakeWorker);
  createdUrls = 0;
  URL.createObjectURL = () => `blob:${++createdUrls}`;
  URL.revokeObjectURL = revokeObjectURL;
  revokeObjectURL.mockClear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("usePdfGenerator", () => {
  it("exposes the generated PDF", async () => {
    const { result } = await renderGenerator();
    expect(result.current.generating).toBe(true);

    succeed();

    expect(result.current).toEqual({
      url: "blob:1",
      texUrl: "blob:2",
      error: undefined,
      generating: false,
    });
  });

  it("ignores replies to outdated requests", async () => {
    const { result, rerender } = await renderGenerator();
    const firstId = worker().lastId();
    rerender({ options: { ...DEFAULT_OPTIONS, columns: 3 } });
    act(() => {
      vi.runAllTimers();
    });

    worker().reply({
      ok: true,
      id: firstId,
      pdf: new ArrayBuffer(4),
      tex: "old",
    });

    expect(result.current.url).toBeUndefined();
    expect(result.current.generating).toBe(true);
  });

  it("drops the previous PDF and shows the LaTeX error line when generation fails", async () => {
    const { result, rerender } = await renderGenerator();
    succeed();
    rerender({ options: { ...DEFAULT_OPTIONS, columns: 3 } });
    act(() => {
      vi.runAllTimers();
    });

    worker().reply({
      ok: false,
      id: worker().lastId(),
      error:
        "pdftex produced no output:\nThis is pdfTeX\n! Undefined control sequence.\nl.12 ...",
    });

    expect(result.current).toEqual({
      url: undefined,
      texUrl: undefined,
      error:
        "Failed to generate the PDF. LaTeX error: Undefined control sequence.",
      generating: false,
    });
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:1");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:2");
  });

  it("clears the error after a later success", async () => {
    const { result, rerender } = await renderGenerator();
    worker().reply({ ok: false, id: worker().lastId(), error: "boom" });
    expect(result.current.error).toBe("Failed to generate the PDF: boom");

    rerender({ options: { ...DEFAULT_OPTIONS, columns: 3 } });
    act(() => {
      vi.runAllTimers();
    });
    succeed();

    expect(result.current.error).toBeUndefined();
    expect(result.current.url).toBeDefined();
  });

  it("stops generating when the worker crashes", async () => {
    const { result, rerender } = await renderGenerator();

    act(() => {
      worker().dispatchEvent(new Event("error"));
    });

    expect(result.current.generating).toBe(false);
    expect(result.current.error).toMatch(/Reload the page/);

    rerender({ options: { ...DEFAULT_OPTIONS, columns: 3 } });
    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.generating).toBe(false);
    expect(worker().requests).toHaveLength(1);
  });

  it("revokes the PDF URLs on unmount", async () => {
    const { unmount } = await renderGenerator();
    succeed();

    unmount();

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:1");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:2");
  });
});
