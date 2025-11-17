# 🎮 Morfox - Pixel Dungeon Shooter

Juego de supervivencia tipo arcade shooter con generación procedural de mundo y sistema de progresión roguelike.

> **Objetivo**: Sobrevive 20 minutos en un mundo procedural lleno de enemigos cada vez más difíciles. Mejora tu personaje con upgrades y utiliza granadas explosivas para eliminar hordas de enemigos.

https://youtu.be/_QounWtszGY
https://youtu.be/O0KnWkyxShA
---

## 🕹️ Controles

### Teclado y Mouse

- **WASD / Flechas** - Mover jugador
- **ESPACIO / Click izquierdo** - Disparar granada (auto-apuntado al enemigo más cercano)
- **ESC** - Pausar/Reanudar juego
- **M** - Silenciar/Activar audio
- **C** - Cambiar modo de alto contraste (accesibilidad)
- **H** - Mostrar/Ocultar pantalla de ayuda

### Móvil/Táctil

- **Lado izquierdo de la pantalla** - Joystick virtual para movimiento
- **Lado derecho de la pantalla** - Tap para disparar

---

## ✨ Características

### Mecánicas de Juego

- 🌍 **Generación procedural de mundo** - Mapa de 100x100 tiles con terreno variado
- 👾 **12 tipos de enemigos diferentes** - Cada uno con mecánicas únicas y dificultad progresiva
- 💪 **14 upgrades únicos** - Mejora velocidad, daño, cadencia de fuego y más
- 📈 **Dificultad progresiva** - Los enemigos se vuelven más fuertes con el tiempo
- 🎯 **Sistema de auto-apuntado** - Las granadas buscan automáticamente al enemigo más cercano
- 🔄 **Sistema de recarga** - Gestiona tu munición estratégicamente

### Sistemas Técnicos

- 💥 **Efectos visuales avanzados** - Partículas, explosiones, screen shake
- 💾 **Persistencia de datos** - Guarda high scores y estadísticas en LocalStorage
- ♿ **Accesibilidad** - Modo de alto contraste y controles personalizables
- 📱 **Responsive** - Funciona en PC y dispositivos móviles
- ⚡ **Optimizaciones de rendimiento**:
  - Culling espacial (solo renderiza lo visible)
  - Cache de sprites tintados
  - Límites de entidades (máx. 100 enemigos, 100 partículas)
  - Delta time para movimiento independiente del framerate

---

## 📁 Estructura del Proyecto

```
Morfox/
├── index.html              # Punto de entrada HTML
├── main.js                 # Versión monolítica del juego (todo en un archivo)
│
├── engine/                 # Versión modular del motor
│   ├── core.js            # Configuración, variables globales, helpers
│   ├── entities.js        # Jugador, enemigos, balas, explosiones
│   ├── render.js          # Sistema de renderizado y efectos visuales
│   ├── input.js           # Manejo de entrada (teclado, mouse, táctil)
│   └── main.js            # Game loop y orquestación
│
├── assets/                 # Recursos gráficos
│   ├── terrain.png        # Tileset del suelo
│   ├── player.png         # Sprites del jugador
│   ├── bullet1.png        # Sprite de granada
│   ├── Run*.png           # Animaciones de enemigos
│   ├── Death*.png         # Animaciones de muerte
│   ├── Grass*.png         # Decoraciones de hierba
│   └── Rock*.png          # Decoraciones de rocas
│
├── sounds/                 # Archivos de audio
│   ├── music.mp3          # Música de fondo
│   ├── shoot.mp3          # Sonido de disparo
│   ├── explosion.mp3      # Sonido de explosión
│   ├── hit.mp3            # Sonido de daño al jugador
│   └── levelup.mp3        # Sonido de subida de nivel
│
└── game/                   # Recursos adicionales del juego
```

---

## 🎯 Sistema de Upgrades

Al subir de nivel, elige entre 3 upgrades aleatorios:

| Upgrade               | Efecto                                           |
| --------------------- | ------------------------------------------------ |
| **Velocidad +**       | Aumenta velocidad de movimiento                  |
| **Vida Máxima +**     | +20 HP máximo y cura completa                    |
| **Cadencia +**        | Dispara más rápido                               |
| **Daño Explosión +**  | Aumenta daño de explosión                        |
| **Radio Explosión +** | Mayor área de explosión                          |
| **Granada Extra**     | Dispara una granada adicional por disparo        |
| **Munición Máxima +** | +2 granadas en el cargador                       |
| **Recarga Rápida**    | Reduce tiempo de recarga                         |
| **Granadas Rápidas**  | Aumenta velocidad de proyectiles                 |
| **Crítico +**         | +10% probabilidad de golpe crítico               |
| **Dispersión +**      | Mayor ángulo de disparo (útil con Granada Extra) |
| **Robo de Vida**      | Recupera HP al eliminar enemigos                 |
| **Curación**          | Restaura 50 HP instantáneamente                  |
| **Explosión Doble**   | Aumenta radio y daño de explosión                |

---

## 👾 Tipos de Enemigos

Los enemigos aparecen progresivamente según el tiempo de juego:

| Enemigo          | Aparece en | Características                            |
| ---------------- | ---------- | ------------------------------------------ |
| 🟣 **Zombie**    | Inicio     | Enemigo básico, velocidad y vida moderadas |
| 🔴 **Runner**    | 30s        | Muy rápido pero débil                      |
| 🟢 **Brute**     | 1.5min     | Lento pero muy resistente                  |
| 🟠 **Imp**       | 1min       | Pequeño, aparece en enjambre               |
| 🟣 **Spitter**   | 2min       | Ataque a distancia                         |
| 🟠 **Berserker** | 2.5min     | Veloz y fuerte                             |
| 🔵 **Heavy**     | 3min       | Extremadamente resistente                  |
| ⚫ **Shadow**    | 4min       | El más rápido del juego                    |
| 🔷 **Elite**     | 5min       | Enemigo balanceado avanzado                |
| 🔴 **Boss**      | 6min       | Jefe con vida masiva                       |
| 🟠 **Champion**  | 7min       | Enemigo de élite poderoso                  |
| 🟣 **Nightmare** | 8min       | El enemigo más difícil                     |

_La dificultad aumenta un 15% cada minuto, haciendo que todos los enemigos sean más rápidos y resistentes._

---

## 🚀 Ejecutar el Juego

### Opción 1: Live Server (Recomendado para desarrollo)

1. Instalar extensión **Live Server** en VS Code
2. Click derecho en `index.html` → **Open with Live Server**
3. El juego se abrirá en `http://localhost:5500`

### Opción 2: Servidor HTTP local

**Python 3:**

```bash
python -m http.server 8000
```

**Python 2:**

```bash
python -m SimpleHTTPServer 8000
```

**Node.js (con http-server):**

```bash
npx http-server
```

Luego abrir `http://localhost:8000` en tu navegador.

### Opción 3: Abrir directamente

⚠️ **Nota**: Algunos navegadores no permiten cargar recursos locales por seguridad (CORS policy). Se recomienda usar un servidor local.

---

## 🛠️ Tecnologías Utilizadas

- **HTML5 Canvas API** - Renderizado 2D de alto rendimiento
- **JavaScript ES6+** - Lógica del juego (Vanilla JS, sin frameworks)
- **Web Audio API** - Sistema de audio con múltiples canales
- **LocalStorage API** - Persistencia de datos del jugador
- **RequestAnimationFrame** - Game loop optimizado a 60 FPS

---

## 📐 Arquitectura del Código

### Versión Modular (`engine/`)

El juego está dividido en módulos para mejor organización:

#### **core.js**

- Configuración del canvas y constantes globales
- Tipos de enemigos con sus estadísticas
- Sistema de upgrades
- Helpers utilitarios (detección de colisiones, dibujo, etc.)
- Generación y suavizado del mapa procedural
- Sistema de decoraciones (hierba y rocas)

#### **entities.js**

- `createPlayer()` - Inicializa el jugador con todas sus stats
- `updatePlayer()` - Maneja movimiento, colisiones y animaciones
- `shootBullet()` - Sistema de disparo con auto-apuntado
- `updateEnemies()` - IA de enemigos y sistema de spawn
- `updateDifficulty()` - Escalado de dificultad progresivo

#### **render.js**

- `drawMap()` - Renderiza el tilemap con culling
- `drawDecorations()` - Dibuja hierba y rocas con optimización
- `drawPlayer()`, `drawEnemies()`, `drawBullets()` - Renderizado de entidades
- `drawExplosions()`, `drawParticles()` - Efectos visuales
- `drawHUD()` - Interfaz de usuario (vida, munición, nivel, etc.)
- Pantallas de menú, pausa, level up, game over y victoria

#### **input.js**

- Manejo de teclado (WASD, flechas, teclas especiales)
- Manejo de mouse (apuntado y disparo)
- Controles táctiles para móviles (joystick virtual)
- Sistema de pause y menús interactivos

#### **main.js**

- `update(dt)` - Actualiza lógica del juego cada frame
- `draw()` - Renderiza todos los elementos visuales
- `gameLoop()` - Loop principal del juego a 60 FPS
- `init()` - Inicialización y carga de assets

---

## 🎨 Características Técnicas Avanzadas

### Sistema de Partículas

- Física realista con gravedad
- Pool de partículas limitado para rendimiento
- Diferentes colores según el efecto (explosión, daño, etc.)

### Cache de Sprites

- Los enemigos se tiñen con colores únicos
- Sprites pre-renderizados en cache para evitar re-dibujar
- Mejora significativa del rendimiento con múltiples enemigos

### Culling Espacial

- Solo renderiza entidades dentro del viewport de la cámara
- Enemigos muy lejanos tienen física reducida
- Ahorro de recursos en mapas grandes

### Sistema de Cámara

- Sigue suavemente al jugador (smooth follow)
- Límites del mundo para evitar mostrar áreas vacías
- Screen shake integrado para feedback visual

---

## 🐛 Troubleshooting

### El juego no carga / Pantalla negra

- Asegúrate de estar ejecutando desde un servidor local (no `file://`)
- Abre la consola del navegador (F12) para ver errores
- Verifica que todos los archivos en `assets/` y `sounds/` existen

### Audio no funciona

- Algunos navegadores bloquean audio automático
- Haz click en la pantalla para permitir reproducción de audio
- Verifica que los archivos MP3 existan en la carpeta `sounds/`

## 📊 Sistema de Estadísticas

El juego guarda automáticamente en LocalStorage:

### High Scores

- Tiempo más largo de supervivencia
- Mayor número de kills en una partida
- Nivel más alto alcanzado

### Estadísticas Totales

- Total de partidas jugadas
- Total de kills acumulados
- Total de muertes
- Tiempo total de juego
