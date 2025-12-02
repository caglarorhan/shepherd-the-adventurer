/**
 * Base Entity Class
 * ==================
 * Parent class for all game entities
 */

export class Entity {
    constructor(x = 0, y = 0, width = 32, height = 32) {
        // Position
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
        
        // Dimensions
        this.width = width;
        this.height = height;
        
        // Hitbox (can be smaller than visual bounds)
        this.hitboxOffsetX = 0;
        this.hitboxOffsetY = 0;
        this.hitboxWidth = width;
        this.hitboxHeight = height;
        
        // Velocity
        this.velocityX = 0;
        this.velocityY = 0;
        
        // State flags
        this.isActive = true;
        this.isVisible = true;
        this.isGrounded = false;
        this.isOnPlatform = false;
        this.facingRight = true;
        
        // Animation
        this.animation = null;
        this.animationFrame = 0;
        this.animationTime = 0;
        
        // Type tag for collision filtering
        this.type = 'entity';
        this.tags = [];
    }
    
    /**
     * Get center position
     */
    get centerX() {
        return this.x + this.width / 2;
    }
    
    get centerY() {
        return this.y + this.height / 2;
    }
    
    /**
     * Get bounds
     */
    get bounds() {
        return {
            x: this.x + this.hitboxOffsetX,
            y: this.y + this.hitboxOffsetY,
            width: this.hitboxWidth,
            height: this.hitboxHeight
        };
    }
    
    /**
     * Store previous position (for interpolation)
     */
    storePreviousPosition() {
        this.prevX = this.x;
        this.prevY = this.y;
    }
    
    /**
     * Get interpolated position
     */
    getInterpolatedPosition(alpha) {
        // Use direct position (rounded to prevent sub-pixel jitter)
        return {
            x: Math.round(this.x),
            y: Math.round(this.y)
        };
    }
    
    /**
     * Fixed update (physics)
     */
    fixedUpdate(dt) {
        this.storePreviousPosition();
    }
    
    /**
     * Variable update (animation, logic)
     */
    update(dt) {
        // Update animation
        if (this.animation) {
            this.animationTime += dt;
            const frameDuration = 1 / this.animation.fps;
            
            if (this.animationTime >= frameDuration) {
                this.animationTime -= frameDuration;
                this.animationFrame++;
                
                if (this.animationFrame >= this.animation.frames) {
                    if (this.animation.loop) {
                        this.animationFrame = 0;
                    } else {
                        this.animationFrame = this.animation.frames - 1;
                    }
                }
            }
        }
    }
    
    /**
     * Render entity
     */
    render(ctx, alpha = 1) {
        if (!this.isVisible) return;
        
        const pos = this.getInterpolatedPosition(alpha);
        
        // Default placeholder rendering
        ctx.fillStyle = '#888';
        ctx.fillRect(pos.x, pos.y, this.width, this.height);
    }
    
    /**
     * Render debug info
     */
    renderDebug(ctx) {
        // Draw hitbox
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            this.x + this.hitboxOffsetX,
            this.y + this.hitboxOffsetY,
            this.hitboxWidth,
            this.hitboxHeight
        );
        
        // Draw velocity vector
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.beginPath();
        ctx.moveTo(this.centerX, this.centerY);
        ctx.lineTo(
            this.centerX + this.velocityX * 0.1,
            this.centerY + this.velocityY * 0.1
        );
        ctx.stroke();
    }
    
    /**
     * Check if entity has a tag
     */
    hasTag(tag) {
        return this.tags.includes(tag);
    }
    
    /**
     * Add a tag
     */
    addTag(tag) {
        if (!this.tags.includes(tag)) {
            this.tags.push(tag);
        }
    }
    
    /**
     * Remove a tag
     */
    removeTag(tag) {
        const index = this.tags.indexOf(tag);
        if (index !== -1) {
            this.tags.splice(index, 1);
        }
    }
    
    /**
     * Distance to another entity
     */
    distanceTo(other) {
        const dx = other.centerX - this.centerX;
        const dy = other.centerY - this.centerY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Check collision with another entity
     */
    collidesWith(other) {
        const a = this.bounds;
        const b = other.bounds;
        
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }
    
    /**
     * Called when entity is destroyed
     */
    destroy() {
        this.isActive = false;
        this.isVisible = false;
    }
}
