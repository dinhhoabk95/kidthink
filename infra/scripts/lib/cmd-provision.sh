#!/usr/bin/env bash
# Verb: provision — the eleven steps of server-provisioning.md §4.
#
# Every step is written to converge, not to install: running this on a machine
# that is already correct changes nothing and stops no process (BR-SRV-01).
# It never writes an env file and never touches a database volume (BR-SRV-07).

cmd_provision_usage() {
  cat <<'USAGE'
Usage: mindkid.sh provision [--site-domain <d>] [--admin-domain <d>] [--skip-tls]
USAGE
}

MK_MIN_DISK_GB=40
MK_MIN_MEMORY_MB=3800

mk_prov_preflight() {
  log_step "1. Checking host prerequisites."

  if [ "$(id -u)" -ne 0 ]; then
    log_error "provision must run as root."
    return 1
  fi

  local arch
  arch="$(uname -m)"
  if [ "${arch}" != "x86_64" ]; then
    log_error "Expected x86_64, found ${arch}."
    return 1
  fi

  local free_gb
  free_gb="$(df -BG --output=avail / 2>/dev/null | tail -1 | tr -dc '0-9')"
  if [ -n "${free_gb}" ] && [ "${free_gb}" -lt "${MK_MIN_DISK_GB}" ]; then
    # Half an install is harder to clean up than no install.
    log_error "Only ${free_gb} GB free on /; need ${MK_MIN_DISK_GB} GB. Stopping before anything is installed."
    return 1
  fi

  local mem_mb
  mem_mb="$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo 2>/dev/null)"
  if [ -n "${mem_mb}" ] && [ "${mem_mb}" -lt "${MK_MIN_MEMORY_MB}" ]; then
    log_error "Only ${mem_mb} MB RAM; need ${MK_MIN_MEMORY_MB} MB."
    return 1
  fi

  log_info "Host meets the minimum: ${arch}, ${free_gb:-?} GB free, ${mem_mb:-?} MB RAM."
}

mk_prov_base_system() {
  log_step "2. Base system settings."
  timedatectl set-timezone Asia/Ho_Chi_Minh 2>/dev/null || log_warn "Could not set the timezone."

  if command -v apt-get >/dev/null 2>&1; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get install -y -qq curl ca-certificates gnupg lsb-release logrotate gettext-base nginx certbot python3-certbot-nginx
  fi
}

# Steps 3 and 6 already ran during init; re-asserting them is cheap and keeps
# provision usable on a machine whose tree was edited by hand.
mk_prov_layout() {
  log_step "3. Directory tree and ownership."
  mk_init_layout
}

mk_prov_firewall() {
  log_step "4. Firewall."
  command -v ufw >/dev/null 2>&1 || apt-get install -y -qq ufw

  # Deliberately no `ufw --force reset`: resetting drops every rule, including
  # the SSH rule, for as long as the rebuild takes. Adding rules is idempotent.
  ufw default deny incoming >/dev/null
  ufw default allow outgoing >/dev/null
  local port
  for port in 22 80 443; do
    ufw allow "${port}/tcp" >/dev/null
  done

  if ufw status | head -1 | grep -q inactive; then
    ufw --force enable >/dev/null
  fi
  log_info "Firewall allows 22, 80, 443; everything else is denied."
}

mk_prov_check_version() {
  local name="$1" actual="$2" expected_major="$3"

  if [ -z "${actual}" ]; then
    printf 'missing\n'
    return 0
  fi
  if [ "${actual}" = "${expected_major}" ]; then
    log_info "${name} ${actual} matches the contract."
    printf 'ok\n'
    return 0
  fi

  # BR-SRV-05: a version mismatch is a planned migration, never an automatic one.
  log_error "${name} major version ${actual} does not match the contracted ${expected_major}. Not upgrading automatically."
  printf 'drift\n'
}

mk_prov_runtime() {
  log_step "5. Runtime and container tooling."

  local node_major
  node_major="$(node -v 2>/dev/null | sed 's/^v//; s/\..*//')"
  case "$(mk_prov_check_version Node "${node_major}" "${MK_NODE_MAJOR}")" in
    drift) return 1 ;;
    missing)
      log_info "Installing Node ${MK_NODE_MAJOR}."
      curl -fsSL "https://deb.nodesource.com/setup_${MK_NODE_MAJOR}.x" | bash -
      apt-get install -y -qq nodejs
      ;;
  esac

  if ! command -v pnpm >/dev/null 2>&1; then
    log_info "Enabling pnpm through corepack."
    corepack enable
    corepack prepare "pnpm@${MK_PNPM_MAJOR}" --activate
  else
    log_info "pnpm already present."
  fi

  if ! command -v docker >/dev/null 2>&1; then
    log_info "Installing Docker."
    curl -fsSL https://get.docker.com | sh
  else
    log_info "Docker already present."
  fi

  if ! command -v pm2 >/dev/null 2>&1; then
    log_info "Installing the process supervisor."
    npm install -g pm2
  else
    log_info "Process supervisor already present."
  fi

  # BR-SUP-01: without this the applications do not come back after a reboot.
  # The supervisor runs as root and drops each application to the mindkid uid;
  # see infra/pm2/ecosystem.config.cjs.
  pm2 startup systemd -u root --hp /root >/dev/null 2>&1 \
    || log_warn "Could not register the supervisor with systemd."
}

mk_prov_datastores() {
  log_step "7. PostgreSQL and Valkey."

  local compose_file="${MK_COMPOSE_DIR}/docker-compose.prod.yml"
  if [ ! -f "${compose_file}" ]; then
    log_error "Compose file missing at ${compose_file}; run init first."
    return 1
  fi
  if [ ! -f "${MK_COMPOSE_DIR}/datastore.env" ]; then
    log_error "Missing ${MK_COMPOSE_DIR}/datastore.env with POSTGRES_PASSWORD. Write it (0600 root:root) and run provision again."
    return 1
  fi

  # `up -d` on an already-correct stack is a no-op, and no volume is ever named
  # on a destructive command anywhere in this script (BR-SRV-07).
  docker compose --env-file "${MK_COMPOSE_DIR}/datastore.env" -f "${compose_file}" up -d

  local pg_major
  pg_major="$(docker exec mindkid-postgres-prod postgres --version 2>/dev/null | grep -oE '[0-9]+' | head -1)"
  [ "$(mk_prov_check_version PostgreSQL "${pg_major}" "${MK_POSTGRES_MAJOR}")" = drift ] && return 1

  local valkey_major
  valkey_major="$(docker exec mindkid-valkey-prod valkey-server --version 2>/dev/null | grep -oE 'v=[0-9]+' | grep -oE '[0-9]+')"
  [ "$(mk_prov_check_version Valkey "${valkey_major}" "${MK_VALKEY_MAJOR}")" = drift ] && return 1

  return 0
}

mk_prov_web_server() {
  local site_domain="$1" admin_domain="$2"
  log_step "8. Web server configuration."

  local template="${MK_COMPOSE_DIR}/nginx/mindkid.conf.tmpl"
  if [ ! -f "${template}" ]; then
    log_error "Nginx template missing at ${template}; run init first."
    return 1
  fi

  mkdir -p /etc/nginx/snippets /etc/nginx/conf.d
  cp -f "${MK_COMPOSE_DIR}/nginx/mindkid-proxy.conf" /etc/nginx/snippets/mindkid-proxy.conf
  cp -f "${MK_COMPOSE_DIR}/nginx/mindkid-upgrade-map.conf" /etc/nginx/conf.d/mindkid-upgrade-map.conf

  # shellcheck disable=SC2016
  # The single quotes are required: envsubst takes the placeholder names as a
  # literal argument and substitutes only those, leaving nginx's own $variables
  # untouched.
  SITE_DOMAIN="${site_domain}" ADMIN_DOMAIN="${admin_domain}" \
    envsubst '${SITE_DOMAIN} ${ADMIN_DOMAIN}' \
    <"${template}" >/etc/nginx/sites-available/mindkid.conf
  ln -sfn /etc/nginx/sites-available/mindkid.conf /etc/nginx/sites-enabled/mindkid.conf
  rm -f /etc/nginx/sites-enabled/default

  if nginx -t 2>/dev/null; then
    systemctl reload nginx
    log_info "Nginx configuration reloaded."
  else
    # Expected before certificates exist; the TLS step fixes it.
    log_warn "Nginx rejected the configuration. This is normal before certificates exist."
  fi
}

mk_prov_tls() {
  local site_domain="$1" admin_domain="$2" skip_tls="$3"
  log_step "9. TLS certificates."

  if [ "${skip_tls}" = true ]; then
    log_info "Skipping certificates on request."
    return 0
  fi

  local domain resolved
  for domain in "${site_domain}" "${admin_domain}"; do
    resolved="$(getent hosts "${domain}" 2>/dev/null | awk '{print $1}' | head -1)"
    if [ -z "${resolved}" ]; then
      log_warn "${domain} does not resolve yet; skipping its certificate. Point DNS here, then run provision again."
      continue
    fi
    if [ -d "/etc/letsencrypt/live/${domain}" ]; then
      log_info "Certificate for ${domain} already present."
      continue
    fi
    certbot --nginx -n --agree-tos --redirect \
      -d "${domain}" -m "${MK_TLS_CONTACT_EMAIL:-admin@${site_domain}}" \
      || log_warn "Certificate request for ${domain} failed; the other steps still completed."
  done

  # BR-SRV-08: renewal must be automatic and observable.
  systemctl enable --now certbot.timer >/dev/null 2>&1 \
    || log_warn "Could not enable the certificate renewal timer."
}

mk_prov_logging() {
  log_step "10. Log rotation."
  local source="${MK_COMPOSE_DIR}/pm2/logrotate.conf"
  if [ -f "${source}" ]; then
    cp -f "${source}" /etc/logrotate.d/mindkid
    log_info "Log rotation installed from ${source}."
  else
    log_error "Log rotation template missing at ${source}."
    return 1
  fi
}

mk_prov_report() {
  local site_domain="$1"
  log_step "11. Versions on this host."
  printf 'Node       %s\n' "$(node -v 2>/dev/null || echo absent)"
  printf 'pnpm       %s\n' "$(pnpm -v 2>/dev/null || echo absent)"
  printf 'Supervisor %s\n' "$(pm2 -v 2>/dev/null || echo absent)"
  printf 'Nginx      %s\n' "$(nginx -v 2>&1 | sed 's|nginx version: ||' || echo absent)"
  printf 'Docker     %s\n' "$(docker --version 2>/dev/null || echo absent)"
  printf 'PostgreSQL %s\n' "$(docker exec mindkid-postgres-prod postgres --version 2>/dev/null || echo absent)"
  printf 'Valkey     %s\n' "$(docker exec mindkid-valkey-prod valkey-server --version 2>/dev/null || echo absent)"

  # The two things this script will not do for you (spec §4, closing note).
  log_step "Manual steps that remain:"
  log_info "1. Point DNS for ${site_domain} at this machine's address."
  local app missing=0
  for app in "${MK_APPS[@]}"; do
    [ -f "${MK_ENV_DIR}/${app}.env" ] || missing=1
  done
  if [ "${missing}" -eq 1 ]; then
    log_info "2. Write ${MK_ENV_DIR}/{web,admin,worker}.env, mode 0600 root:root (env-contract.md §7.3)."
    log_warn "Until those exist, the first release will stop at the environment gate."
  else
    log_info "2. Environment files are present."
  fi
}

cmd_provision() {
  local site_domain="${MK_SITE_DOMAIN:-mindkid.vn}"
  local admin_domain="${MK_ADMIN_DOMAIN:-admin.mindkid.vn}"
  local skip_tls=false

  while [ $# -gt 0 ]; do
    case "$1" in
      --site-domain) site_domain="${2:-}"; shift 2 ;;
      --admin-domain) admin_domain="${2:-}"; shift 2 ;;
      --skip-tls) skip_tls=true; shift ;;
      --help|-h) cmd_provision_usage; return 0 ;;
      *) log_error "Unknown argument: $1"; cmd_provision_usage; return 2 ;;
    esac
  done

  acquire_lock || return 1
  trap release_lock EXIT INT TERM

  mk_prov_preflight || return 1
  mk_prov_base_system
  mk_prov_layout
  mk_prov_firewall
  mk_prov_runtime || return 1
  mk_prov_datastores || return 1
  mk_prov_web_server "${site_domain}" "${admin_domain}" || return 1
  mk_prov_tls "${site_domain}" "${admin_domain}" "${skip_tls}"
  mk_prov_logging || return 1
  mk_prov_report "${site_domain}"
}
