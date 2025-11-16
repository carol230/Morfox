// ====== PLAYER ======
function createPlayer() {
  const playerWidth = PLAYER_W * PLAYER_SCALE;
  const playerHeight = PLAYER_H * PLAYER_SCALE;

  // Posición inicial centrada
  let startX = (WORLD_COLS * TILE_SIZE) / 2 - playerWidth / 2;
  let startY = (WORLD_ROWS * TILE_SIZE) / 2 - playerHeight / 2;

  // Verificar que el jugador no aparezca en una roca
  // Si hay colisión, buscar un lugar cercano sin colisiones
  let safeX = startX;
  let safeY = startY;

  const checkCollision = (x, y) => {
    const hitbox = {
      x,
      y,
      width: playerWidth,
      height: playerHeight
    };
    for (const deco of decorations) {
      if (!deco.isObstacle) continue;
      const decoHitbox = {
        x: deco.x + deco.collisionOffsetX,
        y: deco.y + deco.collisionOffsetY,
        width: deco.collisionWidth,
        height: deco.collisionHeight
      };
      if (rectsOverlap(hitbox, decoHitbox)) {
        return true;
      }
    }
    return false;
  };

  if (checkCollision(startX, startY)) {
    // Buscar una posición cercana
    const MAX_ATTEMPTS = 100;
    let found = false;
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const offsetX = (Math.random() - 0.5) * 200;
      const offsetY = (Math.random() - 0.5) * 200;
      const testX = startX + offsetX;
      const testY = startY + offsetY;
      if (!checkCollision(testX, testY)) {
        safeX = testX;
        safeY = testY;
        found = true;
        break;
      }
    }
    if (!found) {
      console.warn("⚠️ No se encontró posición segura, usando la original.");
    }
  }

  return {
    x: safeX,
    y: safeY,
    width: playerWidth,
    height: playerHeight,
    speed: 2.0,
    health: 100,
    maxHealth: 100,
    damage: 1,
    fireRate: 250,
    lastShot: 0,
    xp: 0,
    level: 1,
    xpToNextLevel: 20,
    invulnerable: false,
    invulnerableTime: 0
  };
}

function updatePlayer(dt) {
  if (!player) return;

  let vx = 0;
  let vy = 0;

  if (keys["ArrowLeft"] || keys["KeyA"]) vx = -1;
  if (keys["ArrowRight"] || keys["KeyD"]) vx = 1;
  if (keys["ArrowUp"] || keys["KeyW"]) vy = -1;
  if (keys["ArrowDown"] || keys["KeyS"]) vy = 1;

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

  const length = Math.hypot(vx, vy);
  if (length > 0) {
    vx /= length;
    vy /= length;
  }

  const speed = player.speed * 60 * dt;

  let newX = player.x + vx * speed;
  let newY = player.y + vy * speed;

  const playerHitbox = {
    x: newX,
    y: newY,
    width: player.width,
    height: player.height
  };

  let collides = false;
  for (const deco of decorations) {
    if (!deco.isObstacle) continue;

    const decoHitbox = {
      x: deco.x + deco.collisionOffsetX,
      y: deco.y + deco.collisionOffsetY,
      width: deco.collisionWidth,
      height: deco.collisionHeight
    };

    if (rectsOverlap(playerHitbox, decoHitbox)) {
      collides = true;
      break;
    }
  }

  if (!collides) {
    player.x = newX;
    player.y = newY;
  }

  if (player.invulnerable) {
    player.invulnerableTime -= dt;
    if (player.invulnerableTime <= 0) {
      player.invulnerable = false;
    }
  }

  updateCamera();
}

function updateCamera() {
  if (!player) return;

  const targetX = player.x + player.width / 2 - canvas.width / 2;
  const targetY = player.y + player.height / 2 - canvas.height / 2;

  camX += (targetX - camX) * 0.1;
  camY += (targetY - camY) * 0.1;

  const maxCamX = WORLD_COLS * TILE_SIZE - canvas.width;
  const maxCamY = WORLD_ROWS * TILE_SIZE - canvas.height;
  camX = Math.max(0, Math.min(camX, maxCamX));
  camY = Math.max(0, Math.min(camY, maxCamY));
}

function findNearestEnemy(x, y) {
  let nearest = null;
  let nearestDist = Infinity;
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const dx = enemy.x + enemy.width / 2 - x;
    const dy = enemy.y + enemy.height / 2 - y;
    const dist = dx * dx + dy * dy;
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = enemy;
    }
  }
  return nearest;
}

// ====== BALAS Y EXPLOSIONES ======
function shootBullet() {
  if (!player) return;

  const now = performance.now();
  if (now - player.lastShot < player.fireRate) {
    return;
  }
  player.lastShot = now;

  const targetX = mousePos.x + camX;
  const targetY = mousePos.y + camY;

  const angle = Math.atan2(
    targetY - (player.y + player.height / 2),
    targetX - (player.x + player.width / 2)
  );

  const speed = 8;

  bullets.push({
    x: player.x + player.width / 2,
    y: player.y + player.height / 2,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    width: BULLET_W,
    height: BULLET_H,
    damage: player.damage,
    life: 1.5
  });

  playSound("shoot", 0.3);
}

function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx * 60 * dt;
    b.y += b.vy * 60 * dt;
    b.life -= dt;
    if (b.life <= 0) {
      bullets.splice(i, 1);
      continue;
    }

    // Colisión con enemigos
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const hitboxBullet = {
        x: b.x - b.width / 2,
        y: b.y - b.height / 2,
        width: b.width,
        height: b.height
      };
      const hitboxEnemy = {
        x: enemy.x,
        y: enemy.y,
        width: enemy.width,
        height: enemy.height
      };
      if (rectsOverlap(hitboxBullet, hitboxEnemy)) {
        enemy.health -= b.damage;
        playSound("enemyHit", 0.3);
        createParticles(
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2,
          enemy.color || "#ffffff",
          5
        );
        bullets.splice(i, 1);
        if (enemy.health <= 0) {
          enemy.alive = false;
          enemy.deathTime = 0;
          kills++;
          player.xp += enemy.xp || 1;
          playSound("enemyDeath", 0.4);
          createExplosion(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2,
            enemy.color || "#ff0000",
            10
          );
          applyScreenShake(5);
        }
        break;
      }
    }
  }
}

function createExplosion(x, y, color, amount) {
  explosions.push({
    x,
    y,
    radius: 5,
    maxRadius: 30,
    color,
    life: 0.5
  });

  createParticles(x, y, color, amount);
}

function updateExplosions(dt) {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const e = explosions[i];
    e.radius += (e.maxRadius - e.radius) * 0.2;
    e.life -= dt;
    if (e.life <= 0) {
      explosions.splice(i, 1);
    }
  }
}

// ====== ENEMIGOS ======
function getAvailableEnemyTypes() {
  return ENEMY_TYPES;
}

function selectRandomEnemyType(availableTypes) {
  let totalWeight = 0;
  for (const type of availableTypes) {
    totalWeight += type.spawnWeight || 1;
  }
  let r = Math.random() * totalWeight;
  for (const type of availableTypes) {
    r -= type.spawnWeight || 1;
    if (r <= 0) return type;
  }
  return availableTypes[availableTypes.length - 1];
}

function spawnEnemy() {
  const availableTypes = getAvailableEnemyTypes();
  if (availableTypes.length === 0) return;

  const type = selectRandomEnemyType(availableTypes);

  let side = Math.floor(Math.random() * 4);
  let x, y;
  const margin = 200;

  if (side === 0) {
    x = Math.random() * WORLD_COLS * TILE_SIZE;
    y = -margin;
  } else if (side === 1) {
    x = Math.random() * WORLD_COLS * TILE_SIZE;
    y = WORLD_ROWS * TILE_SIZE + margin;
  } else if (side === 2) {
    x = -margin;
    y = Math.random() * WORLD_ROWS * TILE_SIZE;
  } else {
    x = WORLD_COLS * TILE_SIZE + margin;
    y = Math.random() * WORLD_ROWS * TILE_SIZE;
  }

  const nearestPlayer = player;
  if (nearestPlayer) {
    const dx = nearestPlayer.x + nearestPlayer.width / 2 - x;
    const dy = nearestPlayer.y + nearestPlayer.height / 2 - y;
    const angle = Math.atan2(dy, dx);

    enemies.push({
      x,
      y,
      width: ENEMY_W * 2,
      height: ENEMY_H * 2,
      speed: type.speed,
      maxHealth: type.maxHealth,
      health: type.maxHealth,
      damage: type.damage,
      xp: type.xp,
      alive: true,
      deathTime: 0,
      animTime: 0,
      animFrame: 0,
      facing: Math.cos(angle) >= 0 ? "right" : "left",
      typeName: type.name,
      color: type.color || "#ffffff"
    });
  }
}

function updateEnemies(dt) {
  for (const enemy of enemies) {
    if (!enemy.alive) {
      enemy.deathTime += dt;
      continue;
    }

    const dx = player.x + player.width / 2 - (enemy.x + enemy.width / 2);
    const dy = player.y + player.height / 2 - (enemy.y + enemy.height / 2);
    const dist = Math.hypot(dx, dy);

    if (dist > 0) {
      const speed = enemy.speed * difficultyMultiplier * 60 * dt;
      enemy.x += (dx / dist) * speed;
      enemy.y += (dy / dist) * speed;
    }

    const ex = enemy.x + enemy.width / 2;
    const ey = enemy.y + enemy.height / 2;

    const col = Math.floor(ex / TILE_SIZE);
    const row = Math.floor(ey / TILE_SIZE);

    if (
      row >= 0 && row < WORLD_ROWS &&
      col >= 0 && col < WORLD_COLS &&
      worldMap[row][col].isObstacle
    ) {
      enemy.x -= (dx / Math.max(dist, 1)) * enemy.speed * 60 * dt;
      enemy.y -= (dy / Math.max(dist, 1)) * enemy.speed * 60 * dt;
    }

    enemy.animTime += dt * 10;
    enemy.animFrame = Math.floor(enemy.animTime) % ENEMY_RUN_FRAMES;

    enemy.facing = dx >= 0 ? "right" : "left";

    const hitboxEnemy = {
      x: enemy.x,
      y: enemy.y,
      width: enemy.width,
      height: enemy.height
    };
    const hitboxPlayer = {
      x: player.x,
      y: player.y,
      width: player.width,
      height: player.height
    };

    if (!player.invulnerable && rectsOverlap(hitboxEnemy, hitboxPlayer)) {
      player.health -= enemy.damage;
      player.invulnerable = true;
      player.invulnerableTime = 1.0;
      playSound("playerHit", 0.6);
      createParticles(
        player.x + player.width / 2,
        player.y + player.height / 2,
        "#ff0000",
        10
      );
      applyScreenShake(10);
      if (player.health <= 0) {
        gameState = "gameover";
        stopMusic();
        updateHighScores();
        updateStatsOnGameEnd();
      }
    }
  }

  enemies = enemies.filter(enemy => enemy.alive || enemy.deathTime < 0.5);
}

// ====== DIFICULTAD ======
function updateDifficulty() {
  const minutes = gameTime / 60000;
  difficultyMultiplier = 1 + minutes * 0.2;

  const minSpawnRate = 300;
  enemySpawnRate = Math.max(1200 - minutes * 60 * 10, minSpawnRate);
}

// ====== UPGRADES ======
let currentUpgradeOptions = [];

function rollUpgrades() {
  const shuffled = [...UPGRADES].sort(() => Math.random() - 0.5);
  currentUpgradeOptions = shuffled.slice(0, 3);
}

// ====== RESET GAME ======
function resetGame() {
  if (!imgTerrain || !imgPlayer || !imgBullet || !imgEnemyRunSD || !imgEnemyRunSU) {
    console.warn("⏳ Assets no cargados todavía, no se puede resetear el juego.");
    return;
  }

  gameState = "menu";
  gameTime = 0;
  startTime = performance.now();
  kills = 0;
  difficultyMultiplier = 1;
  enemySpawnRate = 1200;
  enemyTimer = Date.now();

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
