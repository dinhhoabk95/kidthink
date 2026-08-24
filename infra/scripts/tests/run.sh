#!/usr/bin/env bash
# Release harness — the six mandatory negative cases of
# docs/tasks/90-vps-deploy-plan.md §6, plus the cases the review added.
#
# Nothing here touches a real server. The deploy root is a temporary directory,
# the supervisor, container runtime and HTTP client are the fake binaries in
# fakebin/, and git is real because the source of a release is a real commit.

set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${HARNESS_DIR}/../../.." && pwd)"
MINDKID_SH="${REPO_ROOT}/infra/scripts/mindkid.sh"

PASS=0
FAIL=0

pass() { printf '  ok    %s\n' "$1"; PASS=$((PASS + 1)); }
fail() { printf '  FAIL  %s\n' "$1"; FAIL=$((FAIL + 1)); }

assert_eq() {
  local expected="$1" actual="$2" what="$3"
  if [ "${expected}" = "${actual}" ]; then
    pass "${what}"
  else
    fail "${what} (expected '${expected}', got '${actual}')"
  fi
}

assert_contains() {
  local haystack="$1" needle="$2" what="$3"
  case "${haystack}" in
    *"${needle}"*) pass "${what}" ;;
    *) fail "${what} (missing '${needle}')" ;;
  esac
}

# --- fixture ----------------------------------------------------------------

# A real git repository holding the subset of the monorepo a release needs.
# The validator, the registry and the scripts under test are the real files.
make_source_repo() {
  local src="$1"
  mkdir -p "${src}"
  (
    cd "${src}" || exit 1
    git init -q .
    git config user.email harness@example.test
    git config user.name Harness

    mkdir -p scripts packages/config/src packages/config/scripts packages/db/scripts infra
    cp -R "${REPO_ROOT}/infra/scripts" infra/
    cp -R "${REPO_ROOT}/infra/pm2" infra/
    cp "${REPO_ROOT}/packages/config/scripts/validate-env-file.ts" packages/config/scripts/
    cp "${REPO_ROOT}/packages/config/src/env-contract.ts" packages/config/src/
    cp "${REPO_ROOT}/packages/config/src/env-file.ts" packages/config/src/
    echo "// migration entrypoint" >packages/db/scripts/migrate.ts
    echo '{"name":"@mindkid/monorepo","type":"module"}' >package.json

    git add -A
    git commit -qm "harness fixture"
  )
}

setup_env() {
  local root="$1"
  export MK_ROOT="${root}/opt"
  export MK_ENV_DIR="${root}/etc/env"
  export MK_LOG_DIR="${root}/var/log"
  export MK_CONF_FILE="${root}/etc/deploy.conf"
  export MK_FAKE_STATE="${root}/state"
  export MK_HEALTH_URL="http://127.0.0.1:3000/api/guest/health"
  export MK_BUILD_IMAGE="node:24-bookworm"
  export PATH="${HARNESS_DIR}/fakebin:${PATH}"

  mkdir -p "${MK_ROOT}" "${MK_ENV_DIR}" "${MK_LOG_DIR}" "${MK_FAKE_STATE}"

  local app
  for app in web admin worker; do
    node "${HARNESS_DIR}/make-env.ts" "${app}" >"${MK_ENV_DIR}/${app}.env"
  done
}

# Puts a first release in place so later cases have something to fall back to.
seed_first_release() {
  bash "${MINDKID_SH}" release --ref main >/dev/null 2>&1
}

WORKSPACE_ROOT=""

new_workspace() {
  WORKSPACE_ROOT="$(mktemp -d)"
  make_source_repo "${WORKSPACE_ROOT}/source"
  setup_env "${WORKSPACE_ROOT}"
  export MK_GIT_REMOTE="${WORKSPACE_ROOT}/source"
}

release_count() {
  find "${MK_ROOT}/releases" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' '
}

current_target() {
  readlink "${MK_ROOT}/current" 2>/dev/null || printf 'none'
}

add_commit() {
  local src="$1" message="$2"
  (
    cd "${src}" || exit 1
    echo "${message}" >>CHANGELOG
    git add -A
    git commit -qm "${message}"
  )
}

list_releases_in_root() {
  find "${MK_ROOT}/releases" -mindepth 1 -maxdepth 1 -type d | sort -r
}

# Retention normally runs at the end of a release, when the active release is by
# definition the newest one. Calling it on its own is the only way to observe
# the guard that protects an older active release.
run_prune_directly() {
  local keep="$1"
  local lib="${REPO_ROOT}/infra/scripts/lib"
  MK_KEEP_RELEASES="${keep}" bash -c "
    set -uo pipefail
    . '${lib}/paths.sh'
    . '${lib}/log.sh'
    . '${lib}/atomic.sh'
    . '${lib}/releases.sh'
    prune_old_releases
  "
}

# --- cases ------------------------------------------------------------------

case_1_smoke_failure_rolls_back() {
  printf 'Case 1 — smoke gate returns 503\n'
  new_workspace
  local root="${WORKSPACE_ROOT}"
  seed_first_release
  local first_release; first_release="$(current_target)"

  add_commit "${root}/source" "second"
  echo 503 >"${MK_FAKE_STATE}/http_status"

  local output status
  output="$(bash "${MINDKID_SH}" release --ref main 2>&1)"
  status=$?

  assert_eq "1" "${status}" "exit status is non-zero"
  assert_eq "${first_release}" "$(current_target)" "symlink points back at the previous release"
  assert_contains "${output}" "Smoke check failed" "log states the reason"
  assert_contains "${output}" "Rolling back" "log states the rollback"
  rm -rf "${root}"
}

case_2_missing_env_var_stops_before_build() {
  printf 'Case 2 — a required variable is missing\n'
  new_workspace
  local root="${WORKSPACE_ROOT}"
  seed_first_release
  local before_count; before_count="$(release_count)"
  local before_link; before_link="$(current_target)"

  add_commit "${root}/source" "second"
  # Remove one always-required variable from the file on the server.
  node "${HARNESS_DIR}/make-env.ts" web NUXT_SESSION_PASSWORD >"${MK_ENV_DIR}/web.env"

  local output status
  output="$(bash "${MINDKID_SH}" release --ref main 2>&1)"
  status=$?

  assert_eq "1" "${status}" "exit status is non-zero"
  assert_eq "${before_count}" "$(release_count)" "no new release directory was created"
  assert_eq "${before_link}" "$(current_target)" "the running release still serves"
  assert_contains "${output}" "NUXT_SESSION_PASSWORD" "the missing variable is named"
  assert_contains "${output}" "nothing was built" "the run stopped before the build"
  rm -rf "${root}"
}

case_3_parallel_release_is_refused() {
  printf 'Case 3 — two releases at once\n'
  new_workspace
  local root="${WORKSPACE_ROOT}"
  seed_first_release

  # Hold the lock the way a running release would.
  mkdir -p "${MK_ROOT}/.deploy.lock"
  printf '%s\n' "$$" >"${MK_ROOT}/.deploy.lock/pid"

  local output status
  output="$(bash "${MINDKID_SH}" release --ref main 2>&1)"
  status=$?

  assert_eq "1" "${status}" "second run exits non-zero"
  assert_contains "${output}" "in progress" "log says a run is already in progress"
  assert_contains "${output}" "Not queueing" "the second run does not wait"

  rm -rf "${MK_ROOT}/.deploy.lock"
  rm -rf "${root}"
}

case_4_interrupted_build_keeps_old_release() {
  printf 'Case 4 — the build is interrupted\n'
  new_workspace
  local root="${WORKSPACE_ROOT}"
  seed_first_release
  local before_link; before_link="$(current_target)"
  local before_count; before_count="$(release_count)"

  add_commit "${root}/source" "second"
  touch "${MK_FAKE_STATE}/build_fails"

  local output status
  output="$(bash "${MINDKID_SH}" release --ref main 2>&1)"
  status=$?

  assert_eq "1" "${status}" "exit status is non-zero"
  assert_eq "${before_link}" "$(current_target)" "symlink still points at the old release"
  assert_eq "${before_count}" "$(release_count)" "the half-built directory was removed"
  assert_contains "${output}" "live release is untouched" "log states the live release is safe"
  assert_eq "false" "$([ -d "${MK_ROOT}/.deploy.lock" ] && echo true || echo false)" "the lock was released"
  rm -rf "${root}"
}

case_5_same_commit_twice_succeeds() {
  printf 'Case 5 — the same commit released twice\n'
  new_workspace
  local root="${WORKSPACE_ROOT}"

  local first_status second_status
  bash "${MINDKID_SH}" release --ref main >/dev/null 2>&1
  first_status=$?
  local first_link; first_link="$(current_target)"

  bash "${MINDKID_SH}" release --ref main >/dev/null 2>&1
  second_status=$?
  local second_link; second_link="$(current_target)"

  assert_eq "0" "${first_status}" "first release succeeds"
  assert_eq "0" "${second_status}" "second release succeeds"
  assert_eq "2" "$(release_count)" "two distinct release directories exist"
  assert_eq "true" "$([ "${first_link}" != "${second_link}" ] && echo true || echo false)" \
    "the second release did not overwrite the first"
  assert_eq "true" "$([ -d "${first_link}" ] && echo true || echo false)" \
    "the previously serving directory still exists"
  rm -rf "${root}"
}

case_6_dry_run_changes_nothing() {
  printf 'Case 6 — dry run\n'
  new_workspace
  local root="${WORKSPACE_ROOT}"
  seed_first_release
  local before_link; before_link="$(current_target)"
  local before_count; before_count="$(release_count)"

  add_commit "${root}/source" "second"

  local output status
  output="$(bash "${MINDKID_SH}" release --ref main --dry-run 2>&1)"
  status=$?

  assert_eq "0" "${status}" "dry run exits zero"
  assert_eq "${before_link}" "$(current_target)" "symlink unchanged"
  assert_eq "${before_count}" "$(release_count)" "release count unchanged"
  assert_contains "${output}" "Nothing above was executed" "log says nothing ran"
  rm -rf "${root}"
}

case_7_unknown_ref_creates_nothing() {
  printf 'Case 7 — the ref is not on the remote\n'
  new_workspace
  local root="${WORKSPACE_ROOT}"
  seed_first_release
  local before_count; before_count="$(release_count)"

  local output status
  output="$(bash "${MINDKID_SH}" release --ref never-pushed-branch 2>&1)"
  status=$?

  assert_eq "1" "${status}" "exit status is non-zero"
  assert_eq "${before_count}" "$(release_count)" "no release directory was created"
  assert_contains "${output}" "Push the branch or tag first" "log explains what to do"
  rm -rf "${root}"
}

case_8_rollback_returns_to_previous() {
  printf 'Case 8 — rollback\n'
  new_workspace
  local root="${WORKSPACE_ROOT}"
  bash "${MINDKID_SH}" release --ref main >/dev/null 2>&1
  local first_link; first_link="$(current_target)"

  add_commit "${root}/source" "second"
  bash "${MINDKID_SH}" release --ref main >/dev/null 2>&1
  local second_link; second_link="$(current_target)"

  local migrations_before
  migrations_before="$(wc -l <"${MK_FAKE_STATE}/migrations.applied" | tr -d ' ')"

  local output status
  output="$(bash "${MINDKID_SH}" rollback 2>&1)"
  status=$?

  assert_eq "0" "${status}" "rollback exits zero"
  assert_eq "${first_link}" "$(current_target)" "the previous release is active again"
  assert_contains "${output}" "${first_link##*/}" "log names the target release"
  assert_contains "${output}" "${second_link##*/}" "log names the source release"
  assert_eq "${migrations_before}" "$(wc -l <"${MK_FAKE_STATE}/migrations.applied" | tr -d ' ')" \
    "rollback ran no migration (BR-RBK-09)"
  rm -rf "${root}"
}

case_9_reload_order_is_contractual() {
  printf 'Case 9 — reload order\n'
  new_workspace
  local root="${WORKSPACE_ROOT}"
  bash "${MINDKID_SH}" release --ref main >/dev/null 2>&1

  local order
  order="$(tr '\n' ' ' <"${MK_FAKE_STATE}/pm2.reload-order" | sed 's/ $//')"
  assert_eq "mindkid-worker mindkid-web" "${order}" \
    "worker, then web (release-deploy.md §7.2)"
  rm -rf "${root}"
}

case_10_prune_keeps_the_active_release() {
  printf 'Case 10 — retention never removes what is serving\n'
  new_workspace
  local root="${WORKSPACE_ROOT}"

  local i
  for i in 1 2 3; do
    add_commit "${root}/source" "commit ${i}"
    bash "${MINDKID_SH}" release --ref main >/dev/null 2>&1
  done

  # A rollback leaves an older release active. Retention must then keep a
  # directory that is outside the newest-N window purely because it is serving.
  bash "${MINDKID_SH}" rollback >/dev/null 2>&1
  local active oldest
  active="$(current_target)"
  oldest="$(list_releases_in_root | tail -1)"

  local output
  # Retention of one: r3 is inside the window, r2 is outside it but active,
  # r1 is outside it and idle.
  output="$(run_prune_directly 1 2>&1)"

  assert_eq "true" "$([ -d "${active}" ] && echo true || echo false)" \
    "the active release survived retention"
  assert_eq "false" "$([ -d "${oldest}" ] && echo true || echo false)" \
    "the oldest non-active release was removed"
  assert_contains "${output}" "it is the active release" "log explains the exception"
  unset MK_KEEP_RELEASES
  rm -rf "${root}"
}

case_11_no_secret_value_reaches_the_log() {
  printf 'Case 11 — secrets never appear in the log\n'
  new_workspace
  local root="${WORKSPACE_ROOT}"

  local output
  output="$(bash "${MINDKID_SH}" release --ref main 2>&1)"

  # The generated fixtures use one recognisable secret value for every secret.
  assert_eq "0" "$(printf '%s' "${output}" | grep -c 'harness-secret-value')" \
    "no secret value in the release output"
  assert_eq "0" "$(grep -c 'harness-secret-value' "${MK_LOG_DIR}/deploy.log" 2>/dev/null; true)" \
    "no secret value in the deploy log"
  rm -rf "${root}"
}

case_12_missing_artifacts_block_rollback() {
  printf 'Case 12 — rollback target has no build\n'
  new_workspace
  local root="${WORKSPACE_ROOT}"
  bash "${MINDKID_SH}" release --ref main >/dev/null 2>&1
  local first_link; first_link="$(current_target)"

  add_commit "${root}/source" "second"
  bash "${MINDKID_SH}" release --ref main >/dev/null 2>&1
  local second_link; second_link="$(current_target)"

  # Simulate a release whose build output was lost.
  rm -rf "${first_link}/apps/web/.output"

  local output status
  output="$(bash "${MINDKID_SH}" rollback 2>&1)"
  status=$?

  assert_eq "1" "${status}" "rollback refuses"
  assert_eq "${second_link}" "$(current_target)" "the symlink did not move"
  assert_contains "${output}" "no built output" "log states why"
  rm -rf "${root}"
}

case_13_missing_admin_build_var_stops_before_build() {
  printf 'Case 13 — the admin static build has no API origin\n'
  new_workspace
  local root="${WORKSPACE_ROOT}"
  seed_first_release
  local before_count; before_count="$(release_count)"
  local before_link; before_link="$(current_target)"

  add_commit "${root}/source" "second"
  # APP-RUNTIME-BOUNDARY BR-ARB-04: admin has no runtime process, so a missing
  # NUXT_PUBLIC_API_BASE_URL can only be caught here — after the build it is
  # baked (or missing) in a static bundle nobody can reconfigure.
  node "${HARNESS_DIR}/make-env.ts" admin NUXT_PUBLIC_API_BASE_URL >"${MK_ENV_DIR}/admin.env"

  local output status
  output="$(bash "${MINDKID_SH}" release --ref main 2>&1)"
  status=$?

  assert_eq "1" "${status}" "exit status is non-zero"
  assert_eq "${before_count}" "$(release_count)" "no new release directory was created"
  assert_eq "${before_link}" "$(current_target)" "the running release still serves"
  assert_contains "${output}" "NUXT_PUBLIC_API_BASE_URL" "the missing variable is named"
  assert_contains "${output}" "nothing was built" "the run stopped before the build"
  rm -rf "${root}"
}

# --- driver -----------------------------------------------------------------

main() {
  if ! command -v node >/dev/null 2>&1; then
    printf 'node is required to run this harness.\n' >&2
    exit 1
  fi

  printf 'Release harness — deploy root is a temporary directory, no real host is touched.\n\n'

  case_1_smoke_failure_rolls_back
  case_2_missing_env_var_stops_before_build
  case_3_parallel_release_is_refused
  case_4_interrupted_build_keeps_old_release
  case_5_same_commit_twice_succeeds
  case_6_dry_run_changes_nothing
  case_7_unknown_ref_creates_nothing
  case_8_rollback_returns_to_previous
  case_9_reload_order_is_contractual
  case_10_prune_keeps_the_active_release
  case_11_no_secret_value_reaches_the_log
  case_12_missing_artifacts_block_rollback
  case_13_missing_admin_build_var_stops_before_build

  printf '\n%s passed, %s failed\n' "${PASS}" "${FAIL}"
  [ "${FAIL}" -eq 0 ]
}

main "$@"
