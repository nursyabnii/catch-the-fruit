// Menyiapkan elemen canvas dan UI
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameplayUI = document.getElementById('gameplayUI');
const startMenu = document.getElementById('startMenu');
const gameOverMenu = document.getElementById('gameOverMenu');
const pauseOverlay = document.getElementById('pauseOverlay');
const scoreBoard = document.getElementById('scoreBoard');
const lifeCounter = document.getElementById('lifeCounter');
const missedCounter = document.getElementById('missedCounter');
const finalScoreDisplay = document.getElementById('finalScore');
const highScoreDisplay = document.getElementById('highScoreDisplay');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const pauseButton = document.getElementById('pauseButton');

// Menyiapkan elemen audio
const catchSound = document.getElementById('catchSound');
const bombSound = document.getElementById('bombSound');
const gameOverSound = document.getElementById('gameOverSound');


// Mengatur ukuran canvas agar sesuai dengan layar
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Variabel Game
let gameState = 'MENU'; // 'MENU', 'PLAYING', 'PAUSED', 'GAME_OVER'
let score, lives, missedFruits, highScore;
let gameObjects = [];
let spawnInterval, animationFrameId;

// Objek untuk keranjang pemain
const basket = {
    width: 100,
    height: 80,
    x: canvas.width / 2 - 50,
    y: canvas.height - 90,
    emoji: '🧺'
};

const fruitEmojis = ['🍎', '🍌', '🍉', '🍓', '🍇', '🍍'];
const bombEmoji = '💣';
const heartEmoji = '❤️';

// --- FUNGSI UTAMA GAME ---

function loadHighScore() {
    highScore = localStorage.getItem('fruitCatcherHighScore') || 0;
}

function saveHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('fruitCatcherHighScore', highScore);
    }
}

function startGame() {
    // Reset variabel
    score = 0;
    lives = 3;
    missedFruits = 0;
    gameObjects = [];
    gameState = 'PLAYING';

    // Update UI
    scoreBoard.textContent = `Skor: ${score}`;
    lifeCounter.textContent = heartEmoji.repeat(lives);
    missedCounter.textContent = `Lewat: ${missedFruits}/10`;
    startMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    gameplayUI.classList.remove('hidden');
    pauseButton.textContent = 'Pause';

    // Mulai game
    spawnInterval = setInterval(spawnObject, 1000);
    gameLoop();
}

function endGame() {
    gameState = 'GAME_OVER';
    saveHighScore();
    clearInterval(spawnInterval);
    cancelAnimationFrame(animationFrameId);

    // Mainkan suara game over
    gameOverSound.play();

    // Update UI
    finalScoreDisplay.textContent = score;
    highScoreDisplay.textContent = highScore;
    gameOverMenu.classList.remove('hidden');
    gameplayUI.classList.add('hidden');
}

function togglePause() {
    if (gameState === 'PLAYING') {
        gameState = 'PAUSED';
        clearInterval(spawnInterval);
        cancelAnimationFrame(animationFrameId);
        pauseOverlay.classList.remove('hidden');
        pauseButton.textContent = 'Resume';
    } else if (gameState === 'PAUSED') {
        gameState = 'PLAYING';
        spawnInterval = setInterval(spawnObject, 1000);
        pauseOverlay.classList.add('hidden');
        pauseButton.textContent = 'Pause';
        gameLoop();
    }
}

function gameLoop() {
    if (gameState !== 'PLAYING') return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBasket();
    drawObjects();
    updateObjects();

    animationFrameId = requestAnimationFrame(gameLoop);
}

// --- FUNGSI OBJEK & GAMBAR ---

function spawnObject() {
    const isBomb = Math.random() < 0.2;
    const emoji = isBomb ? bombEmoji : fruitEmojis[Math.floor(Math.random() * fruitEmojis.length)];
    gameObjects.push({
        emoji: emoji,
        x: Math.random() * (canvas.width - 40),
        y: -40,
        size: 40,
        speed: Math.random() * 3 + 2,
        isBomb: isBomb
    });
}

function drawBasket() {
    ctx.font = '60px serif';
    ctx.fillText(basket.emoji, basket.x, basket.y + basket.height);
}

function drawObjects() {
    gameObjects.forEach(obj => {
        ctx.font = '40px serif';
        ctx.fillText(obj.emoji, obj.x, obj.y);
    });
}

function updateObjects() {
    for (let i = gameObjects.length - 1; i >= 0; i--) {
        const obj = gameObjects[i];
        obj.y += obj.speed;

        // ==========================================================
        // === LOGIKA DETEKSI TABRAKAN BARU (LEBIH LUAS) ===
        // ==========================================================

        // Batasan area objek dan keranjang
        const objectLeft = obj.x;
        const objectRight = obj.x + obj.size;
        const objectBottom = obj.y + obj.size;

        const basketLeft = basket.x;
        const basketRight = basket.x + basket.width;
        // PERUBAHAN DI SINI: Tentukan "zona tangkapan" yang lebih rendah di dalam keranjang.
        // Angka 40 berarti area tangkapan dimulai 40 piksel di bawah tepi atas keranjang.
        const basketCatchTop = basket.y + 40;
        const basketBottom = basket.y + basket.height;

        // Cek overlap horizontal seperti biasa
        const horizontalOverlap = objectRight > basketLeft && objectLeft < basketRight;
        // Cek vertikal yang lebih ketat: bagian bawah buah harus melewati 'basketCatchTop'
        const verticalOverlap = objectBottom > basketCatchTop && objectBottom < basketBottom;

        if (horizontalOverlap && verticalOverlap) {
            if (obj.isBomb) {
                lives--;
                lifeCounter.textContent = heartEmoji.repeat(lives);
                bombSound.currentTime = 0; // Ulangi suara dari awal jika cepat
                bombSound.play();
                if (lives <= 0) endGame();
            } else {
                score++;
                scoreBoard.textContent = `Skor: ${score}`;
                catchSound.currentTime = 0; // Ulangi suara dari awal jika cepat
                catchSound.play();
            }
            gameObjects.splice(i, 1); // Hapus objek setelah ditangkap
        }
        // ==========================================================
        // === AKHIR DARI PERUBAHAN ===
        // ==========================================================


        // Deteksi buah yang terlewat (jika sudah melewati dasar layar)
        if (obj.y > canvas.height) {
            if (!obj.isBomb) {
                missedFruits++;
                missedCounter.textContent = `Lewat: ${missedFruits}/10`;
                if (missedFruits >= 10) endGame();
            }
            gameObjects.splice(i, 1);
        }
    }
}

// --- KONTROL PEMAIN & EVENT LISTENER ---

function moveBasket(event) {
    if (gameState !== 'PLAYING') return;
    let clientX = event.clientX || (event.touches && event.touches[0].clientX);
    if (clientX) {
        basket.x = clientX - basket.width / 2;
    }
    if (basket.x < 0) basket.x = 0;
    if (basket.x + basket.width > canvas.width) basket.x = canvas.width - basket.width;
}

// Inisialisasi
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', togglePause);
window.addEventListener('mousemove', moveBasket);
window.addEventListener('touchmove', moveBasket);

// Muat high score saat halaman dibuka
loadHighScore();