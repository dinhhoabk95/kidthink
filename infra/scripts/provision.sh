#!/usr/bin/env bash
# MindKid VPS Host Provisioning Script (Idempotent)
# Spec: docs/specs/01-platform/server-provisioning.md
# Rules: BR-SRV-01..10

set -euo pipefail

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

log "=== Starting MindKid Host Provisioning ==="

# 1. Verify root execution
if [ "$(id -u)" -ne 0 ]; then
  echo "Error: This script must be run as root (or via sudo)." >&2
  exit 1
fi

# 2. System user creation (BR-SRV-02: system user without login shell)
if ! id "mindkid" &>/dev/null; then
  log "Creating 'mindkid' system user..."
  useradd --system --shell /usr/sbin/nologin --home-dir /srv/mindkid --create-home mindkid
else
  log "'mindkid' user already exists."
fi

# 3. Create required directory tree
log "Creating application directory tree..."
mkdir -p /srv/mindkid/{releases,shared,repo}
mkdir -p /var/log/mindkid/{web,admin,worker}
mkdir -p /etc/mindkid/env

# Set permissions
chown -R mindkid:mindkid /srv/mindkid
chown -R mindkid:mindkid /var/log/mindkid
chmod -R 0755 /var/log/mindkid

# Env directory: 0700 root:root (BR-ENV-05)
chmod 0700 /etc/mindkid/env
chown root:root /etc/mindkid/env

# 4. Install essential packages if apt is available
if command -v apt-get &>/dev/null; then
  log "Updating apt packages..."
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq \
    curl \
    git \
    ufw \
    nginx \
    logrotate \
    ca-certificates \
    gnupg \
    lsb-release
fi

# 5. Node.js 24 and pnpm 11 check / install
if ! command -v node &>/dev/null || [[ "$(node -v)" != v24* ]]; then
  log "Installing Node.js 24..."
  if command -v apt-get &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt-get install -y -qq nodejs
  fi
fi

if ! command -v pnpm &>/dev/null; then
  log "Installing pnpm 11..."
  corepack enable || npm install -g pnpm@11
fi

if ! command -v pm2 &>/dev/null; then
  log "Installing PM2 process supervisor..."
  npm install -g pm2
fi

# 6. Configure UFW Firewall (BR-SRV-03: allow 22, 80, 443 only)
if command -v ufw &>/dev/null; then
  log "Configuring firewall (UFW)..."
  ufw --force reset >/dev/null 2>&1 || true
  ufw default deny incoming >/dev/null 2>&1 || true
  ufw default allow outgoing >/dev/null 2>&1 || true
  ufw allow 22/tcp >/dev/null 2>&1 || true
  ufw allow 80/tcp >/dev/null 2>&1 || true
  ufw allow 443/tcp >/dev/null 2>&1 || true
  ufw --force enable >/dev/null 2>&1 || true
fi

# 7. Install PM2 Logrotate & App Config
log "Setting up logrotate configuration..."
if [ -f "/srv/mindkid/current/infra/pm2/logrotate.conf" ]; then
  cp -f "/srv/mindkid/current/infra/pm2/logrotate.conf" /etc/logrotate.d/mindkid
fi

# 8. Version Report (BR-SRV-10)
log "=== MindKid Provisioning Complete. Host Software Versions: ==="
echo "Node.js:  $(node -v 2>/dev/null || echo 'N/A')"
echo "pnpm:     $(pnpm -v 2>/dev/null || echo 'N/A')"
echo "PM2:      $(pm2 -v 2>/dev/null || echo 'N/A')"
echo "Nginx:    $(nginx -v 2>&1 || echo 'N/A')"
if command -v docker &>/dev/null; then
  echo "Docker:   $(docker --version 2>/dev/null || echo 'N/A')"
fi
echo "================================================================"
