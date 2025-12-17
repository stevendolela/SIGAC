# 🚀 Appliquer la Migration Base64 en Production

## ⚡ Action Immédiate Requise

La migration `AddBase64LogoAndAvatar` est prête et doit être appliquée en production.

---

## 📋 Étapes Simples

### 1️⃣ Ouvrir le Dashboard Render

1. Aller sur : https://dashboard.render.com/
2. Se connecter avec votre compte
3. Sélectionner le service **sigac-api**

---

### 2️⃣ Ouvrir le Shell

1. Dans le menu du service, cliquer sur **"Shell"** (icône terminal)
2. Attendre que le shell s'ouvre (~10 secondes)

---

### 3️⃣ Appliquer la Migration

**Option A : Commande Rapide** (copier-coller une ligne)

```bash
cd /app && dotnet ef database update --no-build --startup-project SIGAC.API
```

**Option B : Avec Vérification** (plus sûr)

```bash
# 1. Aller dans le dossier app
cd /app

# 2. Lister les migrations en attente
dotnet ef migrations list --startup-project SIGAC.API

# 3. Appliquer la migration
dotnet ef database update --no-build --startup-project SIGAC.API
```

---

### 4️⃣ Vérifier le Résultat

Vous devriez voir dans les logs :

```
[INF] Applying migration '20251217133725_AddBase64LogoAndAvatar'.
[INF] Executed DbCommand: ALTER TABLE "Workspaces" ADD "LogoBase64" text;
[INF] Executed DbCommand: ALTER TABLE "Users" ADD "AvatarBase64" text;
Done.
```

---

## ✅ Confirmation

Une fois terminé, vérifiez que l'API fonctionne :

```bash
curl https://sigac-api.onrender.com/api/health
```

Résultat attendu :
```json
{
  "status": "Healthy",
  "services": {
    "database": "Connected"
  }
}
```

---

## 🎯 Que Fait Cette Migration ?

- **Ajoute** la colonne `LogoBase64` à la table `Workspaces`
- **Ajoute** la colonne `AvatarBase64` à la table `Users`
- **Permet** le stockage de logos/avatars en base64 directement en BDD
- **Résout** les problèmes de chargement cross-browser

---

## 📱 Après la Migration

Une fois appliquée, vous pourrez :

1. **Uploader des logos** au format base64 via l'API
2. **Les afficher** sans problème CORS ou de chargement
3. **Tester** avec :

```bash
# Test avec un workspace
curl -X PUT https://sigac-api.onrender.com/api/workspaces/{id} \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Mon Workspace",
    "logoBase64": "data:image/png;base64,iVBORw0KGgo..."
  }'
```

---

## ⚠️ Important

- ✅ La migration est **réversible** (safe)
- ✅ Elle **n'affecte pas** les données existantes
- ✅ Les anciennes colonnes `LogoUrl` et `AvatarUrl` restent intactes
- ✅ Temps d'exécution : **< 5 secondes**

---

## 🆘 En Cas de Problème

Si la migration échoue :

1. Vérifier que le service Render est bien démarré
2. Vérifier la connexion à PostgreSQL
3. Consulter les logs du service
4. Contacter le support si nécessaire

**Logs disponibles** : Dashboard Render → Onglet "Logs"

---

## 📚 Documentation Complète

Voir le fichier **LOGO_BASE64_GUIDE.md** pour :
- Utilisation frontend (conversion fichier → base64)
- Exemples de code TypeScript/React
- Validation et bonnes pratiques
- Tests et debugging

---

✨ **Prêt à appliquer ? Rendez-vous sur le Shell Render !**
