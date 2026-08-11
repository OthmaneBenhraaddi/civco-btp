#!/usr/bin/env bash
# ============================================================
#  build.sh — Compilation du rapport PFE depuis WSL / Linux
#
#  Pilote le MiKTeX installé côté Windows (accessible via /mnt/c)
#  ou un XeLaTeX/biber natif Linux s'il est présent dans le PATH.
#
#  Usage : ./build.sh           (compilation complète : xelatex→biber→xelatex×2)
#          ./build.sh --fast    (une seule passe, brouillon, sans bibliographie)
#          ./build.sh --clean   (suppression des fichiers temporaires)
#
#  Surcharge possible du chemin MiKTeX :
#          MIKTEX_BIN=/mnt/c/.../bin/x64 ./build.sh
# ============================================================
set -euo pipefail

TEXFILE="main"
# Toujours travailler depuis le dossier du script.
cd "$(dirname "$(readlink -f "$0")")"

# ── Localiser les binaires ──────────────────────────────────
# 1) XeLaTeX/biber natifs Linux s'ils existent ; 2) sinon MiKTeX Windows.
find_windows_bin() {
  local name="$1"
  # Chemin explicite fourni par l'utilisateur ?
  if [[ -n "${MIKTEX_BIN:-}" && -x "$MIKTEX_BIN/$name.exe" ]]; then
    echo "$MIKTEX_BIN/$name.exe"; return 0
  fi
  # Recherche dans les emplacements MiKTeX usuels (par-utilisateur puis système).
  local hit
  hit=$(ls /mnt/c/Users/*/AppData/Local/Programs/MiKTeX/miktex/bin/x64/"$name".exe 2>/dev/null | head -1 || true)
  [[ -z "$hit" ]] && hit=$(ls "/mnt/c/Program Files/MiKTeX"*/miktex/bin/x64/"$name".exe 2>/dev/null | head -1 || true)
  [[ -n "$hit" ]] && { echo "$hit"; return 0; }
  return 1
}

resolve() {
  local name="$1"
  if command -v "$name" >/dev/null 2>&1; then
    echo "$name"          # binaire Linux natif
  else
    find_windows_bin "$name" || return 1
  fi
}

XELATEX=$(resolve xelatex) || { echo "ERREUR : xelatex introuvable (ni Linux, ni MiKTeX Windows)." >&2; exit 1; }
BIBER=$(resolve biber)     || { echo "ERREUR : biber introuvable (ni Linux, ni MiKTeX Windows)." >&2; exit 1; }

# ── Nettoyage MiKTeX : issues.json bloque parfois la compilation ──
issues=$(ls /mnt/c/Users/*/AppData/Roaming/MiKTeX/miktex/config/issues.json 2>/dev/null | head -1 || true)
[[ -n "$issues" ]] && echo "[]" > "$issues" 2>/dev/null || true

# ── Gestion des fichiers temporaires ────────────────────────
clean() {
  local exts=(aux bbl bcf blg log out toc lof lot xdv run.xml)
  for e in "${exts[@]}"; do
    rm -f "$TEXFILE.$e" chapters/*."$e"
  done
  echo "  Fichiers temporaires supprimés."
}

run_xelatex() {
  echo "  [XeLaTeX passe $1]"
  "$XELATEX" -interaction=nonstopmode "$TEXFILE.tex" >/dev/null
}

# ── Traitement des arguments ────────────────────────────────
case "${1:-}" in
  --clean|-c)
    clean; exit 0 ;;
  --fast|-f)
    echo "=== Compilation rapide (1 passe) ==="
    run_xelatex 1
    echo; echo "=== Terminé : $TEXFILE.pdf généré ==="
    exit 0 ;;
  ""|--full)
    : ;;  # compilation complète ci-dessous
  *)
    echo "Argument inconnu : $1" >&2
    echo "Usage : ./build.sh [--fast|--clean]" >&2
    exit 2 ;;
esac

# ── Compilation complète : xelatex → biber → xelatex → xelatex ──
echo "=== Compilation du rapport PFE ==="
run_xelatex 1
echo "  [Biber]"
"$BIBER" "$TEXFILE" >/dev/null
run_xelatex 2
run_xelatex 3
echo; echo "=== Terminé : $TEXFILE.pdf généré ==="
