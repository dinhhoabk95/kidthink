#!/usr/bin/env bash
# Environment gate (BR-DEP-04, BR-ENV-07): runs BEFORE any dependency install
# or build, so a missing variable costs nothing but the check itself.
#
# The real work is the TypeScript validator in packages/config, which is the
# same code the unit tests cover. This function only locates files and reports;
# it never re-implements the rules and never writes an env file (BR-ENV-12).

validate_env_files() {
  local release_dir="$1"
  local validator="${release_dir}/scripts/validate-env-file.ts"

  if [ ! -d "${MK_ENV_DIR}" ]; then
    log_error "Environment directory '${MK_ENV_DIR}' does not exist. Write the three files described in env-contract.md §7.3 first."
    return 1
  fi
  if [ ! -f "${validator}" ]; then
    log_error "Validator '${validator}' missing from the release; cannot verify environment."
    return 1
  fi
  if ! command -v node >/dev/null 2>&1; then
    log_error "node not found on PATH; cannot verify environment."
    return 1
  fi

  local app env_file failed=0
  for app in "${MK_APPS[@]}"; do
    env_file="${MK_ENV_DIR}/${app}.env"

    if [ ! -f "${env_file}" ]; then
      log_error "Required env file '${env_file}' does not exist."
      failed=1
      continue
    fi

    # Output is variable names and reasons only, never values (BR-ENV-08).
    if node "${validator}" --app "${app}" --file "${env_file}" --production; then
      log_info "Environment file for ${app} satisfies the contract."
    else
      log_error "Environment file for ${app} violates the contract (see the lines above)."
      failed=1
    fi
  done

  return "${failed}"
}
