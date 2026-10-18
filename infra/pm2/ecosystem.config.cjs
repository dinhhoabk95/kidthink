"use strict";

/**
 * Process supervisor configuration.
 * Spec: docs/specs/01-platform/process-supervision.md
 *
 * This file lives in the repository, not on the server (BR-SUP-10): anything
 * edited by hand on the machine is lost the next time the host is rebuilt.
 */

const os = require("node:os");

const ROOT = "/opt/mindkid/current";
const LOG_ROOT = "/var/log/mindkid";
const ENV_ROOT = "/etc/mindkid/env";

/**
 * BR-SUP-08: web instance count and DB connection pool are calculated together
 * so `(web_instances + worker_instances) * DB_POOL_MAX <= DB_MAX_CONNECTIONS`.
 *
 * Each Node process opens at most two 1-connection pools in `packages/db/src/client.ts`
 * (`getOwnerSql` + `getAppSql`), so `DB_POOL_MAX = 2` per process. Capping the
 * cluster's DB budget at `DB_MAX_CONNECTIONS = 20` keeps the application well
 * within PostgreSQL's connection ceiling while leaving headroom for migrations,
 * backups, and operator connections. Never use `instances: "max"` unbounded:
 * on a 16-core host that spawns 16 web workers (34 connections > 20 budget).
 */
const MIN_WEB_INSTANCES = 2;
const WORKER_INSTANCES = 1;
const DB_POOL_MAX = 2;
const DB_MAX_CONNECTIONS = 20;

function resolveWebInstances(options = {}) {
  const cpuCount = options.cpuCount ?? os.cpus().length;
  const dbPoolMax = options.dbPoolMax ?? DB_POOL_MAX;
  const maxConnections = options.maxConnections ?? DB_MAX_CONNECTIONS;
  const maxWebByPool =
    Math.floor(maxConnections / dbPoolMax) - WORKER_INSTANCES;

  if (maxWebByPool < MIN_WEB_INSTANCES) {
    throw new RangeError(
      `BR-SUP-08: DB connection budget (${maxConnections}) with pool (${dbPoolMax}) cannot fit minimum web instances (${MIN_WEB_INSTANCES}) + worker (${WORKER_INSTANCES}).`
    );
  }

  return Math.min(Math.max(MIN_WEB_INSTANCES, cpuCount), maxWebByPool);
}

function validateClusterPoolBudget(config, options = {}) {
  const cpuCount = options.cpuCount ?? os.cpus().length;
  const dbPoolMax = options.dbPoolMax ?? DB_POOL_MAX;
  const maxConnections = options.maxConnections ?? DB_MAX_CONNECTIONS;

  const apps = Array.isArray(config?.apps) ? config.apps : [];
  const webApp = apps.find((item) => item.name === "mindkid-web");
  const workerApp = apps.find((item) => item.name === "mindkid-worker");

  const rawWebInstances = webApp?.instances;
  const effectiveWebInstances =
    rawWebInstances === "max" || rawWebInstances === 0
      ? cpuCount
      : Number(rawWebInstances ?? 0);
  const effectiveWorkerInstances = Number(
    workerApp?.instances ?? WORKER_INSTANCES
  );
  const totalConnections =
    (effectiveWebInstances + effectiveWorkerInstances) * dbPoolMax;

  if (
    typeof rawWebInstances !== "number" ||
    !Number.isInteger(rawWebInstances) ||
    rawWebInstances < MIN_WEB_INSTANCES
  ) {
    return {
      valid: false,
      totalConnections,
      maxConnections,
      reason: `BR-SUP-08: web instances must be a bounded integer >= ${MIN_WEB_INSTANCES} (got ${String(rawWebInstances)}, needing ${totalConnections}/${maxConnections} connections on ${cpuCount} cores).`,
    };
  }

  if (totalConnections > maxConnections) {
    return {
      valid: false,
      totalConnections,
      maxConnections,
      reason: `BR-SUP-08: (${effectiveWebInstances} + ${effectiveWorkerInstances}) * ${dbPoolMax} = ${totalConnections} exceeds max_connections (${maxConnections}).`,
    };
  }

  return {
    valid: true,
    totalConnections,
    maxConnections,
  };
}

// process-supervision.md §7.2
const SHARED = {
  // Applications drop to the unprivileged system user (BR-SRV-02); a fault in a
  // web process must not be root on the host. The supervisor itself stays root
  // so it can read the 0600 root-owned env files and hand the values down —
  // which is how BR-ENV-05 and BR-SRV-02 hold at the same time.
  uid: "mindkid",
  gid: "mindkid",
  // Without cwd, relative script paths resolve against THIS file's directory.
  cwd: ROOT,
  max_memory_restart: "700M",
  max_restarts: 5,
  min_uptime: "30s",
  // Increasing backoff capped at 30s, not a fixed delay: a process that dies
  // instantly must not be restarted in a tight loop (BR-SUP-05).
  exp_backoff_restart_delay: 1000,
  restart_delay: 0,
  kill_timeout: 10_000,
  // No wait_ready: Nitro does not emit a ready signal, so waiting for one
  // would stall every reload until the timeout.
  listen_timeout: 20_000,
  merge_logs: true,
  time: true,
};

function app(name, script, port, extra) {
  return {
    ...SHARED,
    name: `mindkid-${name}`,
    script,
    // BR-SUP-04: one env file per process, never a shared one.
    // BR-SUP-07: secrets stay in the 0600 root-owned env_file and are never
    // placed in inline `env` or written to out_file / error_file logs.
    env_file: `${ENV_ROOT}/${name}.env`,
    env: { PORT: String(port) },
    out_file: `${LOG_ROOT}/${name}/out.log`,
    error_file: `${LOG_ROOT}/${name}/error.log`,
    ...extra,
  };
}

module.exports = {
  MIN_WEB_INSTANCES,
  WORKER_INSTANCES,
  DB_POOL_MAX,
  DB_MAX_CONNECTIONS,
  resolveWebInstances,
  validateClusterPoolBudget,
  apps: [
    // server-provisioning.md §7.3 assigns the loopback ports.
    // BR-SUP-08: bounded by vCPU count and DB connection pool budget.
    app("web", "./apps/web/.output/server/index.mjs", 3000, {
      instances: resolveWebInstances(),
      exec_mode: "cluster",
    }),
    // BR-SUP-03: concurrency is the queue's job, so exactly one consumer.
    app("worker", "./apps/worker/dist/index.js", 3099, {
      instances: WORKER_INSTANCES,
      exec_mode: "fork",
    }),
  ],
};
