import { defineNitroPlugin, useRuntimeConfig } from "#imports";

export default defineNitroPlugin(() => {
  const { adminJwtSecret } = useRuntimeConfig();
  if (new TextEncoder().encode(adminJwtSecret).byteLength < 32) {
    throw new Error(
      "Private admin JWT runtime secret must be at least 32 bytes"
    );
  }
});
