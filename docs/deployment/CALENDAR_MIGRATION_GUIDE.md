# Migration CalendarEvents - Guide d'Application

## ❗ Problème Identifié

L'erreur 500 lors de l'ajout d'événements dans le calendrier est causée par **l'absence de la table `CalendarEvents` en base de données**.

## 🔍 Diagnostic

1. ✅ Entité `CalendarEvent` existe dans le code
2. ✅ Service `CalendarService` existe et est configuré
3. ✅ Controller `CalendarController` existe et fonctionne
4. ✅ AutoMapper profile `CalendarMappingProfile` créé
5. ❌ **Table `CalendarEvents` manquante en base de données**

## 📋 Solution : Appliquer la Migration

### Option 1 : Via Render Dashboard (Recommandé)

1. **Se connecter à Render Dashboard** : https://dashboard.render.com
2. **Sélectionner le service PostgreSQL** : `sigac-postgres` (ou similaire)
3. **Aller dans l'onglet "Shell"** ou cliquer sur "Connect"
4. **Copier-coller le contenu du fichier** `deployment/migration-calendar-events.sql` :

```sql
CREATE TABLE IF NOT EXISTS "CalendarEvents" (
    "Id" uuid NOT NULL,
    "Type" character varying(50) NOT NULL DEFAULT 'General',
    "Titre" character varying(200) NOT NULL,
    "Description" character varying(1000),
    "Debut" timestamp with time zone NOT NULL,
    "Fin" timestamp with time zone NOT NULL,
    "DossierId" uuid,
    "SalleId" uuid,
    "TouteLaJournee" boolean NOT NULL DEFAULT false,
    "CreatedBy" uuid NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ModifiedAt" timestamp with time zone,
    CONSTRAINT "PK_CalendarEvents" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_CalendarEvents_Dossiers_DossierId" FOREIGN KEY ("DossierId") 
        REFERENCES "Dossiers" ("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_CalendarEvents_Salles_SalleId" FOREIGN KEY ("SalleId") 
        REFERENCES "Salles" ("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_CalendarEvents_Users_CreatedBy" FOREIGN KEY ("CreatedBy") 
        REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "IX_CalendarEvents_DossierId" ON "CalendarEvents" ("DossierId");
CREATE INDEX IF NOT EXISTS "IX_CalendarEvents_SalleId" ON "CalendarEvents" ("SalleId");
CREATE INDEX IF NOT EXISTS "IX_CalendarEvents_CreatedBy" ON "CalendarEvents" ("CreatedBy");
CREATE INDEX IF NOT EXISTS "IX_CalendarEvents_Debut_Fin" ON "CalendarEvents" ("Debut", "Fin");
```

5. **Vérifier que la table a été créée** :
```sql
SELECT COUNT(*) FROM "CalendarEvents";
```

### Option 2 : Via Script Shell (Ligne de commande)

1. **Récupérer la DATABASE_URL depuis Render** :
   - Dashboard → PostgreSQL service → Connect → External Connection String
   - Format : `postgresql://user:password@host:port/database`

2. **Exporter la variable d'environnement** :
```bash
export DATABASE_URL="postgresql://sigac_user:mot_de_passe@host.render.com:5432/sigac_db"
```

3. **Exécuter le script** :
```bash
cd /workspaces/SIGAC
./deployment/apply-calendar-migration.sh
```

### Option 3 : Manuellement avec psql

```bash
# Installer psql si nécessaire
sudo apt-get update && sudo apt-get install -y postgresql-client

# Se connecter
psql "postgresql://user:password@host:port/database"

# Copier-coller le SQL
\i deployment/migration-calendar-events.sql
```

## ✅ Vérification Post-Migration

1. **Vérifier que la table existe** :
```sql
\dt CalendarEvents
```

2. **Vérifier la structure** :
```sql
\d "CalendarEvents"
```

3. **Tester l'ajout d'un événement** via l'interface web

4. **Vérifier les logs backend** pour confirmer absence d'erreur 500

## 🎯 Résultat Attendu

- ✅ Table `CalendarEvents` créée avec 11 colonnes
- ✅ 4 index créés pour performances
- ✅ Foreign keys configurées vers Dossiers, Salles, Users
- ✅ POST `/api/Calendar` fonctionne sans erreur 500
- ✅ Événements affichés dans le calendrier

## 🚨 Rollback (si nécessaire)

Si besoin de supprimer la table :
```sql
DROP TABLE IF EXISTS "CalendarEvents" CASCADE;
```

## 📝 Notes

- La migration utilise `IF NOT EXISTS` donc elle peut être exécutée plusieurs fois sans erreur
- Les foreign keys utilisent `ON DELETE SET NULL` pour Dossier/Salle (optionnels)
- Le CreatedBy utilise `ON DELETE RESTRICT` pour garantir l'intégrité
- Index composite sur (Debut, Fin) pour optimiser les requêtes de plage de dates
