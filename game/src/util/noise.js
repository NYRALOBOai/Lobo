import { RNG } from './random.js';

export class Noise {
  constructor(seed = 'noise') {
    this.rng = new RNG(seed);
    this.perm = new Uint8Array(512);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = this.rng.int(0, i);
      const tmp = p[i]; p[i] = p[j]; p[j] = tmp;
    }
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }

  grad2(hash, x, y) {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -2.0 * v : 2.0 * v);
  }

  noise2D(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const topRight = this.perm[this.perm[X + 1] + Y + 1];
    const topLeft = this.perm[this.perm[X] + Y + 1];
    const bottomRight = this.perm[this.perm[X + 1] + Y];
    const bottomLeft = this.perm[this.perm[X] + Y];

    const u = fade(xf);
    const v = fade(yf);

    const x1 = lerp(this.grad2(bottomLeft, xf, yf), this.grad2(bottomRight, xf - 1, yf), u);
    const x2 = lerp(this.grad2(topLeft, xf, yf - 1), this.grad2(topRight, xf - 1, yf - 1), u);
    const val = lerp(x1, x2, v);
    return val * 0.5; // normalize a bit
  }

  fbm(x, y, octaves = 4, gain = 0.5, lacunarity = 2.0) {
    let amp = 1.0;
    let freq = 1.0;
    let sum = 0.0;
    let maxAmp = 0.0;
    for (let o = 0; o < octaves; o++) {
      sum += this.noise2D(x * freq, y * freq) * amp;
      maxAmp += amp;
      amp *= gain;
      freq *= lacunarity;
    }
    return sum / (maxAmp || 1);
  }
}

function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a, b, t) { return a + (b - a) * t; }