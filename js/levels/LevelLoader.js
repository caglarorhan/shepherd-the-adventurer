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
                { x: 6 * ts, y: 16 * ts - 48, type: 'berry' },      // Ground level
                { x: 12 * ts, y: 12 * ts - 48, type: 'berry' },     // On platform
                { x: 22 * ts, y: 11 * ts - 48, type: 'herb' },      // On high platform
                { x: 30 * ts, y: 16 * ts - 48, type: 'berry' },     // Ground level
                { x: 17 * ts, y: 8 * ts - 48, type: 'golden-wool' } // On highest platform
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
        
        // Stepping stones in river 1 (larger - 2 tiles wide each)
        for (let x = 16; x <= 17; x++) data[17 * width + x] = 4;
        for (let x = 20; x <= 21; x++) data[17 * width + x] = 4;
        for (let x = 23; x <= 24; x++) data[17 * width + x] = 4;
        
        // Stepping stones in river 2 (larger - 2 tiles wide each)
        for (let x = 41; x <= 42; x++) data[17 * width + x] = 4;
        for (let x = 44; x <= 45; x++) data[17 * width + x] = 4;
        for (let x = 47; x <= 48; x++) data[17 * width + x] = 4;
        
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
                { x: 180, y: 18 * ts - 48, type: 'berry' },
                { x: 350, y: 18 * ts - 48, type: 'herb' },
                { x: 950, y: 18 * ts - 48, type: 'berry' },
                { x: 1100, y: 18 * ts - 48, type: 'berry' },
                { x: 1700, y: 18 * ts - 48, type: 'golden-wool' },
                { x: 1400, y: 14 * ts - 48, type: 'heart' }  // Heart on platform
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
                { x: 10 * ts, y: 20 * ts - 32 },     // Ground at start
                { x: 25 * ts, y: 18 * ts - 32 },    // First hill (groundY=18)
                { x: 55 * ts, y: 19 * ts - 32 },    // Valley (groundY=19)
                { x: 65 * ts, y: 17 * ts - 32 }     // Second hill (groundY=17)
            ],
            enemies: [
                { type: 'wolf', x: 15 * ts, y: 20 * ts - 48, patrolRange: 200 },
                { type: 'boar', x: 45 * ts, y: 20 * ts - 48, patrolRange: 150 }
            ],
            collectibles: [
                { x: 5 * ts, y: 20 * ts - 48, type: 'berry' },
                { x: 14 * ts, y: 15 * ts - 48, type: 'herb' },    // On platform
                { x: 30 * ts, y: 18 * ts - 48, type: 'berry' },   // On hill
                { x: 45 * ts, y: 13 * ts - 48, type: 'herb' },    // On high platform
                { x: 60 * ts, y: 19 * ts - 48, type: 'berry' },
                { x: 74 * ts, y: 14 * ts - 48, type: 'golden-wool' },  // On end platform
                { x: 50 * ts, y: 20 * ts - 48, type: 'heart' }
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
                { x: 10 * ts, y: 22 * ts - 32 },     // Start area (groundY=22)
                { x: 20 * ts, y: 20 * ts - 32 },    // First dip (groundY=20)
                { x: 50 * ts, y: 21 * ts - 32 },    // Middle area (groundY=21)
                { x: 65 * ts, y: 19 * ts - 32 },    // Hill (groundY=19)
                { x: 80 * ts, y: 17 * ts - 32 }     // End hill (groundY=17)
            ],
            enemies: [
                { type: 'wolf', x: 15 * ts, y: 22 * ts - 48, patrolRange: 180 },
                { type: 'wolf', x: 40 * ts, y: 22 * ts - 48, patrolRange: 200 },
                { type: 'boar', x: 60 * ts, y: 19 * ts - 48, patrolRange: 150 }
            ],
            collectibles: [
                { x: 5 * ts, y: 22 * ts - 48, type: 'berry' },
                { x: 10 * ts, y: 17 * ts - 48, type: 'herb' },      // On platform
                { x: 23 * ts, y: 15 * ts - 48, type: 'berry' },     // On platform
                { x: 37 * ts, y: 14 * ts - 48, type: 'herb' },      // On platform
                { x: 53 * ts, y: 16 * ts - 48, type: 'berry' },     // On platform
                { x: 68 * ts, y: 13 * ts - 48, type: 'golden-wool' }, // On platform
                { x: 84 * ts, y: 12 * ts - 48, type: 'golden-wool' }, // On end platform
                { x: 45 * ts, y: 22 * ts - 48, type: 'heart' }
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
                { x: 8 * ts, y: 24 * ts - 32 },      // Start (groundY=24)
                { x: 15 * ts, y: 23 * ts - 32 },    // First slope (groundY=23)
                { x: 28 * ts, y: 21 * ts - 32 },    // Second tier (groundY=21)
                { x: 45 * ts, y: 19 * ts - 32 },    // Third tier (groundY=19)
                { x: 60 * ts, y: 17 * ts - 32 },    // Fourth tier (groundY=17)
                { x: 85 * ts, y: 13 * ts - 32 }     // Peak (groundY=13)
            ],
            enemies: [
                { type: 'wolf', x: 12 * ts, y: 24 * ts - 48, patrolRange: 200 },
                { type: 'wolf', x: 35 * ts, y: 21 * ts - 48, patrolRange: 180 },
                { type: 'boar', x: 55 * ts, y: 19 * ts - 48, patrolRange: 200 },
                { type: 'wolf', x: 75 * ts, y: 15 * ts - 48, patrolRange: 150 }
            ],
            collectibles: [
                { x: 5 * ts, y: 24 * ts - 48, type: 'berry' },
                { x: 18 * ts, y: 23 * ts - 48, type: 'herb' },
                { x: 27 * ts, y: 18 * ts - 48, type: 'berry' },   // On ledge
                { x: 42 * ts, y: 15 * ts - 48, type: 'herb' },    // On ledge
                { x: 58 * ts, y: 13 * ts - 48, type: 'berry' },   // On ledge
                { x: 72 * ts, y: 11 * ts - 48, type: 'herb' },    // On ledge
                { x: 50 * ts, y: 19 * ts - 48, type: 'golden-wool' },
                { x: 70 * ts, y: 15 * ts - 48, type: 'golden-wool' },
                { x: 90 * ts, y: 9 * ts - 48, type: 'golden-wool' },  // On peak ledge
                { x: 30 * ts, y: 21 * ts - 48, type: 'heart' },
                { x: 80 * ts, y: 13 * ts - 48, type: 'heart' }
            ],
            background: {
                type: 'mountain',
                timeOfDay: 'sunset'
            }
        };
    }
}
