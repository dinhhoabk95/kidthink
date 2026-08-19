#!/usr/bin/env bash
# Atomic release switch (BR-DEP-07): one rename, never a window with no target.

# GNU mv needs -T and BSD mv needs -h to replace a symlink that points at a
# directory instead of moving the new link INSIDE that directory. Picking the
# wrong one silently nests releases, so detect once.
mk_mv_symlink() {
  local src="$1" dst="$2"
  if mv --version >/dev/null 2>&1; then
    mv -Tf "${src}" "${dst}"
  else
    mv -hf "${src}" "${dst}"
  fi
}

switch_current_symlink() {
  local target_dir="$1"
  local current_link="${2:-${MK_CURRENT_LINK}}"
  local tmp_link="${current_link}.tmp.$$"

  if [ ! -d "${target_dir}" ]; then
    log_error "Target release directory '${target_dir}' does not exist; refusing to switch."
    return 1
  fi

  ln -sfn "${target_dir}" "${tmp_link}"
  mk_mv_symlink "${tmp_link}" "${current_link}"
}

# Empty when nothing is deployed yet; callers must treat that as "first release".
current_release_path() {
  local current_link="${1:-${MK_CURRENT_LINK}}"
  [ -L "${current_link}" ] || return 0
  readlink "${current_link}"
}
