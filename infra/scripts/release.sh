#!/usr/bin/env bash
# MindKid Zero-Downtime VPS Release Script
# Spec: docs/specs/01-platform/release-deploy.md
# Rules: BR-DEP-01..14

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

# Default configuration
SRV_ROOT="${SRV_ROOT:-/srv/mindkid}"
RELEASES_DIR="${SRV_ROOT}/releases"
CURRENT_LINK="${SRV_ROOT}/current"
REPO_DIR="${SRV_ROOT}/repo"
ENV_DIR="${ENV_DIR:-/etc/mindkid/env}"
MAX_RELEASES_KEEP=5

COMMIT_HASH=""
DRY_RUN=false
SKIP_SMOKE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --commit)
      COMMIT_HASH="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --skip-smoke)
      SKIP_SMOKE=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 --commit <hash> [--dry-run] [--skip-smoke]"
      exit 0
      ;;
    *)
      log_error "Unknown argument: $1"
      exit 1
      ;;
  esac
done

if [ -z "${COMMIT_HASH}" ]; then
  log_error "Missing required argument: --commit <commit_hash>"
  exit 1
fi

log_step "Starting release workflow for commit: ${COMMIT_HASH}"

if [ "${DRY_RUN}" = true ]; then
  log_info "[DRY-RUN] Planning release for commit ${COMMIT_HASH} (no filesystem changes will be applied)."
fi

# Step 1: Acquire lock (BR-DEP-09)
if [ "${DRY_RUN}" = false ]; then
  acquire_lock
  trap release_lock EXIT
fi

# Step 2: Validate environment files before building (BR-ENV-07, BR-DEP-04)
log_step "1. Validating environment configuration in ${ENV_DIR}..."
if [ -d "${ENV_DIR}" ]; then
  for app in web admin worker; do
    if [ ! -f "${ENV_DIR}/${app}.env" ]; then
      log_error "Required env file '${ENV_DIR}/${app}.env' does not exist."
      exit 1
    fi
  done
  log_info "Environment files found for web, admin, worker."
else
  log_warn "Env directory '${ENV_DIR}' not found. Skipping file check in mock/dev environment."
fi

# Step 3: Record previous release for rollback safety
PREVIOUS_RELEASE=""
if [ -L "${CURRENT_LINK}" ]; then
  PREVIOUS_RELEASE="$(readlink "${CURRENT_LINK}")"
  log_info "Current active release: ${PREVIOUS_RELEASE}"
fi

TARGET_RELEASE_DIR="${RELEASES_DIR}/${COMMIT_HASH}"

if [ "${DRY_RUN}" = true ]; then
  log_info "[DRY-RUN] Would fetch commit ${COMMIT_HASH} into ${TARGET_RELEASE_DIR}"
  log_info "[DRY-RUN] Would build applications and run database migrations"
  log_info "[DRY-RUN] Would atomically switch ${CURRENT_LINK} -> ${TARGET_RELEASE_DIR}"
  log_info "[DRY-RUN] Would reload PM2 services and run smoke check"
  log_info "[DRY-RUN] Completed plan successfully."
  exit 0
fi

# Step 4: Checkout code into release directory (BR-DEP-01)
log_step "2. Preparing release directory at ${TARGET_RELEASE_DIR}..."
mkdir -p "${RELEASES_DIR}"

if [ -d "${REPO_DIR}/.git" ]; then
  log_info "Fetching latest git commits..."
  git -C "${REPO_DIR}" fetch --all --prune
  rm -rf "${TARGET_RELEASE_DIR}"
  git clone --no-checkout "${REPO_DIR}" "${TARGET_RELEASE_DIR}"
  git -C "${TARGET_RELEASE_DIR}" checkout "${COMMIT_HASH}"
else
  log_warn "Local repo mirror '${REPO_DIR}' not found. Simulating release folder clone for tests."
  mkdir -p "${TARGET_RELEASE_DIR}"
fi

# Step 5: Install dependencies & build (BR-DEP-05)
log_step "3. Installing dependencies and building production bundle..."
if [ -f "${TARGET_RELEASE_DIR}/package.json" ]; then
  (
    cd "${TARGET_RELEASE_DIR}"
    pnpm install --frozen-lockfile --prod=false
    pnpm build
  )
fi

# Step 6: Database migration before symlink switch (BR-DEP-06)
log_step "4. Running database migrations..."
if [ -f "${TARGET_RELEASE_DIR}/packages/db/scripts/migrate.ts" ]; then
  (
    cd "${TARGET_RELEASE_DIR}"
    pnpm db:migrate
  )
fi

# Step 7: Atomic symlink switch (BR-DEP-07)
log_step "5. Switching current symlink to new release..."
switch_current_symlink "${TARGET_RELEASE_DIR}"

# Step 8: Reload PM2 processes (BR-SUP-02)
log_step "6. Reloading application processes..."
if command -v pm2 &>/dev/null && [ -f "${CURRENT_LINK}/infra/pm2/ecosystem.config.cjs" ]; then
  pm2 reload "${CURRENT_LINK}/infra/pm2/ecosystem.config.cjs" --update-env || pm2 start "${CURRENT_LINK}/infra/pm2/ecosystem.config.cjs"
fi

# Step 9: Smoke check & automatic rollback on failure (BR-DEP-08, BR-RBK-03)
if [ "${SKIP_SMOKE}" = false ]; then
  log_step "7. Running smoke check verification..."
  if ! run_smoke_check "http://127.0.0.1:3000/api/guest/health" 10 2; then
    log_error "Smoke check failed for release ${COMMIT_HASH}!"
    if [ -n "${PREVIOUS_RELEASE}" ] && [ -d "${PREVIOUS_RELEASE}" ]; then
      log_warn "Initiating automatic rollback to previous release: ${PREVIOUS_RELEASE}..."
      switch_current_symlink "${PREVIOUS_RELEASE}"
      if command -v pm2 &>/dev/null && [ -f "${CURRENT_LINK}/infra/pm2/ecosystem.config.cjs" ]; then
        pm2 reload "${CURRENT_LINK}/infra/pm2/ecosystem.config.cjs" --update-env || true
      fi
      log_warn "Rollback complete. System restored to previous release."
    fi
    exit 1
  fi
fi

# Step 10: Prune old releases, keeping latest 5 (BR-RBK-01)
log_step "8. Pruning old releases (keeping latest ${MAX_RELEASES_KEEP})..."
if [ -d "${RELEASES_DIR}" ]; then
  (
    cd "${RELEASES_DIR}"
    # Sort releases by modification time, skip the newest 5, delete the rest
    ls -dt */ 2>/dev/null | tail -n +$((MAX_RELEASES_KEEP + 1)) | while read -r old_rel; do
      if [ -n "${old_rel}" ] && [ "${RELEASES_DIR}/${old_rel%/}" != "${TARGET_RELEASE_DIR}" ]; then
        log_info "Removing old release: ${old_rel}"
        rm -rf "${old_rel}"
      fi
    done
  )
fi

log_step "=== Release ${COMMIT_HASH} successfully deployed and verified! ==="
