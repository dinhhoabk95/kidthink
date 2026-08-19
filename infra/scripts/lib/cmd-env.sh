#!/usr/bin/env bash
# Verb: env — report on the three env files without ever printing a value.
# BR-ENV-08: names and verdicts only. BR-ENV-12: this verb never writes a file.

cmd_env() {
  log_step "Environment files in ${MK_ENV_DIR}"

  if [ ! -d "${MK_ENV_DIR}" ]; then
    log_error "${MK_ENV_DIR} does not exist."
    return 1
  fi

  local app file mode owner
  for app in "${MK_APPS[@]}"; do
    file="${MK_ENV_DIR}/${app}.env"
    if [ ! -f "${file}" ]; then
      printf '%-12s MISSING\n' "${app}.env"
      continue
    fi
    mode="$(stat -c '%a' "${file}" 2>/dev/null || stat -f '%Lp' "${file}")"
    owner="$(stat -c '%U:%G' "${file}" 2>/dev/null || stat -f '%Su:%Sg' "${file}")"
    printf '%-12s mode %-5s owner %-12s %s variables\n' \
      "${app}.env" "${mode}" "${owner}" "$(grep -cE '^[A-Za-z_][A-Za-z0-9_]*=' "${file}")"
    # BR-ENV-05 wants 0600 root:root; anything else is reportable, not fixable
    # from here, because this verb must never write in the env directory.
    if [ "${mode}" != "600" ] || [ "${owner}" != "root:root" ]; then
      log_warn "${file} should be 0600 root:root (BR-ENV-05)."
    fi
  done

  printf '\n'
  validate_env_files "${MK_CURRENT_LINK}"
}
