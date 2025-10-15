// État global de l'application
let appState = {
    currentGame: null,
    isMultiplayer: false,
    gameCode: null
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page d\'accueil chargée');
    initializeHomePage();
    
    // Attendre un peu que tout soit rendu
    setTimeout(() => {
        setupEventListeners();
        loadGameState();
        
        // Vérification des boutons
        const createBtn = document.getElementById('createGameBtn');
        const joinBtn = document.getElementById('joinGameBtn');
        console.log('Bouton créer partie:', createBtn);
        console.log('Bouton rejoindre partie:', joinBtn);
    }, 100);
});

// Initialisation de la page d'accueil
function initializeHomePage() {
    // Vérifier s'il y a une partie en cours
    const savedGame = localStorage.getItem('efTravelCurrentGame');
    if (savedGame) {
        try {
            appState = JSON.parse(savedGame);
            if (appState.gameCode) {
                showCurrentGameInfo();
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la partie:', error);
        }
    }
}

// Configuration des événements
function setupEventListeners() {
    // Vérifier que les éléments existent avant d'ajouter les événements
    const soloBtn = document.getElementById('soloBtn');
    const createGameBtn = document.getElementById('createGameBtn');
    const joinGameBtn = document.getElementById('joinGameBtn');
    const copyCodeBtn = document.getElementById('copyCodeBtn');
    const startQuizBtn = document.getElementById('startQuizBtn');
    const confirmJoinBtn = document.getElementById('confirmJoinBtn');
    const gameCodeInput = document.getElementById('gameCodeInput');
    const continueGameBtn = document.getElementById('continueGameBtn');
    const leaveGameBtn = document.getElementById('leaveGameBtn');
    
    // Mode solo
    if (soloBtn) {
        soloBtn.addEventListener('click', startSoloGame);
    }
    
    // Mode multijoueur
    if (createGameBtn) {
        console.log('Bouton créer partie trouvé, ajout de l\'événement');
        createGameBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Clic sur créer partie détecté');
            createGame();
        });
    } else {
        console.error('Bouton créer partie non trouvé !');
    }
    if (joinGameBtn) {
        console.log('Bouton rejoindre partie trouvé, ajout de l\'événement');
        joinGameBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Clic sur rejoindre partie détecté');
            showJoinGame();
        });
    } else {
        console.error('Bouton rejoindre partie non trouvé !');
    }
    
    // Gestion du code de partie
    if (copyCodeBtn) {
        copyCodeBtn.addEventListener('click', copyGameCode);
    }
    if (startQuizBtn) {
        startQuizBtn.addEventListener('click', startMultiplayerGame);
    }
    
    // Rejoindre une partie
    if (confirmJoinBtn) {
        confirmJoinBtn.addEventListener('click', joinGame);
    }
    if (gameCodeInput) {
        gameCodeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                joinGame();
            }
        });
    }
    
    // Gestion de la partie en cours
    if (continueGameBtn) {
        continueGameBtn.addEventListener('click', continueGame);
    }
    if (leaveGameBtn) {
        leaveGameBtn.addEventListener('click', leaveGame);
    }
}

// Démarrer une partie solo
function startSoloGame() {
    appState.isMultiplayer = false;
    appState.gameCode = null;
    appState.currentGame = {
        type: 'solo',
        startTime: new Date().toISOString()
    };
    
    saveGameState();
    redirectToQuiz();
}

// Créer une partie multijoueur
function createGame() {
    console.log('createGame() appelée');
    const gameCode = generateGameCode();
    appState.isMultiplayer = true;
    appState.gameCode = gameCode;
    appState.currentGame = {
        type: 'multiplayer',
        code: gameCode,
        startTime: new Date().toISOString(),
        players: []
    };
    
    // Afficher la section du code de partie
    const gameCodeSection = document.getElementById('gameCodeSection');
    const gameCodeValue = document.getElementById('gameCodeValue');
    const gameModes = document.querySelector('.game-modes');
    
    if (gameCodeSection) {
        gameCodeSection.style.display = 'block';
    }
    if (gameCodeValue) {
        gameCodeValue.textContent = gameCode;
    }
    if (gameModes) {
        gameModes.style.display = 'none';
    }
    
        // Utiliser Socket.io si disponible
        if (window.socketManager && window.socketManager.isConnected && typeof window.socketManager.joinSession === 'function') {
            console.log('🎮 Création de partie via Socket.io');
            window.socketManager.joinSession(gameCode, `Host_${Date.now()}`);
        } else {
            console.log('💾 Création de partie via localStorage (fallback)');
            appState.currentGame.playerCount = 1;
            appState.currentGame.startTime = new Date().toISOString();
            saveSessionData(gameCode, appState.currentGame);
        }
    
    saveGameState();
    showNotification(`🎯 Game created! Code: ${gameCode}`);
}

// Afficher la section pour rejoindre une partie
function showJoinGame() {
    console.log('showJoinGame() appelée');
    const joinGameSection = document.getElementById('joinGameSection');
    const gameCodeInput = document.getElementById('gameCodeInput');
    
    if (joinGameSection) {
        joinGameSection.style.display = 'block';
    }
    if (gameCodeInput) {
        gameCodeInput.focus();
    }
}

// Rejoindre une partie
function joinGame() {
    const gameCode = document.getElementById('gameCodeInput').value.trim().toUpperCase();
    
    if (!gameCode || gameCode.length !== 6) {
        showJoinStatus('❌ Invalid code! The code must be 6 characters.', 'error');
        return;
    }
    
        // Utiliser Socket.io si disponible
        if (window.socketManager && window.socketManager.isConnected && typeof window.socketManager.joinSession === 'function') {
            console.log('🎮 Rejoindre partie via Socket.io');
            appState.isMultiplayer = true;
            appState.gameCode = gameCode;
            appState.currentGame = {
                type: 'multiplayer',
                code: gameCode,
                joinTime: new Date().toISOString(),
                isJoining: true
            };
            
            window.socketManager.joinSession(gameCode, `Player_${Date.now()}`);
            
            saveGameState();
            showJoinStatus(`✅ Game joined successfully! Connecting to server...`, 'success');
            
            setTimeout(() => {
                redirectToQuiz();
            }, 1500);
        } else {
            // Fallback vers localStorage
            console.log('💾 Rejoindre partie via localStorage (fallback)');
            
            if (validateGameCode(gameCode)) {
                appState.isMultiplayer = true;
                appState.gameCode = gameCode;
                appState.currentGame = {
                    type: 'multiplayer',
                    code: gameCode,
                    joinTime: new Date().toISOString(),
                    isJoining: true
                };
                
                const sessionData = getSessionData(gameCode);
                if (sessionData) {
                    appState.currentGame.playerCount = sessionData.playerCount;
                    appState.currentGame.startTime = sessionData.startTime;
                } else {
                    appState.currentGame.playerCount = 1;
                    appState.currentGame.startTime = new Date().toISOString();
                }
                
                saveGameState();
                saveSessionData(gameCode, appState.currentGame);
                showJoinStatus(`✅ Game joined successfully! ${appState.currentGame.playerCount} player(s) in session.`, 'success');
                
                setTimeout(() => {
                    redirectToQuiz();
                }, 1500);
            } else {
                showJoinStatus('❌ Game code not found! Check the code.', 'error');
            }
        }
}

// Continuer une partie existante
function continueGame() {
    redirectToQuiz();
}

// Quitter la partie actuelle
function leaveGame() {
    appState = {
        currentGame: null,
        isMultiplayer: false,
        gameCode: null
    };
    
    clearGameState();
    location.reload();
}

// Démarrer le quiz multijoueur
function startMultiplayerGame() {
    redirectToQuiz();
}

// Redirection vers le quiz
function redirectToQuiz() {
    // Sauvegarder l'état avant la redirection
    saveGameState();
    
    // Rediriger vers la page du quiz
    window.location.href = 'index.html';
}

// Génération d'un code de partie
function generateGameCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Validation d'un code de partie (simulation)
function validateGameCode(code) {
    // Dans une vraie application, ceci ferait une requête au serveur
    // Pour la démo, on accepte tous les codes de 6 caractères
    return code.length === 6 && /^[A-Z0-9]+$/.test(code);
}

// Copier le code de partie
function copyGameCode() {
    const gameCode = document.getElementById('gameCodeValue').textContent;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(gameCode).then(() => {
            showNotification('📋 Code copied to clipboard!');
        });
    } else {
        // Fallback pour les navigateurs plus anciens
        const textArea = document.createElement('textarea');
        textArea.value = gameCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('📋 Code copied to clipboard!');
    }
}

// Afficher les informations de la partie en cours
function showCurrentGameInfo() {
    document.getElementById('currentGameInfo').style.display = 'block';
    document.getElementById('currentGameCode').textContent = appState.gameCode;
    document.querySelector('.game-modes').style.display = 'none';
}

// Afficher le statut de connexion
function showJoinStatus(message, type) {
    const statusElement = document.getElementById('joinStatus');
    statusElement.textContent = message;
    statusElement.className = `join-status ${type}`;
    
    if (type === 'success') {
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 3000);
    }
}

// Sauvegarder l'état du jeu
function saveGameState() {
    localStorage.setItem('efTravelCurrentGame', JSON.stringify(appState));
}

// Charger l'état du jeu
function loadGameState() {
    const savedState = localStorage.getItem('efTravelCurrentGame');
    if (savedState) {
        try {
            appState = JSON.parse(savedState);
        } catch (error) {
            console.error('Erreur lors du chargement de l\'état:', error);
        }
    }
}

// Supprimer l'état du jeu
function clearGameState() {
    localStorage.removeItem('efTravelCurrentGame');
}

// Affichage des notifications
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #A47C48;
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        z-index: 1000;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Ajout des styles d'animation pour les notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Gestion des erreurs
window.addEventListener('error', function(event) {
    console.error('Erreur JavaScript:', event.error);
});

// Gestion des données de session
function saveSessionData(gameCode, gameData) {
    const sessionKey = `efTravelSession_${gameCode}`;
    const existingData = getSessionData(gameCode);
    
    if (existingData) {
        // Vérifier si c'est un nouveau joueur (pas juste une reconnexion)
        const timeSinceLastActivity = Date.now() - new Date(existingData.lastActivity).getTime();
        const isNewPlayer = timeSinceLastActivity > 30000; // Plus de 30 secondes depuis la dernière activité
        
        if (isNewPlayer) {
            existingData.playerCount = (existingData.playerCount || 1) + 1;
            existingData.lastActivity = new Date().toISOString();
            existingData.players = existingData.players || [];
            existingData.players.push({
                id: Date.now(),
                joinedAt: new Date().toISOString(),
                isActive: true
            });
        }
        
        localStorage.setItem(sessionKey, JSON.stringify(existingData));
    } else {
        // Nouvelle session
        localStorage.setItem(sessionKey, JSON.stringify({
            gameCode: gameCode,
            startTime: gameData.startTime,
            playerCount: 1,
            lastActivity: new Date().toISOString(),
            players: [{
                id: Date.now(),
                joinedAt: new Date().toISOString(),
                isActive: true
            }]
        }));
    }
}

function getSessionData(gameCode) {
    const sessionKey = `efTravelSession_${gameCode}`;
    const data = localStorage.getItem(sessionKey);
    return data ? JSON.parse(data) : null;
}

// Fonction utilitaire pour le débogage
function debugAppState() {
    console.log('État de l\'application:', appState);
    console.log('Données sauvegardées:', localStorage.getItem('efTravelCurrentGame'));
}

