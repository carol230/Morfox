/**
 * ====== ENTITIES.JS - Manejo de todas las entidades del juego ======
 *
 * Este módulo gestiona todas las entidades del juego incluyendo:
 * - Jugador (movimiento, combate, stats)
 * - Enemigos (IA, spawning, tipos)
 * - Proyectiles (balas, granadas)
 * - Explosiones y partículas
 * - Sistema de upgrades y nivel
 *
 * @module entities
 * @requires core
 */

import * as core from './core.js';

// ====== TIPOS DE ENEMIGOS EXTENDIDOS ======
export const ENEMY_TYPES_EXTENDED = {
    FAST: {
        name: "Runner",
        color: "#e74c3c",
        tint: [231, 76, 60],
        size: 14,
        speed: 80,
        hp: 2,
        damage: 6,
        xp: 2,
        weight: 70,
        minTime: 30000
    },
    TANK: {
        name: "Brute",
        color: "#2ecc71",
        tint: [46, 204, 113],
        size: 28,
        speed: 25,
        hp: 18,
        damage: 15,
        xp: 5,
        weight: 40,
        minTime: 90000
    },
    SWARM: {
        name: "Imp",
        color: "#f39c12",
        tint: [243, 156, 18],
        size: 12,
        speed: 55,
        hp: 1,
        damage: 4,
        xp: 1,
        weight: 80,
        minTime: 60000
    },
    SPITTER: {
        name: "Spitter",
        color: "#9b59b6",
        tint: [155, 89, 182],
        size: 16,
        speed: 30,
        hp: 4,
        damage: 10,
        xp: 3,
        weight: 50,
        minTime: 120000
    },
    BERSERKER: {
        name: "Berserker",
        color: "#e67e22",
        tint: [230, 126, 34],
        size: 22,
        speed: 65,
        hp: 8,
        damage: 12,
        xp: 4,
        weight: 35,
        minTime: 150000
    },
    HEAVY: {
        name: "Heavy",
        color: "#34495e",
        tint: [52, 73, 94],
        size: 32,
        speed: 18,
        hp: 25,
        damage: 20,
        xp: 8,
        weight: 20,
        minTime: 180000
    },
    SHADOW: {
        name: "Shadow",
        color: "#2c3e50",
        tint: [44, 62, 80],
        size: 15,
        speed: 90,
        hp: 3,
        damage: 10,
        xp: 3,
        weight: 30,
        minTime: 240000
    },
    ELITE: {
        name: "Elite",
        color: "#16a085",
        tint: [22, 160, 133],
        size: 24,
        speed: 50,
        hp: 15,
        damage: 18,
        xp: 7,
        weight: 25,
        minTime: 300000
    },
    BOSS: {
        name: "Boss",
        color: "#c0392b",
        tint: [192, 57, 43],
        size: 40,
        speed: 20,
        hp: 60,
        damage: 25,
        xp: 25,
        weight: 8,
        minTime: 360000
    },
    CHAMPION: {
        name: "Champion",
        color: "#d35400",
        tint: [211, 84, 0],
        size: 26,
        speed: 45,
        hp: 20,
        damage: 20,
        xp: 10,
        weight: 15,
        minTime: 420000
    },
    NIGHTMARE: {
        name: "Nightmare",
        color: "#8e44ad",
        tint: [142, 68, 173],
        size: 35,
        speed: 35,
        hp: 40,
        damage: 30,
        xp: 20,
        weight: 10,
        minTime: 480000
    }
};

export const ALL_ENEMY_TYPES = { ...core.ENEMY_TYPES, ...ENEMY_TYPES_EXTENDED };

// ====== VARIABLES DE ENTIDADES ======
export let player = null;
export let bullets = [];
export let enemies = [];
export let explosions = [];
export let particles = [];

// ====== SISTEMA DE UPGRADES ======
export const UPGRADES = [
    {
        name: "Velocidad +",
        description: "Aumenta velocidad de movimiento",
        apply: () => player.speed += 15
    },
    {
        name: "Vida Máxima +",
        description: "+15 HP máximo y cura parcial",
        apply: () => {
            player.maxHp += 15;
            player.hp = Math.min(player.maxHp, player.hp + 15);
        }
    },
    {
        name: "Cadencia +",
        description: "Dispara más rápido",
        apply: () => player.fireRate = Math.max(400, player.fireRate - 80)
    },
    {
        name: "Daño Explosión +",
        description: "Aumenta daño de explosión",
        apply: () => player.explosionDamage += 0.5
    },
    {
        name: "Radio Explosión +",
        description: "Mayor área de explosión",
        apply: () => player.explosionRadius += 12
    },
    {
        name: "Granada Extra",
        description: "Dispara una granada adicional",
        apply: () => player.projectileCount += 1
    },
    {
        name: "Munición Máxima +",
        description: "+1 granada en el cargador",
        apply: () => {
            player.maxAmmo += 1;
            player.ammo = player.maxAmmo;
        }
    },
    {
        name: "Recarga Rápida",
        description: "Reduce tiempo de recarga",
        apply: () => player.reloadTime = Math.max(1000, player.reloadTime - 250)
    },
    {
        name: "Granadas Rápidas",
        description: "Aumenta velocidad de granadas",
        apply: () => player.bulletSpeed += 30
    },
    {
        name: "Crítico +",
        description: "+5% probabilidad de crítico",
        apply: () => player.critChance += 0.05
    },
    {
        name: "Dispersión +",
        description: "Mayor ángulo de disparo",
        apply: () => {
            player.bulletSpread += 0.15;
            if (player.projectileCount < 2) player.projectileCount = 2;
        }
    },
    {
        name: "Robo de Vida",
        description: "Recupera 1 HP al matar",
        apply: () => player.lifeSteal += 1
    },
    {
        name: "Curación",
        description: "Restaura 30 HP",
        apply: () => player.hp = Math.min(player.maxHp, player.hp + 30)
    },
    {
        name: "Poder Explosivo",
        description: "Explosiones más potentes",
        apply: () => {
            player.explosionRadius += 15;
            player.explosionDamage += 0.8;
        }
    }
];

export let currentUpgradeOptions = [];

// ====== FUNCIONES HELPER ======
export function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return (
    ax < bx + bw &&
    ax + aw > bx &&
    ay < by + bh &&
    ay + ah > by
  );
}

// Importar decorations desde el contexto global que se creará en main
let decorations = [];

export function setDecorations(decs) {
  decorations = decs;
}

export function checkObstacleCollision(x, y, width, height) {
  for (let obj of decorations) {
    if (!obj.isObstacle) continue;

    const objCollisionX = obj.x + obj.collisionOffsetX;
    const objCollisionY = obj.y + obj.collisionOffsetY;

    if (rectsOverlap(x, y, width, height, objCollisionX, objCollisionY, obj.collisionWidth, obj.collisionHeight)) {
      return true;
    }
  }
  return false;
}

// ====== SCREEN SHAKE ======
export function applyScreenShake(intensity) {
    let shake = core.screenShake;
    shake.intensity = intensity;
    core.setScreenShake(shake);
}

export function updateScreenShake() {
    let shake = core.screenShake;
    if (shake.intensity > 0) {
        shake.x = (Math.random() - 0.5) * shake.intensity;
        shake.y = (Math.random() - 0.5) * shake.intensity;
        shake.intensity *= 0.9;
        if (shake.intensity < 0.1) {
            shake.intensity = 0;
            shake.x = 0;
            shake.y = 0;
        }
    }
    core.setScreenShake(shake);
}

// Crea sprites con tint de color usando cache para optimizar
export function getTintedSprite(img, sx, sy, width, height, color, facing, type) {
  const cacheKey = `${type}_${facing}_${color}`;

  if (core.tintedSpritesCache[cacheKey]) {
    return core.tintedSpritesCache[cacheKey];
  }

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width * core.ENEMY_RUN_FRAMES;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');

  tempCtx.drawImage(img, 0, 0);

  tempCtx.globalCompositeOperation = 'multiply';
  tempCtx.fillStyle = color;
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

  tempCtx.globalCompositeOperation = 'destination-in';
  tempCtx.drawImage(img, 0, 0);

  core.tintedSpritesCache[cacheKey] = tempCanvas;
  return tempCanvas;
}

// ====== PARTÍCULAS ======
export function createParticles(x, y, count, color) {
    if (particles.length >= core.MAX_PARTICLES) return;

    count = Math.min(count, core.MAX_PARTICLES - particles.length);

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

export function updateParticles(dt) {
    particles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 100 * dt;
        p.life -= 0.5 * dt;
        p.vx *= 0.98;
    });

    particles = particles.filter(p => p.life > 0);
}

// ====== JUGADOR ======
export function createPlayer() {
  const playerWidth = core.PLAYER_W * core.PLAYER_SCALE;
  const playerHeight = core.PLAYER_H * core.PLAYER_SCALE;

  let startX = (core.WORLD_COLS * core.TILE_SIZE) / 2 - playerWidth / 2;
  let startY = (core.WORLD_ROWS * core.TILE_SIZE) / 2 - playerHeight / 2;

  let attempts = 0;
  while (checkObstacleCollision(startX, startY, playerWidth, playerHeight) && attempts < 100) {
    const angle = attempts * 0.5;
    const radius = 30 + attempts * 5;
    startX = (core.WORLD_COLS * core.TILE_SIZE) / 2 - playerWidth / 2 + Math.cos(angle) * radius;
    startY = (core.WORLD_ROWS * core.TILE_SIZE) / 2 - playerHeight / 2 + Math.sin(angle) * radius;
    attempts++;
  }

  return {
    x: startX,
    y: startY,
    speed: 100,
    fireRate: 1000,
    lastShot: 0,
    angle: 0,

    maxHp: 80,
    hp: 80,
    xp: 0,
    level: 1,
    xpToNextLevel: 15,
    damage: 1,
    bulletSpeed: 220,
    projectileCount: 1,
    bulletSpread: 0,
    critChance: 0,
    critDamage: 1.5,
    lifeSteal: 0,

    ammo: 4,
    maxAmmo: 4,
    isReloading: false,
    reloadTime: 2500,
    reloadStartTime: 0,

    explosionRadius: 70,
    explosionDamage: 2.5,

    invulnerable: false,
    invulnerableTime: 0,

    animState: "idle",
    animTime: 0,
    width: core.PLAYER_W * core.PLAYER_SCALE,
    height: core.PLAYER_H * core.PLAYER_SCALE,
    isAttacking: false,
    alive: true
  };
}

export function setPlayer(p) {
  player = p;
}

// Importar keys y touchInput desde el contexto que se creará
let keys = {};
let touchInput = {
  active: false,
  startX: 0,
  startY: 0,
  deltaX: 0,
  deltaY: 0
};

export function setInput(k, t) {
  keys = k;
  touchInput = t;
}

export function updatePlayer(dt) {
  if (!player || core.gameState !== "playing") return;

  if (player.isReloading) {
    if (Date.now() - player.reloadStartTime >= player.reloadTime) {
      player.isReloading = false;
      player.ammo = player.maxAmmo;
    }
  }

  if (player.ammo <= 0 && !player.isReloading) {
    player.isReloading = true;
    player.reloadStartTime = Date.now();
  }

  let vx = 0;
  let vy = 0;

  if (keys["ArrowLeft"] || keys["KeyA"])  vx -= 1;
  if (keys["ArrowRight"] || keys["KeyD"]) vx += 1;
  if (keys["ArrowUp"] || keys["KeyW"])    vy -= 1;
  if (keys["ArrowDown"] || keys["KeyS"])  vy += 1;

  if (touchInput.active) {
    const deadZone = 20;

    if (Math.abs(touchInput.deltaX) > deadZone) {
      vx = touchInput.deltaX > 0 ? 1 : -1;
    }
    if (Math.abs(touchInput.deltaY) > deadZone) {
      vy = touchInput.deltaY > 0 ? 1 : -1;
    }
  }

  if (vx !== 0 && vy !== 0) {
    const inv = 1 / Math.sqrt(2);
    vx *= inv;
    vy *= inv;
  }

  const oldX = player.x;
  const oldY = player.y;

  const newX = player.x + vx * player.speed * dt;
  const newY = player.y + vy * player.speed * dt;

  if (!checkObstacleCollision(newX, newY, player.width, player.height)) {
    player.x = newX;
    player.y = newY;
  } else {
    if (!checkObstacleCollision(newX, oldY, player.width, player.height)) {
      player.x = newX;
    }
    if (!checkObstacleCollision(oldX, newY, player.width, player.height)) {
      player.y = newY;
    }
  }

  const maxX = core.WORLD_COLS * core.TILE_SIZE - player.width;
  const maxY = core.WORLD_ROWS * core.TILE_SIZE - player.height;

  if (player.x < 0) player.x = 0;
  if (player.y < 0) player.y = 0;
  if (player.x > maxX) player.x = maxX;
  if (player.y > maxY) player.y = maxY;

  let target = findNearestEnemy();
  if (target) {
    let dx = target.x - (player.x + player.width / 2);
    let dy = target.y - (player.y + player.height / 2);
    player.angle = Math.atan2(dy, dx);
  }

  const moving = vx !== 0 || vy !== 0;
  const newState = moving ? "walk" : "idle";

  if (newState !== player.animState && !player.isAttacking) {
    player.animState = newState;
    player.animTime = 0;
  } else {
    player.animTime += dt;
  }

  if (player.isAttacking) {
    const attackDuration = 7 / 12;
    if (player.animTime >= attackDuration) {
      player.isAttacking = false;
      player.animTime = 0;
      player.animState = "idle";
    }
  }

  updateCamera();
}

export function updateCamera() {
  if (!player) return;

  core.setCamX(player.x + player.width / 2 - core.canvas.width / 2);
  core.setCamY(player.y + player.height / 2 - core.canvas.height / 2);

  const maxCamX = core.WORLD_COLS * core.TILE_SIZE - core.canvas.width;
  const maxCamY = core.WORLD_ROWS * core.TILE_SIZE - core.canvas.height;

  let camX = core.camX;
  let camY = core.camY;
  camX = Math.max(0, Math.min(maxCamX, camX));
  camY = Math.max(0, Math.min(maxCamY, camY));
  core.setCamX(camX);
  core.setCamY(camY);
}

export function findNearestEnemy() {
  if (enemies.length === 0 || !player) return null;

  let nearest = null;
  let minDist = Infinity;
  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;

  for (let enemy of enemies) {
    if (enemy.state === "death") continue;

    const enemyCenterX = enemy.x + (core.ENEMY_W * enemy.scale) / 2;
    const enemyCenterY = enemy.y + (core.ENEMY_H * enemy.scale) / 2;

    let dist = Math.hypot(enemyCenterX - playerCenterX, enemyCenterY - playerCenterY);
    if (dist < minDist) {
      minDist = dist;
      nearest = enemy;
    }
  }

  return nearest;
}

// ====== BALAS Y EXPLOSIONES ======
export function shootBullet() {
  if (!player || core.gameState !== "playing") return;
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

  const targetCenterX = target.x + (core.ENEMY_W * target.scale) / 2;
  const targetCenterY = target.y + (core.ENEMY_H * target.scale) / 2;

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
      x: playerCenterX - core.BULLET_W / 2,
      y: playerCenterY - core.BULLET_H / 2,
      vx: Math.cos(angle) * player.bulletSpeed,
      vy: Math.sin(angle) * player.bulletSpeed,
      damage: player.damage,
      isGrenade: true,
      lifeTime: 0,
      maxLifeTime: 2.5,
      frame: 0,
      animTime: 0,
      alive: true
    });
  }

  player.ammo--;
  player.lastShot = now;

  core.playSound('shoot');
}

export function updateBullets(dt) {
  bullets.forEach(b => {
    b.animTime += dt * 10;
    b.frame = Math.floor(b.animTime) % core.BULLET_FRAMES;

    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.lifeTime += dt;

    if (b.lifeTime >= b.maxLifeTime && b.alive) {
      createExplosion(b.x + core.BULLET_W / 2, b.y + core.BULLET_H / 2, player.explosionRadius, player.explosionDamage);
      b.alive = false;
      return;
    }

    for (let e of enemies) {
      if (e.state === "death" || !b.alive) continue;

      const bulletCenterX = b.x + core.BULLET_W / 2;
      const bulletCenterY = b.y + core.BULLET_H / 2;
      const enemyCenterX = e.x + core.ENEMY_W / 2;
      const enemyCenterY = e.y + core.ENEMY_H / 2;

      const dist = Math.hypot(bulletCenterX - enemyCenterX, bulletCenterY - enemyCenterY);

      if (dist < (core.ENEMY_W / 2 + core.BULLET_W / 2)) {
        createExplosion(bulletCenterX, bulletCenterY, player.explosionRadius, player.explosionDamage);
        b.alive = false;
        break;
      }
    }
  });

  for (let i = bullets.length - 1; i >= 0; i--) {
    if (!bullets[i].alive) bullets.splice(i, 1);
  }
}

export function createExplosion(x, y, radius, damage) {
  explosions.push({
    x: x,
    y: y,
    radius: 0,
    maxRadius: radius,
    life: 1,
    color: "#ff6600"
  });

  createParticles(x, y, 5, "#ff6600");
  createParticles(x, y, 3, "#ffaa00");
  createParticles(x, y, 2, "#ffff00");

  applyScreenShake(10);

  core.playSound('explosion');

  enemies.forEach(e => {
    if (e.state === "death") return;

    const enemyCenterX = e.x + core.ENEMY_W / 2;
    const enemyCenterY = e.y + core.ENEMY_H / 2;
    const distance = Math.hypot(enemyCenterX - x, enemyCenterY - y);

    if (distance < radius) {
      let isCrit = Math.random() < player.critChance;
      let finalDamage = damage * (isCrit ? player.critDamage : 1);

      e.hp -= finalDamage;

      if (isCrit) {
        createParticles(e.x + core.ENEMY_W / 2, e.y + core.ENEMY_H / 2, 3, "#ffff00");
      }

      if (e.hp <= 0 && e.state !== "death") {
        e.state = "death";
        e.animTime = 0;
        e.frame = 0;
        core.incrementKills();

        player.xp += e.xp;

        if (player.lifeSteal > 0) {
          player.hp = Math.min(player.maxHp, player.hp + player.lifeSteal);
        }

        if (player.xp >= player.xpToNextLevel) {
          player.level++;
          player.xp -= player.xpToNextLevel;
          player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.5);
          core.setGameState("levelup");
          generateUpgradeOptions();

          core.playSound('levelup');
        }
      }
    }
  });
}

export function updateExplosions(dt) {
  explosions.forEach(e => {
    e.radius += (e.maxRadius - e.radius) * 0.3;
    e.life -= 1.5 * dt;
  });

  explosions = explosions.filter(e => e.life > 0);
}

// ====== ENEMIGOS ======
export function getAvailableEnemyTypes() {
  return Object.values(ALL_ENEMY_TYPES).filter(type => core.gameTime >= type.minTime);
}

export function selectRandomEnemyType(availableTypes) {
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

export function spawnEnemy() {
  if (core.gameState !== "playing") return;

  if (enemies.length >= core.MAX_ENEMIES) return;

  const margin = 100;
  let x, y;

  const side = Math.floor(Math.random() * 4);
  const camX = core.camX;
  const camY = core.camY;
  
  if (side === 0) {
    x = camX + Math.random() * core.canvas.width;
    y = camY - margin;
  } else if (side === 1) {
    x = camX + Math.random() * core.canvas.width;
    y = camY + core.canvas.height + margin;
  } else if (side === 2) {
    x = camX - margin;
    y = camY + Math.random() * core.canvas.height;
  } else {
    x = camX + core.canvas.width + margin;
    y = camY + Math.random() * core.canvas.height;
  }

  const availableTypes = getAvailableEnemyTypes();
  const type = selectRandomEnemyType(availableTypes);

  enemies.push({
    x,
    y,
    type: type,
    speed: type.speed * core.difficultyMultiplier,
    hp: type.hp * core.difficultyMultiplier,
    maxHp: type.hp * core.difficultyMultiplier,
    damage: type.damage,
    xp: type.xp,
    state: "run",
    facing: "down",
    animTime: 0,
    frame: 0,
    remove: false,
    scale: type.size / 16,
    lastHitTime: 0,
    hitCooldown: 500
  });
}

export function updateEnemies(dt) {
  if (!player || core.gameState !== "playing") return;

  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;

  const updateRadius = Math.max(core.canvas.width, core.canvas.height) * 1.2;

  enemies.forEach(e => {
    if (e.state === "death") {
      const deathFps = 10;
      e.animTime += dt;
      e.frame = Math.floor(e.animTime * deathFps);

      if (e.frame >= core.ENEMY_DEATH_FRAMES) {
        e.remove = true;
      }
      return;
    }

    const enemyCenterX = e.x + (core.ENEMY_W * e.scale) / 2;
    const enemyCenterY = e.y + (core.ENEMY_H * e.scale) / 2;

    let dx = playerCenterX - enemyCenterX;
    let dy = playerCenterY - enemyCenterY;
    let dist = Math.hypot(dx, dy);

    if (dist > updateRadius) {
      e.animTime += dt;
      e.frame = Math.floor(e.animTime * 8) % core.ENEMY_RUN_FRAMES;
      return;
    }

    if (dist > 0) {
      dx /= dist;
      dy /= dist;
    }

    e.x += dx * e.speed * dt;
    e.y += dy * e.speed * dt;

    e.facing = (dy < 0) ? "up" : "down";

    const runFps = 8;
    e.animTime += dt;
    e.frame = Math.floor(e.animTime * runFps) % core.ENEMY_RUN_FRAMES;

    const collisionRadius = (e.type.size / 2) + (player.width / 2);
    const now = Date.now();

    if (dist < collisionRadius) {
      if (now - e.lastHitTime >= e.hitCooldown) {
        player.hp -= e.damage;
        e.lastHitTime = now;
        applyScreenShake(5);

        core.playSound('hit');

        createParticles(
          player.x + player.width / 2,
          player.y + player.height / 2,
          2,
          "#ff0000"
        );

        if (player.hp <= 0) {
          core.setGameState("gameover");
          core.stopMusic();

          core.updateStats();
          core.updateHighScores(player);
          core.saveGameData();
        }
      }
    }
  });

  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].remove) enemies.splice(i, 1);
  }
}

// ====== UPGRADES ======
export function generateUpgradeOptions() {
  currentUpgradeOptions = [];
  let availableUpgrades = [...UPGRADES];

  for (let i = 0; i < 3; i++) {
    if (availableUpgrades.length === 0) break;
    let index = Math.floor(Math.random() * availableUpgrades.length);
    currentUpgradeOptions.push(availableUpgrades[index]);
    availableUpgrades.splice(index, 1);
  }
}

// ====== DIFICULTAD ======
export function updateDifficulty() {
  let minutes = core.gameTime / 60000;
  let mult = 1 + (minutes * 0.15);
  core.setDifficultyMultiplier(mult);
  
  let spawnRate = Math.max(600, 1200 - (minutes * 30));
  core.setEnemySpawnRate(spawnRate);
}

// ====== RESET ======
export function resetEntities() {
  bullets.length = 0;
  enemies.length = 0;
  particles.length = 0;
  explosions.length = 0;
  
  player = createPlayer();
  
  core.resetKills();
  core.setGameTime(0);
  core.setDifficultyMultiplier(1);
  core.setEnemyTimer(0);
}