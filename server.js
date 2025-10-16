const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    allowEIO3: true
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Stockage des sessions et joueurs
const sessions = new Map(); // gameCode -> session data
const players = new Map(); // socketId -> player data

// Gestion des connexions Socket.io
io.on('connection', (socket) => {
    console.log(`🔌 Nouveau joueur connecté: ${socket.id}`);
    console.log(`📊 Total connexions actives: ${io.engine.clientsCount}`);

    // Rejoindre une session
    socket.on('join-session', (data) => {
        const { gameCode, playerName } = data;
        
        console.log(`🎮 Joueur ${socket.id} rejoint la session ${gameCode} en tant que ${playerName}`);
        
        // Initialiser la session si elle n'existe pas
        if (!sessions.has(gameCode)) {
            sessions.set(gameCode, {
                gameCode,
                players: new Map(),
                startTime: new Date().toISOString(),
                isActive: true
            });
            console.log(`🆕 Nouvelle session créée: ${gameCode}`);
        }
        
        const session = sessions.get(gameCode);
        const playerData = {
            socketId: socket.id,
            playerName: playerName || `Player_${socket.id.substring(0, 6)}`,
            joinedAt: new Date().toISOString(),
            isActive: true,
            answers: {},
            isCompleted: false
        };
        
        // Ajouter le joueur à la session
        session.players.set(socket.id, playerData);
        players.set(socket.id, { gameCode, ...playerData });
        
        // Rejoindre la room Socket.io
        socket.join(gameCode);
        
        console.log(`👥 Session ${gameCode}: ${session.players.size} joueur(s) connecté(s)`);
        console.log(`📋 Joueurs dans la session:`, Array.from(session.players.values()).map(p => p.playerName));
        console.log(`🔍 DEBUG - Total joueurs dans session:`, session.players.size);
        console.log(`🔍 DEBUG - Liste complète:`, Array.from(session.players.entries()));
        
        // Notifier tous les joueurs de la session
        io.to(gameCode).emit('player-joined', {
            playerId: socket.id,
            playerName: playerData.playerName,
            totalPlayers: session.players.size,
            players: Array.from(session.players.values()).map(p => ({
                id: p.socketId,
                name: p.playerName,
                isCompleted: p.isCompleted,
                joinedAt: p.joinedAt
            }))
        });
        
        // Envoyer les statistiques actuelles au nouveau joueur
        socket.emit('session-stats', {
            gameCode,
            totalPlayers: session.players.size,
            completedPlayers: Array.from(session.players.values()).filter(p => p.isCompleted).length,
            isActive: session.isActive,
            players: Array.from(session.players.values()).map(p => ({
                id: p.socketId,
                name: p.playerName,
                isCompleted: p.isCompleted,
                joinedAt: p.joinedAt
            }))
        });
    });

    // Sauvegarder les réponses d'un joueur
    socket.on('save-answers', (data) => {
        const { gameCode, answers } = data;
        const player = players.get(socket.id);
        
        console.log(`💾 Sauvegarde des réponses pour le joueur ${socket.id} dans la session ${gameCode}`);
        console.log(`💾 Réponses reçues:`, answers);
        
        if (player && player.gameCode === gameCode) {
            player.answers = answers;
            player.lastUpdate = new Date().toISOString();
            
            console.log(`✅ Réponses sauvegardées pour ${player.playerName}:`, answers);
            
            // Notifier la session
            socket.to(gameCode).emit('player-updated', {
                playerId: socket.id,
                playerName: player.playerName,
                hasAnswers: Object.keys(answers).length > 0
            });
        } else {
            console.error(`❌ Erreur: Joueur ${socket.id} non trouvé ou mauvais code de jeu`);
            console.error(`❌ Joueur trouvé:`, player);
            console.error(`❌ Code de jeu attendu:`, gameCode);
        }
    });

    // Marquer un joueur comme ayant terminé
    socket.on('player-completed', (data) => {
        const { gameCode, answers } = data;
        const player = players.get(socket.id);
        
        if (player && player.gameCode === gameCode) {
            player.answers = answers;
            player.isCompleted = true;
            player.completedAt = new Date().toISOString();
            
            console.log(`Joueur ${socket.id} a terminé le quiz dans ${gameCode}`);
            
            const session = sessions.get(gameCode);
            if (session) {
                const completedPlayers = Array.from(session.players.values()).filter(p => p.isCompleted).length;
                const totalPlayers = session.players.size;
                
                // Notifier tous les joueurs de la session
                io.to(gameCode).emit('player-finished', {
                    playerId: socket.id,
                    playerName: player.playerName,
                    completedPlayers,
                    totalPlayers,
                    allCompleted: completedPlayers >= totalPlayers
                });
                
                // Si tous les joueurs ont terminé, calculer les statistiques collectives
                if (completedPlayers >= totalPlayers) {
                    const collectiveStats = calculateCollectiveStats(session);
                    io.to(gameCode).emit('collective-results', {
                        gameCode,
                        totalPlayers,
                        collectiveStats,
                        players: Array.from(session.players.values()).map(p => ({
                            id: p.socketId,
                            name: p.playerName,
                            answers: p.answers
                        }))
                    });
                }
            }
        }
    });

    // Demander les statistiques d'une session
    socket.on('get-session-stats', (data) => {
        const { gameCode } = data;
        const session = sessions.get(gameCode);
        
        if (session) {
            const completedPlayers = Array.from(session.players.values()).filter(p => p.isCompleted).length;
            const totalPlayers = session.players.size;
            
            socket.emit('session-stats', {
                gameCode,
                totalPlayers,
                completedPlayers,
                isActive: session.isActive,
                players: Array.from(session.players.values()).map(p => ({
                    id: p.socketId,
                    name: p.playerName,
                    isCompleted: p.isCompleted,
                    joinedAt: p.joinedAt
                }))
            });
        }
    });

    // Quitter une session
    socket.on('leave-session', (data) => {
        const { gameCode } = data;
        const session = sessions.get(gameCode);
        
        if (session && session.players.has(socket.id)) {
            const player = session.players.get(socket.id);
            session.players.delete(socket.id);
            players.delete(socket.id);
            
            console.log(`👋 Joueur ${socket.id} (${player.playerName}) a quitté la session ${gameCode}`);
            
            // Notifier les autres joueurs
            socket.to(gameCode).emit('player-left', {
                playerId: socket.id,
                playerName: player.playerName,
                totalPlayers: session.players.size,
                players: Array.from(session.players.values()).map(p => ({
                    id: p.socketId,
                    name: p.playerName,
                    isCompleted: p.isCompleted,
                    joinedAt: p.joinedAt
                }))
            });
            
            // Nettoyer la session si elle est vide
            if (session.players.size === 0) {
                // Attendre 2 heures avant de supprimer la session
                setTimeout(() => {
                    if (sessions.has(gameCode) && sessions.get(gameCode).players.size === 0) {
                        sessions.delete(gameCode);
                        console.log(`🗑️ Session ${gameCode} supprimée après 2h d'inactivité`);
                    }
                }, 2 * 60 * 60 * 1000); // 2 heures
                console.log(`⏰ Session ${gameCode} programmée pour suppression dans 2h`);
            }
        }
    });


    // Gestion de la déconnexion
    socket.on('disconnect', (reason) => {
        const player = players.get(socket.id);
        
        console.log(`👋 Joueur ${socket.id} déconnecté (${reason})`);
        console.log(`📊 Total connexions restantes: ${io.engine.clientsCount}`);
        
        if (player) {
            const { gameCode } = player;
            const session = sessions.get(gameCode);
            
            if (session) {
                session.players.delete(socket.id);
                players.delete(socket.id);
                
                console.log(`👋 Joueur ${socket.id} (${player.playerName}) déconnecté de la session ${gameCode}`);
                console.log(`👥 Session ${gameCode}: ${session.players.size} joueur(s) restant(s)`);
                
                // Notifier les autres joueurs seulement s'il y en a d'autres
                if (session.players.size > 0) {
                    socket.to(gameCode).emit('player-left', {
                        playerId: socket.id,
                        playerName: player.playerName,
                        totalPlayers: session.players.size,
                        players: Array.from(session.players.values()).map(p => ({
                            id: p.socketId,
                            name: p.playerName,
                            isCompleted: p.isCompleted,
                            joinedAt: p.joinedAt
                        }))
                    });
                }
                
                // Programmer la suppression de la session après 2 heures
                if (session.players.size === 0) {
                    setTimeout(() => {
                        if (sessions.has(gameCode) && sessions.get(gameCode).players.size === 0) {
                            sessions.delete(gameCode);
                            console.log(`🗑️ Session ${gameCode} supprimée après 2h d'inactivité`);
                        }
                    }, 2 * 60 * 60 * 1000); // 2 heures
                    console.log(`⏰ Session ${gameCode} programmée pour suppression dans 2h`);
                }
            }
        }
    });
});

// Calculer les statistiques collectives
function calculateCollectiveStats(session) {
    const questions = [
        "Have you ever traveled abroad?",
        "Have you ever traveled alone?",
        "Have you ever missed the plane?",
        "Have you ever done a road trip?",
        "Have we already lost your suitcase?",
        "Do you always make a list before going on a trip?",
        "Have you ever traveled camping?",
        "Have you ever tasted a local food while traveling?",
        "Do you prefer to travel with friends rather than with family?",
        "Have you ever used a translation application while traveling?"
    ];
    
    const collectiveStats = {};
    const totalPlayers = session.players.size;
    
    console.log(`🧮 Calcul des statistiques pour ${totalPlayers} joueurs dans la session ${session.gameCode}`);
    
    // Compter seulement les joueurs qui ont terminé le quiz
    const completedPlayers = Array.from(session.players.values()).filter(player => player.isCompleted);
    const actualPlayerCount = completedPlayers.length;
    
    console.log(`👥 Joueurs connectés: ${totalPlayers}, Joueurs ayant terminé: ${actualPlayerCount}`);
    
    for (let i = 1; i <= 10; i++) {
        let yesCount = 0;
        let noCount = 0;
        
        // Compter les réponses pour cette question (seulement des joueurs ayant terminé)
        completedPlayers.forEach(player => {
            console.log(`🔍 Vérification joueur ${player.playerName}:`, player.answers);
            if (player.answers && player.answers[i]) {
                if (player.answers[i] === 'yes') {
                    yesCount++;
                } else if (player.answers[i] === 'no') {
                    noCount++;
                }
            }
        });
        
        const totalResponses = yesCount + noCount;
        
        collectiveStats[i] = {
            question: questions[i - 1],
            yesCount,
            noCount,
            totalResponses,
            totalPlayers: actualPlayerCount, // Utiliser le nombre réel de joueurs ayant terminé
            yesPercentage: totalResponses > 0 ? Math.round((yesCount / totalResponses) * 100) : 0,
            noPercentage: totalResponses > 0 ? Math.round((noCount / totalResponses) * 100) : 0
        };
        
        console.log(`📊 Question ${i}: ${yesCount} Oui, ${noCount} Non (${totalResponses} réponses sur ${actualPlayerCount} joueurs)`);
    }
    
    console.log(`📈 Statistiques finales calculées pour ${actualPlayerCount} joueurs ayant terminé`);
    return {
        collectiveStats,
        totalPlayers: actualPlayerCount,
        sessionCode: session.gameCode
    };
}

// Route pour servir les fichiers statiques
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});

app.get('/quiz', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});



// Route API pour obtenir les statistiques d'une session
app.get('/api/session/:gameCode', (req, res) => {
    const { gameCode } = req.params;
    const session = sessions.get(gameCode);
    
    if (session) {
        const completedPlayers = Array.from(session.players.values()).filter(p => p.isCompleted).length;
        res.json({
            gameCode,
            totalPlayers: session.players.size,
            completedPlayers,
            isActive: session.isActive,
            startTime: session.startTime
        });
    } else {
        res.status(404).json({ error: 'Session not found' });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Serveur EF Travel démarré sur le port ${PORT}`);
    console.log(`📱 Accédez à l'application: http://localhost:${PORT}`);
    console.log(`🌍 Environnement: development`);
    console.log(`⚡ Socket.io configuré avec CORS: *`);
});
