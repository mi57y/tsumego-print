{
  description = "Tsumego Print: Online-Go puzzle collections rendered to printable PDFs";

  inputs = {
    latex-wasm.url = "path:./wasm-pdfgen";
    nixpkgs.follows = "latex-wasm/nixpkgs";
  };

  outputs =
    { self, nixpkgs, latex-wasm }:
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
          inherit (pkgs) lib;

          engine = latex-wasm.packages.${system}.latex-wasm;

          placeEngine = ''
            mkdir -p public/latex
            cp -R ${engine}/. public/latex/
            chmod -R u+w public/latex
            ln -sfn ${engine}/latex-api.js src/pdf/latex-api.js
          '';

          tsumegoPrint = pkgs.buildNpmPackage {
            pname = "tsumego-print";
            version = "0.0.0";

            src = lib.fileset.toSource {
              root = ./.;
              fileset = lib.fileset.unions [
                ./src
                ./index.html
                ./package.json
                ./package-lock.json
                ./tsconfig.json
                ./vite.config.ts
                ./.env
                ./eslint.config.js
                ./.prettierrc.json
                ./.prettierignore
                ./README.md
              ];
            };

            npmDepsHash = "sha256-MxF7zuI3q2MzfIzkOrkRDRaUe8Aguyl5xjpBm0e9fM4=";

            preBuild = placeEngine;

            buildPhase = ''
              runHook preBuild
              npm run build
              runHook postBuild
            '';

            doCheck = true;
            checkPhase = ''
              runHook preCheck
              npm run lint
              npm run format:check
              npm test
              runHook postCheck
            '';

            installPhase = ''
              runHook preInstall
              cp -R dist "$out"
              runHook postInstall
            '';
          };

          repoApp =
            name: script:
            let
              exe = pkgs.writeShellApplication {
                inherit name;
                runtimeInputs = [ pkgs.nodejs ];
                text = ''
                  if [ ! -f package.json ]; then
                    echo "run this from the repository root" >&2
                    exit 1
                  fi
                  if [ ! -d node_modules ]; then
                    npm ci
                  fi
                  ${placeEngine}
                  exec npm run ${script} -- "$@"
                '';
              };
            in
            {
              type = "app";
              program = lib.getExe exe;
            };
        in
        {
          packages.default = tsumegoPrint;

          apps = {
            dev = repoApp "tsumego-print-dev" "dev";
            test = repoApp "tsumego-print-test" "test";
          };

          devShells.default = pkgs.mkShell {
            packages = [ pkgs.nodejs ];
            shellHook = placeEngine;
          };
        };

      outputsPerSystem = nixpkgs.lib.genAttrs systems perSystem;
      forEachOutput = name: nixpkgs.lib.mapAttrs (_: outputs: outputs.${name}) outputsPerSystem;
    in
    {
      packages = forEachOutput "packages";
      apps = forEachOutput "apps";
      devShells = forEachOutput "devShells";
    };
}
