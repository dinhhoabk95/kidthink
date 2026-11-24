export type MindKidRuntimeTarget = "cloudflare" | "vps";
export type DbConnectionName = "sqlite" | "d1" | "pgsql";

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
