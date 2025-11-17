import * as core from './core.js';
import * as entities from './entities.js';

// Variables de input para poder acceder a ellas (las setearemos desde input.js)
let mousePos = { x: core.canvas.width / 2, y: core.canvas.height / 2 };
let worldMap = [];
let decorations = [];
let fps = 60;
let survivalTime = 0;

/**
 * Establece los datos necesarios para el renderizado
 * @param {Object} data
 */
export function setRenderData(data) {
  if (data.mousePos) mousePos = data.mousePos;
  if (data.worldMap) worldMap = data.worldMap;
  if (data.decorations) decorations = data.decorations;
  if (data.fps !== undefined) fps = data.fps;
  if (data.survivalTime) survivalTime = data.survivalTime;
}

/**
 * Dibuja un rectángulo con esquinas redondeadas
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {number} radius
 */
export function roundRect(ctx, x, y, width, height, radius = 8) {
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

/**
 * Divide un texto en líneas según un ancho máximo
 * @param {string} text
 * @param {number} maxWidth
 */
export function wrapText(text, maxWidth) {
    let words = text.split(' ');
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        let word = words[i];
        let width = core.ctx.measureText(currentLine + " " + word).width;
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

function drawTile(tileIndex, colDestino, filaDestino) {
  const sx = (tileIndex % core.tilesPerRow) * core.TILE_SIZE;
  const sy = Math.floor(tileIndex / core.tilesPerRow) * core.TILE_SIZE;

  const dx = colDestino * core.TILE_SIZE - core.camX + core.screenShake.x;
  const dy = filaDestino * core.TILE_SIZE - core.camY + core.screenShake.y;

  core.ctx.drawImage(
    core.imgTerrain,
    sx, sy, core.TILE_SIZE, core.TILE_SIZE,
    dx, dy, core.TILE_SIZE, core.TILE_SIZE
  );
}

/**
 * Dibuja el mapa de tiles del mundo
 */
export function drawMap() {
  const startCol = Math.floor(core.camX / core.TILE_SIZE);
  const startRow = Math.floor(core.camY / core.TILE_SIZE);

  const endCol = Math.ceil((core.camX + core.canvas.width) / core.TILE_SIZE);
  const endRow = Math.ceil((core.camY + core.canvas.height) / core.TILE_SIZE);

  for (let row = startRow; row < endRow; row++) {
    for (let col = startCol; col < endCol; col++) {
      if (row < 0 || col < 0 || row >= core.WORLD_ROWS || col >= core.WORLD_COLS) continue;

      const tileIndex = worldMap[row][col];
      drawTile(tileIndex, col, row);
    }
  }
}

/**
 * Dibuja las decoraciones del mundo
 */
export function drawDecorations() {
  const minX = core.camX - 32;
  const maxX = core.camX + core.canvas.width + 32;
  const minY = core.camY - 32;
  const maxY = core.camY + core.canvas.height + 32;

  decorations.forEach(obj => {
    if (obj.x < minX || obj.x > maxX || obj.y < minY || obj.y > maxY) {
      return;
    }

    const list = obj.type === "grass" ? core.imgGrass : core.imgRock;
    const img = list[obj.variant];
    if (!img) return;

    const dx = obj.x - core.camX + core.screenShake.x;
    const dy = obj.y - core.camY + core.screenShake.y;

    if (obj.isObstacle && obj.type === "rock") {
      const cacheKey = `rock_${obj.variant}`;

      if (!core.tintedRocksCache[cacheKey]) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext('2d');

        tempCtx.drawImage(img, 0, 0);

        tempCtx.globalCompositeOperation = 'multiply';
        tempCtx.fillStyle = '#884444';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        tempCtx.globalCompositeOperation = 'destination-in';
        tempCtx.drawImage(img, 0, 0);

        core.tintedRocksCache[cacheKey] = tempCanvas;
      }

      core.ctx.drawImage(core.tintedRocksCache[cacheKey], 0, 0, img.width, img.height, dx, dy, obj.width, obj.height);
    } else {
      core.ctx.drawImage(img, dx, dy);
    }
  });
}

/**
 * Dibuja el jugador con animaciones
 */
export function drawPlayer() {
  const player = entities.player;
  if (!core.imgPlayer || !player) return;

  const animations = {
    idle:   { row: 0, frames: 6,  fps: 6  },
    walk:   { row: 1, frames: 8,  fps: 10 },
    attack: { row: 3, frames: 7,  fps: 12 },
    death:  { row: 6, frames: 10, fps: 12 }
  };

  const anim = animations[player.animState] || animations.idle;

  let frame = Math.floor(player.animTime * anim.fps) % anim.frames;

  const sx = frame * core.PLAYER_W;
  const sy = anim.row * core.PLAYER_H;

  const dx = Math.round(player.x - core.camX + core.screenShake.x);
  const dy = Math.round(player.y - core.camY + core.screenShake.y);

  const scaledW = core.PLAYER_W * core.PLAYER_SCALE;
  const scaledH = core.PLAYER_H * core.PLAYER_SCALE;

  core.ctx.drawImage(
    core.imgPlayer,
    sx, sy, core.PLAYER_W, core.PLAYER_H,
    dx, dy, scaledW, scaledH
  );
}

/**
 * Dibuja todos los proyectiles activos
 */
export function drawBullets() {
  if (!core.imgBullet) return;

  const margin = 20;
  const minX = core.camX - margin;
  const maxX = core.camX + core.canvas.width + margin;
  const minY = core.camY - margin;
  const maxY = core.camY + core.canvas.height + margin;

  entities.bullets.forEach(b => {
    if (b.x < minX || b.x > maxX || b.y < minY || b.y > maxY) {
      return;
    }

    const sx = b.frame * core.BULLET_W;
    const sy = 0;

    const dx = b.x - core.camX + core.screenShake.x;
    const dy = b.y - core.camY + core.screenShake.y;

    core.ctx.save();
    core.ctx.translate(dx + core.BULLET_W / 2, dy + core.BULLET_H / 2);
    core.ctx.rotate(Math.atan2(b.vy, b.vx));

    core.ctx.drawImage(
      core.imgBullet,
      sx, sy, core.BULLET_W, core.BULLET_H,
      -core.BULLET_W / 2, -core.BULLET_H / 2,
      core.BULLET_W, core.BULLET_H
    );

    core.ctx.restore();
  });
}

/**
 * Dibuja todas las explosiones activas
 */
export function drawExplosions() {
  const margin = 100;
  const minX = core.camX - margin;
  const maxX = core.camX + core.canvas.width + margin;
  const minY = core.camY - margin;
  const maxY = core.camY + core.canvas.height + margin;

  entities.explosions.forEach(e => {
    if (e.x < minX || e.x > maxX || e.y < minY || e.y > maxY) {
      return;
    }

    core.ctx.globalAlpha = e.life;

    const dx = e.x - core.camX + core.screenShake.x;
    const dy = e.y - core.camY + core.screenShake.y;

    let gradient = core.ctx.createRadialGradient(dx, dy, 0, dx, dy, e.radius);
    gradient.addColorStop(0, "#ffff00");
    gradient.addColorStop(0.3, "#ff6600");
    gradient.addColorStop(0.7, "#ff3300");
    gradient.addColorStop(1, "rgba(255, 0, 0, 0)");

    core.ctx.fillStyle = gradient;
    core.ctx.beginPath();
    core.ctx.arc(dx, dy, e.radius, 0, Math.PI * 2);
    core.ctx.fill();

    core.ctx.globalAlpha = 1;
  });
}

/**
 * Dibuja todas las partículas activas
 */
export function drawParticles() {
  const margin = 20;
  const minX = core.camX - margin;
  const maxX = core.camX + core.canvas.width + margin;
  const minY = core.camY - margin;
  const maxY = core.camY + core.canvas.height + margin;

  entities.particles.forEach(p => {
    if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) {
      return;
    }

    core.ctx.globalAlpha = p.life;
    core.ctx.fillStyle = p.color;
    core.ctx.beginPath();
    core.ctx.arc(p.x - core.camX, p.y - core.camY, p.size, 0, Math.PI * 2);
    core.ctx.fill();
  });
  core.ctx.globalAlpha = 1;
}

/**
 * Dibuja todos los enemigos con animaciones
 */
export function drawEnemies() {
  const nearestEnemy = entities.findNearestEnemy();

  const visibleMargin = 50;
  const minX = core.camX - visibleMargin;
  const maxX = core.camX + core.canvas.width + visibleMargin;
  const minY = core.camY - visibleMargin;
  const maxY = core.camY + core.canvas.height + visibleMargin;

  entities.enemies.forEach(e => {
    const scaledW = core.ENEMY_W * e.scale;
    const scaledH = core.ENEMY_H * e.scale;

    if (e.x + scaledW < minX || e.x > maxX || e.y + scaledH < minY || e.y > maxY) {
      return;
    }

    let img;
    let frameCount;
    let frame = e.frame;
    let tintedImg = null;

    if (e.state === "death") {
      frameCount = core.ENEMY_DEATH_FRAMES;
      if (frame >= frameCount) frame = frameCount - 1;
      img = (e.facing === "up") ? core.imgEnemyDeathSU : core.imgEnemyDeathSD;
    } else {
      frameCount = core.ENEMY_RUN_FRAMES;
      frame = frame % frameCount;
      img = (e.facing === "up") ? core.imgEnemyRunSU : core.imgEnemyRunSD;

      // Usar sprite cacheado con tint
      if (e.type.tint) {
        tintedImg = entities.getTintedSprite(
          img, 0, 0, core.ENEMY_W, core.ENEMY_H,
          e.type.color, e.facing, e.type.name
        );
      }
    }

    const sx = frame * core.ENEMY_W;
    const sy = 0;

    const dx = e.x - core.camX + core.screenShake.x;
    const dy = e.y - core.camY + core.screenShake.y;

    if (e === nearestEnemy && e.state !== "death") {
      core.ctx.strokeStyle = "#ffff00";
      core.ctx.lineWidth = 2;
      core.ctx.beginPath();
      core.ctx.arc(dx + scaledW / 2, dy + scaledH / 2, scaledW / 2 + 5, 0, Math.PI * 2);
      core.ctx.stroke();
    }

    if (tintedImg) {
      core.ctx.drawImage(
        tintedImg,
        sx, sy, core.ENEMY_W, core.ENEMY_H,
        dx, dy, scaledW, scaledH
      );
    } else {
      core.ctx.drawImage(
        img,
        sx, sy, core.ENEMY_W, core.ENEMY_H,
        dx, dy, scaledW, scaledH
      );
    }

    if (e.state !== "death") {
      const barW = scaledW;
      const barH = 4;
      const barX = dx;
      const barY = dy - 8;

      core.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      core.ctx.fillRect(barX, barY, barW, barH);

      const hpPercent = Math.max(0, e.hp / e.maxHp);
      core.ctx.fillStyle = hpPercent > 0.5 ? "#00ff00" : (hpPercent > 0.25 ? "#ffaa00" : "#ff0000");
      core.ctx.fillRect(barX, barY, barW * hpPercent, barH);

      core.ctx.strokeStyle = "#fff";
      core.ctx.lineWidth = 1;
      core.ctx.strokeRect(barX, barY, barW, barH);
    }
  });
}

/**
 * Dibuja la interfaz de usuario
 */
export function drawHUD() {
  const player = entities.player;
  if (!player) return;

  const padding = 20;
  const barHeight = 30;
  const barSpacing = 5;

  const textColor = core.highContrastMode ? "#000000" : "#fff";
  const bgColor = core.highContrastMode ? "#ffffff" : "rgba(31, 31, 46, 0.9)";

  const panelWidth = 520;
  const panelX = (core.canvas.width - panelWidth) / 2;
  const panelY = padding;

  const levelBarWidth = panelWidth;
  const levelBarHeight = 35;
  const levelBarX = panelX;
  const levelBarY = panelY;

  core.ctx.fillStyle = bgColor;
  roundRect(core.ctx, levelBarX, levelBarY, levelBarWidth, levelBarHeight, 5);
  core.ctx.fill();

  const xpPercent = Math.max(0, Math.min(1, player.xp / player.xpToNextLevel));
  if (xpPercent > 0) {
    core.ctx.fillStyle = core.highContrastMode ? "#333333" : "#4ecdc4";
    const xpWidth = (levelBarWidth - 4) * xpPercent;
    core.ctx.globalAlpha = 0.3;
    core.ctx.fillRect(levelBarX + 2, levelBarY + 2, xpWidth, levelBarHeight - 4);
    core.ctx.globalAlpha = 1;
  }

  core.ctx.fillStyle = textColor;
  core.ctx.font = "bold 18px Arial";
  core.ctx.textAlign = "center";
  core.ctx.fillText(`LEVEL ${player.level}`, levelBarX + levelBarWidth / 2, levelBarY + 23);

  core.ctx.strokeStyle = core.highContrastMode ? "#000000" : "#4ecdc4";
  core.ctx.lineWidth = 3;
  roundRect(core.ctx, levelBarX, levelBarY, levelBarWidth, levelBarHeight, 5);
  core.ctx.stroke();
  const healthBarWidth = 310;
  const healthBarX = panelX;
  const healthBarY = levelBarY + levelBarHeight + barSpacing;

  core.ctx.fillStyle = bgColor;
  roundRect(core.ctx, healthBarX, healthBarY, healthBarWidth, barHeight, 5);
  core.ctx.fill();

  const hpPercent = Math.max(0, Math.min(1, player.hp / player.maxHp));
  if (core.highContrastMode) {
    core.ctx.fillStyle = "#000000";
  } else {
    core.ctx.fillStyle = hpPercent > 0.5 ? "#00ff00" : (hpPercent > 0.25 ? "#ffaa00" : "#ff0000");
  }
  if (hpPercent > 0) {
    const hpWidth = (healthBarWidth - 4) * hpPercent;
    core.ctx.fillRect(healthBarX + 2, healthBarY + 2, hpWidth, barHeight - 4);
  }

  core.ctx.strokeStyle = core.highContrastMode ? "#000000" : "#555";
  core.ctx.lineWidth = 2;
  roundRect(core.ctx, healthBarX, healthBarY, healthBarWidth, barHeight, 5);
  core.ctx.stroke();

  core.ctx.fillStyle = textColor;
  core.ctx.font = "bold 16px Arial";
  core.ctx.textAlign = "center";
  core.ctx.fillText(`HP: ${Math.ceil(player.hp)} / ${player.maxHp}`, healthBarX + healthBarWidth / 2, healthBarY + 20);
  const reloadBarWidth = 200;
  const reloadBarX = healthBarX + healthBarWidth + 10;
  const reloadBarY = healthBarY;

  core.ctx.fillStyle = bgColor;
  roundRect(core.ctx, reloadBarX, reloadBarY, reloadBarWidth, barHeight, 5);
  core.ctx.fill();

  if (player.isReloading) {
    const reloadProgress = Math.min(1, (Date.now() - player.reloadStartTime) / player.reloadTime);
    core.ctx.fillStyle = core.highContrastMode ? "#000000" : "#ff6600";
    if (reloadProgress > 0) {
      const reloadWidth = (reloadBarWidth - 4) * reloadProgress;
      core.ctx.fillRect(reloadBarX + 2, reloadBarY + 2, reloadWidth, barHeight - 4);
    }
  }

  core.ctx.strokeStyle = core.highContrastMode ? "#000000" : "#555";
  core.ctx.lineWidth = 2;
  roundRect(core.ctx, reloadBarX, reloadBarY, reloadBarWidth, barHeight, 5);
  core.ctx.stroke();

  core.ctx.fillStyle = textColor;
  core.ctx.font = "bold 16px Arial";
  core.ctx.textAlign = "center";
  if (player.isReloading) {
    core.ctx.fillText("RELOADING...", reloadBarX + reloadBarWidth / 2, reloadBarY + 20);
  } else {
    core.ctx.fillText(`AMMO: ${player.ammo}/${player.maxAmmo}`, reloadBarX + reloadBarWidth / 2, reloadBarY + 20);
  }

  core.ctx.textAlign = "right";

  let timeLeft = Math.max(0, survivalTime - core.gameTime);
  let minutes = Math.floor(timeLeft / 60000);
  let seconds = Math.floor((timeLeft % 60000) / 1000);
  const timerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  core.ctx.font = "bold 24px Arial";
  if (core.highContrastMode) {
    core.ctx.fillStyle = "#000000";
  } else {
    core.ctx.fillStyle = timeLeft < 60000 ? "#ff3333" : "#fff";
  }
  core.ctx.fillText(timerText, core.canvas.width - padding, 35);

  core.ctx.fillText(`Kills: ${core.kills}`, core.canvas.width - padding, 65);

  core.ctx.font = "bold 12px Arial";
  if (core.highContrastMode) {
    core.ctx.fillStyle = "#000000";
  } else {
    core.ctx.fillStyle = fps < 30 ? "#ff3333" : (fps < 50 ? "#ffaa00" : "#00ff00");
  }
  core.ctx.fillText(`FPS: ${fps}`, core.canvas.width - padding, 95);

  core.ctx.fillStyle = core.highContrastMode ? "#000000" : (entities.enemies.length >= core.MAX_ENEMIES ? "#ff3333" : "#aaa");
  core.ctx.fillText(`Enemies: ${entities.enemies.length}/${core.MAX_ENEMIES}`, core.canvas.width - padding, 115);
  const btnSize = 35;
  const btnPadding = 5;
  const btnY = core.canvas.height - btnSize - padding;

  const muteX = core.canvas.width - padding - btnSize;
  core.ctx.fillStyle = core.audioMuted ? "rgba(255, 100, 100, 0.8)" : "rgba(78, 205, 196, 0.8)";
  roundRect(core.ctx, muteX, btnY, btnSize, btnSize, 5);
  core.ctx.fill();

  core.ctx.strokeStyle = "#fff";
  core.ctx.lineWidth = 2;
  roundRect(core.ctx, muteX, btnY, btnSize, btnSize, 5);
  core.ctx.stroke();

  core.ctx.fillStyle = "#fff";
  core.ctx.font = "bold 18px Arial";
  core.ctx.textAlign = "center";
  core.ctx.fillText(core.audioMuted ? "🔇" : "🔊", muteX + btnSize / 2, btnY + btnSize / 2 + 6);

  const contrastX = muteX - btnSize - btnPadding;
  core.ctx.fillStyle = core.highContrastMode ? "rgba(255, 255, 0, 0.8)" : "rgba(100, 100, 100, 0.8)";
  roundRect(core.ctx, contrastX, btnY, btnSize, btnSize, 5);
  core.ctx.fill();

  core.ctx.strokeStyle = "#fff";
  core.ctx.lineWidth = 2;
  roundRect(core.ctx, contrastX, btnY, btnSize, btnSize, 5);
  core.ctx.stroke();

  core.ctx.fillStyle = "#fff";
  core.ctx.font = "bold 16px Arial";
  core.ctx.fillText("◐", contrastX + btnSize / 2, btnY + btnSize / 2 + 6);

  const helpX = contrastX - btnSize - btnPadding;
  core.ctx.fillStyle = core.showControlsScreen ? "rgba(255, 230, 109, 0.8)" : "rgba(100, 100, 100, 0.8)";
  roundRect(core.ctx, helpX, btnY, btnSize, btnSize, 5);
  core.ctx.fill();

  core.ctx.strokeStyle = "#fff";
  core.ctx.lineWidth = 2;
  roundRect(core.ctx, helpX, btnY, btnSize, btnSize, 5);
  core.ctx.stroke();

  core.ctx.fillStyle = "#fff";
  core.ctx.font = "bold 20px Arial";
  core.ctx.fillText("?", helpX + btnSize / 2, btnY + btnSize / 2 + 7);

  core.ctx.textAlign = "left";
}

/**
 * Dibuja la pantalla del menú principal
 */
export function drawMenu() {
  core.ctx.fillStyle = "#0f0f1a";
  core.ctx.fillRect(0, 0, core.canvas.width, core.canvas.height);

  core.ctx.fillStyle = "#4ecdc4";
  core.ctx.font = "bold 36px Arial";
  core.ctx.textAlign = "center";
  core.ctx.fillText("SURVIVE 20 MINUTES", core.canvas.width / 2, core.canvas.height / 2 - 60);

  core.ctx.fillStyle = "#fff";
  core.ctx.font = "20px Arial";
  core.ctx.fillText("Click to Start", core.canvas.width / 2, core.canvas.height / 2);

  core.ctx.font = "14px Arial";
  core.ctx.fillStyle = "#999";
  core.ctx.fillText("WASD - Move | SPACE - Shoot | ESC - Pause | H - Help", core.canvas.width / 2, core.canvas.height - 30);

  core.ctx.textAlign = "left";
}

/**
 * Dibuja la pantalla de pausa
 */
export function drawPaused() {
  core.ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
  core.ctx.fillRect(0, 0, core.canvas.width, core.canvas.height);

  core.ctx.fillStyle = "#4ecdc4";
  core.ctx.font = "bold 48px Arial";
  core.ctx.textAlign = "center";
  core.ctx.fillText("PAUSED", core.canvas.width / 2, core.canvas.height / 2 - 20);

  core.ctx.fillStyle = "#fff";
  core.ctx.font = "18px Arial";
  core.ctx.fillText("Press ESC to continue", core.canvas.width / 2, core.canvas.height / 2 + 20);

  core.ctx.textAlign = "left";
}

/**
 * Dibuja la pantalla de controles
 */
export function drawControlsScreen() {
  core.ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
  core.ctx.fillRect(0, 0, core.canvas.width, core.canvas.height);

  const panelWidth = 500;
  const panelHeight = 480;
  const panelX = (core.canvas.width - panelWidth) / 2;
  const panelY = (core.canvas.height - panelHeight) / 2;

  core.ctx.fillStyle = "rgba(15, 15, 26, 0.95)";
  roundRect(core.ctx, panelX, panelY, panelWidth, panelHeight, 15);
  core.ctx.fill();

  core.ctx.strokeStyle = "#4ecdc4";
  core.ctx.lineWidth = 3;
  roundRect(core.ctx, panelX, panelY, panelWidth, panelHeight, 15);
  core.ctx.stroke();

  core.ctx.fillStyle = "#4ecdc4";
  core.ctx.font = "bold 32px Arial";
  core.ctx.textAlign = "center";
  core.ctx.fillText("CONTROLES", core.canvas.width / 2, panelY + 50);

  core.ctx.font = "18px Arial";
  core.ctx.fillStyle = "#fff";
  let y = panelY + 100;
  const lineHeight = 35;

  Object.values(core.controlsInfo).forEach(control => {
    core.ctx.textAlign = "left";
    core.ctx.fillText("•", panelX + 40, y);
    core.ctx.fillText(control, panelX + 60, y);
    y += lineHeight;
  });

  core.ctx.fillStyle = "#ffe66d";
  core.ctx.font = "bold 20px Arial";
  core.ctx.textAlign = "center";
  core.ctx.fillText("OBJETIVO", core.canvas.width / 2, panelY + 330);

  core.ctx.fillStyle = "#aaa";
  core.ctx.font = "16px Arial";
  core.ctx.fillText("Sobrevive 20 minutos eliminando enemigos", core.canvas.width / 2, panelY + 360);
  core.ctx.fillText("Sube de nivel y mejora tus habilidades", core.canvas.width / 2, panelY + 385);

  core.ctx.fillStyle = "#999";
  core.ctx.font = "14px Arial";
  core.ctx.fillText("Presiona H o ESC para cerrar", core.canvas.width / 2, panelY + panelHeight - 20);

  core.ctx.textAlign = "left";
}

/**
 * Dibuja la pantalla de subida de nivel
 */
export function drawLevelUp() {
  core.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  core.ctx.fillRect(0, 0, core.canvas.width, core.canvas.height);

  const panelWidth = 720;
  const panelHeight = 350;
  const panelX = (core.canvas.width - panelWidth) / 2;
  const panelY = (core.canvas.height - panelHeight) / 2;

  core.ctx.fillStyle = "rgba(15, 15, 26, 0.95)";
  roundRect(core.ctx, panelX, panelY, panelWidth, panelHeight, 15);
  core.ctx.fill();

  core.ctx.strokeStyle = "#4ecdc4";
  core.ctx.lineWidth = 3;
  roundRect(core.ctx, panelX, panelY, panelWidth, panelHeight, 15);
  core.ctx.stroke();

  core.ctx.fillStyle = "#ffe66d";
  core.ctx.font = "bold 38px Arial";
  core.ctx.textAlign = "center";
  core.ctx.fillText(`LEVEL ${entities.player.level} UP!`, core.canvas.width / 2, panelY + 55);

  core.ctx.fillStyle = "#aaa";
  core.ctx.font = "16px Arial";
  core.ctx.fillText("Choose an upgrade:", core.canvas.width / 2, panelY + 85);

  const cardWidth = 200;
  const cardHeight = 180;
  const spacing = 20;
  const totalWidth = (cardWidth * 3) + (spacing * 2);
  const startX = (core.canvas.width - totalWidth) / 2;
  const cardY = panelY + 120;

  entities.currentUpgradeOptions.forEach((upgrade, i) => {
    const x = startX + i * (cardWidth + spacing);
    const y = cardY;

    const isHovering = mousePos.x > x && mousePos.x < x + cardWidth &&
                      mousePos.y > y && mousePos.y < y + cardHeight;

    const offsetY = isHovering ? -5 : 0;
    const cardYPos = y + offsetY;

    core.ctx.fillStyle = isHovering ? "rgba(42, 42, 62, 0.95)" : "rgba(31, 31, 46, 0.9)";
    roundRect(core.ctx, x, cardYPos, cardWidth, cardHeight, 10);
    core.ctx.fill();

    core.ctx.strokeStyle = isHovering ? "#4ecdc4" : "#555";
    core.ctx.lineWidth = isHovering ? 4 : 2;
    roundRect(core.ctx, x, cardYPos, cardWidth, cardHeight, 10);
    core.ctx.stroke();

    core.ctx.fillStyle = isHovering ? "#4ecdc4" : "#555";
    core.ctx.beginPath();
    core.ctx.arc(x + cardWidth / 2, cardYPos + 30, 12, 0, Math.PI * 2);
    core.ctx.fill();

    core.ctx.fillStyle = isHovering ? "#4ecdc4" : "#fff";
    core.ctx.font = "bold 16px Arial";
    core.ctx.textAlign = "center";
    const lines = wrapText(upgrade.name, cardWidth - 20);
    lines.forEach((line, idx) => {
      core.ctx.fillText(line, x + cardWidth / 2, cardYPos + 65 + idx * 20);
    });

    core.ctx.fillStyle = "#ccc";
    core.ctx.font = "13px Arial";
    const descLines = wrapText(upgrade.description, cardWidth - 30);
    descLines.forEach((line, idx) => {
      core.ctx.fillText(line, x + cardWidth / 2, cardYPos + 110 + idx * 18);
    });

    if (isHovering) {
      core.ctx.fillStyle = "#4ecdc4";
      core.ctx.font = "bold 12px Arial";
      core.ctx.fillText("CLICK TO SELECT", x + cardWidth / 2, cardYPos + cardHeight - 15);
    }
  });

  core.ctx.textAlign = "left";
}

/**
 * Dibuja la pantalla de game over
 */
export function drawGameOver() {
  const player = entities.player;
  
  core.ctx.fillStyle = "rgba(60, 0, 0, 0.95)";
  core.ctx.fillRect(0, 0, core.canvas.width, core.canvas.height);

  core.ctx.fillStyle = "#ff3333";
  core.ctx.font = "bold 48px Arial";
  core.ctx.textAlign = "center";
  core.ctx.fillText("GAME OVER", core.canvas.width / 2, core.canvas.height / 2 - 120);

  core.ctx.fillStyle = "#fff";
  core.ctx.font = "bold 20px Arial";
  core.ctx.fillText("Your Stats:", core.canvas.width / 2, core.canvas.height / 2 - 70);

  core.ctx.font = "18px Arial";
  let minutes = Math.floor(core.gameTime / 60000);
  let seconds = Math.floor((core.gameTime % 60000) / 1000);
  core.ctx.fillText(`Survived: ${minutes}:${seconds.toString().padStart(2, '0')}`, core.canvas.width / 2, core.canvas.height / 2 - 40);
  core.ctx.fillText(`Kills: ${core.kills}`, core.canvas.width / 2, core.canvas.height / 2 - 10);
  core.ctx.fillText(`Level: ${player.level}`, core.canvas.width / 2, core.canvas.height / 2 + 20);

  core.ctx.fillStyle = "#ffe66d";
  core.ctx.font = "bold 18px Arial";
  core.ctx.fillText("Best Records:", core.canvas.width / 2, core.canvas.height / 2 + 60);

  core.ctx.fillStyle = "#4ecdc4";
  core.ctx.font = "14px Arial";
  let bestMin = Math.floor(core.gameData.highScores.longestSurvival / 60000);
  let bestSec = Math.floor((core.gameData.highScores.longestSurvival % 60000) / 1000);
  core.ctx.fillText(`Best Time: ${bestMin}:${bestSec.toString().padStart(2, '0')}`, core.canvas.width / 2, core.canvas.height / 2 + 85);
  core.ctx.fillText(`Most Kills: ${core.gameData.highScores.mostKills}`, core.canvas.width / 2, core.canvas.height / 2 + 105);
  core.ctx.fillText(`Highest Level: ${core.gameData.highScores.highestLevel}`, core.canvas.width / 2, core.canvas.height / 2 + 125);

  core.ctx.fillStyle = "#999";
  core.ctx.font = "14px Arial";
  core.ctx.fillText("Click to return to menu", core.canvas.width / 2, core.canvas.height / 2 + 160);

  core.ctx.textAlign = "left";
}

/**
 * Dibuja la pantalla de victoria
 */
export function drawVictory() {
  const player = entities.player;
  
  core.ctx.fillStyle = "rgba(0, 60, 0, 0.95)";
  core.ctx.fillRect(0, 0, core.canvas.width, core.canvas.height);

  core.ctx.fillStyle = "#00ff00";
  core.ctx.font = "bold 48px Arial";
  core.ctx.textAlign = "center";
  core.ctx.fillText("VICTORY!", core.canvas.width / 2, core.canvas.height / 2 - 120);

  core.ctx.fillStyle = "#ffe66d";
  core.ctx.font = "20px Arial";
  core.ctx.fillText(`You survived 20 minutes!`, core.canvas.width / 2, core.canvas.height / 2 - 70);

  core.ctx.fillStyle = "#fff";
  core.ctx.font = "18px Arial";
  core.ctx.fillText(`Kills: ${core.kills}`, core.canvas.width / 2, core.canvas.height / 2 - 30);
  core.ctx.fillText(`Final Level: ${player.level}`, core.canvas.width / 2, core.canvas.height / 2);

  core.ctx.fillStyle = "#ffe66d";
  core.ctx.font = "bold 18px Arial";
  core.ctx.fillText("Best Records:", core.canvas.width / 2, core.canvas.height / 2 + 45);

  core.ctx.fillStyle = "#4ecdc4";
  core.ctx.font = "14px Arial";
  core.ctx.fillText(`Most Kills: ${core.gameData.highScores.mostKills}`, core.canvas.width / 2, core.canvas.height / 2 + 70);
  core.ctx.fillText(`Highest Level: ${core.gameData.highScores.highestLevel}`, core.canvas.width / 2, core.canvas.height / 2 + 90);

  core.ctx.fillStyle = "#aaa";
  core.ctx.font = "12px Arial";
  core.ctx.fillText(`Total Games Played: ${core.gameData.stats.totalGames}`, core.canvas.width / 2, core.canvas.height / 2 + 120);
  core.ctx.fillText(`Total Kills: ${core.gameData.stats.totalKills}`, core.canvas.width / 2, core.canvas.height / 2 + 135);

  core.ctx.fillStyle = "#999";
  core.ctx.font = "14px Arial";
  core.ctx.fillText("Click to return to menu", core.canvas.width / 2, core.canvas.height / 2 + 165);

  core.ctx.textAlign = "left";
}