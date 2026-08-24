#!/usr/bin/env bash
# Release directory naming and retention (release-deploy.md §7.1, BR-RBK-04).

# `<UTC timestamp>-<7 char sha>`: the timestamp is what makes deploying the same
# commit twice produce two directories, so a repeat release can never delete the
# tree it is currently serving.
release_dir_name() {
  local commit="$1"
  printf '%s-%s\n' "$(date -u '+%Y%m%dT%H%M%SZ')" "${commit:0:7}"
}

# Newest first, by directory name — which sorts chronologically by construction,
# so retention never depends on mtime (a rollback rewrites no timestamps).
list_releases() {
  [ -d "${MK_RELEASES_DIR}" ] || return 0
  find "${MK_RELEASES_DIR}" -mindepth 1 -maxdepth 1 -type d -print \
    | sort -r
}

# A directory only counts as a release once it holds built output for all three
# applications; rollback refuses anything else (release-rollback.md §4 step 3).
# BR-ARB-01, BR-ARB-03: admin phải là cây file tĩnh. Một `.output/server` ở đó
# nghĩa là build đã rơi về preset Nitro — chấp nhận nó là chấp nhận một tiến
# trình Node đứng sau `admin.{domain}`, đúng thứ topology này bỏ đi.
release_has_artifacts() {
  local dir="$1"
  [ -d "${dir}/apps/web/.output" ] \
    && [ -d "${dir}/apps/admin/.output/public" ] \
    && [ ! -d "${dir}/apps/admin/.output/server" ] \
    && [ -f "${dir}/apps/worker/dist/index.js" ]
}

prune_old_releases() {
  local keep="${MK_KEEP_RELEASES}"
  local active
  active="$(current_release_path)"

  local index=0
  local dir
  while IFS= read -r dir; do
    [ -n "${dir}" ] || continue
    index=$((index + 1))

    [ "${index}" -le "${keep}" ] && continue

    # Never remove the tree being served, however old it sorts: after a rollback
    # the active release is deliberately not the newest one.
    if [ "${dir}" = "${active}" ]; then
      log_warn "Keeping ${dir##*/} beyond the retention window: it is the active release."
      continue
    fi

    log_info "Removing old release ${dir##*/}."
    rm -rf "${dir}"
  done <<<"$(list_releases)"
}
