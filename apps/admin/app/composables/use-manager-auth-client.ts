import {
  createMindKidManagerAuthClient,
  type MindKidManagerAuthClient,
} from "@mindkid/auth/client";
import { apiUrl } from "~/composables/use-api-client";

const MANAGER_AUTH_PATH = "api/auth/managers";

let cachedManagerClient: MindKidManagerAuthClient | null = null;
let cachedManagerBaseUrl = "";

export function useManagerAuthClient(): MindKidManagerAuthClient {
  const baseURL = apiUrl(MANAGER_AUTH_PATH);
  if (typeof window !== "undefined") {
    if (cachedManagerClient && cachedManagerBaseUrl === baseURL) {
      return cachedManagerClient;
    }
    cachedManagerClient = createMindKidManagerAuthClient({ baseURL });
    cachedManagerBaseUrl = baseURL;
    return cachedManagerClient;
  }
  return createMindKidManagerAuthClient({ baseURL });
}
