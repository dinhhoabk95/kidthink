#!/usr/bin/env bash
# MindKid Rollback Script
# Spec: docs/specs/01-platform/release-rollback.md
# Rules: BR-RBK-01..05

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="${SCRIPT_DIR}/lib"

# Source helper modules
# shellcheck source=infra/scripts/lib/log.sh
source "${LIB_DIR}/log.sh"
# shellcheck source=infra/scripts/lib/lock.sh
source "${LIB_DIR}/lock.sh"
# shellcheck source=infra/scripts/lib/atomic.sh
source "${LIB_DIR}/atomic.sh"
# shellcheck source=infra/scripts/lib/smoke.sh
source "${LIB_DIR}/smoke.sh"

SRV_ROOT="${SRV_ROOT:-/srv/mindkid}"
RELEASES_DIR="${SRV_ROOT}/releases"
CURRENT_LINK="${SRV_ROOT}/current"

TARGET_COMMIT=""
SKIP_SMOKE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --commit)
      TARGET_COMMIT="$2"
      shift 2
      ;;
    --skip-smoke)
      SKIP_SMOKE=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [--commit <specific_release_hash>] [--skip-smoke]"
      exit 0
      ;;
    *)
      log_error "Unknown argument: $1"
      exit 1
      ;;
  esac
done

log_step "Starting rollback procedure..."

acquire_lock
trap release_lock EXIT

if [ ! -L "${CURRENT_LINK}" ]; then
  log_error "Current release symlink '${CURRENT_LINK}' does not exist. Cannot rollback."
  exit 1
fi

ACTIVE_RELEASE="$(readlink "${CURRENT_LINK}")"
log_info "Active release: ${ACTIVE_RELEASE}"

ROLLBACK_TARGET=""

if [ -n "${TARGET_COMMIT}" ]; then
  CANDIDATE="${RELEASES_DIR}/${TARGET_COMMIT}"
  if [ ! -d "${CANDIDATE}" ]; then
    log_error "Requested rollback release target '${CANDIDATE}' does not exist."
    exit 1
  fi
  ROLLBACK_TARGET="${CANDIDATE}"
else
  # Find the newest release directory that is NOT the currently active one
  if [ -d "${RELEASES_DIR}" ]; then
    for dir in $(ls -dt "${RELEASES_DIR}"/*/ 2>/dev/null); do
      dir_clean="${dir%/}"
      if [ "${dir_clean}" != "${ACTIVE_RELEASE}" ]; then
        ROLLBACK_TARGET="${dir_clean}"
        break
      fi
    done
  fi
fi

if [ -z "${ROLLBACK_TARGET}" ] || [ ! -d "${ROLLBACK_TARGET}" ]; then
  log_error "No previous release found in ${RELEASES_DIR} to rollback to."
  exit 1
fi

log_step "Rolling back from ${ACTIVE_RELEASE} -> ${ROLLBACK_TARGET}..."

# Step 1: Switch symlink atomically (BR-DEP-07)
switch_current_symlink "${ROLLBACK_TARGET}"

# Step 2: Reload PM2 processes (BR-SUP-02)
if command -v pm2 &>/dev/null && [ -f "${CURRENT_LINK}/infra/pm2/ecosystem.config.cjs" ]; then
  log_info "Reloading PM2 processes on rolled-back release..."
  pm2 reload "${CURRENT_LINK}/infra/pm2/ecosystem.config.cjs" --update-env
fi

# Step 3: Run smoke check
if [ "${SKIP_SMOKE}" = false ]; then
  log_step "Verifying health of rolled-back release..."
  if ! run_smoke_check "http://127.0.0.1:3000/api/guest/health" 10 2; then
    log_error "Rollback smoke check failed! System may require manual intervention."
    exit 1
  fi
fi

log_step "=== Rollback successfully completed! Active release is now: ${ROLLBACK_TARGET} ==="
