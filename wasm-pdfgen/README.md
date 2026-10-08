# latex-wasm

A module for compiling LaTeX to PDF locally in the browser, with texlive compiled to WebAssembly.

```js
const compiler = new LatexCompiler();
const pdf = await compiler.compile(
  "\\documentclass{article}\\begin{document}hi\\end{document}",
);
```

## Features / Why this

While other ready solutions for compiling LaTeX in the browser exist, this one:

- packages an easily customizable list of required packages into a single compressed download
- can include packages that are **not on CTAN**
- builds reproducibly with Nix, natively on both Linux and macOS

## Customizing packages

In `flake.nix`, `latex-packages` takes the list of packages
that will be available in the compiler.
You can use standard CTAN packages from `pkgs.texlive.pkgs`
or pass a custom package created as described in the
[nixpkgs reference](https://nixos.org/manual/nixpkgs/stable/#sec-language-texlive-custom-packages)
(see gnos in this project for an example).

```
gnos = import ./packages/gnos { inherit pkgs; };

latex-packages = [ gnos ] ++ (with pkgs.texlive.pkgs; [
  adjustbox
  varwidth
  epstopdf-pkg
  geometry
  fancyhdr
  tools
]);
```

## Building and testing

```sh
nix build .#latex-wasm            # builds lib into result/
nix flake check                   # runs tests
nix run .#serve-test-website      # serves minimal test website on 8088
nix run .#test-gen-pdf -- doc.tex # CLI test tool - compiles doc.tex to doc.pdf
```
