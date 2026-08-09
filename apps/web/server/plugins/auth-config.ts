import { defineNitroPlugin, useRuntimeConfig } from "#imports";

export default defineNitroPlugin(() => {
  const { webJwtSecret } = useRuntimeConfig();
  if (new TextEncoder().encode(webJwtSecret).byteLength < 32) {
    throw new Error("Private web JWT runtime secret must be at least 32 bytes");
  }
});
