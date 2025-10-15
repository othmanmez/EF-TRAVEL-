// Client Socket.io pour EF Travel
class SocketManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.currentGameCode = null;
        this.playerName = null;
    }

    // Initialiser la connexion Socket.io
    init() {
        // Vérifier si Socket.io est disponible
        if (typeof io === 'undefined') {
            console.error('Socket.io non disponible. Assurez-vous que le serveur est démarré.');
            return false;
        }

        // Se connecter au serveur Socket.io automatiquement
        this.socket = io('http://localhost:3000', {
            transports: ['websocket', 'polling'],
            timeout: 10000,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 10000,
            maxReconnectionAttempts: Infinity,
            autoConnect: true
        });
        
        // Événements de connexion automatique
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.updateConnectionStatus(true);
        });

        this.socket.on('disconnect', () => {
            this.isConnected = false;
            this.updateConnectionStatus(false);
        });

        this.socket.on('connect_error', (error) => {
            this.isConnected = false;
            this.updateConnectionStatus(false);
        });

        this.socket.on('reconnect', (attemptNumber) => {
            this.isConnected = true;
            this.updateConnectionStatus(true);
        });

        // Événements de session
        this.socket.on('player-joined', (data) => {
            console.log('👥 Nouveau joueur rejoint:', data);
            this.handlePlayerJoined(data);
        });

        this.socket.on('player-left', (data) => {
            console.log('👋 Joueur parti:', data);
            this.handlePlayerLeft(data);
        });

        this.socket.on('player-updated', (data) => {
            console.log('🔄 Joueur mis à jour:', data);
            this.handlePlayerUpdated(data);
        });

        this.socket.on('player-finished', (data) => {
            console.log('✅ Joueur terminé:', data);
            this.handlePlayerFinished(data);
        });

        this.socket.on('collective-results', (data) => {
            console.log('📊 Résultats collectifs reçus:', data);
            this.handleCollectiveResults(data);
        });

        this.socket.on('session-stats', (data) => {
            console.log('📈 Statistiques de session:', data);
            this.handleSessionStats(data);
        });

        return true;
    }

    // Rejoindre une session
    joinSession(gameCode, playerName = null) {
        this.currentGameCode = gameCode;
        this.playerName = playerName || `Player_${Date.now()}`;

        // Si connecté, rejoindre immédiatement
        if (this.isConnected) {
            this.socket.emit('join-session', {
                gameCode: gameCode,
                playerName: this.playerName
            });
            return true;
        }

        // Sinon, attendre la connexion automatique
        const checkConnection = () => {
            if (this.isConnected) {
                this.socket.emit('join-session', {
                    gameCode: gameCode,
                    playerName: this.playerName
                });
            } else {
                setTimeout(checkConnection, 500);
            }
        };
        
        checkConnection();
        return true;
    }

    // Sauvegarder les réponses
    saveAnswers(answers) {
        if (!this.isConnected || !this.currentGameCode) {
            console.error('Pas de session active');
            return false;
        }

        this.socket.emit('save-answers', {
            gameCode: this.currentGameCode,
            answers: answers
        });

        console.log('💾 Réponses sauvegardées sur le serveur');
        return true;
    }

    // Marquer le joueur comme terminé
    playerCompleted(answers) {
        if (!this.isConnected || !this.currentGameCode) {
            console.error('Pas de session active');
            return false;
        }

        this.socket.emit('player-completed', {
            gameCode: this.currentGameCode,
            answers: answers
        });

        console.log('🏁 Joueur marqué comme terminé');
        return true;
    }

    // Demander les statistiques de session
    getSessionStats() {
        if (!this.isConnected || !this.currentGameCode) {
            console.error('Pas de session active');
            return false;
        }

        this.socket.emit('get-session-stats', {
            gameCode: this.currentGameCode
        });

        console.log('📊 Demande des statistiques de session');
        return true;
    }

    // Gestionnaires d'événements
    handlePlayerJoined(data) {
        console.log('👥 Nouveau joueur rejoint:', data);
        
        // Mettre à jour l'affichage du nombre de joueurs
        this.updatePlayerCount(data.totalPlayers);
        
        // Afficher une notification
        if (typeof showNotification === 'function') {
            showNotification(`👥 ${data.playerName} a rejoint la session! (${data.totalPlayers} joueur(s))`);
        }

        // Mettre à jour la liste des joueurs
        this.updatePlayersList(data.players);
        
        // Mettre à jour les statistiques d'attente si on est en mode multijoueur
        if (typeof updateWaitingStats === 'function') {
            updateWaitingStats();
        }
    }

    handlePlayerLeft(data) {
        // Mettre à jour l'affichage du nombre de joueurs
        this.updatePlayerCount(data.totalPlayers);
        
        // Afficher une notification
        if (typeof showNotification === 'function') {
            showNotification(`👋 ${data.playerName} a quitté la session (${data.totalPlayers} joueur(s))`);
        }

        // Mettre à jour la liste des joueurs
        this.updatePlayersList(data.players);
    }

    handlePlayerUpdated(data) {
        // Mettre à jour l'affichage des joueurs
        console.log(`Joueur ${data.playerName} a mis à jour ses réponses`);
    }

    handlePlayerFinished(data) {
        // Mettre à jour les statistiques d'attente
        this.updateWaitingStats(data.completedPlayers, data.totalPlayers);
        
        if (data.allCompleted) {
            console.log('🎉 Tous les joueurs ont terminé!');
        }
    }

    handleCollectiveResults(data) {
        // Afficher les résultats collectifs
        if (typeof displayCollectiveResults === 'function') {
            displayCollectiveResults(data);
        } else {
            console.log('Résultats collectifs reçus:', data);
        }
    }

    handleSessionStats(data) {
        // Mettre à jour les statistiques de session
        this.updateSessionStats(data);
    }


    // Méthodes d'affichage
    updateConnectionStatus(isConnected) {
        // Connexion automatique en arrière-plan - pas d'affichage visible
        console.log(`📡 Connexion Socket.io: ${isConnected ? 'Connecté' : 'Déconnecté'}`);
    }

    updatePlayerCount(count) {
        const playerCountElement = document.getElementById('playerCount');
        if (playerCountElement) {
            playerCountElement.textContent = count;
        }

        // Mettre à jour les statistiques d'attente si elles existent
        const totalPlayersElement = document.getElementById('totalPlayers');
        if (totalPlayersElement) {
            totalPlayersElement.textContent = count;
        }
    }

    updatePlayersList(players) {
        const playersListElement = document.getElementById('playersList');
        if (playersListElement) {
            playersListElement.innerHTML = players.map(player => 
                `<div class="player-item ${player.isCompleted ? 'completed' : 'active'}">
                    <span class="player-name">${player.name}</span>
                    <span class="player-status">${player.isCompleted ? '✅ Terminé' : '⏳ En cours'}</span>
                </div>`
            ).join('');
        }
    }

    updateWaitingStats(completed, total) {
        const completedElement = document.getElementById('completedPlayers');
        const remainingElement = document.getElementById('remainingPlayers');
        
        if (completedElement) {
            completedElement.textContent = completed;
        }
        
        if (remainingElement) {
            remainingElement.textContent = total - completed;
        }
    }

    updateSessionStats(data) {
        console.log('Statistiques de session mises à jour:', data);
        // Mettre à jour l'interface avec les nouvelles statistiques
    }

    // Déconnexion
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.isConnected = false;
            this.currentGameCode = null;
            this.playerName = null;
        }
    }
}

// Instance globale du gestionnaire Socket
let socketManager = null;

// Initialiser automatiquement la connexion
document.addEventListener('DOMContentLoaded', () => {
    try {
        socketManager = new SocketManager();
        window.socketManager = socketManager;
        
        if (socketManager.init()) {
            console.log('✅ Socket Manager initialisé');
        } else {
            console.error('❌ Échec de l\'initialisation du Socket Manager');
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation du Socket Manager:', error);
        // Créer une instance de fallback
        window.socketManager = {
            isConnected: false,
            joinSession: () => false,
            saveAnswers: () => false,
            playerCompleted: () => false
        };
    }
});
