{ engine, pkgs }:

let
  website = pkgs.stdenv.mkDerivation {
    pname = "test-website";
    version = "2025";
    outputs = [ "out" ];

    src = pkgs.lib.cleanSourceWith {
      src = ./.;
      filter = path: _type: !(pkgs.lib.hasSuffix ".nix" (builtins.baseNameOf (toString path)));
    };

    dontUnpack = true;
    dontConfigure = true;
    dontBuild = true;

    installPhase = ''
      runHook preInstall

      mkdir -p "$out"
      cp -a "$src/." "$out/"
      chmod u+w "$out"
      cp -as "${engine}/." "$out/"

      runHook postInstall
    '';
  };

  serve = pkgs.writeShellScriptBin "serve-test-website" ''
    echo Serving test website from: ${website}
    exec ${pkgs.python3}/bin/python3 -m http.server 8088 \
      --directory "${website}"
  '';
in
{
  inherit website;

  app = {
    type = "app";
    program = "${serve}/bin/serve-test-website";
  };
}
