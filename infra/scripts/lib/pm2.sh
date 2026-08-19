#!/usr/bin/env bash
# Process supervisor control (BR-SUP-02: reload, never stop-then-start).

mk_ecosystem_path() {
  printf '%s\n' "${MK_CURRENT_LINK}/infra/pm2/ecosystem.config.cjs"
}

# Reload order is contractual (release-deploy.md §7.2): worker consumes the new
# schema first, admin is the low-traffic canary, web goes last.
reload_apps() {
  local ecosystem
  ecosystem="$(mk_ecosystem_path)"

  if ! command -v pm2 >/dev/null 2>&1; then
    log_error "pm2 not found on PATH; cannot reload applications."
    return 1
  fi
  if [ ! -f "${ecosystem}" ]; then
    log_error "Ecosystem file '${ecosystem}' missing; cannot reload applications."
    return 1
  fi

  local app
  for app in "${MK_RELOAD_ORDER[@]}"; do
    log_info "Reloading mindkid-${app}."
    if ! pm2 reload "mindkid-${app}" --update-env >/dev/null 2>&1; then
      log_info "mindkid-${app} not running yet; starting it from the ecosystem file."
      pm2 start "${ecosystem}" --only "mindkid-${app}" --update-env
    fi
  done

  # Without this the process list is lost on reboot (BR-SUP-01).
  pm2 save >/dev/null 2>&1 || log_warn "pm2 save failed; process list will not survive a reboot."
}
