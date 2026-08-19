#!/usr/bin/env bash
# Failure notification (BR-DEP-11) and rollback notification (BR-RBK-07).
#
# Endpoints live in /etc/mindkid/deploy.conf (0600 root), deliberately outside
# /etc/mindkid/env/: those three files belong to the three apps (BR-ENV-04) and
# the deploy tooling is not one of them.

mk_load_notify_conf() {
  if [ -f "${MK_CONF_FILE}" ]; then
    # shellcheck source=/dev/null
    . "${MK_CONF_FILE}"
  fi
}

# Never fails the caller: a release must not be reported as broken because the
# alerting channel is down, and a failing release must still exit non-zero.
notify() {
  local severity="$1"
  local message="$2"

  mk_load_notify_conf

  if [ -z "${MK_ALERT_WEBHOOK_URL:-}" ]; then
    log_warn "No MK_ALERT_WEBHOOK_URL in ${MK_CONF_FILE}; '${severity}' notification not delivered."
    return 0
  fi

  curl -sS -m 10 -X POST \
    -H 'Content-Type: application/json' \
    --data "$(printf '{"severity":"%s","source":"mindkid-deploy","message":"%s"}' "${severity}" "${message}")" \
    "${MK_ALERT_WEBHOOK_URL}" >/dev/null 2>&1 \
    || log_warn "Notification POST failed for severity ${severity}."

  return 0
}
