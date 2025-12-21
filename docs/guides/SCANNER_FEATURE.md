# 📸 Scanner de Documents - Guide d'Utilisation

## Vue d'ensemble

La page **Documents** inclut désormais une fonctionnalité complète de scanner qui permet aux utilisateurs de capturer des documents directement via leur webcam ou scanner physique connecté.

## Caractéristiques

### ✅ Capture de Documents
- **Caméra/Scanner USB** : Accès direct au matériel via l'API `getUserMedia`
- **Préview en temps réel** : Flux vidéo live avant capture
- **Snapshot instantané** : Capture en haute résolution via canvas
- **Formats supportés** : PNG, JPEG (stockés en tant qu'images)

### ✅ Flux Utilisateur
1. **Sélectionner un dossier** dans le dropdown
2. **Cliquer sur le bouton 📸 Scanner**
3. **Démarrer le scanner** (accès caméra demandé)
4. **Positionner le document** devant la caméra
5. **Capturer** en cliquant ✅ Capturer
6. **Prévisualiser** le document scanné
7. **Upload** ou **Nouvelle Capture**

### ✅ Interface Utilisateur

#### État 1 : Initial
```
📷 Scanner un Document
[Prompt pour démarrer]
[📸 Démarrer Scanner]
```

#### État 2 : Live Preview
```
📷 Scanner un Document
[Flux vidéo en direct]
[✅ Capturer] [❌ Annuler]
```

#### État 3 : Review & Upload
```
📷 Scanner un Document
[Image capturée]
[📤 Upload] [📸 Nouvelle Capture] [❌ Fermer]
```

## Architecture Technique

### Frontend Implementation (React/TypeScript)

#### États & Refs
```typescript
const [showScannerModal, setShowScannerModal] = useState(false)
const [scannerActive, setScannerActive] = useState(false)
const [cameraPreview, setCameraPreview] = useState<string | null>(null)
const videoRef = useRef<HTMLVideoElement>(null)
const canvasRef = useRef<HTMLCanvasElement>(null)
const streamRef = useRef<MediaStream | null>(null)
```

#### Fonctions Clés

**1. `startScanner()`**
- Accède à `navigator.mediaDevices.getUserMedia()`
- Configure `facingMode: 'environment'` (caméra arrière)
- Stocke le stream pour cleanup
- Affiche le flux vidéo dans `<video>`

**2. `captureSnapshot()`**
- Utilise canvas 2D context
- Dessine la frame vidéo actuelle
- Convertit en dataURL (PNG)
- Stocke en `cameraPreview`

**3. `uploadScannedDocument()`**
- Convertit dataURL en Blob
- Crée un File object (`scan_timestamp.png`)
- Appelle `documentApi.upload()`
- Refresh la liste des documents

**4. `stopScanner()`**
- Arrête tous les tracks du stream
- Libère les ressources médias
- Réinitialise l'état

#### Cleanup
```typescript
useEffect(() => {
  return () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
  }
}, [])
```

### Compatibilité

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| getUserMedia | ✅ 47+ | ✅ 36+ | ✅ 11+ | ✅ 12+ |
| Canvas toDataURL | ✅ | ✅ | ✅ | ✅ |
| Blob API | ✅ | ✅ | ✅ | ✅ |

### Sécurité & Permissions

- **Permission Request** : Navigateur demande accès caméra explicitement
- **HTTPS Required** : getUserMedia en HTTPS uniquement (sauf localhost)
- **Single Use** : Stream arrêté après fermeture du modal
- **No Data Leak** : Images seulement en mémoire jusqu'à upload

## Flux d'Erreur

### Erreurs Possibles

**1. Caméra non accessible**
```
Toast Error: "❌ Impossible d'accéder à la caméra/scanner"
Causes:
- Permission refusée par utilisateur
- Pas de caméra détectée
- HTTPS requis (sur production)
```

**2. Upload échoué**
```
Toast Error: "Erreur upload du scan"
Causes:
- Dossier invalide/supprimé
- Quota de fichiers atteint
- Connexion réseau perdue
```

### Utilisateur a refusé l'accès caméra
Le bouton 📸 Scanner reste disponible et réessayable.

## Performance

### Optimisations
- **Canvas size = video resolution** : Pas de redimensionnement
- **PNG compression** : Taille fichier optimisée
- **Stream cleanup** : Pas de fuite mémoire
- **Lazy loading** : getUserMedia uniquement si utilisateur clique

### Benchmarks Typiques
- **Démarrage caméra** : 500-1500ms
- **Capture snapshot** : <50ms
- **Upload (5MB)** : Dépend de la connexion

## Cas d'Usage

### 1. Courrier Physique
```
Scanner → Caméra → Document GED
Workflow:
- Dépôt de courrier physique
- Scanner rapidement avec téléphone/webcam
- Attacher au dossier
```

### 2. Justificatifs
```
Pièce d'identité → Scan → Upload → Dossier
Workflow:
- Demande de justificatif
- Utilisateur scan via webcam
- Télécharger directement
```

### 3. Signatures
```
Document → Imprimer → Signer → Scanner → GED
Workflow:
- Générer document PDF
- Imprimer et signer
- Scanner la version signée
- Uploader au dossier
```

## Limitations Connues

### 1. Résolution
- Dépend du matériel (webcam = basse résolution)
- Scanner physique = haute résolution
- PNG stocke pixels actuels (pas de compression lossy)

### 2. Compression
- PNG non compressé = fichier plus gros que JPEG
- Future: option JPEG pour économiser storage

### 3. Angle de Capture
- Utilisateur responsable du positionnement
- Pas de correction automatique de perspective

### 4. Éclairage
- Qualité dépend de l'éclairage ambiant
- Aucune amélioration automatique

## Configuration Recommandée

### Backend (DocumentService)
```csharp
// MaxFileSize: 50MB (configurable)
private const long MAX_FILE_SIZE = 52428800;

// MIME types autorisés incluent image/png
private readonly string[] ALLOWED_MIME_TYPES = new[] {
  "image/png",
  "image/jpeg",
  // ...
};
```

### Frontend (DocumentsPage)
```typescript
// Conversion automatique PNG
canvasRef.current.toDataURL('image/png')

// Format de filename
`scan_${Date.now()}.png`

// Type de document
typeDocument: 'Scan'
```

## Dépannage

### La caméra ne démarre pas
1. ✅ Vérifier les permissions (navigateur)
2. ✅ Activer HTTPS (production)
3. ✅ Essayer un autre navigateur
4. ✅ Redémarrer le navigateur

### L'image est floue
1. ✅ Nettoyer la lentille
2. ✅ Améliorer l'éclairage
3. ✅ Approcher/éloigner le document
4. ✅ Utiliser un scanner physique

### Fichier trop gros
1. ✅ Réduire la taille (crop)
2. ✅ Utiliser JPEG au lieu de PNG (future)
3. ✅ Scanner à résolution plus basse

## Versions Futures

### v2.0
- [ ] Support JPEG avec qualité configurable
- [ ] Crop automatique du document
- [ ] Redressement de perspective (OCR-like)
- [ ] Filtre de luminosité/contraste

### v3.0
- [ ] Batch scanning (plusieurs pages)
- [ ] PDF multi-page depuis scans
- [ ] OCR + reconnaissance texte
- [ ] Import depuis galerie (mobile)

## Support

Pour les problèmes :
1. Vérifier la console (F12 > Console)
2. Contrôler les logs backend (Render)
3. Tester avec un scanner physique
4. Ouvrir une issue GitHub

---

**Dernière mise à jour** : 7 décembre 2025
**Commit** : 8d72308
