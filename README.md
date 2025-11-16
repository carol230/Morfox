# Survive 20 Minutes - Pixel Dungeon Shooter

Juego de supervivencia tipo arcade shooter con generación procedural de mundo y sistema de progresión roguelike.

## Descripción

Sobrevive 20 minutos en un mundo procedural lleno de enemigos cada vez más difíciles. Mejora tu personaje con upgrades y utiliza granadas explosivas para eliminar hordas de enemigos.

## Controles

- **WASD / Flechas**: Mover jugador
- **ESPACIO**: Disparar granada (auto-apuntado)
- **ESC**: Pausar/Reanudar juego
- **M**: Silenciar/Activar audio
- **C**: Cambiar modo de alto contraste
- **H**: Mostrar/Ocultar pantalla de ayuda

## Características

- **Generación procedural de mundo** 100x100 tiles
- **12 tipos de enemigos** diferentes con mecánicas únicas
- **14 upgrades** para mejorar tu personaje
- **Sistema de dificultad progresiva** que aumenta con el tiempo
- **Efectos visuales**: Partículas, explosiones, screen shake
- **Sistema de persistencia**: Guarda high scores y estadísticas
- **Modo de alto contraste** para accesibilidad
- **Optimizaciones de rendimiento**: Culling, cache de sprites

## Estructura del Proyecto

```
game-main/
├── index.html              # Punto de entrada HTML
├── main.js                 # Orquestador principal del juego
├── engine/                 # Módulos del motor del juego
│   ├── entity.js          # Sistema de entidades (Player, Enemy, Bullet, Explosion)
│   ├── loader.js          # Carga de assets (imágenes, audio)
│   ├── stateManager.js    # Gestión de estados y UI
│   ├── worldGenerator.js  # Generación procedural de mundo
│   ├── effects.js         # Sistema de efectos visuales
│   └── utils.js           # Funciones utilitarias
├── assets/                 # Assets del juego
│   ├── *.png              # Sprites y tilesets
│   └── 2D Pixel Dungeon Asset Pack v2.0/
├── sounds/                 # Archivos de audio
└── net/                    # Módulos de red (no implementado)
```

## Arquitectura del Código

### Módulos principales

#### `main.js`
Punto de entrada y orquestador del juego. Coordina todos los sistemas sin contener implementaciones específicas.

#### `engine/entity.js`
Maneja todas las entidades del juego:
- **Player**: Clase del jugador con stats, movimiento y combate
- **BulletSystem**: Sistema de proyectiles con explosiones
- **ExplosionSystem**: Manejo de explosiones con área de daño
- **EnemySystem**: Spawn y AI de enemigos con 12 tipos diferentes

#### `engine/loader.js`
Gestión de carga de recursos:
- **AssetLoader**: Carga de imágenes y audio
- Pantallas de carga y error
- Sistema de audio con múltiples canales

#### `engine/stateManager.js`
Gestión de estados del juego:
- **StateManager**: Estados (menu, playing, paused, levelup, gameover, victory)
- **UIManager**: Renderizado de HUD, menús y pantallas
- **InputManager**: Manejo de eventos de teclado y ratón

#### `engine/worldGenerator.js`
Generación y renderizado del mundo:
- **WorldGenerator**: Generación procedural de terreno y decoraciones
- **Camera**: Sistema de cámara que sigue al jugador
- Renderizado optimizado con culling

#### `engine/effects.js`
Efectos visuales:
- **ParticleSystem**: Sistema de partículas con física
- **ScreenShake**: Efecto de sacudida de pantalla
- **SpriteCache**: Cache de sprites tintados para rendimiento

#### `engine/utils.js`
Funciones utilitarias:
- Detección de colisiones
- Helpers matemáticos
- Funciones de renderizado (roundRect, wrapText)
- Formateo de datos

## Sistema de Upgrades

El juego incluye 14 upgrades diferentes:
- Velocidad +
- Vida Máxima +
- Cadencia +
- Daño Explosión +
- Radio Explosión +
- Granada Extra
- Munición Máxima +
- Recarga Rápida
- Granadas Rápidas
- Crítico +
- Dispersión +
- Robo de Vida
- Curación
- Explosión Doble

## Tipos de Enemigos

1. **Zombie** - Enemigo básico
2. **Runner** - Rápido pero débil
3. **Brute** - Lento pero resistente
4. **Imp** - Pequeño y en enjambre
5. **Spitter** - Ataque a distancia
6. **Berserker** - Veloz y fuerte
7. **Heavy** - Muy resistente
8. **Shadow** - Extremadamente rápido
9. **Elite** - Enemigo balanceado avanzado
10. **Boss** - Jefe con mucha vida
11. **Champion** - Enemigo de élite
12. **Nightmare** - El enemigo más difícil

## Ejecutar el Juego

### Opción 1: Live Server (Recomendado)
1. Instalar extensión "Live Server" en VS Code
2. Click derecho en `index.html` → "Open with Live Server"

### Opción 2: Servidor HTTP local
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (con http-server)
npx http-server
```

Luego abrir `http://localhost:8000` en el navegador.

## Tecnologías Utilizadas

- **HTML5 Canvas**: Renderizado 2D
- **JavaScript ES6 Modules**: Arquitectura modular
- **Web Audio API**: Sistema de audio
- **LocalStorage API**: Persistencia de datos
- **RequestAnimationFrame**: Game loop optimizado

## Optimizaciones

- **Culling espacial**: Solo renderiza elementos visibles
- **Cache de sprites**: Sprites tintados pre-renderizados
- **Object pooling**: Reutilización de partículas y explosiones
- **Límites de entidades**: Máximo 100 enemigos y 100 partículas
- **Delta time**: Movimiento independiente del framerate

## Documentación del Código

Todo el código está completamente documentado con **JSDoc**:
- Tipos de parámetros y retornos
- Descripciones de funciones y métodos
- Ejemplos de uso donde es relevante
- Documentación de clases y propiedades

## Créditos

- **Assets**: 2D Pixel Dungeon Asset Pack v2.0
- **Desarrollo**: Proyecto académico

## Licencia

Proyecto educativo - Ver licencias de assets individuales en sus respectivas carpetas.
