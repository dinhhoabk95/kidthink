import { passkeyClient } from "@better-auth/passkey/client";
import { twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/vue";

export interface MindKidAuthClientOptions {
  readonly baseURL: string;
  readonly onTwoFactorRedirect?: () => void;
}

export function createMindKidUserAuthClient(options: MindKidAuthClientOptions) {
  return createAuthClient({
    baseURL: options.baseURL,
    fetchOptions: {
      credentials: "include",
    },
    plugins: [
      twoFactorClient({
        onTwoFactorRedirect: options.onTwoFactorRedirect,
      }),
      passkeyClient(),
    ],
  });
}

export function createMindKidManagerAuthClient(
  options: MindKidAuthClientOptions
) {
  return createAuthClient({
    baseURL: options.baseURL,
    fetchOptions: {
      credentials: "include",
    },
    plugins: [
      twoFactorClient({
        onTwoFactorRedirect: options.onTwoFactorRedirect,
      }),
      passkeyClient(),
    ],
  });
}

export type MindKidUserAuthClient = ReturnType<
  typeof createMindKidUserAuthClient
>;
export type MindKidManagerAuthClient = ReturnType<
  typeof createMindKidManagerAuthClient
>;
