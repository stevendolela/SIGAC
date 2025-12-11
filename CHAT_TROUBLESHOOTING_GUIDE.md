# 🔧 Guide de Dépannage - Chat SIGAC

## 🎯 Situation Actuelle

- ✅ Backend API: **OPERATIONAL** (https://sigac-api.onrender.com)
- ✅ Frontend: **LOADING** (https://taajii.fr)
- ✅ Database: **CONNECTED** (PostgreSQL 15)
- ✅ Conversation créée: **5d10c373-5199-4b27-865b-c59830d8328b**
- ✅ Message envoyé: **fcee3074-cf95-42c2-8f1c-12ca2b436b0a**

**Le chat devrait fonctionner!** Voici comment déboguer si vous voyez toujours "Aucune conversation".

---

## 🔍 Étape 1: Vérifier la Console Navigateur

### Comment accéder à la console:
1. Ouvrez https://taajii.fr dans votre navigateur
2. Appuyez sur **F12** (ou Cmd+Option+I sur Mac)
3. Allez à l'onglet **Console**
4. Cherchez les erreurs rouges

### Erreurs courantes:

#### ❌ Erreur: "Failed to fetch /api/chat/conversations"
- **Cause**: Problème de CORS ou API pas accessible
- **Solution**: Vérifiez que https://sigac-api.onrender.com/api/health répond
- **Test**:
  ```bash
  curl https://sigac-api.onrender.com/api/health
  ```

#### ❌ Erreur: "Unauthorized (401)"
- **Cause**: Token JWT expiré ou non transmis
- **Solution**: Déconnectez-vous et reconnectez-vous
- **Vérification en console**:
  ```javascript
  localStorage.getItem('token')  // Doit afficher un token
  localStorage.getItem('user')   // Doit afficher l'utilisateur
  ```

#### ❌ Erreur: "Cannot read property 'length' of undefined"
- **Cause**: API retourne un format inattendu
- **Solution**: Vérifiez la structure de réponse
- **Test**:
  ```bash
  TOKEN=$(curl -s -X POST https://sigac-api.onrender.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"Admin@2024!"}' \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
  
  curl -s https://sigac-api.onrender.com/api/chat/conversations \
    -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
  ```

---

## 🔍 Étape 2: Vérifier localStorage

### Dans la Console Navigateur:
```javascript
// Afficher le token
console.log("Token:", localStorage.getItem('token'));

// Afficher l'utilisateur
console.log("User:", localStorage.getItem('user'));

// Afficher le refreshToken
console.log("Refresh Token:", localStorage.getItem('refreshToken'));
```

**Résultat attendu**:
- Token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long string)
- User: `{"id":"55bc9f92-...","username":"admin",...}`
- Refresh Token: `TS+pO1zUF+mEdTvo...` (long string)

**Si vide**: Vous n'êtes pas connecté! Déconnectez-vous et reconnectez-vous.

---

## 🔍 Étape 3: Vérifier les Requêtes Réseau

### Dans les DevTools (F12):
1. Allez à l'onglet **Network**
2. Rafraîchissez la page (F5)
3. Cherchez `chat/conversations`
4. Vérifiez:
   - **Status**: 200 (succès) ou 401 (non authentifié)
   - **Response**: `{"success":true,"data":[...]}`
   - **Headers**: `Authorization: Bearer eyJ...` (présent)

---

## 🔍 Étape 4: Vérifier que la Conversation Existe

### Depuis le Terminal:
```bash
# Step 1: Login
TOKEN=$(curl -s -X POST 'https://sigac-api.onrender.com/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"Admin@2024!"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

# Step 2: Fetch conversations
curl -s 'https://sigac-api.onrender.com/api/chat/conversations' \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

**Résultat attendu**:
```json
{
  "success": true,
  "data": [
    {
      "id": "5d10c373-5199-4b27-865b-c59830d8328b",
      "otherUserId": "38d7fbec-1aaf-4338-8d81-461b7420564a",
      "otherUserUsername": "juge.mbala",
      "lastMessageAt": "2025-12-11T...",
      "unreadCount": 0
    }
  ]
}
```

---

## 🔧 Solutions Rapides

### Si "Aucune conversation" persiste:

#### Solution 1: Vider le cache navigateur
1. Appuyez sur **Ctrl+Shift+Delete** (ou Cmd+Shift+Delete sur Mac)
2. Sélectionnez "Cache" et "Cookies"
3. Cliquez "Effacer les données"
4. Rafraîchissez https://taajii.fr

#### Solution 2: Forcer une déconnexion/reconnexion
```javascript
// Dans la console navigateur:
localStorage.removeItem('token');
localStorage.removeItem('user');
localStorage.removeItem('refreshToken');
location.reload();
```
Puis reconnectez-vous avec admin/Admin@2024!

#### Solution 3: Créer une nouvelle conversation via le UI
1. Ouvrez le chat panel (bouton 💬 en bas à droite)
2. Vous devriez voir "juge.mbala" dans la liste
3. Cliquez dessus
4. Envoyez un message

#### Solution 4: Vérifier que le backend retourne vraiment les conversations
```bash
bash /tmp/create_test_conversation.sh
```

Cela crée une nouvelle conversation et affiche le nombre trouvé.

---

## 📱 Vérification Rapide du Statut

### Health Check API:
```bash
curl https://sigac-api.onrender.com/api/health
# Devrait retourner: {"status":"Healthy",...}
```

### Test Chat Endpoint:
```bash
TOKEN=$(curl -s -X POST 'https://sigac-api.onrender.com/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"Admin@2024!"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

curl -s 'https://sigac-api.onrender.com/api/chat/conversations' \
  -H "Authorization: Bearer $TOKEN"
# Devrait retourner: {"success":true,"data":[...]}
```

### Test Frontend:
```bash
curl -sL https://taajii.fr | head -20
# Devrait retourner HTML avec <html> tag
```

---

## 📊 Checklist de Dépannage

- [ ] Refresh navigateur (F5)
- [ ] Vérifier console (F12 → Console) pour erreurs
- [ ] Vérifier localStorage a un token valide
- [ ] Vérifier que /api/health répond (Healthy)
- [ ] Vérifier que /api/chat/conversations retourne data
- [ ] Vider cache navigateur
- [ ] Déconnecter et reconnecter
- [ ] Créer nouvelle conversation via script

---

## 💡 Pro Tips

### 1. Auto-refresh React Hook
Le composant ChatPanel a un `useEffect` qui refresh toutes les 10 secondes. Si vous attendez 10 secondes sans bouger, les conversations devraient apparaître automatiquement.

### 2. Vérifier le Unread Badge
Si vous voyez un badge "1" sur le bouton 💬, cela signifie que le chat charge et a détecté 1 message non lu. C'est bon signe!

### 3. Vérifier que Vous Êtes Connecté
Regardez le coin supérieur droit de la page. Vous devriez voir votre nom d'utilisateur ("admin"). Si c'est pas là, vous n'êtes pas connecté.

---

## 🔗 URLs de Test

| URL | Expected | Status |
|-----|----------|--------|
| https://taajii.fr | React app loads | Should see login screen or app |
| https://sigac-api.onrender.com/api/health | `{"status":"Healthy"}` | ✅ 200 OK |
| https://sigac-api.onrender.com/api/chat/conversations | List of conversations (with auth) | ✅ 200 OK |

---

## 📞 Escalade

Si après tous ces tests le chat ne fonctionne pas:

1. **Vérifiez les logs Render**: https://dashboard.render.com/
2. **Vérifiez les erreurs Vercel**: https://vercel.com/
3. **Vérifiez la base de données**: `SELECT COUNT(*) FROM "ChatConversations";`
4. **Rechargez le service Render**: Trigger une redéployment

---

## ✅ Situation Attendue Après Fix

Vous devriez voir:
1. Interface Chat Panel en bas à droite avec bouton 💬
2. En cliquant 💬: Panel s'ouvre
3. Dans le panel: Liste des conversations avec "juge.mbala"
4. En cliquant "juge.mbala": Affiche les messages
5. Message: "Test message from admin - System is working!"

---

**Questions?** Consultez les fichiers:
- `CHAT_IMPLEMENTATION_SUMMARY.md` - Architecture complète
- `E2E_TEST_RESULTS.md` - Tests détaillés
- `SESSION_SUMMARY_CHAT_COMPLETE.md` - Overview
