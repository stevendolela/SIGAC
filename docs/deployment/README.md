# 📦 Dossier Deployment - SIGAC

Ce dossier regroupe tous les fichiers nécessaires au déploiement et à la maintenance de SIGAC en production.

## 📂 Structure

### 🔧 Scripts de Déploiement (10 scripts)

| Script | Description |
|--------|-------------|
| `deploy.sh` | Script de déploiement principal |
| `deploy-frontend.sh` | Déploiement frontend Vercel uniquement |
| `full-deploy.sh` | Déploiement complet (backend + frontend) |
| `redeploy-render.sh` | Redéploiement backend sur Render |
| `deployment-status.sh` | Vérification du statut de déploiement |
| `wait-and-test-deploy.sh` | Attente et test après déploiement |
| `apply-migration-production.sh` | Application des migrations en production |
| `migrate-production-render.sh` | Migrations spécifiques Render |
| `check-migration-status.sh` | Vérification statut des migrations |
| `verify-migration-production.sh` | Vérification post-migration |

### 💾 Migrations SQL (2 fichiers)

| Fichier | Description |
|---------|-------------|
| `migration-base64.sql` | Migration pour avatars et logos Base64 |
| `migration-system-settings.sql` | Migration pour SystemSettings table |

### 📋 Configuration Render (2 fichiers)

| Fichier | Description |
|---------|-------------|
| `render.yaml` | Configuration principale Render |
| `render-backend.yaml` | Configuration backend Render |

### 📖 Documentation (20 documents)

Toute la documentation liée au déploiement, migrations, et configuration:
- Guides de déploiement
- Status de déploiement
- Checklists Render
- Documentation des migrations
- Résumés des déploiements effectués

## 🚀 Utilisation Rapide

### Déploiement Frontend Seulement
```bash
cd deployment
./deploy-frontend.sh
```

### Déploiement Complet
```bash
cd deployment
./full-deploy.sh
```

### Appliquer une Migration
```bash
cd deployment
# Connectez-vous à PostgreSQL et exécutez:
psql <connection_string> < migration-system-settings.sql
```

### Vérifier le Statut
```bash
cd deployment
./deployment-status.sh
```

## 🔗 URLs de Production

- **Frontend**: https://taajii.fr
- **Backend API**: https://sigac-api.onrender.com
- **Swagger**: https://sigac-api.onrender.com/swagger

## 📝 Notes

- Tous les scripts sont exécutables (`chmod +x *.sh`)
- Les migrations SQL doivent être appliquées manuellement sur Render
- La documentation est synchronisée avec l'état actuel du projet
- Vercel déploie automatiquement à chaque push sur `main`

## ⚠️ Sécurité

Ne jamais commiter de secrets ou tokens dans ces fichiers. Utiliser les variables d'environnement Render/Vercel.

---

**Dernière mise à jour**: 21 décembre 2025
