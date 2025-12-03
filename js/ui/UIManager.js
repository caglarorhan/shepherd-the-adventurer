/**
 * UI Manager
 * ===========
 * Handles all UI interactions and screen management
 */

export class UIManager {
    constructor(game) {
        this.game = game;
        this.currentScreen = 'main-menu';
        // Load selected level from game state if available
        this.selectedLevel = game.state?.data?.currentLevel || 1;
    }
    
    /**
     * Initialize UI
     */
    init() {
        this.bindMainMenu();
        this.bindLevelSelect();
        this.bindOptions();
        this.bindCredits();
        this.bindGameUI();
        this.bindOverlays();
        this.bindKeyboardNavigation();
        
        // Check for saved game
        this.updateContinueButton();
        this.updateLevelButtons();
        
        // Load settings
        this.loadSettings();
        
        console.log('🖥️ UI Manager initialized');
    }
    
    /**
     * Bind keyboard navigation for buttons
     */
    bindKeyboardNavigation() {
        // Handle Enter and Space on focused buttons
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const activeElement = document.activeElement;
                if (activeElement && activeElement.tagName === 'BUTTON') {
                    e.preventDefault();
                    activeElement.click();
                }
            }
        });
    }
    
    /**
     * Bind main menu buttons
     */
    bindMainMenu() {
        // Start button
        document.getElementById('btn-start').addEventListener('click', () => {
            this.showScreen('level-select');
        });
        
        // Continue button
        document.getElementById('btn-continue').addEventListener('click', () => {
            const lastLevel = this.game.state.data.currentLevel;
            this.startLevel(lastLevel);
        });
        
        // Options button
        document.getElementById('btn-options').addEventListener('click', () => {
            this.showScreen('options-screen');
        });
        
        // Credits button
        document.getElementById('btn-credits').addEventListener('click', () => {
            this.showScreen('credits-screen');
        });
    }
    
    /**
     * Bind level select buttons
     */
    bindLevelSelect() {
        // Level buttons
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const level = parseInt(btn.dataset.level);
                if (this.game.state.isLevelUnlocked(level)) {
                    this.startLevel(level);
                }
            });
        });
        
        // Back button
        document.getElementById('btn-back-menu').addEventListener('click', () => {
            this.showScreen('main-menu');
        });
    }
    
    /**
     * Bind options screen
     */
    bindOptions() {
        // Music volume
        document.getElementById('music-volume').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.game.audio.setMusicVolume(value / 100);
            this.game.state.updateSettings({ musicVolume: value });
        });
        
        // SFX volume
        document.getElementById('sfx-volume').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.game.audio.setSFXVolume(value / 100);
            this.game.state.updateSettings({ sfxVolume: value });
            // Play test sound
            this.game.audio.playCollect();
        });
        
        // Touch controls
        document.getElementById('touch-controls').addEventListener('change', (e) => {
            const show = e.target.checked;
            this.game.state.updateSettings({ showTouchControls: show });
            this.updateTouchControls(show);
        });
        
        // Back button
        document.getElementById('btn-options-back').addEventListener('click', () => {
            this.showScreen('main-menu');
        });
    }
    
    /**
     * Bind credits screen
     */
    bindCredits() {
        document.getElementById('btn-credits-back').addEventListener('click', () => {
            this.showScreen('main-menu');
        });
    }
    
    /**
     * Bind game UI elements
     */
    bindGameUI() {
        // Pause button
        document.getElementById('btn-pause').addEventListener('click', () => {
            this.game.pause();
            this.showOverlay('pause-menu');
        });
    }
    
    /**
     * Bind overlay buttons
     */
    bindOverlays() {
        // Pause menu
        document.getElementById('btn-resume').addEventListener('click', () => {
            this.hideOverlay('pause-menu');
            this.game.resume();
        });
        
        document.getElementById('btn-restart').addEventListener('click', () => {
            this.hideOverlay('pause-menu');
            this.restartLevel();
        });
        
        document.getElementById('btn-quit').addEventListener('click', () => {
            this.hideOverlay('pause-menu');
            this.quitToMenu();
        });
        
        // Level complete
        document.getElementById('btn-next-level').addEventListener('click', () => {
            this.hideOverlay('level-complete');
            const nextLevel = this.selectedLevel + 1;
            if (nextLevel <= 5) {
                this.startLevel(nextLevel);
            } else {
                this.quitToMenu();
                this.showToast('🎉 Congratulations! You completed all levels!');
            }
        });
        
        document.getElementById('btn-replay').addEventListener('click', () => {
            this.hideOverlay('level-complete');
            this.restartLevel();
        });
        
        document.getElementById('btn-complete-menu').addEventListener('click', () => {
            this.hideOverlay('level-complete');
            this.quitToMenu();
        });
        
        // Game over
        document.getElementById('btn-retry').addEventListener('click', () => {
            this.hideOverlay('game-over');
            this.restartLevel();
        });
        
        document.getElementById('btn-gameover-menu').addEventListener('click', () => {
            this.hideOverlay('game-over');
            this.quitToMenu();
        });
    }
    
    /**
     * Show a screen
     */
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        document.getElementById(screenId).classList.add('active');
        this.currentScreen = screenId;
        
        // Update level buttons when showing level select
        if (screenId === 'level-select') {
            this.updateLevelButtons();
        }
    }
    
    /**
     * Show an overlay
     */
    showOverlay(overlayId) {
        document.getElementById(overlayId).classList.add('active');
    }
    
    /**
     * Hide an overlay
     */
    hideOverlay(overlayId) {
        document.getElementById(overlayId).classList.remove('active');
    }
    
    /**
     * Start a level
     */
    startLevel(levelNum) {
        this.selectedLevel = levelNum;
        this.game.state.data.currentLevel = levelNum;
        this.game.state.save(); // Save current level to localStorage
        
        // Show game screen
        this.showScreen('game-screen');
        
        // Show loading
        this.showOverlay('loading-screen');
        document.getElementById('loading-progress').style.width = '0%';
        document.getElementById('loading-text').textContent = 'Loading level...';
        
        // Simulate loading progress
        let progress = 0;
        const loadInterval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) {
                progress = 100;
                clearInterval(loadInterval);
                
                // Start the game
                setTimeout(() => {
                    this.hideOverlay('loading-screen');
                    this.game.scenes.switchTo('game', { level: levelNum });
                    this.game.start();
                    
                    // Show touch controls if on touch device
                    this.showTouchControls();
                }, 300);
            }
            document.getElementById('loading-progress').style.width = progress + '%';
        }, 100);
    }
    
    /**
     * Show touch controls for mobile devices
     */
    showTouchControls() {
        const isTouchDevice = ('ontouchstart' in window) || 
                              (navigator.maxTouchPoints > 0);
        const touchControls = document.getElementById('touch-controls');
        
        if (touchControls && isTouchDevice) {
            touchControls.classList.add('active');
        }
    }
    
    /**
     * Hide touch controls
     */
    hideTouchControls() {
        const touchControls = document.getElementById('touch-controls');
        if (touchControls) {
            touchControls.classList.remove('active');
        }
    }
    
    /**
     * Restart current level
     */
    restartLevel() {
        // Ensure we have the correct level (from game state if needed)
        const levelToRestart = this.selectedLevel || this.game.state.data.currentLevel || 1;
        console.log(`🔄 Restarting level ${levelToRestart}`);
        this.game.stop();
        this.startLevel(levelToRestart);
    }
    
    /**
     * Quit to main menu
     */
    quitToMenu() {
        this.game.stop();
        this.hideTouchControls();
        this.showScreen('main-menu');
        this.updateContinueButton();
        this.updateLevelButtons();
    }
    
    /**
     * Update continue button state
     */
    updateContinueButton() {
        const btn = document.getElementById('btn-continue');
        const hasSave = this.game.state.hasSavedGame();
        btn.disabled = !hasSave;
    }
    
    /**
     * Update level select buttons
     */
    updateLevelButtons() {
        document.querySelectorAll('.level-btn').forEach(btn => {
            const level = parseInt(btn.dataset.level);
            const isUnlocked = this.game.state.isLevelUnlocked(level);
            const levelData = this.game.state.getLevelData(level);
            
            btn.classList.toggle('unlocked', isUnlocked);
            btn.classList.toggle('locked', !isUnlocked);
            btn.disabled = !isUnlocked;
            
            const sheepSpan = btn.querySelector('.level-sheep');
            if (isUnlocked) {
                sheepSpan.textContent = `🐑 ${levelData.sheepRescued}/${levelData.totalSheep}`;
            } else {
                sheepSpan.textContent = '🔒';
            }
        });
        
        console.log('📋 Level buttons updated. Unlocked levels:', this.game.state.data.unlockedLevels);
    }
    
    /**
     * Load settings from game state
     */
    loadSettings() {
        const settings = this.game.state.getSettings();
        
        document.getElementById('music-volume').value = settings.musicVolume;
        document.getElementById('sfx-volume').value = settings.sfxVolume;
        document.getElementById('touch-controls').checked = settings.showTouchControls;
        
        this.game.audio.setMusicVolume(settings.musicVolume / 100);
        this.game.audio.setSFXVolume(settings.sfxVolume / 100);
        this.updateTouchControls(settings.showTouchControls);
    }
    
    /**
     * Update touch controls visibility
     */
    updateTouchControls(show) {
        const controls = document.getElementById('touch-controls');
        controls.classList.toggle('active', show);
    }
    
    /**
     * Show a toast notification
     */
    showToast(message, duration = 3000) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.getElementById('game-container').appendChild(toast);
        
        setTimeout(() => toast.remove(), duration);
    }
    
    /**
     * Show rescue prompt
     */
    showRescuePrompt(show = true) {
        let prompt = document.querySelector('.rescue-prompt');
        
        if (show && !prompt) {
            prompt = document.createElement('div');
            prompt.className = 'rescue-prompt';
            prompt.innerHTML = 'Press <span class="key">E</span> to rescue';
            document.getElementById('game-screen').appendChild(prompt);
        } else if (!show && prompt) {
            prompt.remove();
        }
    }
    
    /**
     * Update energy bar
     */
    updateEnergyBar(current, max) {
        let bar = document.querySelector('.energy-bar');
        
        if (!bar) {
            bar = document.createElement('div');
            bar.className = 'energy-bar';
            bar.innerHTML = `
                <div class="label">Energy</div>
                <div class="bar"><div class="fill"></div></div>
            `;
            document.getElementById('game-screen').appendChild(bar);
        }
        
        const fill = bar.querySelector('.fill');
        fill.style.width = (current / max * 100) + '%';
    }
}
