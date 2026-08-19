#!/usr/bin/env bash
# Logging helper library (BR-DEP-10: never print secret values)

log_info() {
  echo "[INFO] [$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

log_step() {
  echo ""
  echo "==> [STEP] [$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

log_warn() {
  echo "[WARN] [$(date '+%Y-%m-%d %H:%M:%S')] $*" >&2
}

log_error() {
  echo "[ERROR] [$(date '+%Y-%m-%d %H:%M:%S')] $*" >&2
}
