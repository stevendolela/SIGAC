# 🔧 Fixes: Écran Bleu ImportFTP

## Problème Identifié

L'écran bleu lors de l'import FTP était causé par plusieurs problèmes:

### 1. ❌ Erreur: Token non validé
- **Cause**: Le token `localStorage.getItem('token')` n'était pas vérifié avant utilisation
- **Symptôme**: Appels API échouent silencieusement avec 401
- **Fix**: Ajout d'une vérification du token au démarrage du composant

```tsx
// AVANT
const token = localStorage.getItem('token');
// Utilisation directe sans vérification

// APRÈS
const token = localStorage.getItem('token');
if (!token) {
  return (
    <div className="alert alert-error">
      ❌ Vous devez être authentifié
    </div>
  );
}
```

### 2. ❌ Erreur: JSON.parse() sans gestion d'erreur
- **Cause**: `response.json()` lancait des exceptions si le body était vide
- **Symptôme**: Écran bleu non capturé
- **Fix**: Utilisation de `.catch(() => ({}))`

```tsx
// AVANT
const data = await response.json();
setError(data.message || 'Erreur');

// APRÈS
const data = await response.json().catch(() => ({}));
setError(data.message || 'Erreur');
```

### 3. ❌ Erreur: Pas de gestion de 401 (token expiré)
- **Cause**: Authentification expirée pendant l'import
- **Symptôme**: L'API refuse la requête sans message clair
- **Fix**: Détection de status 401 et message spécifique

```tsx
if (response.status === 401) {
  setError('❌ Authentification expirée - Reconnexion requise');
  return;
}
```

### 4. ❌ Erreur: Réponse API mal interpretée
- **Cause**: Test de connexion retourne `isConnected` boolean, pas toujours un message d'erreur
- **Symptôme**: Affichage incorrect du résultat
- **Fix**: Vérification de la structure de la réponse

```tsx
// AVANT
setTestConnectionResult('✅ Connexion réussie !');

// APRÈS
const data = await response.json();
setTestConnectionResult(
  data.isConnected ? `✅ ${data.message}` : `❌ ${data.message}`
);
```

---

## Fichiers Modifiés

### `/workspaces/SIGAC/sigac-frontend/src/pages/ExternalDocumentImportPage.tsx`

**Changements:**
1. Ajout de vérification du token au début du composant (ligne 48-56)
2. Amélioration `handleTestFTPConnection()` (lignes 96-132)
3. Amélioration `handleTestHTTPConnection()` (lignes 134-170)
4. Amélioration `handleStartFTPImport()` (lignes 172-213)
5. Amélioration `handleStartHTTPImport()` (lignes 215-256)

**Points clés:**
- ✅ Validation du token obligatoire avant chaque appel
- ✅ Gestion d'erreur 401 explicite
- ✅ Récupération JSON avec fallback
- ✅ Messages d'erreur détaillés

---

## Checklist de Troubleshooting

Si l'écran bleu persiste, vérifiez:

### 1. ✅ Authentification
```bash
# Assurez-vous d'être connecté
# Vérifiez localStorage dans DevTools:
# localStorage.getItem('token') → doit retourner une chaîne (eyJhbG...)
```

### 2. ✅ API Backend
```bash
# Tester directement l'endpoint
curl -X POST https://sigac-api.onrender.com/api/ExternalDocumentImport/test-ftp-connection \
  -H "Authorization: Bearer [VOTRE_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"host":"192.168.102.128","port":21,"username":"Steve","password":"","useSftp":false,"basePath":"/"}'

# Doit retourner:
# {"isConnected":true/false,"sourceType":"FTP","message":"..."}
```

### 3. ✅ Console Navigateur
Ouvrir F12 → Console et chercher:
- Erreurs TypeScript rouges
- Erreurs réseau (CORS)
- Erreurs JavaScript

### 4. ✅ Token Expiré
Si vous voyez "Authentification expirée":
- Reconnectez-vous à l'application
- Vérifiez le token JWT dans localStorage

### 5. ✅ Serveur FTP
```bash
# Vérifier que le serveur FTP est accessible
# Local:
timeout 5 bash -c '</dev/tcp/192.168.102.128/21'

# Depuis Render (production):
# Timeout = serveur pas accessible du cloud (normal pour IP privée)
```

---

## Déploiement

**Commit:** `5d7d976`  
**Branche:** `main`  
**Vercel:** Auto-redéployé  
**Backend:** Aucun changement  

**Date de fix:** 2026-01-15 15:08 UTC

---

## Tests Recommandés

### Test Local
```bash
# 1. Lancer backend local
cd sigac-backend
dotnet run --project SIGAC.API/SIGAC.API.csproj

# 2. Tester FTP import
curl -X POST http://localhost:5210/api/ExternalDocumentImport/test-ftp-connection \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### Test Production
```
1. Accédez à https://taajii.fr
2. Connectez-vous
3. Menu → 📥 Import FTP/HTTP
4. Remplissez les champs
5. Cliquez "Tester la connexion"
6. Devrait afficher: ✅ ou ❌ avec message clair
```

---

## Prochains Améliorations (Optionnel)

- [ ] Ajouter barre de progression avec WebSocket
- [ ] Implémenter pagination des résultats d'import
- [ ] Ajouter historique des imports
- [ ] Support S3/SMB (onglets supplémentaires)
- [ ] Notifications toast (react-toastify)
- [ ] Validation côté client des champs FTP
- [ ] Cache des configs précédentes

---

**Status:** ✅ Déployé et prêt à tester
