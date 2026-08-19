#!/usr/bin/env bash
# Timestamped logging to stdout and to the deploy log file.
# BR-DEP-10: this file prints variable NAMES only; no caller may pass a secret value.

mk_log_line() {
  local level="$1"
  shift
  local line
  line="$(date -u '+%Y-%m-%dT%H:%M:%SZ') [${level}] $*"

  if [ -n "${MK_DEPLOY_LOG:-}" ] && [ -w "$(dirname "${MK_DEPLOY_LOG}")" ]; then
    printf '%s\n' "${line}" >>"${MK_DEPLOY_LOG}" 2>/dev/null || true
  fi
  printf '%s\n' "${line}"
}

log_info() { mk_log_line INFO "$@"; }
log_step() { mk_log_line STEP "$@"; }
log_warn() { mk_log_line WARN "$@" >&2; }
log_error() { mk_log_line ERROR "$@" >&2; }

# Creates the log directory when the caller has the rights to. Never fatal:
# losing the log file must not be the reason a release cannot start.
log_init() {
  if [ -n "${MK_LOG_DIR:-}" ] && [ ! -d "${MK_LOG_DIR}" ]; then
    mkdir -p "${MK_LOG_DIR}" 2>/dev/null || true
  fi
}
