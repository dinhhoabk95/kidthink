#!/usr/bin/env bash
# Layout on the server. Single source of truth for every path the deploy tooling touches.
# Spec: docs/specs/01-platform/server-provisioning.md §7.1
#
# shellcheck disable=SC2034
# This file only declares values; every consumer sources it, so shellcheck
# cannot see the uses from here.

# Root is overridable so the fake-binary test harness can drive the real code
# paths inside a temporary directory (never hardcode a path below this line).
MK_ROOT="${MK_ROOT:-/opt/mindkid}"
MK_RELEASES_DIR="${MK_ROOT}/releases"
MK_CURRENT_LINK="${MK_ROOT}/current"
MK_REPO_DIR="${MK_ROOT}/repo.git"
MK_SHARED_DIR="${MK_ROOT}/shared"
MK_BIN_DIR="${MK_ROOT}/bin"
MK_COMPOSE_DIR="${MK_ROOT}/compose"
MK_LOCK_DIR="${MK_ROOT}/.deploy.lock"

# Database dumps. Deliberately OUTSIDE MK_ROOT: a path under releases/ is
# deleted by retention (prune_old_releases) after five deploys, and a path under
# current/ moves every release. backup-and-restore.md §4 keeps dumps for months.
MK_BACKUP_DIR="${MK_BACKUP_DIR:-/var/lib/mindkid/backups}"

MK_ENV_DIR="${MK_ENV_DIR:-/etc/mindkid/env}"
MK_CONF_FILE="${MK_CONF_FILE:-/etc/mindkid/deploy.conf}"
MK_LOG_DIR="${MK_LOG_DIR:-/var/log/mindkid}"
MK_DEPLOY_LOG="${MK_LOG_DIR}/deploy.log"

MK_SYSTEM_USER="${MK_SYSTEM_USER:-mindkid}"
MK_KEEP_RELEASES="${MK_KEEP_RELEASES:-5}"
MK_BUILD_IMAGE="${MK_BUILD_IMAGE:-node:24-bookworm}"
# Loopback health of the web process. This is the liveness of one process, not
# of the service: see MK_PUBLIC_HEALTH_URL below.
MK_HEALTH_URL="${MK_HEALTH_URL:-http://127.0.0.1:3000/api/guest/health}"

# The URL a visitor actually reaches. Checking only the loopback port lets a
# release pass while nginx is rejecting requests, the certificate is missing, or
# the admin tree is unreadable — none of which the Node process can see.
# Empty means "not configured yet"; the smoke gate then checks loopback only and
# says so, rather than inventing a domain.
MK_PUBLIC_HEALTH_URL="${MK_PUBLIC_HEALTH_URL:-}"
MK_PUBLIC_ADMIN_URL="${MK_PUBLIC_ADMIN_URL:-}"

# release-deploy.md §7.2 — worker first, public surface last. Admin is not in
# this list and never was after BR-ARB-01 made it a static tree: it has no
# process to reload, it is swapped by the `current` symlink like any other file.
MK_RELOAD_ORDER=(worker web)
MK_APPS=(web worker)

# APP-RUNTIME-BOUNDARY §3: admin không có tiến trình, nhưng vẫn có env file —
# `NUXT_PUBLIC_API_BASE_URL` được nướng vào bundle tĩnh lúc **build**. Nó là
# public build config, không phải secret runtime, nên file này đi vào container
# build chứ không vào PM2.
MK_ENV_APPS=(web admin worker)
MK_BUILD_ENV_APPS=(admin)

# server-provisioning.md §7.3. MK_PORT_WORKER is a RESERVATION in the port
# table, not a listening socket: BR-JOB-04 forbids apps/worker from exposing
# HTTP, and it does not. Holding the number here keeps anything else from
# claiming it later and calling that an accident.
MK_PORT_WEB=3000
MK_PORT_WORKER=3099

# Required component versions (server-provisioning.md §7.2). Drift stops provisioning.
MK_NODE_MAJOR=24
MK_PNPM_MAJOR=11
MK_POSTGRES_MAJOR=17
MK_VALKEY_MAJOR=9
