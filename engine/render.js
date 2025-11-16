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

// ====== DECORACIONES (OPTIMIZADO) ======
function drawMap() {
  const startCol = Math.floor(camX / TILE_SIZE);
  const endCol = Math.floor((camX + canvas.width) / TILE_SIZE);
  const startRow = Math.floor(camY / TILE_SIZE);
  const endRow = Math.floor((camY + canvas.height) / TILE_SIZE);

  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      if (row < 0 || row >= WORLD_ROWS || col < 0 || col >= WORLD_COLS) continue;
      const cell = worldMap[row][col];
      if (!cell) continue;
      drawTile(cell.tileIndex, col, row);
    }
  }
}

function drawDecorations() {
  for (const deco of decorations) {
    const dx = deco.x - camX + screenShake.x;
    const dy = deco.y - camY + screenShake.y;

    if (dx + deco.width < 0 || dx > canvas.width ||
        dy + deco.height < 0 || dy > canvas.height) {
      continue;
    }

    if (deco.type === "grass" && imgGrass[deco.variant]) {
      ctx.drawImage(
        imgGrass[deco.variant],
        dx,
        dy,
        deco.width * deco.scale,
        deco.height * deco.scale
      );
    } else if (deco.type === "rock" && imgRock[deco.variant]) {
      ctx.drawImage(
        imgRock[deco.variant],
        dx,
        dy,
        deco.width * deco.scale,
        deco.height * deco.scale
      );
    }
  }
}

// ====== DIBUJAR PLAYER ======
function drawPlayer() {
  if (!player || !imgPlayer) return;

  const dx = player.x - camX + screenShake.x;
  const dy = player.y - camY + screenShake.y;

  if (player.invulnerable) {
    ctx.globalAlpha = 0.5;
  }

  ctx.drawImage(
    imgPlayer,
    0, 0,
    PLAYER_W,
    PLAYER_H,
    dx,
    dy,
    player.width,
    player.height
  );

  ctx.globalAlpha = 1.0;

  const barWidth = player.width;
  const barHeight = 6;
  const barX = dx;
  const barY = dy - 10;

  ctx.fillStyle = "red";
  ctx.fillRect(barX, barY, barWidth, barHeight);

  const healthRatio = player.health / player.maxHealth;
  ctx.fillStyle = "lime";
  ctx.fillRect(barX, barY, barWidth * healthRatio, barHeight);

  ctx.strokeStyle = "black";
  ctx.strokeRect(barX, barY, barWidth, barHeight);
}

// ====== DIBUJAR BALAS ======
function drawBullets() {
  for (const b of bullets) {
    const dx = b.x - camX + screenShake.x - b.width / 2;
    const dy = b.y - camY + screenShake.y - b.height / 2;

    if (dx + b.width < 0 || dx > canvas.width ||
        dy + b.height < 0 || dy > canvas.height) {
      continue;
    }

    if (imgBullet) {
      ctx.drawImage(
        imgBullet,
        0, 0,
        BULLET_W,
        BULLET_H,
        dx,
        dy,
        BULLET_W,
        BULLET_H
      );
    } else {
      ctx.fillStyle = "yellow";
      ctx.fillRect(dx, dy, b.width, b.height);
    }
  }
}

// ====== DIBUJAR EXPLOSIONES ======
function drawExplosions() {
  for (const e of explosions) {
    const dx = e.x - camX + screenShake.x;
    const dy = e.y - camY + screenShake.y;

    const alpha = e.life / 0.5;
    ctx.globalAlpha = alpha;

    ctx.beginPath();
    ctx.arc(dx, dy, e.radius, 0, Math.PI * 2);
    ctx.fillStyle = e.color;
    ctx.fill();

    ctx.globalAlpha = 1.0;
  }
}

// ====== DIBUJAR ENEMIGOS (OPTIMIZADO) ======
function drawEnemies() {
  for (const enemy of enemies) {
    const dx = enemy.x - camX + screenShake.x;
    const dy = enemy.y - camY + screenShake.y;

    if (dx + enemy.width < 0 || dx > canvas.width ||
        dy + enemy.height < 0 || dy > canvas.height) {
      continue;
    }

    let sprite = null;
    let frameWidth = ENEMY_W;
    let frameHeight = ENEMY_H;

    if (enemy.alive) {
      const runImg = enemy.facing === "right" ? imgEnemyRunSD : imgEnemyRunSU;
      if (runImg) {
        sprite = runImg;
      }
    } else {
      const deathImg = imgEnemyDeathSD;
      if (deathImg) {
        sprite = deathImg;
      }
    }

    if (sprite) {
      let frame = enemy.animFrame || 0;
      if (!enemy.alive) {
        const totalDeathFrames = ENEMY_DEATH_FRAMES;
        frame = Math.min(
          Math.floor(enemy.deathTime * totalDeathFrames * 2),
          totalDeathFrames - 1
        );
      }

      const sx = frame * frameWidth;
      const sy = 0;

      const tinted = getTintedSprite(
        sprite,
        enemy.color || "#ffffff",
        tintedSpritesCache,
        enemy.typeName
      );

      ctx.drawImage(
        tinted || sprite,
        sx, sy,
        frameWidth, frameHeight,
        dx,
        dy,
        enemy.width,
        enemy.height
      );
    } else {
      ctx.fillStyle = "purple";
      ctx.fillRect(dx, dy, enemy.width, enemy.height);
    }

    const barWidth = enemy.width;
    const barHeight = 4;
    const barX = dx;
    const barY = dy - 6;

    ctx.fillStyle = "red";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const healthRatio = enemy.health / enemy.maxHealth;
    ctx.fillStyle = "lime";
    ctx.fillRect(barX, barY, barWidth * healthRatio, barHeight);

    ctx.strokeStyle = "black";
    ctx.strokeRect(barX, barY, barWidth, barHeight);
  }
}

// ====== HUD ======
function drawHUD() {
  ctx.save();

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(10, 10, 220, 90);

  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.textAlign = "left";

  ctx.fillText(`Tiempo: ${(gameTime / 1000).toFixed(1)}s`, 20, 35);
  ctx.fillText(`Kills: ${kills}`, 20, 55);
  ctx.fillText(`Vida: ${player ? player.health : 0}/${player ? player.maxHealth : 0}`, 20, 75);

  const remaining = Math.max(0, survivalTime - gameTime);
  const remainingSeconds = remaining / 1000;
  ctx.fillText(`Restante: ${remainingSeconds.toFixed(1)}s`, 20, 95);

  ctx.restore();
}

// ====== PANTALLA DE CONTROLES ======
function drawControlsScreenOverlay() {
  ctx.save();

  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const panelWidth = 480;
  const panelHeight = 360;
  const panelX = (canvas.width - panelWidth) / 2;
  const panelY = (canvas.height - panelHeight) / 2;

  ctx.fillStyle = highContrastMode ? "#000000" : "rgba(30, 30, 30, 0.9)";
  roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 20);
  ctx.fill();

  ctx.strokeStyle = highContrastMode ? "#ffffff" : "#4ecdc4";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = highContrastMode ? "#ffff00" : "#ffffff";
  ctx.font = "24px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Controles del Juego", canvas.width / 2, panelY + 40);

  ctx.font = "16px Arial";
  ctx.textAlign = "left";

  const col1X = panelX + 40;
  const col2X = panelX + 260;
  let rowY = panelY + 80;
  const rowHeight = 26;

  for (let i = 0; i < controlsInfo.length; i++) {
    const info = controlsInfo[i];
    const x = (i < Math.ceil(controlsInfo.length / 2)) ? col1X : col2X;
    const y = rowY + (i % Math.ceil(controlsInfo.length / 2)) * rowHeight;

    ctx.fillStyle = highContrastMode ? "#ffff00" : "#4ecdc4";
    ctx.fillText(info.key, x, y);

    ctx.fillStyle = highContrastMode ? "#ffffff" : "#f1f1f1";
    ctx.fillText(info.description, x + 120, y);
  }

  ctx.fillStyle = highContrastMode ? "#ffffff" : "#aaaaaa";
  ctx.font = "14px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Pulsa H para cerrar esta ventana", canvas.width / 2, panelY + panelHeight - 20);

  ctx.restore();
}

// ====== MENÚS ======
function drawMenu() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(0, 0, 0, 1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.font = "32px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Shooter Arena", canvas.width / 2, canvas.height / 2 - 80);

  ctx.font = "20px Arial";
  ctx.fillText("Click para jugar", canvas.width / 2, canvas.height / 2 - 20);
  ctx.fillText("Presiona H para ver los controles", canvas.width / 2, canvas.height / 2 + 10);

  ctx.font = "16px Arial";
  ctx.fillText("Mejor puntuación (20min): " + (gameData.highScores["20min"] || 0), canvas.width / 2, canvas.height / 2 + 50);

  ctx.fillStyle = "#999";
  ctx.font = "14px Arial";
  ctx.fillText("WASD / Flechas para mover, click para disparar", canvas.width / 2, canvas.height / 2 + 80);
}

function drawPauseScreen() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.font = "28px Arial";
  ctx.textAlign = "center";
  ctx.fillText("PAUSA", canvas.width / 2, canvas.height / 2 - 20);

  ctx.font = "16px Arial";
  ctx.fillText("Presiona Espacio para reanudar", canvas.width / 2, canvas.height / 2 + 10);
}

function drawGameOverScreen() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ff4444";
  ctx.font = "32px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);

  ctx.fillStyle = "#ffffff";
  ctx.font = "20px Arial";
  ctx.fillText(`Sobreviviste ${(gameTime / 1000).toFixed(1)}s`, canvas.width / 2, canvas.height / 2);
  ctx.fillText(`Kills: ${kills}`, canvas.width / 2, canvas.height / 2 + 30);

  ctx.font = "16px Arial";
  ctx.fillText("Click para volver al menú", canvas.width / 2, canvas.height / 2 + 70);
}

function drawVictoryScreen() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#4caf50";
  ctx.font = "32px Arial";
  ctx.textAlign = "center";
  ctx.fillText("¡VICTORIA!", canvas.width / 2, canvas.height / 2 - 40);

  ctx.fillStyle = "#ffffff";
  ctx.font = "20px Arial";
  ctx.fillText(`Sobreviviste los ${survivalTime / 60000} minutos`, canvas.width / 2, canvas.height / 2);
  ctx.fillText(`Kills: ${kills}`, canvas.width / 2, canvas.height / 2 + 30);

  ctx.font = "16px Arial";
  ctx.fillText("Click para volver al menú", canvas.width / 2, canvas.height / 2 + 70);
}

function drawLevelUpScreen() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const panelWidth = 600;
  const panelHeight = 260;
  const panelX = (canvas.width - panelWidth) / 2;
  const panelY = (canvas.height - panelHeight) / 2;

  ctx.fillStyle = "rgba(20, 20, 20, 0.95)";
  roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 20);
  ctx.fill();

  ctx.strokeStyle = "#ffd700";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#ffd700";
  ctx.font = "28px Arial";
  ctx.textAlign = "center";
  ctx.fillText("¡Subiste de nivel!", canvas.width / 2, panelY + 40);

  ctx.fillStyle = "#ffffff";
  ctx.font = "18px Arial";
  ctx.fillText("Elige una mejora:", canvas.width / 2, panelY + 75);

  const cardWidth = 160;
  const cardHeight = 130;
  const spacing = 20;
  const totalWidth = cardWidth * currentUpgradeOptions.length + spacing * (currentUpgradeOptions.length - 1);
  let startX = (canvas.width - totalWidth) / 2;
  const cardY = panelY + 100;

  ctx.textAlign = "center";
  ctx.font = "16px Arial";

  currentUpgradeOptions.forEach((upgrade, i) => {
    const x = startX + i * (cardWidth + spacing);

    ctx.fillStyle = "#333";
    roundRect(ctx, x, cardY, cardWidth, cardHeight, 12);
    ctx.fill();

    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#ffd700";
    ctx.font = "18px Arial";
    ctx.fillText(upgrade.name, x + cardWidth / 2, cardY + 30);

    ctx.fillStyle = "#ffffff";
    ctx.font = "14px Arial";

    const descX = x + 10;
    const descY = cardY + 60;
    const descMaxWidth = cardWidth - 20;
    const descLineHeight = 18;

    const words = upgrade.description.split(" ");
    let line = "";
    let textY = descY;

    for (let j = 0; j < words.length; j++) {
      const testLine = line + words[j] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > descMaxWidth && j > 0) {
        ctx.fillText(line, x + cardWidth / 2, textY);
        line = words[j] + " ";
        textY += descLineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x + cardWidth / 2, textY);
  });

  ctx.fillStyle = "#999";
  ctx.font = "14px Arial";
  ctx.fillText("Haz click en una carta para elegir la mejora", canvas.width / 2, panelY + panelHeight - 20);

  ctx.textAlign = "left";
}
