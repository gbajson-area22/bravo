const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('start-button');

// Load assets
const marioSprite = new Image();
marioSprite.src = 'sprite.png';

const backgroundImage = new Image();
backgroundImage.src = 'background_image.png';

const coinSound = new Audio('coin.wav');
const gunSound = new Audio('gun.mp3');

let gameStarted = false;
let score = 0;
let backgroundX = 0;

const game = {
    bullets: [],
    bulletSpeed: 10,
    canShoot: true,
    shootCooldown: 250,
    camera: {
        x: 0,
        y: 0
    },
    player: {
        x: 50,
        y: 200,
        width: 32,
        height: 32,
        velocityX: 0,
        velocityY: 0,
        isJumping: false,
        direction: 'right'
    },
    // Extended platform layout
    platforms: [
        { x: 0, y: 350, width: 800, height: 20 },    // Ground
        { x: 300, y: 250, width: 100, height: 20 },  // Platform 1
        { x: 500, y: 200, width: 100, height: 20 },  // Platform 2
        { x: 100, y: 150, width: 100, height: 20 },  // Platform 3
        { x: 700, y: 150, width: 100, height: 20 },  // New Platform 4
        { x: 900, y: 200, width: 100, height: 20 },  // New Platform 5
        { x: 1100, y: 250, width: 100, height: 20 }, // New Platform 6
        { x: 1300, y: 150, width: 100, height: 20 }, // New Platform 7
        { x: 1500, y: 200, width: 100, height: 20 }  // New Platform 8
    ],
    coins: [
        { x: 320, y: 220, width: 15, height: 15, collected: false },
        { x: 520, y: 170, width: 15, height: 15, collected: false },
        { x: 120, y: 120, width: 15, height: 15, collected: false },
        { x: 720, y: 120, width: 15, height: 15, collected: false },
        { x: 920, y: 170, width: 15, height: 15, collected: false },
        { x: 1120, y: 220, width: 15, height: 15, collected: false }
    ],
    keys: {
        left: false,
        right: false,
        up: false,
        shoot: false
    },
    gravity: 0.5,
    jumpForce: -12,
    moveSpeed: 5
};

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function shoot() {
    if (!game.canShoot) return;
    
    const bullet = {
        x: game.player.direction === 'right' ? 
            game.player.x + game.player.width : 
            game.player.x,
        y: game.player.y + game.player.height/2,
        width: 10,
        height: 4,
        direction: game.player.direction,
        speed: game.bulletSpeed
    };
    
    game.bullets.push(bullet);
    game.canShoot = false;
    
    gunSound.currentTime = 0;
    gunSound.play();
    
    setTimeout(() => game.canShoot = true, game.shootCooldown);
}

function updateBullets() {
    game.bullets = game.bullets.filter(bullet => {
        bullet.x += bullet.direction === 'right' ? bullet.speed : -bullet.speed;
        return bullet.x > game.camera.x && bullet.x < game.camera.x + canvas.width;
    });
}

function update() {
    const { player, platforms, coins, bullets } = game;

    // Handle horizontal movement
    if (game.keys.left) {
        player.velocityX = -game.moveSpeed;
        player.direction = 'left';
    }
    else if (game.keys.right) {
        player.velocityX = game.moveSpeed;
        player.direction = 'right';
    }
    else player.velocityX = 0;

    // Apply gravity
    player.velocityY += game.gravity;

    // Update position
    player.x += player.velocityX;
    player.y += player.velocityY;

    // Update camera position
    if (player.x > canvas.width * 0.6) {
        game.camera.x += player.velocityX;
        player.x = canvas.width * 0.6;
    } else if (player.x < canvas.width * 0.4 && game.camera.x > 0) {
        game.camera.x += player.velocityX;
        player.x = canvas.width * 0.4;
    }

    // Update background position (parallax effect)
    backgroundX = -(game.camera.x * 0.5) % canvas.width;

    // Handle shooting
    if (game.keys.shoot) {
        shoot();
    }
    updateBullets();

    // Check platform collisions
    let onGround = false;
    platforms.forEach(platform => {
        const relativePlatform = {
            x: platform.x - game.camera.x,
            y: platform.y,
            width: platform.width,
            height: platform.height
        };

        if (checkCollision(player, relativePlatform)) {
            if (player.velocityY > 0 && 
                player.y + player.height - player.velocityY <= relativePlatform.y) {
                player.y = relativePlatform.y - player.height;
                player.velocityY = 0;
                player.isJumping = false;
                onGround = true;
            }
            else if (player.velocityY < 0 && 
                    player.y >= relativePlatform.y + relativePlatform.height) {
                player.y = relativePlatform.y + relativePlatform.height;
                player.velocityY = 0;
            }
            else if (player.velocityX > 0) {
                player.x = relativePlatform.x - player.width;
            } else if (player.velocityX < 0) {
                player.x = relativePlatform.x + relativePlatform.width;
            }
        }
    });

    // Handle jumping
    if (game.keys.up && !player.isJumping && onGround) {
        player.velocityY = game.jumpForce;
        player.isJumping = true;
    }

    // Check coin collisions with camera offset
    coins.forEach(coin => {
        const relativeCoin = {
            x: coin.x - game.camera.x,
            y: coin.y,
            width: coin.width,
            height: coin.height
        };

        if (!coin.collected && checkCollision(player, relativeCoin)) {
            coin.collected = true;
            score += 10;
            coinSound.currentTime = 0;
            coinSound.play();
        }
    });

    // Keep player in bounds
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }
    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.velocityY = 0;
        player.isJumping = false;
    }
}

function render() {
    const { player, platforms, coins } = game;

    // Draw scrolling background
    ctx.drawImage(backgroundImage, backgroundX, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, backgroundX + canvas.width, 0, canvas.width, canvas.height);

    // Draw platforms with camera offset
    ctx.fillStyle = '#8B4513';
    platforms.forEach(platform => {
        ctx.fillRect(
            platform.x - game.camera.x,
            platform.y,
            platform.width,
            platform.height
        );
    });

    // Draw coins with camera offset
    ctx.fillStyle = '#FFD700';
    coins.forEach(coin => {
        if (!coin.collected) {
            ctx.beginPath();
            ctx.arc(
                coin.x - game.camera.x + coin.width / 2,
                coin.y + coin.height / 2,
                coin.width / 2,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    });

    // Draw player
    ctx.save();
    if (player.direction === 'left') {
        ctx.scale(-1, 1);
        ctx.drawImage(marioSprite, -player.x - player.width, player.y, player.width, player.height);
    } else {
        ctx.drawImage(marioSprite, player.x, player.y, player.width, player.height);
    }
    ctx.restore();

    // Draw bullets with camera offset
    ctx.fillStyle = '#FFD700';
    game.bullets.forEach(bullet => {
        ctx.fillRect(
            bullet.x - game.camera.x,
            bullet.y,
            bullet.width,
            bullet.height
        );
    });

    // Draw score
    ctx.fillStyle = '#000000';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
}

function gameLoop() {
    if (!gameStarted) return;
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Event listeners
document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowLeft':
            game.keys.left = true;
            break;
        case 'ArrowRight':
            game.keys.right = true;
            break;
        case 'ArrowUp':
        case ' ':
            game.keys.up = true;
            e.preventDefault();
            break;
        case 'z':
        case 'Z':
            game.keys.shoot = true;
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.key) {
        case 'ArrowLeft':
            game.keys.left = false;
            break;
        case 'ArrowRight':
            game.keys.right = false;
            break;
        case 'ArrowUp':
        case ' ':
            game.keys.up = false;
            break;
        case 'z':
        case 'Z':
            game.keys.shoot = false;
            break;
    }
});

startButton.addEventListener('click', () => {
    gameStarted = true;
    startButton.style.display = 'none';
    gameLoop();
});