// Game Configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// Game Variables
let player;
let cursors;
let bullets;
let enemies;
let powerUps;
let score = 0;
let level = 1;
let highScore = 0;
let isPaused = false;
let enemySpawnTimer;
let powerUpSpawnTimer;
let difficultyTimer;

// New features
let combo = 0;
let comboTimer = null;
let killStreak = 0;
let lastKillTime = 0;

// Player Stats
let playerHealth = 100;
let maxHealth = 100;
let attackSpeed = 300;
let bulletDamage = 10;
let burstCount = 1;
let moveSpeed = 300;
let lastFired = 0;

// Enemy Stats
let enemyHealth = 20;
let enemySpeed = 100;
let enemySpawnRate = 2000;

// Keys
let pauseKey;
let spaceKey;

function preload() {
    // Graphics will be created in create function
}

function create() {
    // Load high score
    highScore = parseInt(localStorage.getItem('spaceShooterHighScore')) || 0;
    updateHUD();

    // Create space background
    createSpaceBackground.call(this);

    // Create player
    createPlayer.call(this);

    // Create groups
    bullets = this.physics.add.group({
        classType: Bullet,
        maxSize: 50,
        runChildUpdate: true
    });

    enemies = this.physics.add.group({
        runChildUpdate: true
    });

    powerUps = this.physics.add.group({
        runChildUpdate: true
    });

    // Input controls
    cursors = this.input.keyboard.createCursorKeys();
    spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);

    // Pause key event
    pauseKey.on('down', () => {
        togglePause.call(this);
    });

    // Collisions
    this.physics.add.overlap(bullets, enemies, bulletHitEnemy, null, this);
    this.physics.add.overlap(player, enemies, playerHitEnemy, null, this);
    this.physics.add.overlap(player, powerUps, collectPowerUp, null, this);

    // Spawn enemies
    enemySpawnTimer = this.time.addEvent({
        delay: enemySpawnRate,
        callback: spawnEnemy,
        callbackScope: this,
        loop: true
    });

    // Spawn power-ups
    powerUpSpawnTimer = this.time.addEvent({
        delay: 10000,
        callback: spawnPowerUp,
        callbackScope: this,
        loop: true
    });

    // Difficulty increase
    difficultyTimer = this.time.addEvent({
        delay: 30000,
        callback: increaseDifficulty,
        callbackScope: this,
        loop: true
    });

    // Display intro
    showIntro.call(this);
}

function update(time, delta) {
    if (isPaused) return;

    // Player movement
    if (cursors.left.isDown) {
        player.setVelocityX(-moveSpeed);
    } else if (cursors.right.isDown) {
        player.setVelocityX(moveSpeed);
    } else {
        player.setVelocityX(0);
    }

    if (cursors.up.isDown) {
        player.setVelocityY(-moveSpeed);
    } else if (cursors.down.isDown) {
        player.setVelocityY(moveSpeed);
    } else {
        player.setVelocityY(0);
    }

    // Keep player in bounds
    player.x = Phaser.Math.Clamp(player.x, 20, 780);
    player.y = Phaser.Math.Clamp(player.y, 20, 580);

    // Shooting
    if (spaceKey.isDown && time > lastFired) {
        shootBullet.call(this);
        lastFired = time + attackSpeed;
    }

    // Clean up off-screen objects
    bullets.children.entries.forEach(bullet => {
        if (bullet.y < -10) bullet.destroy();
    });

    enemies.children.entries.forEach(enemy => {
        if (enemy.y > 610) enemy.destroy();
    });

    powerUps.children.entries.forEach(powerUp => {
        if (powerUp.y > 610) powerUp.destroy();
    });
}

function createSpaceBackground() {
    // Create bullet texture first for particles
    const bulletGraphic = this.add.graphics();
    bulletGraphic.fillStyle(0xffffff, 1);
    bulletGraphic.fillCircle(2, 2, 2);
    bulletGraphic.generateTexture('particle', 4, 4);
    bulletGraphic.destroy();

    // Create subtle animated starfield - reduced particles
    const stars = this.add.particles(0, 0, 'particle', {
        x: { min: 0, max: 800 },
        y: { min: -10, max: 0 },
        quantity: 1,
        speedY: { min: 30, max: 80 },
        scale: { min: 0.2, max: 0.4 },
        alpha: { min: 0.2, max: 0.6 },
        tint: [0x94a3b8, 0x64748b],
        frequency: 150,
        lifespan: 8000
    });
}

function createPlayer() {
    // Create simple modern player ship
    const ship = this.add.graphics();
    
    // Main hull - clean design
    ship.fillStyle(0x3b82f6, 1);
    ship.fillTriangle(16, 2, 6, 30, 26, 30);
    
    // Wings
    ship.fillStyle(0x1e40af, 1);
    ship.fillTriangle(2, 28, 6, 18, 6, 30);
    ship.fillTriangle(30, 28, 26, 18, 26, 30);
    
    // Cockpit
    ship.fillStyle(0x60a5fa, 1);
    ship.fillCircle(16, 16, 4);
    
    // Engine glow - subtle
    ship.fillStyle(0x06b6d4, 0.6);
    ship.fillCircle(11, 28, 2);
    ship.fillCircle(21, 28, 2);
    
    ship.generateTexture('player', 32, 32);
    ship.destroy();

    player = this.physics.add.sprite(400, 500, 'player');
    player.setCollideWorldBounds(true);
    
    // Add subtle engine trail
    const trail = this.add.particles(player.x, player.y, 'particle', {
        speed: 5,
        scale: { start: 0.4, end: 0 },
        tint: [0x06b6d4, 0x0891b2],
        alpha: { start: 0.5, end: 0 },
        lifespan: 200,
        frequency: 50
    });
    trail.startFollow(player, 0, 10);
}

class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bullet');
    }

    fire(x, y) {
        this.body.reset(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.setVelocityY(-400);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (this.y <= -10) {
            this.setActive(false);
            this.setVisible(false);
        }
    }
}

function shootBullet() {
    // Create bullet texture if not exists
    if (!this.textures.exists('bullet')) {
        const bulletGraphic = this.add.graphics();
        bulletGraphic.fillStyle(0x22d3ee, 1);
        bulletGraphic.fillRect(1, 0, 2, 10);
        bulletGraphic.fillStyle(0x06b6d4, 1);
        bulletGraphic.fillRect(0, 2, 4, 6);
        bulletGraphic.generateTexture('bullet', 4, 10);
        bulletGraphic.destroy();
    }

    // Fire burst shots
    for (let i = 0; i < burstCount; i++) {
        this.time.delayedCall(i * 50, () => {
            const offset = (i - (burstCount - 1) / 2) * 8;
            const bullet = bullets.get(player.x + offset, player.y - 15);
            if (bullet) {
                bullet.fire(player.x + offset, player.y - 15);
                
                // Minimal bullet trail - no particles to save performance
                // Just use bullet sprite itself
            }
        });
    }
}

function spawnEnemy() {
    if (isPaused) return;

    // Create enemy texture
    if (!this.textures.exists('enemy')) {
        const enemyGraphic = this.add.graphics();
        
        // Simple enemy design
        enemyGraphic.fillStyle(0xef4444, 1);
        enemyGraphic.fillTriangle(12, 22, 2, 2, 22, 2);
        
        enemyGraphic.fillStyle(0xb91c1c, 1);
        enemyGraphic.fillTriangle(6, 8, 2, 2, 12, 2);
        enemyGraphic.fillTriangle(18, 8, 22, 2, 12, 2);
        
        enemyGraphic.fillStyle(0xfca5a5, 1);
        enemyGraphic.fillCircle(12, 12, 3);
        
        enemyGraphic.generateTexture('enemy', 24, 24);
        enemyGraphic.destroy();
    }

    const x = Phaser.Math.Between(20, 780);
    const enemy = enemies.create(x, -20, 'enemy');
    enemy.setVelocityY(enemySpeed);
    enemy.health = enemyHealth;
}

function spawnPowerUp() {
    if (isPaused) return;

    const powerUpTypes = ['health', 'attackSpeed', 'burstDamage', 'shield'];
    const type = Phaser.Math.RND.pick(powerUpTypes);

    const colors = {
        'health': 0x10b981,
        'attackSpeed': 0xfbbf24,
        'burstDamage': 0xa855f7,
        'shield': 0x06b6d4
    };

    const textureName = 'powerup_' + type;
    if (!this.textures.exists(textureName)) {
        const powerUpGraphic = this.add.graphics();
        
        // Simple clean design
        powerUpGraphic.fillStyle(colors[type], 1);
        powerUpGraphic.fillCircle(12, 12, 8);
        
        powerUpGraphic.fillStyle(0xffffff, 0.8);
        powerUpGraphic.fillCircle(12, 12, 4);
        
        powerUpGraphic.lineStyle(2, 0xffffff, 0.8);
        powerUpGraphic.strokeCircle(12, 12, 8);
        
        powerUpGraphic.generateTexture(textureName, 24, 24);
        powerUpGraphic.destroy();
    }

    const x = Phaser.Math.Between(20, 780);
    const powerUp = powerUps.create(x, -20, textureName);
    powerUp.setVelocityY(100);
    powerUp.powerType = type;
}

function bulletHitEnemy(bullet, enemy) {
    createExplosion.call(this, enemy.x, enemy.y, 0xef4444);

    bullet.destroy();
    enemy.health -= bulletDamage;

    // Show damage text
    const damageText = this.add.text(enemy.x, enemy.y, `-${bulletDamage}`, {
        fontSize: '14px',
        fill: '#fbbf24',
        fontFamily: 'Inter, Arial',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
        targets: damageText,
        y: enemy.y - 30,
        alpha: 0,
        duration: 400,
        onComplete: () => damageText.destroy()
    });

    if (enemy.health <= 0) {
        enemy.destroy();
        
        // Combo system
        const currentTime = Date.now();
        if (currentTime - lastKillTime < 2000) {
            combo++;
            killStreak++;
        } else {
            combo = 1;
            killStreak = 1;
        }
        lastKillTime = currentTime;
        
        const comboMultiplier = Math.min(Math.floor(combo / 3) + 1, 5);
        const scoreGain = 10 * level * comboMultiplier;
        score += scoreGain;
        
        updateCombo();
        updateScore();
        
        // Reset combo after delay
        if (comboTimer) clearTimeout(comboTimer);
        comboTimer = setTimeout(() => {
            combo = 0;
            killStreak = 0;
            updateCombo();
        }, 2000);
    }
}

function playerHitEnemy(player, enemy) {
    createExplosion.call(this, enemy.x, enemy.y, 0xff0000);
    enemy.destroy();
    
    playerHealth -= 20;
    updateHealth();

    // Flash player
    this.tweens.add({
        targets: player,
        alpha: 0.3,
        duration: 100,
        yoyo: true,
        repeat: 3
    });

    if (playerHealth <= 0) {
        gameOver.call(this);
    }
}

function collectPowerUp(player, powerUp) {
    createExplosion.call(this, powerUp.x, powerUp.y, 0x10b981);

    switch(powerUp.powerType) {
        case 'health':
            playerHealth = Math.min(playerHealth + 30, maxHealth);
            showPowerUpText.call(this, player.x, player.y, '+30 HP', 0x10b981);
            break;
        case 'attackSpeed':
            attackSpeed = Math.max(100, attackSpeed - 50);
            showPowerUpText.call(this, player.x, player.y, 'Fire Rate +', 0xfbbf24);
            showPowerUpIndicator('powerup-speed');
            break;
        case 'burstDamage':
            burstCount = Math.min(5, burstCount + 1);
            bulletDamage += 5;
            showPowerUpText.call(this, player.x, player.y, 'Burst +', 0xa855f7);
            showPowerUpIndicator('powerup-burst');
            break;
        case 'shield':
            maxHealth += 20;
            playerHealth = Math.min(playerHealth + 20, maxHealth);
            showPowerUpText.call(this, player.x, player.y, 'Shield +', 0x06b6d4);
            showPowerUpIndicator('powerup-shield');
            break;
    }

    updateHealth();
    powerUp.destroy();
}

function showPowerUpText(x, y, text, color) {
    const powerUpText = this.add.text(x, y, text, {
        fontSize: '18px',
        fill: '#' + color.toString(16).padStart(6, '0'),
        fontFamily: 'Inter, Arial',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
        targets: powerUpText,
        y: y - 40,
        alpha: 0,
        duration: 800,
        ease: 'Power2',
        onComplete: () => powerUpText.destroy()
    });
}

function createExplosion(x, y, color) {
    // Lightweight single-layer explosion
    const particles = this.add.particles(x, y, 'particle', {
        speed: { min: 50, max: 150 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 300,
        quantity: 8,
        tint: color
    });

    // Quick flash
    const flash = this.add.graphics();
    flash.fillStyle(color, 0.5);
    flash.fillCircle(x, y, 15);
    
    this.tweens.add({
        targets: flash,
        alpha: 0,
        scale: 1.5,
        duration: 150,
        onComplete: () => flash.destroy()
    });

    this.time.delayedCall(300, () => {
        particles.destroy();
    });
}

function increaseDifficulty() {
    level++;
    enemyHealth += 10;
    enemySpeed += 10;
    enemySpawnRate = Math.max(500, enemySpawnRate - 200);
    
    // Update spawn timer
    enemySpawnTimer.destroy();
    enemySpawnTimer = this.time.addEvent({
        delay: enemySpawnRate,
        callback: spawnEnemy,
        callbackScope: this,
        loop: true
    });

    // Clean level up message
    const levelText = this.add.text(400, 280, `LEVEL ${level}`, {
        fontSize: '56px',
        fill: '#3b82f6',
        fontFamily: 'Inter, Arial',
        fontStyle: '800'
    }).setOrigin(0.5);

    const subText = this.add.text(400, 340, 'Difficulty Increased', {
        fontSize: '18px',
        fill: '#94a3b8',
        fontFamily: 'Inter, Arial'
    }).setOrigin(0.5);

    this.tweens.add({
        targets: levelText,
        scale: { from: 0.5, to: 1 },
        alpha: { from: 0, to: 1 },
        duration: 300,
        ease: 'Back.out'
    });

    this.tweens.add({
        targets: [levelText, subText],
        alpha: 0,
        delay: 1500,
        duration: 500,
        onComplete: () => {
            levelText.destroy();
            subText.destroy();
        }
    });

    updateHUD();
}

function togglePause() {
    isPaused = !isPaused;

    if (isPaused) {
        this.physics.pause();
        
        const overlay = this.add.graphics();
        overlay.fillStyle(0x0f172a, 0.9);
        overlay.fillRect(0, 0, 800, 600);
        overlay.setName('pauseOverlay');
        
        const pauseText = this.add.text(400, 280, 'PAUSED', {
            fontSize: '48px',
            fill: '#3b82f6',
            align: 'center',
            fontFamily: 'Inter, Arial',
            fontStyle: '800'
        }).setOrigin(0.5);
        pauseText.setName('pauseText');
        
        const resumeText = this.add.text(400, 340, 'Press P to Resume', {
            fontSize: '16px',
            fill: '#94a3b8',
            align: 'center',
            fontFamily: 'Inter, Arial'
        }).setOrigin(0.5);
        resumeText.setName('resumeText');
    } else {
        this.physics.resume();
        const overlay = this.children.getByName('pauseOverlay');
        const pauseText = this.children.getByName('pauseText');
        const resumeText = this.children.getByName('resumeText');
        if (overlay) overlay.destroy();
        if (pauseText) pauseText.destroy();
        if (resumeText) resumeText.destroy();
    }
}

function gameOver() {
    isPaused = true;
    this.physics.pause();

    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('spaceShooterHighScore', highScore);
    }

    // Modern game over screen
    const overlay = this.add.graphics();
    overlay.fillStyle(0x0f172a, 0.95);
    overlay.fillRect(0, 0, 800, 600);
    
    const gameOverText = this.add.text(400, 180, 'GAME OVER', {
        fontSize: '56px',
        fill: '#ef4444',
        align: 'center',
        fontFamily: 'Inter, Arial',
        fontStyle: '800'
    }).setOrigin(0.5);

    const scoreText = this.add.text(400, 280, `Final Score\n${score}`, {
        fontSize: '28px',
        fill: '#3b82f6',
        align: 'center',
        fontFamily: 'Inter, Arial',
        fontStyle: '700'
    }).setOrigin(0.5);

    const highScoreText = this.add.text(400, 360, `High Score: ${highScore}`, {
        fontSize: '20px',
        fill: '#fbbf24',
        align: 'center',
        fontFamily: 'Inter, Arial'
    }).setOrigin(0.5);

    const restartText = this.add.text(400, 460, 'Press SPACE to Restart', {
        fontSize: '16px',
        fill: '#94a3b8',
        align: 'center',
        fontFamily: 'Inter, Arial'
    }).setOrigin(0.5);

    // Fade in animation
    this.tweens.add({
        targets: restartText,
        alpha: 0.5,
        duration: 800,
        yoyo: true,
        repeat: -1
    });

    gameOverText.setScale(0);
    this.tweens.add({
        targets: gameOverText,
        scale: 1,
        duration: 400,
        ease: 'Back.out'
    });

    spaceKey.once('down', () => {
        this.scene.restart();
        resetGame();
    });
}

function showIntro() {
    const title = this.add.text(400, 220, 'SPACE STRIKER', {
        fontSize: '48px',
        fill: '#3b82f6',
        align: 'center',
        fontFamily: 'Inter, Arial',
        fontStyle: '800'
    }).setOrigin(0.5);

    const controlsText = this.add.text(400, 340, 
        'Arrow Keys - Move\nSPACE - Shoot\nP - Pause\n\nPress SPACE to Start', 
        {
            fontSize: '16px',
            fill: '#94a3b8',
            align: 'center',
            fontFamily: 'Inter, Arial',
            lineSpacing: 8
        }
    ).setOrigin(0.5);

    spaceKey.once('down', () => {
        this.tweens.add({
            targets: [title, controlsText],
            alpha: 0,
            duration: 300,
            onComplete: () => {
                title.destroy();
                controlsText.destroy();
            }
        });
    });
}

function resetGame() {
    score = 0;
    level = 1;
    playerHealth = 100;
    maxHealth = 100;
    attackSpeed = 300;
    bulletDamage = 10;
    burstCount = 1;
    moveSpeed = 300;
    enemyHealth = 20;
    enemySpeed = 100;
    enemySpawnRate = 2000;
    isPaused = false;
    updateHUD();
}

function updateScore() {
    updateHUD();
}

function updateHealth() {
    const healthPercent = Math.max(0, (playerHealth / maxHealth) * 100);
    document.getElementById('health-bar-fill').style.width = healthPercent + '%';
}

function updateHUD() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('highscore').textContent = highScore;
    updateHealth();
}

function updateCombo() {
    const comboPanel = document.getElementById('combo-panel');
    const comboCount = document.getElementById('combo-count');
    const comboMulti = document.getElementById('combo-multi');
    
    if (combo > 2) {
        comboPanel.classList.remove('hidden');
        comboCount.textContent = combo;
        const multiplier = Math.min(Math.floor(combo / 3) + 1, 5);
        comboMulti.textContent = `x${multiplier}`;
    } else {
        comboPanel.classList.add('hidden');
    }
}

function showPowerUpIndicator(id) {
    const element = document.getElementById(id);
    if (element) {
        element.classList.remove('hidden');
        setTimeout(() => {
            element.classList.add('hidden');
        }, 5000);
    }
}
