#!/usr/bin/env bash
# Atomic symlink switch helper (BR-DEP-07: atomic transition)

switch_current_symlink() {
  local target_dir="$1"
  local current_link="/srv/mindkid/current"
  local tmp_link="/srv/mindkid/current.tmp.$$"

  if [ ! -d "${target_dir}" ]; then
    echo "[ERROR] Target release directory '${target_dir}' does not exist." >&2
    return 1
  fi

  ln -sfn "${target_dir}" "${tmp_link}"
  mv -Tf "${tmp_link}" "${current_link}" 2>/dev/null || mv -f "${tmp_link}" "${current_link}"
}
