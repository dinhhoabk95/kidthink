"use strict";

/**
 * Process supervisor configuration.
 * Spec: docs/specs/01-platform/process-supervision.md
 *
 * This file lives in the repository, not on the server (BR-SUP-10): anything
 * edited by hand on the machine is lost the next time the host is rebuilt.
 */

const ROOT = "/opt/mindkid/current";
const LOG_ROOT = "/var/log/mindkid";
const ENV_ROOT = "/etc/mindkid/env";

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
    env_file: `${ENV_ROOT}/${name}.env`,
    env: { PORT: String(port) },
    out_file: `${LOG_ROOT}/${name}/out.log`,
    error_file: `${LOG_ROOT}/${name}/error.log`,
    ...extra,
  };
}

module.exports = {
  apps: [
    // server-provisioning.md §7.3 assigns the loopback ports.
    app("web", "./apps/web/.output/server/index.mjs", 3000, {
      instances: "max",
      exec_mode: "cluster",
    }),
    app("admin", "./apps/admin/.output/server/index.mjs", 3002, {
      instances: 1,
      exec_mode: "fork",
    }),
    // BR-SUP-03: concurrency is the queue's job, so exactly one consumer.
    app("worker", "./apps/worker/dist/index.js", 3099, {
      instances: 1,
      exec_mode: "fork",
    }),
  ],
};
