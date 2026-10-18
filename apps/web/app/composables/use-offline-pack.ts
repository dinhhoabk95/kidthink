import { isApiError } from "@mindkid/errors/client";
import { createIndexedDbBufferStorage } from "@mindkid/game-engine";
import { OFFLINE_PACK_CACHE_NAME } from "@mindkid/shared/client";

export const SESSION_ASSETS_CACHE_NAME = "session-assets-v1";
export const OFFLINE_PACK_DB_NAME = "mindkid_offline_play";
export const OFFLINE_PACK_STORE_NAME = "telemetry_events";
export const CLEAR_OFFLINE_PACKS_MESSAGE_TYPE = "CLEAR_OFFLINE_PACKS";

export type OfflinePackPurgeReason =
  | "logout"
  | "entitlement_revoked"
  | "manual";

export interface OfflinePackSwMessage {
  readonly type: typeof CLEAR_OFFLINE_PACKS_MESSAGE_TYPE;
  readonly reason: OfflinePackPurgeReason;
}

export interface ClearOfflinePackOptions {
  readonly reason?: OfflinePackPurgeReason;
  readonly cachesApi?: {
    delete(cacheName: string): Promise<boolean>;
  } | null;
  readonly indexedDbStorage?: {
    clear(): Promise<void>;
  } | null;
  readonly serviceWorkerContainer?: {
    readonly controller?: {
      postMessage(message: OfflinePackSwMessage): void;
    } | null;
  } | null;
}

export interface ClearOfflinePackResult {
  readonly cacheDeleted: boolean;
  readonly indexedDbCleared: boolean;
  readonly serviceWorkerNotified: boolean;
}

async function deleteOfflinePackCaches(
  cachesOption: ClearOfflinePackOptions["cachesApi"]
): Promise<boolean> {
  const defaultCaches =
    typeof globalThis.caches === "undefined" ? null : globalThis.caches;
  const cachesTarget =
    cachesOption === undefined ? defaultCaches : cachesOption;

  if (!cachesTarget || typeof cachesTarget.delete !== "function") {
    return false;
  }
  try {
    const [packDeleted] = await Promise.all([
      cachesTarget.delete(OFFLINE_PACK_CACHE_NAME),
      cachesTarget.delete(SESSION_ASSETS_CACHE_NAME),
    ]);
    return Boolean(packDeleted);
  } catch {
    return false;
  }
}

async function clearOfflinePackIndexedDb(
  storageOption: ClearOfflinePackOptions["indexedDbStorage"]
): Promise<boolean> {
  const storageTarget =
    storageOption === undefined
      ? createIndexedDbBufferStorage()
      : storageOption;

  if (!storageTarget || typeof storageTarget.clear !== "function") {
    return false;
  }
  try {
    await storageTarget.clear();
    return true;
  } catch {
    return false;
  }
}

function notifyServiceWorkerPurge(
  swOption: ClearOfflinePackOptions["serviceWorkerContainer"],
  reason: OfflinePackPurgeReason
): boolean {
  const defaultSw =
    typeof navigator !== "undefined" && "serviceWorker" in navigator
      ? navigator.serviceWorker
      : null;
  const swContainer = swOption === undefined ? defaultSw : swOption;

  if (
    !swContainer?.controller ||
    typeof swContainer.controller.postMessage !== "function"
  ) {
    return false;
  }
  try {
    swContainer.controller.postMessage({
      type: CLEAR_OFFLINE_PACKS_MESSAGE_TYPE,
      reason,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * BR-OCP-05: Xoá toàn bộ dữ liệu gói học ngoại tuyến trên thiết bị
 * khi người dùng đăng xuất hoặc bị thu hồi quyền lợi (entitlement revoked).
 */
export async function clearOfflinePackClientData(
  options: ClearOfflinePackOptions = {}
): Promise<ClearOfflinePackResult> {
  const reason: OfflinePackPurgeReason = options.reason ?? "logout";
  const cacheDeleted = await deleteOfflinePackCaches(options.cachesApi);
  const indexedDbCleared = await clearOfflinePackIndexedDb(
    options.indexedDbStorage
  );
  const serviceWorkerNotified = notifyServiceWorkerPurge(
    options.serviceWorkerContainer,
    reason
  );

  return {
    cacheDeleted,
    indexedDbCleared,
    serviceWorkerNotified,
  };
}

interface StatusErrorShape {
  readonly statusCode?: number;
  readonly status?: number;
  readonly data?: {
    readonly code?: string;
    readonly statusCode?: number;
  };
}

export function shouldPurgeOfflinePacksOnError(err: object | null): boolean {
  if (!err) {
    return false;
  }
  if (
    isApiError(err, "UNAUTHENTICATED") ||
    isApiError(err, "ENTITLEMENT_REQUIRED") ||
    isApiError(err, "TIER_LOCKED")
  ) {
    return true;
  }
  const shaped = err as StatusErrorShape;
  const code = shaped.data?.code;
  if (
    code === "UNAUTHENTICATED" ||
    code === "ENTITLEMENT_REQUIRED" ||
    code === "TIER_LOCKED"
  ) {
    return true;
  }
  const status = shaped.statusCode ?? shaped.status ?? shaped.data?.statusCode;
  return status === 401 || status === 403;
}

export function useOfflinePack() {
  async function purgeOfflinePacks(
    reason: OfflinePackPurgeReason = "logout"
  ): Promise<ClearOfflinePackResult> {
    return await clearOfflinePackClientData({ reason });
  }

  async function purgeIfRevokedOrUnauthenticated(
    err: object | null
  ): Promise<boolean> {
    if (!shouldPurgeOfflinePacksOnError(err)) {
      return false;
    }
    await clearOfflinePackClientData({ reason: "entitlement_revoked" });
    return true;
  }

  return {
    purgeOfflinePacks,
    purgeIfRevokedOrUnauthenticated,
  };
}
