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
        
        // Store player spawn position for respawning
        this.playerSpawn = levelData.playerSpawn;
        
        // Initialize parallax background layers
        this.initParallaxLayers();
        
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
        
        // Update enemy behavior BEFORE position updates (so velocityX is set)
        this.enemies.forEach(enemy => {
            enemy.updateWithPlayer(dt, this.player);
        });
        
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
        
        // Enforce world boundaries (prevent falling off edges)
        this.enforceWorldBoundaries();
        
        // Check entity collisions
        this.checkCollisions();
    }
    
    /**
     * Variable update
     */
    update(dt, alpha) {
        if (!this.player) return;
        
        // Update all entities (animations, etc)
        this.entities.forEach(entity => {
            entity.update(dt);
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
        // Player vs Sheep - no physical collision, just interaction
        this.sheep.forEach(sheep => {
            const distance = this.player.distanceTo(sheep);
            
            if (!sheep.isRescued && distance < 60) {
                sheep.showInteractionHint = true;
                this.player.nearbyInteractable = sheep;
                this.player.canInteract = true;
            } else {
                sheep.showInteractionHint = false;
            }
            
            // Prevent rescued sheep from overlapping with player
            if (sheep.isRescued && this.player.collidesWith(sheep)) {
                // Push sheep away from player
                const dx = sheep.centerX - this.player.centerX;
                const pushDir = dx >= 0 ? 1 : -1;
                sheep.x += pushDir * 5; // Gentle push
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
                this.player.takeDamage(1, enemy); // 1 heart damage, pass enemy for knockback
                this.game.audio.playHurt();
                this.game.camera.shake(8, 0.3);
                this.updateHUD();
                
                // Check for death
                if (this.player.health <= 0) {
                    this.gameOver();
                }
            }
        });
        
        // Check water hazards (tile 6 = water)
        this.checkWaterHazard();
    }
    
    /**
     * Enforce world boundaries - prevent entities from going off edges
     */
    enforceWorldBoundaries() {
        const worldWidth = this.tilemap.width * this.tilemap.tileSize;
        const worldHeight = this.tilemap.height * this.tilemap.tileSize;
        const margin = 32; // Keep entities this far from edges
        
        // Player boundaries
        if (this.player) {
            // Left edge
            if (this.player.x < margin) {
                this.player.x = margin;
                this.player.velocityX = 0;
            }
            // Right edge
            if (this.player.x + this.player.width > worldWidth - margin) {
                this.player.x = worldWidth - margin - this.player.width;
                this.player.velocityX = 0;
            }
            // Bottom (death pit)
            if (this.player.y > worldHeight) {
                if (!this.player.isInvulnerable) {
                    this.player.takeDamage(1);
                    // Respawn at last safe position or start
                    this.player.x = this.playerSpawn.x;
                    this.player.y = this.playerSpawn.y;
                    this.player.velocityX = 0;
                    this.player.velocityY = 0;
                    
                    if (this.player.health <= 0) {
                        this.gameOver();
                    }
                }
            }
        }
        
        // Enemies and sheep boundaries
        this.entities.forEach(entity => {
            if (entity.type === 'enemy' || (entity.type === 'sheep' && entity.isRescued)) {
                // Left edge
                if (entity.x < margin) {
                    entity.x = margin;
                    entity.velocityX = 0;
                }
                // Right edge
                if (entity.x + entity.width > worldWidth - margin) {
                    entity.x = worldWidth - margin - entity.width;
                    entity.velocityX = 0;
                }
            }
        });
    }
    
    /**
     * Check if player or sheep fell in water
     */
    checkWaterHazard() {
        const tileSize = this.tilemap.tileSize;
        
        // Check player
        const playerTileX = Math.floor(this.player.centerX / tileSize);
        const playerTileY = Math.floor((this.player.y + this.player.height) / tileSize);
        
        if (playerTileY >= 0 && playerTileY < this.tilemap.height && 
            playerTileX >= 0 && playerTileX < this.tilemap.width) {
            const tileId = this.tilemap.data[playerTileY * this.tilemap.width + playerTileX];
            if (tileId === 6) { // Water tile
                // Player fell in water - take damage and respawn at last safe position
                if (!this.player.isInvulnerable) {
                    this.player.takeDamage(1);
                    this.player.velocityY = -400; // Bounce out
                    this.player.velocityX = this.player.facingRight ? -200 : 200; // Push back
                    this.game.audio.playHurt();
                    this.game.camera.shake(10, 0.3);
                    this.updateHUD();
                    
                    if (this.player.health <= 0) {
                        this.gameOver();
                    }
                }
            }
        }
        
        // Check rescued sheep
        this.sheep.forEach(sheep => {
            if (!sheep.isRescued) return;
            
            const sheepTileX = Math.floor(sheep.centerX / tileSize);
            const sheepTileY = Math.floor((sheep.y + sheep.height) / tileSize);
            
            if (sheepTileY >= 0 && sheepTileY < this.tilemap.height && 
                sheepTileX >= 0 && sheepTileX < this.tilemap.width) {
                const tileId = this.tilemap.data[sheepTileY * this.tilemap.width + sheepTileX];
                if (tileId === 6) { // Water tile
                    // Sheep fell in water - bounce it out
                    sheep.velocityY = -350;
                    sheep.velocityX = sheep.facingRight ? -150 : 150;
                }
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
        
        // Update health hearts
        if (this.player) {
            const heartsEl = document.getElementById('health-hearts');
            const fullHearts = this.player.health;
            const emptyHearts = this.player.maxHealth - this.player.health;
            heartsEl.textContent = '❤️'.repeat(fullHearts) + '🖤'.repeat(emptyHearts);
        }
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
     * Render parallax backgrounds - simple horizontal scrolling layers
     */
    renderBackgrounds(ctx, camX, camY) {
        const width = this.game.width;
        const height = this.game.height;
        
        // Round camera positions to prevent jitter
        const scrollX = Math.round(camX);
        
        // Sky gradient (fixed, doesn't scroll)
        const skyGradient = ctx.createLinearGradient(camX, camY, camX, camY + height);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(0.5, '#B0E0E6');
        skyGradient.addColorStop(1, '#F7DC6F');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(camX, camY, width, height);
        
        // Draw sun (fixed position relative to camera)
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(camX + width - 100, camY + 80, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // Layer 1: Far mountains (slowest - 10% scroll speed)
        ctx.fillStyle = '#8BA58B';
        this.drawParallaxLayer(ctx, camX, camY, width, height, scrollX * 0.1, 0.35, this.farMountains);
        
        // Layer 2: Mid mountains (20% scroll speed)
        ctx.fillStyle = '#6B8E6B';
        this.drawParallaxLayer(ctx, camX, camY, width, height, scrollX * 0.2, 0.45, this.midMountains);
        
        // Layer 3: Near mountains (35% scroll speed)
        ctx.fillStyle = '#4A7A4A';
        this.drawParallaxLayer(ctx, camX, camY, width, height, scrollX * 0.35, 0.55, this.nearMountains);
        
        // Layer 4: Far trees (50% scroll speed)
        ctx.fillStyle = '#3D6B3D';
        this.drawParallaxLayer(ctx, camX, camY, width, height, scrollX * 0.5, 0.65, this.farTrees);
        
        // Layer 5: Near trees (70% scroll speed)
        ctx.fillStyle = '#2D5A2D';
        this.drawParallaxLayer(ctx, camX, camY, width, height, scrollX * 0.7, 0.75, this.nearTrees);
    }
    
    /**
     * Initialize parallax layer data (called once per level)
     */
    initParallaxLayers() {
        // Pre-generate static mountain/tree shapes that tile seamlessly
        const layerWidth = 800; // Width of one repeating segment
        
        // Far mountains - big smooth peaks
        this.farMountains = this.generateMountainLayer(layerWidth, 0.2, [
            { x: 0, h: 0.3 }, { x: 100, h: 0.7 }, { x: 200, h: 0.4 },
            { x: 300, h: 0.9 }, { x: 450, h: 0.5 }, { x: 550, h: 0.75 },
            { x: 650, h: 0.35 }, { x: 750, h: 0.6 }, { x: 800, h: 0.3 }
        ]);
        
        // Mid mountains
        this.midMountains = this.generateMountainLayer(layerWidth, 0.18, [
            { x: 0, h: 0.4 }, { x: 80, h: 0.8 }, { x: 160, h: 0.5 },
            { x: 250, h: 0.95 }, { x: 350, h: 0.6 }, { x: 430, h: 0.85 },
            { x: 530, h: 0.45 }, { x: 620, h: 0.7 }, { x: 720, h: 0.55 },
            { x: 800, h: 0.4 }
        ]);
        
        // Near mountains
        this.nearMountains = this.generateMountainLayer(layerWidth, 0.15, [
            { x: 0, h: 0.5 }, { x: 60, h: 0.85 }, { x: 130, h: 0.6 },
            { x: 200, h: 1.0 }, { x: 280, h: 0.55 }, { x: 360, h: 0.9 },
            { x: 440, h: 0.65 }, { x: 520, h: 0.8 }, { x: 600, h: 0.5 },
            { x: 680, h: 0.75 }, { x: 760, h: 0.6 }, { x: 800, h: 0.5 }
        ]);
        
        // Far trees - triangle shapes
        this.farTrees = this.generateTreeLayer(layerWidth, 0.12, 45);
        
        // Near trees - bigger triangles
        this.nearTrees = this.generateTreeLayer(layerWidth, 0.1, 35);
    }
    
    /**
     * Generate mountain layer data
     */
    generateMountainLayer(layerWidth, heightScale, peaks) {
        return { width: layerWidth, heightScale, peaks };
    }
    
    /**
     * Generate tree layer data
     */
    generateTreeLayer(layerWidth, heightScale, spacing) {
        const trees = [];
        for (let x = 0; x < layerWidth; x += spacing) {
            trees.push({ x: x, h: 0.5 + Math.sin(x * 0.1) * 0.3 });
        }
        return { width: layerWidth, heightScale, trees, spacing };
    }
    
    /**
     * Draw a parallax layer with horizontal tiling
     */
    drawParallaxLayer(ctx, camX, camY, viewWidth, viewHeight, offsetX, yPosition, layerData) {
        if (!layerData) return;
        
        const layerWidth = layerData.width;
        const layerHeight = viewHeight * layerData.heightScale;
        const baseY = camY + viewHeight * yPosition;
        
        // Calculate which tiles are visible
        const startTile = Math.floor(offsetX / layerWidth);
        const endTile = Math.ceil((offsetX + viewWidth) / layerWidth);
        
        ctx.beginPath();
        
        for (let tile = startTile; tile <= endTile; tile++) {
            const tileX = camX + (tile * layerWidth) - offsetX;
            
            if (layerData.peaks) {
                // Draw mountains
                if (tile === startTile) {
                    ctx.moveTo(tileX, baseY + layerHeight);
                }
                
                layerData.peaks.forEach(peak => {
                    ctx.lineTo(tileX + peak.x, baseY + layerHeight - (peak.h * layerHeight));
                });
            } else if (layerData.trees) {
                // Draw trees
                if (tile === startTile) {
                    ctx.moveTo(tileX, baseY + layerHeight);
                }
                
                layerData.trees.forEach(tree => {
                    const treeX = tileX + tree.x;
                    const treeH = tree.h * layerHeight;
                    const treeW = layerData.spacing * 0.4;
                    
                    // Simple triangle tree
                    ctx.lineTo(treeX, baseY + layerHeight);
                    ctx.lineTo(treeX + treeW / 2, baseY + layerHeight - treeH);
                    ctx.lineTo(treeX + treeW, baseY + layerHeight);
                });
            }
        }
        
        // Close the shape
        ctx.lineTo(camX + viewWidth + 10, baseY + layerHeight);
        ctx.lineTo(camX - 10, baseY + layerHeight);
        ctx.closePath();
        ctx.fill();
    }
}
