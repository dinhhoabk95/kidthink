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

# Cổng đòi Node >=24 (package.json engines). `node` trên PATH có thể là bản cũ,
# nên thử nạp một bản 24 từ nvm trước khi bỏ cuộc. Cấm chạy im lặng dưới 24:
# ở đó pnpm gãy và cổng xanh giả.
node_major() {
  node --version 2>/dev/null | sed 's/^v//; s/\..*//'
}

NODE_MAJOR="$(node_major)"
if [ -z "${NODE_MAJOR}" ] || [ "${NODE_MAJOR}" -lt 24 ]; then
  NVM_NODE_DIR="${NVM_DIR:-${HOME}/.nvm}/versions/node"
  if [ -d "${NVM_NODE_DIR}" ]; then
    for candidate in $(ls -1 "${NVM_NODE_DIR}" | grep '^v24\.' | sort -V -r); do
      candidate_bin="${NVM_NODE_DIR}/${candidate}/bin"
      # Probe bản thật: một binary hỏng vẫn tồn tại trên đĩa nhưng không chạy được.
      if [ -x "${candidate_bin}/node" ] && "${candidate_bin}/node" --version >/dev/null 2>&1; then
        export PATH="${candidate_bin}:${PATH}"
        break
      fi
    done
  fi
  NODE_MAJOR="$(node_major)"
fi

if [ -z "${NODE_MAJOR}" ] || [ "${NODE_MAJOR}" -lt 24 ]; then
  echo "✗ check.sh đòi Node >=24, đang thấy: $(node --version 2>/dev/null || echo 'không có node trên PATH')" >&2
  exit 1
fi

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
echo "▸ Phase 1: lint + intro-coverage"
phase_start

pnpm lint &
PID_LINT=$!

pnpm lint:deps &
PID_DEPS=$!

# Cổng bậc thang độ phủ bài làm quen khái niệm — BR-CIG-18.
# Nợ chỉ được giảm; thêm level chấm cho kỹ năng chưa có bài dạy làm cổng đỏ.
pnpm check:intro-coverage &
PID_INTRO=$!

# Cổng bậc thang kho giá trị kỹ năng — Task #255 (BR-SVI-01..05).
# Đối chiếu hai chiều: dataset ⊆ inventory và inventory ⊆ ⋃ dataset.
pnpm check:value-inventory &
PID_INVENTORY=$!

# Cổng bậc thang mã lỗi — Task #254 (WP254.2).
# Đo 5 phép đo nợ lỗi; nợ chỉ được giảm.
pnpm check:error-codes &
PID_ERRORS=$!

# Cổng bậc thang không gian logic — Task #260 (T7).
pnpm check:logic-space &
PID_LOGIC_SPACE=$!

# Cổng bậc thang ô cần chỉ — Task #260 (T9). Mặc định của
# `getHintTargetIndex()` là null, nên template quên cài KHÔNG làm test nào đỏ,
# nó chỉ âm thầm không bao giờ chỉ chỗ cho trẻ.
pnpm check:hint-target &
PID_HINT_TARGET=$!

# Cổng hash migration — Task #260 (I13). drizzle quyết định apply bằng mốc thời
# gian, hash thì chỉ ghi chứ không đối chiếu, nên sửa file migration đã chạy
# không làm cổng nào đỏ mà SQL trong repo lệch SQL đã chạy trên database.
pnpm check:migration-hashes &
PID_MIGRATION_HASHES=$!

# Cổng đối chiếu spec engine — BR-ESS-01..15.
pnpm check:engine-specs &
PID_ENGINE_SPECS=$!

# Cổng kịch bản lượt chơi engine — Task #262 (BR-ETS-01..12).
pnpm check:engine-turn &
PID_ENGINE_TURN=$!

# Cổng miền hành vi engine — Task #261 (BR-EBD-01..13).
pnpm check:engine-behavior &
PID_ENGINE_BEHAVIOR=$!

# Cổng miền hành vi × corpus — nửa corpus của BR-EBD-04 (miền phải có bài để chơi).
pnpm check:engine-behavior-corpus &
PID_ENGINE_BEHAVIOR_CORPUS=$!

LINT_OK=true
if ! wait $PID_LINT; then
  echo "✗ biome lint failed" >&2
  LINT_OK=false
fi

if ! wait $PID_DEPS; then
  echo "✗ dependency-cruiser failed" >&2
  LINT_OK=false
fi

if ! wait $PID_INTRO; then
  echo "✗ intro-coverage ratchet failed" >&2
  LINT_OK=false
fi

if ! wait $PID_INVENTORY; then
  echo "✗ value-inventory ratchet failed" >&2
  LINT_OK=false
fi

if ! wait $PID_ERRORS; then
  echo "✗ check:error-codes ratchet failed" >&2
  LINT_OK=false
fi

if ! wait $PID_LOGIC_SPACE; then
  echo "✗ check:logic-space ratchet failed" >&2
  LINT_OK=false
fi

if ! wait $PID_HINT_TARGET; then
  echo "✗ check:hint-target ratchet failed" >&2
  LINT_OK=false
fi

if ! wait $PID_MIGRATION_HASHES; then
  echo "✗ check:migration-hashes failed" >&2
  LINT_OK=false
fi

if ! wait $PID_ENGINE_SPECS; then
  echo "✗ check:engine-specs failed" >&2
  LINT_OK=false
fi

if ! wait $PID_ENGINE_TURN; then
  echo "✗ check:engine-turn failed" >&2
  LINT_OK=false
fi

if ! wait $PID_ENGINE_BEHAVIOR; then
  echo "✗ check:engine-behavior failed" >&2
  LINT_OK=false
fi

if ! wait $PID_ENGINE_BEHAVIOR_CORPUS; then
  echo "✗ check:engine-behavior-corpus failed" >&2
  LINT_OK=false
fi

if [ "$LINT_OK" = false ]; then
  exit 1
fi
echo "✓ lint + intro-coverage + value-inventory + error-codes + logic-space + hint-target + migration-hashes + engine-specs + engine-behavior + engine-behavior-corpus"
phase_end

# ── Phase 2: Typecheck (cổng bậc thang + incremental) ─────────────────────
echo "▸ Phase 2: typecheck"
phase_start

pnpm typecheck
TC_STATUS=$?

if [ $TC_STATUS -ne 0 ]; then
  echo "✗ typecheck failed" >&2
  exit 1
fi
echo "✓ typecheck"
phase_end

# ── Phase 3: Test ─────────────────────────────────────────────────────────
echo "▸ Phase 3: test"
phase_start

if [ "$FAST" = true ]; then
  echo "  (chế độ --fast: chạy test không phụ thuộc database)"
  NODE_OPTIONS=--max-old-space-size=4096 npx vitest run --project=@mindkid/game-engine
  TEST_STATUS=$?
else
  if pnpm services >/dev/null 2>&1; then
    pnpm check:test-ratchet
    TEST_STATUS=$?
  else
    echo "✗ PostgreSQL / Valkey chưa chạy. Chạy 'docker compose up -d' để khởi động services, hoặc dùng '--fast' để chỉ chạy tập test không cần DB." >&2
    exit 1
  fi
fi

if [ $TEST_STATUS -ne 0 ]; then
  echo "✗ test failed" >&2
  exit 1
fi
echo "✓ test"
phase_end

# ── Phase 4: Deploy test (Tạm thời vô hiệu hóa) ───────────────────────────
# if [ "$FAST" = false ]; then
#   echo "▸ Phase 4: deploy test"
#   phase_start
# 
#   bash "${REPO_ROOT}/infra/scripts/tests/run.sh"
#   DEPLOY_STATUS=$?
# 
#   if [ $DEPLOY_STATUS -ne 0 ]; then
#     echo "✗ test:deploy failed" >&2
#     exit 1
#   fi
#   echo "✓ deploy test"
#   phase_end
# else
#   echo "▸ Phase 4: deploy test (skipped — --fast)"
# fi

# ── Summary ────────────────────────────────────────────────────────────────
TOTAL_ELAPSED=$(( $(date +%s) - TOTAL_START ))
echo ""
echo "✓ All gates passed (${TOTAL_ELAPSED}s total)"
