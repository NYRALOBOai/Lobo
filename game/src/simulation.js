import { RNG, pickColor } from './util/random.js';
import { isWalkable, Tile } from './world.js';

const ACTIONS = ['moveN','moveS','moveW','moveE','harvest','eat','idle'];

class Agent {
  constructor(id, x, y, color, seed) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.color = color;
    this.rng = new RNG(seed + ':' + id);

    this.hunger = 100; // 0-100
    this.health = 100;
    this.inventory = { food: 0, wood: 0, ore: 0, treasure: 0 };

    this.memory = {
      explored: new Set(), // indices
      q: new Map(), // stateKey -> qValues array per action
    };
  }

  stateKey(world) {
    // Local state: 5x5 around agent + hunger bucket
    const { width, tiles } = world;
    const parts = [];
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = this.x + dx;
        const ny = this.y + dy;
        if (nx < 0 || ny < 0 || nx >= world.width || ny >= world.height) {
          parts.push('X');
        } else {
          parts.push(tiles[ny * width + nx]);
        }
      }
    }
    const hungerBucket = Math.floor(this.hunger / 20);
    return parts.join(',') + '|' + hungerBucket;
  }

  pickAction(world, epsilon = 0.1) {
    const state = this.stateKey(world);
    if (!this.memory.q.has(state)) this.memory.q.set(state, new Float32Array(ACTIONS.length));
    const q = this.memory.q.get(state);

    if (this.rng.float() < epsilon) {
      return this.rng.int(0, ACTIONS.length - 1);
    }
    // argmax
    let best = 0;
    for (let i = 1; i < q.length; i++) {
      if (q[i] > q[best]) best = i;
    }
    return best;
  }

  learn(world, actionIdx, reward, nextState, alpha = 0.2, gamma = 0.9) {
    const state = this.stateKey(world);
    const q = this.memory.q.get(state) || new Float32Array(ACTIONS.length);
    const nextQ = this.memory.q.get(nextState) || new Float32Array(ACTIONS.length);
    let maxNext = nextQ[0];
    for (let i = 1; i < nextQ.length; i++) if (nextQ[i] > maxNext) maxNext = nextQ[i];
    q[actionIdx] = (1 - alpha) * q[actionIdx] + alpha * (reward + gamma * maxNext);
    this.memory.q.set(state, q);
  }
}

export class Simulation {
  constructor(world, { numAgents, logger }) {
    this.world = world;
    this.rng = new RNG('sim');
    this.agents = [];
    this.tick = 0;
    this.logger = logger;

    this.population = numAgents;
    this.stats = { food: 0, wood: 0, ore: 0 };

    // Spawn agents on walkable tiles
    let spawned = 0;
    while (spawned < numAgents) {
      const x = this.rng.int(0, world.width - 1);
      const y = this.rng.int(0, world.height - 1);
      const tile = world.tiles[y * world.width + x];
      if (!isWalkable(tile)) continue;
      const a = new Agent(spawned, x, y, pickColor(spawned), 'agents');
      this.agents.push(a);
      this.logger.info('spawn', `IA ${a.id} em (${x},${y}) cor=${a.color}`);
      spawned++;
    }
  }

  step() {
    this.tick++;
    const { world } = this;

    for (const a of this.agents) {
      // Explore memory
      a.memory.explored.add(a.y * world.width + a.x);

      // Needs decay
      a.hunger -= 0.15;
      if (a.hunger <= 0) {
        a.health -= 0.5;
      }
      if (a.health <= 0) {
        this.logger.warn?.('death', `IA ${a.id} morreu de fome em t=${this.tick}`);
        // respawn simplistic
        a.hunger = 100; a.health = 100; a.inventory = { food: 0, wood: 0, ore: 0, treasure: 0 };
        let tries = 0;
        while (tries++ < 1000) {
          const x = this.rng.int(0, world.width - 1);
          const y = this.rng.int(0, world.height - 1);
          if (isWalkable(world.tiles[y * world.width + x])) { a.x = x; a.y = y; break; }
        }
        continue;
      }

      // RL decide action
      const state = a.stateKey(world);
      const actionIdx = a.pickAction(world, 0.10);

      // Execute
      let reward = -0.01; // time penalty
      const before = { x: a.x, y: a.y, hunger: a.hunger };

      const doMove = (dx, dy) => {
        const nx = a.x + dx;
        const ny = a.y + dy;
        if (nx < 0 || ny < 0 || nx >= world.width || ny >= world.height) return -0.05;
        const tile = world.tiles[ny * world.width + nx];
        if (!isWalkable(tile)) return -0.05;
        a.x = nx; a.y = ny; a.memory.explored.add(ny * world.width + nx);
        // danger in chaos
        if (tile === Tile.Chaos) {
          a.health -= 0.5;
          return -0.2;
        }
        return 0.02;
      };

      switch (ACTIONS[actionIdx]) {
        case 'moveN': reward += doMove(0, -1); break;
        case 'moveS': reward += doMove(0, 1); break;
        case 'moveW': reward += doMove(-1, 0); break;
        case 'moveE': reward += doMove(1, 0); break;
        case 'harvest': {
          const i = a.y * world.width + a.x;
          const r = world.resources;
          let gained = 0;
          if (r.food[i] > 0) { r.food[i]--; a.inventory.food++; this.stats.food++; gained += 0.4; }
          if (r.wood[i] > 0 && gained < 0.5) { r.wood[i]--; a.inventory.wood++; this.stats.wood++; gained += 0.2; }
          if (r.ore[i] > 0 && gained < 0.5) { r.ore[i]--; a.inventory.ore++; this.stats.ore++; gained += 0.3; }
          if (r.treasure[i] > 0) { r.treasure[i]--; a.inventory.treasure++; gained += 0.8; this.logger.info('treasure', `IA ${a.id} encontrou tesouro`); }
          reward += gained > 0 ? gained : -0.02;
          break;
        }
        case 'eat': {
          if (a.inventory.food > 0 && a.hunger < 90) { a.inventory.food--; a.hunger = Math.min(100, a.hunger + 30); reward += 0.5; }
          else reward -= 0.02;
          break;
        }
        default: {
          // idle
          reward -= 0.005;
        }
      }

      // learning step
      const nextState = a.stateKey(world);
      a.learn(world, actionIdx, reward, nextState);

      // occasional log
      if (this.tick % 200 === 0 && a.id === 0) {
        this.logger.info('tick', `t=${this.tick} inv=${JSON.stringify(a.inventory)} hunger=${a.hunger.toFixed(1)}`);
      }
    }
  }
}