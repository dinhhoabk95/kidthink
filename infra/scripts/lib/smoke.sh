#!/usr/bin/env bash
# Smoke test verification helper (BR-DEP-08, BR-RBK-03)

run_smoke_check() {
  local health_url="${1:-http://127.0.0.1:3000/api/guest/health}"
  local max_retries="${2:-10}"
  local retry_delay="${3:-3}"

  echo "[INFO] Running smoke check against ${health_url} (max ${max_retries} attempts)..."

  for i in $(seq 1 "${max_retries}"); do
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" "${health_url}" 2>/dev/null || echo "000")
    if [ "${code}" = "200" ]; then
      echo "[INFO] Smoke check passed (HTTP 200) on attempt ${i}."
      return 0
    fi
    echo "[WARN] Attempt ${i}/${max_retries} failed (HTTP ${code}). Retrying in ${retry_delay}s..."
    sleep "${retry_delay}"
  done

  echo "[ERROR] Smoke check failed after ${max_retries} attempts." >&2
  return 1
}
