#!/usr/bin/env bash
# MindKid server tooling — one entry point for every server-side operation.
#
# Specs: docs/specs/01-platform/server-provisioning.md
#        docs/specs/01-platform/release-deploy.md
#        docs/specs/01-platform/release-rollback.md
#
# One script means one lock, one log file and one static-analysis target. Verbs
# live in lib/cmd-<verb>.sh; this file only dispatches.

set -euo pipefail

MK_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MK_LIB_DIR="${MK_SCRIPT_DIR}/lib"

# shellcheck source=lib/paths.sh
. "${MK_LIB_DIR}/paths.sh"
# shellcheck source=lib/log.sh
. "${MK_LIB_DIR}/log.sh"
# shellcheck source=lib/lock.sh
. "${MK_LIB_DIR}/lock.sh"
# shellcheck source=lib/atomic.sh
. "${MK_LIB_DIR}/atomic.sh"
# shellcheck source=lib/smoke.sh
. "${MK_LIB_DIR}/smoke.sh"
# shellcheck source=lib/notify.sh
. "${MK_LIB_DIR}/notify.sh"
# shellcheck source=lib/pm2.sh
. "${MK_LIB_DIR}/pm2.sh"
# shellcheck source=lib/envcheck.sh
. "${MK_LIB_DIR}/envcheck.sh"
# shellcheck source=lib/git.sh
. "${MK_LIB_DIR}/git.sh"
# shellcheck source=lib/releases.sh
. "${MK_LIB_DIR}/releases.sh"
# shellcheck source=lib/build.sh
. "${MK_LIB_DIR}/build.sh"

usage() {
  cat <<'USAGE'
Usage: mindkid.sh <verb> [options]

  init       Bootstrap a blank machine: system user, directory tree, mirror
  provision  Converge the host: packages, firewall, datastores, web server, TLS
  release    Deploy a ref: validate, build, migrate, switch, smoke, prune
  rollback   Return to a previously built release, code only
  status     Active release, retained releases, processes, health
  logs       Tail an application log or the deploy log
  env        Report on the three env files without printing any value

Run `mindkid.sh <verb> --help` for the options of one verb.
USAGE
}

main() {
  local verb="${1:-help}"
  [ $# -gt 0 ] && shift

  case "${verb}" in
    help|-h|--help)
      usage
      return 0
      ;;
    init|provision|release|rollback|status|logs|env)
      # shellcheck source=/dev/null
      . "${MK_LIB_DIR}/cmd-${verb}.sh"
      log_init
      "cmd_${verb}" "$@"
      ;;
    *)
      printf 'Unknown verb: %s\n\n' "${verb}" >&2
      usage >&2
      return 2
      ;;
  esac
}

main "$@"
