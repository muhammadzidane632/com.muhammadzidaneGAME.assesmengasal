// Galaxy Defender - Space Shooter Game
// Modern UI with WASD controls

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#000011',
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

// Game variables
let player;
let enemies;
let bullets;
let enemyBullets;
let stars;
let cursors;
let wasd;
let spaceBar;
let score = 0;
let level = 1;
let lives = 3;
let enemyCount = 0;
let gameStarted = false;
let gamePaused = false;
let highScore = localStorage.getItem('highScore') || 0;

// UI Elements
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const livesElement = document.getElementById('lives');
const enemiesElement = document.getElementById('enemies');
const highScoreElement = document.getElementById('highscore');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');

// Initialize high score display
highScoreElement.textContent = highScore;

// Button event listeners
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
restartBtn.addEventListener('click', restartGame);

function preload() {
    // Preload akan dilanjutkan di create
}

function create() {
    // Create textures first
    createTextures(this);
    
    // Create starfield background
    createStarfield(this);
    
    // Create groups
    bullets = this.physics.add.group({
        defaultKey: 'bullet',
        maxSize: 30
    });
    
    enemyBullets = this.physics.add.group({
        defaultKey: 'enemyBullet',
        maxSize: 50
    });
    
    enemies = this.physics.add.group();
    
    // Create player
    player = this.physics.add.sprite(400, 550, 'player');
    player.setCollideWorldBounds(true);
    player.setScale(1.5);
    player.setDepth(10);
    
    // Setup controls - WASD
    wasd = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
    
    cursors = this.input.keyboard.createCursorKeys();
    spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Collisions
    this.physics.add.overlap(bullets, enemies, hitEnemy, null, this);
    this.physics.add.overlap(player, enemies, hitPlayer, null, this);
    this.physics.add.overlap(player, enemyBullets, hitPlayer, null, this);
    
    // Display start message
    showMessage(this, 'Press START to begin!', 3000);
}

function update() {
    if (!gameStarted || gamePaused) return;
    
    // Player movement - WASD controls
    player.setVelocity(0);
    
    const speed = 350;
    
    if (wasd.A.isDown || cursors.left.isDown) {
        player.setVelocityX(-speed);
    } else if (wasd.D.isDown || cursors.right.isDown) {
        player.setVelocityX(speed);
    }
    
    if (wasd.W.isDown || cursors.up.isDown) {
        player.setVelocityY(-speed);
    } else if (wasd.S.isDown || cursors.down.isDown) {
        player.setVelocityY(speed);
    }
    
    // Shooting
    if (Phaser.Input.Keyboard.JustDown(spaceBar)) {
        shootBullet(this);
    }
    
    // Enemy shooting
    enemies.children.entries.forEach(enemy => {
        if (Phaser.Math.Between(0, 1000) < 2) {
            shootEnemyBullet(this, enemy);
        }
    });
    
    // Auto-destroy bullets that go off screen
    bullets.children.entries.forEach(bullet => {
        if (bullet.y < -10) bullet.destroy();
    });
    
    enemyBullets.children.entries.forEach(bullet => {
        if (bullet.y > 610) bullet.destroy();
    });
}

// Helper Functions
function createTextures(scene) {
    // Create player ship - Roket dengan detail lebih jelas
    const playerGraphics = scene.add.graphics();
    
    // Body roket (cyan)
    playerGraphics.fillStyle(0x00ffff);
    playerGraphics.fillRect(12, 5, 16, 30);
    
    // Nose cone (tip roket)
    playerGraphics.fillStyle(0x00ffff);
    playerGraphics.fillTriangle(20, 0, 12, 5, 28, 5);
    
    // Wings kiri
    playerGraphics.fillStyle(0x0088ff);
    playerGraphics.fillTriangle(12, 25, 0, 35, 12, 35);
    
    // Wings kanan
    playerGraphics.fillStyle(0x0088ff);
    playerGraphics.fillTriangle(28, 25, 40, 35, 28, 35);
    
    // Window/Cockpit
    playerGraphics.fillStyle(0xffffff);
    playerGraphics.fillCircle(20, 15, 4);
    
    // Engine fire (kuning/orange)
    playerGraphics.fillStyle(0xffaa00);
    playerGraphics.fillRect(15, 35, 10, 3);
    playerGraphics.fillStyle(0xff6600);
    playerGraphics.fillRect(17, 38, 6, 2);
    
    playerGraphics.generateTexture('player', 40, 40);
    playerGraphics.destroy();
    
    // Create bullet - Laser beam
    const bulletGraphics = scene.add.graphics();
    bulletGraphics.fillStyle(0x00ffff);
    bulletGraphics.fillRect(0, 0, 3, 12);
    bulletGraphics.fillStyle(0xffffff);
    bulletGraphics.fillRect(0, 0, 3, 3);
    bulletGraphics.generateTexture('bullet', 3, 12);
    bulletGraphics.destroy();
    
    // Create enemy - UFO style
    const enemyGraphics = scene.add.graphics();
    
    // UFO body
    enemyGraphics.fillStyle(0xff0000);
    enemyGraphics.fillEllipse(20, 15, 30, 10);
    
    // UFO dome
    enemyGraphics.fillStyle(0xff6666);
    enemyGraphics.fillEllipse(20, 10, 15, 10);
    
    // UFO lights
    enemyGraphics.fillStyle(0xffff00);
    enemyGraphics.fillCircle(10, 15, 2);
    enemyGraphics.fillCircle(20, 15, 2);
    enemyGraphics.fillCircle(30, 15, 2);
    
    enemyGraphics.generateTexture('enemy', 40, 25);
    enemyGraphics.destroy();
    
    // Create enemy bullet
    const enemyBulletGraphics = scene.add.graphics();
    enemyBulletGraphics.fillStyle(0xff3333);
    enemyBulletGraphics.fillRect(0, 0, 3, 12);
    enemyBulletGraphics.fillStyle(0xff6666);
    enemyBulletGraphics.fillRect(0, 9, 3, 3);
    enemyBulletGraphics.generateTexture('enemyBullet', 3, 12);
    enemyBulletGraphics.destroy();
    
    // Create star
    const starGraphics = scene.add.graphics();
    starGraphics.fillStyle(0xffffff);
    starGraphics.fillCircle(2, 2, 1.5);
    starGraphics.generateTexture('star', 4, 4);
    starGraphics.destroy();
}

function createStarfield(scene) {
    stars = scene.add.group();
    
    for (let i = 0; i < 150; i++) {
        const x = Phaser.Math.Between(0, 800);
        const y = Phaser.Math.Between(0, 600);
        const star = scene.add.sprite(x, y, 'star');
        star.setAlpha(Phaser.Math.FloatBetween(0.3, 1));
        star.speed = Phaser.Math.FloatBetween(0.5, 2);
        stars.add(star);
    }
    
    scene.time.addEvent({
        delay: 50,
        callback: () => {
            stars.children.entries.forEach(star => {
                star.y += star.speed;
                if (star.y > 600) {
                    star.y = 0;
                    star.x = Phaser.Math.Between(0, 800);
                }
            });
        },
        loop: true
    });
}

function shootBullet(scene) {
    const bullet = bullets.get(player.x, player.y - 20);
    if (bullet) {
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.setVelocityY(-500);
    }
}

function shootEnemyBullet(scene, enemy) {
    const bullet = enemyBullets.get(enemy.x, enemy.y + 20);
    if (bullet) {
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.setVelocityY(250);
    }
}

function spawnEnemies(scene) {
    const enemiesThisLevel = 5 + (level * 2);
    enemyCount = enemiesThisLevel;
    
    for (let i = 0; i < enemiesThisLevel; i++) {
        const x = Phaser.Math.Between(50, 750);
        const y = Phaser.Math.Between(50, 200);
        const enemy = enemies.create(x, y, 'enemy');
        enemy.setScale(0.9);
        
        // Enemy movement pattern
        scene.tweens.add({
            targets: enemy,
            x: x + Phaser.Math.Between(-100, 100),
            y: y + Phaser.Math.Between(-50, 50),
            duration: Phaser.Math.Between(1500, 3000),
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    updateUI();
}

function hitEnemy(bullet, enemy) {
    if (bullet && bullet.active) bullet.destroy();
    if (enemy && enemy.active) {
        enemy.destroy();
        enemyCount--;
        score += 100;
        
        updateUI();
        
        // Explosion effect
        const scene = game.scene.scenes[0];
        if (scene) createExplosion(scene, enemy.x, enemy.y);
        
        // Check if level complete
        if (enemyCount <= 0) {
            if (scene) levelComplete(scene);
        }
    }
}

function hitPlayer(playerObj, enemy) {
    if (enemy) enemy.destroy();
    lives--;
    
    // Flash effect
    if (player && player.active) {
        player.setTint(0xff0000);
        const scene = game.scene.scenes[0];
        if (scene && scene.time) {
            scene.time.delayedCall(200, () => {
                if (player && player.active) player.clearTint();
            });
        }
    }
    
    updateUI();
    
    if (lives <= 0) {
        const scene = game.scene.scenes[0];
        if (scene) gameOver(scene);
    }
}

function createExplosion(scene, x, y) {
    const explosion = scene.add.circle(x, y, 3, 0xffff00);
    
    scene.tweens.add({
        targets: explosion,
        radius: 30,
        alpha: 0,
        duration: 300,
        onComplete: () => explosion.destroy()
    });
}

function levelComplete(scene) {
    level++;
    gamePaused = true;
    
    showMessage(scene, `Level ${level - 1} Complete!`, 2000);
    
    scene.time.delayedCall(2500, () => {
        gamePaused = false;
        spawnEnemies(scene);
    });
}

function gameOver(scene) {
    gameStarted = false;
    gamePaused = true;
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreElement.textContent = highScore;
    }
    
    showMessage(scene, `GAME OVER!\nFinal Score: ${score}`, 5000);
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    restartBtn.disabled = false;
}

function showMessage(scene, text, duration) {
    const message = scene.add.text(400, 300, text, {
        fontSize: '48px',
        fontFamily: 'Orbitron',
        color: '#00ffff',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 6
    });
    message.setOrigin(0.5);
    message.setDepth(1000);
    
    scene.tweens.add({
        targets: message,
        alpha: { from: 0, to: 1 },
        duration: 500,
        yoyo: true,
        hold: duration - 1000,
        onComplete: () => message.destroy()
    });
}

function updateUI() {
    scoreElement.textContent = score;
    levelElement.textContent = level;
    livesElement.textContent = '❤️'.repeat(lives);
    enemiesElement.textContent = enemyCount;
}

function startGame() {
    if (!gameStarted) {
        gameStarted = true;
        gamePaused = false;
        score = 0;
        level = 1;
        lives = 3;
        
        updateUI();
        
        const scene = game.scene.scenes[0];
        spawnEnemies(scene);
        
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        restartBtn.disabled = false;
    }
}

function togglePause() {
    if (gameStarted) {
        gamePaused = !gamePaused;
        pauseBtn.textContent = gamePaused ? 'RESUME' : 'PAUSE';
    }
}

function restartGame() {
    location.reload();
}
