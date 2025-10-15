# 🌍 EF Travel - Serveur Multijoueur

## 🚀 Installation et Démarrage

### Prérequis
- Node.js (version 14 ou supérieure)
- npm

### Installation
```bash
# Installer les dépendances
npm install

# Démarrer le serveur
npm start

# Ou en mode développement avec auto-reload
npm run dev
```

### Accès
- **URL**: http://localhost:3000
- **Page d'accueil**: http://localhost:3000
- **Quiz**: http://localhost:3000/quiz

## 🎮 Fonctionnalités Multijoueurs

### Connexions en Temps Réel
- **Socket.io** pour la communication bidirectionnelle
- **Détection automatique** des joueurs connectés
- **Synchronisation** des réponses en temps réel
- **Notifications** instantanées des événements

### Gestion des Sessions
- **Création de parties** avec codes uniques
- **Rejoindre des parties** existantes
- **Comptage automatique** des joueurs
- **Nettoyage automatique** des sessions expirées

### Résultats Collectifs
- **Calcul en temps réel** des statistiques
- **Affichage des pourcentages** pour chaque question
- **Synchronisation** des résultats entre tous les joueurs

## 🔧 Architecture

### Serveur (server.js)
- **Express.js** pour servir les fichiers statiques
- **Socket.io** pour les connexions WebSocket
- **Gestion des sessions** en mémoire
- **API REST** pour les statistiques

### Client (socket-client.js)
- **Gestionnaire Socket.io** pour les connexions
- **Événements en temps réel** (connexion, déconnexion, mise à jour)
- **Fallback localStorage** si le serveur n'est pas disponible

### Intégration
- **Conservation** de toutes les fonctionnalités existantes
- **Compatibilité** avec le système localStorage
- **Détection automatique** de la disponibilité du serveur

## 📊 Événements Socket.io

### Côté Client → Serveur
- `join-session`: Rejoindre une session
- `save-answers`: Sauvegarder les réponses
- `player-completed`: Marquer le joueur comme terminé
- `get-session-stats`: Demander les statistiques

### Côté Serveur → Client
- `player-joined`: Nouveau joueur rejoint
- `player-left`: Joueur quitte la session
- `player-updated`: Joueur mis à jour
- `player-finished`: Joueur terminé
- `collective-results`: Résultats collectifs
- `session-stats`: Statistiques de session

## 🎯 Utilisation

### 1. Démarrer le Serveur
```bash
npm start
```

### 2. Ouvrir l'Application
- Aller sur http://localhost:3000
- Vérifier le statut de connexion (🟢 Connecté)

### 3. Créer une Partie
- Cliquer sur "🎯 Create Game"
- Partager le code avec les amis
- Attendre que les joueurs rejoignent

### 4. Rejoindre une Partie
- Cliquer sur "🔗 Join Game"
- Entrer le code de la partie
- Se connecter automatiquement

### 5. Jouer Ensemble
- Répondre aux questions
- Voir les autres joueurs en temps réel
- Recevoir les résultats collectifs automatiquement

## 🔄 Mode Fallback

Si le serveur n'est pas disponible, l'application fonctionne en mode localStorage :
- **Création de parties** via localStorage
- **Simulation** des joueurs multiples
- **Résultats collectifs** simulés
- **Toutes les fonctionnalités** préservées

## 🛠️ Développement

### Structure des Fichiers
```
├── server.js              # Serveur Node.js + Socket.io
├── package.json           # Dépendances
├── socket-client.js       # Client Socket.io
├── home.html              # Page d'accueil
├── index.html             # Page du quiz
├── home.js                # Logique page d'accueil
├── script.js              # Logique du quiz
├── styles.css             # Styles CSS
└── README-SERVER.md       # Documentation
```

### Logs de Débogage
Le serveur affiche des logs détaillés :
- Connexions/déconnexions des joueurs
- Événements de session
- Statistiques en temps réel
- Erreurs et exceptions

## 🎉 Avantages du Système

### Temps Réel
- **Synchronisation instantanée** entre tous les joueurs
- **Notifications** en temps réel
- **Comptage précis** des joueurs connectés

### Fiabilité
- **Fallback automatique** vers localStorage
- **Gestion des erreurs** robuste
- **Nettoyage automatique** des sessions

### Performance
- **Communication WebSocket** efficace
- **Gestion mémoire** optimisée
- **Nettoyage automatique** des données expirées

## 🚀 Déploiement

### Production
```bash
# Installer PM2 pour la gestion des processus
npm install -g pm2

# Démarrer en production
pm2 start server.js --name "ef-travel"

# Vérifier le statut
pm2 status
```

### Variables d'Environnement
```bash
PORT=3000                    # Port du serveur
NODE_ENV=production          # Environnement
```

## 📱 Compatibilité

- **Navigateurs modernes** (Chrome, Firefox, Safari, Edge)
- **Mobile et desktop**
- **WebSocket support** requis
- **JavaScript ES6+** requis

## 🎮 Exemple d'Utilisation

1. **Joueur A** crée une partie → Code "ABC123"
2. **Joueur B** rejoint avec "ABC123" → Connexion automatique
3. **Joueur C** rejoint avec "ABC123" → Connexion automatique
4. **Tous jouent** ensemble → Synchronisation temps réel
5. **Résultats collectifs** → Affichage automatique pour tous

Le système détecte maintenant vraiment les joueurs connectés et synchronise tout en temps réel ! 🎉
