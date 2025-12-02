/**
 * Player (Shepherd) Entity
 * =========================
 * The main playable character
 */

import { Entity } from './Entity.js';

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 48, 64);
        
        this.type = 'player';
        this.addTag('player');
        
        // Hitbox adjustments (slightly smaller than visual)
        this.hitboxOffsetX = 12;
        this.hitboxOffsetY = 8;
        this.hitboxWidth = 24;
        this.hitboxHeight = 56;
        
        // Movement properties
        this.moveSpeed = 250;
        this.jumpForce = 450;
        this.maxJumps = 1; // Set to 2 for double jump
        this.jumpsRemaining = 1;
        
        // State
        this.state = 'idle'; // idle, run, jump, fall, crouch, slide
        this.isJumping = false;
        this.isCrouching = false;
        this.isSliding = false;
        this.canInteract = false;
        this.nearbyInteractable = null;
        
        // Coyote time (grace period after leaving ground)
        this.coyoteTime = 0.1; // seconds
        this.coyoteTimer = 0;
        
        // Jump buffer (press jump slightly before landing)
        this.jumpBufferTime = 0.1;
        this.jumpBufferTimer = 0;
        
        // Invulnerability
        this.isInvulnerable = false;
        this.invulnerabilityTime = 0;
        this.invulnerabilityDuration = 1.5;
        
        // Energy
        this.energy = 100;
        this.maxEnergy = 100;
        
        // Rescued sheep following
        this.rescuedSheep = [];
        
        // Animation definitions
        this.animations = {
            idle: { frames: 4, fps: 6, loop: true },
            run: { frames: 6, fps: 10, loop: true },
            jump: { frames: 2, fps: 8, loop: false },
            fall: { frames: 2, fps: 8, loop: false },
            crouch: { frames: 1, fps: 1, loop: false },
        };
        
        this.setAnimation('idle');
    }
    
    /**
     * Set current animation
     */
    setAnimation(name) {
        if (this.currentAnimationName === name) return;
        
        this.currentAnimationName = name;
        this.animation = this.animations[name];
        this.animationFrame = 0;
        this.animationTime = 0;
    }
    
    /**
     * Handle input and update player state
     */
    handleInput(input, dt) {
        // Horizontal movement with acceleration for smoother feel
        const moveX = input.getHorizontalAxis();
        const acceleration = 1800; // How fast to reach target speed
        const deceleration = 2400; // How fast to stop (higher = snappier)
        const airControl = 0.7; // Reduced control in air
        
        const targetVelocityX = moveX * this.moveSpeed;
        const accelRate = this.isGrounded ? acceleration : acceleration * airControl;
        const decelRate = this.isGrounded ? deceleration : deceleration * airControl;
        
        if (!this.isCrouching || !this.isGrounded) {
            // Accelerate towards target velocity
            if (Math.abs(targetVelocityX) > 0.1) {
                // Accelerating
                if (this.velocityX < targetVelocityX) {
                    this.velocityX = Math.min(this.velocityX + accelRate * dt, targetVelocityX);
                } else if (this.velocityX > targetVelocityX) {
                    this.velocityX = Math.max(this.velocityX - accelRate * dt, targetVelocityX);
                }
            } else {
                // Decelerating (no input)
                if (this.velocityX > 0) {
                    this.velocityX = Math.max(0, this.velocityX - decelRate * dt);
                } else if (this.velocityX < 0) {
                    this.velocityX = Math.min(0, this.velocityX + decelRate * dt);
                }
            }
            
            // Update facing direction
            if (moveX > 0) this.facingRight = true;
            else if (moveX < 0) this.facingRight = false;
        } else {
            this.velocityX = 0;
        }
        
        // Crouching
        if (input.isDown('crouch') && this.isGrounded) {
            this.isCrouching = true;
            this.hitboxHeight = 40;
            this.hitboxOffsetY = 24;
        } else {
            this.isCrouching = false;
            this.hitboxHeight = 56;
            this.hitboxOffsetY = 8;
        }
        
        // Jump buffer
        if (input.isPressed('jump')) {
            this.jumpBufferTimer = this.jumpBufferTime;
        }
        
        // Update coyote time
        if (this.isGrounded) {
            this.coyoteTimer = this.coyoteTime;
            this.jumpsRemaining = this.maxJumps;
        } else {
            this.coyoteTimer -= dt;
        }
        
        // Jump
        if (this.jumpBufferTimer > 0) {
            if (this.coyoteTimer > 0 || this.jumpsRemaining > 0) {
                this.jump();
                this.jumpBufferTimer = 0;
                this.coyoteTimer = 0;
            }
        }
        
        this.jumpBufferTimer -= dt;
        
        // Variable jump height (release jump early for shorter jump)
        if (input.isReleased('jump') && this.velocityY < 0) {
            this.velocityY *= 0.5;
        }
        
        // Interaction
        if (input.isPressed('action') && this.nearbyInteractable) {
            this.interact(this.nearbyInteractable);
        }
    }
    
    /**
     * Perform jump
     */
    jump() {
        this.velocityY = -this.jumpForce;
        this.isGrounded = false;
        this.isJumping = true;
        this.jumpsRemaining--;
    }
    
    /**
     * Interact with nearby entity
     */
    interact(entity) {
        if (entity.type === 'sheep' && !entity.isRescued) {
            entity.rescue(this);
            this.rescuedSheep.push(entity);
        }
    }
    
    /**
     * Take damage
     */
    takeDamage(amount = 10) {
        if (this.isInvulnerable) return;
        
        this.energy -= amount;
        this.isInvulnerable = true;
        this.invulnerabilityTime = this.invulnerabilityDuration;
        
        // Knockback
        this.velocityY = -200;
        
        if (this.energy <= 0) {
            this.die();
        }
    }
    
    /**
     * Heal
     */
    heal(amount = 20) {
        this.energy = Math.min(this.energy + amount, this.maxEnergy);
    }
    
    /**
     * Die
     */
    die() {
        this.isActive = false;
        // Game over handling is done by the scene
    }
    
    /**
     * Update state machine
     */
    updateState() {
        if (this.isCrouching && this.isGrounded) {
            this.state = 'crouch';
        } else if (!this.isGrounded) {
            if (this.velocityY < 0) {
                this.state = 'jump';
            } else {
                this.state = 'fall';
            }
        } else if (Math.abs(this.velocityX) > 10) {
            this.state = 'run';
        } else {
            this.state = 'idle';
        }
        
        this.setAnimation(this.state);
    }
    
    /**
     * Fixed update (physics)
     */
    fixedUpdate(dt) {
        super.fixedUpdate(dt);
        
        // Reset grounded flag (will be set by collision)
        if (this.velocityY > 0) {
            this.isGrounded = false;
        }
        
        // Detect landing
        if (this.isGrounded && this.isJumping) {
            this.isJumping = false;
        }
    }
    
    /**
     * Variable update
     */
    update(dt) {
        super.update(dt);
        
        // Update state machine
        this.updateState();
        
        // Update invulnerability
        if (this.isInvulnerable) {
            this.invulnerabilityTime -= dt;
            if (this.invulnerabilityTime <= 0) {
                this.isInvulnerable = false;
            }
        }
    }
    
    /**
     * Render player
     */
    render(ctx, alpha = 1) {
        if (!this.isVisible) return;
        
        const pos = this.getInterpolatedPosition(alpha);
        
        // Flash when invulnerable
        if (this.isInvulnerable && Math.floor(this.invulnerabilityTime * 10) % 2 === 0) {
            return;
        }
        
        ctx.save();
        
        // Flip sprite if facing left
        if (!this.facingRight) {
            ctx.translate(pos.x + this.width / 2, 0);
            ctx.scale(-1, 1);
            ctx.translate(-(pos.x + this.width / 2), 0);
        }
        
        // Draw placeholder shepherd
        this.drawPlaceholder(ctx, pos.x, pos.y);
        
        ctx.restore();
    }
    
    /**
     * Draw placeholder graphics
     */
    drawPlaceholder(ctx, x, y) {
        // Body (brown tunic)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x + 12, y + 24, 24, 32);
        
        // Head (skin color)
        ctx.fillStyle = '#DEB887';
        ctx.beginPath();
        ctx.arc(x + 24, y + 16, 14, 0, Math.PI * 2);
        ctx.fill();
        
        // Hair
        ctx.fillStyle = '#4a3728';
        ctx.beginPath();
        ctx.arc(x + 24, y + 12, 12, Math.PI, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#333';
        ctx.fillRect(x + 19, y + 14, 3, 4);
        ctx.fillRect(x + 26, y + 14, 3, 4);
        
        // Legs
        ctx.fillStyle = '#654321';
        ctx.fillRect(x + 14, y + 54, 8, 10);
        ctx.fillRect(x + 26, y + 54, 8, 10);
        
        // Staff (if idle)
        if (this.state === 'idle') {
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x + 40, y + 10);
            ctx.lineTo(x + 40, y + 60);
            ctx.stroke();
            
            // Staff hook
            ctx.beginPath();
            ctx.arc(x + 36, y + 10, 5, Math.PI, Math.PI * 2);
            ctx.stroke();
        }
        
        // Crouch adjustment
        if (this.isCrouching) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(x + 10, y + 55, 28, 5);
        }
    }
    
    /**
     * Render debug info
     */
    renderDebug(ctx) {
        super.renderDebug(ctx);
        
        // Draw state text
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.fillText(this.state, this.x, this.y - 5);
    }
}
