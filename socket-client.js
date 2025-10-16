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

        console.log('🔌 Initialisation de la connexion Socket.io...');

        // Se connecter au serveur Socket.io automatiquement (URL relative pour le déploiement)
        this.socket = io({
            transports: ['websocket', 'polling'],
            timeout: 10000,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            maxReconnectionAttempts: Infinity,
            autoConnect: true,
            forceNew: true
        });
        
        // Événements de connexion automatique
        this.socket.on('connect', () => {
            this.isConnected = true;
            console.log('✅ Socket.io connecté avec succès!');
            this.updateConnectionStatus(true);
        });

        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;
            console.log('❌ Socket.io déconnecté:', reason);
            this.updateConnectionStatus(false);
        });

        this.socket.on('connect_error', (error) => {
            this.isConnected = false;
            console.error('❌ Erreur de connexion Socket.io:', error);
            this.updateConnectionStatus(false);
        });

        this.socket.on('reconnect', (attemptNumber) => {
            this.isConnected = true;
            console.log('🔄 Socket.io reconnecté après', attemptNumber, 'tentatives');
            this.updateConnectionStatus(true);
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
            console.log('🔄 Tentative de reconnexion Socket.io #', attemptNumber);
        });

        this.socket.on('reconnect_error', (error) => {
            console.error('❌ Erreur de reconnexion Socket.io:', error);
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

        console.log(`🎮 Tentative de rejoindre la session ${gameCode} en tant que ${this.playerName}`);
        console.log(`🔌 État de connexion: ${this.isConnected}`);

        // Attendre la connexion si nécessaire
        if (!this.isConnected) {
            console.log('⏳ Attente de la connexion Socket.io...');
            
            const waitForConnection = () => {
                if (this.isConnected && this.socket) {
                    this.socket.emit('join-session', {
                        gameCode: gameCode,
                        playerName: this.playerName
                    });
                    console.log(`📤 Émission join-session pour ${gameCode}`);
                } else {
                    console.log('⏳ Encore en attente de connexion...');
                    setTimeout(waitForConnection, 500);
                }
            };
            
            setTimeout(waitForConnection, 100);
        } else if (this.socket) {
            this.socket.emit('join-session', {
                gameCode: gameCode,
                playerName: this.playerName
            });
            console.log(`📤 Émission join-session pour ${gameCode}`);
        } else {
            console.error('❌ Socket non disponible');
        }
        
        return true;
    }

    // Sauvegarder les réponses
    saveAnswers(answers) {
        if (!this.currentGameCode) {
            console.error('Pas de code de jeu actif');
            return false;
        }

        console.log('💾 Sauvegarde des réponses via Socket.io:', answers);
        console.log('💾 Code de jeu:', this.currentGameCode);

        this.socket.emit('save-answers', {
            gameCode: this.currentGameCode,
            answers: answers
        });

        console.log('💾 Réponses sauvegardées sur le serveur');
        return true;
    }

    // Marquer le joueur comme terminé
    playerCompleted(answers) {
        if (!this.currentGameCode) {
            console.error('Pas de code de jeu actif');
            return false;
        }

        console.log('✅ Joueur terminé - envoi des réponses finales:', answers);
        console.log('✅ Code de jeu:', this.currentGameCode);

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
        
        // Forcer la mise à jour de l'affichage des joueurs dans le quiz
        if (typeof updatePlayerCount === 'function') {
            updatePlayerCount();
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
        console.log(`📊 Mise à jour du nombre de joueurs: ${count}`);
        
        const playerCountElement = document.getElementById('playerCount');
        if (playerCountElement) {
            playerCountElement.textContent = count;
        }

        // Mettre à jour les statistiques d'attente si elles existent
        const totalPlayersElement = document.getElementById('totalPlayers');
        if (totalPlayersElement) {
            totalPlayersElement.textContent = count;
        }
        
        // Forcer la mise à jour de l'affichage dans le quiz
        if (typeof window.updatePlayerCount === 'function') {
            window.updatePlayerCount();
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
