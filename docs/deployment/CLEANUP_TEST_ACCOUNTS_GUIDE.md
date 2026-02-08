# Guide: Nettoyage des Comptes de Test sur Production

## Comptes à Supprimer

D'après la capture d'écran, les comptes suivants contiennent "test" et doivent être supprimés:

1. **judgewithnametest** - judgename@test.cd
2. **newuser123** - newuser@test.cd  
3. **testfinal789** - testfinal@test.cd
4. **testuser2** - test2@test.cd
5. **usertest999** - test999@test.cd

## Méthode 1: Via Console Render (RECOMMANDÉ)

### Étape 1: Accéder à la base de données
1. Allez sur https://dashboard.render.com
2. Sélectionnez votre base PostgreSQL `sigac-db`
3. Cliquez sur l'onglet **"Shell"** (PSQL Console)

### Étape 2: Lister les comptes de test
```sql
SELECT "Id", "Username", "Email", "NomComplet" 
FROM "Users" 
WHERE LOWER("Username") LIKE '%test%' 
   OR LOWER("Email") LIKE '%test%'
ORDER BY "Username";
```

### Étape 3: Supprimer les comptes de test
```sql
DELETE FROM "Users" 
WHERE LOWER("Username") LIKE '%test%' 
   OR LOWER("Email") LIKE '%test%';
```

### Étape 4: Vérifier la suppression
```sql
-- Doit retourner 0
SELECT COUNT(*) as "Comptes avec test restants" 
FROM "Users" 
WHERE LOWER("Username") LIKE '%test%' 
   OR LOWER("Email") LIKE '%test%';

-- Lister tous les users restants (doit être propre)
SELECT "Username", "Email", "Role", "IsActive"
FROM "Users"
ORDER BY "CreatedAt" DESC;
```

## Méthode 2: Via Script Bash (Alternative)

Si vous avez l'URL de connexion externe de votre base Render:

1. Récupérer l'URL dans Render Dashboard > sigac-db > Info > **External Database URL**
   Format: `postgresql://user:password@host.frankfurt-postgres.render.com:5432/sigac_db`

2. Modifier le script:
   ```bash
   nano deployment/cleanup-test-accounts-render.sh
   # Remplacer RENDER_DB_URL par votre vraie URL
   ```

3. Exécuter:
   ```bash
   ./deployment/cleanup-test-accounts-render.sh
   ```

## Méthode 3: Via SQL Direct

Exécutez le fichier SQL fourni:
```bash
cat deployment/cleanup-test-accounts.sql
```

Copiez le contenu et exécutez-le dans la console PSQL de Render.

## Gestion des Foreign Keys

Les comptes de test peuvent avoir des données liées (messages, dossiers, etc.). Le schéma SIGAC gère automatiquement:

- **CASCADE**: Certaines relations suppriment automatiquement les données liées (ChatGroupMembers, Messages, etc.)
- **SET NULL**: D'autres mettent à NULL (Dossiers.RapporteurId)  
- **RESTRICT**: Certaines empêchent la suppression si des données critiques existent

Si vous obtenez une erreur de foreign key constraint, il faudra supprimer manuellement les données liées d'abord.

## Sécurité

⚠️ **IMPORTANT**: Ces opérations sont **irréversibles** en production.

- Faites une **sauvegarde de la base** avant la suppression massive
- Vérifiez bien la liste des comptes AVANT de supprimer
- Gardez les comptes légitimes: `admin`, `president.benoit`, `gladys.m`, `juge.kabongo`, `juge.mbala`, `juge.tshisekedi`

## Après le Nettoyage

1. Rafraîchir la page utilisateurs dans l'interface web
2. Vérifier que seuls les comptes légitimes restent
3. Les compteurs devraient être corrects
4. Les logs d'audit conservent l'historique des suppressions

## Comptes Légitimes à Conserver

D'après la capture, ces comptes doivent RESTER:
- ✅ gladys.m
- ✅ juge.kabongo  
- ✅ juge.mbala
- ✅ juge.tshisekedi
- ✅ president.benoit

Tous les comptes avec "test" dans le nom ou l'email doivent être supprimés.
