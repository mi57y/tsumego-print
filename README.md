# Tsumego Print

Create customizable, printable PDF collections of Go problems (tsumego) from [Online-Go](https://online-go.com) puzzle collections or SGF files.

Everything runs in the browser: the app generates a LaTeX file and compiles it to PDF with a WebAssembly build of pdfTeX.

## Features

- Import collections from Online-Go or upload an SGF file.
- Customize the layout, randomize board orientation and stone colors.
- Download PDF generated in the browser, or an editable LaTeX file to customize the formatting further.

## Building and development

This is an `npm` project, but it must be built with Nix, which also builds the LaTeX compiler.

`wasm-pdfgen/` is a module that provides a simple API for compiling LaTeX. While ready-made solutions for compiling LaTeX in the browser exist, this custom module:

- Uses the [go-type1](https://github.com/otrego/go-type1) package, which isn't on CTAN.
- Needs only a very small set of LaTeX packages, and combines them all into a single compressed file.
- Compiles with Nix natively on macOS and Linux.

See the separate README.md in `wasm-pdfgen/` for more details.

Building Tsumego Print:

```
# build deployable static files to result/
nix build
# run the Vite development server
nix run .#dev
# run tests
nix run .#test
```
