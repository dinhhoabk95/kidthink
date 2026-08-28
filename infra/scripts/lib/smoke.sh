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

# One attempt, no retries: by the time this runs the loopback check has already
# confirmed the process is up, so a bad answer here is a configuration fault
# (nginx, certificate, file permissions) and waiting will not change it.
mk_probe_once() {
  local url="$1" what="$2"
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "${url}" 2>/dev/null || echo 000)"
  if [ "${code}" = "200" ]; then
    log_info "${what} answered 200 at ${url}."
    return 0
  fi
  log_error "${what} answered HTTP ${code} at ${url}."
  return 1
}

# The gate a release is actually judged by.
#
# Checking only 127.0.0.1:3000 measures whether Node is alive. It says nothing
# about the path a visitor takes: nginx can be rejecting requests, the
# certificate can be missing, and the admin tree — which has no process at all —
# can be unreadable, while the loopback check stays green the whole time.
#
# The public probes are skipped, loudly, when no public URL is configured; a
# machine without DNS yet is a real state, silently passing is not.
run_release_smoke() {
  run_smoke_check "${MK_HEALTH_URL}" "${1:-10}" "${2:-3}" || return 1

  if [ -z "${MK_PUBLIC_HEALTH_URL}" ] && [ -z "${MK_PUBLIC_ADMIN_URL}" ]; then
    log_warn "No public URL configured (MK_PUBLIC_HEALTH_URL, MK_PUBLIC_ADMIN_URL); this release was verified on the loopback port only."
    return 0
  fi

  local failed=0
  [ -n "${MK_PUBLIC_HEALTH_URL}" ] \
    && { mk_probe_once "${MK_PUBLIC_HEALTH_URL}" "Public site" || failed=1; }
  [ -n "${MK_PUBLIC_ADMIN_URL}" ] \
    && { mk_probe_once "${MK_PUBLIC_ADMIN_URL}" "Admin tree" || failed=1; }

  return "${failed}"
}
