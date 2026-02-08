# 📱 Historique de Connexion - Guide Utilisateur

## Vue d'ensemble

La page **Historique de Connexion** vous permet de:
- ✅ Consulter toutes vos connexions au système
- ✅ Vérifier les adresses IP d'accès
- ✅ Identifier les appareils (Desktop, Mobile, Tablet) utilisés
- ✅ Voir le navigateur et le système d'exploitation
- ✅ Détecter les accès suspects ou non autorisés

## Accès à la Page

1. **Connectez-vous** à SIGAC
2. Dans la **Sidebar de gauche**, allez à la section **Administration**
3. Cliquez sur **"📱 Historique Connexions"**

## Tableau Principal

Le tableau affiche vos dernières connexions avec les colonnes suivantes:

| Colonne | Description |
|---------|-------------|
| **Date & Heure** | Quand vous vous êtes connecté (format: JJ mois AAAA, HH:MM:SS) |
| **Adresse IP** | L'adresse IP publique utilisée pour cette connexion |
| **Device** | Type d'appareil (Desktop, Mobile, Tablet) |
| **Navigateur** | Navigateur utilisé (Chrome, Safari, Firefox, Edge, etc.) |
| **Système d'exploitation** | OS détecté (Windows, macOS, Linux, iOS, Android) |
| **Actions** | Bouton pour voir les détails (User-Agent complet) |

## Fonctionnalités

### 🔄 Sélectionner le nombre de résultats

```
Dropdown en haut à gauche:
- Les 10 dernières
- Les 25 dernières  
- Les 50 dernières (défaut)
- Les 100 dernières
```

### 🔄 Rafraîchir les données

Cliquez sur le bouton **"🔄 Rafraîchir"** pour recharger l'historique de connexion.

### 📋 Copier une adresse IP

1. Cliquez sur le bouton **"📋"** à côté d'une adresse IP
2. L'IP est automatiquement copiée dans votre presse-papiers
3. Une notification **"Copié!"** confirme l'action

### 📖 Voir les détails complets

1. Cliquez sur le bouton **"▶ Détails"** pour une connexion
2. Un panel se déploie affichant:
   - **User-Agent Complet**: Chaîne technique complète du navigateur
   - **Statut**: Connexion réussie ou échouée
3. Cliquez à nouveau sur **"▼ Détails"** pour replier le panel

## Sécurité

### ⚠️ À faire si vous voyez quelque chose d'anormal

1. **Une adresse IP inconnue?**
   - Notez l'adresse IP
   - Contactez l'administrateur

2. **Un appareil non reconnu?**
   - Vérifiez la date/heure
   - Vous aviez peut-être autorisé un tiers

3. **Changez votre mot de passe immédiatement** si vous soupçonnez un accès non autorisé

## Pour les Administrateurs

### Accès à l'historique global

Si vous êtes administrateur, vous avez deux options supplémentaires:

#### 1. **Voir tout l'historique du système**
- Via l'API: `GET /api/LoginHistory/all`
- Liste les 100 dernières connexions de tous les utilisateurs
- Visible uniquement aux admins

#### 2. **Voir l'historique d'un utilisateur spécifique**
- Via l'API: `GET /api/LoginHistory/user/{userId}`
- Permet de vérifier les accès d'un utilisateur
- Visible uniquement aux admins et à l'utilisateur concerné

## Informations Techniques

### Endpoints API

```
GET /api/LoginHistory/my-history?limit=50
   - Récupère l'historique personnel
   - Paramètre: limit (10, 25, 50, 100)
   - Authentification requise

GET /api/LoginHistory/all?limit=100
   - Récupère l'historique global (Admin only)
   - Paramètre: limit (max 100)
   - Authentification requise + rôle Admin

GET /api/LoginHistory/user/{userId}?limit=50
   - Récupère l'historique d'un utilisateur (Admin only)
   - Authentification requise + rôle Admin
```

### Données tracées

Les informations suivantes sont enregistrées à chaque connexion:
- ✅ Timestamp (date/heure UTC)
- ✅ Adresse IP (source de la requête)
- ✅ User-Agent (description du navigateur/device)
- ✅ User ID (identifiant de l'utilisateur)
- ✅ Statut (réussi ou échoué)

### Extraction du User-Agent

La page analyse automatiquement le User-Agent pour extraire:

**Navigateur**:
- Chrome, Safari, Firefox, Edge, Internet Explorer, Autre

**Système d'exploitation**:
- Windows, macOS, Linux, iOS, Android, Autre

**Type d'appareil**:
- Desktop, Mobile, Tablet

## Conseils de Sécurité

1. **Consultez régulièrement** - Au moins une fois par semaine
2. **Notez les appareils habituels** - Pour reconnaître les accès anormaux
3. **Changez de mot de passe** si vous voyez:
   - Une adresse IP inconnue
   - Un pays/région inattendu
   - Un type d'appareil non reconnu

4. **Signalez à l'administrateur** toute activité suspecte

## FAQ

### Q: Pourquoi ne vois-je que les connexions récentes?
**R**: L'historique conserve les 100 dernières connexions. Les anciennes sont archivées après 90 jours.

### Q: Peut-on tracker les tentatives de connexion échouées?
**R**: Oui, via l'audit log du système. Consultez votre administrateur.

### Q: L'adresse IP change à chaque connexion?
**R**: C'est normal si vous utilisez:
- Un VPN ou Proxy
- Plusieurs réseaux (WiFi domicile, mobile, travail)
- Un FAI dynamique qui change votre IP

### Q: Comment localiser une adresse IP?
**R**: La page affiche uniquement l'adresse. Pour la localisation:
1. Allez sur `https://ipapi.co/[IP]/`
2. Ou utilisez un outil comme `maxmind.com`

## Support

Pour toute question ou problème:
- 📧 Contactez l'administrateur
- 🐛 Signalez les bugs via le système de tickets
- 📱 Consultez la documentation complète du système

---

**Dernière mise à jour**: 13 janvier 2026  
**Version**: 1.0
