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
    
    // Mettre à jour le nombre de joueurs toutes les 5 secondes en mode multijoueur
    setInterval(() => {
        updatePlayerCount();
        updateWaitingStats();
        simulateNewPlayers();
    }, 5000);
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
    
    // Animation de validation
    const questionElement = event.target.closest('.question');
    questionElement.style.borderLeftColor = '#A47C48';
    questionElement.style.background = '#F5E8C7';
    
    // Auto-avancement après un délai
    setTimeout(() => {
        if (surveyState.currentQuestionIndex < surveyState.totalQuestions - 1) {
            nextQuestion();
        } else {
            showFinishButton();
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
        showWaitingForOtherPlayers();
        savePlayerCompletion();
        checkAllPlayersCompleted();
    } else {
        // Mode solo - afficher directement les résultats
        calculateAndDisplayResults();
        saveData();
    }
}

// Simulation des statistiques collectives (en attendant un vrai serveur)
function simulateCollectiveStats() {
    // Détecter si c'est vraiment une session multijoueur
    const gameCode = surveyState.gameCode;
    const isMultiplayerSession = surveyState.isMultiplayer && gameCode;
    
    if (isMultiplayerSession) {
        // Récupérer les données de session réelles
        const sessionData = getSessionDataFromStorage(gameCode);
        
        if (sessionData && sessionData.playerCount > 1) {
            // Vraie session multijoueur avec plusieurs joueurs
            surveyState.playerCount = sessionData.playerCount;
            surveyState.isSessionActive = true;
            
            // Simuler les statistiques collectives basées sur le nombre réel de joueurs
            surveyState.sessionStats = {};
            
            for (let i = 1; i <= 10; i++) {
                const totalResponses = surveyState.playerCount;
                const yesResponses = Math.floor(Math.random() * (totalResponses + 1));
                const noResponses = totalResponses - yesResponses;
                
                surveyState.sessionStats[i] = {
                    yes: yesResponses,
                    no: noResponses
                };
            }
            
            showNotification(`🎉 Session completed! ${surveyState.playerCount} player(s) participated!`);
        } else {
            // Session avec un seul joueur - simuler comme si c'était multijoueur
            surveyState.playerCount = Math.floor(Math.random() * 3) + 2; // 2-4 joueurs simulés
            surveyState.isSessionActive = true;
            
            // Simuler les statistiques collectives
            surveyState.sessionStats = {};
            
            for (let i = 1; i <= 10; i++) {
                const totalResponses = surveyState.playerCount;
                const yesResponses = Math.floor(Math.random() * (totalResponses + 1));
                const noResponses = totalResponses - yesResponses;
                
                surveyState.sessionStats[i] = {
                    yes: yesResponses,
                    no: noResponses
                };
            }
            
            showNotification(`🎉 Session completed! ${surveyState.playerCount} player(s) participated!`);
        }
    } else {
        // Mode solo - pas de statistiques collectives
        surveyState.playerCount = 1;
        surveyState.isSessionActive = false;
    }
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
                const sessionData = getSessionDataFromStorage(gameData.gameCode);
                const playerCountInfo = document.getElementById('playerCountInfo');
                const playerCount = document.getElementById('playerCount');
                
                if (sessionData && sessionData.playerCount) {
                    playerCountInfo.style.display = 'block';
                    playerCount.textContent = sessionData.playerCount;
                } else {
                    playerCountInfo.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du nombre de joueurs:', error);
        }
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
            
            // Sauvegarder les réponses du joueur
            const playerKey = `efTravelPlayer_${gameCode}_${Date.now()}`;
            localStorage.setItem(playerKey, JSON.stringify({
                gameCode: gameCode,
                answers: surveyState.answers,
                completedAt: new Date().toISOString(),
                playerId: Date.now()
            }));
            
            // Mettre à jour les données de session
            const sessionData = getSessionDataFromStorage(gameCode);
            if (sessionData) {
                sessionData.completedPlayers = (sessionData.completedPlayers || 0) + 1;
                sessionData.lastCompletion = new Date().toISOString();
                localStorage.setItem(`efTravelSession_${gameCode}`, JSON.stringify(sessionData));
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
                    simulateCollectiveStats();
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

// Simuler l'arrivée de nouveaux joueurs
function simulateNewPlayers() {
    const currentGame = localStorage.getItem('efTravelCurrentGame');
    if (currentGame) {
        try {
            const gameData = JSON.parse(currentGame);
            if (gameData.isMultiplayer && gameData.gameCode) {
                const gameCode = gameData.gameCode;
                const sessionData = getSessionDataFromStorage(gameCode);
                
                if (sessionData) {
                    // Simuler l'arrivée de nouveaux joueurs avec une probabilité de 20%
                    const shouldAddPlayer = Math.random() < 0.2; // 20% de chance
                    const timeSinceStart = Date.now() - new Date(sessionData.startTime).getTime();
                    const minutesSinceStart = timeSinceStart / (1000 * 60);
                    
                    // Plus la session est récente, plus il y a de chances d'avoir de nouveaux joueurs
                    if (shouldAddPlayer && minutesSinceStart < 10 && sessionData.playerCount < 6) {
                        sessionData.playerCount += 1;
                        sessionData.lastActivity = new Date().toISOString();
                        sessionData.players = sessionData.players || [];
                        sessionData.players.push({
                            id: Date.now(),
                            joinedAt: new Date().toISOString(),
                            isActive: true
                        });
                        
                        // Sauvegarder les données mises à jour
                        localStorage.setItem(`efTravelSession_${gameCode}`, JSON.stringify(sessionData));
                        
                        // Mettre à jour l'affichage
                        updatePlayerCount();
                        
                        // Afficher une notification si on n'est pas en train d'attendre
                        if (!document.getElementById('remainingPlayers')) {
                            showNotification(`👥 New player joined! ${sessionData.playerCount} player(s) in session.`);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Erreur lors de la simulation de nouveaux joueurs:', error);
        }
    }
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
    if (surveyState.isMultiplayer && surveyState.isSessionActive) {
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
    // Toujours réinitialiser le quiz pour une nouvelle session
    surveyState.answers = {};
    surveyState.isCompleted = false;
    surveyState.currentQuestionIndex = 0;
    surveyState.sessionStats = {};
    surveyState.playerCount = 0;
    surveyState.isSessionActive = false;
    
    // Afficher la première question
    displayCurrentQuestion();
    updateProgress();
    
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
    localStorage.removeItem('efTravelSurvey');
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
        // Quand la page redevient visible, réinitialiser le quiz
        console.log('Page redevient visible - réinitialisation du quiz');
        loadSavedData();
    }
});

// Gestion de la fermeture/actualisation de la page
window.addEventListener('beforeunload', function() {
    // Nettoyer les données quand le joueur quitte
    console.log('Joueur quitte la page - nettoyage des données');
    clearData();
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

// Redirection vers la page d'accueil
function redirectToHome() {
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
