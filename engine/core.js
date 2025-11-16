// ====== CONFIGURACIÓN BÁSICA ======
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Tamaño fijo del canvas para mejor rendimiento
// canvas.width = 1280;
// canvas.height = 720;

// Detectar si es dispositivo táctil
const isTouchDevice =
  "ontouchstart" in window ||
  navigator.maxTouchPoints > 0 ||
  navigator.msMaxTouchPoints > 0;

// Tamaño del canvas (más pequeño en móvil para subir FPS)
if (isTouchDevice) {
  canvas.width = 960;
  canvas.height = 540;
} else {
  canvas.width = 1280;
  canvas.height = 720;
}

const TILE_SIZE = 16;
const WORLD_COLS = 100;
const WORLD_ROWS = 100;

// cámara
let camX = 0;
let camY = 0;

// ====== GAME STATE ======
let gameState = "menu"; // menu, playing, paused, levelup, gameover, victory
let gameTime = 0;
let survivalTime = 20 * 60 * 1000;
let startTime = 0;
let kills = 0;

// ====== PLAYER ======
const PLAYER_W = 32;
const PLAYER_H = 32;
const PLAYER_SCALE = 2;
let imgPlayer;
let player = null;

// ====== BALAS ======
let imgBullet;
let BULLET_W = 16;
let BULLET_H = 16;
let BULLET_FRAMES = 4;
let bullets = [];
let explosions = [];

// ====== ENEMIGOS ======
let imgEnemyRunSD;
let imgEnemyRunSU;
let imgEnemyDeathSD;
let imgEnemyDeathSU;

let ENEMY_W = 16;
let ENEMY_H = 16;

const ENEMY_RUN_FRAMES = 6;
const ENEMY_DEATH_FRAMES = 4;

let enemies = [];
let enemyTimer = 0;
let enemySpawnRate = 1200; // Spawn rate aumentado para mejor rendimiento
let difficultyMultiplier = 1;
const MAX_ENEMIES = 100; // Límite de enemigos en pantalla para mejor rendimiento

// tileset y decoraciones
let imgTerrain;
let imgGrass = [];  // [Grass0..GrassN]
let imgRock  = [];  // [Rock1..Rock4]
let tilesPerRow = 0;

// ====== MAPA Y DECORACIONES =====
const worldMap = [];
const decorations = [];

// ====== PARTÍCULAS ======
let particles = [];
const MAX_PARTICLES = 100; // Límite de partículas para rendimiento

// ====== CACHE DE SPRITES TINTADOS ======
const tintedSpritesCache = {};
const tintedRocksCache = {};

// ====== SCREEN SHAKE ======
let screenShake = { x: 0, y: 0, intensity: 0 };

// ====== INPUT ======
const keys = {};
let touchInput = {
  active: false,
  startX: 0,
  startY: 0,
  deltaX: 0,
  deltaY: 0
};
let mousePos = { x: canvas.width / 2, y: canvas.height / 2 };

// ====== ACCESIBILIDAD ======
let highContrastMode = false;
let showControlsScreen = false;

// Información de controles (para la pantalla de ayuda)
const controlsInfo = [
  { key: "← / A", description: "Mover izquierda" },
  { key: "→ / D", description: "Mover derecha" },
  { key: "↑ / W", description: "Mover arriba" },
  { key: "↓ / S", description: "Mover abajo" },
  { key: "Click Izquierdo", description: "Disparar" },
  { key: "Espacio", description: "Pausar/Continuar" },
  { key: "M", description: "Silenciar/Activar sonido" },
  { key: "H", description: "Mostrar/Ocultar controles" }
];

// ====== PERSISTENCIA (LocalStorage) ======
const STORAGE_KEY = "shooter_arena_data_v1";

let gameData = {
  highScores: {
    "20min": 0
  },
  stats: {
    totalKills: 0,
    totalPlaytime: 0 // en milisegundos
  }
};

function loadGameData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      Object.assign(gameData.highScores, data.highScores || {});
      Object.assign(gameData.stats, data.stats || {});
      console.log("✅ Datos cargados desde localStorage");
    }
  } catch (error) {
    console.warn("⚠️ Error cargando datos:", error);
  }
}

function saveGameData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData));
    console.log("💾 Datos guardados");
  } catch (error) {
    console.warn("⚠️ Error guardando datos:", error);
  }
}

function updateHighScores() {
  const score = kills;
  if (score > (gameData.highScores["20min"] || 0)) {
    gameData.highScores["20min"] = score;
    console.log("🏆 Nuevo récord:", score);
  }
}

function updateStatsOnGameEnd() {
  const elapsed = gameTime; // ya está en ms si fuiste acumulando dt*1000
  gameData.stats.totalKills += kills;
  gameData.stats.totalPlaytime += elapsed;
  saveGameData();
}

// ====== AUDIO ======
const sounds = {
  shoot: null,
  enemyHit: null,
  enemyDeath: null,
  playerHit: null,
  explosion: null,
  levelUp: null,
  music: null,
  click: null,
  hover: null,
  hit: null,
  levelup: null
};

let audioEnabled = true;
let audioMuted = false;

function toggleMute() {
  audioMuted = !audioMuted;
  if (audioMuted) {
    if (sounds.music) {
      sounds.music.volume = 0;
    }
  } else {
    if (sounds.music) {
      sounds.music.volume = 0.3;
    }
  }
}

function loadAudio() {
  const audioFiles = {
    shoot: "assets/audio/shoot.mp3",
    enemyHit: "assets/audio/enemy_hit.mp3",
    enemyDeath: "assets/audio/enemy_death.mp3",
    playerHit: "assets/audio/player_hit.mp3",
    explosion: "assets/audio/explosion.mp3",
    levelUp: "assets/audio/level_up.mp3",
    music: "assets/audio/music.mp3",
    click: "assets/audio/click.mp3",
    hover: "assets/audio/hover.mp3",
    hit: "assets/audio/hit.mp3",
    levelup: "assets/audio/levelup.mp3"
  };

  for (const key in audioFiles) {
    const audio = new Audio(audioFiles[key]);
    audio.load();
    sounds[key] = audio;
  }
}

function playSound(soundName, volume = 1.0) {
  if (!audioEnabled || audioMuted) return;
  if (!sounds[soundName]) return;

  const audio = sounds[soundName].cloneNode();
  audio.volume = volume;
  audio.play().catch(() => {});
}

function playMusic() {
  if (!sounds.music) return;
  sounds.music.loop = true;
  if (!audioMuted) {
    sounds.music.volume = 0.3;
  } else {
    sounds.music.volume = 0;
  }
  sounds.music.play().catch(() => {});
}

function stopMusic() {
  if (!sounds.music) return;
  sounds.music.pause();
  sounds.music.currentTime = 0;
}

// ====== TILES DE SUELO VÁLIDOS ======
const GROUND_TILES = [
  0, 1, 2, 3   // ejemplo de tiles de hierba/tierra
];

// ====== TIPOS DE ENEMIGOS ======
const ENEMY_TYPES = [
  {
    name: "Slime Verde",
    maxHealth: 3,
    speed: 0.7,
    damage: 1,
    xp: 5,
    color: "#00ff00",
    spawnWeight: 5
  },
  {
    name: "Slime Rojo",
    maxHealth: 5,
    speed: 0.9,
    damage: 1,
    xp: 10,
    color: "#ff0000",
    spawnWeight: 3
  },
  {
    name: "Slime Azul",
    maxHealth: 4,
    speed: 1.2,
    damage: 1,
    xp: 8,
    color: "#0000ff",
    spawnWeight: 2
  }
];

// ====== SISTEMA DE UPGRADES ======
const UPGRADES = [
  {
    name: "Daño +1",
    description: "Aumenta el daño de tus ataques.",
    apply: () => {
      player.damage += 1;
    }
  },
  {
    name: "Velocidad +10%",
    description: "Te mueves un poco más rápido.",
    apply: () => {
      player.speed *= 1.1;
    }
  },
  {
    name: "Cadencia +15%",
    description: "Disparas con mayor frecuencia.",
    apply: () => {
      player.fireRate *= 0.85;
      if (player.fireRate < 80) {
        player.fireRate = 80;
      }
    }
  },
  {
    name: "Vida Máx +10",
    description: "Aumenta tu vida máxima.",
    apply: () => {
      player.maxHealth += 10;
      player.health = player.maxHealth;
    }
  }
];

// ====== FUNCIONES HELPER ======
function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function roundRect(ctx, x, y, width, height, radius) {
  if (width < 0) { x += width; width = Math.abs(width); }
  if (height < 0) { y += height; height = Math.abs(height); }

  if (radius > width / 2) radius = width / 2;
  if (radius > height / 2) radius = height / 2;

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      context.fillText(line, x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.fillText(line, x, y);
}

// ====== SCREEN SHAKE ======
function applyScreenShake(intensity) {
  screenShake.intensity = intensity;
}

function updateScreenShake() {
  if (screenShake.intensity > 0) {
    screenShake.x = (Math.random() - 0.5) * screenShake.intensity;
    screenShake.y = (Math.random() - 0.5) * screenShake.intensity;
    screenShake.intensity *= 0.9;
    if (screenShake.intensity < 0.5) {
      screenShake.intensity = 0;
      screenShake.x = 0;
      screenShake.y = 0;
    }
  } else {
    screenShake.x = 0;
    screenShake.y = 0;
  }
}

// ====== FUNCIÓN PARA CREAR SPRITES TINTADOS (CON CACHE) ======
function getTintedSprite(baseImage, tintColor, cache, cacheKey) {
  if (!baseImage) return null;

  const key = cacheKey + "_" + tintColor;
  if (cache[key]) return cache[key];

  const offCanvas = document.createElement("canvas");
  offCanvas.width = baseImage.width;
  offCanvas.height = baseImage.height;
  const offCtx = offCanvas.getContext("2d");

  offCtx.drawImage(baseImage, 0, 0);
  offCtx.globalCompositeOperation = "source-atop";
  offCtx.fillStyle = tintColor;
  offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);
  offCtx.globalCompositeOperation = "source-over";

  cache[key] = offCanvas;
  return offCanvas;
}

// ====== PARTÍCULAS ======
function createParticles(x, y, color, amount) {
  for (let i = 0; i < amount; i++) {
    if (particles.length >= MAX_PARTICLES) break;
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: Math.random() * 0.5 + 0.5,
      color
    });
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt * 60;
    p.y += p.vy * dt * 60;
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.fillStyle = p.color;
    ctx.fillRect(
      p.x - camX + screenShake.x,
      p.y - camY + screenShake.y,
      2,
      2
    );
  }
}

// ====== GENERAR MUNDO (SUELO VARIADO SIN HUECOS) ======
function generateWorldMap() {
  for (let row = 0; row < WORLD_ROWS; row++) {
    worldMap[row] = [];
    for (let col = 0; col < WORLD_COLS; col++) {
      // Escoger un tile de suelo válido
      const tileIndex = randomFrom(GROUND_TILES);
      worldMap[row][col] = {
        tileIndex,
        isObstacle: false
      };
    }
  }

  // Crear algunas "rocas" grandes marcadas como obstáculos
  const numRocks = 80;
  for (let i = 0; i < numRocks; i++) {
    const rockCol = Math.floor(Math.random() * WORLD_COLS);
    const rockRow = Math.floor(Math.random() * WORLD_ROWS);
    worldMap[rockRow][rockCol].isObstacle = true;
  }
}

// ====== SUAVIZAR EL MUNDO ======
function smoothWorldMap(iterations = 1) {
  for (let iter = 0; iter < iterations; iter++) {
    const newMap = [];
    for (let row = 0; row < WORLD_ROWS; row++) {
      newMap[row] = [];
      for (let col = 0; col < WORLD_COLS; col++) {
        let obstacleCount = 0;
        for (let y = -1; y <= 1; y++) {
          for (let x = -1; x <= 1; x++) {
            const ny = row + y;
            const nx = col + x;
            if (ny < 0 || ny >= WORLD_ROWS || nx < 0 || nx >= WORLD_COLS) {
              obstacleCount++;
            } else if (worldMap[ny][nx].isObstacle) {
              obstacleCount++;
            }
          }
        }
        if (obstacleCount > 4) {
          newMap[row][col] = { tileIndex: worldMap[row][col].tileIndex, isObstacle: true };
        } else {
          newMap[row][col] = { tileIndex: worldMap[row][col].tileIndex, isObstacle: false };
        }
      }
    }
    for (let row = 0; row < WORLD_ROWS; row++) {
      for (let col = 0; col < WORLD_COLS; col++) {
        worldMap[row][col] = newMap[row][col];
      }
    }
  }
}

// ====== LOADER DE IMÁGENES ======
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

// ====== GENERAR DECORACIONES ======
function generateDecorations() {
  decorations.length = 0;

  for (let row = 0; row < WORLD_ROWS; row++) {
    for (let col = 0; col < WORLD_COLS; col++) {
      const cell = worldMap[row][col];
      if (!cell || cell.isObstacle) continue;

      const hasDecoration = Math.random() < 0.45;
      if (!hasDecoration) continue;

      const type = Math.random() < 0.7 ? "grass" : "rock";

      if (type === "grass" && imgGrass.length > 0) {
        const variant = Math.floor(Math.random() * imgGrass.length);
        const width = imgGrass[variant].width;
        const height = imgGrass[variant].height;
        const scale = 1;
        const collisionWidth = width * 0.4;
        const collisionHeight = height * 0.4;
        const isObstacle = false;

        decorations.push({
          x: col * TILE_SIZE,
          y: row * TILE_SIZE,
          type,
          variant,
          isObstacle,
          width,
          height,
          scale,
          collisionWidth,
          collisionHeight,
          collisionOffsetX: (width - collisionWidth) / 2,
          collisionOffsetY: (height - collisionHeight) / 2
        });
      } else if (type === "rock" && imgRock.length > 0) {
        const variant = Math.floor(Math.random() * imgRock.length);
        const width = imgRock[variant].width;
        const height = imgRock[variant].height;
        const scale = 1;
        const collisionWidth = width * 0.6;
        const collisionHeight = height * 0.6;
        const isObstacle = true;

        decorations.push({
          x: col * TILE_SIZE,
          y: row * TILE_SIZE,
          type,
          variant,
          isObstacle,
          width,
          height,
          scale,
          collisionWidth,
          collisionHeight,
          // Offset para centrar el área de colisión
          collisionOffsetX: (width - collisionWidth) / 2,
          collisionOffsetY: (height - collisionHeight) / 2
        });
      }
    }
  }
}
