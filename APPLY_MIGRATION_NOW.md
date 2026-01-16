# 🚀 Application Rapide de la Migration VideoCall

## ✅ Solution Immédiate : Copier-Coller le SQL

Puisque `psql` n'est pas installé, utilisez l'une de ces méthodes :

---

## 📋 Méthode 1: Via Render SQL Console (Le plus simple)

### Étapes:

1. **Ouvrir Render Dashboard**
   - Allez sur: https://dashboard.render.com

2. **Accéder à la base de données**
   - Cliquez sur votre base PostgreSQL: `postgresql_sigac_e1f4`
   - Cliquez sur **"SQL Console"** (ou "Shell")

3. **Copier-coller ce SQL** et appuyer sur Entrée :

```sql
-- Créer la table VideoCalls
CREATE TABLE IF NOT EXISTS "VideoCalls" (
    "Id" uuid NOT NULL,
    "InitiatorId" uuid NOT NULL,
    "ReceiverId" uuid NOT NULL,
    "ConversationId" uuid NULL,
    "GroupId" uuid NULL,
    "Status" integer NOT NULL,
    "StartedAt" timestamp with time zone NOT NULL,
    "EndedAt" timestamp with time zone NULL,
    "DurationSeconds" integer NULL,
    "SignalingData" text NULL,
    CONSTRAINT "PK_VideoCalls" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_VideoCalls_ChatConversations_ConversationId" FOREIGN KEY ("ConversationId") 
        REFERENCES "ChatConversations" ("Id"),
    CONSTRAINT "FK_VideoCalls_ChatGroups_GroupId" FOREIGN KEY ("GroupId") 
        REFERENCES "ChatGroups" ("Id"),
    CONSTRAINT "FK_VideoCalls_Users_InitiatorId" FOREIGN KEY ("InitiatorId") 
        REFERENCES "Users" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_VideoCalls_Users_ReceiverId" FOREIGN KEY ("ReceiverId") 
        REFERENCES "Users" ("Id") ON DELETE CASCADE
);

-- Créer les index
CREATE INDEX IF NOT EXISTS "IX_VideoCalls_ConversationId" ON "VideoCalls" ("ConversationId");
CREATE INDEX IF NOT EXISTS "IX_VideoCalls_GroupId" ON "VideoCalls" ("GroupId");
CREATE INDEX IF NOT EXISTS "IX_VideoCalls_InitiatorId" ON "VideoCalls" ("InitiatorId");
CREATE INDEX IF NOT EXISTS "IX_VideoCalls_ReceiverId" ON "VideoCalls" ("ReceiverId");
CREATE INDEX IF NOT EXISTS "IX_VideoCalls_Status" ON "VideoCalls" ("Status");

-- Ajouter colonne Status si absente
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "Status" integer NOT NULL DEFAULT 0;

-- Vérification
SELECT 'Table VideoCalls créée!' as result;
```

4. **Vérifier le succès**
   - Vous devriez voir: `Table VideoCalls créée!`

---

## 📋 Méthode 2: Via DBeaver (Si installé)

1. **Télécharger DBeaver** (si pas déjà installé)
   - https://dbeaver.io/download/

2. **Créer une nouvelle connexion**
   - Clic droit > New Database Connection
   - Choisir PostgreSQL
   - Remplir:
     ```
     Host: dpg-d4obq0a4i8rc73f06gl0-a.frankfurt-postgres.render.com
     Port: 5432
     Database: postgresql_sigac_e1f4
     Username: postgresql_sigac_e1f4_user
     Password: wboMdsAzEhwVXP6nHZl2ZHO0V0Hhdzqe
     ```

3. **Ouvrir SQL Editor** (F3)

4. **Copier-coller le SQL** du fichier `apply-videocall-migration.sql`

5. **Exécuter** (Ctrl+Enter)

---

## 📋 Méthode 3: Via Render Shell + dotnet ef

1. **Ouvrir Render Dashboard**
   - https://dashboard.render.com

2. **Accéder au service backend**
   - Cliquer sur `sigac-api`
   - Cliquer sur **"Shell"** dans le menu

3. **Exécuter la commande**
   ```bash
   dotnet ef database update --project SIGAC.Infrastructure --startup-project SIGAC.API
   ```

4. **Attendre**
   - Vous verrez: `Applying migration '20260115220405_AddVideoCallEntity'`
   - Puis: `Done.`

---

## ✅ Vérification après migration

### Via SQL:
```sql
-- Vérifier que la table existe
SELECT COUNT(*) as table_exists 
FROM information_schema.tables 
WHERE table_name = 'VideoCalls';

-- Lister la structure
\d "VideoCalls"
```

### Via API:
1. Ouvrir: https://sigac-api.onrender.com/swagger
2. Tester: `GET /api/videocalls/history`
3. Devrait retourner: `[]` (liste vide, pas d'erreur)

---

## 🧪 Tester l'appel vidéo

1. **Vider le cache du navigateur** (Ctrl+Shift+Delete)
2. **Recharger** https://taajii.fr
3. **Se connecter** et ouvrir une conversation
4. **Cliquer sur 📹** dans l'en-tête
5. **Regarder la console** (F12) - vous devriez voir:
   ```
   📞 Création de l'appel côté serveur...
   ✅ Appel créé: {id: "...", status: 0, ...}
   🔗 Création de la connexion WebRTC...
   ```

---

## 🎯 Résolution des problèmes

### Si vous voyez encore l'erreur:
1. La migration n'a pas été appliquée
2. Le backend n'a pas redémarré (attendez 2-3 minutes)
3. Cache navigateur (Ctrl+Shift+Delete)

### Logs détaillés:
- Backend logs: Render Dashboard > sigac-api > Logs
- Frontend logs: F12 > Console

---

**Temps estimé:** 2-3 minutes  
**Méthode recommandée:** Render SQL Console (la plus simple)
