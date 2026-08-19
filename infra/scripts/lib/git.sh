#!/usr/bin/env bash
# Source of the code that reaches the server (BR-DEP-01).
#
# The only channel is a commit that exists in the mirror on the server. There is
# no rsync and no scp anywhere in this tooling, so an uncommitted file, a macOS
# node_modules or a dev database has no means of travelling.

ensure_repo_mirror() {
  local remote_url="$1"

  if [ -d "${MK_REPO_DIR}" ]; then
    log_info "Updating repository mirror at ${MK_REPO_DIR}."
    git -C "${MK_REPO_DIR}" remote set-url origin "${remote_url}"
    git -C "${MK_REPO_DIR}" fetch --prune --tags origin
    return 0
  fi

  log_info "Creating repository mirror at ${MK_REPO_DIR}."
  git clone --mirror "${remote_url}" "${MK_REPO_DIR}"
}

# Turns a branch, tag or short hash into a full commit id, or fails. Step 2 of
# release-deploy.md §4: an unknown ref must stop here, before any directory is
# created.
resolve_commit() {
  local ref="$1"
  local resolved

  if ! resolved="$(git -C "${MK_REPO_DIR}" rev-parse --verify "${ref}^{commit}" 2>/dev/null)"; then
    log_error "Ref '${ref}' does not exist in the mirror at ${MK_REPO_DIR}."
    log_error "Push the branch or tag first, then run the release again."
    return 1
  fi

  printf '%s\n' "${resolved}"
}

# Extracts the tree of one commit into a directory. `git archive` writes only
# tracked content of that commit: no .git, no working-tree leftovers.
export_commit_tree() {
  local commit="$1"
  local dest_dir="$2"

  mkdir -p "${dest_dir}"
  git -C "${MK_REPO_DIR}" archive --format=tar "${commit}" | tar -x -C "${dest_dir}"
}
