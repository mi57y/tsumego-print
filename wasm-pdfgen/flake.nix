{
  description = "TeX Live (pdflatex) compiled to a single WebAssembly binary";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
  };

  outputs =
    { self, nixpkgs }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];

      perSystem =
        system:
        let
          pkgs = import nixpkgs { inherit system; };

          gnos = import ./packages/gnos { inherit pkgs; };

          latex-packages = [ gnos ] ++ (with pkgs.texlive.pkgs; [
            adjustbox
            varwidth
            epstopdf-pkg
            geometry
            fancyhdr
            tools
          ]);

          latexWasm = import ./nix { inherit pkgs latex-packages; };

          testWebsite = import ./test-website {
            inherit pkgs;
            engine = latexWasm.latexWasm;
          };
          testGenPdf = import ./test-gen-pdf {
            inherit pkgs;
            engine = latexWasm.latexWasm;
          };
        in
        {
          packages = {
            default = latexWasm.latexWasm;
            latex-wasm = latexWasm.latexWasm;
            engine = latexWasm.engine;
            tree = latexWasm.texmfTree;
            inherit gnos;
          };

          apps = {
            serve-test-website = testWebsite.app;
            test-gen-pdf = testGenPdf.app;
          };

          checks.e2e = testGenPdf.harness;

          formatter = pkgs.nixfmt-tree;

          devShells.default = pkgs.mkShell {
            packages = [
              pkgs.emscripten
              pkgs.nodejs
              pkgs.perl
              pkgs.pkg-config
              pkgs.texlive.bin.core.pdftex
            ];
          };
        };

      outputsPerSystem = nixpkgs.lib.genAttrs systems perSystem;
      forEachOutput = name: nixpkgs.lib.mapAttrs (_: outputs: outputs.${name}) outputsPerSystem;
    in
    {
      packages = forEachOutput "packages";
      apps = forEachOutput "apps";
      checks = forEachOutput "checks";
      formatter = forEachOutput "formatter";
      devShells = forEachOutput "devShells";
    };
}
