import anyAscii from "any-ascii";

const REPLACEMENTS: Record<string, string> = {
  "\\": "$\\backslash$",
  "~": "\\~{}",
  "^": "\\^{}",
  $: "\\char36{}",
  "<": "\\textless{}",
  ">": "\\textgreater{}",
  "|": "\\textbar{}",
};

export function escapeTex(text: string): string {
  return anyAscii(text).replace(
    /[\\{}$&^#%~_<>|]/g,
    (ch) => REPLACEMENTS[ch] ?? `\\${ch}`,
  );
}
