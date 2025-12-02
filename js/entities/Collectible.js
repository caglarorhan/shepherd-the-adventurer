/**
 * Collectible Entity
 * ===================
 * Items the player can collect (berries, herbs, golden wool)
 */

import { Entity } from './Entity.js';

export class Collectible extends Entity {
    constructor(x, y, type = 'berry') {
        super(x, y, 24, 24);
        
        this.type = 'collectible';
        this.collectibleType = type;
        this.addTag('collectible');
        
        // Hitbox
        this.hitboxOffsetX = 4;
        this.hitboxOffsetY = 4;
        this.hitboxWidth = 16;
        this.hitboxHeight = 16;
        
        // State
        this.isCollected = false;
        
        // Animation
        this.bobOffset = Math.random() * Math.PI * 2;
        this.bobSpeed = 4;
        this.bobAmount = 4;
        
        // Sparkle effect
        this.sparkleTimer = 0;
        
        // Type-specific properties
        this.setupType();
    }
    
    /**
     * Setup based on collectible type
     */
    setupType() {
        switch (this.collectibleType) {
            case 'berry':
                this.color = '#8B0000';
                this.value = 10;
                this.healAmount = 10;
                break;
            case 'herb':
                this.color = '#228B22';
                this.value = 15;
                this.healAmount = 20;
                break;
            case 'golden-wool':
                this.color = '#FFD700';
                this.value = 100;
                this.healAmount = 0;
                this.addTag('golden-wool');
                this.bobSpeed = 6;
                break;
            default:
                this.color = '#888';
                this.value = 5;
                this.healAmount = 5;
        }
    }
    
    /**
     * Collect this item
     */
    collect(player) {
        if (this.isCollected) return;
        
        this.isCollected = true;
        this.isVisible = false;
        
        // Heal player if applicable
        if (this.healAmount > 0) {
            player.heal(this.healAmount);
        }
        
        console.log(`✨ Collected ${this.collectibleType}!`);
    }
    
    /**
     * Update animation
     */
    update(dt) {
        super.update(dt);
        
        this.bobOffset += dt * this.bobSpeed;
        this.sparkleTimer += dt;
    }
    
    /**
     * Render collectible
     */
    render(ctx, alpha = 1) {
        if (!this.isVisible || this.isCollected) return;
        
        const pos = this.getInterpolatedPosition(alpha);
        const bob = Math.sin(this.bobOffset) * this.bobAmount;
        
        ctx.save();
        ctx.translate(pos.x + this.width / 2, pos.y + this.height / 2 + bob);
        
        // Draw based on type
        switch (this.collectibleType) {
            case 'berry':
                this.drawBerry(ctx);
                break;
            case 'herb':
                this.drawHerb(ctx);
                break;
            case 'golden-wool':
                this.drawGoldenWool(ctx);
                break;
            default:
                this.drawDefault(ctx);
        }
        
        ctx.restore();
    }
    
    /**
     * Draw berry
     */
    drawBerry(ctx) {
        // Berry cluster
        ctx.fillStyle = '#8B0000';
        ctx.beginPath();
        ctx.arc(-4, 0, 6, 0, Math.PI * 2);
        ctx.arc(4, 0, 6, 0, Math.PI * 2);
        ctx.arc(0, -5, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlights
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(-5, -2, 2, 0, Math.PI * 2);
        ctx.arc(3, -2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Leaves
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.ellipse(0, -10, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Draw herb
     */
    drawHerb(ctx) {
        ctx.fillStyle = '#228B22';
        
        // Stems
        ctx.beginPath();
        ctx.moveTo(-3, 8);
        ctx.quadraticCurveTo(-6, 0, -4, -6);
        ctx.quadraticCurveTo(-2, -8, 0, -4);
        ctx.quadraticCurveTo(2, -8, 4, -6);
        ctx.quadraticCurveTo(6, 0, 3, 8);
        ctx.fill();
        
        // Leaves
        ctx.beginPath();
        ctx.ellipse(-5, -4, 4, 6, -0.3, 0, Math.PI * 2);
        ctx.ellipse(5, -4, 4, 6, 0.3, 0, Math.PI * 2);
        ctx.ellipse(0, -8, 3, 5, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Draw golden wool
     */
    drawGoldenWool(ctx) {
        // Glow effect
        const glowSize = 15 + Math.sin(this.sparkleTimer * 3) * 3;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Golden wool ball
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Wool texture
        ctx.fillStyle = '#FFA500';
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 + this.sparkleTimer;
            const x = Math.cos(angle) * 5;
            const y = Math.sin(angle) * 5;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Sparkles
        ctx.fillStyle = '#FFF';
        const sparkleAngle = this.sparkleTimer * 2;
        for (let i = 0; i < 3; i++) {
            const angle = sparkleAngle + (i * Math.PI * 2 / 3);
            const distance = 12 + Math.sin(this.sparkleTimer * 4 + i) * 3;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    /**
     * Draw default collectible
     */
    drawDefault(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(-3, -3, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}
