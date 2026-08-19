#!/usr/bin/env bash
# Deployment locking helper (BR-DEP-09: reject parallel deployment runs)

LOCK_FILE="/tmp/mindkid-deploy.lock"
LOCK_FD=200

acquire_lock() {
  eval "exec ${LOCK_FD}>\"${LOCK_FILE}\""
  if ! flock -n "${LOCK_FD}"; then
    echo "[ERROR] Another deployment is currently in progress (locked on ${LOCK_FILE}). Aborting." >&2
    return 1
  fi
}

release_lock() {
  flock -u "${LOCK_FD}" 2>/dev/null || true
  rm -f "${LOCK_FILE}" 2>/dev/null || true
}
