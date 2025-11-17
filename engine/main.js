// ====== MAIN.JS - Punto de entrada y coordinación del juego ======

import * as core from './core.js';
import * as entities from './entities.js';
import * as render from './render.js';
import * as input from './input.js';

// ====== VARIABLES DEL JUEGO ======
const worldMap = [];
const decorations = [];
let fps = 60;
let fpsFrames = 0;
let fpsTime = 0;
let lastTime = 0;

// ====== FUNCIONES DE GENERACIÓN DEL MUNDO ======
function generateWorldMap() {
  for (let row = 0; row < core.WORLD_ROWS; row++) {
    worldMap[row] = [];
    for (let col = 0; col < core.WORLD_COLS; col++) {
      let tile;

      if (row === 0 && col === 0) {
        tile = entities.randomFrom(core.GROUND_TILES);
      } else {
        const r = Math.random();

        if (r < 0.60 && col > 0) {
          tile = worldMap[row][col - 1];
        } else if (r < 0.85 && row > 0) {
          tile = worldMap[row - 1][col];
        } else {
          tile = entities.randomFrom(core.GROUND_TILES);
        }
      }

      worldMap[row][col] = tile;
    }
  }
}

function smoothWorldMap(iterations = 1) {
  for (let it = 0; it < iterations; it++) {
    const copy = worldMap.map(row => [...row]);

    for (let row = 1; row < core.WORLD_ROWS - 1; row++) {
      for (let col = 1; col < core.WORLD_COLS - 1; col++) {
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

function generateDecorations() {
  const density = 0.03;
  const grassChance = 0.7;
  const rockObstacleChance = 0.2;

  for (let row = 0; row < core.WORLD_ROWS; row++) {
    for (let col = 0; col < core.WORLD_COLS; col++) {
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
          variant = Math.floor(Math.random() * core.imgGrass.length);
        } else {
          variant = Math.floor(Math.random() * core.imgRock.length);
          isObstacle = Math.random() < rockObstacleChance;

          if (isObstacle) {
            scale = 1;
            width = 16;
            height = 16;

            collisionWidth = Math.floor(width * 0.4);
            collisionHeight = Math.floor(height * 0.4);
          }
        }

        decorations.push({
          x: col * core.TILE_SIZE,
          y: row * core.TILE_SIZE,
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

// ====== CARGA DE ASSETS ======
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
    const imgTerrain = await loadImage("./assets/terrain.png");
    const imgPlayer = await loadImage("./assets/player.png");

    const imgGrass = [];
    for (let i = 0; i <= 10; i++) {
      imgGrass.push(await loadImage(`./assets/Grass${i}.png`));
    }

    const imgRock = [];
    for (let i = 0; i <= 10; i++) {
      imgRock.push(await loadImage(`./assets/Rock${i}.png`));
    }

    const imgBullet = await loadImage("./assets/bullet1.png");

    const imgEnemyRunSD   = await loadImage("./assets/RunSD.png");
    const imgEnemyRunSU   = await loadImage("./assets/RunSU.png");
    const imgEnemyDeathSD = await loadImage("./assets/DeathSD.png");
    const imgEnemyDeathSU = await loadImage("./assets/DeathSU.png");

    const tilesPerRow = imgTerrain.width / core.TILE_SIZE;

    core.setAssets({
      imgTerrain,
      imgPlayer,
      imgBullet,
      imgEnemyRunSD,
      imgEnemyRunSU,
      imgEnemyDeathSD,
      imgEnemyDeathSU,
      imgGrass,
      imgRock,
      tilesPerRow
    });

    console.log("✅ Assets cargados!");
    console.log(`   - Player: ${core.PLAYER_W}x${core.PLAYER_H}`);
    console.log(`   - Enemy: ${core.ENEMY_W}x${core.ENEMY_H}`);
    console.log(`   - Tiles por fila: ${tilesPerRow}`);
  } catch (error) {
    console.error("❌ Error fatal cargando assets:", error);
    throw error;
  }
}

// ====== RESET GAME ======
export function resetGame() {
  console.log("🔄 Reiniciando juego...");

  decorations.length = 0;
  worldMap.length = 0;

  generateWorldMap();
  smoothWorldMap(2);
  generateDecorations();

  entities.resetEntities();
  entities.setDecorations(decorations);
  core.setEnemyTimer(0);
}

// ====== GAME LOOP ======
function update(dt) {
  if (core.gameState === "playing") {
    core.addGameTime(dt * 1000);

    if (core.gameTime >= core.survivalTime) {
      core.setGameState("victory");
      core.stopMusic();

      core.updateStats();
      core.updateHighScores(entities.player);
      core.saveGameData();

      return;
    }

    entities.updatePlayer(dt);
    entities.updateEnemies(dt);
    entities.updateBullets(dt);
    entities.updateParticles(dt);
    entities.updateExplosions(dt);
    entities.updateDifficulty();
    entities.updateScreenShake();

    const now = Date.now();
    if (now - core.enemyTimer > core.enemySpawnRate) {
      let spawnCount = Math.floor(2 + (core.gameTime / 120000));
      for (let i = 0; i < spawnCount; i++) {
        entities.spawnEnemy();
      }
      core.setEnemyTimer(now);
    }
  }
}

function draw() {
  core.ctx.fillStyle = "#000";
  core.ctx.fillRect(0, 0, core.canvas.width, core.canvas.height);

  if (core.gameState === "menu") {
    render.drawMenu();
  } else if (core.gameState === "playing" || core.gameState === "paused" || core.gameState === "levelup") {
    render.drawMap();
    render.drawDecorations();
    render.drawEnemies();
    render.drawExplosions();
    render.drawBullets();
    render.drawParticles();
    render.drawPlayer();
    render.drawHUD();

    if (core.gameState === "paused") {
      render.drawPaused();
    } else if (core.gameState === "levelup") {
      render.drawLevelUp();
    }

    if (core.showControlsScreen) {
      render.drawControlsScreen();
    }
  } else if (core.gameState === "gameover") {
    render.drawGameOver();
  } else if (core.gameState === "victory") {
    render.drawVictory();
  }
}

function loop(timestamp) {
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  fpsFrames++;
  fpsTime += dt;
  if (fpsTime >= 1) {
    fps = Math.round(fpsFrames / fpsTime);
    fpsFrames = 0;
    fpsTime = 0;
    render.setRenderData({ fps });
  }

  if (dt < 0.1) {
    update(dt);
  }

  draw();

  requestAnimationFrame(loop);
}

// ====== PANTALLAS DE CARGA Y ERROR ======
function drawLoading() {
  core.ctx.fillStyle = "#0f0f1a";
  core.ctx.fillRect(0, 0, core.canvas.width, core.canvas.height);

  core.ctx.fillStyle = "#4ecdc4";
  core.ctx.font = "bold 32px Arial";
  core.ctx.textAlign = "center";
  core.ctx.fillText("LOADING...", core.canvas.width / 2, core.canvas.height / 2);

  core.ctx.fillStyle = "#fff";
  core.ctx.font = "16px Arial";
  core.ctx.fillText("Cargando assets...", core.canvas.width / 2, core.canvas.height / 2 + 40);

  core.ctx.textAlign = "left";
}

function drawError(error) {
  core.ctx.fillStyle = "#0f0f1a";
  core.ctx.fillRect(0, 0, core.canvas.width, core.canvas.height);

  core.ctx.fillStyle = "#ff3333";
  core.ctx.font = "bold 32px Arial";
  core.ctx.textAlign = "center";
  core.ctx.fillText("ERROR", core.canvas.width / 2, core.canvas.height / 2 - 40);

  core.ctx.fillStyle = "#fff";
  core.ctx.font = "16px Arial";
  core.ctx.fillText("No se pudieron cargar los assets", core.canvas.width / 2, core.canvas.height / 2);
  core.ctx.fillText("Abre la consola (F12) para más detalles", core.canvas.width / 2, core.canvas.height / 2 + 30);

  core.ctx.fillStyle = "#999";
  core.ctx.font = "14px Arial";
  core.ctx.fillText(error.message, core.canvas.width / 2, core.canvas.height / 2 + 70);

  core.ctx.textAlign = "left";
}

// ====== INICIO ======
(async function start() {
  console.log("🎮 Iniciando juego...");

  drawLoading();

  try {
    await loadAssets();

    generateWorldMap();
    smoothWorldMap(2);
    generateDecorations();

    core.loadAudio();
    core.loadGameData();

    entities.setInput(input.keys, input.touchInput);
    entities.setDecorations(decorations);
    input.setupAllControls();

    input.setCallbacks({
      resetGame: resetGame
    });

    render.setRenderData({
      mousePos: input.mousePos,
      worldMap: worldMap,
      decorations: decorations,
      fps: fps,
      survivalTime: core.survivalTime
    });

    input.setLoadingState(false);

    console.log("🎮 ¡Juego listo! Haz clic para comenzar.");
    requestAnimationFrame(loop);
  } catch (error) {
    console.error("❌ Error fatal:", error);
    input.setLoadingState(false, error);
    drawError(error);
  }
})();