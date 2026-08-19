import type { Rng } from "./types.js";

/**
 * Fisher-Yates shuffle returning a brand new array without mutating input (BR-RNG-05).
 */
export function shuffle<T>(input: readonly T[], rng: Rng): T[] {
  const result = [...input];
  for (let i = result.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    const temp = result[i];
    const itemJ = result[j];
    if (temp !== undefined && itemJ !== undefined) {
      result[i] = itemJ;
      result[j] = temp;
    }
  }
  return result;
}
