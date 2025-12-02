/**
 * Renderer
 * =========
 * Handles all rendering operations
 */

export class Renderer {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
    }
    
    /**
     * Render a scene
     */
    render(scene) {
        if (!scene) return;
        
        const ctx = this.ctx;
        const camera = this.game.camera;
        
        // Save context state
        ctx.save();
        
        // Apply camera transform
        ctx.translate(-camera.x, -camera.y);
        
        // Render scene layers
        scene.render(ctx, camera);
        
        // Restore context state
        ctx.restore();
    }
    
    /**
     * Render parallax background layers
     */
    renderParallax(ctx, layers, camera) {
        layers.forEach(layer => {
            const parallaxX = camera.x * layer.speedX;
            const parallaxY = camera.y * layer.speedY;
            
            ctx.save();
            ctx.translate(-parallaxX, -parallaxY);
            
            if (layer.image) {
                // Tile the image horizontally
                const imgWidth = layer.image.width;
                const startX = Math.floor(parallaxX / imgWidth) * imgWidth;
                const endX = startX + this.game.width + imgWidth * 2;
                
                for (let x = startX; x < endX; x += imgWidth) {
                    ctx.drawImage(layer.image, x, layer.y || 0);
                }
            } else if (layer.color) {
                // Solid color layer
                ctx.fillStyle = layer.color;
                ctx.fillRect(parallaxX, 0, this.game.width, this.game.height);
            }
            
            ctx.restore();
        });
    }
    
    /**
     * Render a sprite
     */
    renderSprite(ctx, sprite, x, y, flipX = false, flipY = false) {
        ctx.save();
        
        if (flipX || flipY) {
            ctx.translate(x + sprite.width / 2, y + sprite.height / 2);
            ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
            ctx.translate(-sprite.width / 2, -sprite.height / 2);
            ctx.drawImage(sprite, 0, 0);
        } else {
            ctx.drawImage(sprite, x, y);
        }
        
        ctx.restore();
    }
    
    /**
     * Render a sprite from a spritesheet
     */
    renderSpriteFrame(ctx, sheet, frameX, frameY, frameWidth, frameHeight, x, y, flipX = false) {
        ctx.save();
        
        if (flipX) {
            ctx.translate(x + frameWidth / 2, y);
            ctx.scale(-1, 1);
            ctx.drawImage(
                sheet,
                frameX * frameWidth, frameY * frameHeight,
                frameWidth, frameHeight,
                -frameWidth / 2, 0,
                frameWidth, frameHeight
            );
        } else {
            ctx.drawImage(
                sheet,
                frameX * frameWidth, frameY * frameHeight,
                frameWidth, frameHeight,
                x, y,
                frameWidth, frameHeight
            );
        }
        
        ctx.restore();
    }
    
    /**
     * Render a rectangle (for placeholders/debug)
     */
    renderRect(ctx, x, y, width, height, color = '#888', stroke = false) {
        ctx.save();
        
        if (stroke) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
        } else {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, width, height);
        }
        
        ctx.restore();
    }
    
    /**
     * Render text
     */
    renderText(ctx, text, x, y, options = {}) {
        const {
            font = '16px Arial',
            color = '#fff',
            align = 'left',
            baseline = 'top',
            shadow = false
        } = options;
        
        ctx.save();
        ctx.font = font;
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.textBaseline = baseline;
        
        if (shadow) {
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
        }
        
        ctx.fillText(text, x, y);
        ctx.restore();
    }
    
    /**
     * Render a tilemap layer
     */
    renderTilemap(ctx, tilemap, tileset, camera) {
        const tileSize = tilemap.tileSize;
        const cols = tilemap.width;
        const rows = tilemap.height;
        
        // Calculate visible tile range
        const startCol = Math.max(0, Math.floor(camera.x / tileSize));
        const endCol = Math.min(cols, Math.ceil((camera.x + this.game.width) / tileSize) + 1);
        const startRow = Math.max(0, Math.floor(camera.y / tileSize));
        const endRow = Math.min(rows, Math.ceil((camera.y + this.game.height) / tileSize) + 1);
        
        // Render visible tiles
        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
                const tileId = tilemap.data[row * cols + col];
                
                if (tileId > 0) {
                    const tileX = col * tileSize;
                    const tileY = row * tileSize;
                    
                    if (tileset) {
                        // Render from tileset image
                        const tilesPerRow = Math.floor(tileset.width / tileSize);
                        const srcX = ((tileId - 1) % tilesPerRow) * tileSize;
                        const srcY = Math.floor((tileId - 1) / tilesPerRow) * tileSize;
                        
                        ctx.drawImage(
                            tileset,
                            srcX, srcY, tileSize, tileSize,
                            tileX, tileY, tileSize, tileSize
                        );
                    } else {
                        // Render placeholder
                        this.renderPlaceholderTile(ctx, tileId, tileX, tileY, tileSize);
                    }
                }
            }
        }
    }
    
    /**
     * Render placeholder tile
     */
    renderPlaceholderTile(ctx, tileId, x, y, size) {
        const colors = {
            1: '#654321', // Ground
            2: '#8B4513', // Dirt
            3: '#228B22', // Grass
            4: '#808080', // Stone
            5: '#4a3728', // Platform
            6: '#4A90D9', // Water
            7: '#505050', // Rock barrier
        };
        
        const color = colors[tileId] || '#666';
        
        ctx.fillStyle = color;
        ctx.fillRect(x, y, size, size);
        
        // Add water wave effect
        if (tileId === 6) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            const waveOffset = (Date.now() / 500) % 1;
            ctx.fillRect(x, y + size * 0.3, size, 3);
            ctx.fillRect(x, y + size * 0.6, size, 2);
        }
        
        // Add slight border for visibility
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.strokeRect(x, y, size, size);
    }
}
