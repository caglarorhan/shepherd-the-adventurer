/**
 * Camera System
 * ==============
 * Follows the player and handles viewport calculations
 */

export class Camera {
    constructor(game) {
        this.game = game;
        
        // Position
        this.x = 0;
        this.y = 0;
        
        // Target to follow
        this.target = null;
        
        // Viewport dimensions
        this.width = 0;
        this.height = 0;
        
        // World bounds
        this.worldWidth = 0;
        this.worldHeight = 0;
        
        // Follow settings
        this.followOffsetX = 0;
        this.followOffsetY = -50;
        this.smoothing = 0.08;
        
        // Dead zone (area where target can move without camera moving)
        this.deadZoneX = 150;
        this.deadZoneY = 80;
        
        // Shake effect
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
    }
    
    /**
     * Resize camera viewport
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
    
    /**
     * Set world bounds
     */
    setWorldBounds(width, height) {
        this.worldWidth = width;
        this.worldHeight = height;
    }
    
    /**
     * Set target to follow
     */
    follow(target) {
        this.target = target;
        
        // Immediately center on target
        if (target) {
            this.x = target.x + target.width / 2 - this.width / 2 + this.followOffsetX;
            this.y = target.y + target.height / 2 - this.height / 2 + this.followOffsetY;
            this.clampToBounds();
        }
    }
    
    /**
     * Update camera position
     */
    update(dt) {
        // Update shake
        if (this.shakeDuration > 0) {
            this.shakeDuration -= dt;
            this.shakeOffsetX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
            this.shakeOffsetY = (Math.random() - 0.5) * 2 * this.shakeIntensity;
            
            if (this.shakeDuration <= 0) {
                this.shakeOffsetX = 0;
                this.shakeOffsetY = 0;
            }
        }
        
        // Follow target
        if (this.target) {
            const targetCenterX = this.target.x + this.target.width / 2;
            const targetCenterY = this.target.y + this.target.height / 2;
            
            const cameraCenterX = this.x + this.width / 2;
            const cameraCenterY = this.y + this.height / 2;
            
            // Calculate desired position
            let desiredX = this.x;
            let desiredY = this.y;
            
            // Horizontal follow with dead zone
            const diffX = targetCenterX - cameraCenterX + this.followOffsetX;
            if (Math.abs(diffX) > this.deadZoneX) {
                const pushX = diffX > 0 ? diffX - this.deadZoneX : diffX + this.deadZoneX;
                desiredX = this.x + pushX;
            }
            
            // Vertical follow with dead zone
            const diffY = targetCenterY - cameraCenterY + this.followOffsetY;
            if (Math.abs(diffY) > this.deadZoneY) {
                const pushY = diffY > 0 ? diffY - this.deadZoneY : diffY + this.deadZoneY;
                desiredY = this.y + pushY;
            }
            
            // Smooth interpolation
            const dx = (desiredX - this.x) * this.smoothing;
            const dy = (desiredY - this.y) * this.smoothing;
            
            // Only move if difference is significant (prevents micro-jitter)
            if (Math.abs(dx) > 0.5) {
                this.x += dx;
            }
            if (Math.abs(dy) > 0.5) {
                this.y += dy;
            }
            
            // Round to prevent sub-pixel rendering issues
            this.x = Math.round(this.x);
            this.y = Math.round(this.y);
            
            // Clamp to world bounds
            this.clampToBounds();
        }
    }
    
    /**
     * Clamp camera to world bounds
     */
    clampToBounds() {
        if (this.worldWidth > 0) {
            this.x = Math.max(0, Math.min(this.worldWidth - this.width, this.x));
        }
        if (this.worldHeight > 0) {
            this.y = Math.max(0, Math.min(this.worldHeight - this.height, this.y));
        }
    }
    
    /**
     * Get camera position with shake applied
     */
    getX() {
        return Math.round(this.x + this.shakeOffsetX);
    }
    
    getY() {
        return Math.round(this.y + this.shakeOffsetY);
    }
    
    /**
     * Trigger camera shake
     */
    shake(intensity = 5, duration = 0.3) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
    }
    
    /**
     * Check if a point is visible
     */
    isVisible(x, y, width = 0, height = 0) {
        return (
            x + width > this.x &&
            x < this.x + this.width &&
            y + height > this.y &&
            y < this.y + this.height
        );
    }
    
    /**
     * Convert world position to screen position
     */
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.getX(),
            y: worldY - this.getY()
        };
    }
    
    /**
     * Convert screen position to world position
     */
    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.getX(),
            y: screenY + this.getY()
        };
    }
    
    /**
     * Get visible area
     */
    getVisibleArea() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }
}
