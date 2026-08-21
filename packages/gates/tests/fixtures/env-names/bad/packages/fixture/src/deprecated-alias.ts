// Fixture: deliberately wrong. The gate must reject this file.
/* biome-ignore-all lint/complexity/useLiteralKeys: negative fixture */

export const sessionSecret = process.env.SESSION_SECRET;
export const cacheUrl = process.env.REDIS_URL;
export const bracket = process.env["JWT_SECRET"];
