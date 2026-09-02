#!/usr/bin/env bash
# Pipeline check thông minh — fail-fast, song song nơi an toàn.
#
# Usage:
#   bash scripts/check.sh          # đầy đủ: lint + typecheck + test + test:deploy
#   bash scripts/check.sh --fast   # bỏ test:deploy (cho AI agent loop / dev nhanh)
#
# Mỗi phase dừng ngay khi lỗi, không chạy phase tiếp theo.
# Bên trong phase, các job độc lập chạy song song.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

FAST=false
for arg in "$@"; do
  case "$arg" in
    --fast) FAST=true ;;
  esac
done

# Đếm thời gian từng phase.
phase_start() {
  PHASE_START=$(date +%s)
}

phase_end() {
  local elapsed=$(( $(date +%s) - PHASE_START ))
  echo "  (${elapsed}s)"
}

TOTAL_START=$(date +%s)

# ── Phase 1: Lint (song song) ─────────────────────────────────────────────
echo "▸ Phase 1: lint"
phase_start

pnpm lint &
PID_LINT=$!

pnpm lint:deps &
PID_DEPS=$!

LINT_OK=true
if ! wait $PID_LINT; then
  echo "✗ biome lint failed" >&2
  LINT_OK=false
fi

if ! wait $PID_DEPS; then
  echo "✗ dependency-cruiser failed" >&2
  LINT_OK=false
fi

if [ "$LINT_OK" = false ]; then
  exit 1
fi
echo "✓ lint"
phase_end

# ── Phase 2: Typecheck (song song) ────────────────────────────────────────
echo "▸ Phase 2: typecheck"
phase_start

# `pnpm typecheck` = cổng bậc thang, chỗ DUY NHẤT typecheck chạy (Task #204):
# 10 project, tối đa 4 compiler cùng lúc, mỗi project một tsBuildInfoFile trong
# node_modules/.cache. Đường chạy thứ hai đã bị xoá vì nó không có bậc thang —
# hai đường thì đo hai thứ khác nhau mà không ai báo. Cổng giữ bất biến này:
# scripts/script-surface.test.ts.
pnpm typecheck
TC_STATUS=$?

if [ $TC_STATUS -ne 0 ]; then
  echo "✗ typecheck failed" >&2
  exit 1
fi
echo "✓ typecheck"
phase_end

# ── Phase 3: Test (fail-fast) ─────────────────────────────────────────────
echo "▸ Phase 3: test"
phase_start

NODE_OPTIONS=--max-old-space-size=4096 pnpm exec vitest run --bail 1 --max-workers=1 --no-file-parallelism
TEST_STATUS=$?

if [ $TEST_STATUS -ne 0 ]; then
  echo "✗ test failed" >&2
  exit 1
fi
echo "✓ test"
phase_end

# ── Phase 4: Deploy test (bỏ khi --fast) ──────────────────────────────────
if [ "$FAST" = false ]; then
  echo "▸ Phase 4: deploy test"
  phase_start

  bash "${REPO_ROOT}/infra/scripts/tests/run.sh"
  DEPLOY_STATUS=$?

  if [ $DEPLOY_STATUS -ne 0 ]; then
    echo "✗ test:deploy failed" >&2
    exit 1
  fi
  echo "✓ deploy test"
  phase_end
else
  echo "▸ Phase 4: deploy test (skipped — --fast)"
fi

# ── Summary ────────────────────────────────────────────────────────────────
TOTAL_ELAPSED=$(( $(date +%s) - TOTAL_START ))
echo ""
echo "✓ All gates passed (${TOTAL_ELAPSED}s total)"
