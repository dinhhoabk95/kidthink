#!/usr/bin/env bash
# Verb: release — the ten steps of release-deploy.md §4.
#
# Every step either completes or stops the whole run. No step is skipped to keep
# going: a half-applied release is the state this whole design exists to prevent.

cmd_release_usage() {
  cat <<'USAGE'
Usage: mindkid.sh release --ref <branch|tag|sha> [--dry-run]

  --ref       Ref to deploy. Must already exist in the mirror on this server.
  --dry-run   Print the plan and change nothing (BR-DEP-14).
USAGE
}

# shellcheck disable=SC2317
mk_release_abort() {
  local reason="$1"
  log_error "${reason}"
  notify critical "Release failed: ${reason}"
  return 1
}

mk_release_plan() {
  local commit="$1"
  log_info "[plan] Resolve ref to ${commit}"
  log_info "[plan] Lay out ${MK_RELEASES_DIR}/<timestamp>-${commit:0:7}"
  log_info "[plan] Validate ${MK_ENV_DIR}/{web,admin,worker}.env against THAT tree's registry"
  log_info "[plan] Install and build in ${MK_BUILD_IMAGE}"
  log_info "[plan] Run expand-only migrations"
  log_info "[plan] Hand the tree to ${MK_SYSTEM_USER}"
  log_info "[plan] Switch ${MK_CURRENT_LINK} and reload ${MK_RELOAD_ORDER[*]}"
  log_info "[plan] Smoke check ${MK_HEALTH_URL}${MK_PUBLIC_HEALTH_URL:+ and ${MK_PUBLIC_HEALTH_URL}}, roll back on failure"
  log_info "[plan] Keep the newest ${MK_KEEP_RELEASES} releases"
  log_info "[plan] Nothing above was executed."
}

# Restores the previously active release and reloads it. Used when the new
# release starts but fails its smoke gate (BR-DEP-08).
mk_release_rollback_to() {
  local previous="$1"

  if [ -z "${previous}" ] || [ ! -d "${previous}" ]; then
    log_error "No previous release to fall back to; the failed release stays linked for inspection."
    return 1
  fi

  log_warn "Rolling back to ${previous##*/}."
  switch_current_symlink "${previous}"
  reload_apps || log_error "Reload after rollback reported an error."

  # BR-RBK-06: a rollback is a release switch too, so it gets the same gate.
  if run_release_smoke 10 3; then
    log_warn "Rollback complete; ${previous##*/} is serving again."
    notify critical "Release failed smoke check; rolled back to ${previous##*/}."
  else
    log_error "Smoke check still failing after rollback. The cause is not the new code."
    notify critical "Release failed AND rollback did not restore health. Manual intervention required."
  fi
}

cmd_release() {
  local ref="" dry_run=false

  while [ $# -gt 0 ]; do
    case "$1" in
      --ref) ref="${2:-}"; shift 2 ;;
      --dry-run) dry_run=true; shift ;;
      --help|-h) cmd_release_usage; return 0 ;;
      *) log_error "Unknown argument: $1"; cmd_release_usage; return 2 ;;
    esac
  done

  if [ -z "${ref}" ]; then
    log_error "--ref is required."
    cmd_release_usage
    return 2
  fi

  # Step 1 — lock (BR-DEP-09). Taken before anything is read so a second run
  # cannot even reach the mirror.
  acquire_lock || return 1
  trap release_lock EXIT INT TERM

  log_step "Release requested for ref '${ref}'."

  # Step 2 — resolve the ref. Nothing has been created yet, so an unknown ref
  # leaves the machine untouched.
  local remote_url="${MK_GIT_REMOTE:-}"
  if [ -n "${remote_url}" ]; then
    ensure_repo_mirror "${remote_url}" || return 1
  elif [ -d "${MK_REPO_DIR}" ]; then
    git -C "${MK_REPO_DIR}" fetch --prune --tags origin || return 1
  else
    log_error "No repository mirror at ${MK_REPO_DIR}. Run 'mindkid.sh init --remote <url>' first."
    return 1
  fi

  local commit
  commit="$(resolve_commit "${ref}")" || return 1
  log_info "Ref '${ref}' resolves to ${commit}."

  if [ "${dry_run}" = true ]; then
    mk_release_plan "${commit}"
    return 0
  fi

  # Step 3 — lay out the release.
  local release_name release_dir previous_release
  release_name="$(release_dir_name "${commit}")"
  release_dir="${MK_RELEASES_DIR}/${release_name}"
  previous_release="$(current_release_path)"

  log_step "Laying out release ${release_name}."
  mkdir -p "${MK_RELEASES_DIR}"
  export_commit_tree "${commit}" "${release_dir}" || {
    rm -rf "${release_dir}"
    mk_release_abort "Could not export commit ${commit}."
    return 1
  }

  # Step 4 — environment gate, against the tree that is about to run
  # (BR-DEP-04, BR-ENV-07).
  #
  # The validator has to come from the NEW tree, not from the live release: a
  # commit that starts reading a new required variable ships the registry entry
  # for it in the same commit. Validating with the old release's registry passes
  # that commit and lets it fail at runtime instead — which is the exact outcome
  # BR-DEP-04 exists to prevent. Exporting the tree first is cheap; it is a tar
  # extract, and nothing has been installed or built yet.
  log_step "Validating environment files."
  validate_env_files "${release_dir}" || {
    rm -rf "${release_dir}"
    mk_release_abort "Environment files do not satisfy the contract; nothing was built."
    return 1
  }

  printf '%s\n' "${commit}" >"${release_dir}/RELEASE_COMMIT"

  # Steps 5 and 6 — install and build, in the container.
  log_step "Installing dependencies and building."
  build_release "${release_dir}" || {
    rm -rf "${release_dir}"
    mk_release_abort "Build failed for ${release_name}; the live release is untouched."
    return 1
  }

  # The build container runs as root, so everything it wrote — node_modules,
  # .output, dist — belongs to root. The applications run as the unprivileged
  # system user (BR-SRV-02), so any runtime path that writes fails with EACCES
  # until ownership is handed over.
  log_step "Handing the release to ${MK_SYSTEM_USER}."
  chown -R "${MK_SYSTEM_USER}:${MK_SYSTEM_USER}" "${release_dir}" || {
    mk_release_abort "Could not hand ${release_name} to ${MK_SYSTEM_USER}; refusing to switch to a tree the applications cannot use."
    return 1
  }

  # Step 7 — migrations, before the switch.
  log_step "Running database migrations."
  run_migrations "${release_dir}" || {
    mk_release_abort "Migration failed for ${release_name}. The previous release is still serving; the schema may be partially applied."
    return 1
  }

  # Step 8 — atomic switch, then reload in contract order.
  log_step "Switching to ${release_name}."
  switch_current_symlink "${release_dir}" || {
    mk_release_abort "Could not switch the current symlink."
    return 1
  }
  reload_apps || {
    mk_release_rollback_to "${previous_release}"
    return 1
  }

  # Step 9 — smoke gate.
  log_step "Smoke checking ${release_name}."
  if ! run_release_smoke 10 3; then
    mk_release_rollback_to "${previous_release}"
    return 1
  fi

  # Step 10 — retention.
  log_step "Pruning old releases."
  prune_old_releases

  log_step "Release ${release_name} (${commit}) is live."
  return 0
}
