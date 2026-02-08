# Guide de Conversion des Documents

Ce guide explique comment convertir les fichiers Markdown en formats Word et PowerPoint.

---

## 📄 Conversion vers Word (.docx)

### Option 1 : Pandoc (Recommandé)

**Installation** :
```bash
# macOS
brew install pandoc

# Ubuntu/Debian
sudo apt-get install pandoc

# Windows
# Télécharger depuis https://pandoc.org/installing.html
```

**Conversion** :
```bash
# Document complet
pandoc PRESENTATION_COMITE_ENTREPRISE.md -o PRESENTATION_TAAJII.docx

# Avec table des matières
pandoc PRESENTATION_COMITE_ENTREPRISE.md -o PRESENTATION_TAAJII.docx --toc --toc-depth=3

# Avec style personnalisé
pandoc PRESENTATION_COMITE_ENTREPRISE.md -o PRESENTATION_TAAJII.docx --reference-doc=template.docx
```

**Résultat** :
- Fichier Word formaté avec styles
- Tableaux convertis automatiquement
- Liens cliquables préservés
- Emojis maintenus

---

### Option 2 : Éditeurs en ligne

**1. Dillinger (https://dillinger.io)**
- Coller le contenu Markdown
- Cliquer "Export as" → "Styled HTML"
- Ouvrir dans Word, "Save As" → DOCX

**2. StackEdit (https://stackedit.io)**
- Importer le fichier .md
- Menu → Export → Word

**3. Markdown to Word Online**
- https://products.aspose.app/words/conversion/md-to-docx
- Upload fichier, télécharger DOCX

---

### Option 3 : Microsoft Word directement

**Word 365 / 2019+** :
1. Ouvrir Word
2. Fichier → Ouvrir
3. Sélectionner "Tous les fichiers (*.*)"
4. Choisir le fichier .md
5. Word convertit automatiquement
6. Enregistrer sous .docx

---

## 📊 Conversion vers PowerPoint (.pptx)

### Option 1 : Pandoc vers PowerPoint

```bash
# Conversion directe
pandoc PRESENTATION_TAAJII_PPT.md -o PRESENTATION_TAAJII.pptx

# Avec template personnalisé
pandoc PRESENTATION_TAAJII_PPT.md -o PRESENTATION_TAAJII.pptx --reference-doc=template.pptx
```

**Note** : Le fichier `PRESENTATION_TAAJII_PPT.md` est structuré en slides avec séparateurs `---`

---

### Option 2 : Markdown to Slides (Marp)

**Installation** :
```bash
npm install -g @marp-team/marp-cli
```

**Conversion** :
```bash
# Vers PowerPoint
marp PRESENTATION_TAAJII_PPT.md -o PRESENTATION_TAAJII.pptx

# Vers PDF (alternative)
marp PRESENTATION_TAAJII_PPT.md -o PRESENTATION_TAAJII.pdf
```

**Avantages** :
- Design moderne automatique
- Transitions fluides
- Thèmes personnalisables

---

### Option 3 : Google Slides via Import

1. **Convertir en HTML** :
```bash
pandoc PRESENTATION_TAAJII_PPT.md -o presentation.html -s
```

2. **Importer dans Google Slides** :
- Ouvrir Google Slides
- Fichier → Importer des slides
- Upload HTML
- Exporter en .pptx

---

### Option 4 : Révéal.js (Présentation Web Interactive)

**Pour une présentation HTML moderne** :

```bash
# Installer reveal-md
npm install -g reveal-md

# Créer présentation interactive
reveal-md PRESENTATION_TAAJII_PPT.md

# Exporter en PDF
reveal-md PRESENTATION_TAAJII_PPT.md --print PRESENTATION_TAAJII.pdf
```

**Avantages** :
- Animations fluides
- Navigation clavier
- Responsive (mobile/desktop)
- Pas besoin de PowerPoint

**Démo** : Ouvrir http://localhost:1948

---

## 🎨 Personnalisation du Design

### Pour Word

**Créer un template** :
1. Ouvrir Word, créer document vide
2. Définir styles : Titre 1, Titre 2, Corps de texte, Tableau
3. Couleurs : Thème personnalisé (bleu #1e3a8a + cyan #0ea5e9)
4. Enregistrer comme `template.docx`
5. Utiliser avec Pandoc :
```bash
pandoc PRESENTATION_COMITE_ENTREPRISE.md -o output.docx --reference-doc=template.docx
```

---

### Pour PowerPoint

**Créer un template** :
1. Ouvrir PowerPoint, créer présentation vide
2. Affichage → Masque des diapositives
3. Définir :
   - Couleurs de marque (Taajii bleu/cyan)
   - Police (Segoe UI ou équivalent)
   - Logo en-tête
   - Footer avec numéro de slide
4. Enregistrer comme `template.pptx`
5. Utiliser avec Pandoc :
```bash
pandoc PRESENTATION_TAAJII_PPT.md -o output.pptx --reference-doc=template.pptx
```

---

## ✅ Vérifications Post-Conversion

### Word
- [ ] Titres bien hiérarchisés (H1, H2, H3)
- [ ] Tableaux formatés correctement
- [ ] Emojis affichés (installer police compatible si besoin)
- [ ] Liens cliquables fonctionnels
- [ ] Sauts de page appropriés
- [ ] Table des matières générée

### PowerPoint
- [ ] Une slide = un concept
- [ ] Titres clairs et visibles
- [ ] Pas de surcharge de texte (max 6 points par slide)
- [ ] Images/icônes bien placées
- [ ] Transitions fluides
- [ ] Numéros de slides
- [ ] Footer avec contact

---

## 🚀 Commandes Rapides

```bash
# Installation rapide des outils
npm install -g @marp-team/marp-cli reveal-md
brew install pandoc  # ou apt-get install pandoc

# Conversions complètes
pandoc PRESENTATION_COMITE_ENTREPRISE.md -o PRESENTATION_TAAJII_WORD.docx --toc
pandoc PRESENTATION_TAAJII_PPT.md -o PRESENTATION_TAAJII_PPT.pptx

# Alternative : Marp pour PowerPoint moderne
marp PRESENTATION_TAAJII_PPT.md -o PRESENTATION_TAAJII_MARP.pptx --theme default

# Présentation web interactive
reveal-md PRESENTATION_TAAJII_PPT.md --theme black
```

---

## 📦 Fichiers Disponibles

1. **PRESENTATION_COMITE_ENTREPRISE.md** → Document complet (Word)
   - 20+ pages
   - Tous les détails fonctionnels
   - Cas d'usage détaillés
   - Pour lecture approfondie

2. **PRESENTATION_TAAJII_PPT.md** → Synthèse (PowerPoint)
   - 24 slides
   - Points clés seulement
   - Visuels et résumés
   - Pour présentation orale

---

## 💡 Recommandations

**Pour le Comité d'Entreprise** :
1. **Envoyez en amont** : Word complet (PRESENTATION_COMITE_ENTREPRISE.md converti)
2. **Présentez en réunion** : PowerPoint synthèse (PRESENTATION_TAAJII_PPT.md converti)
3. **Laissez disponible** : Lien vers présentation web interactive (Reveal.js)

**Timing suggéré** :
- Présentation PowerPoint : 25-30 minutes
- Q&A : 15 minutes
- Démo live : 15 minutes

---

## 🆘 Dépannage

**Problème** : Emojis ne s'affichent pas dans Word
**Solution** : Installer police "Segoe UI Emoji" ou "Apple Color Emoji"

**Problème** : Tableaux mal formatés
**Solution** : Utiliser Pandoc avec option `--columns=80`

**Problème** : Slides trop chargées
**Solution** : Le fichier PPT est déjà optimisé (6 points max par slide)

**Problème** : Liens cassés
**Solution** : Vérifier que les URLs sont complètes (https://)

---

## 📞 Support

Pour questions sur la conversion :
- Documentation Pandoc : https://pandoc.org/MANUAL.html
- Documentation Marp : https://marp.app
- Documentation Reveal.js : https://revealjs.com

---

*Guide créé le 29 décembre 2025*
