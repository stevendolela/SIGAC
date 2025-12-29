# 🔄 Guide de Migration des Rôles Utilisateurs - Frontend

## 🎯 Problème

Après la migration des rôles de juridiques vers génériques, les utilisateurs existants peuvent voir encore les anciens noms de rôles dans l'interface (ex: "Administrateur" au lieu de "Admin", "President" au lieu de "Manager").

## 🔍 Causes

1. **Cache navigateur** : Les données utilisateur sont en cache dans `localStorage`
2. **Session active** : L'utilisateur était connecté avant la migration
3. **Token JWT** : Contient les anciennes informations

## ✅ Solutions

### Solution 1 : Déconnexion/Reconnexion (Recommandé)

**Pour les utilisateurs :**

1. Cliquer sur le bouton **Déconnexion**
2. Se reconnecter avec les mêmes identifiants
3. Les nouveaux rôles seront chargés automatiquement

**Impact** : Immédiat, aucune perte de données

---

### Solution 2 : Vider le Cache Navigateur

**Pour les utilisateurs :**

#### Chrome / Edge
1. Appuyer sur `Ctrl + Shift + Delete` (Windows) ou `Cmd + Shift + Delete` (Mac)
2. Sélectionner "Cookies et autres données de sites"
3. Cliquer sur "Effacer les données"
4. Recharger la page avec `F5`

#### Firefox
1. Appuyer sur `Ctrl + Shift + Delete`
2. Sélectionner "Cookies" et "Cache"
3. Cliquer sur "Effacer maintenant"
4. Recharger avec `F5`

#### Safari
1. Menu Safari → Préférences → Avancées
2. Cocher "Afficher le menu Développement"
3. Menu Développement → Vider les caches
4. Recharger avec `Cmd + R`

---

### Solution 3 : Console Développeur (Avancé)

**Pour les développeurs :**

```javascript
// Ouvrir la console (F12)
// Exécuter cette commande pour nettoyer le cache
localStorage.removeItem('user')
localStorage.removeItem('token')
location.reload()
```

---

### Solution 4 : Migration Automatique (Intégrée)

**Déjà implémenté dans le code** :

Le fichier `App.tsx` exécute automatiquement `migrateUserDataInCache()` au démarrage :

```typescript
// src/utils/roleMigration.ts
export function migrateUserDataInCache(): void {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    const user = JSON.parse(userStr)
    if (user.role && roleMapping[user.role]) {
      user.role = roleMapping[user.role]
      localStorage.setItem('user', JSON.stringify(user))
      console.log('✅ Rôle utilisateur migré en cache:', user.role)
    }
  }
}
```

**Mapping automatique** :
- `Administrateur` → `Admin`
- `President` → `Manager`
- `JugeConstitutionnel` → `Collaborateur`
- `Greffier` → `Assistant`
- `GreffierAdjoint` → `AssistantJunior`
- `Consultant` → `Consultant`

---

## 🧪 Vérification

### Avant Migration
```json
{
  "id": "xxx",
  "username": "admin",
  "role": "Administrateur"  // ❌ Ancien
}
```

### Après Migration
```json
{
  "id": "xxx",
  "username": "admin",
  "role": "Admin"  // ✅ Nouveau
}
```

---

## 📊 Vérification pour Admin

**Vérifier dans la console du navigateur (F12) :**

```javascript
// Afficher l'utilisateur en cache
console.log(JSON.parse(localStorage.getItem('user')))

// Vérifier le rôle actuel
const user = JSON.parse(localStorage.getItem('user'))
console.log('Rôle actuel:', user.role)

// Valeurs attendues
// ✅ Admin, Manager, Collaborateur, Assistant, AssistantJunior, Consultant
// ❌ Administrateur, President, JugeConstitutionnel, Greffier, GreffierAdjoint
```

---

## 🔧 Résolution de Problèmes

### Problème : "Les anciens rôles s'affichent toujours"

**Diagnostic :**
```javascript
// Dans la console (F12)
const user = JSON.parse(localStorage.getItem('user'))
console.log('Rôle en cache:', user.role)

// Si affiche "Administrateur" ou "President" → Cache pas migré
```

**Solution :**
```javascript
// Forcer la migration manuelle
localStorage.removeItem('user')
localStorage.removeItem('token')
location.reload()
// Puis se reconnecter
```

---

### Problème : "Erreur lors de la sélection du rôle"

**Cause** : Ancien rôle non reconnu par le nouveau système

**Solution :**
1. Déconnexion complète
2. Vider le cache navigateur
3. Reconnexion

---

### Problème : "Le rôle change après reconnexion mais revient à l'ancien"

**Cause** : La base de données n'a pas été migrée

**Solution (Admin uniquement) :**

Exécuter le script SQL de migration :
```bash
psql -U sigac_user -h localhost -d sigac_db -f deployment/migration-update-user-roles.sql
```

---

## 📝 Checklist Utilisateur

- [ ] Je me suis déconnecté
- [ ] J'ai vidé le cache du navigateur
- [ ] Je me suis reconnecté
- [ ] Les nouveaux rôles s'affichent correctement
- [ ] Je peux modifier les utilisateurs sans erreur

---

## 📝 Checklist Admin

- [ ] Migration SQL exécutée (si nécessaire)
- [ ] Tous les utilisateurs informés de se déconnecter/reconnecter
- [ ] Vérification des rôles en base de données
- [ ] Tests de modification d'utilisateurs effectués
- [ ] Documentation mise à jour

---

## 🆘 Support

Si le problème persiste après toutes ces étapes :

1. **Ouvrir la console développeur** (F12)
2. **Copier les erreurs** affichées
3. **Contacter l'équipe technique** avec :
   - Nom d'utilisateur
   - Rôle actuel (depuis localStorage)
   - Capture d'écran de l'erreur
   - Console logs

---

## ✨ Avantages Post-Migration

Après la migration réussie :

- ✅ **Rôles génériques** adaptables à tous les secteurs
- ✅ **Interface unifiée** avec labels cohérents
- ✅ **Meilleure expérience utilisateur**
- ✅ **Émojis** pour identification visuelle rapide
- ✅ **Labels lisibles** ("Assistant Junior" au lieu de "AssistantJunior")

---

*Document créé le 29 décembre 2025*  
*Dernière mise à jour : 29 décembre 2025*
