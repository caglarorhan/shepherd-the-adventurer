/**
 * Shepherd's Forest Rescue - Main Entry Point
 * ============================================
 */

import { Game } from './engine/Game.js';
import { UIManager } from './ui/UIManager.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌲 Shepherd\'s Forest Rescue - Starting...');
    
    // Initialize the game
    const game = new Game();
    const ui = new UIManager(game);
    
    // Make game globally accessible for debugging
    window.game = game;
    
    // Initialize and start
    game.init().then(() => {
        console.log('✅ Game initialized successfully!');
        ui.init();
    }).catch(error => {
        console.error('❌ Failed to initialize game:', error);
    });
});
