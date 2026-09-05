import { getGradientCache } from "#src/render/cache.js";

export function leakCache(): void {
  getGradientCache();
}
