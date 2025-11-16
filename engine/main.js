// ====== GAME LOOP ======
let lastTime = 0;
let fps = 60;
let fpsFrames = 0;
let fpsTime = 0;

function update(dt) {
  if (gameState === "playing") {
    gameTime += dt * 1000;

    if (gameTime >= survivalTime) {
      gameState = "victory";
      stopMusic();
      updateHighScores();
      updateStatsOnGameEnd();
    }

    updatePlayer(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateParticles(dt);
    updateExplosions(dt);
    updateDifficulty();
    updateScreenShake();

    const now = Date.now();
    if (now - enemyTimer > enemySpawnRate) {
      let spawnCount = Math.floor(1 + gameTime / 60000);
      spawnCount = Math.min(spawnCount, 5);
      for (let i = 0; i < spawnCount; i++) {
        if (enemies.length < MAX_ENEMIES) {
          spawnEnemy();
        }
      }
      enemyTimer = now;
    }

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

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

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

  drawMap();
  drawDecorations();
  drawPlayer();
  drawEnemies();
  drawBullets();
  drawExplosions();
  drawParticles();
  drawHUD();

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

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const delta = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  const dt = Math.min(delta, 0.033);

  fpsFrames++;
  fpsTime += dt;
  if (fpsTime >= 1) {
    fps = fpsFrames;
    fpsFrames = 0;
    fpsTime = 0;
  }

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
