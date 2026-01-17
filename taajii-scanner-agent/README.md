# Taajii Scanner Agent

Application Windows permettant de scanner des documents directement depuis l'interface web Taajii.

## 🚀 Installation

### Prérequis
- Windows 10/11
- .NET 8.0 Runtime ([Télécharger](https://dotnet.microsoft.com/download/dotnet/8.0))
- Un scanner compatible WIA (Windows Image Acquisition)

### Compilation

```bash
cd taajii-scanner-agent
dotnet build -c Release
```

L'exécutable sera généré dans `bin/Release/net8.0-windows/TaajiiScannerAgent.exe`

### Utilisation

1. **Lancez l'application** - Double-cliquez sur `TaajiiScannerAgent.exe`
2. L'application se lance et écoute sur `http://localhost:5588`
3. Une icône apparaît dans la zone de notification (system tray)
4. **Gardez l'application ouverte** (ou minimisez-la)

## 🖨️ Utilisation avec Taajii

1. Assurez-vous que l'agent est lancé (icône verte dans la barre des tâches)
2. Allez sur [taajii.fr](https://taajii.fr)
3. Naviguez vers **Documents**
4. Sélectionnez un **dossier** dans le filtre
5. Cliquez sur **Scanner**
6. L'onglet **"🖨️ Scanner"** détecte automatiquement l'agent
7. Sélectionnez votre scanner dans la liste
8. Cliquez sur **"Lancer le Scan"**

## 🔧 API Endpoints

L'agent expose une API REST locale sur le port 5588 :

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/status` | GET | Vérifie si l'agent est en ligne |
| `/scanners` | GET | Liste les scanners disponibles |
| `/scan` | GET | Lance un scan et retourne l'image en base64 |
| `/scan?scannerId=xxx` | GET | Scan avec un scanner spécifique |

### Exemples

```bash
# Vérifier le statut
curl http://localhost:5588/status

# Lister les scanners
curl http://localhost:5588/scanners

# Scanner un document
curl http://localhost:5588/scan
```

## 📋 Scanners supportés

L'agent utilise **WIA (Windows Image Acquisition)** qui supporte la plupart des scanners :
- HP
- Canon
- Epson
- Brother
- Samsung
- Et tous les scanners compatibles TWAIN/WIA

## ⚠️ Dépannage

### "Agent non détecté"
- Vérifiez que TaajiiScannerAgent.exe est bien lancé
- Vérifiez qu'aucun pare-feu ne bloque le port 5588
- Essayez de relancer l'application

### "Aucun scanner détecté"
- Vérifiez que votre scanner est allumé et connecté
- Installez les pilotes de votre scanner
- Vérifiez que le scanner apparaît dans "Périphériques et imprimantes" Windows

### "Le scanner est occupé"
- Annulez tout scan en cours sur le scanner
- Attendez quelques secondes et réessayez

### Erreur CORS
- L'agent autorise automatiquement les requêtes depuis taajii.fr
- Si vous testez en local, assurez-vous d'utiliser localhost

## 🔒 Sécurité

- L'agent n'écoute que sur `localhost` (127.0.0.1)
- Aucune donnée n'est envoyée vers l'extérieur
- Les images scannées sont transmises directement à votre navigateur
- L'upload vers Taajii se fait via HTTPS

## 📝 License

MIT License - Taajii © 2026
