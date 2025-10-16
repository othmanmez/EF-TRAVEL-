# 🚀 Guide de Déploiement - EF Travel

## ✅ Corrections Apportées pour le Déploiement

### 1. 🔧 URL Socket.io Corrigée
- **Avant** : `io('http://localhost:3000')` (hardcodé)
- **Maintenant** : `io()` (URL relative automatique)

### 2. 🌐 CORS Amélioré
- Ajout de `credentials: true`
- Support `allowEIO3: true`
- Configuration pour tous les domaines

### 3. 📦 Scripts de Production
- `npm run prod` pour la production
- Configuration NODE_ENV=production

## 🚀 Déploiement Rapide

### Heroku
```bash
# 1. Installer Heroku CLI
# 2. Se connecter
heroku login

# 3. Créer l'app
heroku create ef-travel-[votre-nom]

# 4. Déployer
git add .
git commit -m "Deploy EF Travel"
git push heroku main

# 5. Ouvrir l'app
heroku open
```

### Vercel
```bash
# 1. Installer Vercel CLI
npm i -g vercel

# 2. Déployer
vercel

# 3. Suivre les instructions
```

### Netlify
```bash
# 1. Build du projet (maintenant disponible)
npm run build

# 2. Déployer via interface Netlify
# Ou avec CLI:
npm i -g netlify-cli
netlify deploy
```

## 🔧 Variables d'Environnement

### Heroku
```bash
heroku config:set NODE_ENV=production
heroku config:set PORT=80
```

### Vercel
Créer `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

## ✅ Test du Déploiement

1. **Vérifier l'URL** : L'app doit être accessible
2. **Tester Socket.io** : Console du navigateur doit montrer "Connecté"
3. **Tester Multijoueur** : Créer/Rejoindre une partie
4. **Vérifier les logs** : Pas d'erreurs CORS

## 🎯 Résultat

**Le jeu fonctionne maintenant en local ET en déploiement !**

- ✅ URL Socket.io automatique
- ✅ CORS configuré pour tous les domaines
- ✅ Scripts de production
- ✅ Compatible avec tous les hébergeurs

**Prêt pour la livraison !** 🚀
