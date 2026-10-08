{ engine, pkgs }:

let
  harness = pkgs.stdenv.mkDerivation {
    pname = "test-gen-pdf";
    version = "2025";
    outputs = [ "out" ];

    dontUnpack = true;
    dontConfigure = true;
    dontBuild = true;

    nativeBuildInputs = [
      pkgs.nodejs
    ];

    installPhase = ''
      runHook preInstall

      mkdir -p "$out/bin"
      cp "${./test-gen-pdf.mjs}" "$out/bin/test-gen-pdf.mjs"
      cp -as "${engine}/." "$out/bin/"

      runHook postInstall
    '';

    doInstallCheck = true;
    installCheckPhase = ''
      work=$(mktemp -d)
      cp "${./smoke.tex}" "$work/smoke.tex"
      node "$out/bin/test-gen-pdf.mjs" "$work/smoke.tex" -o "$work/smoke.pdf"
      head -c 4 "$work/smoke.pdf" | grep -q '%PDF'
      echo "test-gen-pdf: library e2e passed"
    '';
  };

  wrapper = pkgs.writeShellScriptBin "test-gen-pdf" ''
    exec ${pkgs.nodejs}/bin/node "${harness}/bin/test-gen-pdf.mjs" "$@"
  '';
in
{
  inherit harness;

  app = {
    type = "app";
    program = "${wrapper}/bin/test-gen-pdf";
  };
}
