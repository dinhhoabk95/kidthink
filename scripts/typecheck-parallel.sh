#!/usr/bin/env bash
# Typecheck song song: tsc root + vue-tsc cho từng app.
# Fail-fast: dừng ngay khi bất kỳ process nào lỗi.
#
# Trước script này, `pnpm typecheck` chạy tuần tự:
#   tsc --noEmit && pnpm --recursive --filter "./apps/*" run typecheck
# 4 process nối đuôi thay vì chạy cùng lúc. Trên máy 16GB RAM, song song
# tiết kiệm ~40% wall-clock vì vue-tsc chờ I/O nhiều hơn CPU.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Mảng lưu PID và tên job để báo lỗi rõ ràng.
declare -a PIDS=()
declare -a NAMES=()
FAILED=0

run_job() {
  local name="$1"
  shift
  "$@" &
  PIDS+=($!)
  NAMES+=("$name")
}

# Chạy 4 job song song:
# 1) tsc root — packages + scripts + configs
run_job "tsc (root)" tsc --noEmit --project "${REPO_ROOT}/tsconfig.json"

# 2–4) vue-tsc / tsc cho từng app
for app_dir in "${REPO_ROOT}"/apps/*/; do
  app_name="$(basename "$app_dir")"
  pkg_json="${app_dir}package.json"

  if [ ! -f "$pkg_json" ]; then
    continue
  fi

  # Đọc script typecheck từ package.json (nếu có)
  if grep -q '"typecheck"' "$pkg_json" 2>/dev/null; then
    run_job "typecheck (${app_name})" pnpm --filter "@mindkid/${app_name}" run typecheck
  fi
done

# Thu hoạch kết quả: dừng sớm nhất có thể.
for i in "${!PIDS[@]}"; do
  if ! wait "${PIDS[$i]}"; then
    echo "✗ ${NAMES[$i]} failed" >&2
    FAILED=1
    # Kill các job còn lại để không chờ vô ích.
    for j in "${!PIDS[@]}"; do
      if [ "$j" -gt "$i" ]; then
        kill "${PIDS[$j]}" 2>/dev/null || true
      fi
    done
    break
  else
    echo "✓ ${NAMES[$i]}"
  fi
done

exit $FAILED
