export class RNG {
  constructor(seed = 'seed') {
    this._seed = xmur3(seed)();
    this._a = sfc32(this._seed, this._seed ^ 0x9e3779b9, this._seed >>> 1, this._seed << 13);
  }
  next() { return (this._seed = (this._seed + 0x9e3779b9) >>> 0).toString(16); }
  float() { return this._a(); }
  int(min, max) { return Math.floor(this.float() * (max - min + 1)) + min; }
  chance(p) { return this.float() < p; }
}

export function randomSeed() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36).slice(-4);
}

const PALETTE = [
  '#22c55e','#3b82f6','#ef4444','#f59e0b','#a855f7','#14b8a6','#f97316','#84cc16',
  '#06b6d4','#eab308','#10b981','#8b5cf6','#f43f5e'
];
export function pickColor(i) { return PALETTE[i % PALETTE.length]; }

// Hash and PRNG helpers
function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}
function sfc32(a, b, c, d) {
  a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
  return function() {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}