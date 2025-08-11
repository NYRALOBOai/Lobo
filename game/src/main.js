import { createWorld } from './world.js';
import { Renderer } from './renderer.js';
import { Simulation } from './simulation.js';
import { makeLogger } from './util/logger.js';
import { randomSeed } from './util/random.js';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const numAIsInput = document.getElementById('numAIs');
const mapSizeSelect = document.getElementById('mapSize');
const seedInput = document.getElementById('seed');
const btnStart = document.getElementById('btnStart');
const btnReset = document.getElementById('btnReset');
const btnPause = document.getElementById('btnPause');
const speedRange = document.getElementById('speed');
const speedVal = document.getElementById('speedVal');
const hud = document.getElementById('hud');
const legend = document.getElementById('legend');

const log = makeLogger('game');

let sim = null;
let renderer = null;
let lastTs = 0;
let simSpeed = 1;
let paused = false;

function layoutToFit(world) {
  const tileSize = Math.max(2, Math.floor(Math.min(1024 / world.width, 720 / world.height)));
  canvas.width = world.width * tileSize;
  canvas.height = world.height * tileSize;
  return tileSize;
}

function updateHUD() {
  if (!sim) return;
  hud.textContent = `t=${sim.tick}  AIs=${sim.agents.length}  Pop=${sim.population}  Recursos: food=${sim.stats.food} wood=${sim.stats.wood} ore=${sim.stats.ore}`;
}

function drawLegend() {
  legend.innerHTML = `
    <div><span class="badge biome">Ocean</span> <span class="badge biome">Praia</span> <span class="badge biome">Savanna</span> <span class="badge biome">Floresta</span> <span class="badge biome">Nevado</span> <span class="badge danger">Ilha do Caos</span></div>
    <div style="margin-top:6px"><span class="badge resource">Comida</span> <span class="badge resource">Madeira</span> <span class="badge resource">Minério</span> <span class="badge resource">Tesouro</span></div>
  `;
}

function startGame() {
  const numAIs = parseInt(numAIsInput.value || '4', 10);
  const size = parseInt(mapSizeSelect.value || '192', 10);
  const seed = seedInput.value.trim() || randomSeed();
  seedInput.value = seed;

  log.clear();
  log.info('start', `Seed=${seed} size=${size} AIs=${numAIs}`);

  const world = createWorld({ width: size, height: size, seed });
  const tileSize = layoutToFit(world);
  renderer = new Renderer(ctx, tileSize);
  sim = new Simulation(world, { numAgents: numAIs, logger: log });
  drawLegend();
  updateHUD();
}

function resetGame() {
  startGame();
}

function loop(ts) {
  const dt = Math.min(64, ts - lastTs || 16);
  lastTs = ts;
  if (sim && !paused) {
    const steps = Math.max(1, Math.floor(simSpeed));
    for (let i = 0; i < steps; i++) {
      sim.step();
    }
    const alpha = simSpeed - Math.floor(simSpeed);
    renderer.render(sim.world, sim.agents, { fogOfWar: true });
    updateHUD();
  }
  requestAnimationFrame(loop);
}

btnStart.addEventListener('click', startGame);
btnReset.addEventListener('click', resetGame);
btnPause.addEventListener('click', () => {
  paused = !paused;
  btnPause.textContent = paused ? 'Continuar' : 'Pausar';
});
speedRange.addEventListener('input', () => {
  simSpeed = parseFloat(speedRange.value);
  speedVal.textContent = `${simSpeed.toFixed(2)}x`;
});

// bootstrap
startGame();
requestAnimationFrame(loop);