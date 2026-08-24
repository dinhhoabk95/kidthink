#!/usr/bin/env bash
# Dependency install and build (BR-DEP-05, BR-SRV-11).
#
# Both happen inside the node:24-bookworm container, never on the host:
#   - the workstation is macOS ARM and the server is Linux x86, and the image
#     libraries ship platform-specific binaries;
#   - keeping the toolchain in the container is what lets the host stay free of
#     compilers in the application's run path.

build_release() {
  local release_dir="$1"

  if ! command -v docker >/dev/null 2>&1; then
    log_error "docker not found; BR-DEP-05 requires the build to run in ${MK_BUILD_IMAGE}."
    return 1
  fi

  # A pnpm store shared across releases: the store outlives one release, so it
  # belongs in shared/, and it turns a cold install into a linking step.
  mkdir -p "${MK_SHARED_DIR}/pnpm-store"

  log_info "Installing dependencies in ${MK_BUILD_IMAGE}."
  docker run --rm \
    -v "${release_dir}:/workspace" \
    -v "${MK_SHARED_DIR}/pnpm-store:/pnpm-store" \
    -w /workspace \
    -e CI=true \
    "${MK_BUILD_IMAGE}" \
    bash -c "corepack enable && pnpm config set store-dir /pnpm-store --location project && pnpm install --frozen-lockfile" \
    || return 1

  # APP-RUNTIME-BOUNDARY §4.1: admin là SPA tĩnh, nên `NUXT_PUBLIC_API_BASE_URL`
  # phải có mặt lúc **build** — sau bước này không còn tiến trình nào đọc được
  # env cho admin nữa. Thiếu nó, bundle ra `apiBaseUrl: undefined` và mọi request
  # của admin ném lỗi ở runtime, nên đây là điều kiện dừng chứ không phải cảnh báo.
  local build_env_args=()
  local build_app build_env_file
  for build_app in "${MK_BUILD_ENV_APPS[@]}"; do
    build_env_file="${MK_ENV_DIR}/${build_app}.env"
    if [ ! -f "${build_env_file}" ]; then
      log_error "Build env file '${build_env_file}' is missing; ${build_app} would be built without its public configuration."
      return 1
    fi
    build_env_args+=(--env-file "${build_env_file}")
  done

  log_info "Building applications in ${MK_BUILD_IMAGE}."
  docker run --rm \
    -v "${release_dir}:/workspace" \
    -v "${MK_SHARED_DIR}/pnpm-store:/pnpm-store" \
    -w /workspace \
    -e CI=true \
    -e NODE_ENV=production \
    "${build_env_args[@]}" \
    "${MK_BUILD_IMAGE}" \
    bash -c "corepack enable && pnpm build" \
    || return 1

  if ! release_has_artifacts "${release_dir}"; then
    log_error "Build finished but the release is missing built output for one or more applications."
    return 1
  fi
}

run_migrations() {
  local release_dir="$1"

  if [ ! -f "${release_dir}/packages/db/scripts/migrate.ts" ]; then
    log_error "Migration entrypoint missing from the release; refusing to switch."
    return 1
  fi

  # Migrations run before the switch (BR-DEP-06) and are expand-only, enforced
  # by the lint:migration-expand gate at review time (BR-RBK-02).
  log_info "Applying database migrations."
  docker run --rm \
    --network host \
    -v "${release_dir}:/workspace" \
    -v "${MK_SHARED_DIR}/pnpm-store:/pnpm-store" \
    -w /workspace \
    --env-file "${MK_ENV_DIR}/worker.env" \
    "${MK_BUILD_IMAGE}" \
    bash -c "corepack enable && pnpm db:migrate"
}
