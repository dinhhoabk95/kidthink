#!/usr/bin/env bash
# Smoke gate after build (BR-DEP-15), after every release switch (BR-DEP-08),
# and after every rollback (BR-RBK-06).

# BR-DEP-15: Verify built artifacts before switching the release symlink:
#   1. Web SSR entry (`apps/web/.output/server/index.mjs`) exists, passes syntax
#      verification, and server ESM chunks do not contain CJS `__dirname` or
#      `node-gyp-build` leaks (BR-MPA-10).
#   2. Admin static SPA (`apps/admin/.output/public/index.html`) references an
#      existing `/_nuxt/*.css` entry stylesheet and the compiled CSS bundle is
#      > 100 KB so unstyled builds never ship (BR-DSC-21).
#   3. Client bundles (`apps/admin/.output/public/_nuxt` and
#      `apps/web/.output/public/_nuxt`) contain no server-only identifiers
#      (`node-gyp-build`, `__dirname`, `node:fs`, `node:crypto`, `node:zlib`)
#      (BR-MPA-09).
smoke_release_artifacts() {
  local release_dir="$1"
  local server_dir="${release_dir}/apps/web/.output/server"
  local server_entry="${server_dir}/index.mjs"
  local admin_public="${release_dir}/apps/admin/.output/public"
  local admin_index="${admin_public}/index.html"
  local admin_nuxt="${admin_public}/_nuxt"
  local web_nuxt="${release_dir}/apps/web/.output/public/_nuxt"

  if [ ! -s "${server_entry}" ]; then
    log_error "BR-DEP-15: web server entrypoint missing or empty at ${server_entry}."
    return 1
  fi

  if command -v node >/dev/null 2>&1; then
    if ! node --check "${server_entry}" >/dev/null 2>&1; then
      log_error "BR-DEP-15: web server entrypoint failed syntax check (${server_entry})."
      return 1
    fi
  fi

  local server_leak
  server_leak="$(find "${server_dir}" -path "${server_dir}/node_modules" -prune -o -type f -name '*.mjs' -print0 2>/dev/null \
    | xargs -0 grep -lE 'node-gyp-build|__dirname' 2>/dev/null || true)"
  if [ -n "${server_leak}" ]; then
    log_error "BR-DEP-15: web server ESM bundle contains forbidden CJS/native token (node-gyp-build or __dirname): ${server_leak}"
    return 1
  fi

  if [ ! -s "${admin_index}" ]; then
    log_error "BR-DEP-15: admin index.html missing or empty at ${admin_index}."
    return 1
  fi

  if [ ! -d "${admin_nuxt}" ]; then
    log_error "BR-DEP-15: admin _nuxt asset directory missing at ${admin_nuxt}."
    return 1
  fi

  local css_hrefs
  css_hrefs="$(grep -oE '/_nuxt/[^"'\'' >]+\.css' "${admin_index}" 2>/dev/null || true)"
  if [ -z "${css_hrefs}" ]; then
    log_error "BR-DEP-15: admin index.html does not reference any /_nuxt/*.css entry stylesheet."
    return 1
  fi

  local href css_file has_large_css=0 css_size
  while IFS= read -r href; do
    [ -n "${href}" ] || continue
    css_file="${admin_public}${href}"
    if [ ! -f "${css_file}" ]; then
      log_error "BR-DEP-15: admin stylesheet referenced in index.html does not exist (${css_file})."
      return 1
    fi
    css_size="$(wc -c <"${css_file}" | tr -d '[:space:]')"
    if [ "${css_size:-0}" -gt 100000 ]; then
      has_large_css=1
    fi
  done <<<"${css_hrefs}"

  if [ "${has_large_css}" -ne 1 ]; then
    local any_css
    while IFS= read -r any_css; do
      [ -n "${any_css}" ] || continue
      css_size="$(wc -c <"${any_css}" | tr -d '[:space:]')"
      if [ "${css_size:-0}" -gt 100000 ]; then
        has_large_css=1
        break
      fi
    done <<<"$(find "${admin_nuxt}" -maxdepth 1 -type f -name '*.css' 2>/dev/null || true)"
  fi

  if [ "${has_large_css}" -ne 1 ]; then
    log_error "BR-DEP-15: admin CSS entry bundle in ${admin_nuxt} is <= 100 KB; refusing to ship unstyled admin build."
    return 1
  fi

  local client_dir client_leak
  for client_dir in "${admin_nuxt}" "${web_nuxt}"; do
    [ -d "${client_dir}" ] || continue
    client_leak="$(grep -rlE 'node-gyp-build|__dirname|node:fs|node:crypto|node:zlib' "${client_dir}" 2>/dev/null || true)"
    if [ -n "${client_leak}" ]; then
      log_error "BR-DEP-15: client bundle in ${client_dir} contains forbidden server-only identifier: ${client_leak}"
      return 1
    fi
  done

  log_info "Release artifact smoke check passed (web SSR bundle, admin CSS > 100 KB, client chunk hygiene)."
  return 0
}

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
