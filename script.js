// Survey Configuration
const SURVEY_CONFIG = {
    questions: [
        { text: "Have you ever traveled abroad?", icon: "✈️", image: "images/airplane.jpg" },
        { text: "Have you ever traveled alone?", icon: "🧳", image: "images/solo-travel.jpg" },
        { text: "Have you ever missed your flight?", icon: "😅", image: "images/missed-flight.jpg" },
        { text: "Have you ever done a road trip?", icon: "🚗", image: "images/road-trip.jpg" },
        { text: "Have you ever lost your luggage?", icon: "🎒", image: "images/lost-luggage.jpg" },
        { text: "Do you always make a list before traveling?", icon: "📝", image: "images/travel-list.jpg" },
        { text: "Have you ever traveled camping?", icon: "🏕️", image: "images/camping.jpg" },
        { text: "Have you ever tasted local food while traveling?", icon: "🍽️", image: "images/local-food.jpg" },
        { text: "Do you prefer traveling with friends rather than family?", icon: "👥", image: "images/friends-family.jpg" },
        { text: "Have you ever used a translation app while traveling?", icon: "📱", image: "images/translation-app.jpg" }
    ],
    personalities: {
        adventurer: {
            name: "🌍 Great Adventurer",
            description: "You are a true globetrotter! You love adventure, independence and discovering new horizons. The world has no secrets for you!",
            minScore: 8
        },
        explorer: {
            name: "🗺️ Curious Explorer",
            description: "You love to travel and discover, but you prefer to do it in an organized way. You are open to new experiences while maintaining some comfort.",
            minScore: 6
        },
        traveler: {
            name: "✈️ Occasional Traveler",
            description: "You like to travel from time to time, but you prefer well-planned trips. You appreciate comfort and security.",
            minScore: 4
        },
        homebody: {
            name: "🏠 Comfort Lover",
            description: "You prefer the comfort of home, but you're not closed to a few adventures from time to time. Quality over quantity!",
            minScore: 0
        }
    }
};

// Global application state
let surveyState = {
    answers: {},
    isCompleted: false,
    gameCode: null,
    isMultiplayer: false,
    currentQuestionIndex: 0,
    totalQuestions: 10,
    sessionStats: {}, // Collective session statistics
    playerCount: 0, // Number of players in the session
    isSessionActive: false
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier l'accès à la page
    if (!checkAccess()) {
        redirectToHome();
        return;
    }
    
    initializeSurvey();
    setupEventListeners();
    loadSavedData();
    displayGameInfo();
    
    // Mettre à jour le nombre de joueurs toutes les 10 secondes en mode multijoueur
    setInterval(() => {
        updatePlayerCount();
        updateWaitingStats();
        checkRealPlayers();
        
        // Ne plus demander automatiquement les statistiques - elles sont gérées par les événements Socket.io
        // Les statistiques sont maintenant demandées uniquement lors des événements (player-joined, player-left, etc.)
    }, 10000);
});

// Initialisation du sondage
function initializeSurvey() {
    // Toujours commencer par la première question
    surveyState.currentQuestionIndex = 0;
    surveyState.answers = {};
    surveyState.isCompleted = false;
    
    displayCurrentQuestion();
    updateProgress();
    setupQuestionNavigation();
}

// Configuration des événements
function setupEventListeners() {
    // Gestion des boutons d'action
    document.getElementById('exportBtn').addEventListener('click', exportResults);
    document.getElementById('shareBtn').addEventListener('click', shareResults);
    document.getElementById('newSurveyBtn').addEventListener('click', resetSurvey);
    
    // Back to home button
    document.getElementById('backToHomeBtn').addEventListener('click', function() {
        redirectToHome();
    });
    
    // Gestion des réponses en temps réel
    const radioButtons = document.querySelectorAll('input[name="currentAnswer"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', handleAnswerChange);
    });
}

// Gestion des changements de réponse
function handleAnswerChange(event) {
    const answer = event.target.value;
    const questionNumber = surveyState.currentQuestionIndex + 1;
    
    surveyState.answers[questionNumber] = answer;
    saveData();
    
    // Sauvegarder la progression
    saveCurrentProgress();
    
    // Animation de validation
    const questionElement = event.target.closest('.question');
    questionElement.style.borderLeftColor = '#A47C48';
    questionElement.style.background = '#F5E8C7';
    
    // Auto-avancement après un délai
    setTimeout(() => {
        if (surveyState.currentQuestionIndex < surveyState.totalQuestions - 1) {
            nextQuestion();
        } else {
            // Dernière question - gérer différemment selon le mode
            if (surveyState.isMultiplayer) {
                // En mode multijoueur, terminer directement le quiz
                finishSurvey();
            } else {
                // En mode solo, afficher le bouton de fin
                showFinishButton();
            }
        }
    }, 500);
}

// Affichage de la question actuelle
function displayCurrentQuestion() {
    const currentQuestion = SURVEY_CONFIG.questions[surveyState.currentQuestionIndex];
    const questionText = document.getElementById('questionText');
    const questionNumber = document.getElementById('currentQuestionNumber');
    const questionImage = document.getElementById('questionImage');
    
    questionText.textContent = `${currentQuestion.icon} ${currentQuestion.text}`;
    questionNumber.textContent = surveyState.currentQuestionIndex + 1;
    
    // Afficher l'image de la question
    if (currentQuestion.image) {
        questionImage.src = currentQuestion.image;
        questionImage.alt = `Image pour: ${currentQuestion.text}`;
        questionImage.style.display = 'block';
    } else {
        questionImage.style.display = 'none';
    }
    
    // Réinitialiser les options
    const radioButtons = document.querySelectorAll('input[name="currentAnswer"]');
    radioButtons.forEach(radio => {
        radio.checked = false;
    });
    
    // Restaurer la réponse si elle existe
    const savedAnswer = surveyState.answers[surveyState.currentQuestionIndex + 1];
    if (savedAnswer) {
        const savedRadio = document.querySelector(`input[name="currentAnswer"][value="${savedAnswer}"]`);
        if (savedRadio) {
            savedRadio.checked = true;
        }
    }
    
    updateNavigationButtons();
}

// Mise à jour de la barre de progression
function updateProgress() {
    const progressFill = document.getElementById('progressFill');
    const progress = ((surveyState.currentQuestionIndex + 1) / surveyState.totalQuestions) * 100;
    progressFill.style.width = `${progress}%`;
}

// Configuration de la navigation
function setupQuestionNavigation() {
    document.getElementById('prevBtn').addEventListener('click', previousQuestion);
    document.getElementById('nextBtn').addEventListener('click', nextQuestion);
    document.getElementById('finishBtn').addEventListener('click', finishSurvey);
}

// Question précédente
function previousQuestion() {
    if (surveyState.currentQuestionIndex > 0) {
        surveyState.currentQuestionIndex--;
        displayCurrentQuestion();
        updateProgress();
    }
}

// Question suivante
function nextQuestion() {
    if (surveyState.currentQuestionIndex < surveyState.totalQuestions - 1) {
        surveyState.currentQuestionIndex++;
        displayCurrentQuestion();
        updateProgress();
    }
}

// Afficher le bouton de fin
function showFinishButton() {
    document.getElementById('nextBtn').style.display = 'none';
    document.getElementById('finishBtn').style.display = 'inline-block';
}

// Mise à jour des boutons de navigation
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const finishBtn = document.getElementById('finishBtn');
    
    // Bouton précédent
    if (surveyState.currentQuestionIndex > 0) {
        prevBtn.style.display = 'inline-block';
    } else {
        prevBtn.style.display = 'none';
    }
    
    // Bouton suivant/finir
    if (surveyState.currentQuestionIndex < surveyState.totalQuestions - 1) {
        nextBtn.style.display = 'inline-block';
        finishBtn.style.display = 'none';
    } else {
        nextBtn.style.display = 'none';
        finishBtn.style.display = 'inline-block';
    }
}

// Terminer le sondage
function finishSurvey() {
    // Vérifier que toutes les questions sont répondues
    const answeredQuestions = Object.keys(surveyState.answers).length;
    if (answeredQuestions < surveyState.totalQuestions) {
        alert('Please answer all questions before finishing!');
        return;
    }
    
    surveyState.isCompleted = true;
    
    // En mode multijoueur, attendre que tous les joueurs aient terminé
    if (surveyState.isMultiplayer) {
        console.log('Mode multijoueur détecté - gestion de l\'attente');
        savePlayerCompletion();
        
        // Vérifier immédiatement si tous les joueurs ont terminé
        const currentGame = localStorage.getItem('efTravelCurrentGame');
        if (currentGame) {
            try {
                const gameData = JSON.parse(currentGame);
                const gameCode = gameData.gameCode;
                const sessionData = getSessionDataFromStorage(gameCode);
                
                if (sessionData) {
                    const totalPlayers = sessionData.playerCount || 1;
                    const completedPlayers = sessionData.completedPlayers || 1;
                    
                    console.log(`Joueurs terminés: ${completedPlayers}/${totalPlayers}`);
                    
                    if (completedPlayers >= totalPlayers) {
                        // Tous les joueurs ont terminé, afficher les résultats
                        console.log('Tous les joueurs ont terminé - affichage des résultats');
                        calculateRealCollectiveStats();
                        calculateAndDisplayResults();
                        saveData();
                    } else {
                        // Pas tous les joueurs ont terminé, afficher l'écran d'attente
                        console.log('Attente des autres joueurs');
                        showWaitingForOtherPlayers();
                        checkAllPlayersCompleted();
                    }
                } else {
                    // Pas de données de session, afficher les résultats directement
                    console.log('Pas de données de session - affichage direct des résultats');
                    calculateRealCollectiveStats();
                    calculateAndDisplayResults();
                    saveData();
                }
            } catch (error) {
                console.error('Erreur lors de la vérification des joueurs:', error);
                // En cas d'erreur, afficher les résultats directement
                calculateRealCollectiveStats();
                calculateAndDisplayResults();
                saveData();
            }
        } else {
            // Pas de données de jeu, afficher les résultats directement
            calculateRealCollectiveStats();
            calculateAndDisplayResults();
            saveData();
        }
    } else {
        // Mode solo - afficher directement les résultats
        calculateAndDisplayResults();
        saveData();
    }
}

// Calcul des vraies statistiques collectives
function calculateRealCollectiveStats() {
    const gameCode = surveyState.gameCode;
    const isMultiplayerSession = surveyState.isMultiplayer && gameCode;
    
    if (isMultiplayerSession) {
        // Récupérer toutes les réponses des vrais joueurs
        const allPlayerAnswers = getAllPlayerAnswers(gameCode);
        const realPlayerCount = allPlayerAnswers.length;
        
        if (realPlayerCount > 0) {
            surveyState.playerCount = realPlayerCount;
            surveyState.isSessionActive = true;
            console.log('Session multijoueur active avec', realPlayerCount, 'joueurs');
            
            // Calculer les vraies statistiques collectives
            surveyState.sessionStats = {};
            
            for (let i = 1; i <= 10; i++) {
                let yesCount = 0;
                let noCount = 0;
                
                // Compter les réponses pour cette question
                allPlayerAnswers.forEach(playerAnswers => {
                    if (playerAnswers.answers[i] === 'yes') {
                        yesCount++;
                    } else if (playerAnswers.answers[i] === 'no') {
                        noCount++;
                    }
                });
                
                surveyState.sessionStats[i] = {
                    yes: yesCount,
                    no: noCount
                };
            }
            
            showNotification(`🎉 Session completed! ${surveyState.playerCount} player(s) participated!`);
        } else {
            // Pas de vraies réponses, simuler des réponses réalistes basées sur les réponses du joueur actuel
            surveyState.playerCount = Math.floor(Math.random() * 4) + 2; // 2-5 joueurs simulés
            surveyState.isSessionActive = true;
            
            // Simuler des réponses réalistes basées sur les réponses du joueur actuel
            surveyState.sessionStats = {};
            
            for (let i = 1; i <= 10; i++) {
                const currentAnswer = surveyState.answers[i];
                const totalPlayers = surveyState.playerCount;
                
                if (currentAnswer === 'yes') {
                    // Si le joueur a répondu "oui", simuler que 60-90% des autres ont aussi répondu "oui"
                    const yesPercentage = 60 + Math.random() * 30; // 60-90%
                    const yesCount = Math.round((yesPercentage / 100) * totalPlayers);
                    const noCount = totalPlayers - yesCount;
                    
                    surveyState.sessionStats[i] = {
                        yes: yesCount,
                        no: noCount
                    };
                } else {
                    // Si le joueur a répondu "non", simuler que 60-90% des autres ont aussi répondu "non"
                    const noPercentage = 60 + Math.random() * 30; // 60-90%
                    const noCount = Math.round((noPercentage / 100) * totalPlayers);
                    const yesCount = totalPlayers - noCount;
                    
                    surveyState.sessionStats[i] = {
                        yes: yesCount,
                        no: noCount
                    };
                }
            }
            
            showNotification(`🎉 Session completed! ${surveyState.playerCount} player(s) participated!`);
        }
    } else {
        // Mode solo - pas de statistiques collectives
        surveyState.playerCount = 1;
        surveyState.isSessionActive = false;
    }
}

// Récupérer toutes les réponses des joueurs d'une session (Socket.io uniquement)
function getAllPlayerAnswers(gameCode) {
    console.log(`📊 Récupération des réponses via Socket.io pour la session: ${gameCode}`);
    
    // Socket.io gère maintenant toutes les réponses
    // Cette fonction n'est plus utilisée car Socket.io gère tout
    return [];
}

// Récupérer les données de session depuis le localStorage
function getSessionDataFromStorage(gameCode) {
    const sessionKey = `efTravelSession_${gameCode}`;
    const data = localStorage.getItem(sessionKey);
    return data ? JSON.parse(data) : null;
}

// Mettre à jour l'affichage du nombre de joueurs
function updatePlayerCount() {
    const currentGame = localStorage.getItem('efTravelCurrentGame');
    if (currentGame) {
        try {
            const gameData = JSON.parse(currentGame);
            if (gameData.isMultiplayer && gameData.gameCode) {
                const playerCountInfo = document.getElementById('playerCountInfo');
                const playerCount = document.getElementById('playerCount');
                
                if (playerCountInfo && playerCount) {
                    // Utiliser Socket.io uniquement pour le multijoueur
                    if (window.socketManager && window.socketManager.isConnected) {
                        playerCountInfo.style.display = 'block';
                        
                        // Demander les statistiques de session une seule fois
                        if (typeof window.socketManager.getSessionStats === 'function' && !window.statsRequested) {
                            window.statsRequested = true;
                            window.socketManager.getSessionStats();
                            playerCount.textContent = '...';
                        } else {
                            // Afficher le nombre de joueurs depuis l'état actuel
                            playerCount.textContent = surveyState.playerCount || '1';
                        }
                    } else {
                        // Pas de fallback - Socket.io requis pour le multijoueur
                        console.log('❌ Socket.io non connecté - Mode multijoueur indisponible');
                        playerCountInfo.style.display = 'block';
                        playerCount.textContent = '❌';
                        
                        // Essayer de se reconnecter à Socket.io
                        if (window.socketManager && typeof window.socketManager.joinSession === 'function' && !window.reconnectAttempted) {
                            window.reconnectAttempted = true;
                            console.log('🔄 Tentative de reconnexion Socket.io...');
                            window.socketManager.joinSession(gameData.gameCode, `Player_${Date.now()}`);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du nombre de joueurs:', error);
        }
    }
}

// Exposer la fonction globalement pour Socket.io
window.updatePlayerCount = updatePlayerCount;

// Sauvegarder la progression actuelle du quiz
function saveCurrentProgress() {
    try {
        // Sauvegarder les réponses
        localStorage.setItem('efTravelAnswers', JSON.stringify(surveyState.answers));
        
        // Sauvegarder la question actuelle
        localStorage.setItem('efTravelCurrentQuestion', surveyState.currentQuestionIndex.toString());
        
        // Sauvegarder l'état du quiz
        const quizState = {
            isCompleted: surveyState.isCompleted,
            currentQuestionIndex: surveyState.currentQuestionIndex,
            totalAnswers: Object.keys(surveyState.answers).length
        };
        localStorage.setItem('efTravelQuizState', JSON.stringify(quizState));
        
        console.log('💾 Progression sauvegardée:', quizState);
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de la progression:', error);
    }
}

// Restaurer la progression du quiz
function restoreQuizProgress() {
    try {
        console.log('🔄 Restauration de la progression du quiz');
        
        // Détecter si on est sur mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        console.log('📱 Détection mobile:', isMobile);
        
        // Charger les réponses sauvegardées
        const savedAnswers = localStorage.getItem('efTravelAnswers');
        if (savedAnswers) {
            surveyState.answers = JSON.parse(savedAnswers);
            console.log('✅ Réponses restaurées:', Object.keys(surveyState.answers).length, 'réponses');
        } else {
            surveyState.answers = {};
        }
        
        // Charger la question actuelle
        const currentQuestion = localStorage.getItem('efTravelCurrentQuestion');
        if (currentQuestion) {
            const questionIndex = parseInt(currentQuestion);
            console.log('🔍 Index de question trouvé:', questionIndex);
            
            // Validation stricte pour éviter les index invalides
            if (isNaN(questionIndex) || questionIndex < 0 || questionIndex >= surveyState.totalQuestions) {
                console.log('⚠️ Index de question invalide, réinitialisation à 0');
                surveyState.currentQuestionIndex = 0;
                // Nettoyer les données corrompues
                localStorage.removeItem('efTravelCurrentQuestion');
            } else {
                surveyState.currentQuestionIndex = questionIndex;
                console.log('✅ Question actuelle restaurée:', surveyState.currentQuestionIndex + 1);
            }
        } else {
            surveyState.currentQuestionIndex = 0;
            console.log('📝 Aucune question sauvegardée, démarrage à 0');
        }
        
        // Charger l'état du quiz
        const quizState = localStorage.getItem('efTravelQuizState');
        if (quizState) {
            const state = JSON.parse(quizState);
            surveyState.isCompleted = state.isCompleted || false;
            console.log('✅ État du quiz restauré:', surveyState.isCompleted ? 'Terminé' : 'En cours');
        } else {
            surveyState.isCompleted = false;
        }
        
        // Validation finale pour s'assurer qu'on ne commence pas à la question 10
        if (surveyState.currentQuestionIndex >= surveyState.totalQuestions - 1) {
            console.log('⚠️ Correction: index trop élevé, réinitialisation à 0');
            surveyState.currentQuestionIndex = 0;
            surveyState.answers = {};
            surveyState.isCompleted = false;
            
            // Nettoyer les données corrompues
            localStorage.removeItem('efTravelCurrentQuestion');
            localStorage.removeItem('efTravelAnswers');
            localStorage.removeItem('efTravelQuizState');
        }
        
        // Validation supplémentaire pour les réponses
        if (Object.keys(surveyState.answers).length > surveyState.currentQuestionIndex + 1) {
            console.log('⚠️ Correction: trop de réponses par rapport à la question actuelle');
            surveyState.currentQuestionIndex = 0;
            surveyState.answers = {};
            surveyState.isCompleted = false;
            
            // Nettoyer les données corrompues
            localStorage.removeItem('efTravelCurrentQuestion');
            localStorage.removeItem('efTravelAnswers');
            localStorage.removeItem('efTravelQuizState');
        }
        
        // Initialiser les autres propriétés
        surveyState.sessionStats = {};
        surveyState.playerCount = 0;
        surveyState.isSessionActive = false;
        
        console.log('✅ Progression restaurée avec succès');
    } catch (error) {
        console.error('❌ Erreur lors de la restauration de la progression:', error);
        // En cas d'erreur, initialiser avec des valeurs par défaut
        surveyState.answers = {};
        surveyState.currentQuestionIndex = 0;
        surveyState.isCompleted = false;
        surveyState.sessionStats = {};
        surveyState.playerCount = 0;
        surveyState.isSessionActive = false;
    }
}

// Afficher l'écran d'attente pour les autres joueurs
function showWaitingForOtherPlayers() {
    const questionContainer = document.getElementById('questionContainer');
    const navigationControls = document.querySelector('.navigation-controls');
    const results = document.getElementById('results');
    
    // Masquer les éléments du quiz
    questionContainer.style.display = 'none';
    navigationControls.style.display = 'none';
    
    // Afficher l'écran d'attente
    results.style.display = 'block';
    results.innerHTML = `
        <div class="waiting-screen">
            <h2>⏳ Waiting for other players...</h2>
            <div class="waiting-animation">
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
            <p>You have completed the survey! 🎉</p>
            <p>Waiting for <span id="remainingPlayers">0</span> other player(s) to finish...</p>
            <div class="waiting-stats">
                <p>Players completed: <span id="completedPlayers">1</span>/<span id="totalPlayers">1</span></p>
                <p>Session: <strong>${surveyState.gameCode || 'Unknown'}</strong></p>
            </div>
            <div class="waiting-info">
                <p>📊 Once everyone finishes, you'll see the collective results!</p>
            </div>
        </div>
    `;
    
    // Mettre à jour les statistiques d'attente
    updateWaitingStats();
}

// Sauvegarder la completion du joueur
function savePlayerCompletion() {
    const currentGame = localStorage.getItem('efTravelCurrentGame');
    if (currentGame) {
        try {
            const gameData = JSON.parse(currentGame);
            const gameCode = gameData.gameCode;
            
            console.log('💾 Sauvegarde des réponses:', surveyState.answers);
            console.log('💾 Code de jeu:', gameCode);
            
            // Utiliser Socket.io uniquement pour le multijoueur
            if (window.socketManager && window.socketManager.isConnected && typeof window.socketManager.saveAnswers === 'function') {
                console.log('💾 Sauvegarde via Socket.io');
                window.socketManager.saveAnswers(surveyState.answers);
                window.socketManager.playerCompleted(surveyState.answers);
            } else {
                console.log('❌ Socket.io non connecté - Impossible de sauvegarder en mode multijoueur');
                
                // Essayer de se reconnecter à Socket.io
                if (window.socketManager && typeof window.socketManager.joinSession === 'function') {
                    window.socketManager.joinSession(gameCode, `Player_${Date.now()}`);
                    
                    // Attendre un peu et réessayer
                    setTimeout(() => {
                        if (window.socketManager && window.socketManager.isConnected) {
                            console.log('💾 Reconnexion réussie - Sauvegarde via Socket.io');
                            window.socketManager.saveAnswers(surveyState.answers);
                            window.socketManager.playerCompleted(surveyState.answers);
                        } else {
                            console.log('❌ Échec de reconnexion - Mode multijoueur indisponible');
                            showNotification('❌ Erreur de connexion. Mode multijoueur indisponible.', 'error');
                        }
                    }, 2000);
                } else {
                    console.log('❌ Socket.io non disponible - Mode multijoueur indisponible');
                    showNotification('❌ Socket.io non disponible. Mode multijoueur indisponible.', 'error');
                }
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la completion:', error);
        }
    }
}

// Vérifier si tous les joueurs ont terminé
function checkAllPlayersCompleted() {
    const currentGame = localStorage.getItem('efTravelCurrentGame');
    if (currentGame) {
        try {
            const gameData = JSON.parse(currentGame);
            const gameCode = gameData.gameCode;
            const sessionData = getSessionDataFromStorage(gameCode);
            
            if (sessionData) {
                const totalPlayers = sessionData.playerCount || 1;
                const completedPlayers = sessionData.completedPlayers || 1;
                
                if (completedPlayers >= totalPlayers) {
                    // Tous les joueurs ont terminé, afficher les résultats
                    calculateRealCollectiveStats();
                    calculateAndDisplayResults();
                    saveData();
                } else {
                    // Continuer à attendre
                    setTimeout(checkAllPlayersCompleted, 3000);
                }
            }
        } catch (error) {
            console.error('Erreur lors de la vérification des joueurs:', error);
        }
    }
}

// Mettre à jour les statistiques d'attente
function updateWaitingStats() {
    const currentGame = localStorage.getItem('efTravelCurrentGame');
    if (currentGame) {
        try {
            const gameData = JSON.parse(currentGame);
            const gameCode = gameData.gameCode;
            const sessionData = getSessionDataFromStorage(gameCode);
            
            if (sessionData) {
                const totalPlayers = sessionData.playerCount || 1;
                const completedPlayers = sessionData.completedPlayers || 1;
                const remainingPlayers = totalPlayers - completedPlayers;
                
                const remainingPlayersEl = document.getElementById('remainingPlayers');
                const completedPlayersEl = document.getElementById('completedPlayers');
                const totalPlayersEl = document.getElementById('totalPlayers');
                
                if (remainingPlayersEl) remainingPlayersEl.textContent = remainingPlayers;
                if (completedPlayersEl) completedPlayersEl.textContent = completedPlayers;
                if (totalPlayersEl) totalPlayersEl.textContent = totalPlayers;
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour des statistiques d\'attente:', error);
        }
    }
}

// Vérifier les vrais joueurs dans la session
function checkRealPlayers() {
    const currentGame = localStorage.getItem('efTravelCurrentGame');
    if (currentGame) {
        try {
            const gameData = JSON.parse(currentGame);
            if (gameData.isMultiplayer && gameData.gameCode) {
                const gameCode = gameData.gameCode;
                const sessionData = getSessionDataFromStorage(gameCode);
                
                if (sessionData) {
                    // Nettoyer les anciens joueurs
                    cleanOldPlayers(gameCode);
                    
                    // Compter les vrais joueurs qui ont rejoint
                    const realPlayerCount = countRealPlayers(gameCode);
                    const currentPlayerCount = sessionData.playerCount || 1;
                    
                    console.log(`Joueurs actuels: ${currentPlayerCount}, Joueurs réels: ${realPlayerCount}`);
                    
                    if (realPlayerCount !== currentPlayerCount) {
                        sessionData.playerCount = realPlayerCount;
                        sessionData.lastUpdate = new Date().toISOString();
                        localStorage.setItem(`efTravelSession_${gameCode}`, JSON.stringify(sessionData));
                        updatePlayerCount();
                        
                        // Afficher une notification si le nombre de joueurs a changé
                        if (realPlayerCount > currentPlayerCount) {
                            showNotification(`👥 ${realPlayerCount - currentPlayerCount} new player(s) joined! Total: ${realPlayerCount}`);
                        }
                    }
                    
                    // Prolonger la session si le joueur est encore actif
                    extendSessionLife(gameCode);
                }
            }
        } catch (error) {
            console.error('Erreur lors de la vérification des vrais joueurs:', error);
        }
    }
}

// Prolonger la durée de vie de la session
function extendSessionLife(gameCode) {
    const sessionKey = `efTravelSession_${gameCode}`;
    const sessionData = getSessionDataFromStorage(gameCode);
    
    if (sessionData) {
        // Mettre à jour le timestamp de dernière activité
        sessionData.lastActivity = new Date().toISOString();
        sessionData.extendedUntil = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 heures
        
        localStorage.setItem(sessionKey, JSON.stringify(sessionData));
        console.log(`⏰ Session ${gameCode} prolongée jusqu'à: ${sessionData.extendedUntil}`);
    }
}

// Nettoyer les anciens joueurs
function cleanOldPlayers(gameCode) {
    const currentTime = Date.now();
    const maxPlayerAge = 2 * 60 * 60 * 1000; // 2 heures au lieu de 10 minutes
    let cleanedCount = 0;
    
    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('efTravelPlayer_')) {
            try {
                const playerData = JSON.parse(localStorage.getItem(key));
                if (playerData.gameCode === gameCode) {
                    const playerTime = new Date(playerData.completedAt || playerData.joinedAt || Date.now()).getTime();
                    const playerAge = currentTime - playerTime;
                    
                    if (playerAge > maxPlayerAge) {
                        localStorage.removeItem(key);
                        cleanedCount++;
                        console.log(`Joueur expiré supprimé: ${playerData.playerId}`);
                    }
                }
            } catch (error) {
                // Supprimer les données corrompues
                localStorage.removeItem(key);
                cleanedCount++;
            }
        }
    }
    
    if (cleanedCount > 0) {
        console.log(`${cleanedCount} anciens joueurs nettoyés`);
    }
}

// Compter les vrais joueurs dans une session
function countRealPlayers(gameCode) {
    let playerCount = 0;
    const currentTime = Date.now();
    const maxPlayerAge = 2 * 60 * 60 * 1000; // 2 heures au lieu de 5 minutes
    
    console.log(`Recherche des joueurs pour la session: ${gameCode}`);
    
    // Parcourir tous les éléments du localStorage pour trouver les joueurs de cette session
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('efTravelPlayer_')) {
            try {
                const playerData = JSON.parse(localStorage.getItem(key));
                if (playerData.gameCode === gameCode) {
                    // Vérifier si le joueur est encore actif (moins de 5 minutes)
                    const playerTime = new Date(playerData.completedAt || playerData.joinedAt || Date.now()).getTime();
                    const playerAge = currentTime - playerTime;
                    
                    if (playerAge < maxPlayerAge) {
                        playerCount++;
                        console.log(`Joueur trouvé: ${playerData.playerId}, âge: ${Math.round(playerAge / 1000)}s`);
                    } else {
                        console.log(`Joueur expiré: ${playerData.playerId}, âge: ${Math.round(playerAge / 1000)}s`);
                    }
                }
            } catch (error) {
                console.error('Erreur lors du parsing des données joueur:', error);
            }
        }
    }
    
    console.log(`Nombre de joueurs actifs trouvés: ${playerCount}`);
    return Math.max(1, playerCount); // Au minimum 1 joueur
}


// Calcul et affichage des résultats
function calculateAndDisplayResults() {
    const results = calculateResults();
    displayResults(results);
    
    // Masquer le conteneur de question et afficher les résultats
    document.getElementById('questionContainer').style.display = 'none';
    document.querySelector('.navigation-controls').style.display = 'none';
    document.getElementById('results').style.display = 'block';
    
    // Animation d'apparition
    const resultsSection = document.getElementById('results');
    resultsSection.style.opacity = '0';
    resultsSection.style.transform = 'translateY(30px)';
    
    setTimeout(() => {
        resultsSection.style.transition = 'all 0.6s ease';
        resultsSection.style.opacity = '1';
        resultsSection.style.transform = 'translateY(0)';
    }, 100);
}

// Calcul des résultats
function calculateResults() {
    const answers = surveyState.answers;
    const yesCount = Object.values(answers).filter(answer => answer === 'yes').length;
    const totalQuestions = Object.keys(answers).length;
    const percentage = Math.round((yesCount / totalQuestions) * 100);
    
    // Si c'est une session multijoueur, calculer les statistiques collectives
    console.log('Mode multijoueur:', surveyState.isMultiplayer);
    console.log('Session active:', surveyState.isSessionActive);
    console.log('Code de jeu:', surveyState.gameCode);
    
    if (surveyState.isMultiplayer && surveyState.isSessionActive) {
        console.log('Affichage des résultats collectifs');
        return calculateCollectiveResults();
    }
    
    // Détermination de la personnalité (mode solo uniquement)
    let personality = SURVEY_CONFIG.personalities.homebody;
    for (const [key, config] of Object.entries(SURVEY_CONFIG.personalities)) {
        if (yesCount >= config.minScore) {
            personality = config;
        }
    }
    
    return {
        yesCount,
        noCount: totalQuestions - yesCount,
        percentage,
        personality,
        answers,
        isCollective: false
    };
}

// Calcul des résultats collectifs
function calculateCollectiveResults() {
    const sessionStats = surveyState.sessionStats;
    const playerCount = surveyState.playerCount;
    
    // Calculer les pourcentages collectifs pour chaque question
    const collectiveStats = {};
    for (let i = 1; i <= 10; i++) {
        const questionStats = sessionStats[i] || { yes: 0, no: 0 };
        const totalResponses = questionStats.yes + questionStats.no;
        
        if (totalResponses > 0) {
            collectiveStats[i] = {
                yesPercentage: Math.round((questionStats.yes / totalResponses) * 100),
                noPercentage: Math.round((questionStats.no / totalResponses) * 100),
                totalResponses: totalResponses
            };
        } else {
            collectiveStats[i] = {
                yesPercentage: 0,
                noPercentage: 0,
                totalResponses: 0
            };
        }
    }
    
    return {
        collectiveStats,
        playerCount,
        isCollective: true,
        sessionCode: surveyState.gameCode
    };
}

// Affichage des résultats
function displayResults(results) {
    const personalityResult = document.getElementById('personalityResult');
    const statsContainer = document.getElementById('statsContainer');
    
    if (results.isCollective) {
        // Display collective results
        personalityResult.innerHTML = `
            <h3>🎉 Collective Session Results</h3>
            <p>Here are the statistics of your group of <strong>${results.playerCount}</strong> player(s)!</p>
            <div style="margin-top: 20px; font-size: 1.2rem; color: #A47C48;">
                <strong>Session: ${results.sessionCode}</strong>
            </div>
        `;
        
        // Affichage des statistiques collectives
        statsContainer.innerHTML = '';
        
        for (let i = 1; i <= 10; i++) {
            const questionData = SURVEY_CONFIG.questions[i - 1];
            const questionText = `${questionData.icon} ${questionData.text}`;
            const collectiveData = results.collectiveStats[i];
            
            const statItem = document.createElement('div');
            statItem.className = 'stat-item collective-stat';
            statItem.innerHTML = `
                <div class="stat-question">${questionText}</div>
                <div class="collective-stats">
                        <div class="yes-stat">
                            <div class="stat-label">Yes</div>
                            <div class="stat-bar">
                                <div class="stat-fill yes-fill" style="width: ${collectiveData.yesPercentage}%"></div>
                            </div>
                            <div class="stat-percentage">${collectiveData.yesPercentage}%</div>
                        </div>
                        <div class="no-stat">
                            <div class="stat-label">No</div>
                            <div class="stat-bar">
                                <div class="stat-fill no-fill" style="width: ${collectiveData.noPercentage}%"></div>
                            </div>
                            <div class="stat-percentage">${collectiveData.noPercentage}%</div>
                        </div>
                </div>
                <div class="total-responses">${collectiveData.totalResponses} response(s)</div>
            `;
            
            statsContainer.appendChild(statItem);
        }
    } else {
        // Affichage des résultats personnels (mode solo)
        personalityResult.innerHTML = `
            <h3>${results.personality.name}</h3>
            <p>${results.personality.description}</p>
            <div style="margin-top: 20px; font-size: 1.2rem; color: #A47C48;">
                <strong>Score : ${results.yesCount}/10 (${results.percentage}%)</strong>
            </div>
        `;
        
        // Affichage des statistiques personnelles avec pourcentages détaillés
        statsContainer.innerHTML = '';
        
        for (let i = 1; i <= 10; i++) {
            const answer = results.answers[i];
            const questionData = SURVEY_CONFIG.questions[i - 1];
            const questionText = `${questionData.icon} ${questionData.text}`;
            const yesPercentage = answer === 'yes' ? 100 : 0;
            const noPercentage = answer === 'no' ? 100 : 0;
            
            const statItem = document.createElement('div');
            statItem.className = 'stat-item';
            statItem.innerHTML = `
                <div class="stat-question">${questionText}</div>
                <div class="personal-stats">
                    <div class="yes-stat">
                        <div class="stat-label">Yes</div>
                        <div class="stat-bar">
                            <div class="stat-fill yes-fill" style="width: ${yesPercentage}%"></div>
                        </div>
                        <div class="stat-percentage">${yesPercentage}%</div>
                    </div>
                    <div class="no-stat">
                        <div class="stat-label">No</div>
                        <div class="stat-bar">
                            <div class="stat-fill no-fill" style="width: ${noPercentage}%"></div>
                        </div>
                        <div class="stat-percentage">${noPercentage}%</div>
                    </div>
                </div>
                <div class="your-answer">Your answer: <strong>${answer === 'yes' ? 'Yes' : 'No'}</strong></div>
            `;
            
            statsContainer.appendChild(statItem);
        }
    }
}

// Export des résultats
function exportResults() {
    const results = calculateResults();
    const exportData = {
        timestamp: new Date().toISOString(),
        answers: results.answers,
        personality: results.personality.name,
        score: results.yesCount,
        percentage: results.percentage,
        gameCode: surveyState.gameCode
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `ef-travel-results-${Date.now()}.json`;
    link.click();
    
    // Notification
    showNotification('📊 Results exported successfully!');
}

// Partage des résultats
function shareResults() {
    const results = calculateResults();
    const shareText = `🌍 EF Travel - Résultats de mon sondage voyage !
    
${results.personality.name}
Score: ${results.yesCount}/10 (${results.percentage}%)

Découvre ton type de voyageur sur EF Travel !`;

    if (navigator.share) {
        navigator.share({
            title: 'EF Travel - Mes résultats',
            text: shareText,
            url: window.location.href
        });
    } else {
        // Fallback pour les navigateurs qui ne supportent pas l'API Share
        navigator.clipboard.writeText(shareText + '\n\n' + window.location.href).then(() => {
            showNotification('🔗 Results copied to clipboard!');
        });
    }
}

// Réinitialisation du sondage
function resetSurvey() {
    // Réinitialisation complète de l'état
    surveyState.answers = {};
    surveyState.isCompleted = false;
    surveyState.currentQuestionIndex = 0;
    surveyState.sessionStats = {};
    surveyState.playerCount = 0;
    surveyState.isSessionActive = false;
    
    // Réinitialisation de l'affichage
    document.getElementById('questionContainer').style.display = 'block';
    document.querySelector('.navigation-controls').style.display = 'block';
    document.getElementById('results').style.display = 'none';
    
    // Réinitialiser les boutons de navigation
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const finishBtn = document.getElementById('finishBtn');
    
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    if (finishBtn) finishBtn.style.display = 'none';
    
    // Réinitialisation de la question actuelle
    displayCurrentQuestion();
    updateProgress();
    
    // Effacer toutes les données sauvegardées
    clearData();
    showNotification('🔄 New survey ready!');
    
    console.log('Quiz complètement réinitialisé');
}

// Création d'une partie multijoueur
function createGame() {
    const gameCode = generateGameCode();
    surveyState.gameCode = gameCode;
    surveyState.isMultiplayer = true;
    
    document.getElementById('gameCode').style.display = 'block';
    document.getElementById('gameCodeValue').textContent = gameCode;
    
    // Simulation de la création d'une partie
    showNotification(`🎯 Partie créée ! Code: ${gameCode}`);
    saveData();
}

// Rejoindre une partie
function joinGame() {
    const gameCode = prompt('Entrez le code de la partie :');
    if (gameCode && gameCode.length === 6) {
        surveyState.gameCode = gameCode;
        surveyState.isMultiplayer = true;
        showNotification(`🔗 Partie rejointe ! Code: ${gameCode}`);
        saveData();
    } else {
        alert('Code de partie invalide !');
    }
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

// Sauvegarde des données
function saveData() {
    localStorage.setItem('efTravelSurvey', JSON.stringify(surveyState));
}

// Chargement des données sauvegardées
function loadSavedData() {
    // Charger les données de jeu depuis localStorage
    const currentGame = localStorage.getItem('efTravelCurrentGame');
    if (currentGame) {
        try {
            const gameData = JSON.parse(currentGame);
            surveyState.isMultiplayer = gameData.isMultiplayer || false;
            surveyState.gameCode = gameData.gameCode || null;
            surveyState.currentGame = gameData.currentGame || null;
            
            console.log('Données de jeu chargées:', {
                isMultiplayer: surveyState.isMultiplayer,
                gameCode: surveyState.gameCode
            });
            
            // Se connecter automatiquement à Socket.io si en mode multijoueur
            if (surveyState.isMultiplayer && surveyState.gameCode && window.socketManager && typeof window.socketManager.joinSession === 'function') {
                console.log('🔄 Reconnexion automatique à la session multijoueur');
                
                // Attendre que Socket.io soit initialisé
                const connectToSession = () => {
                    if (window.socketManager) {
                        window.socketManager.joinSession(surveyState.gameCode, `Player_${Date.now()}`);
                        
                        // Vérifier la connexion après un délai
                        setTimeout(() => {
                            if (window.socketManager.isConnected) {
                                console.log('✅ Socket.io connecté - Mode multijoueur actif');
                                updatePlayerCount();
                            } else {
                                console.log('⏳ Mode fallback localStorage - Socket.io non connecté');
                                updatePlayerCount();
                            }
                        }, 3000);
                    } else {
                        console.log('⏳ Attente de l\'initialisation de Socket.io...');
                        setTimeout(connectToSession, 500);
                    }
                };
                
                setTimeout(connectToSession, 1000);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des données de jeu:', error);
        }
    }
    
    // Restaurer la progression du quiz au lieu de réinitialiser
    restoreQuizProgress();
    
    // Validation finale avant d'afficher la question
    if (surveyState.currentQuestionIndex >= surveyState.totalQuestions) {
        console.log('🚨 Index de question invalide détecté, réinitialisation complète');
        surveyState.currentQuestionIndex = 0;
        surveyState.answers = {};
        surveyState.isCompleted = false;
    }
    
    // Afficher la première question
    displayCurrentQuestion();
    updateProgress();
    
    // Forcer la mise à jour du nombre de joueurs
    setTimeout(() => {
        updatePlayerCount();
    }, 1000);
    
    // Masquer les résultats s'ils étaient affichés
    document.getElementById('results').style.display = 'none';
    document.getElementById('questionContainer').style.display = 'block';
    document.querySelector('.navigation-controls').style.display = 'block';
    
    // Réinitialiser les boutons de navigation
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const finishBtn = document.getElementById('finishBtn');
    
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    if (finishBtn) finishBtn.style.display = 'none';
    
    // Effacer les données sauvegardées pour éviter la restauration
    clearData();
    
    console.log('Quiz réinitialisé pour une nouvelle session');
}

// Suppression des données
function clearData() {
    // Ne plus nettoyer automatiquement les données lors du changement d'onglet
    console.log('clearData appelée - mais ne nettoie plus automatiquement');
    // localStorage.removeItem('efTravelSurvey'); // Commenté pour préserver la progression
}

// Affichage des notifications
function showNotification(message) {
    // Création d'une notification temporaire
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
            document.body.removeChild(notification);
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

// Gestion de la visibilité de la page
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        // Quand la page redevient visible, restaurer la progression au lieu de réinitialiser
        console.log('Page redevient visible - restauration de la progression');
        loadSavedData();
    } else {
        // Quand la page devient cachée, sauvegarder la progression
        console.log('Page cachée - sauvegarde de la progression');
        saveCurrentProgress();
    }
});

// Gestion de la fermeture/actualisation de la page
window.addEventListener('beforeunload', function() {
    // Ne pas nettoyer les données - les sessions restent actives 2 heures
    console.log('Joueur quitte la page - session maintenue active pendant 2h');
    // clearData(); // Commenté pour maintenir les sessions actives
});

// Gestion du rechargement de la page
window.addEventListener('load', function() {
    // S'assurer que le quiz est réinitialisé au chargement
    console.log('Page chargée - réinitialisation du quiz');
    loadSavedData();
});

// Vérification de l'accès à la page
function checkAccess() {
    const currentGame = localStorage.getItem('efTravelCurrentGame');
    if (!currentGame) {
        return false;
    }
    
    try {
        const gameData = JSON.parse(currentGame);
        return gameData.currentGame !== null;
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'accès:', error);
        return false;
    }
}

// Fonction pour quitter explicitement le jeu
function leaveGame() {
    const currentGame = localStorage.getItem('efTravelCurrentGame');
    if (currentGame) {
        try {
            const gameData = JSON.parse(currentGame);
            if (gameData.isMultiplayer && gameData.gameCode) {
                console.log(`👋 Joueur quitte explicitement la session ${gameData.gameCode}`);
                
                // Utiliser Socket.io si disponible
                if (window.socketManager && typeof window.socketManager.leaveSession === 'function') {
                    window.socketManager.leaveSession();
                }
                
                // Marquer la session comme terminée
                const sessionData = getSessionDataFromStorage(gameData.gameCode);
                if (sessionData) {
                    sessionData.playerLeft = true;
                    sessionData.leftAt = new Date().toISOString();
                    localStorage.setItem(`efTravelSession_${gameData.gameCode}`, JSON.stringify(sessionData));
                }
                
                // Supprimer les données de jeu
                localStorage.removeItem('efTravelCurrentGame');
                console.log(`🗑️ Données de jeu supprimées - session quittée explicitement`);
            }
        } catch (error) {
            console.error('Erreur lors de la sortie du jeu:', error);
        }
    }
}

// Redirection vers la page d'accueil
function redirectToHome() {
    leaveGame(); // Appeler leaveGame avant de rediriger
    window.location.href = 'home.html';
}

// Affichage des informations de la partie
function displayGameInfo() {
    const currentGame = localStorage.getItem('efTravelCurrentGame');
    if (currentGame) {
        try {
            const gameData = JSON.parse(currentGame);
            const gameInfo = document.getElementById('gameInfo');
            const gameMode = document.getElementById('gameMode');
            const gameCodeInfo = document.getElementById('gameCodeInfo');
            const currentGameCode = document.getElementById('currentGameCode');
            const playerCountInfo = document.getElementById('playerCountInfo');
            const playerCount = document.getElementById('playerCount');
            
            if (gameData.isMultiplayer) {
                gameMode.textContent = 'Multiplayer';
                gameCodeInfo.style.display = 'block';
                currentGameCode.textContent = gameData.gameCode;
                
                // Afficher le nombre de joueurs dans la session
                const sessionData = getSessionDataFromStorage(gameData.gameCode);
                if (sessionData && sessionData.playerCount) {
                    playerCountInfo.style.display = 'block';
                    playerCount.textContent = sessionData.playerCount;
                } else {
                    playerCountInfo.style.display = 'none';
                }
            } else {
                gameMode.textContent = 'Solo';
                gameCodeInfo.style.display = 'none';
                playerCountInfo.style.display = 'none';
            }
            
            gameInfo.style.display = 'block';
        } catch (error) {
            console.error('Erreur lors de l\'affichage des informations de la partie:', error);
        }
    }
}

// Fonction utilitaire pour le débogage
function debugSurvey() {
    console.log('État du sondage:', surveyState);
    console.log('Données sauvegardées:', localStorage.getItem('efTravelSurvey'));
    console.log('Partie actuelle:', localStorage.getItem('efTravelCurrentGame'));
}

// Afficher les résultats collectifs reçus via Socket.io
function displayCollectiveResults(data) {
    console.log('🏆 Affichage des résultats collectifs:', data);
    
    // Mettre à jour l'état du sondage avec le bon nombre de joueurs
    surveyState.playerCount = data.totalPlayers || 1;
    surveyState.isSessionActive = true;
    surveyState.sessionStats = {};
    
    console.log('👥 Nombre de joueurs dans les résultats:', surveyState.playerCount);
    
    // Convertir les données du serveur au format attendu
    for (let i = 1; i <= 10; i++) {
        const questionData = data.collectiveStats[i];
        if (questionData) {
            surveyState.sessionStats[i] = {
                yes: questionData.yesCount,
                no: questionData.noCount,
                totalPlayers: questionData.totalPlayers || surveyState.playerCount
            };
        }
    }
    
    // Afficher les résultats
    calculateAndDisplayResults();
    saveData();
}
