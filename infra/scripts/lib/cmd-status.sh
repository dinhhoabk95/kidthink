#!/usr/bin/env bash
# Verb: status — what is running and what could be rolled back to.
# release-rollback.md §3 requires the retained releases to be visible.

cmd_status() {
  local active
  active="$(current_release_path)"

  log_step "Deployment status"
  printf 'Root      %s\n' "${MK_ROOT}"
  printf 'Active    %s\n' "${active:-none}"

  if [ -n "${active}" ] && [ -f "${active}/RELEASE_COMMIT" ]; then
    printf 'Commit    %s\n' "$(cat "${active}/RELEASE_COMMIT")"
  fi

  printf '\nReleases kept (newest first, %s retained):\n' "${MK_KEEP_RELEASES}"
  local dir marker artifacts
  while IFS= read -r dir; do
    [ -n "${dir}" ] || continue
    marker="  "
    [ "${dir}" = "${active}" ] && marker="* "
    if release_has_artifacts "${dir}"; then
      artifacts="built"
    else
      artifacts="INCOMPLETE — cannot be rolled back to"
    fi
    printf '%s%-28s %s\n' "${marker}" "${dir##*/}" "${artifacts}"
  done <<<"$(list_releases)"

  printf '\nProcesses:\n'
  if command -v pm2 >/dev/null 2>&1; then
    pm2 list
  else
    printf '  supervisor not installed\n'
  fi

  printf '\nDatastores:\n'
  if command -v docker >/dev/null 2>&1; then
    docker ps --filter name=mindkid- --format '  {{.Names}}  {{.Status}}'
  else
    printf '  docker not installed\n'
  fi

  printf '\nHealth endpoint:\n'
  printf '  HTTP %s\n' "$(curl -s -o /dev/null -w '%{http_code}' "${MK_HEALTH_URL}" 2>/dev/null || echo unreachable)"
}
