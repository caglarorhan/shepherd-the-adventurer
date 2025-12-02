/**
 * Level Loader
 * =============
 * Loads and manages level data
 */

export class LevelLoader {
    constructor() {
        this.levels = {};
        this.tileSize = 32;
        
        // Define all levels
        this.defineLevels();
    }
    
    /**
     * Define all game levels
     */
    defineLevels() {
        // Level 1: Forest Entrance
        this.levels[1] = this.createLevel1();
        
        // Level 2: River Crossing
        this.levels[2] = this.createLevel2();
        
        // Level 3: Hazard Path
        this.levels[3] = this.createLevel3();
        
        // Level 4: Deep Woods
        this.levels[4] = this.createLevel4();
        
        // Level 5: Mountain Clearing
        this.levels[5] = this.createLevel5();
    }
    
    /**
     * Get level data
     */
    getLevel(levelNum) {
        return this.levels[levelNum] || this.levels[1];
    }
    
    /**
     * Create Level 1: Forest Entrance
     */
    createLevel1() {
        // Level dimensions
        const width = 60;
        const height = 20;
        const ts = this.tileSize;
        
        // Create tilemap data
        const data = new Array(width * height).fill(0);
        
        // Ground layer (row 17-19)
        for (let x = 0; x < width; x++) {
            // Grass top
            data[16 * width + x] = 3;
            // Dirt below
            data[17 * width + x] = 2;
            data[18 * width + x] = 2;
            data[19 * width + x] = 2;
        }
        
        // Platforms
        // Platform 1
        for (let x = 10; x < 15; x++) {
            data[13 * width + x] = 5;
        }
        
        // Platform 2
        for (let x = 20; x < 26; x++) {
            data[11 * width + x] = 5;
        }
        
        // Platform 3
        for (let x = 30; x < 36; x++) {
            data[12 * width + x] = 5;
        }
        
        // Elevated ground section
        for (let x = 42; x < 50; x++) {
            data[14 * width + x] = 3;
            data[15 * width + x] = 2;
            data[16 * width + x] = 2;
        }
        
        // Small hills
        for (let x = 5; x < 8; x++) {
            data[15 * width + x] = 3;
            data[16 * width + x] = 2;
        }
        
        return {
            name: 'Forest Entrance',
            tilemap: {
                width: width,
                height: height,
                tileSize: ts,
                data: data
            },
            playerSpawn: { x: 64, y: 16 * ts - 64 },
            sheep: [
                { x: 400, y: 16 * ts - 32 },
                { x: 700, y: 11 * ts - 32 },
                { x: 1100, y: 16 * ts - 32 }
            ],
            enemies: [],
            collectibles: [
                { x: 200, y: 480, type: 'berry' },
                { x: 380, y: 380, type: 'berry' },
                { x: 720, y: 320, type: 'herb' },
                { x: 1000, y: 420, type: 'berry' },
                { x: 550, y: 250, type: 'golden-wool' }
            ],
            background: {
                type: 'forest',
                timeOfDay: 'day'
            }
        };
    }
    
    /**
     * Create Level 2: River Crossing
     */
    createLevel2() {
        const width = 70;
        const height = 22;
        const ts = this.tileSize;
        
        const data = new Array(width * height).fill(0);
        
        // Ground with gaps (river)
        for (let x = 0; x < width; x++) {
            // Skip gaps for river
            if ((x >= 15 && x <= 25) || (x >= 40 && x <= 48)) {
                continue;
            }
            data[18 * width + x] = 3;
            data[19 * width + x] = 2;
            data[20 * width + x] = 2;
            data[21 * width + x] = 2;
        }
        
        // Add water in the river gaps
        for (let x = 15; x <= 25; x++) {
            data[18 * width + x] = 6; // Water
            data[19 * width + x] = 6;
            data[20 * width + x] = 6;
            data[21 * width + x] = 6;
        }
        for (let x = 40; x <= 48; x++) {
            data[18 * width + x] = 6; // Water
            data[19 * width + x] = 6;
            data[20 * width + x] = 6;
            data[21 * width + x] = 6;
        }
        
        // Add small rock barriers at river edges (only 1 tile high, at ground level)
        // River 1 barriers (columns 14 and 26)
        data[17 * width + 14] = 7; // Rock barrier left (1 tile above ground)
        data[17 * width + 26] = 7; // Rock barrier right
        // River 2 barriers (columns 39 and 49)
        data[17 * width + 39] = 7; // Rock barrier left
        data[17 * width + 49] = 7; // Rock barrier right
        
        // Stepping stones in river 1
        for (let x = 17; x < 24; x += 3) {
            data[17 * width + x] = 4;
        }
        
        // Stepping stones in river 2
        for (let x = 42; x < 47; x += 2) {
            data[16 * width + x] = 4;
        }
        
        // Platforms
        for (let x = 28; x < 35; x++) {
            data[14 * width + x] = 5;
        }
        
        for (let x = 55; x < 62; x++) {
            data[15 * width + x] = 5;
        }
        
        return {
            name: 'River Crossing',
            tilemap: {
                width: width,
                height: height,
                tileSize: ts,
                data: data
            },
            playerSpawn: { x: 64, y: 18 * ts - 64 },
            sheep: [
                { x: 300, y: 18 * ts - 32 },      // Before first river (ground)
                { x: 880, y: 18 * ts - 32 },      // Between rivers (x=27-39 tiles = 864-1248)
                { x: 1000, y: 18 * ts - 32 },     // Between rivers
                { x: 1600, y: 18 * ts - 32 }      // After second river (x=50+ tiles)
            ],
            enemies: [
                { type: 'wolf', x: 900, y: 18 * ts - 48, patrolRange: 100 }  // Between rivers, safe area
            ],
            collectibles: [
                { x: 180, y: 18 * ts - 40, type: 'berry' },
                { x: 350, y: 18 * ts - 40, type: 'herb' },
                { x: 950, y: 18 * ts - 40, type: 'berry' },
                { x: 1100, y: 18 * ts - 40, type: 'berry' },
                { x: 1700, y: 18 * ts - 40, type: 'golden-wool' }
            ],
            background: {
                type: 'forest',
                timeOfDay: 'day'
            }
        };
    }
    
    /**
     * Create Level 3: Hazard Path
     */
    createLevel3() {
        const width = 80;
        const height = 24;
        const ts = this.tileSize;
        
        const data = new Array(width * height).fill(0);
        
        // Uneven terrain
        for (let x = 0; x < width; x++) {
            let groundY = 20;
            
            // Create hills and valleys
            if (x >= 20 && x < 30) groundY = 18;
            else if (x >= 35 && x < 40) groundY = 16;
            else if (x >= 50 && x < 55) groundY = 19;
            else if (x >= 60 && x < 70) groundY = 17;
            
            // Fill ground
            for (let y = groundY; y < height; y++) {
                if (y === groundY) {
                    data[y * width + x] = 3; // Grass
                } else {
                    data[y * width + x] = 2; // Dirt
                }
            }
        }
        
        // Platforms scattered
        for (let x = 12; x < 17; x++) data[15 * width + x] = 5;
        for (let x = 42; x < 48; x++) data[13 * width + x] = 5;
        for (let x = 72; x < 78; x++) data[14 * width + x] = 5;
        
        return {
            name: 'Hazard Path',
            tilemap: {
                width: width,
                height: height,
                tileSize: ts,
                data: data
            },
            playerSpawn: { x: 64, y: 20 * ts - 64 },
            sheep: [
                { x: 350, y: 20 * ts - 32 },
                { x: 700, y: 450 },
                { x: 1100, y: 380 },
                { x: 1500, y: 480 }
            ],
            enemies: [
                { type: 'wolf', x: 400, y: 580, patrolRange: 200 },
                { type: 'boar', x: 900, y: 520, patrolRange: 150 }
            ],
            collectibles: [
                { x: 200, y: 580, type: 'berry' },
                { x: 450, y: 440, type: 'herb' },
                { x: 750, y: 500, type: 'berry' },
                { x: 1000, y: 400, type: 'herb' },
                { x: 1350, y: 350, type: 'golden-wool' }
            ],
            background: {
                type: 'forest',
                timeOfDay: 'afternoon'
            }
        };
    }
    
    /**
     * Create Level 4: Deep Woods
     */
    createLevel4() {
        const width = 90;
        const height = 26;
        const ts = this.tileSize;
        
        const data = new Array(width * height).fill(0);
        
        // Dense forest terrain
        for (let x = 0; x < width; x++) {
            let groundY = 22;
            
            // More varied terrain
            if (x >= 15 && x < 25) groundY = 20;
            else if (x >= 30 && x < 35) groundY = 18;
            else if (x >= 45 && x < 55) groundY = 21;
            else if (x >= 60 && x < 70) groundY = 19;
            else if (x >= 75 && x < 85) groundY = 17;
            
            for (let y = groundY; y < height; y++) {
                if (y === groundY) {
                    data[y * width + x] = 3;
                } else {
                    data[y * width + x] = 2;
                }
            }
        }
        
        // Many platforms for stealth paths
        for (let x = 8; x < 13; x++) data[17 * width + x] = 5;
        for (let x = 20; x < 26; x++) data[15 * width + x] = 5;
        for (let x = 35; x < 40; x++) data[14 * width + x] = 5;
        for (let x = 50; x < 56; x++) data[16 * width + x] = 5;
        for (let x = 65; x < 72; x++) data[13 * width + x] = 5;
        for (let x = 80; x < 88; x++) data[12 * width + x] = 5;
        
        return {
            name: 'Deep Woods',
            tilemap: {
                width: width,
                height: height,
                tileSize: ts,
                data: data
            },
            playerSpawn: { x: 64, y: 22 * ts - 64 },
            sheep: [
                { x: 300, y: 22 * ts - 32 },
                { x: 600, y: 500 },
                { x: 1000, y: 580 },
                { x: 1400, y: 450 },
                { x: 1800, y: 380 }
            ],
            enemies: [
                { type: 'wolf', x: 350, y: 650, patrolRange: 180 },
                { type: 'wolf', x: 800, y: 600, patrolRange: 200 },
                { type: 'boar', x: 1200, y: 550, patrolRange: 150 }
            ],
            collectibles: [
                { x: 150, y: 650, type: 'berry' },
                { x: 400, y: 520, type: 'herb' },
                { x: 700, y: 480, type: 'berry' },
                { x: 950, y: 440, type: 'herb' },
                { x: 1300, y: 400, type: 'berry' },
                { x: 1600, y: 350, type: 'golden-wool' },
                { x: 1900, y: 320, type: 'golden-wool' }
            ],
            background: {
                type: 'dark-forest',
                timeOfDay: 'dusk'
            }
        };
    }
    
    /**
     * Create Level 5: Mountain Clearing
     */
    createLevel5() {
        const width = 100;
        const height = 28;
        const ts = this.tileSize;
        
        const data = new Array(width * height).fill(0);
        
        // Mountain terrain with cliffs
        for (let x = 0; x < width; x++) {
            let groundY = 24;
            
            // Progressive elevation (going uphill)
            if (x >= 10 && x < 20) groundY = 23;
            else if (x >= 20 && x < 35) groundY = 21;
            else if (x >= 35 && x < 50) groundY = 19;
            else if (x >= 50 && x < 65) groundY = 17;
            else if (x >= 65 && x < 80) groundY = 15;
            else if (x >= 80) groundY = 13;
            
            for (let y = groundY; y < height; y++) {
                if (y === groundY) {
                    data[y * width + x] = x < 80 ? 3 : 4; // Stone at peak
                } else {
                    data[y * width + x] = x < 80 ? 2 : 4;
                }
            }
        }
        
        // Cliff ledges
        for (let x = 25; x < 30; x++) data[18 * width + x] = 4;
        for (let x = 40; x < 46; x++) data[15 * width + x] = 4;
        for (let x = 55; x < 62; x++) data[13 * width + x] = 4;
        for (let x = 70; x < 76; x++) data[11 * width + x] = 4;
        for (let x = 85; x < 95; x++) data[9 * width + x] = 4;
        
        return {
            name: 'Mountain Clearing',
            tilemap: {
                width: width,
                height: height,
                tileSize: ts,
                data: data
            },
            playerSpawn: { x: 64, y: 24 * ts - 64 },
            sheep: [
                { x: 250, y: 24 * ts - 32 },
                { x: 500, y: 620 },
                { x: 800, y: 540 },
                { x: 1100, y: 480 },
                { x: 1500, y: 400 },
                { x: 2000, y: 300 }
            ],
            enemies: [
                { type: 'wolf', x: 400, y: 700, patrolRange: 200 },
                { type: 'wolf', x: 900, y: 580, patrolRange: 180 },
                { type: 'boar', x: 1300, y: 500, patrolRange: 200 },
                { type: 'wolf', x: 1700, y: 420, patrolRange: 150 }
            ],
            collectibles: [
                { x: 180, y: 720, type: 'berry' },
                { x: 350, y: 680, type: 'herb' },
                { x: 600, y: 600, type: 'berry' },
                { x: 850, y: 520, type: 'herb' },
                { x: 1000, y: 460, type: 'berry' },
                { x: 1250, y: 400, type: 'herb' },
                { x: 1450, y: 360, type: 'golden-wool' },
                { x: 1800, y: 300, type: 'golden-wool' },
                { x: 2100, y: 260, type: 'golden-wool' }
            ],
            background: {
                type: 'mountain',
                timeOfDay: 'sunset'
            }
        };
    }
}
