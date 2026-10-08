{ pkgs }:

pkgs.stdenvNoCC.mkDerivation {
  pname = "gnos";
  version = "2026-07-27";

  src = pkgs.fetchFromGitHub {
    owner = "otrego";
    repo = "go-type1";
    rev = "b243c69d1a56801914af739b4dd4d94551f84df2";
    hash = "sha256-EY8qtxwH1mDMkTX2JOXZrTZKdQRn0GcmyVsehZB+O0w=";
  };

  outputs = [ "tex" ];

  preHook = ''
    out="''${tex-}"
  '';

  installPhase = ''
    runHook preInstall

    mkdir -p "$tex/tex/latex/gnos" "$tex/fonts/type1/gnos" "$tex/fonts/tfm/gnos" "$tex/fonts/map/dvips/gnos"
    cp gnos-fonts/gnos.sty "$tex/tex/latex/gnos/"
    cp gnos-fonts/gnos.map "$tex/fonts/map/dvips/gnos/"
    cp gnos-fonts/*.pfb "$tex/fonts/type1/gnos/"
    cp gnos-fonts/*.tfm "$tex/fonts/tfm/gnos/"

    runHook postInstall
  '';

  fontMaps = [ "Map gnos.map" ];

  meta = {
    description = "Gnos: Type 1 fonts for Go (Baduk) boards in LaTeX";
    license = pkgs.lib.licenses.asl20;
    platforms = pkgs.lib.platforms.all;
  };
}
