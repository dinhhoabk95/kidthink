#!/usr/bin/env bash
# Verb: logs — tail one application's log, or the deploy log.

cmd_logs_usage() {
  cat <<'USAGE'
Usage: mindkid.sh logs [web|admin|worker|deploy] [--lines <n>]
USAGE
}

cmd_logs() {
  local target="web" lines=100

  while [ $# -gt 0 ]; do
    case "$1" in
      --lines) lines="${2:-100}"; shift 2 ;;
      --help|-h) cmd_logs_usage; return 0 ;;
      web|admin|worker|deploy) target="$1"; shift ;;
      *) log_error "Unknown log target: $1"; cmd_logs_usage; return 2 ;;
    esac
  done

  case "${lines}" in
    ''|*[!0-9]*) log_error "--lines must be a number."; return 2 ;;
  esac

  if [ "${target}" = "deploy" ]; then
    tail -n "${lines}" "${MK_DEPLOY_LOG}"
    return 0
  fi

  tail -n "${lines}" "${MK_LOG_DIR}/${target}/out.log" "${MK_LOG_DIR}/${target}/error.log"
}
