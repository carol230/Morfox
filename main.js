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
  canvas.width  = 960;   // o incluso 800x450 si quieres aún más FPS
  canvas.height = 540;
} else {
  canvas.width  = 1280;
  canvas.height = 720;
}

const TILE_SIZE = 16;

// mundo más grande que la pantalla -> "mundo abierto"
const WORLD_COLS = 100;
const WORLD_ROWS = 100;

// cámara (qué parte del mundo se ve)
let camX = 0;
let camY = 0;

// ====== GAME STATE ======
let gameState = "menu"; // menu, playing, paused, levelup, gameover, victory
let gameTime = 0;
let survivalTime = 20 * 60 * 1000; // 20 minutos en milisegundos
let startTime = 0;
let kills = 0;

// ====== PLAYER ======
const PLAYER_W = 32;
const PLAYER_H = 32;
const PLAYER_SCALE = 2; // Escala para hacer el jugador más grande
let imgPlayer;
let player = null; // se crea en start()

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

// ancho/alto de cada frame de enemigo
let ENEMY_W = 16;
let ENEMY_H = 16;
const ENEMY_RUN_FRAMES   = 6;
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

// ====== MAPA Y DECORACIONES ======
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
// ===== TOUCH INPUT =====
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

function toggleHighContrast() {
  highContrastMode = !highContrastMode;
  console.log(highContrastMode ? "🎨 Modo alto contraste activado" : "🎨 Modo normal activado");
}

const controlsInfo = {
  movement: "WASD o Flechas - Mover jugador",
  shoot: "ESPACIO - Disparar granada",
  pause: "ESC - Pausar/Reanudar",
  mute: "M - Silenciar/Activar audio",
  contrast: "C - Cambiar contraste",
  help: "H - Mostrar/Ocultar ayuda"
};

// ====== PERSISTENCIA (LocalStorage) ======
const STORAGE_KEY = 'survive20_data';

const gameData = {
  highScores: {
    longestSurvival: 0,      // en milisegundos
    mostKills: 0,
    highestLevel: 0
  },
  stats: {
    totalGames: 0,
    totalKills: 0,
    totalDeaths: 0,
    totalPlayTime: 0         // en milisegundos
  }
};

function loadGameData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
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
  let updated = false;

  // Actualizar mejor tiempo de supervivencia
  if (gameState === "victory" || gameTime > gameData.highScores.longestSurvival) {
    gameData.highScores.longestSurvival = gameTime;
    updated = true;
  }

  // Actualizar más kills
  if (kills > gameData.highScores.mostKills) {
    gameData.highScores.mostKills = kills;
    updated = true;
  }

  // Actualizar mayor nivel
  if (player && player.level > gameData.highScores.highestLevel) {
    gameData.highScores.highestLevel = player.level;
    updated = true;
  }

  return updated;
}

function updateStats() {
  gameData.stats.totalGames++;
  gameData.stats.totalKills += kills;
  if (gameState === "gameover") {
    gameData.stats.totalDeaths++;
  }
  gameData.stats.totalPlayTime += gameTime;
}

// ====== AUDIO ======
const sounds = {
  music: null,
  shoot: null,
  explosion: null,
  hit: null,
  levelup: null
};

let audioEnabled = true;
let audioMuted = false;

function toggleMute() {
  audioMuted = !audioMuted;

  if (sounds.music) {
    sounds.music.muted = audioMuted;
  }

  console.log(audioMuted ? "🔇 Audio silenciado" : "🔊 Audio activado");
}

function loadAudio() {
  try {
    // Música de fondo
    sounds.music = new Audio('./sounds/music.mp3');
    sounds.music.loop = true;
    sounds.music.volume = 0.5; // Subido de 0.3 a 0.5

    // Efectos de sonido (bajados para mejor balance)
    sounds.shoot = new Audio('./sounds/shoot.mp3');
    sounds.shoot.volume = 0.2; // Bajado de 0.4 a 0.2

    sounds.explosion = new Audio('./sounds/explosion.mp3');
    sounds.explosion.volume = 0.25; // Bajado de 0.5 a 0.25

    sounds.hit = new Audio('./sounds/hit.mp3');
    sounds.hit.volume = 0.25; // Bajado de 0.6 a 0.25

    sounds.levelup = new Audio('./sounds/levelup.mp3');
    sounds.levelup.volume = 0.35; // Bajado de 0.7 a 0.35

    console.log("✅ Audio cargado");
  } catch (error) {
    console.warn("⚠️ No se pudieron cargar algunos archivos de audio:", error);
    audioEnabled = false;
  }
}

function playSound(soundName) {
  if (!audioEnabled || !sounds[soundName] || audioMuted) return;

  try {
    // Clonar el audio para permitir múltiples reproducciones simultáneas
    const sound = sounds[soundName].cloneNode();
    sound.volume = sounds[soundName].volume;
    sound.play().catch(e => console.warn("Error reproduciendo sonido:", e));
  } catch (e) {
    console.warn("Error al reproducir sonido:", e);
  }
}

function playMusic() {
  if (!audioEnabled || !sounds.music) return;

  try {
    sounds.music.play().catch(e => {
      console.warn("Error reproduciendo música:", e);
      // Si falla, intentar de nuevo cuando el usuario haga click
      document.addEventListener('click', () => {
        sounds.music.play().catch(() => {});
      }, { once: true });
    });
  } catch (e) {
    console.warn("Error al reproducir música:", e);
  }
}

function stopMusic() {
  if (sounds.music) {
    sounds.music.pause();
    sounds.music.currentTime = 0;
  }
}

// ====== TILES DE SUELO VÁLIDOS ======
const GROUND_TILES = [
  0, 1, 2, 3, 4, 5,
  16, 17, 18, 19, 20, 21,
  32, 33, 34, 35, 36, 37,
  48, 49, 50, 51, 52, 53,
  64, 65, 66, 67, 68, 69,
  80, 81, 82, 83, 84, 85,
  96, 97, 98, 99, 100, 101,
  112, 113, 114, 115, 116, 117,
  128, 129, 130, 131, 132, 133,
  144, 145, 146, 147, 148, 149,
];

// ====== TIPOS DE ENEMIGOS ======
const ENEMY_TYPES = {
    BASIC: {
        name: "Zombie",
        color: "#8b4a8e",
        tint: [139, 74, 142], // Purple tint
        size: 18,
        speed: 35,
        hp: 3,
        damage: 8,
        xp: 1,
        weight: 100,
        minTime: 0
    },
    FAST: {
        name: "Runner",
        color: "#e74c3c",
        tint: [231, 76, 60], // Red tint
        size: 14,
        speed: 80,
        hp: 2,
        damage: 6,
        xp: 2,
        weight: 70,
        minTime: 30000 // 30 segundos
    },
    TANK: {
        name: "Brute",
        color: "#2ecc71",
        tint: [46, 204, 113], // Green tint
        size: 28,
        speed: 25,
        hp: 18,
        damage: 15,
        xp: 5,
        weight: 40,
        minTime: 90000 // 1.5 minutos
    },
    SWARM: {
        name: "Imp",
        color: "#f39c12",
        tint: [243, 156, 18], // Orange tint
        size: 12,
        speed: 55,
        hp: 1,
        damage: 4,
        xp: 1,
        weight: 80,
        minTime: 60000 // 1 minuto
    },
    SPITTER: {
        name: "Spitter",
        color: "#9b59b6",
        tint: [155, 89, 182], // Purple tint
        size: 16,
        speed: 30,
        hp: 4,
        damage: 10,
        xp: 3,
        weight: 50,
        minTime: 120000 // 2 minutos
    },
    BERSERKER: {
        name: "Berserker",
        color: "#e67e22",
        tint: [230, 126, 34], // Dark orange
        size: 22,
        speed: 65,
        hp: 8,
        damage: 12,
        xp: 4,
        weight: 35,
        minTime: 150000 // 2.5 minutos
    },
    HEAVY: {
        name: "Heavy",
        color: "#34495e",
        tint: [52, 73, 94], // Dark blue
        size: 32,
        speed: 18,
        hp: 25,
        damage: 20,
        xp: 8,
        weight: 20,
        minTime: 180000 // 3 minutos
    },
    SHADOW: {
        name: "Shadow",
        color: "#2c3e50",
        tint: [44, 62, 80], // Very dark
        size: 15,
        speed: 90,
        hp: 3,
        damage: 10,
        xp: 3,
        weight: 30,
        minTime: 240000 // 4 minutos
    },
    ELITE: {
        name: "Elite",
        color: "#16a085",
        tint: [22, 160, 133], // Teal
        size: 24,
        speed: 50,
        hp: 15,
        damage: 18,
        xp: 7,
        weight: 25,
        minTime: 300000 // 5 minutos
    },
    BOSS: {
        name: "Boss",
        color: "#c0392b",
        tint: [192, 57, 43], // Dark red
        size: 40,
        speed: 20,
        hp: 60,
        damage: 25,
        xp: 25,
        weight: 8,
        minTime: 360000 // 6 minutos
    },
    CHAMPION: {
        name: "Champion",
        color: "#d35400",
        tint: [211, 84, 0], // Pumpkin
        size: 26,
        speed: 45,
        hp: 20,
        damage: 20,
        xp: 10,
        weight: 15,
        minTime: 420000 // 7 minutos
    },
    NIGHTMARE: {
        name: "Nightmare",
        color: "#8e44ad",
        tint: [142, 68, 173], // Dark purple
        size: 35,
        speed: 35,
        hp: 40,
        damage: 30,
        xp: 20,
        weight: 10,
        minTime: 480000 // 8 minutos
    }
};

// ====== SISTEMA DE UPGRADES ======
const UPGRADES = [
    {
        name: "Velocidad +",
        description: "Aumenta velocidad de movimiento",
        apply: () => player.speed += 30
    },
    {
        name: "Vida Máxima +",
        description: "+20 HP máximo y cura completa",
        apply: () => {
            player.maxHp += 20;
            player.hp = player.maxHp;
        }
    },
    {
        name: "Cadencia +",
        description: "Dispara más rápido",
        apply: () => player.fireRate = Math.max(300, player.fireRate - 100)
    },
    {
        name: "Daño Explosión +",
        description: "Aumenta daño de explosión",
        apply: () => player.explosionDamage += 1
    },
    {
        name: "Radio Explosión +",
        description: "Mayor área de explosión",
        apply: () => player.explosionRadius += 20
    },
    {
        name: "Granada Extra",
        description: "Dispara una granada adicional",
        apply: () => player.projectileCount += 1
    },
    {
        name: "Munición Máxima +",
        description: "+2 granadas en el cargador",
        apply: () => {
            player.maxAmmo += 2;
            player.ammo = player.maxAmmo;
        }
    },
    {
        name: "Recarga Rápida",
        description: "Reduce tiempo de recarga",
        apply: () => player.reloadTime = Math.max(800, player.reloadTime - 400)
    },
    {
        name: "Granadas Rápidas",
        description: "Aumenta velocidad de granadas",
        apply: () => player.bulletSpeed += 50
    },
    {
        name: "Crítico +",
        description: "+10% probabilidad de crítico",
        apply: () => player.critChance += 0.1
    },
    {
        name: "Dispersión +",
        description: "Mayor ángulo de disparo",
        apply: () => {
            player.bulletSpread += 0.2;
            if (player.projectileCount < 2) player.projectileCount = 2;
        }
    },
    {
        name: "Robo de Vida",
        description: "Recupera HP al matar",
        apply: () => player.lifeSteal += 2
    },
    {
        name: "Curación",
        description: "Restaura 50 HP",
        apply: () => player.hp = Math.min(player.maxHp, player.hp + 50)
    },
    {
        name: "Explosión Doble",
        description: "Las explosiones son más grandes",
        apply: () => {
            player.explosionRadius += 30;
            player.explosionDamage += 1.5;
        }
    }
];

let currentUpgradeOptions = [];

// ====== FUNCIONES HELPER ======
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return (
    ax < bx + bw &&
    ax + aw > bx &&
    ay < by + bh &&
    ay + ah > by
  );
}

// Verificar si el jugador colisiona con obstáculos
function checkObstacleCollision(x, y, width, height) {
  for (let obj of decorations) {
    if (!obj.isObstacle) continue;

    // Usar el área de colisión más pequeña, centrada en la roca
    const objCollisionX = obj.x + obj.collisionOffsetX;
    const objCollisionY = obj.y + obj.collisionOffsetY;

    if (rectsOverlap(x, y, width, height, objCollisionX, objCollisionY, obj.collisionWidth, obj.collisionHeight)) {
      return true;
    }
  }
  return false;
}

function roundRect(ctx, x, y, width, height, radius = 8) {
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

function wrapText(text, maxWidth) {
    let words = text.split(' ');
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        let word = words[i];
        let width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
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
        if (screenShake.intensity < 0.1) {
            screenShake.intensity = 0;
            screenShake.x = 0;
            screenShake.y = 0;
        }
    }
}

// ====== FUNCIÓN PARA CREAR SPRITES TINTADOS (CON CACHE) ======
function getTintedSprite(img, sx, sy, width, height, color, facing, type) {
  const cacheKey = `${type}_${facing}_${color}`;

  if (tintedSpritesCache[cacheKey]) {
    return tintedSpritesCache[cacheKey];
  }

  // Crear canvas temporal solo una vez por tipo de enemigo
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width * ENEMY_RUN_FRAMES; // Toda la strip
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');

  // Dibujar toda la tira de animación
  tempCtx.drawImage(img, 0, 0);

  // Aplicar tint
  tempCtx.globalCompositeOperation = 'multiply';
  tempCtx.fillStyle = color;
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

  // Restaurar alpha
  tempCtx.globalCompositeOperation = 'destination-in';
  tempCtx.drawImage(img, 0, 0);

  // Guardar en cache
  tintedSpritesCache[cacheKey] = tempCanvas;
  return tempCanvas;
}

// ====== PARTÍCULAS ======
function createParticles(x, y, count, color) {
    // Limitar partículas para mejor rendimiento
    if (particles.length >= MAX_PARTICLES) return;

    count = Math.min(count, MAX_PARTICLES - particles.length);

    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            life: 1,
            color: color,
            size: Math.random() * 4 + 2
        });
    }
}

function updateParticles(dt) {
    particles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 100 * dt; // gravedad
        p.life -= 0.5 * dt;
        p.vx *= 0.98;
    });

    particles = particles.filter(p => p.life > 0);
}

function drawParticles() {
    // OPTIMIZACIÓN: Culling de partículas
    const margin = 20;
    const minX = camX - margin;
    const maxX = camX + canvas.width + margin;
    const minY = camY - margin;
    const maxY = camY + canvas.height + margin;

    particles.forEach(p => {
        // Skip partículas fuera de pantalla
        if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) {
            return;
        }

        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x - camX, p.y - camY, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

// ====== GENERAR MUNDO (SUELO VARIADO SIN HUECOS) ======
function generateWorldMap() {
  for (let row = 0; row < WORLD_ROWS; row++) {
    worldMap[row] = [];
    for (let col = 0; col < WORLD_COLS; col++) {
      let tile;

      if (row === 0 && col === 0) {
        tile = randomFrom(GROUND_TILES);
      } else {
        const r = Math.random();

        if (r < 0.60 && col > 0) {
          tile = worldMap[row][col - 1];
        } else if (r < 0.85 && row > 0) {
          tile = worldMap[row - 1][col];
        } else {
          tile = randomFrom(GROUND_TILES);
        }
      }

      worldMap[row][col] = tile;
    }
  }
}

// ====== SUAVIZAR EL MUNDO ======
function smoothWorldMap(iterations = 1) {
  for (let it = 0; it < iterations; it++) {
    const copy = worldMap.map(row => [...row]);

    for (let row = 1; row < WORLD_ROWS - 1; row++) {
      for (let col = 1; col < WORLD_COLS - 1; col++) {
        const current = copy[row][col];

        const up    = copy[row - 1][col];
        const down  = copy[row + 1][col];
        const left  = copy[row][col - 1];
        const right = copy[row][col + 1];

        let same = 0;
        if (up === current) same++;
        if (down === current) same++;
        if (left === current) same++;
        if (right === current) same++;

        if (same <= 1) {
          const counts = {};
          [up, down, left, right].forEach(t => {
            counts[t] = (counts[t] || 0) + 1;
          });

          let bestTile = current;
          let bestCount = 0;
          for (let t in counts) {
            if (counts[t] > bestCount) {
              bestCount = counts[t];
              bestTile = Number(t);
            }
          }

          worldMap[row][col] = bestTile;
        }
      }
    }
  }
}

// ====== LOADER DE IMÁGENES ======
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      console.log(`✅ Cargado: ${src}`);
      resolve(img);
    };
    img.onerror = (e) => {
      console.error(`❌ Error cargando: ${src}`, e);
      reject(new Error(`No se pudo cargar: ${src}`));
    };
  });
}

async function loadAssets() {
  console.log("🎨 Cargando assets...");

  try {
    // tileset del suelo
    imgTerrain = await loadImage("./assets/terrain.png");

    // sprites del player
    imgPlayer = await loadImage("./assets/player.png");

    // Grass0..Grass10
    for (let i = 0; i <= 10; i++) {
      imgGrass.push(await loadImage(`./assets/Grass${i}.png`));
    }

    // Rock0..Rock10
    for (let i = 0; i <= 10; i++) {
      imgRock.push(await loadImage(`./assets/Rock${i}.png`));
    }

    // 🔥 bala
    imgBullet = await loadImage("./assets/bullet1.png");
    BULLET_FRAMES = 4;
    BULLET_W = 16;
    BULLET_H = 16;

    // 👾 enemigos
    imgEnemyRunSD   = await loadImage("./assets/RunSD.png");
    imgEnemyRunSU   = await loadImage("./assets/RunSU.png");
    imgEnemyDeathSD = await loadImage("./assets/DeathSD.png");
    imgEnemyDeathSU = await loadImage("./assets/DeathSU.png");

    // asumimos que todos los strips tienen mismo tamaño
    ENEMY_W = imgEnemyRunSD.width / ENEMY_RUN_FRAMES;
    ENEMY_H = imgEnemyRunSD.height;

    tilesPerRow = imgTerrain.width / TILE_SIZE;

    console.log("✅ Assets cargados!");
    console.log(`   - Player: ${PLAYER_W}x${PLAYER_H}`);
    console.log(`   - Enemy: ${ENEMY_W}x${ENEMY_H}`);
    console.log(`   - Tiles por fila: ${tilesPerRow}`);
  } catch (error) {
    console.error("❌ Error fatal cargando assets:", error);
    throw error;
  }
}

// ====== GENERAR DECORACIONES ======
function generateDecorations() {
  const density = 0.03; // Reducido de 0.05 a 0.03 para menos objetos
  const grassChance = 0.7;
  const rockObstacleChance = 0.2; // Solo 20% de las rocas son obstáculos

  for (let row = 0; row < WORLD_ROWS; row++) {
    for (let col = 0; col < WORLD_COLS; col++) {
      const r = Math.random();
      if (r < density) {
        const type = Math.random() < grassChance ? "grass" : "rock";
        let variant;
        let isObstacle = false;
        let width = 16;
        let height = 16;
        let scale = 1;
        let collisionWidth = 16;
        let collisionHeight = 16;

        if (type === "grass") {
          variant = Math.floor(Math.random() * imgGrass.length);
        } else {
          variant = Math.floor(Math.random() * imgRock.length);
          // Algunas rocas son obstáculos sólidos
          isObstacle = Math.random() < rockObstacleChance;

          if (isObstacle) {
            // Las rocas obstáculo son del mismo tamaño visual (1x)
            scale = 1;
            width = 16;
            height = 16;

            // El área de colisión es MUCHO más pequeña (40% del sprite)
            // para que puedas acercarte casi completamente
            collisionWidth = Math.floor(width * 0.4);
            collisionHeight = Math.floor(height * 0.4);
          }
        }

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

// ====== PLAYER ======
function createPlayer() {
  const playerWidth = PLAYER_W * PLAYER_SCALE;
  const playerHeight = PLAYER_H * PLAYER_SCALE;

  // Posición inicial centrada
  let startX = (WORLD_COLS * TILE_SIZE) / 2 - playerWidth / 2;
  let startY = (WORLD_ROWS * TILE_SIZE) / 2 - playerHeight / 2;

  // Verificar que el jugador no aparezca en una roca
  // Si hay colisión, buscar un lugar cercano libre
  let attempts = 0;
  while (checkObstacleCollision(startX, startY, playerWidth, playerHeight) && attempts < 100) {
    // Buscar en espiral alrededor del centro
    const angle = attempts * 0.5;
    const radius = 30 + attempts * 5;
    startX = (WORLD_COLS * TILE_SIZE) / 2 - playerWidth / 2 + Math.cos(angle) * radius;
    startY = (WORLD_ROWS * TILE_SIZE) / 2 - playerHeight / 2 + Math.sin(angle) * radius;
    attempts++;
  }

  return {
    x: startX,
    y: startY,
    speed: 120,
    fireRate: 800,
    lastShot: 0,
    angle: 0,

    // Stats
    maxHp: 100,
    hp: 100,
    xp: 0,
    level: 1,
    xpToNextLevel: 10,
    damage: 1,
    bulletSpeed: 250,
    projectileCount: 1,
    bulletSpread: 0,
    critChance: 0,
    critDamage: 1.5,
    lifeSteal: 0,

    // Munición
    ammo: 5,
    maxAmmo: 5,
    isReloading: false,
    reloadTime: 2000,
    reloadStartTime: 0,

    // Explosión
    explosionRadius: 80,
    explosionDamage: 3,

    // Invulnerabilidad
    invulnerable: false,
    invulnerableTime: 0,

    // Animación
    animState: "idle",
    animTime: 0,
    width: PLAYER_W * PLAYER_SCALE,
    height: PLAYER_H * PLAYER_SCALE,
    isAttacking: false,
    alive: true
  };
}

function updatePlayer(dt) {
  if (!player || gameState !== "playing") return;

  // Recarga
  if (player.isReloading) {
    if (Date.now() - player.reloadStartTime >= player.reloadTime) {
      player.isReloading = false;
      player.ammo = player.maxAmmo;
    }
  }

  // Auto-recargar cuando se acaba la munición
  if (player.ammo <= 0 && !player.isReloading) {
    player.isReloading = true;
    player.reloadStartTime = Date.now();
  }

  // Movimiento
  let vx = 0;
  let vy = 0;

  if (keys["ArrowLeft"] || keys["KeyA"])  vx -= 1;
  if (keys["ArrowRight"] || keys["KeyD"]) vx += 1;
  if (keys["ArrowUp"] || keys["KeyW"])    vy -= 1;
  if (keys["ArrowDown"] || keys["KeyS"])  vy += 1;

  // Movimiento táctil
  if (touchInput.active) {
    const deadZone = 20; // No mover por pequeños movimientos

    if (Math.abs(touchInput.deltaX) > deadZone) {
      vx = touchInput.deltaX > 0 ? 1 : -1;
    }
    if (Math.abs(touchInput.deltaY) > deadZone) {
      vy = touchInput.deltaY > 0 ? 1 : -1;
    }
  }


  // normalizar diagonal
  if (vx !== 0 && vy !== 0) {
    const inv = 1 / Math.sqrt(2);
    vx *= inv;
    vy *= inv;
  }

  // Guardar posición anterior
  const oldX = player.x;
  const oldY = player.y;

  // Intentar movimiento completo
  const newX = player.x + vx * player.speed * dt;
  const newY = player.y + vy * player.speed * dt;

  // Verificar colisión con movimiento completo
  if (!checkObstacleCollision(newX, newY, player.width, player.height)) {
    player.x = newX;
    player.y = newY;
  } else {
    // Si hay colisión, intentar deslizarse en un solo eje
    // Intentar solo movimiento X
    if (!checkObstacleCollision(newX, oldY, player.width, player.height)) {
      player.x = newX;
    }
    // Intentar solo movimiento Y
    if (!checkObstacleCollision(oldX, newY, player.width, player.height)) {
      player.y = newY;
    }
  }

  // limitar al mundo
  const maxX = WORLD_COLS * TILE_SIZE - player.width;
  const maxY = WORLD_ROWS * TILE_SIZE - player.height;

  if (player.x < 0) player.x = 0;
  if (player.y < 0) player.y = 0;
  if (player.x > maxX) player.x = maxX;
  if (player.y > maxY) player.y = maxY;

  // Auto-apuntar hacia el enemigo más cercano
  let target = findNearestEnemy();
  if (target) {
    let dx = target.x - (player.x + player.width / 2);
    let dy = target.y - (player.y + player.height / 2);
    player.angle = Math.atan2(dy, dx);
  }

  // animación de caminar/idle
  const moving = vx !== 0 || vy !== 0;
  const newState = moving ? "walk" : "idle";

  if (newState !== player.animState && !player.isAttacking) {
    player.animState = newState;
    player.animTime = 0;
  } else {
    player.animTime += dt;
  }

  // Si está atacando
  if (player.isAttacking) {
    const attackDuration = 7 / 12; // 7 frames a 12 fps
    if (player.animTime >= attackDuration) {
      player.isAttacking = false;
      player.animTime = 0;
      player.animState = "idle";
    }
  }

  updateCamera();
}

function updateCamera() {
  if (!player) return;

  camX = player.x + player.width / 2 - canvas.width / 2;
  camY = player.y + player.height / 2 - canvas.height / 2;

  const maxCamX = WORLD_COLS * TILE_SIZE - canvas.width;
  const maxCamY = WORLD_ROWS * TILE_SIZE - canvas.height;

  camX = Math.max(0, Math.min(maxCamX, camX));
  camY = Math.max(0, Math.min(maxCamY, camY));
}

function findNearestEnemy() {
  if (enemies.length === 0 || !player) return null;

  let nearest = null;
  let minDist = Infinity;
  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;

  for (let enemy of enemies) {
    if (enemy.state === "death") continue;

    const enemyCenterX = enemy.x + (ENEMY_W * enemy.scale) / 2;
    const enemyCenterY = enemy.y + (ENEMY_H * enemy.scale) / 2;

    let dist = Math.hypot(enemyCenterX - playerCenterX, enemyCenterY - playerCenterY);
    if (dist < minDist) {
      minDist = dist;
      nearest = enemy;
    }
  }

  return nearest;
}

// ====== BALAS Y EXPLOSIONES ======
function shootBullet() {
  if (!player || gameState !== "playing") return;
  if (player.isReloading) return;
  if (player.ammo <= 0) return;

  const now = Date.now();
  if (now - player.lastShot < player.fireRate) return;

  let target = findNearestEnemy();
  if (!target) return;

  player.isAttacking = true;
  player.animState = "attack";
  player.animTime = 0;

  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;

  const targetCenterX = target.x + (ENEMY_W * target.scale) / 2;
  const targetCenterY = target.y + (ENEMY_H * target.scale) / 2;

  const dx = targetCenterX - playerCenterX;
  const dy = targetCenterY - playerCenterY;
  const baseAngle = Math.atan2(dy, dx);

  for (let i = 0; i < player.projectileCount; i++) {
    let angle = baseAngle;

    if (player.projectileCount > 1) {
      let offset = (i - (player.projectileCount - 1) / 2) * player.bulletSpread;
      angle += offset;
    }

    bullets.push({
      x: playerCenterX - BULLET_W / 2,
      y: playerCenterY - BULLET_H / 2,
      vx: Math.cos(angle) * player.bulletSpeed,
      vy: Math.sin(angle) * player.bulletSpeed,
      damage: player.damage,
      isGrenade: true,
      lifeTime: 0,
      maxLifeTime: 2.5, // segundos
      frame: 0,
      animTime: 0,
      alive: true
    });
  }

  player.ammo--;
  player.lastShot = now;

  // Sonido de disparo
  playSound('shoot');
}

function updateBullets(dt) {
  bullets.forEach(b => {
    // animación
    b.animTime += dt * 10;
    b.frame = Math.floor(b.animTime) % BULLET_FRAMES;

    // movimiento
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.lifeTime += dt;

    // Explotar si se acabó el tiempo
    if (b.lifeTime >= b.maxLifeTime && b.alive) {
      createExplosion(b.x + BULLET_W / 2, b.y + BULLET_H / 2, player.explosionRadius, player.explosionDamage);
      b.alive = false;
      return;
    }

    // Explotar al contacto con enemigo
    for (let e of enemies) {
      if (e.state === "death" || !b.alive) continue;

      const bulletCenterX = b.x + BULLET_W / 2;
      const bulletCenterY = b.y + BULLET_H / 2;
      const enemyCenterX = e.x + ENEMY_W / 2;
      const enemyCenterY = e.y + ENEMY_H / 2;

      const dist = Math.hypot(bulletCenterX - enemyCenterX, bulletCenterY - enemyCenterY);

      if (dist < (ENEMY_W / 2 + BULLET_W / 2)) {
        createExplosion(bulletCenterX, bulletCenterY, player.explosionRadius, player.explosionDamage);
        b.alive = false;
        break;
      }
    }

    // destruir si sale del mundo
    if (b.x < 0 || b.x > WORLD_COLS * TILE_SIZE ||
        b.y < 0 || b.y > WORLD_ROWS * TILE_SIZE) {
      b.alive = false;
    }
  });

  // eliminar balas muertas
  for (let i = bullets.length - 1; i >= 0; i--) {
    if (!bullets[i].alive) bullets.splice(i, 1);
  }
}

function createExplosion(x, y, radius, damage) {
  // Efecto visual
  explosions.push({
    x: x,
    y: y,
    radius: 0,
    maxRadius: radius,
    life: 1,
    color: "#ff6600"
  });

  // Partículas (muy reducidas para mejor rendimiento)
  createParticles(x, y, 5, "#ff6600");
  createParticles(x, y, 3, "#ffaa00");
  createParticles(x, y, 2, "#ffff00");

  // Screen shake
  applyScreenShake(10);

  // Sonido de explosión
  playSound('explosion');

  // Dañar enemigos
  enemies.forEach(e => {
    if (e.state === "death") return;

    const enemyCenterX = e.x + ENEMY_W / 2;
    const enemyCenterY = e.y + ENEMY_H / 2;
    const distance = Math.hypot(enemyCenterX - x, enemyCenterY - y);

    if (distance < radius) {
      let isCrit = Math.random() < player.critChance;
      let finalDamage = damage * (isCrit ? player.critDamage : 1);

      e.hp -= finalDamage;

      // Partículas muy reducidas para mejor rendimiento
      if (isCrit) {
        createParticles(e.x + ENEMY_W / 2, e.y + ENEMY_H / 2, 3, "#ffff00");
      }

      if (e.hp <= 0 && e.state !== "death") {
        e.state = "death";
        e.animTime = 0;
        e.frame = 0;
        kills++;

        // XP
        player.xp += e.xp;

        // Life steal
        if (player.lifeSteal > 0) {
          player.hp = Math.min(player.maxHp, player.hp + player.lifeSteal);
        }

        // Check level up
        if (player.xp >= player.xpToNextLevel) {
          player.level++;
          player.xp -= player.xpToNextLevel;
          player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.5);
          gameState = "levelup";
          generateUpgradeOptions();

          // Sonido de level up
          playSound('levelup');
        }
      }
    }
  });
}

function updateExplosions(dt) {
  explosions.forEach(e => {
    e.radius += (e.maxRadius - e.radius) * 0.3;
    e.life -= 1.5 * dt;
  });

  explosions = explosions.filter(e => e.life > 0);
}

// ====== ENEMIGOS ======
function getAvailableEnemyTypes() {
  return Object.values(ENEMY_TYPES).filter(type => gameTime >= type.minTime);
}

function selectRandomEnemyType(availableTypes) {
  let totalWeight = availableTypes.reduce((sum, type) => sum + type.weight, 0);
  let random = Math.random() * totalWeight;
  let weightSum = 0;

  for (let type of availableTypes) {
    weightSum += type.weight;
    if (random <= weightSum) {
      return type;
    }
  }

  return availableTypes[0];
}

function spawnEnemy() {
  if (gameState !== "playing") return;

  // OPTIMIZACIÓN: No crear más enemigos si alcanzamos el límite
  if (enemies.length >= MAX_ENEMIES) return;

  const margin = 100;
  let x, y;

  // Spawn fuera de la cámara
  const side = Math.floor(Math.random() * 4);
  if (side === 0) { // arriba
    x = camX + Math.random() * canvas.width;
    y = camY - margin;
  } else if (side === 1) { // abajo
    x = camX + Math.random() * canvas.width;
    y = camY + canvas.height + margin;
  } else if (side === 2) { // izquierda
    x = camX - margin;
    y = camY + Math.random() * canvas.height;
  } else { // derecha
    x = camX + canvas.width + margin;
    y = camY + Math.random() * canvas.height;
  }

  const availableTypes = getAvailableEnemyTypes();
  const type = selectRandomEnemyType(availableTypes);

  enemies.push({
    x,
    y,
    type: type,
    speed: type.speed * difficultyMultiplier,
    hp: type.hp * difficultyMultiplier,
    maxHp: type.hp * difficultyMultiplier,
    damage: type.damage,
    xp: type.xp,
    state: "run",
    facing: "down",
    animTime: 0,
    frame: 0,
    remove: false,
    // Añadir tamaño para escalar el sprite
    scale: type.size / 16,  // El sprite base es 16x16
    // Sistema de daño individual por enemigo
    lastHitTime: 0,
    hitCooldown: 500 // Cada enemigo puede pegar cada 0.5 segundos
  });
}

function updateEnemies(dt) {
  if (!player || gameState !== "playing") return;

  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;

  // OPTIMIZACIÓN: Área de actualización reducida para mejor rendimiento
  const updateRadius = Math.max(canvas.width, canvas.height) * 1.2;

  enemies.forEach(e => {
    if (e.state === "death") {
      const deathFps = 10;
      e.animTime += dt;
      e.frame = Math.floor(e.animTime * deathFps);

      if (e.frame >= ENEMY_DEATH_FRAMES) {
        e.remove = true;
      }
      return;
    }

    const enemyCenterX = e.x + (ENEMY_W * e.scale) / 2;
    const enemyCenterY = e.y + (ENEMY_H * e.scale) / 2;

    let dx = playerCenterX - enemyCenterX;
    let dy = playerCenterY - enemyCenterY;
    let dist = Math.hypot(dx, dy);

    // OPTIMIZACIÓN: Solo actualizar enemigos dentro del radio de actualización
    if (dist > updateRadius) {
      // Enemigo muy lejos, solo animación básica
      e.animTime += dt;
      e.frame = Math.floor(e.animTime * 8) % ENEMY_RUN_FRAMES;
      return;
    }

    if (dist > 0) {
      dx /= dist;
      dy /= dist;
    }

    e.x += dx * e.speed * dt;
    e.y += dy * e.speed * dt;

    // Dirección del sprite
    e.facing = (dy < 0) ? "up" : "down";

    // Animación
    const runFps = 8;
    e.animTime += dt;
    e.frame = Math.floor(e.animTime * runFps) % ENEMY_RUN_FRAMES;

    // Colisión con jugador - cada enemigo tiene su propio cooldown de daño
    const collisionRadius = (e.type.size / 2) + (player.width / 2);
    const now = Date.now();

    if (dist < collisionRadius) {
      // Cada enemigo puede pegar independientemente según su propio cooldown
      if (now - e.lastHitTime >= e.hitCooldown) {
        player.hp -= e.damage;
        e.lastHitTime = now;
        applyScreenShake(5);

        // Sonido de daño
        playSound('hit');

        // Crear partículas de impacto (muy reducidas)
        createParticles(
          player.x + player.width / 2,
          player.y + player.height / 2,
          2,
          "#ff0000"
        );

        if (player.hp <= 0) {
          gameState = "gameover";
          stopMusic();

          // Guardar estadísticas
          updateStats();
          updateHighScores();
          saveGameData();
        }
      }
    }
  });

  // Eliminar enemigos muertos
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].remove) enemies.splice(i, 1);
  }
}

// ====== DIFICULTAD ======
function updateDifficulty() {
  let minutes = gameTime / 60000;
  difficultyMultiplier = 1 + (minutes * 0.15);
  // Spawn más frecuente pero limitado - empieza en 1200ms y baja hasta 600ms
  enemySpawnRate = Math.max(600, 1200 - (minutes * 30));
}

// ====== UPGRADES ======
function generateUpgradeOptions() {
  currentUpgradeOptions = [];
  let availableUpgrades = [...UPGRADES];

  for (let i = 0; i < 3; i++) {
    if (availableUpgrades.length === 0) break;
    let index = Math.floor(Math.random() * availableUpgrades.length);
    currentUpgradeOptions.push(availableUpgrades[index]);
    availableUpgrades.splice(index, 1);
  }
}

// ====== RESET GAME ======
function resetGame() {
  console.log("🔄 Reiniciando juego...");

  // limpiar listas
  bullets.length = 0;
  enemies.length = 0;
  particles.length = 0;
  explosions.length = 0;
  decorations.length = 0;
  worldMap.length = 0;

  // regenerar mundo
  generateWorldMap();
  smoothWorldMap(2);
  generateDecorations();

  // crear jugador nuevo
  player = createPlayer();

  // Reset stats
  kills = 0;
  gameTime = 0;
  difficultyMultiplier = 1;
  enemySpawnRate = 800;
  enemyTimer = 0;
}

// ====== TILESET ======
function drawTile(tileIndex, colDestino, filaDestino) {
  const sx = (tileIndex % tilesPerRow) * TILE_SIZE;
  const sy = Math.floor(tileIndex / tilesPerRow) * TILE_SIZE;

  const dx = colDestino * TILE_SIZE - camX + screenShake.x;
  const dy = filaDestino * TILE_SIZE - camY + screenShake.y;

  ctx.drawImage(
    imgTerrain,
    sx, sy, TILE_SIZE, TILE_SIZE,
    dx, dy, TILE_SIZE, TILE_SIZE
  );
}

function drawMap() {
  const startCol = Math.floor(camX / TILE_SIZE);
  const startRow = Math.floor(camY / TILE_SIZE);

  const endCol = Math.ceil((camX + canvas.width) / TILE_SIZE);
  const endRow = Math.ceil((camY + canvas.height) / TILE_SIZE);

  for (let row = startRow; row < endRow; row++) {
    for (let col = startCol; col < endCol; col++) {
      if (row < 0 || col < 0 || row >= WORLD_ROWS || col >= WORLD_COLS) continue;

      const tileIndex = worldMap[row][col];
      drawTile(tileIndex, col, row);
    }
  }
}

// ====== DECORACIONES (OPTIMIZADO) ======
function drawDecorations() {
  // OPTIMIZACIÓN: Calcular rango visible una sola vez
  const minX = camX - 32;
  const maxX = camX + canvas.width + 32;
  const minY = camY - 32;
  const maxY = camY + canvas.height + 32;

  decorations.forEach(obj => {
    // Culling rápido
    if (obj.x < minX || obj.x > maxX || obj.y < minY || obj.y > maxY) {
      return;
    }

    const list = obj.type === "grass" ? imgGrass : imgRock;
    const img = list[obj.variant];
    if (!img) return;

    const dx = obj.x - camX + screenShake.x;
    const dy = obj.y - camY + screenShake.y;

    // Efecto visual para rocas obstáculo - SIMPLIFICADO Y CON CACHE
    if (obj.isObstacle && obj.type === "rock") {
      const cacheKey = `rock_${obj.variant}`;

      // Verificar si ya está en cache
      if (!tintedRocksCache[cacheKey]) {
        // Crear canvas temporal para aplicar tinte rojo oscuro
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext('2d');

        // Dibujar imagen original
        tempCtx.drawImage(img, 0, 0);

        // Aplicar tinte rojo oscuro para distinguir obstáculos
        tempCtx.globalCompositeOperation = 'multiply';
        tempCtx.fillStyle = '#884444'; // Rojo oscuro
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // Restaurar alpha
        tempCtx.globalCompositeOperation = 'destination-in';
        tempCtx.drawImage(img, 0, 0);

        // Guardar en cache
        tintedRocksCache[cacheKey] = tempCanvas;
      }

      // Dibujar la roca desde el cache, escalada
      ctx.drawImage(tintedRocksCache[cacheKey], 0, 0, img.width, img.height, dx, dy, obj.width, obj.height);
    } else {
      // Rocas normales (decorativas)
      ctx.drawImage(img, dx, dy);
    }
  });
}

// ====== DIBUJAR PLAYER ======
function drawPlayer() {
  if (!imgPlayer || !player) return;

  const animations = {
    idle:   { row: 0, frames: 6,  fps: 6  },
    walk:   { row: 1, frames: 8,  fps: 10 },
    attack: { row: 3, frames: 7,  fps: 12 },
    death:  { row: 6, frames: 10, fps: 12 }
  };

  const anim = animations[player.animState] || animations.idle;

  let frame = Math.floor(player.animTime * anim.fps) % anim.frames;

  const sx = frame * PLAYER_W;
  const sy = anim.row * PLAYER_H;

  const dx = Math.round(player.x - camX + screenShake.x);
  const dy = Math.round(player.y - camY + screenShake.y);

  const scaledW = PLAYER_W * PLAYER_SCALE;
  const scaledH = PLAYER_H * PLAYER_SCALE;

  // NO rotar el sprite del jugador, siempre dibujarlo parado
  ctx.drawImage(
    imgPlayer,
    sx, sy, PLAYER_W, PLAYER_H,
    dx, dy, scaledW, scaledH
  );
}

// ====== DIBUJAR BALAS ======
function drawBullets() {
  if (!imgBullet) return;

  // OPTIMIZACIÓN: Culling de balas fuera de pantalla
  const margin = 20;
  const minX = camX - margin;
  const maxX = camX + canvas.width + margin;
  const minY = camY - margin;
  const maxY = camY + canvas.height + margin;

  bullets.forEach(b => {
    // Skip balas fuera de pantalla
    if (b.x < minX || b.x > maxX || b.y < minY || b.y > maxY) {
      return;
    }

    const sx = b.frame * BULLET_W;
    const sy = 0;

    const dx = b.x - camX + screenShake.x;
    const dy = b.y - camY + screenShake.y;

    ctx.save();
    ctx.translate(dx + BULLET_W / 2, dy + BULLET_H / 2);
    ctx.rotate(Math.atan2(b.vy, b.vx));

    // SIN shadowBlur para mejor rendimiento
    ctx.drawImage(
      imgBullet,
      sx, sy, BULLET_W, BULLET_H,
      -BULLET_W / 2, -BULLET_H / 2,
      BULLET_W, BULLET_H
    );

    ctx.restore();
  });
}

// ====== DIBUJAR EXPLOSIONES ======
function drawExplosions() {
  // OPTIMIZACIÓN: Culling de explosiones
  const margin = 100;
  const minX = camX - margin;
  const maxX = camX + canvas.width + margin;
  const minY = camY - margin;
  const maxY = camY + canvas.height + margin;

  explosions.forEach(e => {
    // Skip explosiones fuera de pantalla
    if (e.x < minX || e.x > maxX || e.y < minY || e.y > maxY) {
      return;
    }

    ctx.globalAlpha = e.life;

    const dx = e.x - camX + screenShake.x;
    const dy = e.y - camY + screenShake.y;

    // Gradiente
    let gradient = ctx.createRadialGradient(dx, dy, 0, dx, dy, e.radius);
    gradient.addColorStop(0, "#ffff00");
    gradient.addColorStop(0.3, "#ff6600");
    gradient.addColorStop(0.7, "#ff3300");
    gradient.addColorStop(1, "rgba(255, 0, 0, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(dx, dy, e.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
  });
}

// ====== DIBUJAR ENEMIGOS (OPTIMIZADO) ======
function drawEnemies() {
  // Encontrar enemigo más cercano para marcarlo
  const nearestEnemy = findNearestEnemy();

  // Área visible con margen
  const visibleMargin = 50;
  const minX = camX - visibleMargin;
  const maxX = camX + canvas.width + visibleMargin;
  const minY = camY - visibleMargin;
  const maxY = camY + canvas.height + visibleMargin;

  enemies.forEach(e => {
    // CULLING: Solo dibujar enemigos dentro del área visible
    const scaledW = ENEMY_W * e.scale;
    const scaledH = ENEMY_H * e.scale;

    if (e.x + scaledW < minX || e.x > maxX || e.y + scaledH < minY || e.y > maxY) {
      return; // Skip enemigos fuera de pantalla
    }

    let img;
    let frameCount;
    let frame = e.frame;
    let tintedImg = null;

    if (e.state === "death") {
      frameCount = ENEMY_DEATH_FRAMES;
      if (frame >= frameCount) frame = frameCount - 1;
      img = (e.facing === "up") ? imgEnemyDeathSU : imgEnemyDeathSD;
    } else {
      frameCount = ENEMY_RUN_FRAMES;
      frame = frame % frameCount;
      img = (e.facing === "up") ? imgEnemyRunSU : imgEnemyRunSD;

      // Usar sprite cacheado con tint
      if (e.type.tint) {
        tintedImg = getTintedSprite(
          img, 0, 0, ENEMY_W, ENEMY_H,
          e.type.color, e.facing, e.type.name
        );
      }
    }

    const sx = frame * ENEMY_W;
    const sy = 0;

    const dx = e.x - camX + screenShake.x;
    const dy = e.y - camY + screenShake.y;

    // Indicador de objetivo
    if (e === nearestEnemy && e.state !== "death") {
      ctx.strokeStyle = "#ffff00";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(dx + scaledW / 2, dy + scaledH / 2, scaledW / 2 + 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Dibujar sprite (con o sin tint)
    if (tintedImg) {
      ctx.drawImage(
        tintedImg,
        sx, sy, ENEMY_W, ENEMY_H,
        dx, dy, scaledW, scaledH
      );
    } else {
      ctx.drawImage(
        img,
        sx, sy, ENEMY_W, ENEMY_H,
        dx, dy, scaledW, scaledH
      );
    }

    // Barra de HP solo si está dañado (optimización)
    if (e.hp < e.maxHp && e.state !== "death") {
      const barWidth = scaledW;
      const barHeight = 3;
      const barX = dx;
      const barY = dy - 8;

      ctx.fillStyle = "#000";
      ctx.fillRect(barX, barY, barWidth, barHeight);

      ctx.fillStyle = "#00ff00";
      ctx.fillRect(barX, barY, barWidth * (e.hp / e.maxHp), barHeight);
    }
  });
}

// ====== HUD ======
function drawHUD() {
  if (gameState !== "playing" || !player) return;

  const padding = 20;
  const barHeight = 30;
  const barSpacing = 10;

  // Colores para modo alto contraste
  const primaryColor = highContrastMode ? "#ffff00" : "#4ecdc4";
  const textColor = highContrastMode ? "#000000" : "#ffffff";
  const bgColor = highContrastMode ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.7)";

  // ===== BARRA DE NIVEL (SUPERIOR CENTRO) =====
  const levelBarWidth = 400;
  const levelBarX = (canvas.width - levelBarWidth) / 2;
  const levelBarY = padding;

  // Fondo de la barra de nivel
  ctx.fillStyle = bgColor;
  roundRect(ctx, levelBarX, levelBarY, levelBarWidth, barHeight, 5);
  ctx.fill();

  // Progreso del nivel
  const levelProgress = player.xp / player.xpToNextLevel;
  ctx.fillStyle = primaryColor;
  if (levelProgress > 0) {
    const progressWidth = (levelBarWidth - 4) * levelProgress;
    ctx.fillRect(levelBarX + 2, levelBarY + 2, progressWidth, barHeight - 4);
  }

  // Borde
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 2;
  roundRect(ctx, levelBarX, levelBarY, levelBarWidth, barHeight, 5);
  ctx.stroke();

  // Texto del nivel (centrado)
  ctx.fillStyle = textColor;
  ctx.font = "bold 18px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`LEVEL ${player.level}`, levelBarX + levelBarWidth / 2, levelBarY + 21);

  // ===== BARRA DE VIDA (DEBAJO DEL NIVEL, IZQUIERDA) =====
  const healthBarWidth = 250;
  const healthBarX = levelBarX;
  const healthBarY = levelBarY + barHeight + barSpacing;

  // Fondo
  ctx.fillStyle = bgColor;
  roundRect(ctx, healthBarX, healthBarY, healthBarWidth, barHeight, 5);
  ctx.fill();

  // Progreso de vida
  const hpPercent = Math.max(0, Math.min(1, player.hp / player.maxHp));
  if (highContrastMode) {
    ctx.fillStyle = "#000000"; // Negro en modo alto contraste
  } else {
    ctx.fillStyle = hpPercent > 0.5 ? "#00ff00" : (hpPercent > 0.25 ? "#ffaa00" : "#ff0000");
  }
  if (hpPercent > 0) {
    const hpWidth = (healthBarWidth - 4) * hpPercent;
    ctx.fillRect(healthBarX + 2, healthBarY + 2, hpWidth, barHeight - 4);
  }

  // Borde
  ctx.strokeStyle = highContrastMode ? "#000000" : "#555";
  ctx.lineWidth = 2;
  roundRect(ctx, healthBarX, healthBarY, healthBarWidth, barHeight, 5);
  ctx.stroke();

  // Texto de HP
  ctx.fillStyle = textColor;
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`HP: ${Math.ceil(player.hp)} / ${player.maxHp}`, healthBarX + healthBarWidth / 2, healthBarY + 20);

  // ===== BARRA DE RECARGA (AL LADO DE LA VIDA, DERECHA) =====
  const reloadBarWidth = 130;
  const reloadBarX = healthBarX + healthBarWidth + barSpacing;
  const reloadBarY = healthBarY;

  // Fondo
  ctx.fillStyle = bgColor;
  roundRect(ctx, reloadBarX, reloadBarY, reloadBarWidth, barHeight, 5);
  ctx.fill();

  // Mostrar munición o progreso de recarga
  if (player.isReloading) {
    const reloadProgress = Math.min(1, (Date.now() - player.reloadStartTime) / player.reloadTime);
    ctx.fillStyle = highContrastMode ? "#000000" : "#ff6600";
    if (reloadProgress > 0) {
      const reloadWidth = (reloadBarWidth - 4) * reloadProgress;
      ctx.fillRect(reloadBarX + 2, reloadBarY + 2, reloadWidth, barHeight - 4);
    }
  }

  // Borde
  ctx.strokeStyle = highContrastMode ? "#000000" : "#555";
  ctx.lineWidth = 2;
  roundRect(ctx, reloadBarX, reloadBarY, reloadBarWidth, barHeight, 5);
  ctx.stroke();

  // Texto de munición
  ctx.fillStyle = textColor;
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";
  if (player.isReloading) {
    ctx.fillText("RELOADING...", reloadBarX + reloadBarWidth / 2, reloadBarY + 20);
  } else {
    ctx.fillText(`AMMO: ${player.ammo}/${player.maxAmmo}`, reloadBarX + reloadBarWidth / 2, reloadBarY + 20);
  }

  // ===== INFORMACIÓN ADICIONAL (ESQUINA SUPERIOR DERECHA) =====
  ctx.textAlign = "right";

  // Timer
  let timeLeft = Math.max(0, survivalTime - gameTime);
  let minutes = Math.floor(timeLeft / 60000);
  let seconds = Math.floor((timeLeft % 60000) / 1000);
  const timerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  ctx.font = "bold 24px Arial";
  if (highContrastMode) {
    ctx.fillStyle = "#000000";
  } else {
    ctx.fillStyle = timeLeft < 60000 ? "#ff3333" : "#fff";
  }
  ctx.fillText(timerText, canvas.width - padding, 35);

  // Kills
  ctx.fillText(`Kills: ${kills}`, canvas.width - padding, 65);

  // FPS
  ctx.font = "bold 12px Arial";
  if (highContrastMode) {
    ctx.fillStyle = "#000000";
  } else {
    ctx.fillStyle = fps < 30 ? "#ff3333" : (fps < 50 ? "#ffaa00" : "#00ff00");
  }
  ctx.fillText(`FPS: ${fps}`, canvas.width - padding, 95);

  // Enemy count
  ctx.fillStyle = highContrastMode ? "#000000" : (enemies.length >= MAX_ENEMIES ? "#ff3333" : "#aaa");
  ctx.fillText(`Enemies: ${enemies.length}/${MAX_ENEMIES}`, canvas.width - padding, 115);

  // ===== BOTONES DE ACCESIBILIDAD (ABAJO DERECHA) =====
  const btnSize = 35;
  const btnPadding = 5;
  const btnY = canvas.height - btnSize - padding;

  // Botón de Mute
  const muteX = canvas.width - padding - btnSize;
  ctx.fillStyle = audioMuted ? "rgba(255, 100, 100, 0.8)" : "rgba(78, 205, 196, 0.8)";
  roundRect(ctx, muteX, btnY, btnSize, btnSize, 5);
  ctx.fill();

  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  roundRect(ctx, muteX, btnY, btnSize, btnSize, 5);
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.font = "bold 18px Arial";
  ctx.textAlign = "center";
  ctx.fillText(audioMuted ? "🔇" : "🔊", muteX + btnSize / 2, btnY + btnSize / 2 + 6);

  // Botón de Alto Contraste
  const contrastX = muteX - btnSize - btnPadding;
  ctx.fillStyle = highContrastMode ? "rgba(255, 255, 0, 0.8)" : "rgba(100, 100, 100, 0.8)";
  roundRect(ctx, contrastX, btnY, btnSize, btnSize, 5);
  ctx.fill();

  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  roundRect(ctx, contrastX, btnY, btnSize, btnSize, 5);
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.font = "bold 16px Arial";
  ctx.fillText("◐", contrastX + btnSize / 2, btnY + btnSize / 2 + 6);

  // Botón de Ayuda
  const helpX = contrastX - btnSize - btnPadding;
  ctx.fillStyle = showControlsScreen ? "rgba(255, 230, 109, 0.8)" : "rgba(100, 100, 100, 0.8)";
  roundRect(ctx, helpX, btnY, btnSize, btnSize, 5);
  ctx.fill();

  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  roundRect(ctx, helpX, btnY, btnSize, btnSize, 5);
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.font = "bold 20px Arial";
  ctx.fillText("?", helpX + btnSize / 2, btnY + btnSize / 2 + 7);

  ctx.textAlign = "left";
}

// ====== PANTALLA DE CONTROLES ======
function drawControlsScreen() {
  // Overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Panel
  const panelWidth = 500;
  const panelHeight = 480;
  const panelX = (canvas.width - panelWidth) / 2;
  const panelY = (canvas.height - panelHeight) / 2;

  ctx.fillStyle = "rgba(15, 15, 26, 0.95)";
  roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 15);
  ctx.fill();

  ctx.strokeStyle = "#4ecdc4";
  ctx.lineWidth = 3;
  roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 15);
  ctx.stroke();

  // Título
  ctx.fillStyle = "#4ecdc4";
  ctx.font = "bold 32px Arial";
  ctx.textAlign = "center";
  ctx.fillText("CONTROLES", canvas.width / 2, panelY + 50);

  // Controles
  ctx.font = "18px Arial";
  ctx.fillStyle = "#fff";
  let y = panelY + 100;
  const lineHeight = 35;

  Object.values(controlsInfo).forEach(control => {
    ctx.textAlign = "left";
    ctx.fillText("•", panelX + 40, y);
    ctx.fillText(control, panelX + 60, y);
    y += lineHeight;
  });

  // Objetivo del juego
  ctx.fillStyle = "#ffe66d";
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "center";
  ctx.fillText("OBJETIVO", canvas.width / 2, panelY + 330);

  ctx.fillStyle = "#aaa";
  ctx.font = "16px Arial";
  ctx.fillText("Sobrevive 20 minutos eliminando enemigos", canvas.width / 2, panelY + 360);
  ctx.fillText("Sube de nivel y mejora tus habilidades", canvas.width / 2, panelY + 385);

  // Instrucción para cerrar
  ctx.fillStyle = "#999";
  ctx.font = "14px Arial";
  ctx.fillText("Presiona H o ESC para cerrar", canvas.width / 2, panelY + panelHeight - 20);

  ctx.textAlign = "left";
}

// ====== MENÚS ======
function drawMenu() {
  ctx.fillStyle = "#0f0f1a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#4ecdc4";
  ctx.font = "bold 36px Arial";
  ctx.textAlign = "center";
  ctx.fillText("SURVIVE 20 MINUTES", canvas.width / 2, canvas.height / 2 - 60);

  ctx.fillStyle = "#fff";
  ctx.font = "20px Arial";
  ctx.fillText("Click to Start", canvas.width / 2, canvas.height / 2);

  ctx.font = "14px Arial";
  ctx.fillStyle = "#999";
  ctx.fillText("WASD - Move | SPACE - Shoot | ESC - Pause | H - Help", canvas.width / 2, canvas.height - 30);

  ctx.textAlign = "left";
}

function drawPaused() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#4ecdc4";
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2 - 20);

  ctx.fillStyle = "#fff";
  ctx.font = "18px Arial";
  ctx.fillText("Press ESC to continue", canvas.width / 2, canvas.height / 2 + 20);

  ctx.textAlign = "left";
}

function drawLevelUp() {
  // Overlay sutil para oscurecer el fondo
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Panel central para las cartas
  const panelWidth = 720;
  const panelHeight = 350;
  const panelX = (canvas.width - panelWidth) / 2;
  const panelY = (canvas.height - panelHeight) / 2;

  // Fondo del panel - SIN shadowBlur para mejor rendimiento
  ctx.fillStyle = "rgba(15, 15, 26, 0.95)";
  roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 15);
  ctx.fill();

  // Borde brillante
  ctx.strokeStyle = "#4ecdc4";
  ctx.lineWidth = 3;
  roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 15);
  ctx.stroke();

  // Título - SIN shadowBlur
  ctx.fillStyle = "#ffe66d";
  ctx.font = "bold 38px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`LEVEL ${player.level} UP!`, canvas.width / 2, panelY + 55);

  ctx.fillStyle = "#aaa";
  ctx.font = "16px Arial";
  ctx.fillText("Choose an upgrade:", canvas.width / 2, panelY + 85);

  // Cartas de upgrade
  const cardWidth = 200;
  const cardHeight = 180;
  const spacing = 20;
  const totalWidth = (cardWidth * 3) + (spacing * 2);
  const startX = (canvas.width - totalWidth) / 2;
  const cardY = panelY + 120;

  currentUpgradeOptions.forEach((upgrade, i) => {
    const x = startX + i * (cardWidth + spacing);
    const y = cardY;

    const isHovering = mousePos.x > x && mousePos.x < x + cardWidth &&
                      mousePos.y > y && mousePos.y < y + cardHeight;

    // Efecto de hover - carta se eleva
    const offsetY = isHovering ? -5 : 0;
    const cardYPos = y + offsetY;

    // Fondo de la carta
    ctx.fillStyle = isHovering ? "rgba(42, 42, 62, 0.95)" : "rgba(31, 31, 46, 0.9)";
    roundRect(ctx, x, cardYPos, cardWidth, cardHeight, 10);
    ctx.fill();

    // Borde de la carta
    ctx.strokeStyle = isHovering ? "#4ecdc4" : "#555";
    ctx.lineWidth = isHovering ? 4 : 2;
    roundRect(ctx, x, cardYPos, cardWidth, cardHeight, 10);
    ctx.stroke();

    // Icono/indicador superior
    ctx.fillStyle = isHovering ? "#4ecdc4" : "#555";
    ctx.beginPath();
    ctx.arc(x + cardWidth / 2, cardYPos + 30, 12, 0, Math.PI * 2);
    ctx.fill();

    // Nombre del upgrade
    ctx.fillStyle = isHovering ? "#4ecdc4" : "#fff";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    const lines = wrapText(upgrade.name, cardWidth - 20);
    lines.forEach((line, idx) => {
      ctx.fillText(line, x + cardWidth / 2, cardYPos + 65 + idx * 20);
    });

    // Descripción
    ctx.fillStyle = "#ccc";
    ctx.font = "13px Arial";
    const descLines = wrapText(upgrade.description, cardWidth - 30);
    descLines.forEach((line, idx) => {
      ctx.fillText(line, x + cardWidth / 2, cardYPos + 110 + idx * 18);
    });

    // Indicador de "Click to select"
    if (isHovering) {
      ctx.fillStyle = "#4ecdc4";
      ctx.font = "bold 12px Arial";
      ctx.fillText("CLICK TO SELECT", x + cardWidth / 2, cardYPos + cardHeight - 15);
    }
  });

  ctx.textAlign = "left";
}

function drawGameOver() {
  ctx.fillStyle = "rgba(60, 0, 0, 0.95)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ff3333";
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 120);

  // Stats de esta partida
  ctx.fillStyle = "#fff";
  ctx.font = "bold 20px Arial";
  ctx.fillText("Your Stats:", canvas.width / 2, canvas.height / 2 - 70);

  ctx.font = "18px Arial";
  let minutes = Math.floor(gameTime / 60000);
  let seconds = Math.floor((gameTime % 60000) / 1000);
  ctx.fillText(`Survived: ${minutes}:${seconds.toString().padStart(2, '0')}`, canvas.width / 2, canvas.height / 2 - 40);
  ctx.fillText(`Kills: ${kills}`, canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillText(`Level: ${player.level}`, canvas.width / 2, canvas.height / 2 + 20);

  // High Scores
  ctx.fillStyle = "#ffe66d";
  ctx.font = "bold 18px Arial";
  ctx.fillText("Best Records:", canvas.width / 2, canvas.height / 2 + 60);

  ctx.fillStyle = "#4ecdc4";
  ctx.font = "14px Arial";
  let bestMin = Math.floor(gameData.highScores.longestSurvival / 60000);
  let bestSec = Math.floor((gameData.highScores.longestSurvival % 60000) / 1000);
  ctx.fillText(`Best Time: ${bestMin}:${bestSec.toString().padStart(2, '0')}`, canvas.width / 2, canvas.height / 2 + 85);
  ctx.fillText(`Most Kills: ${gameData.highScores.mostKills}`, canvas.width / 2, canvas.height / 2 + 105);
  ctx.fillText(`Highest Level: ${gameData.highScores.highestLevel}`, canvas.width / 2, canvas.height / 2 + 125);

  ctx.fillStyle = "#999";
  ctx.font = "14px Arial";
  ctx.fillText("Click to return to menu", canvas.width / 2, canvas.height / 2 + 160);

  ctx.textAlign = "left";
}

function drawVictory() {
  ctx.fillStyle = "rgba(0, 60, 0, 0.95)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#00ff00";
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("VICTORY!", canvas.width / 2, canvas.height / 2 - 120);

  ctx.fillStyle = "#ffe66d";
  ctx.font = "20px Arial";
  ctx.fillText(`You survived 20 minutes!`, canvas.width / 2, canvas.height / 2 - 70);

  // Stats de esta partida
  ctx.fillStyle = "#fff";
  ctx.font = "18px Arial";
  ctx.fillText(`Kills: ${kills}`, canvas.width / 2, canvas.height / 2 - 30);
  ctx.fillText(`Final Level: ${player.level}`, canvas.width / 2, canvas.height / 2);

  // High Scores
  ctx.fillStyle = "#ffe66d";
  ctx.font = "bold 18px Arial";
  ctx.fillText("Best Records:", canvas.width / 2, canvas.height / 2 + 45);

  ctx.fillStyle = "#4ecdc4";
  ctx.font = "14px Arial";
  ctx.fillText(`Most Kills: ${gameData.highScores.mostKills}`, canvas.width / 2, canvas.height / 2 + 70);
  ctx.fillText(`Highest Level: ${gameData.highScores.highestLevel}`, canvas.width / 2, canvas.height / 2 + 90);

  // Total stats
  ctx.fillStyle = "#aaa";
  ctx.font = "12px Arial";
  ctx.fillText(`Total Games Played: ${gameData.stats.totalGames}`, canvas.width / 2, canvas.height / 2 + 120);
  ctx.fillText(`Total Kills: ${gameData.stats.totalKills}`, canvas.width / 2, canvas.height / 2 + 135);

  ctx.fillStyle = "#999";
  ctx.font = "14px Arial";
  ctx.fillText("Click to return to menu", canvas.width / 2, canvas.height / 2 + 165);

  ctx.textAlign = "left";
}

// === CONTROLES TÁCTILES PARA MÓVIL ===
if (isTouchDevice) {
  canvas.addEventListener("touchstart", (e) => {
    // En menús / upgrades / game over: DEJAR que se genere el click
    if (gameState !== "playing") {
      return;
    }

    // En juego sí bloqueamos el comportamiento por defecto
    e.preventDefault();

    if (loadError || isLoading) return;

    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    const x = t.clientX - rect.left;
    const y = t.clientY - rect.top;

    const mitad = canvas.width / 2;

    // 👉 TAP EN EL LADO DERECHO = DISPARAR
    if (x > mitad) {
      shootBullet();
      return;
    }

    // 👉 LADO IZQUIERDO = JOYSTICK DE MOVIMIENTO
    touchInput.active = true;
    touchInput.startX = x;
    touchInput.startY = y;
    touchInput.deltaX = 0;
    touchInput.deltaY = 0;
  }, { passive: false });

  canvas.addEventListener("touchmove", (e) => {
    if (gameState !== "playing") return;
    if (!touchInput.active) return;

    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    const x = t.clientX - rect.left;
    const y = t.clientY - rect.top;

    touchInput.deltaX = x - touchInput.startX;
    touchInput.deltaY = y - touchInput.startY;
  }, { passive: false });

  canvas.addEventListener("touchend", (e) => {
    if (gameState !== "playing") {
      // En menús, dejamos que ese touch genere el click
      return;
    }

    e.preventDefault();

    touchInput.active = false;
    touchInput.deltaX = 0;
    touchInput.deltaY = 0;
  }, { passive: false });
}

// ====== INPUT EVENTS ======
window.addEventListener("keydown", e => {
  if (e.code === "Escape") {
    // Si la pantalla de ayuda está abierta, cerrarla primero
    if (showControlsScreen) {
      showControlsScreen = false;
      console.log("📖 Controles ocultados");
      return;
    }

    if (gameState === "playing") {
      gameState = "paused";
    } else if (gameState === "paused") {
      gameState = "playing";
    }
  }

  if (e.code === "Space") {
    e.preventDefault();
    shootBullet();
  }

  // Accesibilidad - Teclas M, C, H
  if (e.code === "KeyM") {
    toggleMute();
  }

  if (e.code === "KeyC") {
    toggleHighContrast();
  }

  if (e.code === "KeyH") {
    if (gameState === "playing" || gameState === "paused") {
      showControlsScreen = !showControlsScreen;
      console.log(showControlsScreen ? "📖 Controles mostrados" : "📖 Controles ocultados");
    }
  }

  keys[e.code] = true;
});

window.addEventListener("keyup", e => {
  keys[e.code] = false;
});

canvas.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  mousePos.x = e.clientX - rect.left;
  mousePos.y = e.clientY - rect.top;
});

canvas.addEventListener("click", e => {
  // No permitir clicks si hay error de carga
  if (loadError) {
    console.log("❌ No se puede iniciar el juego debido a errores de carga");
    return;
  }

  // No permitir clicks mientras carga
  if (isLoading) {
    console.log("⏳ Espera a que termine de cargar...");
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  console.log(`🖱️ Click detectado en (${mx}, ${my}), estado: ${gameState}`);

  // Check si hizo click en los botones de accesibilidad (cuando está jugando)
  if (gameState === "playing") {
    const padding = 20;
    const btnSize = 35;
    const btnPadding = 5;
    const btnY = canvas.height - btnSize - padding;

    // Botón de Mute (derecha)
    const muteX = canvas.width - padding - btnSize;
    if (mx >= muteX && mx <= muteX + btnSize && my >= btnY && my <= btnY + btnSize) {
      toggleMute();
      return;
    }

    // Botón de Contraste (izquierda del mute)
    const contrastX = muteX - btnSize - btnPadding;
    if (mx >= contrastX && mx <= contrastX + btnSize && my >= btnY && my <= btnY + btnSize) {
      toggleHighContrast();
      return;
    }

    // Botón de Ayuda (izquierda del contraste)
    const helpX = contrastX - btnSize - btnPadding;
    if (mx >= helpX && mx <= helpX + btnSize && my >= btnY && my <= btnY + btnSize) {
      showControlsScreen = !showControlsScreen;
      console.log(showControlsScreen ? "📖 Controles mostrados" : "📖 Controles ocultados");
      return;
    }
  }




  if (gameState === "menu") {
    console.log("🎮 Iniciando juego...");
    resetGame();
    gameState = "playing";
    startTime = Date.now();

    // Iniciar música
    playMusic();
  } else if (gameState === "levelup") {
    // Check si hizo click en alguna carta de upgrade
    const panelWidth = 720;
    const panelHeight = 350;
    const panelY = (canvas.height - panelHeight) / 2;

    const cardWidth = 200;
    const cardHeight = 180;
    const spacing = 20;
    const totalWidth = (cardWidth * 3) + (spacing * 2);
    const startX = (canvas.width - totalWidth) / 2;
    const cardY = panelY + 120;

    currentUpgradeOptions.forEach((upgrade, i) => {
      const x = startX + i * (cardWidth + spacing);
      if (mx > x && mx < x + cardWidth && my > cardY && my < cardY + cardHeight) {
        upgrade.apply();
        gameState = "playing";
      }
    });
  } else if (gameState === "gameover" || gameState === "victory") {
    gameState = "menu";
  }
});

// ====== GAME LOOP ======
let lastTime = 0;
let fps = 60;
let fpsFrames = 0;
let fpsTime = 0;

function update(dt) {
  if (gameState === "playing") {
    gameTime += dt * 1000;

    // Check victoria
    if (gameTime >= survivalTime) {
      gameState = "victory";
      stopMusic();

      // Guardar estadísticas
      updateStats();
      updateHighScores();
      saveGameData();

      return;
    }

    updatePlayer(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateParticles(dt);
    updateExplosions(dt);
    updateDifficulty();
    updateScreenShake();

    // Spawn enemigos - cantidad reducida para mejor rendimiento
    const now = Date.now();
    if (now - enemyTimer > enemySpawnRate) {
      // Empieza con 2, +1 cada 2 minutos (más lento)
      let spawnCount = Math.floor(2 + (gameTime / 120000));
      for (let i = 0; i < spawnCount; i++) {
        spawnEnemy();
      }
      enemyTimer = now;
    }
  }
}

function draw() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (gameState === "menu") {
    drawMenu();
  } else if (gameState === "playing" || gameState === "paused" || gameState === "levelup") {
    drawMap();
    drawDecorations();
    drawEnemies();
    drawExplosions();
    drawBullets();
    drawParticles();
    drawPlayer();
    drawHUD();

    if (gameState === "paused") {
      drawPaused();
    } else if (gameState === "levelup") {
      drawLevelUp();
    }

    // Pantalla de ayuda (se muestra encima de todo)
    if (showControlsScreen) {
      drawControlsScreen();
    }
  } else if (gameState === "gameover") {
    drawGameOver();
  } else if (gameState === "victory") {
    drawVictory();
  }
}

function loop(timestamp) {
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  // Calcular FPS
  fpsFrames++;
  fpsTime += dt;
  if (fpsTime >= 1) {
    fps = Math.round(fpsFrames / fpsTime);
    fpsFrames = 0;
    fpsTime = 0;
  }

  if (dt < 0.1) { // Evitar saltos grandes de tiempo
    update(dt);
  }

  draw();

  requestAnimationFrame(loop);
}

// ====== INICIO ======
let isLoading = true;
let loadError = null;

// Mostrar pantalla de carga
function drawLoading() {
  ctx.fillStyle = "#0f0f1a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#4ecdc4";
  ctx.font = "bold 32px Arial";
  ctx.textAlign = "center";
  ctx.fillText("LOADING...", canvas.width / 2, canvas.height / 2);

  ctx.fillStyle = "#fff";
  ctx.font = "16px Arial";
  ctx.fillText("Cargando assets...", canvas.width / 2, canvas.height / 2 + 40);

  ctx.textAlign = "left";
}

// Mostrar pantalla de error
function drawError(error) {
  ctx.fillStyle = "#0f0f1a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ff3333";
  ctx.font = "bold 32px Arial";
  ctx.textAlign = "center";
  ctx.fillText("ERROR", canvas.width / 2, canvas.height / 2 - 40);

  ctx.fillStyle = "#fff";
  ctx.font = "16px Arial";
  ctx.fillText("No se pudieron cargar los assets", canvas.width / 2, canvas.height / 2);
  ctx.fillText("Abre la consola (F12) para más detalles", canvas.width / 2, canvas.height / 2 + 30);

  ctx.fillStyle = "#999";
  ctx.font = "14px Arial";
  ctx.fillText(error.message, canvas.width / 2, canvas.height / 2 + 70);

  ctx.textAlign = "left";
}

(async function start() {
  console.log("🎮 Iniciando juego...");

  // Mostrar pantalla de carga
  drawLoading();

  try {
    await loadAssets();
    generateWorldMap();
    smoothWorldMap(2);
    generateDecorations();

    // Cargar audio
    loadAudio();

    // Cargar datos guardados
    loadGameData();

    isLoading = false;
    console.log("🎮 ¡Juego listo! Haz clic para comenzar.");
    requestAnimationFrame(loop);
  } catch (error) {
    console.error("❌ Error fatal:", error);
    isLoading = false;
    loadError = error;
    drawError(error);
  }
})();
