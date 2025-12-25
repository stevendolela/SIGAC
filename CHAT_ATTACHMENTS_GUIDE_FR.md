# Guide des Pièces Jointes - Chat SIGAC

## 🎉 Nouvelles Fonctionnalités Déployées

### ✅ Problèmes Résolus

1. **Visualisation des images** : Les images s'affichent maintenant correctement avec authentification
2. **Suppression de pièces jointes** : Possibilité de supprimer n'importe quelle pièce jointe
3. **Prévisualisation complète** : Modal fullscreen pour tous les types de fichiers

---

## 📎 Fonctionnalités des Pièces Jointes

### 1. Types de Fichiers Supportés

Le chat supporte maintenant l'affichage et la prévisualisation de tous types de fichiers :

#### Images (🖼️)
- PNG, JPG, JPEG, GIF, BMP, WEBP
- Affichage direct dans le chat (max 300px de largeur)
- Clic pour agrandir en modal fullscreen

#### Documents PDF (📕)
- Prévisualisation dans iframe
- Téléchargement direct

#### Documents Office
- **Word** (📘) : DOCX, DOC
- **Excel** (📊) : XLSX, XLS
- **PowerPoint** (📙) : PPTX, PPT

#### Médias
- **Audio** (🎵) : MP3, WAV, OGG, M4A (lecteur intégré)
- **Vidéo** (🎬) : MP4, WEBM, AVI, MOV (lecteur intégré)

#### Autres
- **Archives** (🗜️) : ZIP, RAR, 7Z, TAR, GZ
- **Code** (💻) : JS, TS, PY, JAVA, CS, HTML, CSS, JSON, XML
- **Texte** (📝) : TXT, MD, LOG, CSV

### 2. Composant ImageWithAuth

**Nouveau composant** pour l'affichage sécurisé des images :

```typescript
const ImageWithAuth: React.FC<{
  attachmentId: string;
  fileName: string;
  onImageClick: () => void;
  onDownload: () => void;
  onDelete: () => void;
  getFileIcon: (fileName: string, mimeType: string) => string;
  mimeType: string;
}>
```

**Fonctionnement** :
- Télécharge l'image via API (avec token JWT automatique)
- Convertit le blob en URL objet local
- Affiche l'image sans besoin d'authentification
- Nettoie automatiquement les URLs au démontage

**Avantages** :
- ✅ Fonctionne avec les endpoints protégés
- ✅ Pas de 401/403 sur les images
- ✅ Pas de fuite de mémoire (cleanup automatique)

### 3. Actions sur les Pièces Jointes

#### A. Téléchargement (⬇️)
- Bouton bleu sur chaque fichier
- Télécharge via blob API (préserve le nom original)
- Fonctionne pour tous les types de fichiers

**Code** :
```typescript
const handleDownloadAttachment = async (attachmentId: string, fileName: string) => {
  const blob = await chatAttachmentApi.downloadAttachment(attachmentId);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};
```

#### B. Suppression (🗑️)
- Bouton rouge sur chaque fichier
- Confirmation avant suppression
- Rafraîchit automatiquement la conversation/groupe
- Ferme le modal si le fichier affiché est supprimé

**Code** :
```typescript
const handleDeleteAttachment = async (attachmentId: string) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette pièce jointe ?')) return;
  
  await chatAttachmentApi.deleteAttachment(attachmentId);
  
  // Refresh
  if (selectedChat.type === 'conversation') {
    await fetchConversationMessages(selectedChat.id);
  } else {
    await fetchGroupMessages(selectedChat.id);
  }
  
  // Ferme modal si fichier actif
  if (filePreviewModal.attachment?.id === attachmentId) {
    closeFilePreview();
  }
};
```

#### C. Prévisualisation (👁️)
- Clic sur l'image ou le fichier
- Modal fullscreen (90vw × 90vh)
- Affichage selon le type :
  - **Image** : Affichage complet avec zoom
  - **PDF** : iframe avec scroll
  - **Audio** : Lecteur HTML5 avec contrôles
  - **Vidéo** : Lecteur HTML5 avec contrôles
  - **Autres** : Message + bouton télécharger

**Header du Modal** :
- 📄 Icône + Nom du fichier + Taille
- ⬇️ Bouton télécharger (bleu)
- 🗑️ Bouton supprimer (orange)
- ✕ Bouton fermer (rouge)

### 4. Modal de Prévisualisation

**Structure** :
```tsx
{filePreviewModal.isOpen && filePreviewModal.attachment && (
  <div style={{ /* backdrop */ }} onClick={closeFilePreview}>
    <div onClick={(e) => e.stopPropagation()}>
      {/* Header avec actions */}
      <div>
        <div> {/* Infos fichier */} </div>
        <div> {/* Boutons actions */} </div>
      </div>
      
      {/* Content selon type */}
      <div>
        {filePreviewModal.attachment.fileType === 'Image' ? (
          <img src={filePreviewModal.blobUrl || ''} />
        ) : filePreviewModal.attachment.mimeType === 'application/pdf' ? (
          <iframe src={filePreviewModal.blobUrl || ''} />
        ) : ...}
      </div>
    </div>
  </div>
)}
```

**Gestion Blob** :
```typescript
const openFilePreview = async (attachment: any) => {
  const blob = await chatAttachmentApi.downloadAttachment(attachment.id);
  const blobUrl = URL.createObjectURL(blob);
  setFilePreviewModal({ isOpen: true, attachment, blobUrl });
};

const closeFilePreview = () => {
  if (filePreviewModal.blobUrl) {
    URL.revokeObjectURL(filePreviewModal.blobUrl);
  }
  setFilePreviewModal({ isOpen: false, attachment: null, blobUrl: null });
};
```

---

## 🔧 API Backend

### Endpoints Utilisés

#### 1. Télécharger Pièce Jointe
```
GET /api/chat/attachments/{id}/download
Authorization: Bearer {token}
Response: Blob (application/octet-stream)
```

#### 2. Supprimer Pièce Jointe
```
DELETE /api/chat/attachments/{id}
Authorization: Bearer {token}
Response: 200 OK ou 404 Not Found
```

#### 3. URL de Téléchargement (non utilisé pour display)
```
GET /api/chat/attachments/{id}/url
Authorization: Bearer {token}
Response: { downloadUrl: string }
```
**Note** : Cette méthode ne fonctionne PAS pour afficher des images car l'URL retournée nécessite aussi l'authentification. Utiliser `downloadAttachment()` à la place.

### Fichier API Client

**chatAttachmentApi.ts** :
```typescript
export const chatAttachmentApi = {
  // Télécharge le blob avec auth
  downloadAttachment: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(
      `/chat/attachments/${id}/download`,
      { responseType: 'blob' }
    );
    return response.data;
  },

  // Supprime l'attachement
  deleteAttachment: async (id: string): Promise<void> => {
    await apiClient.delete(`/chat/attachments/${id}`);
  },

  // Retourne juste l'URL (ne pas utiliser pour images)
  getDownloadUrl: (id: string): string => {
    return `${API_BASE_URL}/chat/attachments/${id}/download`;
  }
};
```

---

## 🎨 Styles et UX

### Images dans le Chat

```typescript
<ImageWithAuth 
  attachmentId={attachment.id}
  fileName={attachment.fileName}
  onImageClick={() => openFilePreview(attachment)}
  onDownload={() => handleDownloadAttachment(attachment.id, attachment.fileName)}
  onDelete={() => handleDeleteAttachment(attachment.id)}
  getFileIcon={getFileIcon}
  mimeType={attachment.mimeType}
/>
```

**Design** :
- Max-width: 300px
- Border-radius: 12px
- Box-shadow: 0 2px 8px rgba(0,0,0,0.1)
- Footer avec icône + nom + boutons

### Documents dans le Chat

```tsx
<div style={{
  padding: '12px 16px',
  background: '#fff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  ...
}}>
  {/* Icône + Infos */}
  <div>
    <div style={{ fontSize: '32px' }}>{getFileIcon(...)}</div>
    <div>
      <div style={{ fontWeight: '600' }}>{fileName}</div>
      <div style={{ fontSize: '12px', color: '#6b7280' }}>
        {(fileSize / 1024).toFixed(0)} KB
      </div>
    </div>
  </div>
  
  {/* Actions */}
  <div style={{ display: 'flex', gap: '8px' }}>
    <button onClick={() => handleDownloadAttachment(...)}>⬇️</button>
    <button onClick={() => handleDeleteAttachment(...)}>🗑️</button>
  </div>
</div>
```

### Couleurs des Boutons

- **Télécharger** : `#3b82f6` (bleu)
- **Supprimer** : `#ef4444` (rouge) ou `#f59e0b` (orange en modal)
- **Fermer** : `#ef4444` (rouge)

---

## 🐛 Corrections de Bugs

### Bug 1 : Images ne s'affichent pas (RÉSOLU ✅)
**Problème** : Les URLs directes nécessitent authentification
**Solution** : Utiliser `ImageWithAuth` qui charge via blob API

### Bug 2 : Téléchargement transformé en HTML (RÉSOLU ✅)
**Problème** : Liens directs téléchargeaient la page HTML
**Solution** : Utiliser `chatAttachmentApi.downloadAttachment()` avec blob

### Bug 3 : Erreur syntaxe ligne 1744 (RÉSOLU ✅)
**Problème** : `Expected "}" but found "onClick"`
**Cause** : Guillemet simple `>` au lieu de guillemets doubles `}>`
**Solution** : Remplacé `gap: '8px' }>` par `gap: '8px' }}>`

---

## 📊 Tests Recommandés

### Test 1 : Upload et Visualisation
1. Envoyer un message avec image
2. Vérifier affichage direct (thumbnail 300px)
3. Cliquer pour ouvrir modal
4. Vérifier image fullscreen dans modal

### Test 2 : Téléchargement
1. Cliquer sur bouton ⬇️ (image ou document)
2. Vérifier téléchargement avec nom correct
3. Ouvrir fichier téléchargé
4. Vérifier intégrité (même fichier qu'uploadé)

### Test 3 : Suppression
1. Cliquer sur bouton 🗑️
2. Confirmer dans alert
3. Vérifier disparition de la liste
4. Rafraîchir page : fichier toujours absent
5. Si modal ouvert : vérifier fermeture automatique

### Test 4 : Types de Fichiers
- **PDF** : Vérifier iframe dans modal
- **Audio** : Vérifier lecteur fonctionne
- **Vidéo** : Vérifier lecteur fonctionne
- **Documents Office** : Vérifier icône + téléchargement
- **Archives** : Vérifier icône + téléchargement

### Test 5 : Authentification
1. Se déconnecter
2. Tenter d'accéder à un lien direct d'image
3. Vérifier 401/403
4. Se reconnecter
5. Vérifier images affichées correctement

---

## 🚀 Déploiement

### Frontend (Vercel)
```bash
git add -A
git commit -m "fix: Correction erreur syntaxe modal + ajout suppression pièces jointes + authentification images"
git push origin main
```
**URL** : https://taajii.fr

### Backend (Render)
Pas de changement nécessaire - endpoints déjà en place.
**URL** : https://sigac-api.onrender.com

---

## 📝 Changelog

### Version 1.4.0 (Aujourd'hui)

#### Ajouté ✨
- Composant `ImageWithAuth` pour affichage sécurisé des images
- Fonction `handleDeleteAttachment()` avec confirmation
- Boutons suppression (🗑️) sur tous les types de fichiers
- Bouton suppression dans le modal de prévisualisation
- État `imageBlobUrls` pour cache des blobs
- Fonction `loadImageBlob()` pour chargement asynchrone
- Gestion `blobUrl` dans `filePreviewModal`

#### Modifié 🔄
- `openFilePreview()` : Charge blob avant d'ouvrir modal
- `closeFilePreview()` : Révoque blob URL pour éviter fuites mémoire
- Modal : Utilise `filePreviewModal.blobUrl` au lieu de `getDownloadUrl()`
- Affichage images : Remplacé inline JSX par `<ImageWithAuth />`

#### Corrigé 🐛
- Images ne s'affichent pas (401/403) → Utilisation de blobs authentifiés
- Téléchargement transformé en HTML → Utilisation blob API
- Erreur syntaxe ligne 1744 → Correction guillemets `gap: '8px' }}>`

---

## 🔍 Debugging

### Logs Console

```typescript
// Dans ImageWithAuth
console.log('[ImageWithAuth] Chargement image:', attachmentId);
console.log('[ImageWithAuth] Blob reçu:', blob);
console.log('[ImageWithAuth] URL créée:', url);

// Dans openFilePreview
console.log('[Preview] Ouverture modal:', attachment.fileName);
console.log('[Preview] Blob URL:', blobUrl);

// Dans handleDeleteAttachment
console.log('[Delete] Suppression:', attachmentId);
```

### Erreurs Courantes

#### "Cannot read property 'blobUrl' of null"
**Cause** : `filePreviewModal.attachment` est null
**Solution** : Vérifier condition `filePreviewModal.isOpen && filePreviewModal.attachment`

#### "Failed to load image"
**Cause** : Blob non chargé ou URL révoquée
**Solution** : Vérifier `await chatAttachmentApi.downloadAttachment()` réussit

#### "Object URL not released"
**Cause** : Fuite mémoire, `revokeObjectURL()` non appelé
**Solution** : Toujours appeler dans cleanup (`useEffect` return ou `closeFilePreview`)

---

## 📚 Ressources

- [MDN - URL.createObjectURL()](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL)
- [MDN - Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob)
- [React Hooks - useEffect cleanup](https://react.dev/reference/react/useEffect#cleanup)
- [Axios - Response Type](https://axios-http.com/docs/req_config)

---

**Dernière mise à jour** : ${new Date().toISOString().split('T')[0]}  
**Statut** : ✅ Déployé en production
