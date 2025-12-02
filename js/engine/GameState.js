/**
 * Game State
 * ===========
 * Manages persistent game data and progress
 */

export class GameState {
    constructor() {
        this.storageKey = 'shepherd-forest-rescue';
        
        // Default state
        this.defaultState = {
            // Progress
            currentLevel: 1,
            unlockedLevels: [1],
            
            // Per-level data
            levelData: {
                1: { completed: false, sheepRescued: 0, totalSheep: 3, collectibles: 0, goldenWool: 0 },
                2: { completed: false, sheepRescued: 0, totalSheep: 4, collectibles: 0, goldenWool: 0 },
                3: { completed: false, sheepRescued: 0, totalSheep: 4, collectibles: 0, goldenWool: 0 },
                4: { completed: false, sheepRescued: 0, totalSheep: 5, collectibles: 0, goldenWool: 0 },
                5: { completed: false, sheepRescued: 0, totalSheep: 6, collectibles: 0, goldenWool: 0 },
            },
            
            // Stats
            totalSheepRescued: 0,
            totalCollectibles: 0,
            totalGoldenWool: 0,
            playTime: 0,
            
            // Settings
            settings: {
                musicVolume: 70,
                sfxVolume: 80,
                showTouchControls: true,
            },
            
            // Tutorial
            tutorialCompleted: false,
        };
        
        // Current state
        this.data = null;
        
        // Load saved state
        this.load();
    }
    
    /**
     * Load state from localStorage
     */
    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge with defaults to handle new properties
                this.data = this.mergeDeep(this.defaultState, parsed);
                
                // Ensure unlockedLevels is always an array
                if (!Array.isArray(this.data.unlockedLevels)) {
                    this.data.unlockedLevels = [1];
                }
                
                console.log('💾 Game state loaded');
            } else {
                this.data = JSON.parse(JSON.stringify(this.defaultState));
                console.log('💾 New game state created');
            }
        } catch (e) {
            console.warn('Failed to load game state, using defaults');
            this.data = JSON.parse(JSON.stringify(this.defaultState));
        }
    }
    
    /**
     * Save state to localStorage
     */
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            console.log('💾 Game state saved');
        } catch (e) {
            console.warn('Failed to save game state');
        }
    }
    
    /**
     * Reset all progress
     */
    reset() {
        this.data = JSON.parse(JSON.stringify(this.defaultState));
        this.save();
        console.log('💾 Game state reset');
    }
    
    /**
     * Complete a level
     */
    completeLevel(levelNum, sheepRescued, collectibles, goldenWool) {
        const levelData = this.data.levelData[levelNum];
        if (!levelData) return;
        
        // Update level data
        levelData.completed = true;
        levelData.sheepRescued = Math.max(levelData.sheepRescued, sheepRescued);
        levelData.collectibles = Math.max(levelData.collectibles, collectibles);
        levelData.goldenWool = Math.max(levelData.goldenWool, goldenWool);
        
        // Unlock next level
        const nextLevel = levelNum + 1;
        if (nextLevel <= 5 && !this.data.unlockedLevels.includes(nextLevel)) {
            this.data.unlockedLevels.push(nextLevel);
            console.log('🔓 Unlocked level', nextLevel);
        }
        
        console.log('✅ Level', levelNum, 'completed! Unlocked levels:', this.data.unlockedLevels);
        
        // Update totals
        this.recalculateTotals();
        
        this.save();
    }
    
    /**
     * Recalculate total stats
     */
    recalculateTotals() {
        let totalSheep = 0;
        let totalCollectibles = 0;
        let totalGoldenWool = 0;
        
        Object.values(this.data.levelData).forEach(level => {
            totalSheep += level.sheepRescued;
            totalCollectibles += level.collectibles;
            totalGoldenWool += level.goldenWool;
        });
        
        this.data.totalSheepRescued = totalSheep;
        this.data.totalCollectibles = totalCollectibles;
        this.data.totalGoldenWool = totalGoldenWool;
    }
    
    /**
     * Check if level is unlocked
     */
    isLevelUnlocked(levelNum) {
        return this.data.unlockedLevels.includes(levelNum);
    }
    
    /**
     * Get level data
     */
    getLevelData(levelNum) {
        return this.data.levelData[levelNum];
    }
    
    /**
     * Update settings
     */
    updateSettings(settings) {
        Object.assign(this.data.settings, settings);
        this.save();
    }
    
    /**
     * Get settings
     */
    getSettings() {
        return this.data.settings;
    }
    
    /**
     * Check if there's a saved game
     */
    hasSavedGame() {
        return this.data.unlockedLevels.length > 1 || 
               Object.values(this.data.levelData).some(l => l.completed);
    }
    
    /**
     * Deep merge objects
     */
    mergeDeep(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] instanceof Object && key in target) {
                result[key] = this.mergeDeep(target[key], source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }
    
    /**
     * Add play time
     */
    addPlayTime(seconds) {
        this.data.playTime += seconds;
    }
    
    /**
     * Get formatted play time
     */
    getFormattedPlayTime() {
        const hours = Math.floor(this.data.playTime / 3600);
        const minutes = Math.floor((this.data.playTime % 3600) / 60);
        const seconds = Math.floor(this.data.playTime % 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    }
}
