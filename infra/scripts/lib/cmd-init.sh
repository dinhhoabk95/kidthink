#!/usr/bin/env bash
# Verb: init — make a blank machine able to run every other verb.
#
# This exists because provisioning used to be invoked through the current
# release, which does not exist until a release has succeeded. Bootstrapping is
# its own step: it needs git and a mirror, nothing else.

cmd_init_usage() {
  cat <<'USAGE'
Usage: mindkid.sh init --remote <git url> [--ref <branch|tag|sha>]

  --remote  Repository the server pulls from. Recorded for later runs.
  --ref     Ref whose infra/ directory seeds bin/ and compose/. Default: main.
USAGE
}

mk_init_require_root() {
  if [ "$(id -u)" -ne 0 ]; then
    log_error "init must run as root: it creates the system user and the directory tree."
    return 1
  fi
}

mk_init_install_git() {
  command -v git >/dev/null 2>&1 && return 0

  log_info "Installing git."
  if command -v apt-get >/dev/null 2>&1; then
    DEBIAN_FRONTEND=noninteractive apt-get update -qq
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq git ca-certificates
  else
    log_error "No apt-get and no git; install git manually and run init again."
    return 1
  fi
}

# Directory tree of server-provisioning.md §7.1. Idempotent by construction:
# mkdir -p and chown converge, they do not recreate.
mk_init_layout() {
  if ! id "${MK_SYSTEM_USER}" >/dev/null 2>&1; then
    log_info "Creating system user ${MK_SYSTEM_USER}."
    useradd --system --shell /usr/sbin/nologin --home-dir "${MK_ROOT}" --create-home "${MK_SYSTEM_USER}"
  else
    log_info "System user ${MK_SYSTEM_USER} already exists."
  fi

  mkdir -p "${MK_RELEASES_DIR}" "${MK_SHARED_DIR}" "${MK_BIN_DIR}" "${MK_COMPOSE_DIR}"
  mkdir -p "${MK_LOG_DIR}"
  local app
  for app in "${MK_APPS[@]}"; do
    mkdir -p "${MK_LOG_DIR}/${app}"
  done

  chown -R "${MK_SYSTEM_USER}:${MK_SYSTEM_USER}" "${MK_ROOT}" "${MK_LOG_DIR}"

  # The env directory is root's and stays root's: the supervisor reads the files
  # as root and hands the values to a process running as mindkid (BR-ENV-05).
  mkdir -p "${MK_ENV_DIR}"
  chown root:root "${MK_ENV_DIR}"
  chmod 0750 "${MK_ENV_DIR}"
}

# Copies the operational assets out of a commit so provisioning never depends on
# a release being live.
mk_init_seed_assets() {
  local ref="$1"
  local commit staging

  commit="$(resolve_commit "${ref}")" || return 1
  staging="$(mktemp -d)"

  export_commit_tree "${commit}" "${staging}" || {
    rm -rf "${staging}"
    return 1
  }

  log_info "Seeding ${MK_BIN_DIR} and ${MK_COMPOSE_DIR} from ${commit:0:7}."
  rm -rf "${MK_BIN_DIR:?}/lib"
  cp -R "${staging}/infra/scripts/." "${MK_BIN_DIR}/"
  cp -R "${staging}/infra/nginx" "${MK_COMPOSE_DIR}/"
  cp -R "${staging}/infra/pm2" "${MK_COMPOSE_DIR}/"
  cp "${staging}/infra/docker-compose.prod.yml" "${MK_COMPOSE_DIR}/"
  chmod 0755 "${MK_BIN_DIR}/mindkid.sh"

  rm -rf "${staging}"
}

cmd_init() {
  local remote="" ref="main"

  while [ $# -gt 0 ]; do
    case "$1" in
      --remote) remote="${2:-}"; shift 2 ;;
      --ref) ref="${2:-}"; shift 2 ;;
      --help|-h) cmd_init_usage; return 0 ;;
      *) log_error "Unknown argument: $1"; cmd_init_usage; return 2 ;;
    esac
  done

  if [ -z "${remote}" ]; then
    log_error "--remote <git url> is required."
    cmd_init_usage
    return 2
  fi

  mk_init_require_root || return 1
  log_step "Bootstrapping ${MK_ROOT}."

  mk_init_install_git || return 1
  mk_init_layout
  ensure_repo_mirror "${remote}" || return 1
  mk_init_seed_assets "${ref}" || return 1

  log_step "Bootstrap complete."
  log_info "Next: ${MK_BIN_DIR}/mindkid.sh provision"
  log_info "Then write ${MK_ENV_DIR}/{web,admin,worker}.env, mode 0600 root:root."
}
