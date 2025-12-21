# 🌐 Configuration DNS pour taajii.fr

## Informations de Configuration

**Domaine** : taajii.fr  
**Frontend** : Vercel (via taajii.fr)  
**Backend API** : https://sigac-api.onrender.com  
**Certificat SSL** : Auto-généré par Vercel & Render  

---

## ✅ Records DNS à Configurer

Accédez au panneau de contrôle DNS de votre registrar (Namecheap, GoDaddy, OVH, etc.)

### Option 1 : Vercel Nameservers (Recommandé - Plus facile)

Remplacez les **Nameservers** de votre domaine par ceux de Vercel :

```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**Étapes** :
1. Allez sur https://vercel.com/dashboard/taajii.fr/settings/domains
2. Cliquez sur "Change Nameservers"
3. Notez les nameservers Vercel
4. Dans votre registrar DNS, remplacez les nameservers existants
5. Attendez 24-48h pour la propagation DNS

---

### Option 2 : Records DNS Manuels (Si vous gardez votre registrar actuel)

Si vous ne voulez pas changer les nameservers, ajoutez ces records DNS :

#### A Records
```
@  (ou taajii.fr)     A    76.76.19.89      (ou IP Vercel actuelle)
www                   A    76.76.19.89
```

#### CNAME Records (Alternative pour www)
```
www  CNAME  cname.vercel-dns.com.
```

#### TXT Records (Vérification domaine Vercel)
```
@  TXT  v=vercel1:...  (fourni par Vercel lors de la config)
```

---

## 📋 Vérifier la Configuration

Une fois les records configurés, vérifiez :

```bash
# Vérifier les nameservers
nslookup taajii.fr

# Vérifier que le domaine pointe vers Vercel
dig taajii.fr

# Tester le certificat SSL
curl -I https://taajii.fr
```

---

## 🔄 Flux de Configuration Recommandé

1. **Chez Vercel** ✅ (déjà fait)
   - Domaine `taajii.fr` ajouté
   - Certificat SSL en cours de création
   - Attend la configuration DNS

2. **Chez Render** ✅ (déjà fait)
   - CORS configuré pour `https://taajii.fr`
   - CORS configuré pour `https://www.taajii.fr`
   - API ready

3. **Chez votre Registrar** (À FAIRE)
   - Ajouter les nameservers Vercel
   - OU configurer les records DNS manuels
   - Attendre la propagation (24-48h)

4. **Test** (Après propagation DNS)
   - Ouvrir https://taajii.fr
   - Login avec admin/Admin@2024!
   - Vérifier que l'API répond (F12 → Network)

---

## 🎯 URLs Après Configuration

- **Frontend Production** : https://taajii.fr (+ https://www.taajii.fr)
- **API Backend** : https://sigac-api.onrender.com
- **Health Check** : https://sigac-api.onrender.com/api/health
- **Swagger Docs** : https://sigac-api.onrender.com/swagger

---

## 📞 Support Domaines

**Vercel DNS** :
- Docs : https://vercel.com/docs/projects/domains
- Dashboard : https://vercel.com/dashboard

**Render** :
- API : https://sigac-api.onrender.com
- Dashboard : https://dashboard.render.com/

---

## ⚠️ Après Configuration DNS

Une fois le domaine propagé (vous pouvez accéder à https://taajii.fr) :

1. Vérifiez que le certificat SSL est valide (🔒 dans le navigateur)
2. Testez le login
3. Vérifiez les requêtes API en F12
4. Accédez à /swagger pour tester l'API

---

**Configuration de domaine facilitée par Vercel et Render !**  
**Durée estimée** : 5 min (config) + 24-48h (propagation DNS)
