import { describe, expect, it } from "vitest";
import { escapeTex } from "./escapeTex";

describe("escapeTex", () => {
  it("leaves plain text unchanged", () => {
    expect(escapeTex("Life and Death 1")).toBe("Life and Death 1");
  });

  it("prefixes characters that a backslash escapes with a backslash", () => {
    expect(escapeTex("{}&#%_")).toBe("\\{\\}\\&\\#\\%\\_");
  });

  it("uses dedicated forms for backslash, tilde, caret and dollar", () => {
    expect(escapeTex("a\\b")).toBe("a$\\backslash$b");
    expect(escapeTex("Hard~")).toBe("Hard\\~{}");
    expect(escapeTex("^_^")).toBe("\\^{}\\_\\^{}");
    expect(escapeTex("$5")).toBe("\\char36{}5");
  });

  it("uses text commands for characters OT1 fonts misprint", () => {
    expect(escapeTex("a<b|c>d")).toBe(
      "a\\textless{}b\\textbar{}c\\textgreater{}d",
    );
  });

  it("transliterates non-ASCII text to ASCII", () => {
    expect(escapeTex("Zadania łatwe ąćźżó, Café")).toBe(
      "Zadania latwe aczzo, Cafe",
    );
    expect(escapeTex("にゃ")).toBe("niya");
  });
});
