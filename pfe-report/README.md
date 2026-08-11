# 📄 Guide Rapport PFE — Plateforme Memo
**ENSAM Rabat — Filière INDIA — Stage Syntax 2025/2026**
**Auteur : Mohamed ALAOUI**

---

## 📋 Table des matières
1. [Prérequis](#1-prérequis)
2. [Installation sur Windows (WSL)](#2-installation-sur-windows-wsl)
3. [Installation sur Linux / Mac](#3-installation-sur-linux--mac)
4. [Cloner le dépôt](#4-cloner-le-dépôt)
5. [Compiler le rapport](#5-compiler-le-rapport)
6. [Workflow Git — Contribuer au rapport](#6-workflow-git--contribuer-au-rapport)
7. [Créer sa propre branche](#7-créer-sa-propre-branche)
8. [Pousser ses modifications](#8-pousser-ses-modifications)
9. [Mise à jour — récupérer les changements des autres](#9-mise-à-jour--récupérer-les-changements-des-autres)
10. [Structure du projet](#10-structure-du-projet)
11. [Commandes de référence rapide](#11-commandes-de-référence-rapide)

---

## 1. Prérequis

Avant de commencer, vous avez besoin de :
- **Git** installé sur votre machine
- **Un compte GitHub** avec accès au dépôt `zaykats/report_syntax`
- **Un Personal Access Token GitHub** (voir section 4)

---

## 2. Installation sur Windows (WSL)

> ✅ Méthode recommandée sur Windows : utiliser **WSL (Windows Subsystem for Linux)** avec Ubuntu.

### Étape 1 — Installer WSL (si pas encore fait)
Ouvrez PowerShell en tant qu'administrateur et tapez :
```powershell
wsl --install
```
Redémarrez votre PC. Ubuntu s'installera automatiquement.

### Étape 2 — Ouvrir un terminal Ubuntu
- Cherchez **Ubuntu** dans le menu Démarrer, ou
- Ouvrez VS Code → cliquez en bas à gauche → **Connect to WSL**

### Étape 3 — Installer LaTeX (texlive-full)
Dans le terminal Ubuntu/WSL :
```bash
sudo apt update
sudo apt install texlive-full biber -y
```
> ⚠️ Cette installation prend environ 10–20 minutes et ~5 Go. Faites-la une seule fois.

### Étape 4 — Installer les polices nécessaires
```bash
sudo apt install fonts-dejavu fonts-freefont-ttf fonts-hosny-amiri -y
fc-cache -fv
```

### Étape 5 — Installer Git
```bash
sudo apt install git -y
git --version
```

### Étape 6 — Vérifier que tout est installé
```bash
xelatex --version
biber --version
git --version
```
Les trois commandes doivent retourner un numéro de version sans erreur.

---

## 3. Installation sur Linux / Mac

### Linux (Ubuntu / Debian)
```bash
sudo apt update
sudo apt install texlive-full biber git fonts-dejavu fonts-freefont-ttf fonts-hosny-amiri -y
fc-cache -fv
```

### Mac (avec Homebrew)
```bash
# Installer Homebrew si pas encore fait
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Installer MacTeX et Git
brew install --cask mactex
brew install git

# Redémarrer le terminal, puis vérifier :
xelatex --version
biber --version
```

---

## 4. Cloner le dépôt

### Étape 1 — Générer un Personal Access Token GitHub
GitHub n'accepte plus les mots de passe. Il faut un token :

1. Allez sur **github.com** → cliquez sur votre photo de profil → **Settings**
2. En bas à gauche → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. Cliquez **Generate new token (classic)**
4. Donnez un nom (ex: `pfe-report`), cochez **repo**, cliquez **Generate token**
5. **Copiez le token immédiatement** — vous ne pourrez plus le voir après

### Étape 2 — Cloner le dépôt
```bash
cd ~
git clone https://github.com/zaykats/report_syntax.git
cd report_syntax
```
Quand Git vous demande le mot de passe, **collez votre Personal Access Token** (pas votre mot de passe GitHub).

### Étape 3 — Configurer votre identité Git (une seule fois)
```bash
git config --global user.name "Votre Prénom NOM"
git config --global user.email "votre.email@ensam.ac.ma"
```

---

## 5. Compiler le rapport

Allez dans le dossier du projet et compilez avec **xelatex** (pas pdflatex) :

```bash
cd ~/report_syntax
xelatex main.tex
biber main
xelatex main.tex
xelatex main.tex
```

> ℹ️ Il faut lancer **xelatex 3 fois** pour que la table des matières, les références et les numéros de page soient corrects.

Le fichier **`main.pdf`** sera généré dans le même dossier.

### Nettoyage des fichiers temporaires (optionnel)
```bash
rm -f main.aux main.bbl main.bcf main.blg main.log main.out main.toc main.lof main.lot main.xdv chapters/*.aux
```

---

## 6. Workflow Git — Contribuer au rapport

Voici la procédure à suivre **à chaque fois** que vous voulez travailler sur le rapport :

```
1. Récupérer les derniers changements (git pull)
2. Travailler sur votre branche
3. Sauvegarder vos modifications (git add + git commit)
4. Pousser vers GitHub (git push)
5. Créer une Pull Request pour merger dans main
```

---

## 7. Créer sa propre branche

**Ne travaillez jamais directement sur `main`.** Chaque membre de l'équipe crée sa propre branche.

### Convention de nommage des branches
```
prenom/ce-que-vous-faites
```
Exemples :
- `mohamed/chapitre-2-etat-art`
- `ahmed/chapitre-3-conception`
- `sara/introduction-conclusion`

### Créer et basculer sur votre branche
```bash
# Vérifiez d'abord que vous êtes à jour
git checkout main
git pull origin main

# Créez votre branche
git checkout -b prenom/nom-du-chapitre

# Exemple :
git checkout -b mohamed/chapitre-2-etat-art
```

### Vérifier sur quelle branche vous êtes
```bash
git branch
```
La branche active est marquée d'un `*`.

---

## 8. Pousser ses modifications

Après avoir édité vos fichiers `.tex` :

```bash
# 1. Voir ce qui a changé
git status

# 2. Ajouter vos fichiers modifiés
git add chapters/07-Etat-de-lart.tex
# Ou pour tout ajouter d'un coup :
git add .

# 3. Créer un commit avec un message clair
git commit -m "Ch2: add LangGraph section and voice pipeline explanation"

# 4. Pousser votre branche sur GitHub
git push origin prenom/nom-de-votre-branche
```

### Créer une Pull Request
1. Allez sur **github.com/zaykats/report_syntax**
2. Vous verrez un bouton **"Compare & pull request"** — cliquez dessus
3. Décrivez ce que vous avez fait
4. Demandez à un coéquipier de relire avant de merger dans `main`

---

## 9. Mise à jour — récupérer les changements des autres

**Avant de commencer à travailler**, toujours récupérer les derniers changements :

```bash
# Récupérer les mises à jour de main
git checkout main
git pull origin main

# Revenir sur votre branche et mettre à jour
git checkout votre-branche
git merge main
```

Si vous avez des conflits (deux personnes ont modifié le même fichier) :
```bash
# Git vous indique les fichiers en conflit
git status

# Ouvrez le fichier concerné, cherchez les marqueurs :
# <<<<<<< HEAD
# votre version
# =======
# version de l'autre
# >>>>>>> main

# Gardez la bonne version, supprimez les marqueurs, puis :
git add fichier-en-conflit.tex
git commit -m "Resolve merge conflict in chapter X"
```

---

## 10. Structure du projet

```
report_syntax/
├── main.tex                  ← Fichier principal (ne pas modifier sans concertation)
├── references.bib            ← Bibliographie
├── img/                      ← Images (logos, diagrammes, Gantt...)
└── chapters/
        ├── 00-Page-de-garde.tex  ← Page de couverture
        ├── 01-Dedicace.tex       ← Dédicaces
        ├── 02-Remerciements.tex  ← Remerciements
        ├── 03-Resume.tex         ← Résumés FR / EN / AR
        ├── 04-Acronymes.tex      ← Liste des abréviations
        ├── 05-Introduction.tex   ← Introduction générale
        ├── 06-Contexte.tex       ← Chapitre 1 : Cadrage
        ├── 07-Etat-de-lart.tex   ← Chapitre 2 : État de l'art
        ├── 07_04-llm.tex         ← Sous-section LLMs
        ├── 07_05-prompt.tex      ← Sous-section Prompt Engineering
        ├── 07_06-rag.tex         ← Sous-section RAG
        ├── 08-Conception.tex     ← Chapitre 3 : Conception
        ├── 09-Realisation.tex    ← Chapitre 4 : Réalisation
        ├── 10-Conclusion.tex     ← Conclusion générale
        └── 11-Annexe.tex         ← Annexes
```

> 💡 **Règle d'or :** chaque membre travaille sur ses propres fichiers de chapitres. Évitez de modifier `main.tex` sans prévenir l'équipe.

---

## 11. Commandes de référence rapide

| Action | Commande |
|--------|----------|
| Voir l'état du dépôt | `git status` |
| Voir toutes les branches | `git branch -a` |
| Changer de branche | `git checkout nom-branche` |
| Créer une nouvelle branche | `git checkout -b prenom/chapitre` |
| Récupérer les mises à jour | `git pull origin main` |
| Ajouter des fichiers | `git add .` |
| Créer un commit | `git commit -m "message clair"` |
| Pousser sa branche | `git push origin nom-branche` |
| Compiler le rapport | `xelatex main.tex` |
| Compilation complète | `xelatex main.tex && biber main && xelatex main.tex && xelatex main.tex` |
| Nettoyer les fichiers temp | `rm -f main.aux main.bbl main.bcf main.blg main.log main.out main.toc main.lof main.lot main.xdv chapters/*.aux` |

---

*Rapport PFE — ENSAM Rabat — Filière INDIA — Syntax — 2025/2026*