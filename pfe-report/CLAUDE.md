# CLAUDE.md

Ce fichier fournit des directives à Claude Code (claude.ai/code) pour travailler sur le code de ce dépôt.

## Vue d'ensemble du projet

Ceci est un rapport de fin d'études (PFE - Projet de Fin d'Études) en LaTeX pour l'EMSI Casablanca, documentant le développement de la plateforme IMA (Interview Manager Agent) - un système d'entretiens alimenté par l'IA. Le rapport est rédigé principalement en français avec des résumés en anglais et en arabe.

**Auteur :** Aymane KANAOUI  
**Institution :** EMSI Casablanca, Filière IIR (Ingénierie Informatique et Réseaux)  
**Projet :** Stage Syntax - plateforme IMA  
**Année universitaire :** 2025/2026

## Système de compilation

**CRITIQUE : Ce projet nécessite XeLaTeX, PAS pdfLaTeX**

Le document utilise `fontspec` et `polyglossia` pour le support multilingue (français, anglais, arabe), ce qui nécessite XeLaTeX.

### Commande de compilation complète
```bash
xelatex main.tex && biber main && xelatex main.tex && xelatex main.tex
```

Trois exécutions de XeLaTeX sont nécessaires :
1. Première exécution : Compilation initiale
2. Après biber : Traitement de la bibliographie
3. Deuxième et troisième exécutions : Mise à jour des références croisées, table des matières et numéros de page

### Compilation rapide (pour vérifications)
```bash
xelatex main.tex
```

### Nettoyer les fichiers temporaires
```bash
rm -f main.aux main.bbl main.bcf main.blg main.log main.out main.toc main.lof main.lot main.xdv chapters/*.aux
```

## Architecture du document

### Structure principale
- **`main.tex`** : Document racine qui inclut tous les chapitres. Définit la classe du document, les packages et la structure globale
- **`references.bib`** : Fichier de bibliographie (format BibLaTeX avec backend biber, style IEEE)
- **`chapters/`** : Tous les fichiers de contenu organisés par séquence
- **`img/`** : Images et figures

### Organisation des chapitres
Les fichiers sont numérotés séquentiellement pour refléter l'ordre du document :

**Pages préliminaires** (numérotation romaine) :
- `00-Page-de-garde.tex` : Page de couverture
- `01-Dedicace.tex` : Dédicace
- `02-Remerciements.tex` : Remerciements
- `03-Resume.tex` : Résumé français
- `03.02-Resume.tex` : Résumé anglais (Abstract)
- `03.03-Resume.tex` : Résumé arabe (ملخص)
- `04-Acronymes.tex` : Liste des abréviations

**Contenu principal** (numérotation arabe) :
- `05-Introduction.tex` : Introduction générale
- `06-Contexte.tex` : Chapitre 1 - Contexte et cadrage du projet
- `07-Etat-de-lart.tex` : Chapitre 2 - État de l'art
  - Inclut des sous-sections via `\input` :
    - `07_04-llm.tex` : Section sur les LLMs
    - `07_05-prompt.tex` : Section sur le prompt engineering
    - `07_06-rag.tex` : Section sur les pipelines RAG
- `08-Conception.tex` : Chapitre 3 - Conception du système
- `09-Realisation.tex` : Chapitre 4 - Réalisation
- `10-Conclusion.tex` : Conclusion générale
- `11-Annexe.tex` : Annexes

### Modèle de chapitre modulaire
Le chapitre État de l'art démontre la structure modulaire : le fichier principal du chapitre (`07-Etat-de-lart.tex`) définit les sections et utilise `\input{chapters/07_XX-topic.tex}` pour inclure le contenu des sous-sections. Ce modèle peut être appliqué à d'autres chapitres lorsqu'ils deviennent volumineux.

## Configuration technique LaTeX

### Ordre critique de chargement des packages
Le projet a une séquence spécifique de chargement des packages pour éviter les conflits entre `polyglossia`, `biblatex` et `bidi` :

1. Packages mathématiques (`amsmath`, `amssymb`)
2. Moteur de polices (`fontspec`)
3. Packages standards (geometry, graphics, tables, etc.)
4. `polyglossia` (français + anglais ; arabe chargé séparément)
5. `biblatex` (doit venir après polyglossia)
6. `hyperref` (avant bidi)
7. `bidi` (chargé manuellement en dernier pour éviter les conflits)

**Ne jamais réorganiser ces packages ou insérer des packages entre polyglossia et bidi.**

### Support multilingue
- **Langue principale** : Français (via `\setmainlanguage{french}`)
- **Secondaire** : Anglais (via `\setotherlanguage{english}`)
- **Arabe** : Géré via `\arabicfont` manuel et package `bidi`
  - Utiliser `\begin{arabicblock}...\end{arabicblock}` pour le texte arabe
  - Police : Amiri (spécifiée via `\newfontfamily\arabicfont[Script=Arabic, Scale=1.1]{Amiri}`)

### Système de bibliographie
- **Backend** : biber (pas bibtex)
- **Style** : IEEE
- **Fichier** : `references.bib`
- Lors de l'ajout de références, utiliser des types d'entrées compatibles BibLaTeX (@misc, @book, @article, etc.)

## Workflow Git

### Convention de nommage des branches
```
prenom/description-du-travail
```
Exemples :
- `mohamed/chapitre-2-etat-art`
- `ahmed/chapitre-3-conception`

### Règles de collaboration
1. **Ne jamais commiter directement sur `main`** - toujours utiliser des branches de fonctionnalité
2. Chaque membre de l'équipe travaille typiquement sur des fichiers de chapitres spécifiques pour minimiser les conflits
3. Éviter de modifier `main.tex` sans coordination avec l'équipe
4. Créer des pull requests pour tous les changements à fusionner dans `main`

### Avant de commencer à travailler
```bash
git checkout main
git pull origin main
git checkout votre-branche
git merge main
```

## Dépendances requises

### Distribution LaTeX
```bash
# Ubuntu/Debian/WSL
sudo apt install texlive-full biber -y

# Polices pour le support multilingue
sudo apt install fonts-dejavu fonts-freefont-ttf fonts-hosny-amiri -y
fc-cache -fv
```

### Vérification
```bash
xelatex --version
biber --version
```

## Opérations courantes

### Ajouter une nouvelle section de chapitre
Lors de l'ajout d'une sous-section à un chapitre existant (suivant le modèle modulaire) :

1. Créer un nouveau fichier : `chapters/XX_YY-sujet.tex` (où XX est le numéro du chapitre, YY est le numéro de section)
2. Ajouter `\input{chapters/XX_YY-sujet.tex}` dans le chapitre parent à l'emplacement approprié
3. Le fichier de sous-section doit contenir uniquement le contenu de la section, pas les commandes `\section{}` (sauf s'il définit sa propre section)

### Ajouter des références bibliographiques
1. Ajouter l'entrée à `references.bib` en suivant le format existant
2. Citer dans le texte avec `\cite{cle}`
3. Recompiler avec biber : `xelatex main.tex && biber main && xelatex main.tex`

### Ajouter des images
1. Placer l'image dans le répertoire `img/`
2. Référencer sans préfixe de chemin : `\includegraphics[width=0.8\textwidth]{nomfichier.png}`
3. Le paramètre `\graphicspath{{img/}}` dans `main.tex` gère le chemin automatiquement

## Contexte du projet

La plateforme IMA est un système d'entretiens alimenté par l'IA utilisant :
- LLMs (GPT-4o, Gemini 2.5 Flash, Claude Sonnet/Opus)
- LangGraph pour la gestion de conversations multi-agents
- Technologies vocales (Deepgram STT, Cartesia TTS, LiveKit)
- Pipelines RAG
- Backend FastAPI

## Fichiers personnels

Les fichiers suivants contiennent des informations personnelles spécifiques à l'auteur :
- `chapters/01-Dedicace.tex` : Dédicaces personnelles
- `chapters/02-Remerciements.tex` : Remerciements personnels

Ces fichiers peuvent être personnalisés selon les préférences de l'auteur.
