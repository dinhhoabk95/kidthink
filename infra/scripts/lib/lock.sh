#!/usr/bin/env bash
# Mutual exclusion for release and rollback (BR-DEP-09, BR-RBK-05).
#
# The lock is a DIRECTORY inside the deploy root, not a file in /tmp:
#   - mkdir is atomic on every POSIX filesystem, so no flock binary is needed
#     (macOS, where the test harness runs, ships none);
#   - the deploy root is owned by root, so an unprivileged local user cannot
#     pre-create the path and cannot aim it at another file via a symlink.

mk_lock_held=false

acquire_lock() {
  mkdir -p "$(dirname "${MK_LOCK_DIR}")"

  if mkdir "${MK_LOCK_DIR}" 2>/dev/null; then
    printf '%s\n' "$$" >"${MK_LOCK_DIR}/pid"
    mk_lock_held=true
    return 0
  fi

  local holder=""
  [ -f "${MK_LOCK_DIR}/pid" ] && holder="$(cat "${MK_LOCK_DIR}/pid" 2>/dev/null || true)"

  # A lock left behind by a killed process must not block the machine forever,
  # but only the owner of a dead PID may clear it.
  if [ -n "${holder}" ] && ! kill -0 "${holder}" 2>/dev/null; then
    log_warn "Clearing stale deploy lock left by dead process ${holder}."
    rm -rf "${MK_LOCK_DIR}"
    if mkdir "${MK_LOCK_DIR}" 2>/dev/null; then
      printf '%s\n' "$$" >"${MK_LOCK_DIR}/pid"
      mk_lock_held=true
      return 0
    fi
  fi

  log_error "Another deploy or rollback is in progress (lock held by PID ${holder:-unknown}). Not queueing."
  return 1
}

# Only the process that took the lock may drop it, otherwise a losing caller
# would unlock the winner on its way out.
release_lock() {
  if [ "${mk_lock_held}" = true ]; then
    rm -rf "${MK_LOCK_DIR}" 2>/dev/null || true
    mk_lock_held=false
  fi
}
