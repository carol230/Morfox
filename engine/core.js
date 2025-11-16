/**
 * ====== CONFIGURACIÓN BÁSICA ======
 * Módulo Core: Configuración inicial del juego, variables globales y funciones auxiliares
 * Este archivo contiene toda la configuración base del motor del juego
 */

/**
 * Referencia al elemento canvas HTML donde se dibuja el juego
 * @type {HTMLCanvasElement}
 */
const canvas = document.getElementById("game");

/**
 * Contexto 2D del canvas para operaciones de dibujo
 * @type {CanvasRenderingContext2D}
 */
const ctx = canvas.getContext("2d");

// Tamaño fijo del canvas para mejor rendimiento
// canvas.width = 1280;
// canvas.height = 720;

/**
 * Detectar si el dispositivo tiene capacidades táctiles (móvil/tablet)
 * Utiliza múltiples métodos para máxima compatibilidad entre navegadores
 * @type {boolean}
 */
const isTouchDevice =
  "ontouchstart" in window ||
  navigator.maxTouchPoints > 0 ||
  navigator.msMaxTouchPoints > 0;

/**
 * Configuración adaptativa del tamaño del canvas
 * En móviles usa menor resolución (960x540) para mejor rendimiento
 * En desktop usa resolución completa (1280x720) para mejor calidad
 */
if (isTouchDevice) {
  canvas.width = 960;   // Resolución móvil (25% menos píxeles)
  canvas.height = 540;
} else {
  canvas.width = 1280;  // Resolución desktop
  canvas.height = 720;
}

/**
 * Tamaño de cada tile del mundo en píxeles
 * @constant {number}
 */
const TILE_SIZE = 16;

/**
 * Número de columnas del mundo (100 tiles × 16px = 1600px de ancho)
 * @constant {number}
 */
const WORLD_COLS = 100;

/**
 * Número de filas del mundo (100 tiles × 16px = 1600px de alto)
 * @constant {number}
 */
const WORLD_ROWS = 100;

/**
 * Posición X de la cámara en el mundo (en píxeles)
 * Determina qué parte horizontal del mundo es visible
 * @type {number}
 */
let camX = 0;

/**
 * Posición Y de la cámara en el mundo (en píxeles)
 * Determina qué parte vertical del mundo es visible
 * @type {number}
 */
let camY = 0;

/**
 * ====== ESTADO DEL JUEGO ======
 * Variables que controlan el flujo y estado global del juego
 */

/**
 * Estado actual del juego (máquina de estados)
 * Valores posibles: "menu", "playing", "paused", "levelup", "gameover", "victory"
 * @type {string}
 */
let gameState = "menu";

/**
 * Tiempo transcurrido desde el inicio de la partida (en milisegundos)
 * @type {number}
 */
let gameTime = 0;

/**
 * Objetivo de tiempo para ganar (20 minutos en milisegundos)
 * @constant {number}
 */
let survivalTime = 20 * 60 * 1000;

/**
 * Timestamp del momento en que inició la partida actual
 * @type {number}
 */
let startTime = 0;

/**
 * Contador de enemigos eliminados en la partida actual
 * @type {number}
 */
let kills = 0;

/**
 * ====== JUGADOR ======
 * Configuración y recursos del personaje jugable
 */

/**
 * Ancho del sprite del jugador en píxeles (antes de escalar)
 * @constant {number}
 */
const PLAYER_W = 32;

/**
 * Alto del sprite del jugador en píxeles (antes de escalar)
 * @constant {number}
 */
const PLAYER_H = 32;

/**
 * Factor de escala para el sprite del jugador (32px × 2 = 64px final)
 * @constant {number}
 */
const PLAYER_SCALE = 2;

/**
 * Imagen del sprite del jugador
 * @type {HTMLImageElement|null}
 */
let imgPlayer;

/**
 * Objeto que representa al jugador actual
 * Contiene: posición, vida, velocidad, daño, experiencia, nivel, etc.
 * @type {Object|null}
 */
let player = null;

/**
 * ====== BALAS ======
 * Sistema de proyectiles y explosiones
 */

/**
 * Imagen del sprite de las balas
 * @type {HTMLImageElement|null}
 */
let imgBullet;

/**
 * Ancho del sprite de bala en píxeles
 * @type {number}
 */
let BULLET_W = 16;

/**
 * Alto del sprite de bala en píxeles
 * @type {number}
 */
let BULLET_H = 16;

/**
 * Número de frames de animación de la bala
 * @type {number}
 */
let BULLET_FRAMES = 4;

/**
 * Array de balas activas en el juego
 * @type {Array<Object>}
 */
let bullets = [];

/**
 * Array de explosiones activas (efectos visuales)
 * @type {Array<Object>}
 */
let explosions = [];

/**
 * ====== ENEMIGOS ======
 * Sistema de enemigos, sprites y configuración
 */

/**
 * Sprite de enemigo corriendo hacia la derecha (Side Down)
 * @type {HTMLImageElement|null}
 */
let imgEnemyRunSD;

/**
 * Sprite de enemigo corriendo hacia la izquierda (Side Up)
 * @type {HTMLImageElement|null}
 */
let imgEnemyRunSU;

/**
 * Sprite de animación de muerte del enemigo (derecha)
 * @type {HTMLImageElement|null}
 */
let imgEnemyDeathSD;

/**
 * Sprite de animación de muerte del enemigo (izquierda)
 * @type {HTMLImageElement|null}
 */
let imgEnemyDeathSU;

/**
 * Ancho de cada frame del sprite de enemigo
 * @type {number}
 */
let ENEMY_W = 16;

/**
 * Alto de cada frame del sprite de enemigo
 * @type {number}
 */
let ENEMY_H = 16;

/**
 * Número de frames en la animación de correr del enemigo
 * @constant {number}
 */
const ENEMY_RUN_FRAMES = 6;

/**
 * Número de frames en la animación de muerte del enemigo
 * @constant {number}
 */
const ENEMY_DEATH_FRAMES = 4;

/**
 * Array de todos los enemigos activos en el juego
 * @type {Array<Object>}
 */
let enemies = [];

/**
 * Timestamp de la última vez que se generaron enemigos
 * @type {number}
 */
let enemyTimer = 0;

/**
 * Tiempo en milisegundos entre cada oleada de enemigos
 * Disminuye con el tiempo para aumentar dificultad
 * @type {number}
 */
let enemySpawnRate = 1200;

/**
 * Multiplicador de dificultad que aumenta con el tiempo
 * Afecta la velocidad de los enemigos
 * @type {number}
 */
let difficultyMultiplier = 1;

/**
 * Límite máximo de enemigos en pantalla simultáneamente
 * Optimización para mantener rendimiento
 * @constant {number}
 */
const MAX_ENEMIES = 100;

/**
 * ====== TILESET Y DECORACIONES ======
 * Recursos gráficos para el mundo del juego
 */

/**
 * Imagen del tileset del terreno
 * @type {HTMLImageElement|null}
 */
let imgTerrain;

/**
 * Array de imágenes de variantes de hierba (Grass0, Grass1, Grass2...)
 * @type {Array<HTMLImageElement>}
 */
let imgGrass = [];

/**
 * Array de imágenes de variantes de rocas (Rock1, Rock2, Rock3, Rock4)
 * @type {Array<HTMLImageElement>}
 */
let imgRock = [];

/**
 * Número de tiles por fila en el tileset (calculado según ancho de imagen)
 * @type {number}
 */
let tilesPerRow = 0;

/**
 * ====== MAPA Y DECORACIONES =====
 * Estructura del mundo proceduralmente generado
 */

/**
 * Matriz 2D que representa el mapa del mundo (100×100)
 * Cada celda contiene: tileIndex e isObstacle
 * @type {Array<Array<Object>>}
 */
const worldMap = [];

/**
 * Array de decoraciones del mundo (hierba, rocas)
 * Cada decoración tiene: posición, tipo, variante, colisión
 * @type {Array<Object>}
 */
const decorations = [];

/**
 * ====== PARTÍCULAS ======
 * Sistema de partículas para efectos visuales
 */

/**
 * Array de partículas activas en el juego
 * @type {Array<Object>}
 */
let particles = [];

/**
 * Límite máximo de partículas simultáneas (optimización)
 * @constant {number}
 */
const MAX_PARTICLES = 100;

/**
 * ====== CACHE DE SPRITES TINTADOS ======
 * Optimización: sprites pre-renderizados con colores aplicados
 */

/**
 * Cache de sprites de enemigos tintados con diferentes colores
 * Evita recalcular el tinte en cada frame
 * @type {Object<string, HTMLCanvasElement>}
 */
const tintedSpritesCache = {};

/**
 * Cache de sprites de rocas tintadas
 * @type {Object<string, HTMLCanvasElement>}
 */
const tintedRocksCache = {};

/**
 * ====== SCREEN SHAKE ======
 * Efecto de sacudida de pantalla para impactos
 */

/**
 * Estado del efecto de screen shake
 * @type {{x: number, y: number, intensity: number}}
 * @property {number} x - Desplazamiento horizontal actual
 * @property {number} y - Desplazamiento vertical actual
 * @property {number} intensity - Intensidad del efecto (decae con el tiempo)
 */
let screenShake = { x: 0, y: 0, intensity: 0 };

/**
 * ====== INPUT ======
 * Sistema de entrada del usuario (teclado, mouse, táctil)
 */

/**
 * Objeto que almacena el estado de las teclas presionadas
 * Clave: código de la tecla (ej: "KeyW", "Space")
 * Valor: true si está presionada, false si no
 * @type {Object<string, boolean>}
 */
const keys = {};

/**
 * Estado del input táctil (para dispositivos móviles)
 * @type {{active: boolean, startX: number, startY: number, deltaX: number, deltaY: number}}
 * @property {boolean} active - Si el joystick virtual está activo
 * @property {number} startX - Posición X inicial del toque
 * @property {number} startY - Posición Y inicial del toque
 * @property {number} deltaX - Desplazamiento horizontal desde el inicio
 * @property {number} deltaY - Desplazamiento vertical desde el inicio
 */
let touchInput = {
  active: false,
  startX: 0,
  startY: 0,
  deltaX: 0,
  deltaY: 0
};

/**
 * Posición del cursor del mouse en el canvas (coordenadas de pantalla)
 * @type {{x: number, y: number}}
 */
let mousePos = { x: canvas.width / 2, y: canvas.height / 2 };

/**
 * ====== ACCESIBILIDAD ======
 * Opciones para mejorar la accesibilidad del juego
 */

/**
 * Modo de alto contraste activado/desactivado
 * @type {boolean}
 */
let highContrastMode = false;

/**
 * Mostrar/ocultar la pantalla de controles
 * @type {boolean}
 */
let showControlsScreen = false;

/**
 * Información de controles del juego para la pantalla de ayuda
 * @constant {Array<{key: string, description: string}>}
 */
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

/**
 * ====== PERSISTENCIA (LocalStorage) ======
 * Sistema de guardado de datos del jugador
 */

/**
 * Clave para guardar/cargar datos en localStorage
 * @constant {string}
 */
const STORAGE_KEY = "shooter_arena_data_v1";

/**
 * Datos del juego que se persisten entre sesiones
 * @type {{highScores: Object<string, number>, stats: {totalKills: number, totalPlaytime: number}}}
 * @property {Object} highScores - Record de puntuaciones máximas
 * @property {Object} stats - Estadísticas acumuladas del jugador
 */
let gameData = {
  highScores: {
    "20min": 0  // Mejor puntuación en modo 20 minutos
  },
  stats: {
    totalKills: 0,      // Total de enemigos eliminados (todas las partidas)
    totalPlaytime: 0    // Tiempo total jugado en milisegundos
  }
};

/**
 * Carga los datos del juego desde localStorage
 * Recupera high scores y estadísticas de sesiones anteriores
 * @function
 * @returns {void}
 */
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

/**
 * Guarda los datos del juego en localStorage
 * Persiste high scores y estadísticas para la próxima sesión
 * @function
 * @returns {void}
 */
function saveGameData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData));
    console.log("💾 Datos guardados");
  } catch (error) {
    console.warn("⚠️ Error guardando datos:", error);
  }
}

/**
 * Actualiza el high score si la puntuación actual es mayor
 * Compara los kills actuales con el record guardado
 * @function
 * @returns {void}
 */
function updateHighScores() {
  const score = kills;
  if (score > (gameData.highScores["20min"] || 0)) {
    gameData.highScores["20min"] = score;
    console.log("🏆 Nuevo récord:", score);
  }
}

/**
 * Actualiza las estadísticas al final de la partida
 * Acumula kills totales y tiempo de juego, luego guarda los datos
 * @function
 * @returns {void}
 */
function updateStatsOnGameEnd() {
  const elapsed = gameTime; // ya está en ms si fuiste acumulando dt*1000
  gameData.stats.totalKills += kills;
  gameData.stats.totalPlaytime += elapsed;
  saveGameData();
}

/**
 * ====== AUDIO ======
 * Sistema de sonidos y música del juego
 */

/**
 * Colección de objetos Audio para los sonidos del juego
 * @type {Object<string, HTMLAudioElement|null>}
 */
const sounds = {
  shoot: null,        // Sonido de disparo
  enemyHit: null,     // Sonido de impacto en enemigo
  enemyDeath: null,   // Sonido de muerte de enemigo
  playerHit: null,    // Sonido de jugador recibiendo daño
  explosion: null,    // Sonido de explosión
  levelUp: null,      // Sonido de subir de nivel
  music: null,        // Música de fondo
  click: null,        // Sonido de click
  hover: null,        // Sonido de hover
  hit: null,          // Sonido de impacto
  levelup: null       // Sonido de level up (alternativo)
};

/**
 * Flag para habilitar/deshabilitar el sistema de audio
 * @type {boolean}
 */
let audioEnabled = true;

/**
 * Flag para silenciar todos los sonidos
 * @type {boolean}
 */
let audioMuted = false;

/**
 * Alterna el estado de silencio del audio
 * Cuando está silenciado, pone el volumen de la música a 0
 * @function
 * @returns {void}
 */
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

/**
 * Carga todos los archivos de audio del juego
 * Pre-carga los archivos para evitar lag al reproducirlos
 * @function
 * @returns {void}
 */
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

/**
 * Reproduce un sonido con el volumen especificado
 * Usa cloneNode() para permitir reproducción simultánea del mismo sonido
 * @function
 * @param {string} soundName - Nombre del sonido a reproducir
 * @param {number} [volume=1.0] - Volumen del sonido (0.0 a 1.0)
 * @returns {void}
 */
function playSound(soundName, volume = 1.0) {
  if (!audioEnabled || audioMuted) return;
  if (!sounds[soundName]) return;

  const audio = sounds[soundName].cloneNode();
  audio.volume = volume;
  audio.play().catch(() => {});
}

/**
 * Inicia la reproducción de la música de fondo en loop
 * Respeta el estado de mute y configura el volumen apropiado
 * @function
 * @returns {void}
 */
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

/**
 * Detiene la música de fondo y reinicia su posición
 * @function
 * @returns {void}
 */
function stopMusic() {
  if (!sounds.music) return;
  sounds.music.pause();
  sounds.music.currentTime = 0;
}

/**
 * ====== TILES DE SUELO VÁLIDOS ======
 * Índices de tiles que se usan para el terreno caminable
 */

/**
 * Array de índices de tiles válidos para el suelo
 * @constant {Array<number>}
 */
const GROUND_TILES = [
  0, 1, 2, 3   // ejemplo de tiles de hierba/tierra
];

/**
 * ====== TIPOS DE ENEMIGOS ======
 * Configuración de los diferentes tipos de enemigos del juego
 * Cada tipo tiene estadísticas únicas y un peso de aparición
 */

/**
 * Array de tipos de enemigos con sus propiedades
 * @constant {Array<{name: string, maxHealth: number, speed: number, damage: number, xp: number, color: string, spawnWeight: number}>}
 * @property {string} name - Nombre del tipo de enemigo
 * @property {number} maxHealth - Vida máxima del enemigo
 * @property {number} speed - Velocidad de movimiento
 * @property {number} damage - Daño que inflige al jugador
 * @property {number} xp - Experiencia que otorga al morir
 * @property {string} color - Color hexadecimal para tintar el sprite
 * @property {number} spawnWeight - Peso de probabilidad de aparición (mayor = más frecuente)
 */
const ENEMY_TYPES = [
  {
    name: "Slime Verde",
    maxHealth: 3,
    speed: 0.7,
    damage: 1,
    xp: 5,
    color: "#00ff00",
    spawnWeight: 5    // Enemigo más común (50% de probabilidad)
  },
  {
    name: "Slime Rojo",
    maxHealth: 5,
    speed: 0.9,
    damage: 1,
    xp: 10,
    color: "#ff0000",
    spawnWeight: 3    // Enemigo mediano (30% de probabilidad)
  },
  {
    name: "Slime Azul",
    maxHealth: 4,
    speed: 1.2,        // Más rápido pero menos vida
    damage: 1,
    xp: 8,
    color: "#0000ff",
    spawnWeight: 2    // Enemigo menos común (20% de probabilidad)
  }
];

// ====== SISTEMA DE UPGRADES ======
// Mejoras que el jugador puede elegir al subir de nivel
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
        player.fireRate = 80;  // límite mínimo
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
// Retorna un elemento aleatorio del array
function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Detecta colisión entre dos rectángulos (AABB)
function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// Dibuja un rectángulo con esquinas redondeadas
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

// Divide texto en líneas que caben dentro de un ancho máximo
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
// Aplica efecto de sacudida de pantalla
function applyScreenShake(intensity) {
  screenShake.intensity = intensity;
}

// Actualiza el efecto de screen shake (decay gradual)
function updateScreenShake() {
  if (screenShake.intensity > 0) {
    screenShake.x = (Math.random() - 0.5) * screenShake.intensity;
    screenShake.y = (Math.random() - 0.5) * screenShake.intensity;
    screenShake.intensity *= 0.9;  // reducir intensidad gradualmente
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

// ====== SPRITES TINTADOS (CON CACHE) ======
// Crea una versión coloreada del sprite y la guarda en cache para reutilizar
function getTintedSprite(baseImage, tintColor, cache, cacheKey) {
  if (!baseImage) return null;

  const key = cacheKey + "_" + tintColor;
  if (cache[key]) return cache[key];  // ya está en cache

  // Crear canvas offscreen para el tinte
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
// Crea partículas para efectos visuales (explosiones, impactos)
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

// ====== GENERAR MUNDO PROCEDURAL ======
// Crea el mapa base con tiles aleatorios
function generateWorldMap() {
  for (let row = 0; row < WORLD_ROWS; row++) {
    worldMap[row] = [];
    for (let col = 0; col < WORLD_COLS; col++) {
      const tileIndex = randomFrom(GROUND_TILES);
      worldMap[row][col] = {
        tileIndex,
        isObstacle: false
      };
    }
  }

  // Añadir obstáculos aleatorios
  const numRocks = 80;
  for (let i = 0; i < numRocks; i++) {
    const rockCol = Math.floor(Math.random() * WORLD_COLS);
    const rockRow = Math.floor(Math.random() * WORLD_ROWS);
    worldMap[rockRow][rockCol].isObstacle = true;
  }
}

// Suaviza el mapa usando autómata celular
// Los obstáculos se agrupan de forma más natural
function smoothWorldMap(iterations = 1) {
  for (let iter = 0; iter < iterations; iter++) {
    const newMap = [];
    for (let row = 0; row < WORLD_ROWS; row++) {
      newMap[row] = [];
      for (let col = 0; col < WORLD_COLS; col++) {
        // Contar vecinos que son obstáculos
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
        // Si más de 4 vecinos son obstáculos, esta celda también lo es
        if (obstacleCount > 4) {
          newMap[row][col] = { tileIndex: worldMap[row][col].tileIndex, isObstacle: true };
        } else {
          newMap[row][col] = { tileIndex: worldMap[row][col].tileIndex, isObstacle: false };
        }
      }
    }
    // Aplicar cambios
    for (let row = 0; row < WORLD_ROWS; row++) {
      for (let col = 0; col < WORLD_COLS; col++) {
        worldMap[row][col] = newMap[row][col];
      }
    }
  }
}

// Carga una imagen de forma asíncrona
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

// Genera decoraciones (hierba y rocas) en el mapa
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
        const isObstacle = true;  // las rocas bloquean el paso

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
      }
    }
  }
}
