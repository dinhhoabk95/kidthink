/* biome-ignore-all lint/suspicious/noBitwiseOperators: Mulberry32 and FNV-1a bitwise PRNG implementation */

import type { Rng, RngStreamName } from "./types.js";

/** 32-bit FNV-1a hash function for stream name mixing */
function fnv1a32(str: string): number {
  let hash = 2_166_136_261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

/**
 * Creates a deterministic 32-bit Mulberry32 PRNG instance (BR-RNG-03).
 */
export function createRng(seed: number): Rng {
  let s = seed >>> 0 || 0;

  return {
    next(): number {
      s = (s + 0x6d_2b_79_f5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      // biome-ignore lint/style/useShorthandAssign: Mulberry32 PRNG core step
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
    },
    nextInt(maxExclusive: number): number {
      if (maxExclusive <= 1) {
        return 0;
      }
      return Math.floor(this.next() * maxExclusive);
    },
  };
}

/**
 * Derives an isolated sub-stream from a master seed and stream name (BR-RNG-04).
 */
export function deriveStream(seed: number, name: RngStreamName): Rng {
  const streamHash = fnv1a32(name);
  const derivedSeed = (seed ^ streamHash) >>> 0;
  return createRng(derivedSeed);
}
