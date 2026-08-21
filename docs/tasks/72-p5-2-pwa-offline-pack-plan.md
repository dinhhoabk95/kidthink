# Kế hoạch — Task #72: P5.2 — PWA và offline curriculum pack

> Viết 2026-08-11, đo tại commit `484ebaf`.
> Spec hiện có: [`pwa-install.md`](../specs/01-platform/pwa-install.md) và
> [`offline-play.md`](../specs/01-platform/offline-play.md).
> Phụ thuộc: Task #70 chấp nhận offline pack và cổng ra P4.

## Tóm tắt

Task #72 hoàn thiện install prompt trên bề mặt người lớn và mở rộng offline từ “phiên đang chạy”
sang curriculum pack được User chủ động tải. Rủi ro chính là cache nội dung trả phí sau khi
entitlement hết, quota/eviction không đoán được, update service worker làm hỏng phiên và UI hệ
thống lọt vào bề mặt trẻ. Download scope, lease/revocation và storage budget phải chốt trước code.

## 0. Hard rules

- Lời mời cài đặt chỉ ở bề mặt người lớn; `start_url` không mở thẳng `/play`.
- Mất mạng không ngắt phiên; offline test dùng browser offline mode thật.
- Không cache content trả phí cho actor không có entitlement tại thời điểm cấp pack.
- Không push notification cho trẻ; FCM Web của User thuộc Task #84. Task này chỉ bảo đảm service
  worker phối hợp được và không modal hệ thống che game.

## 1. Quyết định bắt buộc

**D-P5OFF-A — Pack là grant có hạn, không phải copy thư viện.** Product/Security chốt nội dung,
thời hạn, entitlement snapshot và hành vi khi hết quyền trước khi route download tồn tại.

**D-P5OFF-B — Download chỉ từ parent surface.** User chọn child/curriculum/period và thấy dung
lượng; trẻ không thấy install/download/delete prompt.

**D-P5OFF-C — Service worker update không cắt phiên.** Build mới chỉ activate ở safe point;
cache version cũ giữ đủ asset cho phiên đang chạy rồi mới dọn.

**D-P5OFF-D — Storage pressure là flow chuẩn.** Dùng capability/quota thật, preflight dung lượng,
evict theo contract và báo người lớn; không hứa offline nếu pack chưa verify hoàn tất.

## 2. Đồ thị

```text
T0 capability/storage/security preflight
 └── T1 close PWA/offline/parent-gate contract ── Checkpoint A
      ├── T2 manifest/install prompt
      └── T3 pack manifest/downloader/storage
           └── T4 entitlement lease/revoke/sync ── Checkpoint B
                ├── T5 parent UX + child-safe states
                └── T6 browser matrix/quota/update/offline E2E
                     └── T7 promote specs
```

## 3. Task triển khai

### T0 — Browser capability và risk preflight

**Tiêu chí nghiệm thu**

- [ ] Đo install/service-worker/storage/quota/eviction trên browser/device matrix hỗ trợ.
- [ ] Product chốt pack scope; Security chốt lease, revocation, logout/device-shared behavior.
- [ ] Infra chốt asset/version/update strategy và download budget; không tự chọn số.

**Kiểm chứng:** capability report trên browser thật; decision table có owner.

**Phụ thuộc:** #70 + P4 · **Files:** evidence/task/spec decision · **Cỡ:** S.

### T1 — Khép contract PWA/offline

**Tiêu chí nghiệm thu**

- [ ] [`pwa-install.md`](../specs/01-platform/pwa-install.md),
  [`offline-play.md`](../specs/01-platform/offline-play.md), parent gate, gating và curriculum player
  có một owner mỗi rule.
- [ ] Pack manifest, API/auth, lease/revoke/expiry, quota/eviction/update và errors có negative Gherkin.
- [ ] Push-to-child bị cấm rõ; service-worker boundary với
  [`browser-push.md`](../specs/01-platform/browser-push.md) được ghi nhưng Task #72 không cài FCM.
- [ ] Install prompt criteria và back/fullscreen behavior được Product duyệt.

**Kiểm chứng:** `pnpm --filter @mindkid/gates test`; error/event/BR registries và dependency graph khớp.

**Phụ thuộc:** T0 · **Files:** PWA/offline/gating/parent specs + registries · **Cỡ:** M.

### Checkpoint A — Offline contract review

- [ ] Product/Security/Infra review pack/lease/revocation/storage/update matrix.
- [ ] Không route/cache schema trước khi entitlement-offline behavior được chốt.

### T2 — Manifest và install prompt

**Tiêu chí nghiệm thu**

- [ ] Manifest/icons/start/scope/display/orientation hợp contract; install state đúng 3 sessions/30 days/2 dismissals.
- [ ] iOS manual path, installed detection và update state có a11y/keyboard/tablet tests.
- [ ] `/play` không render prompt; icon launch vào parent surface.

**Kiểm chứng:** Playwright Chromium/WebKit/Firefox + manifest audit.

**Phụ thuộc:** Checkpoint A · **Files:** web manifest/composable/parent UI/E2E · **Cỡ:** M.

### T3 — Pack manifest, downloader và storage

**Tiêu chí nghiệm thu**

- [ ] Server tạo signed/versioned manifest chỉ cho content/asset được phép; client verify completeness.
- [ ] Downloader resume/idempotent, preflight quota, atomic ready marker; partial pack không playable.
- [ ] Cache keys ghim content version/build; API/PII/telemetry không bị cache ngoài contract.

**Kiểm chứng:** integration + browser download/resume/corrupt/insufficient-quota tests.

**Phụ thuộc:** Checkpoint A · **Files:** routes/service/storage/service worker/tests · **Cỡ:** M mỗi lát.

### T4 — Lease, revocation và sync

**Tiêu chí nghiệm thu**

- [ ] Online grant check trước download; lease expiry/logout/device revoke xử lý đúng contract.
- [ ] Offline progress flush theo seq/idempotency và đúng content version khi có mạng lại.
- [ ] Revocation không cắt phiên đang chạy nhưng chặn phiên mới theo policy đã duyệt.

**Kiểm chứng:** clock/ownership/revoke/logout/late-sync tests với PG và browser storage thật.

**Phụ thuộc:** T3 + gating/curriculum/session · **Files:** auth/gating/sync/storage tests · **Cỡ:** M.

### Checkpoint B — Pack write/read path

- [ ] Download→verify→offline play→sync chạy end-to-end; partial/corrupt/expired fail-closed.
- [ ] Human review cached payload và entitlement transition.

### T5 — Parent UX và child-safe states

**Tiêu chí nghiệm thu**

- [ ] Parent chọn pack, thấy size/status/expiry/update/delete và recovery bằng tiếng Việt.
- [ ] Child lobby chỉ hiện content offline dùng được; không settings/storage/install/delete prompt.
- [ ] Parent gate bảo vệ mọi đường thoát sang system/settings; không hứa khóa browser tuyệt đối.

**Kiểm chứng:** tablet/keyboard/screen-reader E2E; ownership và gate negative cases.

**Phụ thuộc:** T4 · **Files:** parent+play UI/components/E2E · **Cỡ:** M mỗi lát.

### T6 — Browser matrix, quota và update drill

**Tiêu chí nghiệm thu**

- [ ] Offline mode thật, reload/app restart, eviction, low storage, corrupt asset và clock expiry xanh.
- [ ] Service-worker update giữa phiên không cắt game; old/new cache cleanup có evidence.
- [ ] Performance/storage/download budgets được đo trên tablet mục tiêu, không số phỏng đoán.

**Kiểm chứng:** Playwright/device report + service-worker lifecycle drill.

**Phụ thuộc:** T5 · **Files:** E2E/load/evidence · **Cỡ:** M.

### T7 — Promote contract

**Tiêu chí nghiệm thu**

- [ ] Mỗi `BR-PWA-*`/`BR-OFF-*` mới có test; P5 questions PWA/offline/parent gate đóng.
- [ ] Specs chỉ `implemented` khi install và accepted offline pack scope cùng xanh.
- [ ] Full gate xanh; Security/Infra human review cache, lease và update evidence.

**Kiểm chứng:** progress evidence Task #72 + full project gates.

**Phụ thuộc:** T6 · **Files:** spec status/progress/evidence · **Cỡ:** S.

## 4. Ngoài phạm vi

FCM Web/inbox của User (Task #84), push notification cho trẻ, background tracking, cache toàn catalog, bypass entitlement, DRM hứa
hẹn tuyệt đối trong browser, đổi TTL/quota không decision, production publish/deploy hoặc auto-merge.
