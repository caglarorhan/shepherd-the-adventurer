/**
 * Input Manager
 * ==============
 * Handles keyboard, mouse, and touch input
 */

export class InputManager {
    constructor() {
        // Key states
        this.keys = {};
        this.keysPressed = {};
        this.keysReleased = {};
        
        // Mouse state
        this.mouse = {
            x: 0,
            y: 0,
            buttons: {},
            buttonsPressed: {},
            buttonsReleased: {}
        };
        
        // Touch state
        this.touches = [];
        this.touchButtons = {};
        this.touchButtonsPressed = {};
        this.touchButtonsReleased = {};
        this.jumpTouchQueued = false; // Queue for touch jump to ensure it's not missed
        
        // Key bindings
        this.bindings = {
            left: ['ArrowLeft', 'KeyA'],
            right: ['ArrowRight', 'KeyD'],
            up: ['ArrowUp', 'KeyW'],
            down: ['ArrowDown', 'KeyS'],
            jump: ['Space', 'ArrowUp', 'KeyW'],
            action: ['KeyE', 'Enter'],
            crouch: ['ArrowDown', 'KeyS', 'ControlLeft'],
            pause: ['Escape', 'KeyP'],
            debug: ['F3']
        };
        
        // Touch control visibility
        this.touchControlsEnabled = true;
        
        // Bound event handlers (for removal)
        this.boundHandlers = {};
    }
    
    /**
     * Initialize input listeners
     */
    init() {
        // Keyboard events
        this.boundHandlers.keydown = (e) => this.onKeyDown(e);
        this.boundHandlers.keyup = (e) => this.onKeyUp(e);
        window.addEventListener('keydown', this.boundHandlers.keydown);
        window.addEventListener('keyup', this.boundHandlers.keyup);
        
        // Mouse events
        this.boundHandlers.mousemove = (e) => this.onMouseMove(e);
        this.boundHandlers.mousedown = (e) => this.onMouseDown(e);
        this.boundHandlers.mouseup = (e) => this.onMouseUp(e);
        window.addEventListener('mousemove', this.boundHandlers.mousemove);
        window.addEventListener('mousedown', this.boundHandlers.mousedown);
        window.addEventListener('mouseup', this.boundHandlers.mouseup);
        
        // Touch events
        this.boundHandlers.touchstart = (e) => this.onTouchStart(e);
        this.boundHandlers.touchmove = (e) => this.onTouchMove(e);
        this.boundHandlers.touchend = (e) => this.onTouchEnd(e);
        window.addEventListener('touchstart', this.boundHandlers.touchstart, { passive: false });
        window.addEventListener('touchmove', this.boundHandlers.touchmove, { passive: false });
        window.addEventListener('touchend', this.boundHandlers.touchend, { passive: false });
        
        // Setup touch controls
        this.setupTouchControls();
        
        // Detect touch device and show controls
        this.detectTouchDevice();
        
        // Prevent context menu on right-click
        window.addEventListener('contextmenu', (e) => {
            const canvas = document.getElementById('game-canvas');
            if (e.target === canvas) {
                e.preventDefault();
            }
        });
        
        console.log('⌨️ Input manager initialized');
    }
    
    /**
     * Detect if device supports touch and show controls
     */
    detectTouchDevice() {
        const isTouchDevice = ('ontouchstart' in window) || 
                              (navigator.maxTouchPoints > 0) ||
                              (navigator.msMaxTouchPoints > 0);
        
        if (isTouchDevice && this.touchControlsEnabled) {
            this.showTouchControls();
        }
    }
    
    /**
     * Show touch controls
     */
    showTouchControls() {
        const touchControls = document.getElementById('touch-controls');
        if (touchControls) {
            touchControls.classList.add('active');
        }
    }
    
    /**
     * Hide touch controls
     */
    hideTouchControls() {
        const touchControls = document.getElementById('touch-controls');
        if (touchControls) {
            touchControls.classList.remove('active');
        }
    }
    
    /**
     * Toggle touch controls
     */
    setTouchControlsEnabled(enabled) {
        this.touchControlsEnabled = enabled;
        if (enabled) {
            this.detectTouchDevice();
        } else {
            this.hideTouchControls();
        }
    }
    
    /**
     * Setup touch control buttons
     */
    setupTouchControls() {
        const touchButtons = {
            'btn-touch-left': 'left',
            'btn-touch-right': 'right',
            'btn-touch-jump': 'jump',
            'btn-touch-action': 'action'
        };
        
        // Track jump specifically for better responsiveness
        this.jumpTouchActive = false;
        
        Object.entries(touchButtons).forEach(([id, action]) => {
            const btn = document.getElementById(id);
            if (btn) {
                // Handle touch start
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Set pressed flag (will be read next frame)
                    this.touchButtonsPressed[action] = true;
                    this.touchButtons[action] = true;
                    
                    // Special handling for jump - queue it
                    if (action === 'jump') {
                        this.jumpTouchQueued = true;
                    }
                    
                    btn.classList.add('pressed');
                    console.log(`Touch ${action} pressed`);
                }, { passive: false });
                
                // Handle touch end
                btn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.touchButtons[action] = false;
                    this.touchButtonsReleased[action] = true;
                    btn.classList.remove('pressed');
                }, { passive: false });
                
                // Handle touch cancel
                btn.addEventListener('touchcancel', (e) => {
                    e.preventDefault();
                    this.touchButtons[action] = false;
                    btn.classList.remove('pressed');
                }, { passive: false });
                
                // Handle touch leave (finger moves off button)
                btn.addEventListener('touchmove', (e) => {
                    const touch = e.touches[0];
                    if (!touch) return;
                    const rect = btn.getBoundingClientRect();
                    const isInside = touch.clientX >= rect.left && 
                                    touch.clientX <= rect.right &&
                                    touch.clientY >= rect.top && 
                                    touch.clientY <= rect.bottom;
                    
                    if (!isInside && this.touchButtons[action]) {
                        this.touchButtons[action] = false;
                        btn.classList.remove('pressed');
                    } else if (isInside && !this.touchButtons[action]) {
                        this.touchButtons[action] = true;
                        btn.classList.add('pressed');
                    }
                }, { passive: false });
                
                // Also support mouse for testing on desktop
                btn.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    this.touchButtonsPressed[action] = true;
                    this.touchButtons[action] = true;
                    if (action === 'jump') {
                        this.jumpTouchQueued = true;
                    }
                    btn.classList.add('pressed');
                });
                
                btn.addEventListener('mouseup', (e) => {
                    e.preventDefault();
                    this.touchButtons[action] = false;
                    this.touchButtonsReleased[action] = true;
                    btn.classList.remove('pressed');
                });
                
                btn.addEventListener('mouseleave', (e) => {
                    if (this.touchButtons[action]) {
                        this.touchButtons[action] = false;
                        btn.classList.remove('pressed');
                    }
                });
            } else {
                console.warn(`Touch button not found: ${id}`);
            }
        });
    }
    
    /**
     * Update input state (called each frame)
     */
    update() {
        // Clear single-frame states
        this.keysPressed = {};
        this.keysReleased = {};
        this.mouse.buttonsPressed = {};
        this.mouse.buttonsReleased = {};
        this.touchButtonsPressed = {};
        this.touchButtonsReleased = {};
    }
    
    /**
     * Handle key down
     */
    onKeyDown(e) {
        const code = e.code;
        
        // Prevent default for game keys
        if (this.isGameKey(code)) {
            e.preventDefault();
        }
        
        // Track pressed (first frame only)
        if (!this.keys[code]) {
            this.keysPressed[code] = true;
        }
        
        this.keys[code] = true;
    }
    
    /**
     * Handle key up
     */
    onKeyUp(e) {
        const code = e.code;
        this.keys[code] = false;
        this.keysReleased[code] = true;
    }
    
    /**
     * Check if key is a game key
     */
    isGameKey(code) {
        for (const binding of Object.values(this.bindings)) {
            if (binding.includes(code)) return true;
        }
        return false;
    }
    
    /**
     * Handle mouse move
     */
    onMouseMove(e) {
        const canvas = document.getElementById('game-canvas');
        const rect = canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
    }
    
    /**
     * Handle mouse down
     */
    onMouseDown(e) {
        if (!this.mouse.buttons[e.button]) {
            this.mouse.buttonsPressed[e.button] = true;
        }
        this.mouse.buttons[e.button] = true;
    }
    
    /**
     * Handle mouse up
     */
    onMouseUp(e) {
        this.mouse.buttons[e.button] = false;
        this.mouse.buttonsReleased[e.button] = true;
    }
    
    /**
     * Handle touch start
     */
    onTouchStart(e) {
        this.touches = Array.from(e.touches).map(t => ({
            id: t.identifier,
            x: t.clientX,
            y: t.clientY
        }));
    }
    
    /**
     * Handle touch move
     */
    onTouchMove(e) {
        this.touches = Array.from(e.touches).map(t => ({
            id: t.identifier,
            x: t.clientX,
            y: t.clientY
        }));
    }
    
    /**
     * Handle touch end
     */
    onTouchEnd(e) {
        this.touches = Array.from(e.touches).map(t => ({
            id: t.identifier,
            x: t.clientX,
            y: t.clientY
        }));
    }
    
    /**
     * Check if an action is held
     */
    isDown(action) {
        const keys = this.bindings[action];
        if (!keys) return false;
        
        // Check keyboard
        for (const key of keys) {
            if (this.keys[key]) return true;
        }
        
        // Check touch
        if (this.touchButtons[action]) return true;
        
        return false;
    }
    
    /**
     * Check if an action was just pressed
     */
    isPressed(action) {
        const keys = this.bindings[action];
        if (!keys) return false;
        
        // Check keyboard
        for (const key of keys) {
            if (this.keysPressed[key]) return true;
        }
        
        // Check touch pressed
        if (this.touchButtonsPressed[action]) return true;
        
        // Check queued jump (more reliable for touch)
        if (action === 'jump' && this.jumpTouchQueued) {
            this.jumpTouchQueued = false; // Consume the queued jump
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if an action was just released
     */
    isReleased(action) {
        const keys = this.bindings[action];
        if (!keys) return false;
        
        // Check keyboard
        for (const key of keys) {
            if (this.keysReleased[key]) return true;
        }
        
        // Check touch
        if (this.touchButtonsReleased[action]) return true;
        
        return false;
    }
    
    /**
     * Check if a specific key is held
     */
    isKeyDown(code) {
        return !!this.keys[code];
    }
    
    /**
     * Check if a specific key was just pressed
     */
    isKeyPressed(code) {
        return !!this.keysPressed[code];
    }
    
    /**
     * Get horizontal axis (-1, 0, or 1)
     */
    getHorizontalAxis() {
        let axis = 0;
        if (this.isDown('left')) axis -= 1;
        if (this.isDown('right')) axis += 1;
        return axis;
    }
    
    /**
     * Get vertical axis (-1, 0, or 1)
     */
    getVerticalAxis() {
        let axis = 0;
        if (this.isDown('up')) axis -= 1;
        if (this.isDown('down')) axis += 1;
        return axis;
    }
    
    /**
     * Clean up event listeners
     */
    destroy() {
        window.removeEventListener('keydown', this.boundHandlers.keydown);
        window.removeEventListener('keyup', this.boundHandlers.keyup);
        window.removeEventListener('mousemove', this.boundHandlers.mousemove);
        window.removeEventListener('mousedown', this.boundHandlers.mousedown);
        window.removeEventListener('mouseup', this.boundHandlers.mouseup);
        window.removeEventListener('touchstart', this.boundHandlers.touchstart);
        window.removeEventListener('touchmove', this.boundHandlers.touchmove);
        window.removeEventListener('touchend', this.boundHandlers.touchend);
    }
}
