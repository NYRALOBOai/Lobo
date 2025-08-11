import { Tile } from './world.js';

const COLORS = {
  [Tile.Ocean]: '#0b1220',
  [Tile.Beach]: '#d1bb7e',
  [Tile.Savanna]: '#8fbf53',
  [Tile.Forest]: '#26734d',
  [Tile.Snow]: '#cfd8e3',
  [Tile.Chaos]: '#5b1a1a',
};

export class Renderer {
  constructor(ctx, tileSize) {
    this.ctx = ctx;
    this.tileSize = tileSize;
  }

  render(world, agents, { fogOfWar }) {
    const { width, height, tiles } = world;
    const ctx = this.ctx;
    const s = this.tileSize;
    ctx.imageSmoothingEnabled = false;

    // Base layer
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        ctx.fillStyle = COLORS[tiles[i]];
        ctx.fillRect(x * s, y * s, s, s);
      }
    }

    // Fog of war: show explored by any agent
    if (fogOfWar) {
      const explored = new Uint8Array(width * height);
      for (const a of agents) {
        for (const idx of a.memory.explored) {
          explored[idx] = 1;
        }
      }
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = y * width + x;
          if (!explored[i]) ctx.fillRect(x * s, y * s, s, s);
        }
      }
    }

    // Agents
    for (const a of agents) {
      ctx.fillStyle = a.color;
      ctx.fillRect(a.x * s + 1, a.y * s + 1, Math.max(1, s - 2), Math.max(1, s - 2));
    }
  }
}