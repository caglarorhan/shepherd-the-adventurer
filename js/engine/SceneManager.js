/**
 * Scene Manager
 * ==============
 * Manages game scenes and transitions
 */

import { GameScene } from '../scenes/GameScene.js';

export class SceneManager {
    constructor(game) {
        this.game = game;
        this.scenes = new Map();
        this.currentScene = null;
        this.currentSceneName = null;
        this.isTransitioning = false;
    }
    
    /**
     * Initialize scenes
     */
    init() {
        // Register all scenes
        this.register('game', new GameScene(this.game));
        
        console.log('🎬 Scene manager initialized');
    }
    
    /**
     * Register a scene
     */
    register(name, scene) {
        this.scenes.set(name, scene);
        scene.name = name;
    }
    
    /**
     * Switch to a scene
     */
    async switchTo(name, data = {}) {
        if (this.isTransitioning) return;
        
        const nextScene = this.scenes.get(name);
        if (!nextScene) {
            console.error(`Scene not found: ${name}`);
            return;
        }
        
        this.isTransitioning = true;
        
        // Exit current scene
        if (this.currentScene) {
            await this.currentScene.exit();
        }
        
        // Enter new scene
        this.currentScene = nextScene;
        this.currentSceneName = name;
        
        await this.currentScene.enter(data);
        
        this.isTransitioning = false;
        
        console.log(`🎬 Switched to scene: ${name}`);
    }
    
    /**
     * Get current scene
     */
    get current() {
        return this.currentScene;
    }
    
    /**
     * Fixed update current scene
     */
    fixedUpdate(dt) {
        if (this.currentScene && !this.isTransitioning) {
            this.currentScene.fixedUpdate(dt);
        }
    }
    
    /**
     * Update current scene
     */
    update(dt, alpha) {
        if (this.currentScene && !this.isTransitioning) {
            this.currentScene.update(dt, alpha);
        }
    }
    
    /**
     * Render current scene
     */
    render(ctx) {
        if (this.currentScene) {
            this.currentScene.render(ctx);
        }
    }
}
