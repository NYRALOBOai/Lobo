// ai-empire.js — simple prototype
// We use ES modules, so this file is loaded with type="module" in the HTML

// ====== CONFIGURATION ======
const TILE_SIZE = 8; // pixels
const MAP_COLS = 100; // width of map in tiles
const MAP_ROWS = 75;  // height of map in tiles

// Terrain definitions with display colors
const Terrain = {
  WATER: { name: 'water', color: '#2570d6', passable: false },
  GRASS: { name: 'grass', color: '#3ba34c', passable: true },
  DESERT: { name: 'desert', color: '#e1c669', passable: true },
  SNOW:  { name: 'snow',  color: '#ffffff', passable: true },
  FOREST:{ name: 'forest',color: '#2b5d34', passable: true },
  LAVA:  { name: 'lava',  color: '#d42d04', passable: false },
};
const TERRAIN_KEYS = Object.keys(Terrain);

// ====== MAP GENERATION ======
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMap() {
  // For now we do a VERY simple random generation.
  // Later we can replace with Perlin noise or island algorithm.
  const map = new Array(MAP_ROWS);
  for (let y = 0; y < MAP_ROWS; y++) {
    map[y] = new Array(MAP_COLS);
    for (let x = 0; x < MAP_COLS; x++) {
      // Basic probabilities
      const r = Math.random();
      let terrainKey;
      if (r < 0.2) terrainKey = 'WATER';
      else if (r < 0.4) terrainKey = 'DESERT';
      else if (r < 0.6) terrainKey = 'FOREST';
      else if (r < 0.8) terrainKey = 'GRASS';
      else if (r < 0.95) terrainKey = 'SNOW';
      else terrainKey = 'LAVA';
      map[y][x] = Terrain[terrainKey];
    }
  }
  return map;
}

// ====== AI AGENT ======
class AI {
  constructor(id, color, x, y) {
    this.id = id;
    this.color = color;
    this.x = x;
    this.y = y;
    this.memory = new Set(); // explored tile keys "x,y"
  }

  // Called each frame to decide next move
  update(map) {
    const dirs = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ];
    // Shuffle directions
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }

    for (const dir of dirs) {
      const nx = this.x + dir.dx;
      const ny = this.y + dir.dy;
      if (nx < 0 || ny < 0 || nx >= MAP_COLS || ny >= MAP_ROWS) continue;
      const tile = map[ny][nx];
      if (!tile.passable) continue; // can't move into impassable terrain
      // Move if tile not explored yet else maybe still move
      const key = `${nx},${ny}`;
      if (!this.memory.has(key) || Math.random() < 0.2) {
        this.x = nx;
        this.y = ny;
        this.memory.add(key);
        break;
      }
    }
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x * TILE_SIZE, this.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
}

// ====== GAME LOOP ======
let map = [];
let agents = [];
let ctx;
let running = false;

function init() {
  const canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');

  document.getElementById('startBtn').addEventListener('click', startGame);
}

function startGame() {
  const aiCount = Number(document.getElementById('aiCount').value) || 4;
  map = generateMap();
  agents = [];

  // Spawn agents on passable tiles randomly
  for (let i = 0; i < aiCount; i++) {
    let x, y;
    do {
      x = Math.floor(Math.random() * MAP_COLS);
      y = Math.floor(Math.random() * MAP_ROWS);
    } while (!map[y][x].passable);

    const color = `hsl(${(i * 360) / aiCount}, 70%, 50%)`;
    agents.push(new AI(i, color, x, y));
  }

  running = true;
  requestAnimationFrame(loop);
}

function loop() {
  if (!running) return;
  update();
  draw();
  requestAnimationFrame(loop);
}

function update() {
  for (const agent of agents) {
    agent.update(map);
  }
}

function draw() {
  // Draw map
  for (let y = 0; y < MAP_ROWS; y++) {
    for (let x = 0; x < MAP_COLS; x++) {
      ctx.fillStyle = map[y][x].color;
      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }

  // Draw agents on top
  for (const agent of agents) {
    agent.draw(ctx);
  }
}

// Initialize when DOM ready
window.addEventListener('DOMContentLoaded', init);