# 📸 Stockage des Logos en Base64

**Problème résolu**: Erreurs de chargement des logos selon les navigateurs (CORS, chemins, etc.)

**Solution**: Stocker les logos directement en base64 dans la base de données

---

## ✅ Modifications Apportées

### Backend - Entities

**Workspace.cs** :
```csharp
// Ancien (deprecated)
public string? LogoUrl { get; set; }

// Nouveau
public string? LogoBase64 { get; set; }
// Format: "data:image/png;base64,iVBORw0KGgoAAAA..."
```

**User.cs** :
```csharp
// Ancien (deprecated)
public string? AvatarUrl { get; set; }

// Nouveau
public string? AvatarBase64 { get; set; }
```

### Backend - DTOs

**WorkspaceDto** et **UpdateWorkspaceDto** :
- Ajout du champ `LogoBase64`
- Validation regex pour format data URI
- Ancien champ `LogoUrl` marqué obsolete

**UserDto** :
- Ajout du champ `AvatarBase64`

---

## 🔄 Migration Database Requise

**IMPORTANT**: Il faut créer et appliquer une migration !

### Sur ton Mac (Développement)

```bash
cd /Users/steve/Projects/SIGAC/sigac-backend/SIGAC.Infrastructure

dotnet ef migrations add AddBase64LogoAndAvatar --startup-project ../SIGAC.API

dotnet ef database update --startup-project ../SIGAC.API
```

### En Production (Render)

Une fois le backend redéployé :

1. **Render Dashboard** → Service backend → **Shell**
2. Exécuter :
```bash
cd /app
dotnet ef database update --no-build
```

---

## 💻 Utilisation Frontend

### Comment convertir une image en base64

```typescript
// Fonction helper pour convertir File en base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Utilisation dans un formulaire
const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;
  
  // Vérifier le type
  if (!file.type.startsWith('image/')) {
    alert('Fichier doit être une image');
    return;
  }
  
  // Vérifier la taille (max 500KB recommandé)
  if (file.size > 500 * 1024) {
    alert('Image trop grande (max 500KB)');
    return;
  }
  
  // Convertir en base64
  const base64 = await fileToBase64(file);
  
  // Envoyer à l'API
  await workspaceApi.update(workspaceId, {
    logoBase64: base64
  });
};
```

### Afficher le logo

```tsx
// Depuis la BDD (WorkspaceDto.logoBase64)
<img 
  src={workspace.logoBase64 || '/default-logo.png'} 
  alt={workspace.name}
/>

// Le logoBase64 contient déjà le data URI complet:
// "data:image/png;base64,iVBORw0KGgoAAAA..."
```

---

## 🎨 Avantages de cette Approche

### ✅ Avantages

1. **Pas de CORS** : Image dans le HTML direct
2. **Pas de chemins relatifs** : Fonctionne partout
3. **Pas de serveur de fichiers** : Tout dans la BDD
4. **Offline-friendly** : Image disponible même hors ligne
5. **Atomicité** : Logo et metadata en une transaction
6. **Portable** : Export/import de workspace avec logo

### ⚠️ Inconvénients

1. **Taille BDD** : Base64 = +33% vs fichier binaire
2. **Limite taille** : Recommandé max 500KB par image
3. **Performance** : Payload API plus lourd

### 💡 Bonnes Pratiques

1. **Compresser les images** avant upload (PNG → JPEG, réduire dimensions)
2. **Limiter la taille** : 200x200px suffit pour un logo
3. **Valider côté frontend** avant envoi
4. **Fallback** : Toujours avoir un logo par défaut

---

## 🧪 Tests

### Test API avec curl

```bash
# Créer un workspace avec logo base64
curl -X POST https://sigac-api.onrender.com/api/workspaces \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Logo",
    "slug": "test-logo",
    "logoBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }'
```

### Exemple image 1x1 transparent

```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==
```

---

## 📋 Checklist Migration

### Backend
- [x] Entities modifiées (Workspace, User)
- [x] DTOs modifiées
- [x] Commit et push
- [ ] Migration EF Core créée
- [ ] Migration appliquée localement
- [ ] Migration appliquée en production

### Frontend
- [ ] Fonction fileToBase64 créée
- [ ] Upload logo mis à jour (envoyer base64)
- [ ] Affichage logo mis à jour (utiliser logoBase64)
- [ ] Validation taille fichier (max 500KB)
- [ ] Feedback utilisateur (loading, erreurs)

### Production
- [ ] Backend redéployé
- [ ] Migration appliquée (Render Shell)
- [ ] Test création workspace avec logo
- [ ] Test affichage logos existants
- [ ] Vérifier tous navigateurs (Chrome, Firefox, Safari)

---

## 🚀 Prochaines Étapes

1. **Créer la migration** (sur ton Mac) :
   ```bash
   cd sigac-backend/SIGAC.Infrastructure
   dotnet ef migrations add AddBase64LogoAndAvatar --startup-project ../SIGAC.API
   ```

2. **Appliquer localement** :
   ```bash
   dotnet ef database update --startup-project ../SIGAC.API
   ```

3. **Commit la migration** :
   ```bash
   git add -A
   git commit -m "migration: Add Base64 logo and avatar columns"
   git push origin main
   ```

4. **Attendre redéploiement** (~15 min)

5. **Appliquer en production** (Render Shell) :
   ```bash
   cd /app
   dotnet ef database update --no-build
   ```

6. **Tester** !

---

**Auteur**: GitHub Copilot + stevendolela  
**Date**: 17 décembre 2024  
**Status**: Entities + DTOs modifiés, migration en attente
