/**
 * Enemy Base Class
 * ==================
 * Base class for all enemies
 */

import { Entity } from './Entity.js';

export class Enemy extends Entity {
    constructor(x, y, width = 48, height = 32) {
        super(x, y, width, height);
        
        this.type = 'enemy';
        this.addTag('enemy');
        this.addTag('dangerous');
        
        // Movement
        this.moveSpeed = 60;
        this.patrolRange = 200;
        this.startX = x;
        this.patrolDirection = 1;
        
        // Detection
        this.detectionRange = 200;
        this.isAlerted = false;
        this.target = null;
        
        // Combat
        this.damage = 20;
        this.attackCooldown = 0;
        this.attackRate = 1; // attacks per second
        
        // Patrol pause behavior
        this.patrolPauseTime = 0;
        this.patrolPauseDuration = 2.0; // 2 seconds to pause at each edge
        this.isPaused = false;
        this.lastX = x; // Track last position to detect being blocked
        this.blockedTime = 0; // Time spent blocked by obstacle
        
        // State
        this.state = 'patrol'; // patrol, chase, attack, idle
    }
    
    /**
     * Detect player
     */
    detectPlayer(player) {
        const distance = this.distanceTo(player);
        const verticalDiff = Math.abs(player.y - this.y);
        
        // Only detect if player is within range AND on similar vertical level
        // (within 64 pixels vertically - about 2 tiles)
        if (distance < this.detectionRange && verticalDiff < 64) {
            this.isAlerted = true;
            this.target = player;
            this.state = 'chase';
            return true;
        }
        
        return false;
    }
    
    /**
     * Patrol behavior
     */
    patrol(dt) {
        // Handle pause at patrol edges
        if (this.isPaused) {
            this.velocityX = 0;
            this.patrolPauseTime -= dt;
            
            if (this.patrolPauseTime <= 0) {
                this.isPaused = false;
                this.blockedTime = 0;
                // Turn around after pause
                this.patrolDirection *= -1;
                this.facingRight = this.patrolDirection > 0;
            }
            return;
        }
        
        // Move in patrol direction
        this.velocityX = this.patrolDirection * this.moveSpeed;
        this.facingRight = this.patrolDirection > 0;
        
        // Calculate patrol boundaries (left and right edges from spawn point)
        const leftBound = this.startX - this.patrolRange;
        const rightBound = this.startX + this.patrolRange;
        
        // Check if blocked by obstacle (position not changing despite having velocity)
        const isBlocked = Math.abs(this.x - this.lastX) < 0.5 && Math.abs(this.velocityX) > 10;
        if (isBlocked) {
            this.blockedTime += dt;
            // If blocked for more than 0.1 seconds, treat as reaching edge
            if (this.blockedTime > 0.1) {
                this.isPaused = true;
                this.patrolPauseTime = this.patrolPauseDuration;
                this.velocityX = 0;
                this.blockedTime = 0;
            }
        } else {
            this.blockedTime = 0;
        }
        
        // Update last position for next frame
        this.lastX = this.x;
        
        // Check if reached right edge (going right)
        if (this.patrolDirection > 0 && this.x >= rightBound) {
            this.x = rightBound; // Clamp to boundary
            this.isPaused = true;
            this.patrolPauseTime = this.patrolPauseDuration;
            this.velocityX = 0;
        }
        // Check if reached left edge (going left)  
        else if (this.patrolDirection < 0 && this.x <= leftBound) {
            this.x = leftBound; // Clamp to boundary
            this.isPaused = true;
            this.patrolPauseTime = this.patrolPauseDuration;
            this.velocityX = 0;
        }
    }
    
    /**
     * Chase player
     */
    chase(player, dt) {
        const dx = player.centerX - this.centerX;
        const distance = this.distanceTo(player);
        const verticalDiff = Math.abs(player.y - this.y);
        
        // If player is on a different level (platform above/below), stop and watch
        if (verticalDiff > 64) {
            this.velocityX = 0;
            // Face the player's direction but don't move
            this.facingRight = dx > 0;
            
            // Give up if player stays out of reach for a while
            if (distance > this.detectionRange * 1.5) {
                this.isAlerted = false;
                this.target = null;
                this.state = 'patrol';
            }
            return;
        }
        
        // Update facing
        this.facingRight = dx > 0;
        
        if (distance > 30) {
            this.velocityX = (dx > 0 ? 1 : -1) * this.moveSpeed * 1.5;
        } else {
            this.velocityX = 0;
            this.state = 'attack';
        }
        
        // Give up chase if too far
        if (distance > this.detectionRange * 2) {
            this.isAlerted = false;
            this.target = null;
            this.state = 'patrol';
        }
    }
    
    /**
     * Attack player
     */
    attack(player, dt) {
        this.attackCooldown -= dt;
        
        if (this.attackCooldown <= 0) {
            if (this.collidesWith(player)) {
                player.takeDamage(this.damage);
                this.attackCooldown = 1 / this.attackRate;
            }
        }
        
        // Return to chase if player moves away
        if (this.distanceTo(player) > 50) {
            this.state = 'chase';
        }
    }
    
    /**
     * Fixed update
     */
    fixedUpdate(dt) {
        super.fixedUpdate(dt);
    }
    
    /**
     * Update with player reference
     */
    updateWithPlayer(dt, player) {
        // Detect player if not already alerted
        if (!this.isAlerted) {
            this.detectPlayer(player);
        }
        
        // State machine
        switch (this.state) {
            case 'patrol':
                this.patrol(dt);
                break;
            case 'chase':
                this.chase(player, dt);
                break;
            case 'attack':
                this.attack(player, dt);
                break;
        }
    }
}

/**
 * Wolf Enemy
 */
export class Wolf extends Enemy {
    constructor(x, y) {
        super(x, y, 56, 40);
        
        this.addTag('wolf');
        
        // Wolf-specific properties
        this.moveSpeed = 80;
        this.detectionRange = 250;
        this.damage = 25;
        
        // Animation
        this.animTimer = 0;
        this.legOffset = 0;
    }
    
    update(dt) {
        super.update(dt);
        
        this.animTimer += dt;
        
        // Leg animation when moving
        if (Math.abs(this.velocityX) > 10) {
            this.legOffset = Math.sin(this.animTimer * 15) * 3;
        } else {
            this.legOffset = 0;
        }
    }
    
    render(ctx, alpha = 1) {
        if (!this.isVisible) return;
        
        const pos = this.getInterpolatedPosition(alpha);
        
        ctx.save();
        
        if (!this.facingRight) {
            ctx.translate(pos.x + this.width, pos.y);
            ctx.scale(-1, 1);
            ctx.translate(-pos.x, -pos.y);
        }
        
        this.drawWolf(ctx, pos.x, pos.y);
        
        ctx.restore();
    }
    
    drawWolf(ctx, x, y) {
        const legOff = this.legOffset;
        
        // Body
        ctx.fillStyle = '#4a4a4a';
        ctx.beginPath();
        ctx.ellipse(x + 28, y + 24, 22, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Head
        ctx.beginPath();
        ctx.ellipse(x + 50, y + 20, 10, 8, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Snout
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        ctx.ellipse(x + 58, y + 22, 6, 4, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Ears
        ctx.fillStyle = '#4a4a4a';
        ctx.beginPath();
        ctx.moveTo(x + 46, y + 12);
        ctx.lineTo(x + 42, y + 4);
        ctx.lineTo(x + 50, y + 10);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 52, y + 12);
        ctx.lineTo(x + 54, y + 4);
        ctx.lineTo(x + 56, y + 10);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = this.isAlerted ? '#ff4444' : '#ffff00';
        ctx.beginPath();
        ctx.arc(x + 52, y + 18, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Legs
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(x + 12, y + 32 + legOff, 5, 10);
        ctx.fillRect(x + 22, y + 32 - legOff, 5, 10);
        ctx.fillRect(x + 34, y + 32 + legOff, 5, 10);
        ctx.fillRect(x + 44, y + 32 - legOff, 5, 10);
        
        // Tail
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x + 8, y + 20);
        ctx.quadraticCurveTo(x - 4, y + 10, x + 2, y + 6);
        ctx.stroke();
        
        // Alert indicator
        if (this.isAlerted) {
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('!', x + 52, y - 5);
        }
    }
}

/**
 * Boar Enemy
 */
export class Boar extends Enemy {
    constructor(x, y) {
        super(x, y, 52, 36);
        
        this.addTag('boar');
        
        // Boar-specific properties
        this.moveSpeed = 50;
        this.detectionRange = 150;
        this.damage = 30;
        
        // Charge attack
        this.isCharging = false;
        this.chargeSpeed = 250;
        this.chargeCooldown = 0;
    }
    
    chase(player, dt) {
        const distance = this.distanceTo(player);
        
        // Start charge if close enough
        if (distance < 120 && !this.isCharging && this.chargeCooldown <= 0) {
            this.isCharging = true;
            this.chargeDirection = player.centerX > this.centerX ? 1 : -1;
        }
        
        if (this.isCharging) {
            this.velocityX = this.chargeDirection * this.chargeSpeed;
            this.facingRight = this.chargeDirection > 0;
            
            // Stop charge after a distance
            if (Math.abs(this.x - this.startX) > this.patrolRange * 1.5) {
                this.isCharging = false;
                this.chargeCooldown = 2;
            }
        } else {
            super.chase(player, dt);
        }
        
        this.chargeCooldown -= dt;
    }
    
    render(ctx, alpha = 1) {
        if (!this.isVisible) return;
        
        const pos = this.getInterpolatedPosition(alpha);
        
        ctx.save();
        
        if (!this.facingRight) {
            ctx.translate(pos.x + this.width, pos.y);
            ctx.scale(-1, 1);
            ctx.translate(-pos.x, -pos.y);
        }
        
        this.drawBoar(ctx, pos.x, pos.y);
        
        ctx.restore();
    }
    
    drawBoar(ctx, x, y) {
        // Body
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(x + 26, y + 22, 20, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Head
        ctx.fillStyle = '#6B3510';
        ctx.beginPath();
        ctx.ellipse(x + 46, y + 22, 10, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Snout
        ctx.fillStyle = '#DEB887';
        ctx.beginPath();
        ctx.ellipse(x + 54, y + 24, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Nostrils
        ctx.fillStyle = '#4a3020';
        ctx.beginPath();
        ctx.arc(x + 53, y + 24, 1.5, 0, Math.PI * 2);
        ctx.arc(x + 57, y + 24, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Tusks
        ctx.fillStyle = '#FFFFF0';
        ctx.beginPath();
        ctx.moveTo(x + 50, y + 28);
        ctx.lineTo(x + 48, y + 34);
        ctx.lineTo(x + 52, y + 30);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = this.isCharging ? '#ff0000' : '#333';
        ctx.beginPath();
        ctx.arc(x + 48, y + 18, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Ears
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(x + 42, y + 12, 4, 6, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Legs
        ctx.fillStyle = '#6B3510';
        ctx.fillRect(x + 12, y + 32, 6, 8);
        ctx.fillRect(x + 24, y + 32, 6, 8);
        ctx.fillRect(x + 34, y + 32, 6, 8);
        
        // Charge effect
        if (this.isCharging) {
            ctx.fillStyle = 'rgba(255, 100, 0, 0.5)';
            ctx.beginPath();
            ctx.moveTo(x - 10, y + 20);
            ctx.lineTo(x + 5, y + 15);
            ctx.lineTo(x + 5, y + 30);
            ctx.lineTo(x - 10, y + 25);
            ctx.fill();
        }
    }
}
