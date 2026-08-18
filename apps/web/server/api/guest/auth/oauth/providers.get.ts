import { getOAuthRegistry } from "@mindkid/auth";
import { defineEventHandler } from "h3";

export default defineEventHandler(() => {
  const registry = getOAuthRegistry();
  return {
    providers: registry.getPublicProviders(),
  };
});
