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

# server-provisioning.md §11 question 4 — "is 4 GB enough to build two Nuxt
# applications". Answer: not without swap. The build runs on this host by
# contract (BR-DEP-05), and a Nitro build peaks well above what is left after
# PostgreSQL, Valkey and a web cluster have taken their share. Swap turns an
# OOM kill mid-release into a slow release.
MK_SWAP_THRESHOLD_MB=8000
MK_SWAP_FILE=/swapfile
MK_SWAP_SIZE_MB=4096

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
  mk_prov_swap "${mem_mb}"
}

# Idempotent by checking for the file, not by checking free memory: running
# provision twice on a 4 GB host must not leave two swap files.
mk_prov_swap() {
  local mem_mb="$1"

  if [ -z "${mem_mb}" ] || [ "${mem_mb}" -ge "${MK_SWAP_THRESHOLD_MB}" ]; then
    return 0
  fi
  if [ -f "${MK_SWAP_FILE}" ]; then
    log_info "Swap file ${MK_SWAP_FILE} already present."
    swapon "${MK_SWAP_FILE}" 2>/dev/null || true
    return 0
  fi

  log_info "Only ${mem_mb} MB RAM; creating a ${MK_SWAP_SIZE_MB} MB swap file so the build survives."
  if ! fallocate -l "${MK_SWAP_SIZE_MB}M" "${MK_SWAP_FILE}" 2>/dev/null; then
    dd if=/dev/zero of="${MK_SWAP_FILE}" bs=1M count="${MK_SWAP_SIZE_MB}" status=none
  fi
  chmod 0600 "${MK_SWAP_FILE}"
  mkswap "${MK_SWAP_FILE}" >/dev/null
  swapon "${MK_SWAP_FILE}"

  # Without the fstab line the swap disappears on the next reboot, and the
  # release that fails afterwards looks unrelated to this machine's memory.
  if ! grep -q "^${MK_SWAP_FILE} " /etc/fstab 2>/dev/null; then
    printf '%s none swap sw 0 0\n' "${MK_SWAP_FILE}" >>/etc/fstab
  fi
}

mk_prov_base_system() {
  log_step "2. Base system settings."
  timedatectl set-timezone Asia/Ho_Chi_Minh 2>/dev/null || log_warn "Could not set the timezone."

  if command -v apt-get >/dev/null 2>&1; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    # certbot only: TLS is issued with the webroot plugin, which needs no nginx
    # integration and never edits a configuration this script owns.
    apt-get install -y -qq curl ca-certificates gnupg lsb-release logrotate gettext-base nginx certbot
    mk_prov_postgres_client || return 1
  fi
}

# BR-BAK-01/06: the backup and restore jobs run on this host and shell out to
# pg_dump and psql. The database itself is in a container, so nothing installs
# these as a side effect — and a missing binary makes the backup job die with
# ENOENT, which is the quietest way possible to have no backups.
#
# The major must match the server: pg_dump refuses to dump from a newer server
# than itself, and Debian's default postgresql-client is older than 17.
mk_prov_postgres_client() {
  local client_major
  client_major="$(pg_dump --version 2>/dev/null | grep -oE '[0-9]+' | head -1)"

  case "$(mk_prov_check_version 'pg_dump' "${client_major}" "${MK_POSTGRES_MAJOR}")" in
    ok) return 0 ;;
    drift) return 1 ;;
  esac

  log_info "Installing postgresql-client-${MK_POSTGRES_MAJOR} from the PostgreSQL project repository."
  install -d -m 0755 /usr/share/postgresql-common/pgdg
  curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
    -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc
  printf 'deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt %s-pgdg main\n' \
    "$(lsb_release -cs)" >/etc/apt/sources.list.d/pgdg.list
  apt-get update -qq
  apt-get install -y -qq "postgresql-client-${MK_POSTGRES_MAJOR}"
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

# Step 8a — the part of the web server that is valid with no certificate on the
# machine. This is what breaks the bootstrap deadlock: certbot runs `nginx -t`
# before it does anything, so a configuration that names certificates which do
# not exist yet stops the very command that would create them.
mk_prov_nginx_shared() {
  mkdir -p /etc/nginx/snippets /etc/nginx/conf.d /var/www/html

  local src="${MK_COMPOSE_DIR}/nginx"
  cp -f "${src}/mindkid-proxy.conf" /etc/nginx/snippets/mindkid-proxy.conf
  cp -f "${src}/mindkid-upgrade-map.conf" /etc/nginx/conf.d/mindkid-upgrade-map.conf
  cp -f "${src}/mindkid-limits.conf" /etc/nginx/conf.d/mindkid-limits.conf
  cp -f "${src}/mindkid-tls-params.conf" /etc/nginx/conf.d/mindkid-tls-params.conf
}

# Renders one template into sites-available. The single quotes around the names
# are required: envsubst substitutes only the names it is given and leaves
# nginx's own $variables alone.
mk_prov_render_site() {
  local name="$1" site_domain="$2" admin_domain="$3"
  local template="${MK_COMPOSE_DIR}/nginx/${name}.conf.tmpl"

  if [ ! -f "${template}" ]; then
    log_error "Nginx template missing at ${template}; run init first."
    return 1
  fi

  # shellcheck disable=SC2016
  SITE_DOMAIN="${site_domain}" ADMIN_DOMAIN="${admin_domain}" \
    envsubst '${SITE_DOMAIN} ${ADMIN_DOMAIN}' \
    <"${template}" >"/etc/nginx/sites-available/${name}.conf"
}

mk_prov_enable_site() {
  ln -sfn "/etc/nginx/sites-available/$1.conf" "/etc/nginx/sites-enabled/$1.conf"
}

mk_prov_disable_site() {
  rm -f "/etc/nginx/sites-enabled/$1.conf"
}

# `nginx -t` is a stop condition everywhere it appears below. The previous
# version downgraded it to a warning, which is how a host could finish
# provisioning with a configuration nginx had already rejected.
mk_prov_nginx_apply() {
  local what="$1" output status

  # The status is captured BEFORE the output is piped anywhere. `nginx -t | sed`
  # reports sed's status unless `pipefail` happens to be set, and a gate whose
  # correctness depends on a shell option set in another file is a gate that
  # will go quietly green one day.
  output="$(nginx -t 2>&1)"
  status=$?
  printf '%s\n' "${output}" | sed 's/^/  /'

  if [ "${status}" -ne 0 ]; then
    log_error "Nginx rejected the configuration after ${what}. Not reloading."
    return 1
  fi
  systemctl reload nginx || systemctl start nginx
  log_info "Nginx reloaded after ${what}."
}

mk_prov_web_server_http() {
  local site_domain="$1" admin_domain="$2"
  log_step "8a. Web server, port 80 only."

  mk_prov_nginx_shared
  mk_prov_render_site mindkid-acme "${site_domain}" "${admin_domain}" || return 1
  mk_prov_enable_site mindkid-acme

  # The single-file layout this replaced; leaving it enabled would redeclare
  # every server block and the rate-limit zones.
  rm -f /etc/nginx/sites-enabled/mindkid.conf /etc/nginx/sites-available/mindkid.conf
  rm -f /etc/nginx/sites-enabled/default

  mk_prov_nginx_apply "the port 80 configuration" || return 1
}

# Step 9 — certificates. `certonly --webroot` writes a file under the path the
# port 80 server already serves and never edits nginx configuration, so it works
# against a configuration this script fully controls.
mk_prov_tls() {
  local site_domain="$1" admin_domain="$2" skip_tls="$3"
  log_step "9. TLS certificates."

  if [ "${skip_tls}" = true ]; then
    log_info "Skipping certificates on request."
    return 0
  fi

  local domain resolved
  for domain in "${site_domain}" "${admin_domain}"; do
    if [ -d "/etc/letsencrypt/live/${domain}" ]; then
      log_info "Certificate for ${domain} already present."
      continue
    fi

    resolved="$(getent hosts "${domain}" 2>/dev/null | awk '{print $1}' | head -1)"
    if [ -z "${resolved}" ]; then
      log_warn "${domain} does not resolve yet; skipping its certificate. Point DNS here, then run provision again."
      continue
    fi

    # --deploy-hook: a renewed certificate that nginx never reloads is an
    # expired certificate from the visitor's side.
    certbot certonly --webroot -w /var/www/html -n --agree-tos \
      -d "${domain}" -m "${MK_TLS_CONTACT_EMAIL:-admin@${site_domain}}" \
      --deploy-hook 'systemctl reload nginx' \
      || log_warn "Certificate request for ${domain} failed; the other steps still completed."
  done

  # BR-SRV-08: renewal must be automatic and observable.
  systemctl enable --now certbot.timer >/dev/null 2>&1 \
    || log_warn "Could not enable the certificate renewal timer."
}

# Step 8b — the TLS servers, one file per domain so a missing certificate takes
# down only its own name instead of the whole configuration.
mk_prov_web_server_tls() {
  local site_domain="$1" admin_domain="$2"
  log_step "8b. Web server, TLS servers for the domains that have a certificate."

  local name domain
  for name in mindkid-site mindkid-admin; do
    if [ "${name}" = mindkid-site ]; then
      domain="${site_domain}"
    else
      domain="${admin_domain}"
    fi

    if [ -d "/etc/letsencrypt/live/${domain}" ]; then
      mk_prov_render_site "${name}" "${site_domain}" "${admin_domain}" || return 1
      mk_prov_enable_site "${name}"
      log_info "${domain} serves over TLS."
    else
      mk_prov_disable_site "${name}"
      log_warn "${domain} has no certificate; its TLS server stays disabled and the name is dark over HTTPS."
    fi
  done

  mk_prov_nginx_apply "the TLS configuration" || return 1
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
  # The backup job shells out to these two; absent here means no backups at all.
  printf 'pg_dump    %s\n' "$(pg_dump --version 2>/dev/null || echo absent)"
  printf 'psql       %s\n' "$(psql --version 2>/dev/null || echo absent)"
  printf 'Swap       %s\n' "$(swapon --show=NAME,SIZE --noheadings 2>/dev/null | tr '\n' ' ' | sed 's/ *$//' || true)"

  # The two things this script will not do for you (spec §4, closing note).
  log_step "Manual steps that remain:"
  log_info "1. Point DNS for ${site_domain} at this machine's address."
  local app missing=0
  for app in "${MK_ENV_APPS[@]}"; do
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
  mk_prov_base_system || return 1
  mk_prov_layout
  mk_prov_firewall
  mk_prov_runtime || return 1
  mk_prov_datastores || return 1
  mk_prov_web_server_http "${site_domain}" "${admin_domain}" || return 1
  mk_prov_tls "${site_domain}" "${admin_domain}" "${skip_tls}"
  mk_prov_web_server_tls "${site_domain}" "${admin_domain}" || return 1
  mk_prov_logging || return 1
  mk_prov_report "${site_domain}"
}
