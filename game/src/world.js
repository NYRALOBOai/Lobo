import { RNG } from './util/random.js';
import { Noise } from './util/noise.js';

export const Tile = {
  Ocean: 0,
  Beach: 1,
  Savanna: 2,
  Forest: 3,
  Snow: 4,
  Chaos: 5, // ilha central
};

export function createWorld({ width, height, seed }) {
  const rng = new RNG(seed);
  const noise = new Noise(rng.next());
  const moisture = new Noise(rng.next());

  const tiles = new Uint8Array(width * height);
  const food = new Uint8Array(width * height); // frutos/animais
  const wood = new Uint8Array(width * height); // árvores
  const ore = new Uint8Array(width * height); // minério
  const treasure = new Uint8Array(width * height); // baús

  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const chaosRadius = Math.floor(Math.min(width, height) * 0.12);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const nx = x / width - 0.5;
      const ny = y / height - 0.5;
      const d = Math.sqrt(nx * nx + ny * ny);
      const e = noise.fbm(x * 0.01, y * 0.01, 4, 0.5, 2.0) - d * 0.8;
      const m = moisture.fbm(x * 0.02, y * 0.02, 3, 0.5, 2.0);

      let tile = Tile.Ocean;
      if (e > 0.08) tile = Tile.Beach;
      if (e > 0.16) tile = m < 0 ? Tile.Savanna : Tile.Forest;
      if (e > 0.42) tile = Tile.Snow;

      // Ilha central do caos
      const dx = x - cx;
      const dy = y - cy;
      const dist2 = dx * dx + dy * dy;
      if (dist2 < chaosRadius * chaosRadius) {
        tile = Tile.Chaos;
      }

      tiles[i] = tile;

      // Recursos por bioma
      if (tile === Tile.Forest) {
        wood[i] = rng.chance(0.4) ? 1 + Math.floor(rng.float() * 4) : 0;
        food[i] = rng.chance(0.2) ? 1 : 0;
      } else if (tile === Tile.Savanna) {
        food[i] = rng.chance(0.3) ? 1 : 0;
        wood[i] = rng.chance(0.1) ? 1 : 0;
      } else if (tile === Tile.Snow) {
        food[i] = rng.chance(0.12) ? 1 : 0;
        wood[i] = rng.chance(0.08) ? 1 : 0;
        ore[i] = rng.chance(0.18) ? 1 : 0;
      } else if (tile === Tile.Chaos) {
        ore[i] = rng.chance(0.4) ? 1 + Math.floor(rng.float() * 3) : 0;
        treasure[i] = rng.chance(0.1) ? 1 : 0;
        food[i] = rng.chance(0.05) ? 1 : 0;
      } else if (tile === Tile.Beach) {
        food[i] = rng.chance(0.15) ? 1 : 0;
      }
    }
  }

  return {
    width,
    height,
    tiles,
    resources: { food, wood, ore, treasure },
  };
}

export function isWalkable(tile) {
  return tile !== Tile.Ocean;
}