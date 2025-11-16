// === CONTROLES TÁCTILES PARA MÓVIL ===
if (isTouchDevice) {
  canvas.addEventListener("touchstart", (e) => {
    // En menús / upgrades / game over: DEJAR que se genere el click
    if (gameState !== "playing") {
      return;
    }

    // En juego sí bloqueamos el comportamiento por defecto
    e.preventDefault();

    if (loadError || isLoading) return;

    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    const x = t.clientX - rect.left;
    const y = t.clientY - rect.top;

    const mitad = canvas.width / 2;

    // 👉 TAP EN EL LADO DERECHO = DISPARAR
    if (x > mitad) {
      shootBullet();
      return;
    }

    // 👉 LADO IZQUIERDO = JOYSTICK DE MOVIMIENTO
    touchInput.active = true;
    touchInput.startX = x;
    touchInput.startY = y;
    touchInput.deltaX = 0;
    touchInput.deltaY = 0;
  }, { passive: false });

  canvas.addEventListener("touchmove", (e) => {
    if (gameState !== "playing") return;
    if (!touchInput.active) return;

    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    const x = t.clientX - rect.left;
    const y = t.clientY - rect.top;

    touchInput.deltaX = x - touchInput.startX;
    touchInput.deltaY = y - touchInput.startY;
  }, { passive: false });

  canvas.addEventListener("touchend", (e) => {
    if (gameState !== "playing") {
      // En menús, dejamos que ese touch genere el click
      return;
    }

    e.preventDefault();

    touchInput.active = false;
    touchInput.deltaX = 0;
    touchInput.deltaY = 0;
  }, { passive: false });
}

// ====== INPUT EVENTS ======
window.addEventListener("keydown", e => {
  if (e.code === "Escape") {
    if (showControlsScreen) {
      showControlsScreen = false;
      console.log("📖 Controles ocultados");
      return;
    }

    if (gameState === "playing") {
      gameState = "paused";
    } else if (gameState === "paused") {
      gameState = "playing";
    }
  }

  if (e.code === "Space") {
    if (gameState === "menu") {
      gameState = "playing";
      startTime = performance.now();
      playMusic();
    } else if (gameState === "playing") {
      gameState = "paused";
    } else if (gameState === "paused") {
      gameState = "playing";
    }
  }

  if (e.code === "KeyM") {
    toggleMute();
  }

  if (e.code === "KeyH") {
    showControlsScreen = !showControlsScreen;
    console.log(showControlsScreen ? "📖 Controles mostrados" : "📖 Controles ocultados");
  }

  keys[e.code] = true;
});

window.addEventListener("keyup", e => {
  keys[e.code] = false;
});

canvas.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  mousePos.x = e.clientX - rect.left;
  mousePos.y = e.clientY - rect.top;
});

canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  if (gameState === "menu") {
    gameState = "playing";
    startTime = performance.now();
    playMusic();
    return;
  }

  if (gameState === "paused") {
    gameState = "playing";
    return;
  }

  if (gameState === "playing") {
    shootBullet();
    return;
  }

  if (gameState === "levelup") {
    const panelWidth = 600;
    const panelHeight = 260;
    const panelX = (canvas.width - panelWidth) / 2;
    const panelY = (canvas.height - panelHeight) / 2;

    const cardWidth = 160;
    const cardHeight = 130;
    const spacing = 20;
    const totalWidth = cardWidth * currentUpgradeOptions.length + spacing * (currentUpgradeOptions.length - 1);
    const startX = (canvas.width - totalWidth) / 2;
    const cardY = panelY + 120;

    currentUpgradeOptions.forEach((upgrade, i) => {
      const x = startX + i * (cardWidth + spacing);
      if (mx > x && mx < x + cardWidth && my > cardY && my < cardY + cardHeight) {
        upgrade.apply();
        gameState = "playing";
      }
    });
  } else if (gameState === "gameover" || gameState === "victory") {
    gameState = "menu";
  }
});
