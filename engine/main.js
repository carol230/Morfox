// ====== GAME LOOP PRINCIPAL ======
// Variables para control de framerate
let lastTime = 0;
let fps = 60;
let fpsFrames = 0;
let fpsTime = 0;

// Actualiza la lógica del juego cada frame
function update(dt) {
  if (gameState === "playing") {
    // Actualizar tiempo
    gameTime += dt * 1000;

    // Verificar condición de victoria
    if (gameTime >= survivalTime) {
      gameState = "victory";
      stopMusic();
      updateHighScores();
      updateStatsOnGameEnd();
    }

    // Actualizar todos los sistemas del juego
    updatePlayer(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateParticles(dt);
    updateExplosions(dt);
    updateDifficulty();
    updateScreenShake();

    // Sistema de spawn de enemigos
    const now = Date.now();
    if (now - enemyTimer > enemySpawnRate) {
      // Más enemigos por oleada según tiempo jugado
      let spawnCount = Math.floor(1 + gameTime / 60000);
      spawnCount = Math.min(spawnCount, 5);

      for (let i = 0; i < spawnCount; i++) {
        if (enemies.length < MAX_ENEMIES) {
          spawnEnemy();
        }
      }
      enemyTimer = now;
    }

    // Sistema de level up
    if (player.xp >= player.xpToNextLevel) {
      player.level++;
      player.xp -= player.xpToNextLevel;
      player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.5);
      gameState = "levelup";
      rollUpgrades();
      playSound("levelUp", 0.8);
    }
  }
}

// Dibuja todos los elementos visuales del juego
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Pantallas especiales
  if (gameState === "menu") {
    drawMenu();
    if (showControlsScreen) {
      drawControlsScreenOverlay();
    }
    return;
  }

  if (gameState === "gameover") {
    drawGameOverScreen();
    if (showControlsScreen) {
      drawControlsScreenOverlay();
    }
    return;
  }

  if (gameState === "victory") {
    drawVictoryScreen();
    if (showControlsScreen) {
      drawControlsScreenOverlay();
    }
    return;
  }

  // Renderizado del juego (orden importa: fondo a frente)
  drawMap();
  drawDecorations();
  drawPlayer();
  drawEnemies();
  drawBullets();
  drawExplosions();
  drawParticles();
  drawHUD();

  // Overlays
  if (gameState === "paused") {
    drawPauseScreen();
  }

  if (gameState === "levelup") {
    drawLevelUpScreen();
  }

  if (showControlsScreen) {
    drawControlsScreenOverlay();
  }
}

// Loop principal del juego a 60 FPS
function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const delta = (timestamp - lastTime) / 1000;  // en segundos
  lastTime = timestamp;

  // Limitar delta time para evitar saltos grandes
  const dt = Math.min(delta, 0.033);  // máximo ~30 FPS

  // Calcular FPS
  fpsFrames++;
  fpsTime += dt;
  if (fpsTime >= 1) {
    fps = fpsFrames;
    fpsFrames = 0;
    fpsTime = 0;
  }

  // Actualizar lógica y renderizar
  update(dt);
  draw();

  requestAnimationFrame(gameLoop);
}

// ====== INICIO ======
let loadError = false;
let isLoading = true;

async function init() {
  try {
    loadGameData();
    loadAudio();

    const [
      terrain,
      playerImg,
      bulletImg,
      enemyRunSDImg,
      enemyRunSUImg,
      enemyDeathSDImg,
      enemyDeathSUImg,
      grass0,
      grass1,
      grass2,
      rock1,
      rock2,
      rock3,
      rock4
    ] = await Promise.all([
      loadImage("assets/terrain.png"),
      loadImage("assets/player.png"),
      loadImage("assets/bullet.png"),
      loadImage("assets/enemy_run_sd.png"),
      loadImage("assets/enemy_run_su.png"),
      loadImage("assets/enemy_death_sd.png"),
      loadImage("assets/enemy_death_su.png"),
      loadImage("assets/grass0.png"),
      loadImage("assets/grass1.png"),
      loadImage("assets/grass2.png"),
      loadImage("assets/rock1.png"),
      loadImage("assets/rock2.png"),
      loadImage("assets/rock3.png"),
      loadImage("assets/rock4.png")
    ]);

    imgTerrain = terrain;
    imgPlayer = playerImg;
    imgBullet = bulletImg;
    imgEnemyRunSD = enemyRunSDImg;
    imgEnemyRunSU = enemyRunSUImg;
    imgEnemyDeathSD = enemyDeathSDImg;
    imgEnemyDeathSU = enemyDeathSUImg;

    imgGrass = [grass0, grass1, grass2];
    imgRock = [rock1, rock2, rock3, rock4];

    tilesPerRow = imgTerrain.width / TILE_SIZE;

    generateWorldMap();
    smoothWorldMap(2);
    generateDecorations();

    player = createPlayer();

    isLoading = false;
    resetGame();

    requestAnimationFrame(gameLoop);
  } catch (error) {
    console.error("❌ Error cargando assets:", error);
    loadError = true;
    isLoading = false;
  }
}

init();
