/**
 * Game Engine - Main Game Class
 * ==============================
 * Manages the game loop, scenes, and overall game state
 */

import { AssetLoader } from './AssetLoader.js';
import { InputManager } from './InputManager.js';
import { AudioManager } from './AudioManager.js';
import { SceneManager } from './SceneManager.js';
import { Renderer } from './Renderer.js';
import { Physics } from './Physics.js';
import { Camera } from './Camera.js';
import { GameState } from './GameState.js';

export class Game {
    constructor() {
        // Core systems
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Engine components
        this.assets = new AssetLoader();
        this.input = new InputManager();
        this.audio = new AudioManager();
        this.scenes = new SceneManager(this);
        this.renderer = new Renderer(this);
        this.physics = new Physics();
        this.camera = new Camera(this);
        this.state = new GameState();
        
        // Game loop variables
        this.lastTime = 0;
        this.deltaTime = 0;
        this.accumulator = 0;
        this.fixedTimeStep = 1000 / 60; // 60 FPS physics
        this.maxDeltaTime = 100; // Cap delta to prevent spiral of death
        
        // State flags
        this.isRunning = false;
        this.isPaused = false;
        this.isInitialized = false;
        
        // Debug mode
        this.debug = false;
    }
    
    /**
     * Initialize the game engine
     */
    async init() {
        console.log('🎮 Initializing game engine...');
        
        // Setup canvas
        this.setupCanvas();
        
        // Handle window resize
        window.addEventListener('resize', () => this.setupCanvas());
        
        // Initialize input
        this.input.init();
        
        // Initialize audio
        this.audio.init();
        
        // Load core assets
        await this.loadAssets();
        
        // Initialize scenes
        this.scenes.init();
        
        this.isInitialized = true;
        console.log('✅ Game engine initialized');
    }
    
    /**
     * Setup canvas dimensions
     */
    setupCanvas() {
        const container = document.getElementById('game-container');
        const rect = container.getBoundingClientRect();
        
        // Set display size
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // Set actual size (with device pixel ratio for sharpness)
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        // Scale context
        this.ctx.scale(dpr, dpr);
        
        // Store logical dimensions
        this.width = rect.width;
        this.height = rect.height;
        
        // Update camera
        if (this.camera) {
            this.camera.resize(this.width, this.height);
        }
        
        console.log(`📐 Canvas resized: ${this.width}x${this.height}`);
    }
    
    /**
     * Load game assets
     */
    async loadAssets() {
        console.log('📦 Loading assets...');
        
        // Define assets to load
        const imagesToLoad = {
            // Player sprites
            'shepherd-idle': 'assets/sprites/shepherd/idle.gif',
            'shepherd-run': 'assets/sprites/shepherd/run.gif',
            'shepherd-jump': 'assets/sprites/shepherd/jump.png',
            'shepherd-landing': 'assets/sprites/shepherd/landing.png',
            'shepherd-midair': 'assets/sprites/shepherd/mid air.gif',
            'shepherd-ledge': 'assets/sprites/shepherd/ledge grab.gif',
            
            // Sheep sprites
            'sheep-idle': 'assets/sprites/sheep/idle.png',
            'sheep-follow': 'assets/sprites/sheep/follow.png',
            
            // Environment
            'tileset-forest': 'assets/tilesets/forest.png',
            'bg-sky': 'assets/backgrounds/sky.png',
            'bg-mountains': 'assets/backgrounds/mountains.png',
            'bg-trees-far': 'assets/backgrounds/trees-far.png',
            'bg-trees-near': 'assets/backgrounds/trees-near.png',
            
            // Collectibles
            'berry': 'assets/sprites/collectibles/berry.png',
            'golden-wool': 'assets/sprites/collectibles/golden-wool.png',
            
            // Enemies
            'wolf': 'assets/sprites/enemies/wolf.png',
            'boar': 'assets/sprites/enemies/boar.png',
        };
        
        const audioToLoad = {
            // Music
            'music-menu': 'assets/audio/music/menu.mp3',
            'music-forest': 'assets/audio/music/forest.mp3',
            
            // SFX
            'sfx-jump': 'assets/audio/sfx/jump.wav',
            'sfx-land': 'assets/audio/sfx/land.wav',
            'sfx-collect': 'assets/audio/sfx/collect.wav',
            'sfx-rescue': 'assets/audio/sfx/rescue.wav',
            'sfx-hurt': 'assets/audio/sfx/hurt.wav',
        };
        
        // Load the actual assets
        await this.assets.loadImages(imagesToLoad);
        // await this.assets.loadAudio(audioToLoad);
        
        console.log('✅ Assets loaded');
    }
    
    /**
     * Start the game loop
     */
    start() {
        // If already running, just unpause
        if (this.isRunning) {
            this.isPaused = false;
            return;
        }
        
        console.log('▶️ Starting game loop');
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    /**
     * Stop the game loop
     */
    stop() {
        console.log('⏹️ Stopping game loop');
        this.isRunning = false;
    }
    
    /**
     * Pause the game
     */
    pause() {
        console.log('⏸️ Game paused');
        this.isPaused = true;
    }
    
    /**
     * Resume the game
     */
    resume() {
        console.log('▶️ Game resumed');
        this.isPaused = false;
        this.lastTime = performance.now();
    }
    
    /**
     * Main game loop
     */
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // Calculate delta time
        this.deltaTime = Math.min(currentTime - this.lastTime, this.maxDeltaTime);
        this.lastTime = currentTime;
        
        if (!this.isPaused) {
            // Accumulate time for fixed timestep physics
            this.accumulator += this.deltaTime;
            
            // Fixed timestep updates (physics)
            while (this.accumulator >= this.fixedTimeStep) {
                this.fixedUpdate(this.fixedTimeStep / 1000);
                this.accumulator -= this.fixedTimeStep;
            }
            
            // Variable timestep update (rendering interpolation)
            const alpha = this.accumulator / this.fixedTimeStep;
            this.update(this.deltaTime / 1000, alpha);
        }
        
        // Always render
        this.render();
        
        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    /**
     * Fixed timestep update (physics, collision)
     */
    fixedUpdate(dt) {
        this.scenes.fixedUpdate(dt);
    }
    
    /**
     * Variable timestep update (animation, input)
     */
    update(dt, alpha) {
        this.input.update();
        this.scenes.update(dt, alpha);
        this.camera.update(dt);
    }
    
    /**
     * Render the game
     */
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Render current scene
        this.renderer.render(this.scenes.currentScene);
        
        // Debug overlay
        if (this.debug) {
            this.renderDebug();
        }
    }
    
    /**
     * Render debug information
     */
    renderDebug() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 100);
        
        this.ctx.fillStyle = '#0f0';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`FPS: ${Math.round(1000 / this.deltaTime)}`, 20, 30);
        this.ctx.fillText(`Delta: ${this.deltaTime.toFixed(2)}ms`, 20, 45);
        this.ctx.fillText(`Scene: ${this.scenes.currentSceneName}`, 20, 60);
        this.ctx.fillText(`Entities: ${this.scenes.currentScene?.entities?.length || 0}`, 20, 75);
        this.ctx.fillText(`Camera: ${Math.round(this.camera.x)}, ${Math.round(this.camera.y)}`, 20, 90);
        
        this.ctx.restore();
    }
    
    /**
     * Toggle debug mode
     */
    toggleDebug() {
        this.debug = !this.debug;
        console.log(`🐛 Debug mode: ${this.debug ? 'ON' : 'OFF'}`);
    }
}
