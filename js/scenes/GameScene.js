/**
 * Game Scene
 * ===========
 * Main gameplay scene
 */

import { Player } from '../entities/Player.js';
import { Sheep } from '../entities/Sheep.js';
import { Collectible } from '../entities/Collectible.js';
import { Wolf, Boar } from '../entities/Enemy.js';
import { LevelLoader } from '../levels/LevelLoader.js';

export class GameScene {
    constructor(game) {
        this.game = game;
        this.name = 'game';
        
        // Entities
        this.player = null;
        this.entities = [];
        this.sheep = [];
        this.enemies = [];
        this.collectibles = [];
        
        // Level
        this.levelLoader = new LevelLoader();
        this.currentLevel = null;
        this.tilemap = null;
        
        // Parallax backgrounds
        this.backgrounds = [];
        
        // Game state
        this.sheepRescued = 0;
        this.totalSheep = 0;
        this.collectiblesGathered = 0;
        this.goldenWoolFound = 0;
        
        // Solid tile IDs
        this.solidTiles = [1, 2, 3, 4, 5, 7]; // Added 7 for rock barriers
    }
    
    /**
     * Enter scene
     */
    async enter(data = {}) {
        const levelNum = data.level || 1;
        console.log(`🎮 Entering level ${levelNum}`);
        
        // Load level
        await this.loadLevel(levelNum);
        
        // Setup camera
        this.game.camera.setWorldBounds(
            this.tilemap.width * this.tilemap.tileSize,
            this.tilemap.height * this.tilemap.tileSize
        );
        this.game.camera.follow(this.player);
        
        // Update HUD
        this.updateHUD();
    }
    
    /**
     * Exit scene
     */
    async exit() {
        // Clean up
        this.entities = [];
        this.sheep = [];
        this.enemies = [];
        this.collectibles = [];
        this.player = null;
    }
    
    /**
     * Load a level
     */
    async loadLevel(levelNum) {
        this.currentLevel = levelNum;
        const levelData = this.levelLoader.getLevel(levelNum);
        
        // Create tilemap
        this.tilemap = levelData.tilemap;
        
        // Setup backgrounds
        this.setupBackgrounds(levelData.background);
        
        // Spawn player
        this.player = new Player(levelData.playerSpawn.x, levelData.playerSpawn.y);
        this.entities.push(this.player);
        
        // Spawn sheep
        this.sheep = [];
        this.totalSheep = levelData.sheep.length;
        levelData.sheep.forEach(pos => {
            const sheep = new Sheep(pos.x, pos.y);
            this.sheep.push(sheep);
            this.entities.push(sheep);
        });
        
        // Spawn enemies
        this.enemies = [];
        if (levelData.enemies) {
            levelData.enemies.forEach(enemy => {
                let e;
                switch (enemy.type) {
                    case 'wolf':
                        e = new Wolf(enemy.x, enemy.y);
                        break;
                    case 'boar':
                        e = new Boar(enemy.x, enemy.y);
                        break;
                }
                if (e) {
                    if (enemy.patrolRange) e.patrolRange = enemy.patrolRange;
                    this.enemies.push(e);
                    this.entities.push(e);
                }
            });
        }
        
        // Spawn collectibles
        this.collectibles = [];
        if (levelData.collectibles) {
            levelData.collectibles.forEach(c => {
                const collectible = new Collectible(c.x, c.y, c.type);
                this.collectibles.push(collectible);
                this.entities.push(collectible);
            });
        }
        
        // Reset stats
        this.sheepRescued = 0;
        this.collectiblesGathered = 0;
        this.goldenWoolFound = 0;
    }
    
    /**
     * Setup parallax backgrounds
     */
    setupBackgrounds(bgData) {
        this.backgrounds = [
            { color: '#87CEEB', speedX: 0, speedY: 0 }, // Sky
            { color: '#6B8E6B', speedX: 0.1, speedY: 0, y: 200 }, // Far mountains
            { color: '#4A7A4A', speedX: 0.3, speedY: 0, y: 300 }, // Near mountains
            { color: '#3D6B3D', speedX: 0.5, speedY: 0, y: 400 }, // Far trees
        ];
    }
    
    /**
     * Fixed update (physics)
     */
    fixedUpdate(dt) {
        if (!this.player) return;
        
        // Handle player input
        this.player.handleInput(this.game.input, dt);
        
        // Apply gravity to all entities (except non-rescued sheep)
        this.entities.forEach(entity => {
            if (entity.type !== 'collectible') {
                // Don't apply gravity to sheep that haven't been rescued yet
                if (entity.type === 'sheep' && !entity.isRescued) {
                    return;
                }
                this.game.physics.applyGravity(entity, dt);
            }
            entity.fixedUpdate(dt);
        });
        
        // Update positions
        this.entities.forEach(entity => {
            // Don't move sheep that haven't been rescued
            if (entity.type === 'sheep' && !entity.isRescued) {
                return;
            }
            this.game.physics.updatePosition(entity, dt);
        });
        
        // Resolve tilemap collisions
        this.entities.forEach(entity => {
            if (entity.type === 'player' || entity.type === 'enemy') {
                this.game.physics.resolveTilemapCollision(entity, this.tilemap, this.solidTiles);
            }
            // Only resolve collisions for rescued sheep
            if (entity.type === 'sheep' && entity.isRescued) {
                this.game.physics.resolveTilemapCollision(entity, this.tilemap, this.solidTiles);
            }
        });
        
        // Check entity collisions
        this.checkCollisions();
    }
    
    /**
     * Variable update
     */
    update(dt, alpha) {
        if (!this.player) return;
        
        // Update all entities
        this.entities.forEach(entity => {
            entity.update(dt);
        });
        
        // Update enemies with player reference
        this.enemies.forEach(enemy => {
            enemy.updateWithPlayer(dt, this.player);
        });
        
        // Check for nearby interactables
        this.checkInteractables();
        
        // Handle pause
        if (this.game.input.isPressed('pause')) {
            this.game.pause();
            document.getElementById('pause-menu').classList.add('active');
        }
        
        // Debug toggle
        if (this.game.input.isPressed('debug')) {
            this.game.toggleDebug();
        }
        
        // Check win/lose conditions
        this.checkGameState();
    }
    
    /**
     * Check collisions between entities
     */
    checkCollisions() {
        // Player vs Sheep
        this.sheep.forEach(sheep => {
            if (!sheep.isRescued && this.player.collidesWith(sheep)) {
                sheep.showInteractionHint = true;
                this.player.nearbyInteractable = sheep;
                this.player.canInteract = true;
            } else {
                sheep.showInteractionHint = false;
            }
        });
        
        // Player vs Collectibles
        this.collectibles.forEach(collectible => {
            if (!collectible.isCollected && this.player.collidesWith(collectible)) {
                collectible.collect(this.player);
                this.collectiblesGathered++;
                if (collectible.collectibleType === 'golden-wool') {
                    this.goldenWoolFound++;
                }
                this.game.audio.playCollect();
                this.updateHUD();
            }
        });
        
        // Player vs Enemies
        this.enemies.forEach(enemy => {
            if (this.player.collidesWith(enemy) && !this.player.isInvulnerable) {
                this.player.takeDamage(enemy.damage);
                this.game.audio.playHurt();
                this.game.camera.shake(8, 0.3);
            }
        });
    }
    
    /**
     * Check for nearby interactables
     */
    checkInteractables() {
        let foundInteractable = false;
        
        this.sheep.forEach(sheep => {
            if (!sheep.isRescued && this.player.distanceTo(sheep) < 60) {
                sheep.showInteractionHint = true;
                this.player.nearbyInteractable = sheep;
                foundInteractable = true;
            } else {
                sheep.showInteractionHint = false;
            }
        });
        
        if (!foundInteractable) {
            this.player.nearbyInteractable = null;
        }
        
        // Check if player rescued a sheep
        const newRescued = this.sheep.filter(s => s.isRescued).length;
        if (newRescued > this.sheepRescued) {
            this.sheepRescued = newRescued;
            this.game.audio.playRescue();
            this.updateHUD();
            this.showSheepPopup();
        }
    }
    
    /**
     * Check game state (win/lose)
     */
    checkGameState() {
        // Check death
        if (!this.player.isActive) {
            this.gameOver();
            return;
        }
        
        // Check fall death
        if (this.player.y > this.tilemap.height * this.tilemap.tileSize + 200) {
            this.player.die();
            this.gameOver();
            return;
        }
        
        // Check level complete
        if (this.sheepRescued >= this.totalSheep) {
            this.levelComplete();
        }
    }
    
    /**
     * Show sheep rescued popup
     */
    showSheepPopup() {
        const popup = document.createElement('div');
        popup.className = 'sheep-popup';
        popup.innerHTML = `
            <span class="icon">🐑</span>
            <span class="message">Sheep Rescued!</span>
        `;
        document.getElementById('game-screen').appendChild(popup);
        
        setTimeout(() => popup.remove(), 2000);
    }
    
    /**
     * Update HUD
     */
    updateHUD() {
        document.getElementById('sheep-count').textContent = `${this.sheepRescued}/${this.totalSheep}`;
        document.getElementById('collectible-count').textContent = this.collectiblesGathered;
        document.getElementById('level-name').textContent = `Level ${this.currentLevel}: ${this.getLevelName()}`;
    }
    
    /**
     * Get level name
     */
    getLevelName() {
        const names = {
            1: 'Forest Entrance',
            2: 'River Crossing',
            3: 'Hazard Path',
            4: 'Deep Woods',
            5: 'Mountain Clearing'
        };
        return names[this.currentLevel] || 'Unknown';
    }
    
    /**
     * Level complete
     */
    levelComplete() {
        this.game.pause();
        
        // Save progress
        this.game.state.completeLevel(
            this.currentLevel,
            this.sheepRescued,
            this.collectiblesGathered,
            this.goldenWoolFound
        );
        
        // Show complete screen
        document.getElementById('stat-sheep').textContent = `${this.sheepRescued}/${this.totalSheep}`;
        document.getElementById('stat-collectibles').textContent = this.collectiblesGathered;
        document.getElementById('stat-golden').textContent = '⭐'.repeat(this.goldenWoolFound);
        document.getElementById('level-complete').classList.add('active');
    }
    
    /**
     * Game over
     */
    gameOver() {
        this.game.pause();
        const gameOverOverlay = document.getElementById('game-over');
        gameOverOverlay.classList.add('active');
        
        // Auto-focus the retry button after overlay is fully visible
        setTimeout(() => {
            const retryBtn = document.getElementById('btn-retry');
            if (retryBtn) {
                retryBtn.focus();
            }
        }, 200);
    }
    
    /**
     * Render scene
     */
    render(ctx, camera) {
        // Get camera position for parallax
        const camX = camera.getX();
        const camY = camera.getY();
        
        // Render backgrounds
        this.renderBackgrounds(ctx, camX, camY);
        
        // Render tilemap
        if (this.tilemap) {
            this.game.renderer.renderTilemap(ctx, this.tilemap, null, camera);
        }
        
        // Render entities (sorted by Y for depth)
        const sortedEntities = [...this.entities].sort((a, b) => a.y - b.y);
        sortedEntities.forEach(entity => {
            if (entity.isActive && camera.isVisible(entity.x, entity.y, entity.width, entity.height)) {
                entity.render(ctx, 1);
                
                if (this.game.debug) {
                    entity.renderDebug(ctx);
                }
            }
        });
    }
    
    /**
     * Render parallax backgrounds
     */
    renderBackgrounds(ctx, camX, camY) {
        const width = this.game.width;
        const height = this.game.height;
        
        // Round camera positions to prevent jitter
        camX = Math.round(camX);
        camY = Math.round(camY);
        
        // Sky gradient (fixed, doesn't scroll)
        const skyGradient = ctx.createLinearGradient(camX, camY, camX, camY + height);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(0.5, '#98D8C8');
        skyGradient.addColorStop(1, '#F7DC6F');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(camX, camY, width, height);
        
        // Draw sun (fixed position)
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(camX + width - 100, camY + 80, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // Far mountains (use rounded parallax to prevent jitter)
        ctx.fillStyle = '#6B8E6B';
        this.drawMountains(ctx, Math.round(camX * 0.1), camY + height * 0.4, width, height * 0.3);
        
        // Near mountains
        ctx.fillStyle = '#4A7A4A';
        this.drawMountains(ctx, Math.round(camX * 0.3), camY + height * 0.5, width, height * 0.3);
        
        // Far trees
        ctx.fillStyle = '#3D6B3D';
        this.drawTreeLine(ctx, Math.round(camX * 0.5), camY + height * 0.6, width, height * 0.2);
    }
    
    /**
     * Draw mountain silhouette (deterministic - no random)
     */
    drawMountains(ctx, offsetX, y, width, height) {
        ctx.beginPath();
        ctx.moveTo(offsetX, y + height);
        
        let x = offsetX;
        let seed = 0;
        while (x < offsetX + width + 200) {
            // Use deterministic pseudo-random based on position
            seed = (seed + 1) * 17 % 100;
            const peakHeight = height * (0.5 + Math.sin(x * 0.01) * 0.5);
            ctx.lineTo(x, y + height - peakHeight);
            x += 80 + (seed % 40);
        }
        
        ctx.lineTo(x, y + height);
        ctx.closePath();
        ctx.fill();
    }
    
    /**
     * Draw tree line silhouette (deterministic - no random)
     */
    drawTreeLine(ctx, offsetX, y, width, height) {
        ctx.beginPath();
        ctx.moveTo(offsetX, y + height);
        
        let x = offsetX;
        let seed = 0;
        while (x < offsetX + width + 100) {
            const treeHeight = height * (0.6 + Math.sin(x * 0.05) * 0.4);
            
            // Tree shape
            ctx.lineTo(x, y + height - treeHeight);
            ctx.lineTo(x + 15, y + height - treeHeight * 0.7);
            ctx.lineTo(x + 10, y + height - treeHeight * 0.7);
            ctx.lineTo(x + 25, y + height - treeHeight * 0.4);
            ctx.lineTo(x + 20, y + height - treeHeight * 0.4);
            ctx.lineTo(x + 30, y + height);
            
            // Use deterministic spacing
            seed = (seed + 1) * 13 % 100;
            x += 40 + (seed % 20);
        }
        
        ctx.lineTo(x, y + height);
        ctx.closePath();
        ctx.fill();
    }
}
