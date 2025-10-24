export class SeededRNG {
  private state: number;

  constructor(seed: string) {
    // Simple string hash to number
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    this.state = Math.abs(hash) || 1;
  }

  // Mulberry32 PRNG
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  nextBool(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  // Perlin-like noise using accumulated random walk
  perlin(t: number, scale: number = 0.1): number {
    const n = Math.floor(t / scale);
    const f = (t % scale) / scale;

    // Save state, generate values, restore
    const savedState = this.state;
    this.state = (this.state ^ n) >>> 0;
    const v0 = this.nextFloat(-1, 1);
    const v1 = this.nextFloat(-1, 1);
    this.state = savedState;

    // Smooth interpolation
    const u = f * f * (3 - 2 * f);
    return v0 * (1 - u) + v1 * u;
  }
}
