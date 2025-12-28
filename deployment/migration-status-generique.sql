-- Migration: Renommer les statuts de dossiers vers des termes génériques
-- Phase 2A: Transformation universelle des statuts

-- Mise à jour des valeurs enum dans la base de données
-- Les enums PostgreSQL stockent les valeurs sous forme d'entiers, donc on met à jour les données

-- Backup: Créer une copie de sauvegarde avant modification
CREATE TABLE IF NOT EXISTS "Dossiers_backup_20241228" AS 
SELECT * FROM "Dossiers";

-- Mettre à jour les statuts des dossiers existants
-- Anciens enum: Nouveau=1, EnInstruction=2, EnDelibere=3, Juge=4, Classe=5
-- Nouveaux enum: Nouveau=1, EnCours=2, EnValidation=3, Valide=4, Termine=5
-- Les valeurs numériques restent identiques, seuls les noms changent dans le code

-- Note: Aucune modification de données nécessaire car les valeurs numériques 
-- de l'enum ne changent pas (1=1, 2=2, 3=3, 4=4, 5=5)
-- Cette migration documente simplement le changement sémantique

-- Vérification: Compter les dossiers par statut
SELECT 
    "Status",
    COUNT(*) as "Count",
    CASE "Status"
        WHEN 1 THEN 'Nouveau'
        WHEN 2 THEN 'EnCours (anciennement EnInstruction)'
        WHEN 3 THEN 'EnValidation (anciennement EnDelibere)'
        WHEN 4 THEN 'Valide (anciennement Juge)'
        WHEN 5 THEN 'Termine (anciennement Classe)'
        ELSE 'Inconnu'
    END as "StatusName"
FROM "Dossiers"
GROUP BY "Status"
ORDER BY "Status";

-- Succès: Les statuts ont été renommés au niveau du code
-- Les données en base restent inchangées (compatibilité totale)
