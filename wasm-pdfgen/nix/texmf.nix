{ pkgs, texEnv }:

let
  inherit (pkgs) stdenv perl;
in
{
  tree = stdenv.mkDerivation {
    pname = "texmf-tree";
    version = "2025";
    outputs = [ "out" ];

    inherit texEnv;

    dontUnpack = true;
    dontConfigure = true;
    dontBuild = true;

    nativeBuildInputs = [ perl ];

    buildCommand = ''
      set -euo pipefail

      mkdir -p "$out/texmf-dist"
      cp -rL "$texEnv/share/texmf/." "$out/texmf-dist/"
      chmod -R u+w "$out"
      cp -rL "$texEnv/share/texmf-var/." "$out/texmf-dist/"
      chmod -R u+w "$out"

      rm -rf "$out/texmf-dist/fonts/opentype" \
             "$out/texmf-dist/fonts/afm" \
             "$out/texmf-dist/fonts/source" \
             "$out/texmf-dist/fonts/pk"

      web2c="$out/texmf-dist/web2c"

      sed -e "s,\(TEXMFROOT[ ]*=[ ]*\)[^\,]*,\1/share,g" \
          -e "s,\(TEXMFDIST[ ]*=[ ]*\)[^\,]*,\1/share/texmf-dist,g" \
          -e "s,\(TEXMFLOCAL[ ]*=[ ]*\)[^\,]*,\1/share/texmf-local,g" \
          -e "s,\(TEXMFSYSVAR[ ]*=[ ]*\)[^\,]*,\1/tmp/texmf-var,g" \
          -e "s,\(TEXMFSYSCONFIG[ ]*=[ ]*\)[^\,]*,\1/tmp/texmf-config,g" \
          -e "s,\(TEXMFVAR[ ]*=[ ]*\)[^\,]*,\1/tmp/texmf-var,g" \
          -e "s,\(TEXMFCONFIG[ ]*=[ ]*\)[^\,]*,\1/tmp/texmf-config,g" \
          -e "s,\(TEXMFHOME[ ]*=[ ]*\)[^\,]*,\1/tmp/texmf-home,g" \
          -e "s,\$SELFAUTOLOC,/share,g" \
          -e "s,\$SELFAUTODIR,/share,g" \
          -e "s,\$SELFAUTOPARENT,/share,g" \
          -e "s,\$SELFAUTOGRANDPARENT,/share,g" \
          "$web2c/texmf.cnf" > "$web2c/texmf.cnf.tmp"
      mv "$web2c/texmf.cnf.tmp" "$web2c/texmf.cnf"

      cat >> "$web2c/texmf.cnf" <<'EOF'

      MKTEXTEX = 0
      MKTEXPK = 0
      MKTEXTFM = 0
      MKTEXFMT = 0
      VARTEXFONTS = /tmp/texmf-var/fonts
      EOF

      rm -f "$out/texmf-dist/ls-R"
      perl "$out/texmf-dist/scripts/texlive/mktexlsr.pl" --sort "$out/texmf-dist"

      echo "latex-wasm: texmf-tree built"
    '';
  };
}
