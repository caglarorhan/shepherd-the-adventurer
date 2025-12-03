/**
 * Physics System
 * ===============
 * Handles collision detection and physics calculations
 */

export class Physics {
    constructor() {
        this.gravity = 900; // pixels per second squared (reduced for floatier jumps)
        this.maxFallSpeed = 450;
        this.fallGravityMultiplier = 1.3; // Fall faster than rise for better game feel
    }
    
    /**
     * Apply gravity to an entity with smooth falling
     */
    applyGravity(entity, dt) {
        if (!entity.isGrounded && !entity.isOnPlatform) {
            // Apply stronger gravity when falling for snappier feel
            const gravityMultiplier = entity.velocityY > 0 ? this.fallGravityMultiplier : 1.0;
            entity.velocityY += this.gravity * gravityMultiplier * dt;
            entity.velocityY = Math.min(entity.velocityY, this.maxFallSpeed);
        }
    }
    
    /**
     * Update entity position based on velocity
     */
    updatePosition(entity, dt) {
        entity.x += entity.velocityX * dt;
        entity.y += entity.velocityY * dt;
    }
    
    /**
     * Check AABB collision between two rectangles
     */
    checkAABB(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }
    
    /**
     * Get collision bounds for an entity
     */
    getBounds(entity) {
        return {
            x: entity.x + (entity.hitboxOffsetX || 0),
            y: entity.y + (entity.hitboxOffsetY || 0),
            width: entity.hitboxWidth || entity.width,
            height: entity.hitboxHeight || entity.height
        };
    }
    
    /**
     * Check collision with tilemap
     */
    checkTilemapCollision(entity, tilemap, solidTiles = [1, 2, 3, 4, 5]) {
        const bounds = this.getBounds(entity);
        const tileSize = tilemap.tileSize;
        
        // Get tile range to check
        const left = Math.floor(bounds.x / tileSize);
        const right = Math.floor((bounds.x + bounds.width - 1) / tileSize);
        const top = Math.floor(bounds.y / tileSize);
        const bottom = Math.floor((bounds.y + bounds.height - 1) / tileSize);
        
        const collisions = [];
        
        for (let row = top; row <= bottom; row++) {
            for (let col = left; col <= right; col++) {
                if (row < 0 || row >= tilemap.height || col < 0 || col >= tilemap.width) {
                    continue;
                }
                
                const tileId = tilemap.data[row * tilemap.width + col];
                
                if (solidTiles.includes(tileId)) {
                    collisions.push({
                        x: col * tileSize,
                        y: row * tileSize,
                        width: tileSize,
                        height: tileSize,
                        tileId: tileId,
                        row: row,
                        col: col
                    });
                }
            }
        }
        
        return collisions;
    }
    
    /**
     * Resolve collision between entity and tilemap
     */
    resolveTilemapCollision(entity, tilemap, solidTiles) {
        const tileSize = tilemap.tileSize;
        
        // Store previous ground state for stability
        const wasGrounded = entity.isGrounded;
        
        // Reset ground state
        entity.isGrounded = false;
        entity.isOnPlatform = false;
        
        // Resolve horizontal collision first (walls)
        this.resolveHorizontalCollision(entity, tilemap, solidTiles, tileSize);
        
        // Then resolve vertical collision (landing/ceiling)
        this.resolveVerticalCollision(entity, tilemap, solidTiles, tileSize, wasGrounded);
    }
    
    /**
     * Resolve horizontal collision (walls only)
     */
    resolveHorizontalCollision(entity, tilemap, solidTiles, tileSize) {
        const bounds = this.getBounds(entity);
        
        const left = Math.floor(bounds.x / tileSize);
        const right = Math.floor((bounds.x + bounds.width - 1) / tileSize);
        // Check full height except very bottom (to not detect floor as wall)
        const top = Math.floor((bounds.y + 2) / tileSize);
        const bottom = Math.floor((bounds.y + bounds.height - 4) / tileSize);
        
        for (let row = top; row <= bottom; row++) {
            for (let col = left; col <= right; col++) {
                if (row < 0 || row >= tilemap.height || col < 0 || col >= tilemap.width) {
                    continue;
                }
                
                const tileId = tilemap.data[row * tilemap.width + col];
                
                if (solidTiles.includes(tileId)) {
                    const tileX = col * tileSize;
                    const tileY = row * tileSize;
                    
                    if (this.checkAABB(bounds, { x: tileX, y: tileY, width: tileSize, height: tileSize })) {
                        // Resolve based on which side we're hitting
                        const entityCenterX = bounds.x + bounds.width / 2;
                        const tileCenterX = tileX + tileSize / 2;
                        
                        if (entityCenterX < tileCenterX) {
                            // Entity is to the left of tile, push left
                            entity.x = tileX - (entity.hitboxWidth || entity.width) - (entity.hitboxOffsetX || 0);
                        } else {
                            // Entity is to the right of tile, push right
                            entity.x = tileX + tileSize - (entity.hitboxOffsetX || 0);
                        }
                        entity.velocityX = 0;
                    }
                }
            }
        }
    }
    
    /**
     * Resolve vertical collision (ground/ceiling)
     */
    resolveVerticalCollision(entity, tilemap, solidTiles, tileSize, wasGrounded) {
        const bounds = this.getBounds(entity);
        
        // Shrink horizontal check slightly to avoid corner catching
        const left = Math.floor((bounds.x + 2) / tileSize);
        const right = Math.floor((bounds.x + bounds.width - 3) / tileSize);
        const top = Math.floor(bounds.y / tileSize);
        const bottom = Math.floor((bounds.y + bounds.height - 1) / tileSize);
        
        // Check ground below first if we were grounded or falling
        if (wasGrounded || entity.velocityY >= 0) {
            const groundRow = Math.floor((bounds.y + bounds.height) / tileSize);
            for (let col = left; col <= right; col++) {
                if (groundRow < 0 || groundRow >= tilemap.height || col < 0 || col >= tilemap.width) {
                    continue;
                }
                
                const tileId = tilemap.data[groundRow * tilemap.width + col];
                if (solidTiles.includes(tileId)) {
                    const tileY = groundRow * tileSize;
                    const feetY = bounds.y + bounds.height;
                    
                    // If feet are at or below tile top, snap to ground
                    if (feetY >= tileY && feetY < tileY + 8) {
                        entity.y = tileY - (entity.hitboxHeight || entity.height) - (entity.hitboxOffsetY || 0);
                        entity.velocityY = 0;
                        entity.isGrounded = true;
                        return; // Done with vertical collision
                    }
                }
            }
        }
        
        // Standard collision check for overlapping tiles
        for (let row = top; row <= bottom; row++) {
            for (let col = left; col <= right; col++) {
                if (row < 0 || row >= tilemap.height || col < 0 || col >= tilemap.width) {
                    continue;
                }
                
                const tileId = tilemap.data[row * tilemap.width + col];
                
                if (solidTiles.includes(tileId)) {
                    const tileX = col * tileSize;
                    const tileY = row * tileSize;
                    
                    // Recalculate bounds
                    const newBounds = this.getBounds(entity);
                    
                    if (this.checkAABB(newBounds, { x: tileX, y: tileY, width: tileSize, height: tileSize })) {
                        if (entity.velocityY > 0) {
                            // Falling and hit ground
                            entity.y = tileY - (entity.hitboxHeight || entity.height) - (entity.hitboxOffsetY || 0);
                            entity.velocityY = 0;
                            entity.isGrounded = true;
                        } else if (entity.velocityY < 0) {
                            // Jumping and hit ceiling
                            entity.y = tileY + tileSize - (entity.hitboxOffsetY || 0);
                            entity.velocityY = 0;
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Check if point is inside rectangle
     */
    pointInRect(px, py, rect) {
        return (
            px >= rect.x &&
            px <= rect.x + rect.width &&
            py >= rect.y &&
            py <= rect.y + rect.height
        );
    }
    
    /**
     * Get distance between two points
     */
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Check circle collision
     */
    checkCircleCollision(a, b) {
        const dx = (a.x + a.radius) - (b.x + b.radius);
        const dy = (a.y + a.radius) - (b.y + b.radius);
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < a.radius + b.radius;
    }
    
    /**
     * Linear interpolation
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    /**
     * Clamp value between min and max
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
}
