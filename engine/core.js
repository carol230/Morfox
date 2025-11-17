// core.js - Configuración base del juego

export const canvas = document.getElementById("game");
export const ctx = canvas.getContext("2d");

export const isTouchDevice =
  "ontouchstart" in window ||
  navigator.maxTouchPoints > 0 ||
  navigator.msMaxTouchPoints > 0;

// Resolución adaptativa según dispositivo
if (isTouchDevice) {
  canvas.width = 960;
  canvas.height = 540;
} else {
  canvas.width = 1280;
  canvas.height = 720;
}

// Dimensiones del mundo
export const TILE_SIZE = 16;
export const WORLD_COLS = 100;
export const WORLD_ROWS = 100;

export const PLAYER_W = 32;
export const PLAYER_H = 32;
export const PLAYER_SCALE = 2;

export const BULLET_W = 16;
export const BULLET_H = 16;
export const BULLET_FRAMES = 4;

export let ENEMY_W = 16;
export let ENEMY_H = 16;
export const ENEMY_RUN_FRAMES = 6;
export const ENEMY_DEATH_FRAMES = 4;

export const MAX_ENEMIES = 100;
export const MAX_PARTICLES = 100;

// Tiles caminables del tileset
export const GROUND_TILES = [
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

export const ENEMY_TYPES = {
    BASIC: {
        name: "Zombie",
        color: "#8b4a8e",
        tint: [139, 74, 142],
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
        tint: [231, 76, 60],
        size: 16,
        speed: 60,
        hp: 2,
        damage: 5,
        xp: 2,
        weight: 50,
        minTime: 60000
    },
    TANK: {
        name: "Brute",
        color: "#34495e",
        tint: [52, 73, 94],
        size: 24,
        speed: 20,
        hp: 10,
        damage: 15,
        xp: 5,
        weight: 30,
        minTime: 120000
    },
    ELITE: {
        name: "Elite",
        color: "#f39c12",
        tint: [243, 156, 18],
        size: 20,
        speed: 40,
        hp: 15,
        damage: 12,
        xp: 8,
        weight: 15,
        minTime: 180000
    },
    BOSS: {
        name: "Boss",
        color: "#9b59b6",
        tint: [155, 89, 182],
        size: 32,
        speed: 25,
        hp: 50,
        damage: 25,
        xp: 20,
        weight: 5,
        minTime: 300000
    }
};

// Estado del juego
export let gameState = "menu";
export let gameTime = 0;
export let survivalTime = 20 * 60 * 1000;
export let startTime = 0;
export let kills = 0;
/**
 * Establece el estado actual del juego
 * @param {string} state
 */
export function setGameState(state) {
    gameState = state;
}

/**
 * Establece el tiempo de juego
 * @param {number} time
 */
export function setGameTime(time) {
    gameTime = time;
}

/**
 * Incrementa el tiempo de juego
 * @param {number} deltaTime
 */
export function addGameTime(deltaTime) {
    gameTime += deltaTime;
}

/**
 * Establece el tiempo de inicio
 * @param {number} time
 */
export function setStartTime(time) {
    startTime = time;
}

/**
 * Incrementa el contador de kills
 */
export function incrementKills() {
    kills++;
}

/**
 * Reinicia el contador de kills a cero
 */
export function resetKills() {
    kills = 0;
}

// Cámara
export let camX = 0;
export let camY = 0;

/**
 * Establece la posición X de la cámara
 * @param {number} x
 */
export function setCamX(x) {
    camX = x;
}

/**
 * Establece la posición Y de la cámara
 * @param {number} y
 */
export function setCamY(y) {
    camY = y;
}

// Sistema de dificultad progresiva
export let enemyTimer = 0;
export let enemySpawnRate = 1200;
export let difficultyMultiplier = 1;

/**
 * Establece el temporizador de spawn de enemigos
 * @param {number} time
 */
export function setEnemyTimer(time) {
    enemyTimer = time;
}

/**
 * Establece el multiplicador de dificultad
 * @param {number} mult
 */
export function setDifficultyMultiplier(mult) {
    difficultyMultiplier = mult;
}

/**
 * Establece la tasa de generación de enemigos
 * @param {number} rate
 */
export function setEnemySpawnRate(rate) {
    enemySpawnRate = rate;
}

// Efectos de pantalla
export let screenShake = { x: 0, y: 0, intensity: 0 };

/**
 * Establece el efecto de vibración de pantalla
 * @param {Object} shake
 */
export function setScreenShake(shake) {
    screenShake = shake;
}

// Opciones de accesibilidad
export let highContrastMode = false;
export let showControlsScreen = false;

/**
 * Alterna el modo de alto contraste
 */
export function toggleHighContrast() {
  highContrastMode = !highContrastMode;
}

/**
 * Alterna la visibilidad de la pantalla de controles
 */
export function toggleControlsScreen() {
    showControlsScreen = !showControlsScreen;
}

/**
 * Establece la visibilidad de la pantalla de controles
 * @param {boolean} value
 */
export function setShowControlsScreen(value) {
    showControlsScreen = value;
}

export const controlsInfo = {
  movement: "WASD o Flechas - Mover jugador",
  shoot: "ESPACIO - Disparar granada",
  pause: "ESC - Pausar/Reanudar",
  mute: "M - Silenciar/Activar audio",
  contrast: "C - Cambiar contraste",
  help: "H - Mostrar/Ocultar ayuda"
};

// Assets del juego
export let imgPlayer;
export let imgBullet;
export let imgEnemyRunSD;
export let imgEnemyRunSU;
export let imgEnemyDeathSD;
export let imgEnemyDeathSU;
export let imgTerrain;
export let imgGrass = [];
export let imgRock = [];
export let tilesPerRow = 0;

/**
 * Establece los recursos gráficos del juego
 * @param {Object} assets
 */
export function setAssets(assets) {
    if (assets.imgPlayer) imgPlayer = assets.imgPlayer;
    if (assets.imgBullet) imgBullet = assets.imgBullet;
    if (assets.imgEnemyRunSD) {
        imgEnemyRunSD = assets.imgEnemyRunSD;
        ENEMY_W = imgEnemyRunSD.width / ENEMY_RUN_FRAMES;
        ENEMY_H = imgEnemyRunSD.height;
    }
    if (assets.imgEnemyRunSU) imgEnemyRunSU = assets.imgEnemyRunSU;
    if (assets.imgEnemyDeathSD) imgEnemyDeathSD = assets.imgEnemyDeathSD;
    if (assets.imgEnemyDeathSU) imgEnemyDeathSU = assets.imgEnemyDeathSU;
    if (assets.imgTerrain) imgTerrain = assets.imgTerrain;
    if (assets.imgGrass) imgGrass = assets.imgGrass;
    if (assets.imgRock) imgRock = assets.imgRock;
    if (assets.tilesPerRow !== undefined) tilesPerRow = assets.tilesPerRow;
}

// Cache para optimizar sprites con tint
export const tintedSpritesCache = {};
export const tintedRocksCache = {};

// Sistema de guardado
const STORAGE_KEY = 'survive20_data';

export const gameData = {
  highScores: {
    longestSurvival: 0,
    mostKills: 0,
    highestLevel: 0
  },
  stats: {
    totalGames: 0,
    totalKills: 0,
    totalDeaths: 0,
    totalPlayTime: 0
  }
};
/**
 * Carga los datos guardados desde localStorage
 */
export function loadGameData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      Object.assign(gameData.highScores, data.highScores || {});
      Object.assign(gameData.stats, data.stats || {});
    }
  } catch (error) {
  }
}

/**
 * Guarda los datos del juego en localStorage
 */
export function saveGameData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData));
  } catch (error) {
  }
}
/**
 * Actualiza los récords del juego
 * @param {Object} player
 */
export function updateHighScores(player) {
  let updated = false;

  if (gameState === "victory" || gameTime > gameData.highScores.longestSurvival) {
    gameData.highScores.longestSurvival = gameTime;
    updated = true;
  }

  if (kills > gameData.highScores.mostKills) {
    gameData.highScores.mostKills = kills;
    updated = true;
  }

  if (player && player.level > gameData.highScores.highestLevel) {
    gameData.highScores.highestLevel = player.level;
    updated = true;
  }

  return updated;
}
/**
 * Actualiza las estadísticas globales del juego
 */
export function updateStats() {
  gameData.stats.totalGames++;
  gameData.stats.totalKills += kills;
  if (gameState === "gameover") {
    gameData.stats.totalDeaths++;
  }
  gameData.stats.totalPlayTime += gameTime;
}

// Sistema de audio
export const sounds = {
  music: null,
  shoot: null,
  explosion: null,
  hit: null,
  levelup: null
};

export let audioEnabled = true;
export let audioMuted = false;
/**
 * Alterna el silenciamiento del audio
 */
export function toggleMute() {
  audioMuted = !audioMuted;

  if (sounds.music) {
    sounds.music.muted = audioMuted;
  }

}
/**
 * Carga los archivos de audio del juego
 */
export function loadAudio() {
  try {
    sounds.music = new Audio('./sounds/music.mp3');
    sounds.music.loop = true;
    sounds.music.volume = 0.5;

    sounds.shoot = new Audio('./sounds/shoot.mp3');
    sounds.shoot.volume = 0.2;

    sounds.explosion = new Audio('./sounds/explosion.mp3');
    sounds.explosion.volume = 0.25;

    sounds.hit = new Audio('./sounds/hit.mp3');
    sounds.hit.volume = 0.25;

    sounds.levelup = new Audio('./sounds/levelup.mp3');
    sounds.levelup.volume = 0.35;

  } catch (error) {
    audioEnabled = false;
  }
}
/**
 * Reproduce un efecto de sonido
 * @param {string} soundName
 */
export function playSound(soundName) {
  if (!audioEnabled || !sounds[soundName] || audioMuted) return;

  try {
    const sound = sounds[soundName].cloneNode();
    sound.volume = sounds[soundName].volume;
  } catch (e) {
  }
}
/**
 * Reproduce la música de fondo
 */
export function playMusic() {
  if (!audioEnabled || !sounds.music) return;

  try {
    sounds.music.play().catch(e => {
      document.addEventListener('click', () => {
        sounds.music.play().catch(() => {});
      }, { once: true });
    });
  } catch (e) {
  }
}
/**
 * Detiene la música de fondo
 */
export function stopMusic() {
  if (sounds.music) {
    sounds.music.pause();
    sounds.music.currentTime = 0;
  }
}