# 📹 Application de la Migration VideoCall en Production

## ⚠️ IMPORTANT : La table VideoCalls n'existe pas encore !

L'erreur "Erreur lors de l'initiation de l'appel" vient du fait que la migration n'a pas été appliquée sur le serveur de production.

## 🚀 Étapes pour Appliquer la Migration

### Option 1: Via Render Shell (Recommandé)

1. **Ouvrir Render Dashboard**
   - Aller sur: https://dashboard.render.com
   - Se connecter avec votre compte

2. **Accéder au Shell**
   - Cliquer sur le service `sigac-api`
   - Dans le menu de gauche, cliquer sur **"Shell"**
   - Attendre que le terminal s'ouvre

3. **Exécuter la commande**
   ```bash
   dotnet ef database update --project SIGAC.Infrastructure --startup-project SIGAC.API
   ```

4. **Vérifier le succès**
   - Vous devriez voir: `Applying migration '20260115220405_AddVideoCallEntity'`
   - Puis: `Done.`

### Option 2: Via SQL Direct (Alternative)

Si le Shell ne fonctionne pas, vous pouvez exécuter le SQL directement dans PostgreSQL :

```sql
-- Créer la table VideoCalls
CREATE TABLE IF NOT EXISTS "VideoCalls" (
    "Id" uuid NOT NULL,
    "InitiatorId" uuid NOT NULL,
    "ReceiverId" uuid NOT NULL,
    "ConversationId" uuid NULL,
    "GroupId" uuid NULL,
    "Status" integer NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "StartedAt" timestamp with time zone NULL,
    "EndedAt" timestamp with time zone NULL,
    "SignalingData" text NULL,
    CONSTRAINT "PK_VideoCalls" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_VideoCalls_ChatConversations_ConversationId" FOREIGN KEY ("ConversationId") REFERENCES "ChatConversations" ("Id"),
    CONSTRAINT "FK_VideoCalls_ChatGroups_GroupId" FOREIGN KEY ("GroupId") REFERENCES "ChatGroups" ("Id"),
    CONSTRAINT "FK_VideoCalls_Users_InitiatorId" FOREIGN KEY ("InitiatorId") REFERENCES "Users" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_VideoCalls_Users_ReceiverId" FOREIGN KEY ("ReceiverId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

CREATE INDEX "IX_VideoCalls_ConversationId" ON "VideoCalls" ("ConversationId");
CREATE INDEX "IX_VideoCalls_GroupId" ON "VideoCalls" ("GroupId");
CREATE INDEX "IX_VideoCalls_InitiatorId" ON "VideoCalls" ("InitiatorId");
CREATE INDEX "IX_VideoCalls_ReceiverId" ON "VideoCalls" ("ReceiverId");
CREATE INDEX "IX_VideoCalls_Status" ON "VideoCalls" ("Status");
```

## ✅ Vérification

Après avoir appliqué la migration :

1. **Tester l'API**
   - Aller sur: https://sigac-api.onrender.com/swagger
   - Vérifier que les endpoints `/api/videocalls/*` sont disponibles
   - Tester `GET /api/videocalls/history` (devrait retourner `[]`)

2. **Tester dans l'application**
   - Se connecter sur https://taajii.fr
   - Ouvrir une conversation
   - Cliquer sur le bouton 📹
   - La caméra devrait s'activer et l'appel devrait s'initier

## 🔧 Dépannage

### Si vous voyez toujours l'erreur après migration :

1. **Vérifier que le backend a redémarré**
   - Render redémarre automatiquement après Shell
   - Attendre 2-3 minutes

2. **Vider le cache du navigateur**
   - Ctrl+Shift+Delete
   - Ou ouvrir en navigation privée

3. **Consulter les logs de la console**
   - Ouvrir F12 > Console
   - Regarder les logs qui commencent par 📞
   - Les erreurs détaillées apparaîtront

4. **Vérifier les logs Render**
   - Dans Render Dashboard > sigac-api > Logs
   - Chercher des erreurs SQL

## 📊 Statuts VideoCall

Après migration, les appels auront ces statuts :
- `0` = Initiating (en cours d'initiation)
- `1` = Active (appel actif)
- `2` = Ended (terminé normalement)
- `3` = Rejected (refusé)
- `4` = Missed (manqué)
- `5` = Cancelled (annulé)

## 🎉 Prochaines Étapes

Une fois la migration appliquée :
1. ✅ La caméra fonctionne (déjà OK)
2. ✅ L'initiation d'appel devrait fonctionner
3. 🔄 Polling pour la réponse (automatique)
4. 🔗 Connexion WebRTC peer-to-peer
5. 📞 Appel audio/vidéo fonctionnel

---

**Temps estimé:** 5 minutes
**Downtime:** Aucun (migration non-breaking)
