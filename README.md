# 🌍 EF Travel - Quiz Multijoueur

Un quiz amusant sur le voyage avec support multijoueur en temps réel.

## 🚀 Démarrage Rapide

### 1. Installation
```bash
npm install
```

### 2. Démarrage du Serveur
```bash
npm start
```

### 3. Accès à l'Application
- **URL**: http://localhost:3000
- **Quiz**: http://localhost:3000/quiz

## 🎮 Utilisation

### Créer une Partie
1. Aller sur http://localhost:3000
2. Cliquer sur "🎯 Create Game"
3. Copier le code généré
4. Partager le code avec les amis

### Rejoindre une Partie
1. Aller sur http://localhost:3000
2. Cliquer sur "🔗 Join Game"
3. Entrer le code de la partie
4. Se connecter automatiquement

### Jouer Ensemble
1. Tous les joueurs répondent aux questions
2. Voir les autres joueurs en temps réel
3. Recevoir les résultats collectifs automatiquement

## 🔧 Fonctionnalités

- ✅ **Multijoueur temps réel** avec Socket.io
- ✅ **Détection automatique** des joueurs connectés
- ✅ **Résultats collectifs** basés sur les vraies réponses
- ✅ **Mode fallback** localStorage si serveur indisponible
- ✅ **Interface responsive** mobile et desktop
- ✅ **Questions avec images** pour chaque question

## 📁 Structure du Projet

```
EF-TRAVEL/
├── server.js          # Serveur Node.js + Socket.io
├── package.json       # Dépendances
├── home.html          # Page d'accueil
├── index.html         # Page du quiz
├── styles.css         # Styles CSS
├── script.js          # Logique du quiz
├── home.js            # Logique de la page d'accueil
├── socket-client.js   # Client Socket.io
└── images/            # Images des questions
```

## 🎯 Résultat

Le système détecte maintenant **vraiment** tous les joueurs connectés sur le même code de jeu et synchronise tout en temps réel !

**Plus de simulation, plus de faux joueurs - que du vrai multijoueur !** 🎉