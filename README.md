# Tsumego Print

## Live page: [tsumego-print.mi57y.pl](https://tsumego-print.mi57y.pl)

Create customizable, printable PDF collections of Go problems ([tsumego](https://senseis.xmp.net/?Tsumego)) from [Online-Go](https://online-go.com) puzzle collections or SGF files.

Everything runs in the browser, with no server: the app generates a LaTeX document and compiles it to PDF with a WebAssembly build of pdfTeX.

## Features

- Import puzzle collections from Online-Go, or upload an SGF file.
- Customize the layout, randomize board orientation and stone colors.
- Get clean PDFs made with [go-type1](https://github.com/otrego/go-type1).
- Download the generated PDF, or an editable LaTeX file to futher customize the formatting.

## Building and development

This is an `npm` project, but it must be built with [Nix](https://nixos.org), which also builds the LaTeX compiler.

`wasm-pdfgen/` is a module that provides a simple JavaScript API for compiling LaTeX. While ready-made solutions for compiling LaTeX in the browser exist, this custom module:

- Uses the [go-type1](https://github.com/otrego/go-type1) package, which isn't on CTAN.
- Needs only a very small set of LaTeX packages, and combines them all into a single compressed file.
- Compiles with Nix natively on macOS and Linux.

See separate [wasm-pdfgen/README.md](./wasm-pdfgen/README.md) for more details.

Building Tsumego Print:

```sh
nix build        # build deployable static files into result/
nix run .#dev    # run Vite development server
nix run .#test   # run tests
```

## License

This app is licensed under [GNU Affero General Public License v3.0 or later](./LICENSE).

The app ships bundled with the following free software:

- [go-type1](https://github.com/otrego/go-type1) ([Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0))
- [@sabaki/sgf](https://github.com/SabakiHQ/sgf) ([MIT](https://opensource.org/license/mit))
- A custom WebAssembly build of [pdfTeX](https://www.tug.org/applications/pdftex/) ([GPL-2.0 or later](https://www.gnu.org/licenses/old-licenses/gpl-2.0.html))
- LaTeX packages from [TeX Live 2025](https://tug.org/texlive/) ([LPPL-1.3c](https://www.latex-project.org/lppl/lppl-1-3c/))
- [Emscripten](https://emscripten.org) runtime ([MIT](https://opensource.org/license/mit))
- [React](https://github.com/react/react) ([MIT](https://opensource.org/license/mit))
- [React Router](https://github.com/remix-run/react-router) ([MIT](https://opensource.org/license/mit))
- [MUI](https://github.com/mui/material-ui) ([MIT](https://opensource.org/license/mit))
- [Emotion](https://github.com/emotion-js/emotion) ([MIT](https://opensource.org/license/mit))
- [any-ascii](https://github.com/anyascii/anyascii) ([ISC](https://opensource.org/license/isc-license-txt))
