import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const ENCODING_STUB = fileURLToPath(
  new URL("./src/shims/encoding-stub.js", import.meta.url),
);

export default defineConfig({
  plugins: [react()],
  worker: {
    format: "es",
  },
  resolve: {
    alias: {
      "iconv-lite": ENCODING_STUB,
      jschardet: ENCODING_STUB,
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    server: {
      deps: {
        external: [/public\/latex\//],
      },
    },
  },
});
