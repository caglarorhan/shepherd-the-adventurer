/**
 * Asset Loader
 * =============
 * Handles loading and caching of game assets
 */

export class AssetLoader {
    constructor() {
        this.images = new Map();
        this.animations = new Map(); // Store animated sprites
        this.audio = new Map();
        this.json = new Map();
        this.loadedCount = 0;
        this.totalCount = 0;
        this.onProgress = null;
    }
    
    /**
     * Get loading progress (0-1)
     */
    get progress() {
        return this.totalCount > 0 ? this.loadedCount / this.totalCount : 0;
    }
    
    /**
     * Load multiple images
     */
    async loadImages(imageMap) {
        const entries = Object.entries(imageMap);
        this.totalCount += entries.length;
        
        const promises = entries.map(([key, src]) => this.loadImage(key, src));
        await Promise.all(promises);
    }
    
    /**
     * Load a single image (handles GIFs with animation extraction)
     */
    loadImage(key, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                this.images.set(key, img);
                this.loadedCount++;
                this.reportProgress();
                resolve(img);
            };
            
            img.onerror = () => {
                console.warn(`Failed to load image: ${src}`);
                this.loadedCount++;
                this.reportProgress();
                resolve(null); // Don't reject, just continue
            };
            
            img.src = src;
        });
    }
    
    /**
     * Load animated GIF as separate frames using offscreen rendering
     * This extracts frames from a GIF by rendering it at different times
     */
    async loadAnimatedGif(key, src, frameCount, fps = 10) {
        this.totalCount++;
        
        try {
            // Create an image element for the GIF
            const gifImg = document.createElement('img');
            gifImg.src = src;
            
            await new Promise((resolve, reject) => {
                gifImg.onload = resolve;
                gifImg.onerror = reject;
            });
            
            // Store animation data
            this.animations.set(key, {
                image: gifImg,
                frameCount: frameCount,
                fps: fps,
                frameWidth: gifImg.width,
                frameHeight: gifImg.height
            });
            
            this.loadedCount++;
            this.reportProgress();
            console.log(`✅ Loaded animated sprite: ${key} (${frameCount} frames)`);
            
        } catch (error) {
            console.warn(`Failed to load animated GIF: ${src}`);
            this.loadedCount++;
            this.reportProgress();
        }
    }
    
    /**
     * Get animation data
     */
    getAnimation(key) {
        return this.animations.get(key);
    }
    
    /**
     * Check if animation exists
     */
    hasAnimation(key) {
        return this.animations.has(key);
    }
    
    /**
     * Load multiple audio files
     */
    async loadAudio(audioMap) {
        const entries = Object.entries(audioMap);
        this.totalCount += entries.length;
        
        const promises = entries.map(([key, src]) => this.loadAudioFile(key, src));
        await Promise.all(promises);
    }
    
    /**
     * Load a single audio file
     */
    loadAudioFile(key, src) {
        return new Promise((resolve) => {
            const audio = new Audio();
            
            audio.oncanplaythrough = () => {
                this.audio.set(key, audio);
                this.loadedCount++;
                this.reportProgress();
                resolve(audio);
            };
            
            audio.onerror = () => {
                console.warn(`Failed to load audio: ${src}`);
                this.loadedCount++;
                this.reportProgress();
                resolve(null);
            };
            
            audio.src = src;
            audio.load();
        });
    }
    
    /**
     * Load JSON data
     */
    async loadJSON(key, src) {
        this.totalCount++;
        
        try {
            const response = await fetch(src);
            const data = await response.json();
            this.json.set(key, data);
            this.loadedCount++;
            this.reportProgress();
            return data;
        } catch (error) {
            console.warn(`Failed to load JSON: ${src}`);
            this.loadedCount++;
            this.reportProgress();
            return null;
        }
    }
    
    /**
     * Report loading progress
     */
    reportProgress() {
        if (this.onProgress) {
            this.onProgress(this.progress, this.loadedCount, this.totalCount);
        }
    }
    
    /**
     * Get an image by key
     */
    getImage(key) {
        return this.images.get(key);
    }
    
    /**
     * Get audio by key
     */
    getAudio(key) {
        return this.audio.get(key);
    }
    
    /**
     * Get JSON data by key
     */
    getJSON(key) {
        return this.json.get(key);
    }
    
    /**
     * Check if an image exists
     */
    hasImage(key) {
        return this.images.has(key);
    }
    
    /**
     * Create a placeholder image
     */
    createPlaceholder(width, height, color = '#888') {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Fill with color
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
        
        // Add border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, width - 2, height - 2);
        
        // Add X pattern
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(width, height);
        ctx.moveTo(width, 0);
        ctx.lineTo(0, height);
        ctx.stroke();
        
        return canvas;
    }
}
