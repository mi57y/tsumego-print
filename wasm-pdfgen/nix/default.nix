{ pkgs, latex-packages }:

let
  inherit (pkgs) stdenv;

  # latex-bin but without luatex stuff generating pdftex won't use
  minimalLatexBin = pkgs.texlive.pkgs.latex-bin // {
    tlDeps = with pkgs.texlive.pkgs; [
      pdftex
      l3backend
      l3kernel
      latex
      firstaid
      babel
      cm
      hyphen-base
      knuth-lib
      latex-fonts
      tex-ini-files
      unicode-data
      dehyph
      hyph-utf8
    ];
    formats = builtins.filter (f: f.name == "pdflatex") pkgs.texlive.pkgs.latex-bin.formats;
  };

  texEnv = pkgs.texlive.withPackages (
    ps:
    latex-packages
    ++ [
      minimalLatexBin
      ps.amsfonts
    ]
  );
  texmf = import ./texmf.nix { inherit pkgs texEnv; };
  engine = import ./engine.nix {
    inherit pkgs;
    embedRoot = texmf.tree;
  };

  latexWasm = stdenv.mkDerivation {
    pname = "latex-wasm";
    version = "2025";
    outputs = [ "out" ];

    inherit engine;
    latexApi = ./lib/latex-api.js;

    dontUnpack = true;

    installPhase = ''
      runHook preInstall

      mkdir -p "$out"
      cp "$engine/latex.js" "$out/latex.js"
      cp "$engine/latex.wasm" "$out/latex.wasm"
      cp "$engine/latex.data" "$out/latex.data"
      cp "$latexApi" "$out/latex-api.js"

      echo "latex-wasm: final artifact packaged:"
      ls -la "$out"

      runHook postInstall
    '';
  };
in
{
  inherit engine latexWasm;
  texmfTree = texmf.tree;
}
