# 🌲 Shepherd's Forest Rescue 🐑

A 2D side-scrolling platformer game built with vanilla JavaScript, HTML5 Canvas, and CSS3.

## 🎮 About

Shepherd's Forest Rescue is a browser-based adventure where players guide a young shepherd through a mysterious forest to find and rescue sheep that have wandered too far from the pasture. The forest is filled with natural hazards, wild animals, and environmental puzzles.

## 🚀 Quick Start

1. Open `index.html` in a modern web browser
2. Click "Start Adventure" to begin
3. Use arrow keys or WASD to move
4. Press Space to jump
5. Press E to interact with sheep

**For local development with a server:**
```bash
# Using Python
python -m http.server 8080

# Using Node.js
npx serve

# Using PHP
php -S localhost:8080
```

Then open `http://localhost:8080` in your browser.

## 🎯 Controls

| Action | Keyboard | Touch |
|--------|----------|-------|
| Move Left | ← / A | Left Button |
| Move Right | → / D | Right Button |
| Jump | Space / ↑ / W | Jump Button |
| Crouch | ↓ / S / Ctrl | - |
| Interact | E / Enter | Action Button |
| Pause | Escape / P | Pause Button |

## 📁 Project Structure

```
shepherd-the-adventurer/
├── index.html              # Main HTML file
├── css/
│   ├── styles.css          # Main styles
│   └── ui.css              # UI component styles
├── js/
│   ├── main.js             # Entry point
│   ├── engine/
│   │   ├── Game.js         # Main game class
│   │   ├── AssetLoader.js  # Asset loading
│   │   ├── InputManager.js # Input handling
│   │   ├── AudioManager.js # Audio system
│   │   ├── SceneManager.js # Scene management
│   │   ├── Renderer.js     # Rendering
│   │   ├── Physics.js      # Physics/collision
│   │   ├── Camera.js       # Camera system
│   │   └── GameState.js    # Save/load state
│   ├── entities/
│   │   ├── Entity.js       # Base entity class
│   │   ├── Player.js       # Player (Shepherd)
│   │   ├── Sheep.js        # Rescuable sheep
│   │   ├── Collectible.js  # Collectible items
│   │   └── Enemy.js        # Enemies (Wolf, Boar)
│   ├── scenes/
│   │   └── GameScene.js    # Main game scene
│   ├── levels/
│   │   └── LevelLoader.js  # Level definitions
│   └── ui/
│       └── UIManager.js    # UI handling
└── assets/
    ├── sprites/            # Character sprites
    ├── tilesets/           # Tileset images
    ├── backgrounds/        # Background layers
    └── audio/              # Music & SFX
```

## 🗺️ Levels

1. **Forest Entrance** - Introduction to basic mechanics
2. **River Crossing** - Platforming over water
3. **Hazard Path** - Timing-based obstacles
4. **Deep Woods** - Stealth and multiple enemies
5. **Mountain Clearing** - Final challenge

## ✨ Features

- ✅ 2D side-scrolling platformer
- ✅ 5 unique levels
- ✅ Player movement (run, jump, crouch)
- ✅ Sheep rescue mechanics
- ✅ Collectible items (berries, herbs, golden wool)
- ✅ Enemy AI (wolves, boars)
- ✅ Parallax backgrounds
- ✅ Camera following system
- ✅ Save/load progress
- ✅ Touch controls for mobile
- ✅ Procedural placeholder graphics

## 🎨 Adding Custom Assets

The game uses placeholder graphics by default. To add real sprites:

1. Place sprite sheets in appropriate `assets/sprites/` folders
2. Update `Game.js` to load the assets
3. Update entity render methods to use sprites

### Recommended Sprite Dimensions

| Asset | Size | Frames |
|-------|------|--------|
| Shepherd | 48×64 | Idle: 4, Run: 6, Jump: 2 |
| Sheep | 40×32 | Idle: 2, Follow: 4 |
| Wolf | 56×40 | Patrol: 4, Chase: 6 |
| Boar | 52×36 | Patrol: 4, Charge: 4 |
| Collectibles | 24×24 | 1-4 frames |
| Tiles | 32×32 | - |

## 🔧 Configuration

Edit values in respective files:

- **Physics**: `js/engine/Physics.js` - gravity, speed limits
- **Player**: `js/entities/Player.js` - movement speed, jump force
- **Levels**: `js/levels/LevelLoader.js` - level layouts
- **Camera**: `js/engine/Camera.js` - follow smoothing, dead zones

## 🌐 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 📜 License

This project is open source and available under the MIT License.

## 🙏 Credits

Built as a learning project for HTML5 game development.

---

**Happy Shepherding! 🐑🌲**
