#!/usr/bin/env bash
# Verb: rollback — release-rollback.md §4.
#
# No build and no migration: that is why this takes seconds. Rolling the schema
# back would lose data written by the newer code (BR-RBK-01, BR-RBK-09).

cmd_rollback_usage() {
  cat <<'USAGE'
Usage: mindkid.sh rollback [--to <release name>] [--dry-run]

  --to        A release directory name kept on this machine. Default: the one
              immediately before the active release.
  --dry-run   Print the target and change nothing.
USAGE
}

mk_rollback_pick_target() {
  local active="$1"
  local dir
  local seen_active=false

  # list_releases is newest first; the target is the entry after the active one,
  # which is not necessarily the second entry after an earlier rollback.
  while IFS= read -r dir; do
    [ -n "${dir}" ] || continue
    if [ "${dir}" = "${active}" ]; then
      seen_active=true
      continue
    fi
    if [ "${seen_active}" = true ]; then
      printf '%s\n' "${dir}"
      return 0
    fi
  done <<<"$(list_releases)"

  return 1
}

cmd_rollback() {
  local target_name="" dry_run=false

  while [ $# -gt 0 ]; do
    case "$1" in
      --to) target_name="${2:-}"; shift 2 ;;
      --dry-run) dry_run=true; shift ;;
      --help|-h) cmd_rollback_usage; return 0 ;;
      *) log_error "Unknown argument: $1"; cmd_rollback_usage; return 2 ;;
    esac
  done

  # Step 1 — the same lock as release (BR-RBK-05): two processes moving one
  # symlink has no defined outcome.
  acquire_lock || return 1
  trap release_lock EXIT INT TERM

  local active
  active="$(current_release_path)"
  if [ -z "${active}" ]; then
    log_error "Nothing is deployed yet; there is no release to roll back from."
    return 1
  fi
  log_info "Active release: ${active##*/}"

  # Step 2 — choose the target.
  local target
  if [ -n "${target_name}" ]; then
    target="${MK_RELEASES_DIR}/${target_name}"
    if [ ! -d "${target}" ]; then
      log_error "Release '${target_name}' is not on this machine. Retention keeps ${MK_KEEP_RELEASES}; deploy that commit again to get it back."
      return 1
    fi
  else
    if ! target="$(mk_rollback_pick_target "${active}")"; then
      log_error "Only one release is present; there is nothing to roll back to."
      return 1
    fi
  fi

  # Step 3 — the target must be able to serve without a build (BR-RBK-04).
  if ! release_has_artifacts "${target}"; then
    log_error "Release ${target##*/} has no built output; refusing to switch to a tree that cannot serve."
    return 1
  fi

  if [ "${dry_run}" = true ]; then
    log_info "[plan] Would switch ${active##*/} -> ${target##*/} and reload ${MK_RELOAD_ORDER[*]}"
    return 0
  fi

  # Steps 4 and 5 — switch and reload in the same order a release uses.
  log_step "Rolling back ${active##*/} -> ${target##*/}."
  switch_current_symlink "${target}" || return 1
  reload_apps || log_error "Reload reported an error; continuing to the smoke gate."

  # Step 6 — a rollback is a release switch, so it is verified too (BR-RBK-06).
  if ! run_release_smoke 10 3; then
    log_error "Smoke check failed after rolling back to ${target##*/}."
    log_error "The fault is not in the release: look at the database, the cache, or the network."
    notify critical "Rollback to ${target##*/} did not restore health. Manual intervention required."
    return 1
  fi

  # Step 7 — a silent rollback means nobody investigates the cause (BR-RBK-07).
  log_step "Rollback complete: ${active##*/} -> ${target##*/} by ${MK_OPERATOR:-$(id -un)}."
  notify warning "Rolled back from ${active##*/} to ${target##*/}."
  return 0
}
