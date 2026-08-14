import { getOAuthRegistry } from "@kidthink/auth";
import { defineEventHandler } from "h3";

export default defineEventHandler(() => {
  const registry = getOAuthRegistry();
  return {
    providers: registry.getPublicProviders(),
  };
});
