# Kế hoạch — Task #66: P4.5 — Game cá nhân từ sáu template

> Viết 2026-08-11, đo tại commit `484ebaf`.
> Spec sở hữu: [`custom-game-builder.md`](../specs/07-addon/custom-game-builder.md).
> Có thể chạy song song Task #65 và nhánh AI sau cổng ra P3.

## Tóm tắt

Task #66 tái dùng đúng content contract, validation và engine của studio để User tạo game riêng
cho child profile của mình. Game không vào catalog, không cập nhật mastery, nhưng play session
vẫn ghi lịch sử. Mọi text UGC qua moderation; emoji phải thuộc registry, ảnh dùng quota storage.

## 0. Điều kiện vào

- Cổng ra P3 xanh; P1 template/engine/config/session/scoring và P2 studio/storage đã `implemented`.
- Sáu template MVP và validator server có interface merge thật; không port/copy validator vào web.
- Owner chốt quota, skill exposure và moderation provider trước schema/dependency/catalog.

## 1. Hiện trạng và drift

- Chưa có `custom_games`, route/UI hoặc `packages/moderation` trong source.
- Architecture có dòng moderation nhưng thư viện nền “chưa chốt”. Đây là dependency gate thật.
- Catalog đang hardcode `custom_games_saved: 10` dù Q2 chưa chốt; không được coi 10 là contract.
- Q3 đề xuất gắn `skill_ids` để báo cáo “đã tiếp xúc” nhưng không mastery; cần sửa report/play
  contract trước code, tránh session custom lọt vào BKT.

## 2. Quyết định contract

**D-P4Q — Một validator/engine, source kind rõ.** Studio và custom builder gọi cùng pure
`content_contract` + editorial validator. Play session/config mang source kind/ref rõ; mastery
consumer loại custom ở server, còn history projection có thể ghi exposure nếu owner chốt.

**D-P4R — Privacy bằng ownership 404.** Config, edit, validate và play chỉ caller/child thuộc
owner. Không route list public, không `access_tier`, không publish transition hay content version.

**D-P4S — Moderation là port bắt buộc.** Chốt self-hosted list hay provider ngoài, payload,
timeout/fail-closed, logging và dữ liệu rời hệ thống trong spec architecture trước dependency.
Không gửi child data; cả input User và output chuẩn hoá phải qua server moderation.

**D-P4T — Quota count được định nghĩa một lần.** Chốt giới hạn thay số 10, draft/ready có tính
không, delete có trả slot không và upload MB. Catalog chỉ public khi builder, validation,
moderation, play isolation và quota cùng chạy.

## 3. Đồ thị

```text
T0 đo template/studio/config/play/mastery/storage seams
 └── T1 chốt moderation/quota/skill/source-kind contract ── Checkpoint A
      ├── T2 packages/moderation port + tests
      ├── T3 migration custom_games + source reference
      └── T4 shared validator adapter
           └── T5 CRUD/validate/config APIs ── Checkpoint B
                ├── T6 play/history/mastery isolation
                └── T7 User builder UI/assets
                     └── T8 security/E2E/perf/evidence + catalog
```

## 4. Task triển khai

### T0 — Preflight

**Tiêu chí nghiệm thu**

- [ ] P1/P2/P3 dependencies `implemented`; ghi interface thật của six templates, validators,
  config delivery, session/mastery, emoji/storage/quota.
- [ ] Đối chiếu `BR-CGB-*`, `BR-GLM-*`, `BR-EMJ-*`, child-data và §7.3.
- [ ] Xác nhận mọi code dùng chung nằm package/server phù hợp, không DB import từ `app/`.

**Kiểm chứng:** `pnpm check:progress`; preflight không còn seam plan-only.

**Phụ thuộc:** cổng ra P3 · **Files:** task/spec nếu seam đổi · **Cỡ:** S.

### T1 — Contract moderation, quota và telemetry

**Tiêu chí nghiệm thu**

- [ ] Owner chốt moderation, quota (thay/duyệt số 10) và skill exposure; DPA nếu provider ngoài.
- [ ] Spec/architecture/report/play owners ghi source kind, mastery exclusion, payload/logging/fail policy.
- [ ] Mọi quota/error/key đăng ký trước code; SKU vẫn ẩn.

**Kiểm chứng:** `pnpm lint:specs`; catalog/architecture/dependency tests xanh.

**Phụ thuộc:** T0 + human decisions · **Files:** CGB + architecture + catalog/entitlement + play/report/error specs · **Cỡ:** M theo PR contract.

### Checkpoint A

- [ ] D-P4Q…D-P4T và dependency mới được security/legal/human review.
- [ ] Không package/schema/API trước quyết định moderation.

### T2 — Moderation port

**Tiêu chí nghiệm thu**

- [ ] Port trả pass/issues/version, cap input, timeout và fail policy; adapter duy nhất theo architecture.
- [ ] Log không chứa child data/UGC thô quá retention; từ cấm tiếng Việt có version/provenance nếu self-hosted.
- [ ] Fake adapter test dương/âm/timeout; không gọi provider thật trong test.

**Kiểm chứng:** `pnpm test -- moderation-contract`; dependency boundary xanh.

**Phụ thuộc:** Checkpoint A · **Files:** package port/adapter/test + wiring · **Cỡ:** M.

### T3 — Migration custom game

**Tiêu chí nghiệm thu**

- [ ] Bảng đúng owner/template/content/difficulty/theme/band/status, không tier/version/public lifecycle.
- [ ] Skill relation/source reference theo contract; indexes/unique/checks cho owner/status/template.
- [ ] DB rỗng/upgrade/rollback và orphan/invalid template/status tests xanh.

**Kiểm chứng:** `pnpm db:migrate`; `pnpm test -- custom-game-schema`.

**Phụ thuộc:** Checkpoint A · **Files:** schema/migration/meta/integration test · **Cỡ:** M.

### T4 — Shared validation

**Tiêu chí nghiệm thu**

- [ ] Custom và studio gọi cùng parser/editorial validator; không copy sáu switch template.
- [ ] Server enforce answer/item/band/instruction/asset/moderation/all `BR-GLM` constraints.
- [ ] Round-trip property test toàn sáu template; fixture studio/custom cho cùng kết quả issues.

**Kiểm chứng:** `pnpm test -- custom-game-validation game-contract-roundtrip`.

**Phụ thuộc:** T2–T3 + P1 contract · **Files:** adapter/shared tests · **Cỡ:** M.

### T5 — CRUD, validate và config APIs

**Tiêu chí nghiệm thu**

- [ ] POST/PATCH/validate/config Zod + entitlement + owner/child 404; optimistic version cho edit.
- [ ] Ready chỉ sau shared validation+moderation; emoji registry và upload quota kiểm server.
- [ ] Config chỉ sáu template, không public/list/catalog; User khác và child khác không suy ra tồn tại.

**Kiểm chứng:** `pnpm test -- custom-game-api custom-game-config`.

**Phụ thuộc:** T2–T4 · **Files:** service + route slices/tests, mỗi lát ≤5 · **Cỡ:** M.

### Checkpoint B

- [ ] CRUD/validation/moderation/quota/ownership/config matrix xanh.
- [ ] Human review payload UGC và mọi query ownership.

### T6 — Play history và mastery isolation

**Tiêu chí nghiệm thu**

- [ ] Custom config chạy cùng engine; play session source kind được ghi và chỉ owner child mở.
- [ ] Mastery/adaptive consumer loại custom tuyệt đối; history/exposure chỉ theo quyết định D-P4Q.
- [ ] Regression/property test chứng minh chuỗi custom bất kỳ không đổi `mastery_state`.

**Kiểm chứng:** `pnpm test -- custom-game-play custom-game-mastery-isolation`.

**Phụ thuộc:** T5 + P1/P3 play · **Files:** source adapter, consumer guard, integration/property test · **Cỡ:** M.

### T7 — Builder UI và assets

**Tiêu chí nghiệm thu**

- [ ] User chọn sáu template, edit/preview/validate bằng cùng schema-driven seam; lỗi cạnh field tiếng Việt.
- [ ] Emoji chỉ registry; upload ảnh qua storage/quota, không SVG/URL tuyệt đối/ảnh trẻ.
- [ ] Draft không mất khi 402/422/moderation fail; keyboard/tablet/a11y xanh.

**Kiểm chứng:** `pnpm test:e2e -- custom-game-builder`.

**Phụ thuộc:** T5–T6 · **Files:** page + components/E2E chia lát · **Cỡ:** M.

### T8 — Evidence và catalog

**Tiêu chí nghiệm thu**

- [ ] IDOR mọi UUID, moderation fail, quota race, six-template roundtrip, mastery isolation xanh.
- [ ] Mỗi `BR-CGB-01…10` có test mang mã; full gate/progress xanh.
- [ ] Spec `implemented` và SKU public cùng release sau human review; không UGC nào vào public catalog.

**Kiểm chứng:** full gate + security/perf review.

**Phụ thuộc:** T6–T7 · **Files:** security/evidence/spec/catalog/progress tests · **Cỡ:** M.

## 5. Ngoài phạm vi

Submit UGC để duyệt/public, template thứ bảy, collaboration, child khác owner, custom game tính mastery.
