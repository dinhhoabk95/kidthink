import { GT019_FIXTURES } from "#src/templates/GT-019/fixtures.js";

/**
 * Ca âm của gate web-gesture-reachability: level GT-019 đòi lật ngang nhưng
 * `allow_flip: false` nên không đường nào (web hay không) thắng được.
 */
const flipLevel = GT019_FIXTURES.find((f) => f.difficulty.allow_flip);
if (!flipLevel) {
  throw new Error("Thiếu fixture GT-019 allow_flip");
}

export const UNWINNABLE_GT019 = {
  content: flipLevel.content,
  difficulty: { ...flipLevel.difficulty, allow_flip: false },
} as const;
