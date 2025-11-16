// ====== SISTEMA DE INPUT ======
// Manejo de entrada del usuario: teclado, mouse y táctil

// === CONTROLES TÁCTILES (MÓVIL) ===
// División de pantalla: izquierda = movimiento, derecha = disparo
if (isTouchDevice) {
  canvas.addEventListener("touchstart", (e) => {
    // En menús permitir que funcione el click normal
    if (gameState !== "playing") {
      return;
    }

    e.preventDefault();

    if (loadError || isLoading) return;

    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    const x = t.clientX - rect.left;
    const y = t.clientY - rect.top;

    const mitad = canvas.width / 2;

    // Lado derecho = disparar
    if (x > mitad) {
      shootBullet();
      return;
    }

    // Lado izquierdo = joystick virtual
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

    // Calcular desplazamiento desde posición inicial
    touchInput.deltaX = x - touchInput.startX;
    touchInput.deltaY = y - touchInput.startY;
  }, { passive: false });

  canvas.addEventListener("touchend", (e) => {
    if (gameState !== "playing") {
      return;
    }

    e.preventDefault();

    // Resetear joystick
    touchInput.active = false;
    touchInput.deltaX = 0;
    touchInput.deltaY = 0;
  }, { passive: false });
}

// === CONTROLES DE TECLADO ===
window.addEventListener("keydown", e => {
  // ESC: Pausar/despausar o cerrar ayuda
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

  // SPACE: Iniciar juego o pausar
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

  // M: Silenciar audio
  if (e.code === "KeyM") {
    toggleMute();
  }

  // H: Mostrar/ocultar controles
  if (e.code === "KeyH") {
    showControlsScreen = !showControlsScreen;
    console.log(showControlsScreen ? "📖 Controles mostrados" : "📖 Controles ocultados");
  }

  // Guardar estado de tecla para movimiento (WASD / flechas)
  keys[e.code] = true;
});

window.addEventListener("keyup", e => {
  keys[e.code] = false;
});

// === CONTROLES DE MOUSE ===
canvas.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  mousePos.x = e.clientX - rect.left;
  mousePos.y = e.clientY - rect.top;
});

canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  // Menú: iniciar juego
  if (gameState === "menu") {
    gameState = "playing";
    startTime = performance.now();
    playMusic();
    return;
  }

  // Pausa: continuar
  if (gameState === "paused") {
    gameState = "playing";
    return;
  }

  // En juego: disparar
  if (gameState === "playing") {
    shootBullet();
    return;
  }

  // Level up: detectar click en cartas de upgrade
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

    // Verificar si el click está sobre alguna carta
    currentUpgradeOptions.forEach((upgrade, i) => {
      const x = startX + i * (cardWidth + spacing);
      if (mx > x && mx < x + cardWidth && my > cardY && my < cardY + cardHeight) {
        upgrade.apply();
        gameState = "playing";
      }
    });
  } else if (gameState === "gameover" || gameState === "victory") {
    // Game over/Victoria: volver al menú
    gameState = "menu";
  }
});
