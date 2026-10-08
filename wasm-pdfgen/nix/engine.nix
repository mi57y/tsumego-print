{ pkgs, embedRoot }:

let
  inherit (pkgs)
    lib
    stdenv
    fetchurl
    emscripten
    nodejs
    pkg-config
    perl
    texlive
    ;

  embedLinkFlags = lib.concatStringsSep " " [
    "-Oz"
    "-g0"
    "-sASSERTIONS=0"
    "-sMALLOC=emmalloc"
    "-sALLOW_MEMORY_GROWTH=1"
    "-sINITIAL_MEMORY=134217728"
    "-sMODULARIZE=1"
    "-sEXPORT_NAME=LatexModule"
    "-sEXPORT_ES6=1"
    "-sENVIRONMENT=web,node"
    "-sEXIT_RUNTIME=0"
    "-sEXPORTED_RUNTIME_METHODS=FS"
    "-sLZ4=1"
    "--preload-file"
    "${embedRoot}@/share"
  ];
in
stdenv.mkDerivation {
  pname = "pdftex-wasm-engine";
  version = "2025";

  src = fetchurl {
    url = "https://github.com/TeX-Live/texlive-source/archive/refs/tags/svn74917.tar.gz";
    hash = "sha256-QgUN5LOFeD6Jt0ENF6Uwi516D8PH+TXZ+MCO8bCTHqE=";
  };

  nativeBuildInputs = [
    emscripten
    nodejs
    pkg-config
    perl
    texlive.bin.core.web
    texlive.bin.core.cweb
    texlive.bin.core.omegaware
    texlive.bin.core.tie
  ];

  enableParallelBuilding = false;

  NIX_CFLAGS_COMPILE = [
    "-Oz"
    "-g0"
  ];

  prePatch = ''
    for i in texk/kpathsea/mktex*; do
      sed -i '/^mydir=/d' "$i"
    done
    sed -i '/^#define ST_NLINK_TRICK/d' texk/kpathsea/config.h

    sed -i \
      -e '/ctie\$(EXEEXT) cweave\$(EXEEXT)/d' \
      -e '/ctwill-refsort\$(EXEEXT)/d' \
      -e '/ctwill-twinx\$(EXEEXT) tie\$(EXEEXT)/d' \
      texk/web2c/Makefile.in
  '';

  preConfigure = ''
    export EMCC_CFLAGS=-Oz
    rm -rf libs/{cairo,freetype2,gd,gmp,graphite2,harfbuzz,icu,lua53,luajit,mpfr,pixman,pplib,teckit,zziplib} \
           texk/{bibtex-x,chktex,dvipng,dvisvgm,upmendex,xdvik} \
           utils/{asymptote,texdoctk,xindy,xpdfopen}
    export EM_CACHE="$TMPDIR/em_cache"
    cp -a "$em_cachesrc/." "$EM_CACHE/"
    chmod -R u+w "$EM_CACHE"
    mkdir WorkDir
    cd WorkDir
  '';

  em_cachesrc = "${emscripten}/share/emscripten/cache";

  configureScript = "../configure";

  configureFlags = [
    "--with-banner-add=/wasm"
    "--disable-missing"
    "--disable-native-texlive-build"
    "--disable-texlive"
    "--disable-linked-scripts"
    "-C"
    "CFLAGS=-std=gnu17"
    "--without-x"
    "--disable-all-pkgs"
    "--enable-web2c"
    "--enable-pdftex"
    "--enable-kpathsea"
    "--enable-zlib"
    "--disable-tex"
    "--disable-ptex"
    "--disable-eptex"
    "--disable-uptex"
    "--disable-euptex"
    "--disable-aleph"
    "--disable-hitex"
    "--disable-web-progs"
    "--disable-synctex"
    "--disable-chktex"
    "--disable-dvisvgm"
    "--disable-dvipng"
    "--disable-luatex"
    "--disable-luajittex"
    "--disable-luahbtex"
    "--disable-luajithbtex"
    "--disable-mp"
    "--disable-pmp"
    "--disable-upmp"
    "--disable-mf"
    "--disable-mflua"
    "--disable-mfluajit"
    "--disable-xetex"
    "--disable-bibtexu"
    "--disable-bibtex8"
    "--disable-bibtex-x"
    "--disable-upmendex"
    "--with-system-zlib=no"
    "--with-system-libpng=no"
    "--with-system-libpaper=no"
    "--with-system-cairo=no"
    "--with-system-freetype2=no"
    "--with-system-gd=no"
    "--with-system-gmp=no"
    "--with-system-graphite2=no"
    "--with-system-harfbuzz=no"
    "--with-system-icu=no"
    "--with-system-luajit=no"
    "--with-system-mpfr=no"
    "--with-system-pixman=no"
    "--with-system-teckit=no"
    "--with-system-zziplib=no"
    "--host=wasm32-unknown-emscripten"
    "--build=${stdenv.buildPlatform.config}"
    "BUILDCC=${stdenv.cc}/bin/cc"
    "CC=emcc"
    "CXX=em++"
    "AR=emar"
    "RANLIB=emranlib"
  ];

  dontStrip = true;

  buildPhase = ''
    export EM_CACHE="$TMPDIR/em_cache"
    make -j1
    rm -f texk/web2c/pdftex texk/web2c/pdftex.js texk/web2c/pdftex.wasm
    make -C texk/web2c -j1 pdftex "LDFLAGS=${embedLinkFlags}"
  '';

  installPhase = ''
    runHook preInstall
    mkdir -p "$out"
    cp texk/web2c/pdftex "$out/latex.js"
    cp texk/web2c/pdftex.wasm "$out/latex.wasm"
    cp texk/web2c/pdftex.data "$out/latex.data"
    sed -i 's/pdftex\.data/latex.data/g; s/pdftex\.wasm/latex.wasm/g' "$out/latex.js"
    echo "latex-wasm: engine built:"
    ls -la "$out"
    runHook postInstall
  '';

  meta = {
    description = "pdfTeX engine compiled to WebAssembly";
    license = lib.licenses.gpl2Plus;
  };
}
