import * as core from './core.js';
import * as entities from './entities.js';

export const keys = {};

export const touchInput = {
  active: false,
  startX: 0,
  startY: 0,
  deltaX: 0,
  deltaY: 0
};

export let mousePos = { x: core.canvas.width / 2, y: core.canvas.height / 2 };

let isLoading = true;
let loadError = null;

// Variable para resetGame callback
let resetGameCallback = null;

/**
 * Establece el estado de carga
 * @param {boolean} loading
 * @param {Error} error
 */
export function setLoadingState(loading, error = null) {
  isLoading = loading;
  loadError = error;
}

/**
 * Establece las funciones callback
 * @param {Object} callbacks
 */
export function setCallbacks(callbacks) {
  if (callbacks.resetGame) resetGameCallback = callbacks.resetGame;
}

/**
 * Configura los controles táctiles para móvil
 */
export function setupTouchControls() {
  if (!core.isTouchDevice) return;

  core.canvas.addEventListener("touchstart", (e) => {
    if (core.gameState !== "playing") {
      return;
    }

    e.preventDefault();
    if (loadError || isLoading) return;

    const rect = core.canvas.getBoundingClientRect();
    const t = e.touches[0];
    const x = t.clientX - rect.left;
    const y = t.clientY - rect.top;

    if (x > core.canvas.width / 2) {
      entities.shootBullet();
      return;
    }

    touchInput.active = true;
    touchInput.startX = x;
    touchInput.startY = y;
    touchInput.deltaX = 0;
    touchInput.deltaY = 0;
  }, { passive: false });

  core.canvas.addEventListener("touchmove", (e) => {
    if (core.gameState !== "playing") return;
    if (!touchInput.active) return;

    e.preventDefault();

    const rect = core.canvas.getBoundingClientRect();
    const t = e.touches[0];
    const x = t.clientX - rect.left;
    const y = t.clientY - rect.top;

    touchInput.deltaX = x - touchInput.startX;
    touchInput.deltaY = y - touchInput.startY;
  }, { passive: false });

  core.canvas.addEventListener("touchend", (e) => {
    if (core.gameState !== "playing") {
      return;
    }

    e.preventDefault();

    touchInput.active = false;
    touchInput.deltaX = 0;
    touchInput.deltaY = 0;
  }, { passive: false });
}

/**
 * Configura los controles de teclado
 */
export function setupKeyboardControls() {
  window.addEventListener("keydown", e => {
    if (e.code === "Escape") {
      if (core.showControlsScreen) {
        core.setShowControlsScreen(false);
        return;
      }

      if (core.gameState === "playing") {
        core.setGameState("paused");
      } else if (core.gameState === "paused") {
        core.setGameState("playing");
      }
    }

    if (e.code === "Space") {
      e.preventDefault();
      entities.shootBullet();
    }

    if (e.code === "KeyM") {
      core.toggleMute();
    }

    if (e.code === "KeyC") {
      core.toggleHighContrast();
    }

    if (e.code === "KeyH") {
      if (core.gameState === "playing" || core.gameState === "paused") {
        core.toggleControlsScreen();
      }
    }

    keys[e.code] = true;
  });

  window.addEventListener("keyup", e => {
    keys[e.code] = false;
  });
}

/**
 * Configura los controles de mouse
 */
export function setupMouseControls() {
  core.canvas.addEventListener("mousemove", e => {
    const rect = core.canvas.getBoundingClientRect();
    mousePos.x = e.clientX - rect.left;
    mousePos.y = e.clientY - rect.top;
  });

  core.canvas.addEventListener("click", e => {
    if (loadError) {
      return;
    }

    if (isLoading) {
      return;
    }

    const rect = core.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;


    // Check botones de accesibilidad (cuando está jugando)
    if (core.gameState === "playing") {
      const padding = 20;
      const btnSize = 35;
      const btnPadding = 5;
      const btnY = core.canvas.height - btnSize - padding;

      // Botón de Mute (derecha)
      const muteX = core.canvas.width - padding - btnSize;
      if (mx >= muteX && mx <= muteX + btnSize && my >= btnY && my <= btnY + btnSize) {
        core.toggleMute();
        return;
      }

      // Botón de Contraste (izquierda del mute)
      const contrastX = muteX - btnSize - btnPadding;
      if (mx >= contrastX && mx <= contrastX + btnSize && my >= btnY && my <= btnY + btnSize) {
        core.toggleHighContrast();
        return;
      }

      // Botón de Ayuda (izquierda del contraste)
      const helpX = contrastX - btnSize - btnPadding;
      if (mx >= helpX && mx <= helpX + btnSize && my >= btnY && my <= btnY + btnSize) {
        core.toggleControlsScreen();
        return;
      }
    }

    if (core.gameState === "menu") {
      if (resetGameCallback) resetGameCallback();
      core.setGameState("playing");
      core.setStartTime(Date.now());

      core.playMusic();
    } else if (core.gameState === "levelup") {
      // Check si hizo click en alguna carta de upgrade
      const panelWidth = 720;
      const panelHeight = 350;
      const panelY = (core.canvas.height - panelHeight) / 2;

      const cardWidth = 200;
      const cardHeight = 180;
      const spacing = 20;
      const totalWidth = (cardWidth * 3) + (spacing * 2);
      const startX = (core.canvas.width - totalWidth) / 2;
      const cardY = panelY + 120;


      entities.currentUpgradeOptions.forEach((upgrade, i) => {
        const x = startX + i * (cardWidth + spacing);
        if (mx > x && mx < x + cardWidth && my > cardY && my < cardY + cardHeight) {
          upgrade.apply();
          core.setGameState("playing");
        }
      });
    } else if (core.gameState === "gameover" || core.gameState === "victory") {
      core.setGameState("menu");
    }
  });
}

/**
 * Inicializa todos los sistemas de control
 */
export function setupAllControls() {
  setupKeyboardControls();
  setupMouseControls();
  setupTouchControls();
}