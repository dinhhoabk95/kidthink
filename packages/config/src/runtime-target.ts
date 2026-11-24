export type MindKidRuntimeTarget = "cloudflare" | "vps";
export type DbConnectionName = "sqlite" | "d1" | "pgsql";
export type QueueDriverKind = "cloudflare-do" | "bullmq";
export type AuthStoreDriverKind = "do" | "valkey";

export function getDbConnectionName(
  envConn = process.env.DB_CONNECTION,
  runtimeEnv = process.env.MINDKID_RUNTIME
): DbConnectionName {
  if (envConn === "sqlite" || envConn === "d1") {
    return envConn;
  }
  if (runtimeEnv === "cloudflare") {
    return "d1";
  }
  return "sqlite";
}

export function getRuntimeTarget(
  envValue = process.env.MINDKID_RUNTIME
): MindKidRuntimeTarget {
  if (envValue === "cloudflare") {
    return "cloudflare";
  }
  return "vps";
}

export function isCloudflareRuntime(
  envValue = process.env.MINDKID_RUNTIME
): boolean {
  return getRuntimeTarget(envValue) === "cloudflare";
}

export function getQueueDriverKind(
  runtimeEnv = process.env.MINDKID_RUNTIME,
  driverOverride = process.env.QUEUE_DRIVER
): QueueDriverKind {
  if (driverOverride === "cloudflare-do" || driverOverride === "bullmq") {
    return driverOverride;
  }
  return isCloudflareRuntime(runtimeEnv) ? "cloudflare-do" : "bullmq";
}

export function getAuthStoreDriverKind(
  runtimeEnv = process.env.MINDKID_RUNTIME,
  driverOverride = process.env.AUTH_STORE_DRIVER
): AuthStoreDriverKind {
  if (driverOverride === "do" || driverOverride === "valkey") {
    return driverOverride;
  }
  return isCloudflareRuntime(runtimeEnv) ? "do" : "valkey";
}
