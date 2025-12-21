# 🔧 Guide de Déboggage - Chat Non Fonctionnel

## ÉTAPE 1: Vérifier que vous êtes connecté

### ❌ Si vous voyez une page de LOGIN
1. Entrez: **username: `admin`**
2. Entrez: **password: `Admin@2024!`**
3. Cliquez "Login"
4. Attendez que la page se charge (environ 2-3 secondes)

### ✅ Si vous voyez la page principale
- Vous devriez voir votre nom d'utilisateur quelque part (généralement en haut à droite)
- Si vous ne le voyez pas, vous n'êtes pas connecté!

---

## ÉTAPE 2: Localiser le bouton chat

### ✅ Où chercher?
- **En bas à droite** de l'écran
- Cherchez: un bouton **💬** (bulle de chat) ou un bouton similaire
- Le bouton doit être **violet/bleu** avec un gradient

### ❌ Je ne vois pas de bouton chat?
- C'est un problème! Allez à **ÉTAPE 3**

---

## ÉTAPE 3: Ouvrir la Console Développeur

### Comment ouvrir:
- **Windows/Linux**: Appuyez sur **F12**
- **Mac**: Appuyez sur **Cmd + Option + I**

Vous devriez voir un panneau noir avec du texte en bas (ou sur le côté).

### Naviguer à l'onglet Console:
1. Cherchez les onglets: Elements, Console, Network, etc.
2. Cliquez sur **Console**
3. Vous devriez voir une ligne blanche avec `>`

---

## ÉTAPE 4: Coller le Script de Diagnostic

Dans la console (la ligne avec `>`):

1. **Copiez** ce texte exactement:
```javascript
console.log("=== TEST DEBUT ===");
console.log("Token:", localStorage.getItem('token') ? "✅ OUI" : "❌ NON");
console.log("User:", localStorage.getItem('user') ? "✅ OUI" : "❌ NON");
fetch('https://sigac-api.onrender.com/api/chat/conversations', {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}}).then(r => r.json()).then(d => console.log("API Response:", d));
```

2. **Collez** dans la console
3. **Appuyez sur Entrée**
4. **Observez le résultat**

---

## ÉTAPE 5: Interpréter les Résultats

### Résultat 1: Token et User
```
Token: ✅ OUI
User: ✅ OUI
```
**Signification**: Vous êtes connecté ✅

---

### Résultat 2: API Response
```javascript
{success: true, data: [...]}
```
**Signification**: L'API fonctionne ✅

---

### Résultat 3: Erreurs Possibles

#### ❌ Erreur: "Token not found"
```
Token: ❌ NON
User: ❌ NON
```
**Solution**: Vous n'êtes pas connecté!
- Cliquez sur Logout
- Cliquez sur Login
- Entrez: `admin` / `Admin@2024!`
- Attendez 3 secondes
- Rafraîchissez (F5)

---

#### ❌ Erreur: "Unauthorized (401)"
```
{success: false, message: "Unauthorized"}
```
**Solution**: Token expiré
- Déconnectez-vous
- Reconnectez-vous
- Rafraîchissez

---

#### ❌ Erreur: "Network error"
```
TypeError: Failed to fetch
```
**Solution**: Problème de connexion réseau
- Vérifiez votre Internet
- Vérifiez que https://sigac-api.onrender.com/api/health fonctionne
- Redémarrez votre navigateur

---

## ÉTAPE 6: Si le Chat N'Apparaît Toujours Pas

### Test 1: Chercher le bouton chat dans le HTML
Dans la console, tapez:
```javascript
document.querySelectorAll('button')
```

Cherchez un bouton avec texte "💬" ou class contenant "chat"

### Test 2: Vérifier que React fonctionne
Dans la console, tapez:
```javascript
console.log("React running:", !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__)
```

Devrait afficher: `React running: true`

### Test 3: Nettoyer le cache
1. **Appuyez**: Ctrl+Shift+Delete (Windows) ou Cmd+Shift+Delete (Mac)
2. **Sélectionnez**: "Cookies and cached images and files"
3. **Cliquez**: "Clear data"
4. **Rafraîchissez**: F5
5. **Reconnectez-vous**

---

## ÉTAPE 7: Si Vous Pouvez Créer une Conversation

Une fois le chat visible et fonctionnel:

### Créer une Conversation Manuellement
1. Cliquez le bouton chat 💬
2. Vous verrez peut-être une liste vide ou une liste de conversations
3. Cherchez un bouton "Nouvelle conversation" ou "+"
4. Si rien, utilisez le script ci-dessous dans la console

### Script pour Créer une Conversation via Console
```javascript
const JUGE_ID = "38d7fbec-1aaf-4338-8d81-461b7420564a";
const API = "https://sigac-api.onrender.com/api";

fetch(`${API}/chat/conversations`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({recipientId: JUGE_ID})
}).then(r => r.json()).then(d => {
  if (d.success) {
    console.log("✅ Conversation créée!", d.data.id);
  } else {
    console.log("❌ Erreur:", d);
  }
});
```

---

## RÉCAPITULATIF - Checklist

- [ ] Êtes-vous connecté? (Voyez-vous votre nom utilisateur?)
- [ ] Pouvez-vous voir le bouton chat 💬?
- [ ] La console (F12) affiche-t-elle "Token: ✅ OUI"?
- [ ] L'API répond-elle avec `{success: true}`?
- [ ] Avez-vous essayé de rafraîchir (F5)?
- [ ] Avez-vous vidé le cache?
- [ ] Avez-vous essayé de vous reconnecter?

---

## 📞 Si Vous Êtes Bloqué

Envoyer-moi:
1. Une **capture d'écran** montrant:
   - La page que vous voyez
   - Le message d'erreur (s'il y en a)
   - Ou la console (F12) avec l'erreur

2. **Dites-moi**:
   - Êtes-vous connecté(e)?
   - Voyez-vous le bouton chat?
   - Avez-vous un message d'erreur?

---

**Vous devriez maintenant pouvoir voir le chat fonctionner!** ✨
