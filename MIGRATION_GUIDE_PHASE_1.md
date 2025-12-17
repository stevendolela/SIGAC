# 🔧 Guide de Migration - Phase 1 Sécurité

## ⚠️ PROBLÈME: Application Frontend Ne Peut Plus Se Connecter

### Cause
Après l'implémentation de la Phase 1 (JWT avec environment variables), si le backend est démarré avec une **nouvelle clé JWT_SECRET_KEY**, tous les tokens JWT existants deviennent invalides.

### Symptômes
- Frontend affiche des erreurs 401 Unauthorized
- Logs backend: `IDX10517: Signature validation failed. The token's kid is missing`
- Impossible de se connecter même avec les bons identifiants (si token en cache)

---

## ✅ SOLUTIONS

### Solution 1: Utiliser la Clé JWT Originale (TEMPORAIRE)

Pour permettre aux utilisateurs déjà connectés de continuer à utiliser l'application:

```bash
# 1. Arrêter le backend actuel
pkill -f "dotnet"

# 2. Démarrer SANS variable d'environnement (utilise appsettings.json)
cd sigac-backend/SIGAC.API
dotnet run
```

✅ **Résultat**: Les tokens JWT existants fonctionneront à nouveau.

⚠️ **Inconvénient**: La clé JWT reste hardcodée dans `appsettings.json` (moins sécurisé).

---

### Solution 2: Forcer la Reconnexion (RECOMMANDÉ POUR PRODUCTION)

Pour bénéficier pleinement de la sécurité:

**Backend:**
```bash
# 1. Définir une nouvelle clé JWT sécurisée (à conserver!)
export JWT_SECRET_KEY=$(openssl rand -base64 64)

# 2. Sauvegarder cette clé dans un fichier sécurisé
echo "JWT_SECRET_KEY=$JWT_SECRET_KEY" >> ~/.sigac_env
chmod 600 ~/.sigac_env

# 3. Démarrer le backend
cd sigac-backend/SIGAC.API
source ~/.sigac_env
dotnet run
```

**Frontend:**
```javascript
// Dans le code frontend, ajouter un gestionnaire d'erreur 401
// qui efface le localStorage et redirige vers login

// Exemple: src/api/client.ts ou axiosConfig.ts
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Effacer les tokens invalides
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Rediriger vers login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**Communication aux utilisateurs:**
```
📢 IMPORTANT: Après la mise à jour sécurité, 
tous les utilisateurs doivent se reconnecter.

Vos identifiants restent les mêmes:
- Admin: admin / Admin@2024!
- Président: president.benoit / President@2024!
- Juge: juge.mbala / Juge@2024!
```

---

### Solution 3: Migration Progressive (PRODUCTION EN COURS)

Pour une transition sans interruption de service:

**Étape 1: Double validation** (supporter ancienne + nouvelle clé pendant 24h)

```csharp
// Program.cs - Configuration JWT temporaire
.AddJwtBearer(options =>
{
    // Essayer nouvelle clé d'abord
    var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") 
        ?? builder.Configuration["Jwt:SecretKey"];
    
    // Si échec, essayer l'ancienne clé (fallback)
    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            // Log pour debug
            Console.WriteLine($"JWT Validation failed: {context.Exception.Message}");
            
            // Permettre la requête de continuer si ancienne clé?
            // (code plus complexe, non montré ici)
            
            return Task.CompletedTask;
        }
    };
    
    // ... reste de la config
});
```

**Étape 2: Notification utilisateurs** (email, bannière dans l'app)

**Étape 3: Après 24h, retirer l'ancienne clé**

---

## 📋 Checklist de Déploiement Sécurisé

### Avant le Déploiement

- [ ] **Backup de la base de données**
  ```bash
  pg_dump sigac_db > backup_avant_securite.sql
  ```

- [ ] **Générer la clé JWT production**
  ```bash
  openssl rand -base64 64 > jwt_secret_prod.txt
  chmod 600 jwt_secret_prod.txt
  ```

- [ ] **Créer .env production**
  ```bash
  cp .env.example .env.production
  nano .env.production  # Copier le contenu de jwt_secret_prod.txt
  ```

- [ ] **Tester en local**
  ```bash
  export ASPNETCORE_ENVIRONMENT=Production
  source .env.production
  dotnet run
  # Vérifier que tout fonctionne
  ```

- [ ] **Préparer script de rollback**
  ```bash
  # rollback.sh
  git checkout HEAD~1 sigac-backend/SIGAC.API/Program.cs
  dotnet build
  dotnet run
  ```

### Pendant le Déploiement (Production)

- [ ] **Mode maintenance**
  ```html
  <!-- Afficher dans le frontend -->
  <div class="maintenance-banner">
    ⚠️ Maintenance en cours (5 min)
    Mise à jour sécurité - Reconnexion requise
  </div>
  ```

- [ ] **Arrêter l'ancien backend**
  ```bash
  systemctl stop sigac-api
  ```

- [ ] **Déployer le nouveau code**
  ```bash
  git pull origin main
  dotnet publish -c Release
  ```

- [ ] **Configurer les variables d'environnement**
  ```bash
  # Sur le serveur
  sudo nano /etc/systemd/system/sigac-api.service
  
  # Ajouter:
  Environment="JWT_SECRET_KEY=<votre_clé_prod>"
  Environment="ASPNETCORE_ENVIRONMENT=Production"
  ```

- [ ] **Redémarrer le service**
  ```bash
  systemctl daemon-reload
  systemctl start sigac-api
  systemctl status sigac-api
  ```

- [ ] **Vérifier les logs**
  ```bash
  journalctl -u sigac-api -f
  # Vérifier: "SIGAC API démarrée sur Production"
  ```

- [ ] **Tester la connexion**
  ```bash
  curl -X POST https://api.courconstitutionnelle.cd/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"Admin@2024!"}'
  
  # Doit retourner un nouveau token
  ```

### Après le Déploiement

- [ ] **Notifier les utilisateurs**
  - Email: "Mise à jour sécurité - Reconnexion requise"
  - Bannière dans l'app: "Veuillez vous reconnecter"

- [ ] **Monitorer pendant 1h**
  ```bash
  # Logs en temps réel
  tail -f /var/log/sigac/sigac-*.log
  
  # Métriques
  curl http://localhost:5210/api/health
  ```

- [ ] **Vérifier les AuditLogs**
  ```sql
  SELECT Action, COUNT(*) 
  FROM "AuditLogs" 
  WHERE "Timestamp" > NOW() - INTERVAL '1 hour'
  GROUP BY Action;
  
  -- Doit voir des LOGIN_SUCCESS après migration
  ```

- [ ] **Backup post-migration**
  ```bash
  pg_dump sigac_db > backup_apres_securite.sql
  ```

---

## 🚨 Rollback (Si Problème)

Si des problèmes surviennent après le déploiement:

### Rollback Rapide (< 5 min)

```bash
# 1. Arrêter le nouveau backend
systemctl stop sigac-api

# 2. Restaurer l'ancienne version
cd /opt/sigac-backend
git checkout HEAD~1
dotnet publish -c Release

# 3. Redémarrer avec l'ancienne config
systemctl start sigac-api

# 4. Vérifier
curl http://localhost:5210/api/health
```

### Rollback Complet (Si DB modifiée)

```bash
# 1. Arrêter le backend
systemctl stop sigac-api

# 2. Restaurer la base de données
psql sigac_db < backup_avant_securite.sql

# 3. Restaurer le code
git checkout HEAD~1
dotnet publish -c Release

# 4. Redémarrer
systemctl start sigac-api
```

---

## 📊 Post-Migration: Vérifications

### Test 1: Login Fonctionne
```bash
curl -X POST http://localhost:5210/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@2024!"}'

# ✅ Doit retourner un token valide
```

### Test 2: Token Valide
```bash
TOKEN="<token_recu>"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5210/api/health

# ✅ Doit retourner 200 OK
```

### Test 3: Rate Limiting Actif
```bash
for i in {1..7}; do
  curl -X POST http://localhost:5210/api/auth/login \
    -d '{"username":"test","password":"test"}'
done

# ✅ Tentative 6: Doit retourner 429 Too Many Requests
```

### Test 4: Validation Active
```bash
curl -X POST http://localhost:5210/api/auth/register \
  -d '{"password":"weak",...}'

# ✅ Doit retourner 400 avec erreurs de validation
```

---

## 💡 Recommandations

### Développement Local
- **NE PAS** utiliser `JWT_SECRET_KEY` en environnement
- Utiliser la clé de `appsettings.json` (pas de reconnexion forcée)

### Staging/Pré-production
- Générer une clé JWT dédiée
- Tester le processus complet de migration
- Simuler la reconnexion des utilisateurs

### Production
- **TOUJOURS** utiliser `JWT_SECRET_KEY` d'environnement
- Stocker la clé dans un gestionnaire de secrets (Azure Key Vault, AWS Secrets Manager, HashiCorp Vault)
- Rotation de la clé tous les 90 jours (avec notification préalable)

### Sécurité Renforcée
```bash
# Ne jamais logger la clé JWT
# Ne jamais commiter .env
# Utiliser des permissions strictes
chmod 600 .env
chmod 600 jwt_secret_prod.txt

# Rotation automatisée (script cron)
# /etc/cron.monthly/rotate-jwt-key.sh
```

---

## 📞 Support

Si problèmes persistent:

1. **Vérifier les logs**
   ```bash
   cd sigac-backend/SIGAC.API
   tail -f logs/sigac-*.txt
   ```

2. **Vérifier la configuration**
   ```bash
   echo $JWT_SECRET_KEY  # Doit être défini
   env | grep JWT        # Doit afficher la variable
   ```

3. **Forcer reconnexion frontend**
   - Effacer LocalStorage (F12 → Application → Clear Storage)
   - Rafraîchir la page (Ctrl+F5)
   - Se reconnecter

4. **En dernier recours**: Rollback vers version précédente

---

**Date**: 17 Décembre 2025  
**Version**: Phase 1 - Sécurité Critique  
**Status**: ✅ Implémenté, Migration Requise
