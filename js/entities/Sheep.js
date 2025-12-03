/**
 * Sheep Entity
 * =============
 * The creatures the player must rescue
 */

import { Entity } from './Entity.js';

export class Sheep extends Entity {
    constructor(x, y) {
        super(x, y, 40, 32);
        
        this.type = 'sheep';
        this.addTag('sheep');
        this.addTag('interactable');
        
        // Hitbox
        this.hitboxOffsetX = 4;
        this.hitboxOffsetY = 4;
        this.hitboxWidth = 32;
        this.hitboxHeight = 28;
        
        // State
        this.isRescued = false;
        this.isFollowing = false;
        this.leader = null; // Player or another sheep to follow
        
        // Movement
        this.followDistance = 50;
        this.moveSpeed = 200;
        this.wanderSpeed = 30;
        
        // Wander behavior (when not rescued)
        this.wanderTimer = 0;
        this.wanderDirection = 0;
        this.wanderPauseTime = 0;
        
        // Animation
        this.bobOffset = Math.random() * Math.PI * 2;
        this.bobSpeed = 3;
        
        // Visual variation
        this.woolColor = this.getRandomWoolColor();
    }
    
    /**
     * Get random wool color variation
     */
    getRandomWoolColor() {
        const colors = ['#FFFEF0', '#F5F5DC', '#FFF8DC', '#FAEBD7'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    /**
     * Rescue the sheep (called by player)
     */
    rescue(player) {
        if (this.isRescued) return;
        
        this.isRescued = true;
        this.isFollowing = true;
        this.leader = player;
        
        // Play rescue effect
        console.log('🐑 Sheep rescued!');
    }
    
    /**
     * Set leader to follow
     */
    setLeader(entity) {
        this.leader = entity;
    }
    
    /**
     * Fixed update
     */
    fixedUpdate(dt) {
        super.fixedUpdate(dt);
        
        if (this.isRescued && this.leader) {
            this.followLeader(dt);
        } else {
            this.wander(dt);
        }
    }
    
    /**
     * Follow the leader (player or another sheep)
     */
    followLeader(dt) {
        const leader = this.leader;
        const dx = leader.centerX - this.centerX;
        const dy = leader.y + leader.height - (this.y + this.height);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Stay behind the leader - minimum safe distance to avoid collision
        const minDistance = 70;  // Don't get closer than this
        const maxDistance = 120; // Start moving if farther than this
        
        if (distance > maxDistance) {
            // Move towards leader (fast)
            const speed = this.moveSpeed;
            const dirX = dx / distance;
            
            this.velocityX = dirX * speed;
            this.facingRight = dx > 0;
            
            // Jump if leader is higher and we're grounded
            if (dy < -40 && this.isGrounded) {
                this.velocityY = -350;
                this.isGrounded = false;
            }
        } else if (distance > minDistance) {
            // Move slowly to maintain formation
            const speed = this.moveSpeed * 0.4;
            const dirX = dx / distance;
            
            this.velocityX = dirX * speed;
            this.facingRight = dx > 0;
        } else if (distance < minDistance - 10) {
            // Too close - back away from leader
            const dirX = dx > 0 ? -1 : 1;
            this.velocityX = dirX * this.moveSpeed * 0.3;
        } else {
            // In the sweet spot - stop
            this.velocityX = 0;
        }
    }
    
    /**
     * Wander around when not rescued
     */
    wander(dt) {
        // Don't wander, just stay still until rescued
        this.velocityX = 0;
        return;
        
        // Original wander code (disabled for now)
        this.wanderTimer += dt;
        
        if (this.wanderPauseTime > 0) {
            this.wanderPauseTime -= dt;
            this.velocityX = 0;
            return;
        }
        
        // Change direction periodically
        if (this.wanderTimer > 2 + Math.random() * 3) {
            this.wanderTimer = 0;
            this.wanderDirection = (Math.random() - 0.5) * 2;
            
            // Sometimes pause
            if (Math.random() < 0.3) {
                this.wanderPauseTime = 1 + Math.random() * 2;
                this.wanderDirection = 0;
            }
        }
        
        this.velocityX = this.wanderDirection * this.wanderSpeed;
        
        if (this.wanderDirection > 0) this.facingRight = true;
        else if (this.wanderDirection < 0) this.facingRight = false;
    }
    
    /**
     * Update animation
     */
    update(dt) {
        super.update(dt);
        
        this.bobOffset += dt * this.bobSpeed;
    }
    
    /**
     * Render sheep
     */
    render(ctx, alpha = 1) {
        if (!this.isVisible) return;
        
        const pos = this.getInterpolatedPosition(alpha);
        // Only bob when rescued and following
        const bob = this.isRescued ? Math.sin(this.bobOffset) * 2 : 0;
        
        ctx.save();
        
        // Apply bob offset
        ctx.translate(0, bob);
        
        // Flip if facing left
        if (!this.facingRight) {
            ctx.translate(pos.x + this.width / 2, 0);
            ctx.scale(-1, 1);
            ctx.translate(-(pos.x + this.width / 2), 0);
        }
        
        this.drawPlaceholder(ctx, pos.x, pos.y);
        
        ctx.restore();
        
        // Draw interaction indicator if not rescued
        if (!this.isRescued && this.showInteractionHint) {
            this.drawInteractionHint(ctx, pos.x + this.width / 2, pos.y - 20);
        }
    }
    
    /**
     * Draw placeholder sheep
     */
    drawPlaceholder(ctx, x, y) {
        // Body (fluffy wool)
        ctx.fillStyle = this.woolColor;
        ctx.beginPath();
        ctx.ellipse(x + 20, y + 20, 18, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Wool puffs
        ctx.beginPath();
        ctx.arc(x + 8, y + 16, 8, 0, Math.PI * 2);
        ctx.arc(x + 32, y + 16, 8, 0, Math.PI * 2);
        ctx.arc(x + 12, y + 24, 7, 0, Math.PI * 2);
        ctx.arc(x + 28, y + 24, 7, 0, Math.PI * 2);
        ctx.fill();
        
        // Head
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.ellipse(x + 36, y + 18, 6, 8, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Ears
        ctx.beginPath();
        ctx.ellipse(x + 38, y + 10, 3, 5, 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + 37, y + 16, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + 38, y + 16, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Legs
        ctx.fillStyle = '#333';
        ctx.fillRect(x + 10, y + 28, 4, 6);
        ctx.fillRect(x + 26, y + 28, 4, 6);
        
        // Rescued indicator (heart)
        if (this.isRescued) {
            ctx.fillStyle = '#ff6b6b';
            ctx.font = '12px Arial';
            ctx.fillText('♥', x + 15, y - 2);
        }
    }
    
    /**
     * Draw interaction hint
     */
    drawInteractionHint(ctx, x, y) {
        ctx.save();
        ctx.fillStyle = 'rgba(74, 124, 89, 0.9)';
        ctx.beginPath();
        ctx.roundRect(x - 20, y - 10, 40, 20, 5);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('E', x, y);
        ctx.restore();
    }
}
