/**
 * Audio Manager
 * ==============
 * Handles music and sound effects using Web Audio API
 */

export class AudioManager {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        
        this.currentMusic = null;
        this.musicVolume = 0.7;
        this.sfxVolume = 0.8;
        this.isMuted = false;
        
        this.sounds = new Map();
        this.musicTracks = new Map();
    }
    
    /**
     * Initialize audio context
     */
    init() {
        // Create audio context on first user interaction
        const initAudio = () => {
            if (this.context) return;
            
            try {
                this.context = new (window.AudioContext || window.webkitAudioContext)();
                
                // Create gain nodes
                this.masterGain = this.context.createGain();
                this.musicGain = this.context.createGain();
                this.sfxGain = this.context.createGain();
                
                // Connect nodes
                this.musicGain.connect(this.masterGain);
                this.sfxGain.connect(this.masterGain);
                this.masterGain.connect(this.context.destination);
                
                // Set initial volumes
                this.musicGain.gain.value = this.musicVolume;
                this.sfxGain.gain.value = this.sfxVolume;
                
                console.log('🔊 Audio context initialized');
            } catch (e) {
                console.warn('⚠️ Web Audio API not supported');
            }
            
            // Remove listener after init
            document.removeEventListener('click', initAudio);
            document.removeEventListener('keydown', initAudio);
            document.removeEventListener('touchstart', initAudio);
        };
        
        // Init on user interaction
        document.addEventListener('click', initAudio);
        document.addEventListener('keydown', initAudio);
        document.addEventListener('touchstart', initAudio);
    }
    
    /**
     * Load an audio file
     */
    async loadSound(key, url) {
        if (!this.context) return;
        
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
            this.sounds.set(key, audioBuffer);
            return audioBuffer;
        } catch (e) {
            console.warn(`Failed to load sound: ${url}`);
            return null;
        }
    }
    
    /**
     * Play a sound effect
     */
    playSFX(key, volume = 1, pitch = 1) {
        if (!this.context || this.isMuted) return;
        
        const buffer = this.sounds.get(key);
        if (!buffer) {
            // Play fallback beep for missing sounds
            this.playBeep(200, 0.1, volume * 0.3);
            return;
        }
        
        const source = this.context.createBufferSource();
        const gainNode = this.context.createGain();
        
        source.buffer = buffer;
        source.playbackRate.value = pitch;
        gainNode.gain.value = volume;
        
        source.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        source.start();
    }
    
    /**
     * Play a simple beep (for placeholder sounds)
     */
    playBeep(frequency = 440, duration = 0.1, volume = 0.3) {
        if (!this.context || this.isMuted) return;
        
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        
        gainNode.gain.setValueAtTime(volume, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        oscillator.start();
        oscillator.stop(this.context.currentTime + duration);
    }
    
    /**
     * Play jump sound
     */
    playJump() {
        this.playBeep(300, 0.1, 0.2);
        setTimeout(() => this.playBeep(400, 0.1, 0.15), 50);
    }
    
    /**
     * Play land sound
     */
    playLand() {
        this.playBeep(150, 0.15, 0.25);
    }
    
    /**
     * Play collect sound
     */
    playCollect() {
        this.playBeep(523, 0.1, 0.3);
        setTimeout(() => this.playBeep(659, 0.1, 0.25), 100);
        setTimeout(() => this.playBeep(784, 0.15, 0.2), 200);
    }
    
    /**
     * Play rescue sound
     */
    playRescue() {
        const notes = [523, 587, 659, 784, 880];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playBeep(freq, 0.15, 0.3), i * 100);
        });
    }
    
    /**
     * Play hurt sound
     */
    playHurt() {
        this.playBeep(200, 0.2, 0.4);
        setTimeout(() => this.playBeep(150, 0.3, 0.3), 100);
    }
    
    /**
     * Play music track
     */
    playMusic(key, loop = true) {
        // For now, just log - actual implementation would use loaded audio
        console.log(`🎵 Playing music: ${key}`);
    }
    
    /**
     * Stop current music
     */
    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.stop();
            this.currentMusic = null;
        }
    }
    
    /**
     * Set music volume (0-1)
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.musicGain) {
            this.musicGain.gain.value = this.musicVolume;
        }
    }
    
    /**
     * Set SFX volume (0-1)
     */
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        if (this.sfxGain) {
            this.sfxGain.gain.value = this.sfxVolume;
        }
    }
    
    /**
     * Toggle mute
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : 1;
        }
        return this.isMuted;
    }
    
    /**
     * Resume audio context (required after user interaction)
     */
    resume() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    }
}
