# 🚀 Quick Compilation Guide

## One-Line Compilation (Recommended)

```bash
export PATH="/c/Users/S91003489/AppData/Local/Programs/MiKTeX/miktex/bin/x64:$PATH" && xelatex main.tex && biber main && xelatex main.tex && xelatex main.tex
```

## Step-by-Step Compilation

```bash
# 1. Set up MiKTeX path
export PATH="/c/Users/S91003489/AppData/Local/Programs/MiKTeX/miktex/bin/x64:$PATH"

# 2. First compilation
xelatex main.tex

# 3. Process bibliography
biber main

# 4. Second compilation (for references)
xelatex main.tex

# 5. Third compilation (for TOC and page numbers)
xelatex main.tex
```

## Clean Temporary Files

```bash
rm -f main.aux main.bbl main.bcf main.blg main.log main.out main.toc main.lof main.lot main.xdv main.run.xml chapters/*.aux
```

## Quick Commands

| Command | Description |
|---------|-------------|
| `xelatex main.tex` | Compile once (quick preview) |
| `biber main` | Process bibliography |
| Full compile | All 3 commands above |

## Output

✅ **Result**: `main.pdf` (36 pages, 2.1 MB)

---

**Note**: Always run from the `report_syntax` directory!
