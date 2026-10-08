async function readAsset(url, label) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`failed to fetch ${label}: ${res.status} ${res.statusText}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

function mkdirTree(FS, dirs) {
  let cur = "";
  for (const part of dirs.split("/").filter(Boolean)) {
    cur += "/" + part;
    if (!FS.analyzePath(cur).exists) {
      FS.mkdir(cur);
      FS.chmod(cur, 0o777);
    }
  }
}

export class LatexCompiler {
  #readyPromise;
  #baseUrl;

  constructor({ baseUrl, onReady, onError } = {}) {
    this.#baseUrl = baseUrl ? new URL(baseUrl.replace(/\/?$/, "/")) : null;
    this.#readyPromise = this.#init().then(
      (state) => {
        this.#invoke(onReady);
        return state;
      },
      (err) => {
        this.#invoke(onError, err);
        throw err;
      }
    );
  }

  #assetURL(name) {
    return this.#baseUrl
      ? new URL(name, this.#baseUrl)
      : new URL(name, import.meta.url);
  }

  get ready() {
    return this.#readyPromise;
  }

  async compile(tex) {
    const { factory, wasmBinary, dataBinary } = await this.#readyPromise;

    const messages = [];
    const cfg = {
      noInitialRun: false,
      thisProgram: "/work/pdftex",
      arguments: [
        "-interaction=nonstopmode",
        "-halt-on-error",
        "-fmt=pdflatex",
        "-jobname=doc",
        "doc",
      ],
      wasmBinary,
      getPreloadedPackage: () => dataBinary,
      preRun: [
        () => {
          mkdirTree(cfg.FS, "/work");
          mkdirTree(cfg.FS, "/tmp/texmf-var");
          mkdirTree(cfg.FS, "/tmp/texmf-config");
          mkdirTree(cfg.FS, "/tmp/texmf-home");
          cfg.FS.writeFile("/work/pdftex", "program stub");
          cfg.FS.writeFile("/work/doc.tex", tex);
          cfg.FS.chdir("/work");
        },
      ],
      print: (t) => messages.push(t),
      printErr: (t) => messages.push(t),
    };

    let module;
    try {
      module = await factory(cfg);
    } catch (err) {
      throw new Error(
        "pdftex failed:\n" +
          messages.join("\n") +
          "\n" +
          (err && err.message ? err.message : String(err))
      );
    }

    try {
      return module.FS.readFile("/work/doc.pdf");
    } catch {
      let log = messages.join("\n");
      try {
        log +=
          "\n\n--- doc.log ---\n" +
          module.FS.readFile("/work/doc.log", { encoding: "utf8" });
      } catch {}
      throw new Error("pdftex produced no output:\n" + log);
    }
  }

  async #init() {
    const [factory, wasmBinary, dataBinary] = await Promise.all([
      import("./latex.js").then((mod) => mod.default ?? mod),
      this.#loadAsset("latex.wasm"),
      this.#loadAsset("latex.data"),
    ]);
    return { factory, wasmBinary, dataBinary };
  }

  async #loadAsset(name) {
    const bytes = await readAsset(this.#assetURL(name), name);
    return bytes.buffer;
  }

  #invoke(fn, ...args) {
    try {
      fn(...args);
    } catch {}
  }
}
