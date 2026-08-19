#!/usr/bin/env bash
# Smoke gate after every release switch (BR-DEP-08) and every rollback (BR-RBK-06).

run_smoke_check() {
  local health_url="${1:-${MK_HEALTH_URL}}"
  local max_retries="${2:-10}"
  local retry_delay="${3:-3}"

  log_info "Smoke check against ${health_url} (up to ${max_retries} attempts)."

  local attempt code
  for attempt in $(seq 1 "${max_retries}"); do
    code="$(curl -s -o /dev/null -w '%{http_code}' "${health_url}" 2>/dev/null || echo 000)"
    if [ "${code}" = "200" ]; then
      log_info "Smoke check passed (HTTP 200) on attempt ${attempt}."
      return 0
    fi
    log_warn "Smoke attempt ${attempt}/${max_retries} got HTTP ${code}."
    [ "${attempt}" -lt "${max_retries}" ] && sleep "${retry_delay}"
  done

  log_error "Smoke check failed after ${max_retries} attempts (last HTTP ${code})."
  return 1
}
