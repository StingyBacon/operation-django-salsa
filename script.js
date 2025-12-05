// Game State
let gameState = {
    totalScore: 0,
    rerollsUsed: 0,
    missionRerolls: {}, // Track rerolls per mission
    testMode: false,
    testModeTime: null, // Override time for testing (format: 'HH:MM')
    testModeRestrictionsDisabled: true, // Start with restrictions disabled in test mode
    secretMissionRevealed: false,
    secretMissionActive: false,
    midnightMissionsCompleted: 0,
    achievements: [],
    completedMainObjectives: 0,
    completedMiniGames: 0,
    completedSideQuests: 0,
    missedMainObjectives: 0,
    penaltyChallengesCompleted: 0,
    penaltyChallengeFailed: 0,
    dateStartTime: new Date(),
    secretMissionCompleted: false,
    secretMissionFailed: false,
    actionHistory: [], // For undo functionality
    missionPhotos: {}, // Store photo data URLs by mission ID
    missionNotes: {}, // Text notes for missions
    coupleAchievements: [], // Special couple achievements
    characterSwapped: false, // Track if roles are swapped
    speedRunActive: false,
    speedRunStartTime: null,
    partnerRatings: {}, // Mission ratings from partner
    conversationCardsUsed: 0,
    luckySpinsUsed: 0,
    statistics: {
        taskCompletionTimes: [],
        missionStartTimes: {},
        missionCompletionTimes: {}
    }
};

// Action history for undo
let maxHistorySize = 20;

// Couple achievements database
const coupleAchievements = [
    { id: 'double-laugh', icon: '😂', title: 'Synchronized Laughter', desc: 'Both laughed at the exact same moment', unlocked: false },
    { id: 'mind-reader', icon: '🧠', title: 'Mind Reader', desc: 'Said the same thing at the same time', unlocked: false },
    { id: 'photo-duo', icon: '📸', title: 'Photo Collectors', desc: 'Upload photos for 3 missions', unlocked: false },
    { id: 'perfect-timing', icon: '⏰', title: 'Perfect Timing', desc: 'Complete mission right before time expires', unlocked: false },
    { id: 'speed-demons', icon: '⚡', title: 'Speed Demons', desc: 'Complete mission in speed run mode', unlocked: false },
    { id: 'storytellers', icon: '📖', title: 'Storytellers', desc: 'Add notes to 3 missions', unlocked: false },
    { id: 'risk-takers', icon: '🎲', title: 'Risk Takers', desc: 'Use lucky spin 5 times', unlocked: false },
    { id: 'role-players', icon: '🎭', title: 'Role Players', desc: 'Complete mission with swapped characters', unlocked: false },
    { id: 'communicators', icon: '💬', title: 'Deep Communicators', desc: 'Use 5 conversation cards', unlocked: false },
    { id: 'perfect-score', icon: '💯', title: 'Perfect Harmony', desc: 'Both give each other 5-star ratings', unlocked: false }
];

// Save game state to localStorage
function saveGameState() {
    const saveData = {
        gameState: gameState,
        completedTasks: [],
        completedMainObjectives: [],
        missedPenalties: []
    };
    
    // Save all completed tasks
    document.querySelectorAll('.task.completed').forEach(task => {
        saveData.completedTasks.push(task.id);
    });
    
    // Save main objective completion status
    document.querySelectorAll('.mission').forEach(mission => {
        if (mission.dataset.mainCompleted === 'true') {
            saveData.completedMainObjectives.push(mission.id);
        }
        if (mission.dataset.missedPenaltyApplied === 'true') {
            saveData.missedPenalties.push(mission.id);
        }
    });
    
    // Save achievements unlock status
    saveData.unlockedAchievements = achievements.filter(a => a.unlocked).map(a => a.id);
    
    localStorage.setItem('operationDjangoSalsa', JSON.stringify(saveData));
}

// Load game state from localStorage
function loadGameState() {
    const saved = localStorage.getItem('operationDjangoSalsa');
    if (!saved) return false;
    
    try {
        const saveData = JSON.parse(saved);
        
        // Restore game state
        Object.assign(gameState, saveData.gameState);
        gameState.dateStartTime = new Date(gameState.dateStartTime);
        
        // Wait for DOM to be ready, then restore UI state
        setTimeout(() => {
            // Restore completed tasks
            saveData.completedTasks.forEach(taskId => {
                const task = document.getElementById(taskId);
                if (task) {
                    task.classList.add('completed');
                    const btn = task.querySelector('.btn');
                    if (btn) btn.disabled = true;
                }
            });
            
            // Restore main objectives
            saveData.completedMainObjectives.forEach(missionId => {
                const mission = document.getElementById(missionId);
                if (mission) {
                    mission.dataset.mainCompleted = 'true';
                    const btn = document.getElementById(`main-btn-${missionId.replace('mission-', '')}`);
                    if (btn) {
                        btn.disabled = true;
                        btn.textContent = '✓ COMPLETED';
                    }
                }
            });
            
            // Restore missed penalties
            saveData.missedPenalties.forEach(missionId => {
                const mission = document.getElementById(missionId);
                if (mission) mission.dataset.missedPenaltyApplied = 'true';
            });
            
            // Restore achievements
            saveData.unlockedAchievements.forEach(achId => {
                const achievement = achievements.find(a => a.id === achId);
                if (achievement) {
                    achievement.unlocked = true;
                    const el = document.getElementById(`achievement-${achId}`);
                    if (el) el.classList.add('unlocked');
                }
            });
            
            // Update progress bar and reroll counters
            updateProgressBar();
            Object.keys(gameState.missionRerolls).forEach(missionId => {
                const counter = document.getElementById(`reroll-count-${missionId}`);
                if (counter) counter.textContent = `${gameState.missionRerolls[missionId]}/3`;
            });
            
            // Restore midnight missions progress
            const midnightProgress = document.getElementById('midnightProgress');
            if (midnightProgress) {
                midnightProgress.textContent = `${gameState.midnightMissionsCompleted} / 10`;
            }
            if (gameState.midnightMissionsCompleted < 10) {
                loadNextMidnightMission();
            }
            
            // Restore secret mission state
            if (gameState.secretMissionRevealed && !gameState.secretMissionCompleted && !gameState.secretMissionFailed) {
                const revealBtn = document.getElementById('revealSecretBtn');
                if (revealBtn) revealBtn.classList.add('hidden');
                // Secret mission timer would have expired, so mark as failed
                gameState.secretMissionActive = false;
                gameState.secretMissionFailed = true;
                const content = document.getElementById('secretMissionContent');
                if (content) {
                    content.classList.remove('hidden');
                    content.innerHTML = '<p style="color: #e74c3c; font-size: 14px;">✗ SECRET MISSION TIME EXPIRED!</p>';
                }
            } else if (gameState.secretMissionCompleted) {
                const revealBtn = document.getElementById('revealSecretBtn');
                if (revealBtn) revealBtn.classList.add('hidden');
                const content = document.getElementById('secretMissionContent');
                if (content) {
                    content.classList.remove('hidden');
                    content.innerHTML = '<p style="color: #7cb342; font-size: 14px;">✓ SECRET MISSION COMPLETED! +75 POINTS</p>';
                }
            }
        }, 100);
        
        return true;
    } catch (e) {
        console.error('Failed to load save:', e);
        return false;
    }
}

// Clear save data
function clearSave() {
    if (confirm('Are you sure you want to clear all saved progress?')) {
        localStorage.removeItem('operationDjangoSalsa');
        location.reload();
    }
}

// Undo functionality
function recordAction(action) {
    gameState.actionHistory.push({
        ...action,
        timestamp: Date.now(),
        scoreBefore: gameState.totalScore
    });
    if (gameState.actionHistory.length > maxHistorySize) {
        gameState.actionHistory.shift();
    }
    updateUndoButton();
    saveGameState();
}

function undoLastAction() {
    if (gameState.actionHistory.length === 0) {
        showNotification('No actions to undo', 'error');
        return;
    }
    
    const lastAction = gameState.actionHistory.pop();
    
    switch(lastAction.type) {
        case 'task':
            const task = document.getElementById(lastAction.taskId);
            if (task) {
                task.classList.remove('completed');
                const btn = task.querySelector('.btn');
                if (btn) btn.disabled = false;
                gameState.totalScore = lastAction.scoreBefore;
                if (lastAction.taskType === 'mini') gameState.completedMiniGames--;
                else gameState.completedSideQuests--;
            }
            break;
            
        case 'mainObjective':
            const mission = document.getElementById(`mission-${lastAction.missionId}`);
            if (mission) {
                mission.dataset.mainCompleted = 'false';
                const btn = document.getElementById(`main-btn-${lastAction.missionId}`);
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = '✓ COMPLETE MAIN OBJECTIVE (+100)';
                }
                gameState.totalScore = lastAction.scoreBefore;
                gameState.completedMainObjectives--;
            }
            break;
            
        case 'reroll':
            gameState.totalScore = lastAction.scoreBefore;
            gameState.missionRerolls[lastAction.missionId]--;
            gameState.rerollsUsed--;
            break;
    }
    
    updateProgressBar();
    updateUndoButton();
    saveGameState();
    showNotification('Action undone', 'success');
}

function updateUndoButton() {
    const btn = document.getElementById('undoBtn');
    if (btn) {
        btn.disabled = gameState.actionHistory.length === 0;
        btn.style.opacity = gameState.actionHistory.length === 0 ? '0.5' : '1';
    }
}

// Quick Poll - fun conversation starters
function quickPoll() {
    const polls = [
        { q: "Who's more likely to order dessert first?", opts: ["Agent Wildflower", "The Onion Slayer", "Both!"] },
        { q: "Best movie snack?", opts: ["Popcorn", "Candy", "Nachos", "All of them"] },
        { q: "Ideal Friday night?", opts: ["Movie night", "Going out", "Game night", "Cooking together"] },
        { q: "Who gives better hugs?", opts: ["Agent Wildflower", "The Onion Slayer", "It's a tie!"] },
        { q: "Next adventure should be...", opts: ["Restaurant hunt", "Movie marathon", "Day trip", "New activity"] },
        { q: "Morning person or night owl?", opts: ["Both morning", "Both night", "One of each", "Neither 😴"] },
        { q: "Who's the better dancer?", opts: ["Agent Wildflower", "The Onion Slayer", "Both terrible 😂"] },
        { q: "Dream vacation?", opts: ["Beach resort", "Mountain cabin", "City exploration", "Road trip"] }
    ];
    
    const poll = polls[Math.floor(Math.random() * polls.length)];
    
    const modal = document.createElement('div');
    modal.className = 'poll-modal';
    modal.innerHTML = `
        <div class="poll-content">
            <h3>🗳️ QUICK POLL</h3>
            <p style="font-size: 16px; margin: 20px 0; color: #d4af37;">${poll.q}</p>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                ${poll.opts.map(opt => `<button class="btn primary" onclick="this.parentElement.parentElement.parentElement.remove(); showNotification('Poll answered: ${opt.replace(/'/g, "\\'")}'');" style="padding: 12px;">${opt}</button>`).join('')}
            </div>
            <button class="btn" onclick="this.parentElement.parentElement.remove()" style="margin-top: 15px; padding: 8px;">Skip</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Random Challenge - spontaneous fun
function randomChallenge() {
    const challenges = [
        { title: "Accent Challenge", desc: "Next 5 minutes, speak only in your worst accent", points: 15 },
        { title: "One-Word Story", desc: "Take turns saying one word at a time to create a story", points: 20 },
        { title: "Compliment Battle", desc: "Take turns giving compliments. First to smile loses!", points: 25 },
        { title: "60-Second Dance Party", desc: "Drop everything and dance for 60 seconds", points: 20 },
        { title: "Would You Rather", desc: "Ask each other 3 'would you rather' questions", points: 15 },
        { title: "Impression Contest", desc: "Each do your best impression of a celebrity/friend", points: 25 },
        { title: "Staring Contest", desc: "First to blink or laugh loses!", points: 20 },
        { title: "Whisper Challenge", desc: "One wears headphones, other whispers. Guess what they said!", points: 30 },
        { title: "Truth Bomb", desc: "Each share one random fact the other doesn't know", points: 15 },
        { title: "Rock Paper Scissors - Best of 5", desc: "Winner gets to choose next song or activity", points: 10 }
    ];
    
    const challenge = challenges[Math.floor(Math.random() * challenges.length)];
    
    const modal = document.createElement('div');
    modal.className = 'challenge-modal';
    modal.innerHTML = `
        <div class="challenge-content">
            <h3>🎲 SURPRISE CHALLENGE</h3>
            <div style="background: rgba(212, 175, 55, 0.2); padding: 20px; border-radius: 10px; margin: 20px 0; border: 2px solid #d4af37;">
                <h4 style="color: #d4af37; font-size: 20px; margin-bottom: 10px;">${challenge.title}</h4>
                <p style="font-size: 14px; line-height: 1.6;">${challenge.desc}</p>
                <p style="color: #ffd700; font-size: 16px; margin-top: 15px; font-weight: bold;">Reward: +${challenge.points} points</p>
            </div>
            <button class="btn primary" onclick="completeSurpriseChallenge(${challenge.points}); this.parentElement.parentElement.remove();" style="padding: 12px; width: 100%;">✓ COMPLETED!</button>
            <button class="btn" onclick="this.parentElement.parentElement.remove()" style="margin-top: 10px; padding: 8px;">Skip Challenge</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function completeSurpriseChallenge(points) {
    addScore(points);
    showNotification(`Surprise challenge complete! +${points} points! 🎉`);
    sendNotification('Challenge Complete!', `Earned ${points} bonus points!`);
    saveGameState();
}

// Conversation Cards
function showConversationCard() {
    const deepQuestions = [
        "What's a dream you've never told anyone about?",
        "What moment from this year made you the happiest?",
        "If you could relive one day from your past, which would it be?",
        "What's something you're grateful for right now?",
        "What's a fear you'd like to overcome?",
        "What does your perfect day look like?",
        "What's a quality you admire most in me?",
        "Where do you see us in 5 years?",
        "What's something new you'd like us to try together?",
        "What made you realize you liked spending time with me?"
    ];
    
    const funPrompts = [
        "Never have I ever... accidentally texted the wrong person 😅",
        "Never have I ever... stalked someone's social media for hours",
        "Never have I ever... pretended to like a gift I actually hated",
        "Never have I ever... fallen asleep during a movie on purpose",
        "Never have I ever... googled myself",
        "Never have I ever... laughed at a joke I didn't understand",
        "Never have I ever... cried during a commercial",
        "Never have I ever... eaten food that fell on the floor",
        "Never have I ever... re-gifted something",
        "Never have I ever... fake laughed at someone's bad joke"
    ];
    
    const isDeep = Math.random() > 0.5;
    const cards = isDeep ? deepQuestions : funPrompts;
    const card = cards[Math.floor(Math.random() * cards.length)];
    const type = isDeep ? 'DEEP QUESTION' : 'NEVER HAVE I EVER';
    
    gameState.conversationCardsUsed++;
    saveGameState();
    
    const modal = document.createElement('div');
    modal.className = 'conversation-modal';
    modal.innerHTML = `
        <div class="conversation-content">
            <h3>💬 CONVERSATION CARD</h3>
            <div style="background: rgba(74, 144, 226, 0.2); padding: 25px; border-radius: 12px; margin: 20px 0; border: 2px solid #4a90e2;">
                <div style="color: #4a90e2; font-size: 12px; font-weight: bold; margin-bottom: 10px;">${type}</div>
                <p style="font-size: 16px; line-height: 1.6; color: #e8e8e8;">${card}</p>
            </div>
            <button class="btn primary" onclick="this.parentElement.parentElement.remove()" style="padding: 12px; width: 100%;">Close</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Mission Notes
function addMissionNote(missionId) {
    const existingNote = gameState.missionNotes[missionId] || '';
    
    const modal = document.createElement('div');
    modal.className = 'note-modal';
    modal.innerHTML = `
        <div class="note-content">
            <h3>📝 MISSION NOTES</h3>
            <p style="font-size: 13px; color: #888; margin-bottom: 15px;">Add a memory or note about Mission ${missionId}</p>
            <textarea id="missionNoteText" style="width: 100%; height: 150px; font-family: 'Courier New', monospace; font-size: 13px; padding: 12px; border-radius: 8px; background: #1a1a2e; color: #e8e8e8; border: 2px solid #8b4513; resize: vertical;" placeholder="What made this mission special?...">${existingNote}</textarea>
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button class="btn primary" onclick="saveMissionNote(${missionId})" style="flex: 1; padding: 12px;">💾 Save Note</button>
                <button class="btn" onclick="this.parentElement.parentElement.parentElement.remove()" style="flex: 1; padding: 12px;">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function saveMissionNote(missionId) {
    const noteText = document.getElementById('missionNoteText').value.trim();
    if (noteText) {
        gameState.missionNotes[missionId] = noteText;
        showNotification('Note saved! 📝');
        updateNoteButton(missionId);
    } else {
        delete gameState.missionNotes[missionId];
        updateNoteButton(missionId);
    }
    saveGameState();
    document.querySelector('.note-modal').remove();
}

function updateNoteButton(missionId) {
    const btn = document.getElementById(`note-btn-${missionId}`);
    if (btn) {
        if (gameState.missionNotes[missionId]) {
            btn.textContent = '📖 VIEW NOTE';
            btn.classList.add('primary');
        } else {
            btn.textContent = '📝 ADD NOTE';
            btn.classList.remove('primary');
        }
    }
}

// Speed Run Mode
function toggleSpeedRun() {
    gameState.speedRunActive = !gameState.speedRunActive;
    const btn = document.getElementById('speedRunBtn');
    
    if (gameState.speedRunActive) {
        gameState.speedRunStartTime = Date.now();
        btn.textContent = '⏱️ STOP SPEED RUN';
        btn.classList.add('danger');
        showNotification('⚡ SPEED RUN ACTIVATED! Complete missions fast for bonuses!', 'success');
        
        // Add timer display
        const header = document.querySelector('.header');
        const timerDiv = document.createElement('div');
        timerDiv.id = 'speedRunTimer';
        timerDiv.style.cssText = 'font-size: 24px; color: #ffd700; margin-top: 10px; font-weight: bold;';
        header.appendChild(timerDiv);
        updateSpeedRunTimer();
    } else {
        const elapsed = (Date.now() - gameState.speedRunStartTime) / 1000;
        btn.textContent = '⚡ SPEED RUN';
        btn.classList.remove('danger');
        showNotification(`Speed run ended! Time: ${elapsed.toFixed(1)}s`, 'success');
        const timer = document.getElementById('speedRunTimer');
        if (timer) timer.remove();
    }
    saveGameState();
}

function updateSpeedRunTimer() {
    if (!gameState.speedRunActive) return;
    
    const timer = document.getElementById('speedRunTimer');
    if (timer) {
        const elapsed = ((Date.now() - gameState.speedRunStartTime) / 1000).toFixed(1);
        timer.textContent = `⏱️ ${elapsed}s`;
        setTimeout(updateSpeedRunTimer, 100);
    }
}

function checkSpeedRunBonus(missionId) {
    if (gameState.speedRunActive) {
        const elapsed = (Date.now() - gameState.speedRunStartTime) / 1000;
        let bonus = 0;
        
        if (elapsed < 30) bonus = 50;
        else if (elapsed < 60) bonus = 30;
        else if (elapsed < 90) bonus = 15;
        
        if (bonus > 0) {
            addScore(bonus);
            showNotification(`⚡ SPEED BONUS: +${bonus} points!`, 'success');
        }
        
        gameState.speedRunActive = false;
        const btn = document.getElementById('speedRunBtn');
        if (btn) {
            btn.textContent = '⚡ SPEED RUN';
            btn.classList.remove('danger');
        }
        const timer = document.getElementById('speedRunTimer');
        if (timer) timer.remove();
    }
}

// Character Swap
function toggleCharacterSwap() {
    gameState.characterSwapped = !gameState.characterSwapped;
    const btn = document.getElementById('swapBtn');
    
    if (gameState.characterSwapped) {
        btn.textContent = '🔄 SWAP BACK';
        btn.classList.add('primary');
        showNotification('🎭 Characters swapped! Agent Wildflower ↔ The Onion Slayer', 'success');
        
        // Update display
        document.querySelectorAll('.codenames').forEach(el => {
            el.textContent = 'The Onion Slayer 🧅 & Agent Wildflower 🌸';
        });
    } else {
        btn.textContent = '🎭 SWAP ROLES';
        btn.classList.remove('primary');
        showNotification('Roles restored!', 'success');
        
        document.querySelectorAll('.codenames').forEach(el => {
            el.textContent = 'Agent Wildflower 🌸 & The Onion Slayer 🧅';
        });
        
        checkCoupleAchievement('role-players');
    }
    saveGameState();
}

// Lucky Spin
function luckySpinWheel() {
    gameState.luckySpinsUsed++;
    
    const outcomes = [
        { result: '+50 points!', points: 50, color: '#7cb342' },
        { result: '+30 points!', points: 30, color: '#7cb342' },
        { result: '+20 points!', points: 20, color: '#7cb342' },
        { result: '+15 points!', points: 15, color: '#7cb342' },
        { result: '+10 points!', points: 10, color: '#7cb342' },
        { result: '-10 points', points: -10, color: '#e74c3c' },
        { result: '-15 points', points: -15, color: '#e74c3c' },
        { result: 'Double next task!', points: 0, special: 'double', color: '#d4af37' },
        { result: 'Free reroll!', points: 0, special: 'reroll', color: '#d4af37' },
        { result: 'Instant achievement!', points: 0, special: 'achievement', color: '#9b59b6' }
    ];
    
    const spin = outcomes[Math.floor(Math.random() * outcomes.length)];
    
    const modal = document.createElement('div');
    modal.className = 'spin-modal';
    modal.innerHTML = `
        <div class="spin-content">
            <h3>🌟 LUCKY SPIN</h3>
            <div id="spinWheel" style="width: 200px; height: 200px; border: 8px solid #d4af37; border-radius: 50%; margin: 20px auto; display: flex; align-items: center; justify-content: center; background: linear-gradient(45deg, #1a1a2e, #16213e); font-size: 60px; animation: spin 2s ease-out;">
                🎰
            </div>
            <div id="spinResult" style="opacity: 0; transition: opacity 0.5s 2s;">
                <div style="background: ${spin.color}; padding: 20px; border-radius: 12px; margin: 20px 0; border: 3px solid rgba(255,255,255,0.3);">
                    <p style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">${spin.result}</p>
                </div>
                <button class="btn primary" onclick="applySpinResult(${spin.points}, '${spin.special || ''}'); this.parentElement.parentElement.parentElement.remove();" style="padding: 12px; width: 100%;">Continue</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Show result after animation
    setTimeout(() => {
        document.getElementById('spinResult').style.opacity = '1';
    }, 2000);
}

function applySpinResult(points, special) {
    if (points !== 0) {
        addScore(points);
        showNotification(`Spin result: ${points > 0 ? '+' : ''}${points} points!`);
    }
    
    if (special === 'double') {
        showNotification('Next completed task worth DOUBLE points! 🎯', 'success');
        // Store in temp variable (implement double points logic in completeTask)
    } else if (special === 'reroll') {
        showNotification('Free reroll unlocked! Check any mission! 🎲', 'success');
    } else if (special === 'achievement') {
        const locked = coupleAchievements.filter(a => !a.unlocked);
        if (locked.length > 0) {
            const achievement = locked[Math.floor(Math.random() * locked.length)];
            unlockCoupleAchievement(achievement.id);
        }
    }
    
    saveGameState();
}

// Partner Rating
function showPartnerRating(missionId) {
    const modal = document.createElement('div');
    modal.className = 'rating-modal';
    modal.innerHTML = `
        <div class="rating-content">
            <h3>📱 RATE YOUR PARTNER</h3>
            <p style="font-size: 14px; color: #888; margin-bottom: 20px;">How well did your partner do on Mission ${missionId}?</p>
            <div style="display: flex; gap: 10px; justify-content: center; margin: 25px 0;">
                ${[1,2,3,4,5].map(star => `
                    <button class="star-btn" onclick="ratePartner(${missionId}, ${star})" style="font-size: 40px; background: none; border: none; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
                        ⭐
                    </button>
                `).join('')}
            </div>
            <p style="font-size: 12px; color: #666; text-align: center;">1 = Needs work, 5 = Perfect!</p>
            <button class="btn" onclick="this.parentElement.parentElement.remove()" style="margin-top: 15px; padding: 8px;">Skip</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function ratePartner(missionId, stars) {
    gameState.partnerRatings[missionId] = stars;
    saveGameState();
    
    const messages = [
        'Every team has room to grow! 💪',
        'Getting better! Keep it up! 🌟',
        'Solid performance! 👍',
        'Great work, partner! 🎯',
        'Absolutely perfect! 💯'
    ];
    
    showNotification(messages[stars - 1]);
    document.querySelector('.rating-modal').remove();
    
    // Check for perfect score achievement
    checkPerfectRatings();
}

function checkPerfectRatings() {
    const ratings = Object.values(gameState.partnerRatings);
    // Ratings tracking only
}

// Couple Achievements System
function checkCoupleAchievement(achievementId) {
    const achievement = coupleAchievements.find(a => a.id === achievementId);
    if (!achievement || achievement.unlocked) return;
    
    let shouldUnlock = false;
    
    switch(achievementId) {
        case 'photo-duo':
            shouldUnlock = Object.keys(gameState.missionPhotos).length >= 3;
            break;
        case 'storytellers':
            shouldUnlock = Object.keys(gameState.missionNotes).length >= 3;
            break;
        case 'risk-takers':
            shouldUnlock = gameState.luckySpinsUsed >= 5;
            break;
        case 'communicators':
            shouldUnlock = gameState.conversationCardsUsed >= 5;
            break;
        case 'speed-demons':
        case 'role-players':
        case 'mind-reader':
        case 'double-laugh':
        case 'perfect-timing':
            shouldUnlock = true; // Triggered manually
            break;
    }
    
    if (shouldUnlock) {
        unlockCoupleAchievement(achievementId);
    }
}

function unlockCoupleAchievement(achievementId) {
    const achievement = coupleAchievements.find(a => a.id === achievementId);
    if (!achievement || achievement.unlocked) return;
    
    achievement.unlocked = true;
    gameState.coupleAchievements.push(achievementId);
    
    const modal = document.createElement('div');
    modal.className = 'achievement-unlock-modal';
    modal.innerHTML = `
        <div class="achievement-unlock-content">
            <div style="font-size: 80px; margin-bottom: 15px; animation: bounce 0.6s;">${achievement.icon}</div>
            <h3 style="color: #d4af37; margin-bottom: 10px;">COUPLE ACHIEVEMENT UNLOCKED!</h3>
            <p style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">${achievement.title}</p>
            <p style="font-size: 14px; color: #888;">${achievement.desc}</p>
            <button class="btn primary" onclick="this.parentElement.parentElement.remove()" style="margin-top: 20px; padding: 12px;">Awesome! ✨</button>
        </div>
    `;
    document.body.appendChild(modal);
    
    setTimeout(() => modal.remove(), 5000);
    saveGameState();
}

function showCoupleAchievements() {
    const modal = document.createElement('div');
    modal.className = 'achievements-modal';
    
    const achievementsList = coupleAchievements.map(a => `
        <div style="display: flex; align-items: center; padding: 12px; background: rgba(22, 33, 62, ${a.unlocked ? 0.8 : 0.3}); border-radius: 8px; margin: 10px 0; border-left: 4px solid ${a.unlocked ? '#d4af37' : '#666'};">
            <div style="font-size: 36px; margin-right: 15px; ${!a.unlocked ? 'filter: grayscale(100%); opacity: 0.5;' : ''}">${a.icon}</div>
            <div style="flex: 1;">
                <div style="font-size: 14px; font-weight: bold; color: ${a.unlocked ? '#d4af37' : '#666'};">${a.title}</div>
                <div style="font-size: 12px; color: ${a.unlocked ? '#c0c0c0' : '#555'}; margin-top: 3px;">${a.desc}</div>
            </div>
            ${a.unlocked ? '<div style="color: #7cb342; font-size: 20px;">✓</div>' : '<div style="color: #666; font-size: 16px;">🔒</div>'}
        </div>
    `).join('');
    
    modal.innerHTML = `
        <div class="achievements-modal-content">
            <h3>🏆 COUPLE ACHIEVEMENTS</h3>
            <p style="font-size: 13px; color: #888; margin-bottom: 20px;">Unlocked: ${coupleAchievements.filter(a => a.unlocked).length} / ${coupleAchievements.length}</p>
            <div style="max-height: 60vh; overflow-y: auto;">
                ${achievementsList}
            </div>
            <button class="btn primary" onclick="this.parentElement.parentElement.remove()" style="margin-top: 20px; padding: 12px; width: 100%;">Close</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Statistics tracking
function recordTaskCompletion(taskType, missionId) {
    const completionTime = Date.now();
    gameState.statistics.taskCompletionTimes.push({
        type: taskType,
        missionId: missionId,
        timestamp: completionTime
    });
    saveGameState();
}

function recordMissionStart(missionId) {
    if (!gameState.statistics.missionStartTimes[missionId]) {
        gameState.statistics.missionStartTimes[missionId] = Date.now();
        saveGameState();
    }
}

function recordMissionCompletion(missionId) {
    if (!gameState.statistics.missionCompletionTimes[missionId]) {
        gameState.statistics.missionCompletionTimes[missionId] = Date.now();
        saveGameState();
    }
}

function showStatistics() {
    const modal = document.createElement('div');
    modal.className = 'statistics-modal';
    modal.id = 'statisticsModal';
    
    const tasksCompleted = gameState.statistics.taskCompletionTimes.length;
    const missionsCompleted = Object.keys(gameState.statistics.missionCompletionTimes).length;
    
    let avgCompletionTime = 0;
    if (missionsCompleted > 0) {
        const times = Object.entries(gameState.statistics.missionCompletionTimes).map(([id, endTime]) => {
            const startTime = gameState.statistics.missionStartTimes[id] || endTime;
            return (endTime - startTime) / 1000 / 60; // minutes
        });
        avgCompletionTime = times.reduce((a, b) => a + b, 0) / times.length;
    }
    
    const totalPlayTime = (Date.now() - new Date(gameState.dateStartTime).getTime()) / 1000 / 60;
    
    modal.innerHTML = `
        <div class="statistics-content">
            <h3>📊 OPERATION STATISTICS</h3>
            <button class="btn close-stats-btn" onclick="document.getElementById('statisticsModal').remove()" style="position: absolute; top: 15px; right: 15px; padding: 5px 10px;">✕</button>
            
            <div class="stats-section">
                <h4>⏱️ Time Statistics</h4>
                <p>Total Play Time: <strong>${totalPlayTime.toFixed(1)} minutes</strong></p>
                <p>Average Mission Time: <strong>${avgCompletionTime.toFixed(1)} minutes</strong></p>
                <p>Operation Started: <strong>${new Date(gameState.dateStartTime).toLocaleTimeString()}</strong></p>
            </div>
            
            <div class="stats-section">
                <h4>✅ Completion Statistics</h4>
                <p>Tasks Completed: <strong>${tasksCompleted}</strong></p>
                <p>Missions Completed: <strong>${missionsCompleted} / ${missions.length}</strong></p>
                <p>Mini-Games: <strong>${gameState.completedMiniGames}</strong></p>
                <p>Side Quests: <strong>${gameState.completedSideQuests}</strong></p>
                <p>Main Objectives: <strong>${gameState.completedMainObjectives}</strong></p>
            </div>
            
            <div class="stats-section">
                <h4>🎯 Performance</h4>
                <p>Current Score: <strong>${gameState.totalScore}</strong></p>
                <p>Rerolls Used: <strong>${gameState.rerollsUsed}</strong></p>
                <p>Achievements: <strong>${achievements.filter(a => a.unlocked).length} / ${achievements.length}</strong></p>
            </div>
            
            <div class="stats-section">
                <h4>📸 Mission Photos</h4>
                <p>Photos Uploaded: <strong>${Object.keys(gameState.missionPhotos).length}</strong></p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Photo upload functionality
function uploadMissionPhoto(missionId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use camera on mobile
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            showNotification('Photo too large (max 5MB)', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
            gameState.missionPhotos[missionId] = {
                data: event.target.result,
                timestamp: Date.now(),
                filename: file.name
            };
            saveGameState();
            updatePhotoButton(missionId);
            showNotification('📸 Photo uploaded!', 'success');
        };
        reader.readAsDataURL(file);
    };
    
    input.click();
}

function viewMissionPhoto(missionId) {
    const photo = gameState.missionPhotos[missionId];
    if (!photo) return;
    
    const modal = document.createElement('div');
    modal.className = 'photo-modal';
    modal.onclick = () => modal.remove();
    
    modal.innerHTML = `
        <div class="photo-content" onclick="event.stopPropagation()">
            <button class="btn close-photo-btn" onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: 10px; right: 10px; padding: 5px 10px; z-index: 10;">✕</button>
            <img src="${photo.data}" alt="Mission Photo" style="max-width: 100%; max-height: 80vh; border-radius: 8px;">
            <p style="margin-top: 10px; font-size: 12px; color: #888;">Uploaded: ${new Date(photo.timestamp).toLocaleString()}</p>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function updatePhotoButton(missionId) {
    const btn = document.getElementById(`photo-btn-${missionId}`);
    if (btn && gameState.missionPhotos[missionId]) {
        btn.textContent = '🖼️ VIEW PHOTO';
        btn.classList.add('primary');
    }
}

// Browser notifications
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function sendNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🤠</text></svg>',
            badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🕵️</text></svg>'
        });
    }
}

// Export score functionality
function exportScore() {
    const currentRank = ranks.reduce((acc, rank) => 
        gameState.totalScore >= rank.minScore ? rank : acc
    );
    
    const text = `
🤠 OPERATION: DJANGO SALSA 🕵️
Agent Wildflower 🌸 & The Onion Slayer 🧅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL SCORE: ${gameState.totalScore}
RANK: ${currentRank.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MISSION STATS:
✓ Main Objectives: ${gameState.completedMainObjectives}/${missions.length}
✓ Mini-Games: ${gameState.completedMiniGames}
✓ Side Quests: ${gameState.completedSideQuests}
✓ Midnight Missions: ${gameState.midnightMissionsCompleted}/10
✓ Achievements: ${achievements.filter(a => a.unlocked).length}/${achievements.length}

REWARD: ${currentRank.reward}

Date: ${new Date().toLocaleDateString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
    
    // Copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Score copied to clipboard! 📋', 'success');
    }).catch(() => {
        // Fallback: show in modal
        const modal = document.createElement('div');
        modal.className = 'export-modal';
        modal.innerHTML = `
            <div class="export-content">
                <h3>📊 Export Score</h3>
                <textarea readonly style="width: 100%; height: 300px; font-family: 'Courier New', monospace; font-size: 12px; padding: 15px; border-radius: 8px; background: #1a1a2e; color: #e8e8e8; border: 2px solid #d4af37;">${text}</textarea>
                <button class="btn primary" onclick="this.parentElement.parentElement.remove()" style="margin-top: 15px;">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
    });
}

function exportSummaryAsImage() {
    showNotification('Generating image...', 'success');
    
    // Clone the summary screen and hide the export button
    const summaryScreen = document.querySelector('.summary-screen');
    if (!summaryScreen) {
        showNotification('Complete the operation first!', 'error');
        return;
    }
    
    const clone = summaryScreen.cloneNode(true);
    // Remove the export button from the clone
    const exportBtn = clone.querySelector('button[onclick="exportSummaryAsImage()"]');
    if (exportBtn) {
        exportBtn.remove();
    }
    
    // Temporarily add clone to body for rendering
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.width = '800px';
    document.body.appendChild(clone);
    
    // Wait for layout to settle
    setTimeout(() => {
        const actualHeight = clone.offsetHeight;
        
        // Use html2canvas if available
        if (typeof html2canvas !== 'undefined') {
            html2canvas(clone, {
                backgroundColor: '#1a1a2e',
                scale: 2,
                width: 800,
                height: actualHeight,
                windowWidth: 800,
                windowHeight: actualHeight
            }).then(canvas => {
                document.body.removeChild(clone);
                canvas.toBlob(blob => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `operation-summary-${Date.now()}.png`;
                    a.click();
                    URL.revokeObjectURL(url);
                    showNotification('Summary exported! 🖼️', 'success');
                });
            }).catch(err => {
                document.body.removeChild(clone);
                console.error('Export failed:', err);
                showNotification('Export failed. Try again.', 'error');
            });
        } else {
            // Fallback: Use dom-to-image
            document.body.removeChild(clone);
            
            try {
                if (typeof domtoimage !== 'undefined') {
                    domtoimage.toPng(summaryScreen, {
                        width: 800,
                        height: summaryScreen.offsetHeight,
                        style: {
                            transform: 'scale(1)',
                            transformOrigin: 'top left'
                        }
                    }).then(dataUrl => {
                        const a = document.createElement('a');
                        a.href = dataUrl;
                        a.download = `operation-summary-${Date.now()}.png`;
                        a.click();
                        showNotification('Summary exported! 🖼️', 'success');
                    });
                } else {
                    showNotification('Screenshot library not available. Please include html2canvas or dom-to-image library.', 'error');
                }
            } catch (err) {
                console.error('Export failed:', err);
                showNotification('Export failed. Try again.', 'error');
            }
        }
    }, 100);
}

// Databases
const missions = [
    {
        id: 1,
        title: "MISSION 1: Rendezvous at the Hideout",
        timeRange: "17:00 - 17:45",
        startTime: "17:00",
        endTime: "17:45",
        lore: "As the sun begins its descent over the frontier, The Onion Slayer makes his way to Agent Wildflower's hideout. Intel suggests that the best operations begin with proper provisions. The kitchen becomes your first battleground—not against enemies, but against hunger. Success here sets the tone for the entire operation.",
        mainObjectives: [
            "Greet your partner with a proper welcome drink and give the full headquarters tour",
            "Cook together while catching up on the week's adventures and mishaps",
            "Transform the living room into the ultimate movie command center with snacks and cozy setup"
        ],
        miniGames: [
            "Both predict which Django character will be the other's favorite—reveal after the movie",
            "Invent a signature spy handshake that you'll use throughout the night",
            "Capture a candid 'agents in action' photo while cooking—most natural wins",
            "Speed chopping contest: who can prep vegetables fastest without shedding tears",
            "Blind taste test: guess the secret ingredient your partner added to the guacamole"
        ],
        sideQuests: [
            "Tell each other about the best part of your day today",
            "Play a song from your playlist and explain why you love it",
            "Teach your partner a cooking trick or kitchen hack they don't know",
            "Give a genuine compliment about something you've noticed recently",
            "Share your most ridiculous food craving right now",
            "Recreate a funny moment from the past week with dramatic reenactment",
            "Ask about their dream home-cooked meal"
        ],
        photoTasks: [
            "Capture a candid 'agents in action' photo while cooking",
            "Take a selfie with your welcome drinks",
            "Photo of your cooking setup before you start",
            "Snap a pic of your movie command center setup"
        ]
    },
    {
        id: 2,
        title: "MISSION 2: The Django Protocol",
        timeRange: "17:45 - 21:00",
        startTime: "17:45",
        endTime: "21:00",
        lore: "The preparation is complete, and now it's time to enjoy the fruits of your labor. As you settle in with your homemade feast, the real mission begins: building connection over food while starting your cinematic journey. Django Unchained awaits—all 3 hours of western glory. This is where the operation transforms from preparation to experience.",
        mainObjectives: [
            "Start Django Unchained and enjoy your homemade nachos together during the first act",
            "Get fully immersed in the movie while savoring the meal you created",
            "Balance watching, eating, and natural conversation during the film"
        ],
        miniGames: [
            "Try to recreate a dramatic Django pose from the poster before starting",
            "Predict what the movie's opening scene will be—closest guess wins bragging rights",
            "Rate your own nachos out of 10 and defend your score",
            "See who can quote more westerns before Django even starts",
            "Make up a ridiculous western-style nickname for each other"
        ],
        sideQuests: [
            "Toast to a successful evening before the first bite",
            "Share your first impression of the movie's opening",
            "Pause to discuss your favorite meal you've ever shared together",
            "Compliment the chef (both of you) on specific dish elements",
            "Predict your favorite Django character based on the opening",
            "Share what you're most looking forward to about the rest of the night"
        ],
        photoTasks: [
            "Take a photo of your nacho masterpiece before eating",
            "Capture both of you settled in for the movie",
            "Selfie with Django on the screen behind you",
            "Photo of your snack spread"
        ]
    },
    {
        id: 3,
        title: "MISSION 3: Showdown at Sundown",
        timeRange: "21:00 - 21:15",
        startTime: "21:00",
        endTime: "21:15",
        lore: "The climax approaches. Django's final showdown is here, and you've been on this journey together for three hours. Now comes the satisfying conclusion—both of the film and this phase of your operation. How you react to the ending and transition to the next phase will test your adaptability as partners.",
        mainObjectives: [
            "Watch Django's epic finale together and see the movie through to the end",
            "Share your immediate reactions and favorite moments from the film",
            "Successfully transition from movie mode to adventure mode for the next phase"
        ],
        miniGames: [
            "Try to quote a Django line together in unison—bonus points for matching delivery",
            "Predict what happens next in the scene—wrong guess means taking a sip of your drink",
            "Create a western movie bingo: spot gunfights, standoffs, saloons, horses, revenge plots",
            "Both attempt your best cowboy drawl—rate each other's authenticity out of 10",
            "Keep a running tally: count every time someone says 'Django' throughout the movie"
        ],
        sideQuests: [
            "Verbally react to a plot twist—don't hold back your genuine surprise",
            "Take a strategic snack break and discuss favorite moments so far",
            "Listen as your partner explains what makes this movie special to them",
            "Debate which Tarantino film reigns supreme and defend your choice",
            "Plan your next movie date—pick the film and the menu",
            "Exchange movie recommendations you've been meaning to share",
            "Discuss your all-time favorite movie villain and why they're so compelling",
            "Share a scene that reminds you of something in your own life"
        ],
        photoTasks: [
            "Selfie with Django on screen during a dramatic scene",
            "Photo of your movie reactions mid-film",
            "Capture the movie setup from your viewing angle",
            "Snap a pic showing your movie snacks halfway through"
        ]
    },
    {
        id: 4,
        title: "MISSION 4: The Road to the Saloon",
        timeRange: "21:15 - 22:00",
        startTime: "21:15",
        endTime: "22:00",
        lore: "The journey between safe houses is where many operations fall apart. Not from danger, but from boredom. True agents know that transit time is an opportunity—for conversation, for connection, for preparing mentally for the challenges ahead. The Tilted Saloon awaits, but the path there is just as important as the destination.",
        mainObjectives: [
            "Make the journey to The Tilted Saloon while keeping the conversation flowing",
            "Discuss your competitive gaming strategy and make friendly wagers",
            "Arrive at The Tilted Saloon energized and ready for arcade challenges"
        ],
        miniGames: [
            "Play the classic game: 20 Questions about anything from childhood memories to wild hypotheticals",
            "Pick a stranger and collaboratively invent their entire life story—be creative",
            "People-watch together: guess if couples are on first dates, married, or just friends",
            "Confess your most awkward social moment from the last 30 days",
            "Try to predict which arcade game the other person will dominate at tonight"
        ],
        sideQuests: [
            "Place a friendly wager on who'll win more arcade games—loser buys next date's dessert",
            "Share the most interesting fact or idea you encountered this week",
            "Start planning your next adventure together—where and when",
            "Give a specific, thoughtful compliment about something you admire",
            "Scout for the most eye-catching fashion choice you see tonight",
            "Reminisce about your childhood arcade experiences and favorite games"
        ],
        photoTasks: [
            "Capture a transit selfie showing your excitement",
            "Photo of your transportation method",
            "Selfie with an interesting landmark along the way",
            "Picture of the night sky during your journey"
        ]
    },
    {
        id: 5,
        title: "MISSION 5: Infiltrating the Tilted Saloon",
        timeRange: "22:00 - LATE",
        startTime: "22:00",
        endTime: "23:59",
        lore: "The Tilted Saloon: a den of lights, sounds, and competition. Here, agents test their reflexes, their luck, and their ability to handle defeat gracefully. Every game is a challenge. Every challenge is an opportunity to learn something new about your partner. In this neon-lit establishment, legends are born—or at least, high scores are achieved.",
        mainObjectives: [
            "Compete in at least 5 different arcade games—track victories if you're feeling competitive",
            "Order themed drinks befitting your spy personas and toast to the successful operation",
            "Achieve victory (or a valiant effort) in at least one game together or against each other"
        ],
        miniGames: [
            "Establish stakes: whoever loses each round buys the winner's next drink",
            "Team up to defeat a high score on any machine—cooperation over competition",
            "If you're feeling bold, challenge another couple or group to a friendly game-off",
            "Alternate picking games and provide commentary on each other's selections",
            "Choreograph a signature victory celebration to perform after every win"
        ],
        sideQuests: [
            "Step outside your comfort zone and order something completely new from the menu",
            "Assess the atmosphere: does this place give 'Western Saloon' or 'Secret Agent Hideout' energy?",
            "Uncover your partner's unexpected gaming superpower—what are they secretly amazing at?",
            "Locate the most absurd or obscure game in the entire venue",
            "Share where in the world you'd most like to travel and why",
            "Discreetly identify which couples around you are clearly on a first date",
            "Be adventurous: play something neither of you have ever tried before"
        ],
        photoTasks: [
            "Capture a memorable photo together at the bar with your drinks",
            "Selfie with your favorite arcade game",
            "Photo of your victory celebration",
            "Picture of you both in spy poses at the venue"
        ]
    }
];

const secretMissions = [
    {
        task: "Say 'The Django needs saving' and maintain eye contact for 5 seconds without laughing",
        timeLimit: 5,
        points: 75
    },
    {
        task: "Both order drinks in character as 'Agent Wildflower' and 'The Onion Slayer'—the bartender must not break character",
        timeLimit: 8,
        points: 75
    },
    {
        task: "Find a way to reference 'nachos' in conversation with a stranger at the bar naturally",
        timeLimit: 10,
        points: 75
    },
    {
        task: "Take a photo where you're both doing dramatic spy poses without explaining why to anyone nearby",
        timeLimit: 3,
        points: 75
    },
    {
        task: "Challenge each other to a quick dance-off right where you are (minimum 15 seconds each)",
        timeLimit: 2,
        points: 75
    }
];

const midnightMissions = [
    { task: "High-five at exactly midnight (or as close as possible)", points: 40 },
    { task: "Convince a stranger you're both undercover agents on a mission", points: 40 },
    { task: "Order the weirdest drink combination and both take a sip", points: 40 },
    { task: "Find someone named 'Nick' or 'Nicole' and tell them they share a name with a spy", points: 40 },
    { task: "Get a stranger to take a photo of you both in 'spy poses'", points: 40 },
    { task: "Start a conga line (minimum 3 people)", points: 40 },
    { task: "Compliment 5 different people in under 5 minutes", points: 40 },
    { task: "Both drink something while making intense eye contact for 10 seconds", points: 40 },
    { task: "Discover and remember the bartender's name, then use it 3 times", points: 40 },
    { task: "Create a secret signal and use it every time you want to kiss for the rest of the night", points: 40 }
];

const penaltyChallenges = [
    { task: "Share 3 things you appreciate about each other right now", timeLimit: 2 },
    { task: "Take a silly photo together and show it to a stranger for their rating", timeLimit: 3 },
    { task: "Come up with a 30-second story about your 'spy origins' together", timeLimit: 2 },
    { task: "Do 10 synchronized jumping jacks together", timeLimit: 1 },
    { task: "Find something that makes both of you laugh within 2 minutes", timeLimit: 2 },
    { task: "Compliment each other using only western/spy terminology", timeLimit: 2 },
    { task: "Create a secret handshake right now", timeLimit: 2 },
    { task: "Guess each other's favorite movie snack - both must be correct", timeLimit: 1 }
];

const achievements = [
    { id: "perfectionist", title: "Perfect Precision", description: "Complete all objectives in one mission", icon: "⭐", unlocked: false },
    { id: "speedster", title: "Lightning Quick", description: "Complete a mission's main objective in the first half of its time window", icon: "⚡", unlocked: false },
    { id: "social", title: "Social Butterfly", description: "Complete 5 side quests", icon: "🦋", unlocked: false },
    { id: "competitor", title: "Game Master", description: "Complete 5 mini-games", icon: "🎮", unlocked: false },
    { id: "witching", title: "Night Owl", description: "Complete all 10 Witching Hour Challenges", icon: "🌙", unlocked: false },
    { id: "classified", title: "Classified Intel", description: "Successfully complete the Secret Mission", icon: "🔐", unlocked: false },
    { id: "flawless", title: "Flawless Execution", description: "Don't miss any main objectives", icon: "💎", unlocked: false },
    { id: "dedication", title: "Dedicated Agents", description: "Reach the 'Legendary Partners' rank", icon: "👑", unlocked: false },
    { id: "hidden", title: "???", description: "Complete the operation to reveal", icon: "❓", unlocked: false, hidden: true, realTitle: "Partners in Crime", realDescription: "Completed Operation Django Salsa together", realIcon: "🤝" }
];

const ranks = [
    { minScore: 0, name: "Rookie Recruits", description: "You showed up! That's what counts... mostly. Maybe practice your spy skills before the next mission?", reward: "🎖️ Participation Badge & A pat on the back" },
    { minScore: 200, name: "Capable Operatives", description: "Not bad for a night's work. You've got potential, and there's definitely room for improvement in future operations.", reward: "🥉 Bronze Star & Right to plan the next date" },
    { minScore: 400, name: "Skilled Agents", description: "Now we're talking! You two work well together as a team, and the missions proved it.", reward: "🥈 Silver Badge & Dessert of your choice next time" },
    { minScore: 600, name: "Elite Partners", description: "Impressive! You're not just good—you're dangerously good. This operation could be classified as 'highly successful.'", reward: "🥇 Gold Medal & Planning privileges for 2 future dates" },
    { minScore: 800, name: "Master Spies", description: "Exceptional work, agents! You've mastered the art of teamwork and mission execution. Future operations eagerly awaited.", reward: "💎 Diamond Commendation & Automatic veto power on next date idea" },
    { minScore: 1000, name: "Legendary Partners", description: "🏆 PERFECT SCORE! You've achieved the impossible. This operation will go down in spy-western history.", reward: "👑 Legendary Status, Lifetime Bragging Rights & Victory celebration" }
];

// Initialize missions
function initializeMissions() {
    const container = document.getElementById('missionsContainer');
    container.innerHTML = '';

    missions.forEach(mission => {
        // Randomly select objectives
        const mainObj = mission.mainObjectives[Math.floor(Math.random() * mission.mainObjectives.length)];
        const selectedMiniGames = shuffleArray(mission.miniGames).slice(0, 3);
        const selectedSideQuests = shuffleArray(mission.sideQuests).slice(0, Math.floor(Math.random() * 3) + 2);

        const missionEl = createMissionElement(mission, mainObj, selectedMiniGames, selectedSideQuests);
        container.appendChild(missionEl);
    });

    initializeAchievements();
    checkMidnightMissions(); // Initialize midnight missions immediately
    startMissionTracking();
}

function createMissionElement(mission, mainObj, miniGames, sideQuests) {
    const div = document.createElement('div');
    div.className = 'mission';
    div.id = `mission-${mission.id}`;
    div.dataset.startTime = mission.startTime;
    div.dataset.endTime = mission.endTime;
    div.dataset.mainCompleted = 'false';

    // Initialize rerolls for this mission
    if (!gameState.missionRerolls[mission.id]) {
        gameState.missionRerolls[mission.id] = 0;
    }

    let html = `
        <div class="mission-header" onclick="toggleMission(${mission.id})">
            <div class="mission-title">${mission.title}</div>
            <div class="mission-time">${mission.timeRange}</div>
            <div class="collapse-icon" id="collapse-icon-${mission.id}">▼</div>
        </div>
        <div class="mission-content" id="content-${mission.id}">
            <div class="phase-indicator" id="phase-${mission.id}">Ready</div>
            <div class="mission-lore">${mission.lore}</div>
            <div class="main-objective">
                <h4>🎯 MAIN OBJECTIVE</h4>
                <p>${mainObj}</p>
            </div>
            <div class="tasks-container" id="tasks-${mission.id}">
    `;

    // Mini-games (filter out photo tasks from original list)
    const filteredMiniGames = miniGames.filter(game => {
        const isPhotoTask = game.toLowerCase().includes('photo') || game.toLowerCase().includes('capture') || game.toLowerCase().includes('picture') || game.toLowerCase().includes('selfie');
        return !isPhotoTask;
    });
    
    filteredMiniGames.forEach((game, idx) => {
        html += `
            <div class="task minigame" id="mini-${mission.id}-${idx}">
                <div class="task-content">
                    <div class="task-label">Mini-Game</div>
                    <div class="task-description">${game}</div>
                </div>
                <div class="task-points">+30</div>
                <button class="btn" onclick="completeTask('mini', ${mission.id}, ${idx})">COMPLETE</button>
            </div>
        `;
    });

    // Side quests (filter out photo tasks and add random photo task)
    const filteredSideQuests = sideQuests.filter(quest => {
        const isPhotoTask = quest.toLowerCase().includes('photo') || quest.toLowerCase().includes('capture') || quest.toLowerCase().includes('picture') || quest.toLowerCase().includes('selfie');
        return !isPhotoTask;
    });
    
    filteredSideQuests.forEach((quest, idx) => {
        html += `
            <div class="task sidequest" id="side-${mission.id}-${idx}">
                <div class="task-content">
                    <div class="task-label">Side Quest</div>
                    <div class="task-description">${quest}</div>
                </div>
                <div class="task-points">+20</div>
                <button class="btn" onclick="completeTask('side', ${mission.id}, ${idx})">COMPLETE</button>
            </div>
        `;
    });
    
    // Add random photo task
    if (mission.photoTasks && mission.photoTasks.length > 0) {
        const randomPhotoTask = mission.photoTasks[Math.floor(Math.random() * mission.photoTasks.length)];
        html += `
            <div class="task sidequest photo-task" id="side-${mission.id}-photo">
                <div class="task-content">
                    <div class="task-label">📸 Photo Quest</div>
                    <div class="task-description">${randomPhotoTask}</div>
                </div>
                <div class="task-points">+20</div>
                <button class="btn" onclick="completeTask('side', ${mission.id}, 'photo')">COMPLETE</button>
            </div>
        `;
    }

    html += `
            </div>
            <div class="reroll-section">
                <button class="btn" onclick="rerollMission(${mission.id})">🎲 REROLL TASKS <span id="reroll-penalty-${mission.id}">(-10 pts)</span></button>
                <div class="reroll-info">Rerolls used: <span id="reroll-count-${mission.id}">0/3</span></div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 10px 0;">
                <button class="btn" onclick="uploadMissionPhoto(${mission.id})" id="photo-btn-${mission.id}" style="font-size: 10px; padding: 8px;" title="Upload a photo">📸 PHOTO</button>
                <button class="btn" onclick="addMissionNote(${mission.id})" id="note-btn-${mission.id}" style="font-size: 10px; padding: 8px;" title="Add a note">📝 NOTE</button>
            </div>
            <button class="btn primary complete-main-btn" id="main-btn-${mission.id}" 
                    onclick="completeMainObjective(${mission.id})">
                ✓ COMPLETE MAIN OBJECTIVE (+100)
            </button>
        </div>
    `;

    div.innerHTML = html;
    return div;
}

function toggleMission(missionId) {
    const missionEl = document.getElementById(`mission-${missionId}`);
    const icon = document.getElementById(`collapse-icon-${missionId}`);
    
    // Check if mission is locked (has 'locked' class)
    if (missionEl.classList.contains('locked')) {
        showNotification('Mission locked until start time', 'error');
        return;
    }
    
    // Don't allow collapsing if collapsed and still locked
    if (missionEl.classList.contains('collapsed') && missionEl.classList.contains('locked')) {
        showNotification('Mission locked until start time', 'error');
        return;
    }
    
    missionEl.classList.toggle('collapsed');
    icon.textContent = missionEl.classList.contains('collapsed') ? '▶' : '▼';
}

function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    
    // Check if section is locked
    if (section.classList.contains('section-locked')) {
        showNotification('Locked until Mission 1 starts', 'error');
        return;
    }
    
    section.classList.toggle('collapsed');
    
    // Update arrow for these specific sections
    let arrowId = null;
    if (sectionId === 'secretMissionSection') arrowId = 'secret-arrow';
    else if (sectionId === 'midnightContainer') arrowId = 'midnight-arrow';
    else if (sectionId === 'achievementsSection') arrowId = 'achievements-arrow';
    
    if (arrowId) {
        const arrow = document.getElementById(arrowId);
        if (arrow) {
            arrow.textContent = section.classList.contains('collapsed') ? '▼' : '▲';
        }
    }
}

function completeTask(type, missionId, taskIdx) {
    const taskEl = document.getElementById(`${type}-${missionId}-${taskIdx}`);
    if (taskEl.classList.contains('completed')) return;

    // Check if this is a photo task
    const taskDescription = taskEl.querySelector('.task-description').textContent.toLowerCase();
    const isPhotoTask = taskDescription.includes('photo') || taskDescription.includes('capture') || taskDescription.includes('picture') || taskDescription.includes('selfie');
    
    if (isPhotoTask && !gameState.missionPhotos[missionId]) {
        showNotification('Please upload a photo for this mission first! 📸', 'error');
        return;
    }

    // Record action for undo
    recordAction({
        type: 'task',
        taskId: `${type}-${missionId}-${taskIdx}`,
        taskType: type,
        missionId: missionId,
        taskIdx: taskIdx
    });

    taskEl.classList.add('completed');
    const points = type === 'mini' ? 30 : 20;
    addScore(points);
    
    if (type === 'mini') {
        gameState.completedMiniGames++;
    } else {
        gameState.completedSideQuests++;
    }

    recordTaskCompletion(type, missionId);
    checkAchievements(missionId);
    showNotification(`+${points} points!`);
    saveGameState();
}

function completeMainObjective(missionId) {
    const missionEl = document.getElementById(`mission-${missionId}`);
    if (missionEl.dataset.mainCompleted === 'true') return;

    // Record action for undo
    recordAction({
        type: 'mainObjective',
        missionId: missionId
    });

    missionEl.dataset.mainCompleted = 'true';
    const btn = document.getElementById(`main-btn-${missionId}`);
    btn.disabled = true;
    btn.textContent = '✓ COMPLETED';
    
    addScore(100);
    gameState.completedMainObjectives++;
    recordMissionCompletion(missionId);
    
    checkAchievements(missionId);
    showNotification('+100 points! Main objective complete! 🎯');
    sendNotification('Mission Complete!', `Mission ${missionId} main objective completed!`);
    
    // Auto-collapse the mission after a brief delay
    setTimeout(() => {
        if (!missionEl.classList.contains('collapsed')) {
            toggleMission(missionId);
        }
    }, 1500);
    
    saveGameState();
}

function rerollMission(missionId) {
    const missionRerolls = gameState.missionRerolls[missionId] || 0;
    
    if (missionRerolls >= 3) {
        alert('Maximum rerolls reached for this mission!');
        return;
    }

    const mission = missions.find(m => m.id === missionId);
    const tasksContainer = document.getElementById(`tasks-${missionId}`);
    const currentTasks = Array.from(tasksContainer.querySelectorAll('.task:not(.completed)'));
    
    if (currentTasks.length === 0) {
        alert('No tasks left to reroll!');
        return;
    }

    // Record action for undo
    recordAction({
        type: 'reroll',
        missionId: missionId
    });

    // Remove random non-completed task
    const randomTask = currentTasks[Math.floor(Math.random() * currentTasks.length)];
    const isMiniGame = randomTask.classList.contains('minigame');
    const isPhotoTask = randomTask.classList.contains('photo-task');
    
    // Get new task
    let availableTasks, newTask;
    if (isPhotoTask && mission.photoTasks) {
        // Reroll to a different photo task
        const currentPhotoTask = randomTask.querySelector('.task-description').textContent;
        availableTasks = mission.photoTasks.filter(task => task !== currentPhotoTask);
        newTask = availableTasks[Math.floor(Math.random() * availableTasks.length)];
    } else {
        // Normal reroll - filter out photo tasks
        availableTasks = isMiniGame ? mission.miniGames : mission.sideQuests;
        availableTasks = availableTasks.filter(task => {
            const isPhotoRelated = task.toLowerCase().includes('photo') || task.toLowerCase().includes('capture') || task.toLowerCase().includes('picture') || task.toLowerCase().includes('selfie');
            return !isPhotoRelated;
        });
        newTask = availableTasks[Math.floor(Math.random() * availableTasks.length)];
    }
    
    // Replace task
    randomTask.querySelector('.task-description').textContent = newTask;
    randomTask.classList.remove('completed');

    // Apply penalty
    gameState.missionRerolls[missionId]++;
    gameState.rerollsUsed++; // Track total rerolls for summary
    const penalty = gameState.missionRerolls[missionId] * 10;
    addScore(-penalty);
    
    document.getElementById(`reroll-count-${missionId}`).textContent = `${gameState.missionRerolls[missionId]}/3`;
    
    // Update penalty display for next reroll
    const nextPenalty = (gameState.missionRerolls[missionId] + 1) * 10;
    const penaltySpan = document.getElementById(`reroll-penalty-${missionId}`);
    if (penaltySpan && gameState.missionRerolls[missionId] < 3) {
        penaltySpan.textContent = `(-${nextPenalty} pts)`;
    }
    
    showNotification(`Task rerolled! -${penalty} points`);
    saveGameState();
}

function revealSecretMission() {
    if (gameState.secretMissionRevealed) return;

    const secretMission = secretMissions[Math.floor(Math.random() * secretMissions.length)];
    gameState.secretMissionRevealed = true;
    gameState.secretMissionActive = true;

    const content = document.getElementById('secretMissionContent');
    const revealBtn = document.getElementById('revealSecretBtn');
    
    revealBtn.classList.add('hidden');
    content.classList.remove('hidden');
    
    content.innerHTML = `
        <div style="background: rgba(74, 144, 226, 0.2); padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="font-size: 13px; line-height: 1.5; margin-bottom: 10px;">${secretMission.task}</p>
            <div class="timer" id="secretTimer">${secretMission.timeLimit}:00</div>
            <button class="btn primary" onclick="completeSecretMission()">COMPLETE SECRET MISSION (+75)</button>
        </div>
    `;

    startSecretTimer(secretMission.timeLimit);
    showNotification('Secret mission activated! ⏰');
}

function startSecretTimer(minutes) {
    let timeLeft = minutes * 60;
    const timerEl = document.getElementById('secretTimer');
    
    const interval = setInterval(() => {
        if (!gameState.secretMissionActive) {
            clearInterval(interval);
            return;
        }

        timeLeft--;
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

        if (timeLeft <= 30) {
            timerEl.classList.add('warning');
        }

        if (timeLeft <= 0) {
            clearInterval(interval);
            failSecretMission();
        }
    }, 1000);
}

function completeSecretMission() {
    if (!gameState.secretMissionActive) return;

    gameState.secretMissionActive = false;
    gameState.secretMissionCompleted = true;
    addScore(75);
    unlockAchievement('classified');
    
    const content = document.getElementById('secretMissionContent');
    content.innerHTML = '<p style="color: #7cb342; font-size: 14px;">✓ SECRET MISSION COMPLETED! +75 POINTS</p>';
    
    showNotification('Secret mission complete! Well done, agents! 🔐');
}

function failSecretMission() {
    if (!gameState.secretMissionActive) return;

    gameState.secretMissionActive = false;
    gameState.secretMissionFailed = true;
    
    const content = document.getElementById('secretMissionContent');
    content.innerHTML = '<p style="color: #e74c3c; font-size: 14px;">✗ SECRET MISSION TIME EXPIRED!</p>';
    
    showPenaltyChallenge('secret', 30);
}

function showPenaltyChallenge(type, originalPenalty) {
    const challenge = penaltyChallenges[Math.floor(Math.random() * penaltyChallenges.length)];
    
    const modal = document.createElement('div');
    modal.className = 'penalty-challenge-modal';
    modal.id = 'penaltyModal';
    
    modal.innerHTML = `
        <div class="penalty-challenge-content">
            <h3>⚠️ PENALTY CHALLENGE</h3>
            <p>You failed the objective! Complete this challenge to reduce the penalty from <strong>-${originalPenalty}</strong> to <strong>-${Math.floor(originalPenalty * 0.6)}</strong> points.</p>
            <div style="background: rgba(22, 33, 62, 0.6); padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p style="font-size: 14px; color: #d4af37;">${challenge.task}</p>
            </div>
            <div class="challenge-timer" id="challengeTimer">${challenge.timeLimit}:00</div>
            <button class="btn primary" onclick="completePenaltyChallenge(${originalPenalty})">✓ COMPLETED CHALLENGE</button>
            <button class="btn danger" style="margin-top: 10px;" onclick="skipPenaltyChallenge(${originalPenalty})">SKIP (FULL PENALTY)</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    startChallengeTimer(challenge.timeLimit, originalPenalty);
}

function startChallengeTimer(minutes, penalty) {
    let timeLeft = minutes * 60;
    const timerEl = document.getElementById('challengeTimer');
    
    const interval = setInterval(() => {
        const modal = document.getElementById('penaltyModal');
        if (!modal) {
            clearInterval(interval);
            return;
        }

        timeLeft--;
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

        if (timeLeft <= 0) {
            clearInterval(interval);
            skipPenaltyChallenge(penalty);
        }
    }, 1000);
}

function completePenaltyChallenge(originalPenalty) {
    const reducedPenalty = Math.floor(originalPenalty * 0.6);
    addScore(-reducedPenalty);
    gameState.penaltyChallengesCompleted++;
    
    const modal = document.getElementById('penaltyModal');
    if (modal) modal.remove();
    
    showNotification(`Challenge complete! Penalty reduced to -${reducedPenalty} points!`);
}

function skipPenaltyChallenge(penalty) {
    addScore(-penalty);
    gameState.penaltyChallengeFailed++;
    
    const modal = document.getElementById('penaltyModal');
    if (modal) modal.remove();
    
    showNotification(`Full penalty applied: -${penalty} points`);
}

function startMissionTracking() {
    // Check every minute
    setInterval(() => {
        updateMissionStates();
        checkMidnightMissions();
    }, 60000);
    
    // Initial check
    updateMissionStates();
    checkMidnightMissions();
}

function updateMissionStates() {
    const now = new Date();
    const currentTime = gameState.testModeTime || `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Check if Mission 1 has started to unlock other sections
    const mission1 = missions[0];
    const mission1Started = currentTime >= mission1.startTime;
    const sectionsToUnlock = ['secretMissionSection', 'midnightContainer', 'achievementsSection'];
    
    sectionsToUnlock.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            if (mission1Started || (gameState.testMode && gameState.testModeRestrictionsDisabled)) {
                const wasLocked = section.classList.contains('section-locked');
                section.classList.remove('section-locked');
                // Only uncollapse when first unlocking (transitioning from locked to unlocked)
                if (wasLocked && section.classList.contains('collapsed')) {
                    section.classList.remove('collapsed');
                    const arrowIds = {'secretMissionSection': 'secret-arrow', 'midnightContainer': 'midnight-arrow', 'achievementsSection': 'achievements-arrow'};
                    const arrow = document.getElementById(arrowIds[sectionId]);
                    if (arrow) arrow.textContent = '▼';
                }
            } else {
                section.classList.add('section-locked');
                // Keep collapsed when locked
                if (!section.classList.contains('collapsed')) {
                    section.classList.add('collapsed');
                    const arrowIds = {'secretMissionSection': 'secret-arrow', 'midnightContainer': 'midnight-arrow', 'achievementsSection': 'achievements-arrow'};
                    const arrow = document.getElementById(arrowIds[sectionId]);
                    if (arrow) arrow.textContent = '▶';
                }
            }
        }
    });

    // Control the complete operation button
    const completeBtn = document.getElementById('completeOperationBtn');
    if (completeBtn) {
        if (mission1Started || (gameState.testMode && gameState.testModeRestrictionsDisabled)) {
            completeBtn.disabled = false;
            completeBtn.style.opacity = '1';
            completeBtn.style.cursor = 'pointer';
        } else {
            completeBtn.disabled = true;
            completeBtn.style.opacity = '0.5';
            completeBtn.style.cursor = 'not-allowed';
        }
    }

    missions.forEach(mission => {
        const missionEl = document.getElementById(`mission-${mission.id}`);
        const phaseEl = document.getElementById(`phase-${mission.id}`);
        const mainBtn = document.getElementById(`main-btn-${mission.id}`);

        // In test mode with restrictions disabled, all missions are always active
        if (gameState.testMode && gameState.testModeRestrictionsDisabled) {
            missionEl.classList.remove('faded', 'hidden');
            missionEl.classList.add('active');
            if (phaseEl) {
                phaseEl.textContent = '🔧 TEST MODE - ACTIVE';
                phaseEl.style.color = '#4a90e2';
            }
            return;
        }

        if (currentTime >= mission.startTime && currentTime < mission.endTime) {
            // Mission is active
            const wasLocked = missionEl.classList.contains('locked');
            missionEl.classList.remove('faded', 'hidden', 'locked');
            missionEl.classList.add('active');
            // Uncollapse when mission becomes active (only if it was locked before)
            if (wasLocked && missionEl.classList.contains('collapsed')) {
                missionEl.classList.remove('collapsed');
                const collapseIcon = document.getElementById(`collapse-icon-${mission.id}`);
                if (collapseIcon) collapseIcon.textContent = '▼';
            }
            if (phaseEl) {
                phaseEl.textContent = '⚡ ACTIVE NOW';
                phaseEl.style.color = '#d4af37';
            }
        } else if (currentTime >= mission.endTime) {
            // Mission time has passed
            missionEl.classList.remove('active', 'hidden', 'locked');
            missionEl.classList.add('faded');
            if (phaseEl) {
                phaseEl.textContent = '✓ Time Window Closed';
                phaseEl.style.color = '#888';
            }
            
            // Check if main objective was completed
            if (missionEl.dataset.mainCompleted === 'true') {
                // Mission completed - collapse it
                if (!missionEl.classList.contains('collapsed')) {
                    toggleMission(mission.id);
                }
            } else {
                // Mission not completed - mark as missed and disable all incomplete buttons
                if (!missionEl.dataset.missedPenaltyApplied) {
                    gameState.missedMainObjectives++;
                    showPenaltyChallenge('missed', 50);
                    missionEl.dataset.missedPenaltyApplied = 'true';
                }
                
                // Disable the main objective button if not completed
                if (mainBtn && !mainBtn.disabled) {
                    mainBtn.disabled = true;
                    mainBtn.textContent = '✗ TIME EXPIRED';
                    mainBtn.style.opacity = '0.3';
                }
                
                // Disable all incomplete task buttons
                const tasks = missionEl.querySelectorAll('.task:not(.completed) .btn');
                tasks.forEach(btn => {
                    btn.disabled = true;
                    btn.style.opacity = '0.3';
                });
            }
        } else {
            // Mission is in the future - show collapsed and locked
            missionEl.classList.remove('active', 'faded', 'hidden');
            missionEl.classList.add('locked', 'collapsed');
            const collapseIcon = document.getElementById(`collapse-icon-${mission.id}`);
            if (collapseIcon) collapseIcon.textContent = '▶';
            if (phaseEl) {
                phaseEl.textContent = '🔒 Locked until ' + mission.startTime;
                phaseEl.style.color = '#666';
            }
        }
    });
}

function finishMission() {
    const dateEndTime = new Date();
    const dateDuration = Math.floor((dateEndTime - gameState.dateStartTime) / 1000 / 60); // minutes
    
    // Unlock and reveal hidden achievement
    const hiddenAchievement = achievements.find(a => a.id === 'hidden');
    if (hiddenAchievement && !hiddenAchievement.unlocked) {
        hiddenAchievement.unlocked = true;
        hiddenAchievement.title = hiddenAchievement.realTitle;
        hiddenAchievement.description = hiddenAchievement.realDescription;
        hiddenAchievement.icon = hiddenAchievement.realIcon;
        // Update the display
        const achievementEl = document.getElementById('achievement-hidden');
        if (achievementEl) {
            achievementEl.querySelector('.achievement-icon').textContent = hiddenAchievement.realIcon;
            achievementEl.querySelector('.achievement-title').textContent = hiddenAchievement.realTitle;
            achievementEl.querySelector('.achievement-description').textContent = hiddenAchievement.realDescription;
            achievementEl.classList.add('unlocked');
        }
        showNotification('🤝 Hidden Achievement Unlocked: Partners in Crime!');
    }
    
    // Calculate final rank
    const currentRank = ranks.reduce((acc, rank) => 
        gameState.totalScore >= rank.minScore ? rank : acc
    );

    // Count total possible objectives
    const totalMainObjectives = missions.length;
    const totalUnlockedAchievements = achievements.filter(a => a.unlocked).length;

    const summaryContainer = document.getElementById('summaryScreenContainer');
    summaryContainer.classList.remove('hidden');
    
    summaryContainer.innerHTML = `
        <div class="summary-screen">
            <h2>🎯 OPERATION SUMMARY</h2>
            
            <div class="score-display">${gameState.totalScore}</div>
            <div class="rank-display" style="font-size: 20px; color: #d4af37; margin: 15px 0;">${currentRank.name}</div>
            <div style="font-size: 13px; line-height: 1.6; padding: 12px; background: rgba(139, 69, 19, 0.2); border-radius: 8px; margin: 10px 0; font-style: italic;">
                ${currentRank.description}
            </div>
            <div class="reward-display" style="font-size: 14px; line-height: 1.6; padding: 15px; background: rgba(212, 175, 55, 0.2); border-radius: 8px; margin: 15px 0; border: 2px solid #d4af37;">
                <strong style="color: #d4af37;">🎁 YOUR REWARD:</strong><br>
                ${currentRank.reward}
            </div>

            <div class="stats-grid">
                <div class="stat-box">
                    <div class="stat-value">${gameState.completedMainObjectives}</div>
                    <div class="stat-label">Main Objectives</div>
                    <div style="font-size: 10px; color: #888; margin-top: 5px;">of ${totalMainObjectives}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${gameState.completedMiniGames}</div>
                    <div class="stat-label">Mini-Games</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${gameState.completedSideQuests}</div>
                    <div class="stat-label">Side Quests</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${gameState.midnightMissionsCompleted}</div>
                    <div class="stat-label">Midnight Missions</div>
                    <div style="font-size: 10px; color: #888; margin-top: 5px;">of 10</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${totalUnlockedAchievements}</div>
                    <div class="stat-label">Achievements</div>
                    <div style="font-size: 10px; color: #888; margin-top: 5px;">of ${achievements.length}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${gameState.rerollsUsed}</div>
                    <div class="stat-label">Rerolls Used</div>
                </div>
            </div>

            <div style="background: rgba(22, 33, 62, 0.6); padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 13px; line-height: 1.8;">
                <strong style="color: #d4af37;">ADDITIONAL STATS:</strong><br>
                ⏱️ Mission Duration: ~${dateDuration} minutes<br>
                ${gameState.secretMissionCompleted ? '✓ Secret Mission: Completed (+75 pts)' : gameState.secretMissionFailed ? '✗ Secret Mission: Failed' : '— Secret Mission: Not Attempted'}<br>
                ${gameState.completedMainObjectives === totalMainObjectives ? '✓ All Main Objectives Completed!' : gameState.missedMainObjectives > 0 ? `⚠️ Missed Main Objectives: ${gameState.missedMainObjectives}` : `📊 Main Objectives: ${gameState.completedMainObjectives}/${totalMainObjectives}`}<br>
                ${gameState.penaltyChallengesCompleted > 0 ? `💪 Penalty Challenges Won: ${gameState.penaltyChallengesCompleted}` : ''}<br>
                ${gameState.penaltyChallengeFailed > 0 ? `❌ Penalty Challenges Failed: ${gameState.penaltyChallengeFailed}` : ''}<br>
                📸 Photos Uploaded: ${Object.keys(gameState.missionPhotos).length}<br>
                📝 Notes Written: ${Object.keys(gameState.missionNotes).length}
            </div>
            ${Object.keys(gameState.missionPhotos).length > 0 ? `
            <div style="background: rgba(139, 69, 19, 0.15); padding: 15px; border-radius: 8px; margin: 20px 0; border: 2px solid #8b4513;">
                <strong style="color: #d4af37;">📸 MISSION PHOTOS:</strong><br>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px;">
                ${Object.entries(gameState.missionPhotos).map(([missionId, photoObj]) => {
                    const mission = missions.find(m => m.id === parseInt(missionId));
                    const missionTitle = mission ? mission.title : `Mission ${missionId}`;
                    const photoSrc = typeof photoObj === 'string' ? photoObj : photoObj.data;
                    
                    // Get photo task description from the mission
                    const missionEl = document.getElementById(`mission-${missionId}`);
                    let photoTaskDesc = '';
                    if (missionEl) {
                        const photoTask = missionEl.querySelector('.photo-task .task-description');
                        if (photoTask) {
                            photoTaskDesc = photoTask.textContent;
                        }
                    }
                    
                    return `
                        <div style="text-align: center;">
                            <div style="width: 100%; padding-bottom: 133.33%; position: relative; border-radius: 8px; overflow: hidden; border: 2px solid #8b4513;">
                                <img src="${photoSrc}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" alt="Mission ${missionId} Photo">
                            </div>
                            <div style="font-size: 10px; color: #d4af37; margin-top: 8px; font-weight: bold;">${missionTitle}</div>
                            ${photoTaskDesc ? `<div style="font-size: 9px; color: #888; margin-top: 3px; font-style: italic; line-height: 1.3;">${photoTaskDesc}</div>` : ''}
                        </div>
                    `;
                }).join('')}
                </div>
            </div>
            ` : ''}
            ${Object.keys(gameState.missionNotes).length > 0 ? `
            <div style="background: rgba(74, 144, 226, 0.15); padding: 15px; border-radius: 8px; margin: 20px 0; border: 2px solid #4a90e2;">
                <strong style="color: #4a90e2;">📝 MISSION NOTES:</strong><br>
                ${Object.entries(gameState.missionNotes).map(([missionId, note]) => {
                    const mission = missions.find(m => m.id === parseInt(missionId));
                    const missionTitle = mission ? mission.title : `Mission ${missionId}`;
                    return `
                        <div style="margin: 10px 0; padding: 10px; background: rgba(26, 26, 46, 0.6); border-radius: 6px; border-left: 3px solid #4a90e2;">
                            <strong style="color: #d4af37;">${missionTitle}</strong><br>
                            <span style="color: #c0c0c0; font-size: 12px; font-style: italic;">${note}</span>
                        </div>
                    `;
                }).join('')}
            </div>
            ` : ''}

            <div style="text-align: center; padding: 20px; border-top: 2px solid #d4af37; margin-top: 20px;">
                <p style="font-size: 14px; line-height: 1.6; color: #c0c0c0; font-style: italic;">
                    "Every mission has an end, but the best partnerships are just beginning. Until the next operation, agents." 🤠🕵️
                </p>
                <button class="btn primary" onclick="exportSummaryAsImage()" style="margin-top: 20px; padding: 12px 24px; font-size: 14px;">🖼️ EXPORT SUMMARY</button>
            </div>
        </div>
    `;

    // Scroll to summary
    summaryContainer.scrollIntoView({ behavior: 'smooth' });
}

function checkMidnightMissions() {
    const now = new Date();
    let currentHour = now.getHours();
    
    // Use test mode time if set
    if (gameState.testModeTime) {
        currentHour = parseInt(gameState.testModeTime.split(':')[0]);
    }
    
    const container = document.getElementById('midnightContainer');
    const content = document.getElementById('midnightContent');
    
    if ((gameState.testMode && gameState.testModeRestrictionsDisabled) || currentHour === 23) {
        // Midnight missions are unlocked (23:00-23:59)
        container.classList.remove('locked');
        if (gameState.midnightMissionsCompleted < 10) {
            if (document.getElementById('midnightMissionContent').children.length === 0) {
                loadNextMidnightMission();
            }
        }
    } else {
        // Midnight missions are locked
        container.classList.add('locked');
        content.innerHTML = '<div class="locked-overlay"><p>🔒 LOCKED UNTIL 23:00</p><p style="font-size: 11px; margin-top: 10px;">These challenges will unlock at 23:00 for one hour</p></div>';
    }
}

function loadNextMidnightMission() {
    if (gameState.midnightMissionsCompleted >= 10) {
        document.getElementById('midnightMissionContent').innerHTML = 
            '<p style="color: #7cb342; text-align: center; padding: 20px;">🎉 ALL WITCHING HOUR CHALLENGES COMPLETED!</p>';
        unlockAchievement('witching');
        return;
    }

    const mission = midnightMissions[gameState.midnightMissionsCompleted];
    const content = document.getElementById('midnightMissionContent');
    
    content.innerHTML = `
        <div style="background: rgba(155, 89, 182, 0.2); padding: 15px; border-radius: 8px; margin: 10px 0;">
            <p style="font-size: 13px; line-height: 1.5; margin-bottom: 10px;">${mission.task}</p>
            <button class="btn primary" onclick="completeMidnightMission()">COMPLETE (+${mission.points})</button>
        </div>
    `;
}

function completeMidnightMission() {
    const mission = midnightMissions[gameState.midnightMissionsCompleted];
    addScore(mission.points);
    gameState.midnightMissionsCompleted++;
    
    document.getElementById('midnightProgress').textContent = `${gameState.midnightMissionsCompleted} / 10`;
    
    showNotification(`Midnight mission complete! +${mission.points} points 🌙`);
    
    setTimeout(() => loadNextMidnightMission(), 500);
    saveGameState();
}

function initializeAchievements() {
    const container = document.getElementById('achievementsContainer');
    container.innerHTML = '';

    achievements.forEach(achievement => {
        const div = document.createElement('div');
        div.className = 'achievement';
        div.id = `achievement-${achievement.id}`;
        
        // Show real info if unlocked or not hidden, otherwise show placeholder
        const isRevealed = achievement.unlocked || !achievement.hidden;
        const displayIcon = isRevealed ? achievement.icon : (achievement.hidden && !achievement.unlocked ? achievement.icon : achievement.realIcon);
        const displayTitle = isRevealed ? achievement.title : (achievement.hidden && !achievement.unlocked ? achievement.title : achievement.realTitle);
        const displayDesc = isRevealed ? achievement.description : (achievement.hidden && !achievement.unlocked ? achievement.description : achievement.realDescription);
        
        div.innerHTML = `
            <div class="achievement-icon">${displayIcon}</div>
            <div class="achievement-info">
                <div class="achievement-title">${displayTitle}</div>
                <div class="achievement-description">${displayDesc}</div>
            </div>
        `;
        
        container.appendChild(div);
    });
}

function unlockAchievement(achievementId) {
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement || achievement.unlocked) return;

    achievement.unlocked = true;
    const el = document.getElementById(`achievement-${achievementId}`);
    el.classList.add('unlocked');
    
    showNotification(`🏆 Achievement Unlocked: ${achievement.title}!`);
    saveGameState();
}

function checkAchievements(missionId) {
    // Check perfectionist
    const missionEl = document.getElementById(`mission-${missionId}`);
    const allTasks = missionEl.querySelectorAll('.task');
    const completedTasks = missionEl.querySelectorAll('.task.completed');
    const mainCompleted = missionEl.dataset.mainCompleted === 'true';

    if (allTasks.length === completedTasks.length && mainCompleted) {
        unlockAchievement('perfectionist');
    }

    // Check social butterfly
    if (gameState.completedSideQuests >= 5) {
        unlockAchievement('social');
    }

    // Check game master
    if (gameState.completedMiniGames >= 5) {
        unlockAchievement('competitor');
    }

    // Check flawless execution
    if (gameState.completedMainObjectives === missions.length) {
        unlockAchievement('flawless');
    }

    // Check legendary lovers
    if (gameState.totalScore >= 1000) {
        unlockAchievement('dedication');
    }
}

function addScore(points) {
    gameState.totalScore += points;
    updateProgressBar();
    saveGameState();
}

function updateProgressBar() {
    const maxScore = 1000;
    const percentage = Math.min((gameState.totalScore / maxScore) * 100, 100);
    
    document.getElementById('progressFill').style.width = `${percentage}%`;
    document.getElementById('progressText').textContent = `${gameState.totalScore} / ${maxScore} points`;

    // Update rank in real-time
    const currentRank = ranks.reduce((acc, rank) => 
        gameState.totalScore >= rank.minScore ? rank : acc
    );
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    if (type === 'error') {
        notification.style.background = '#e74c3c';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function enterTestMode() {
    const password = prompt('Enter test mode password:');
    if (password === 'echo') {
        gameState.testMode = true;
        alert('Test mode activated! All missions and challenges are accessible. You can also override the time of day.');
        startMission();
        // Show test mode controls
        document.getElementById('testModeControls').classList.remove('hidden');
    } else if (password !== null) {
        alert('Incorrect password.');
    }
}

function setTestTime() {
    const timeInput = document.getElementById('testTimeInput').value;
    if (timeInput) {
        gameState.testModeTime = timeInput;
        document.getElementById('currentTestTime').textContent = `⏰ Simulating time: ${timeInput}`;
        updateMissionStates();
        checkMidnightMissions();
        showNotification(`Time set to ${timeInput}`);
    }
}

function clearTestTime() {
    gameState.testModeTime = null;
    document.getElementById('currentTestTime').textContent = '';
    document.getElementById('testTimeInput').value = '';
    updateMissionStates();
    checkMidnightMissions();
    showNotification('Using real time');
}

function toggleTestRestrictions() {
    gameState.testModeRestrictionsDisabled = !gameState.testModeRestrictionsDisabled;
    const btn = document.getElementById('toggleRestrictionsBtn');
    
    if (gameState.testModeRestrictionsDisabled) {
        btn.textContent = '🔓 Restrictions: OFF';
        btn.classList.add('primary');
        showNotification('Time restrictions disabled - all content accessible');
    } else {
        btn.textContent = '🔒 Restrictions: ON';
        btn.classList.remove('primary');
        showNotification('Time restrictions enabled - testing time-based features');
    }
    
    updateMissionStates();
    checkMidnightMissions();
}

function startMission() {
    // Check if operation is unlocked (December 6, 2025 at 00:00)
    const unlockDate = new Date('2025-12-06T00:00:00');
    const now = new Date();
    
    if (now < unlockDate && !gameState.testMode) {
        alert(`🤠 EASY THERE, TRIGGER FINGER! 🕵️\n\nLooks like someone's eager to ride into action...\n\nBut even the sharpest agents know the value of patience. This saloon doesn't open its doors 'til Saturday, partner.\n\n🔒 OPERATION DJANGO SALSA\nClassified until December 6th, 2025\n\nThe mission will be worth the wait. 🌵`);
        return;
    }
    
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('mainContent').classList.add('active');
    
    // Request notification permission
    requestNotificationPermission();
    
    // Initialize missions after starting
    initializeMissions();
    
    // Track mission start times
    missions.forEach(mission => {
        recordMissionStart(mission.id);
    });
    
    // Try to load saved game
    const loaded = loadGameState();
    if (loaded) {
        showNotification('Progress restored! 💾');
        // Update photo buttons if photos exist
        Object.keys(gameState.missionPhotos).forEach(missionId => {
            updatePhotoButton(parseInt(missionId));
        });
        // Update note buttons if notes exist
        Object.keys(gameState.missionNotes).forEach(missionId => {
            updateNoteButton(parseInt(missionId));
        });
        updateUndoButton();
    }
}

// Initialize on load - but don't start missions yet
window.onload = () => {
    // Landing page is shown by default
    
    // Add feature buttons to header after main content loads
    setTimeout(() => {
        const header = document.querySelector('.header');
        if (header && !document.getElementById('featureButtons')) {
            const featureDiv = document.createElement('div');
            featureDiv.id = 'featureButtons';
            featureDiv.style.cssText = 'display: flex; gap: 5px; flex-wrap: wrap; justify-content: center; margin-top: 15px;';
            featureDiv.innerHTML = `
                <button class="btn" id="undoBtn" onclick="undoLastAction()" style="font-size: 9px; padding: 5px 10px;" title="Undo last action">↩️ UNDO</button>
                <button class="btn" onclick="showConversationCard()" style="font-size: 9px; padding: 5px 10px;" title="Conversation starter">💬 CONVERSATION STARTERS</button>
                <button class="btn" onclick="luckySpinWheel()" style="font-size: 9px; padding: 5px 10px;" title="Lucky spin wheel">🌟 LUCKY SPIN</button>
                <button class="btn" onclick="randomChallenge()" style="font-size: 9px; padding: 5px 10px;" title="Random challenge">🎲 RANDOM CHALLENGE</button>
                <button class="btn" onclick="showStatistics()" style="font-size: 9px; padding: 5px 10px;" title="View statistics">📊 VIEW STATISTICS</button>
            `;
            header.appendChild(featureDiv);
            updateUndoButton();
        }
    }, 100);
};

// Update photo buttons when clicking photo upload
function setupPhotoButtons() {
    Object.keys(gameState.missionPhotos).forEach(missionId => {
        const btn = document.getElementById(`photo-btn-${missionId}`);
        if (btn) {
            btn.onclick = () => viewMissionPhoto(parseInt(missionId));
            btn.textContent = '🖼️ VIEW PHOTO';
            btn.classList.add('primary');
        }
    });
}

// Check and update operation lock status
function checkOperationLock() {
    const unlockDate = new Date('2025-12-06T00:00:00');
    const now = new Date();
    const startBtn = document.querySelector('.start-mission-btn');
    
    if (!startBtn) return;
    
    if (now < unlockDate && !gameState.testMode) {
        startBtn.style.opacity = '0.5';
        startBtn.innerHTML = '🔒 LOCKED UNTIL DEC 6';
    } else {
        startBtn.style.opacity = '1';
        startBtn.innerHTML = '🎯 INITIATE OPERATION';
    }
}

// Call on page load
checkOperationLock();
// Update lock status every minute
setInterval(checkOperationLock, 60000);
