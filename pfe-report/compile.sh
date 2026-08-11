#!/bin/bash
# Quick compilation script for LaTeX report

echo "🔧 Setting up MiKTeX path..."
export PATH="/c/Users/S91003489/AppData/Local/Programs/MiKTeX/miktex/bin/x64:$PATH"

echo "📄 Compiling LaTeX document (1/3)..."
xelatex -interaction=nonstopmode main.tex > /dev/null

echo "📚 Processing bibliography..."
biber main > /dev/null

echo "📄 Compiling LaTeX document (2/3)..."
xelatex -interaction=nonstopmode main.tex > /dev/null

echo "📄 Compiling LaTeX document (3/3)..."
xelatex -interaction=nonstopmode main.tex > /dev/null

echo ""
echo "✅ Compilation complete!"
echo "📦 Output: main.pdf"
ls -lh main.pdf
