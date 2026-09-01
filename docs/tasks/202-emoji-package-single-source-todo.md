# Todo — Task #202: Emoji là package mã cứng, ký tự UTF-8 thật, bỏ hẳn bảng DB

Kế hoạch: [`202-emoji-package-single-source-plan.md`](202-emoji-package-single-source-plan.md)

Thứ tự **T3 → T4 → T5** là bắt buộc (D-EG). Đảo là đổi glyph render mà diff không cho thấy.

## Điều kiện vào

- [ ] Cây làm việc sạch. Hiện có **59 file đang sửa dở** trên `main` — commit hoặc stash trước.
- [ ] Nhánh riêng, không làm trên `main`.
- [ ] `pnpm check` xanh trước khi bắt đầu (mốc so sánh).

---

## T1 — Spec: contract mới

- [ ] `01-platform/emoji-registry.md` §7.1: bỏ bảng `emoji_registry`, thay bằng hình dạng `EmojiEntry`.
- [ ] `01-platform/emoji-registry.md` `BR-EMJ-02` đảo chiều: lưu **ký tự UTF-8**, Cấm — NEVER lưu mã `EMJ-<slug>`. Cột "Vì sao" nêu số đo: 60 mã trùng, 15 mã trỏ hai glyph, 50 mã không tra được.
- [ ] Thêm `BR-EMJ-11`: glyph là khoá chính, duy nhất, chuẩn NFC.
- [ ] `01-platform/emoji-registry.md` §7.3 + §8: API package và route đổi sang `getByGlyph` / `isValidGlyph`; response trả `emoji` thay `code`.
- [ ] `01-platform/emoji-registry.md` §9: viết lại Gherkin `BR-EMJ-02`; thêm scenario 15 mã nhập nhằng không còn tồn tại được.
- [ ] `06-admin/emoji-picker.md` §4 bước 5 + §8: lưu glyph. `BR-EPK-03` giữ nguyên.
- [ ] `01-platform/content-seed-authoring.md` `BR-CSA-13` + cổng 3 (§108, §147, §209, §350, §434).
- [ ] `01-platform/game-template-contract.md:159` bỏ chú "FK logic tới emoji_registry".
- [ ] `01-platform/level-generator-kit.md` §85 §108 §138.
- [ ] `05-content/content-theme-registry.md:197` `icon_emoji_ref` là glyph.
- [ ] `05-content/montessori-corpus-mapping.md` §102 §207.
- [ ] `06-admin/asset-usage-tracking.md:117` bỏ scenario "không route nào xoá hàng emoji_registry".
- [ ] `08-quality/runtime-gates.md:41` thay cổng ma bằng `emoji-glyph-integrity.test.ts`.
- [ ] `04-play/game-config-delivery.md` `BR-CFG-07`.
- [ ] `00-foundation/business-rules.md` · `00-foundation/id-conventions.md`: gỡ `EMJ-<slug>`.
- [ ] `docs/SPEC.md:246`: bỏ `emoji_registry` khỏi danh sách bảng.

**Xong khi:**
- [ ] `grep -rn 'emoji_registry' docs/specs docs/SPEC.md` → 0.
- [ ] `grep -rn 'EMJ-' docs/specs docs/SPEC.md` → 0.

---

## T2 — Package API

- [ ] `types.ts`: `category: EmojiCategory` → `categories: EmojiCategory[]`; xoá trường `code?`.
- [ ] `query.ts`: xoá `getEmojiCode` · `getByCode` · `isValidRef`; thêm `getByGlyph` · `isValidGlyph` (nhận cả bản đã tước `U+FE0F`, D-ED).
- [ ] `registry.ts`: `EMOJI_CATEGORIES` dựng bằng `categories.includes(cat)`, không đọc `category`.
- [ ] `index.ts`: cập nhật export.
- [ ] `tests/emoji.test.ts`: đổi sang glyph; thêm ca `getByGlyph("🕊")` và `getByGlyph("🕊️")` cùng ra một entry.

**Xong khi:**
- [ ] `pnpm --filter @mindkid/emoji test` xanh.
- [ ] `grep -rn 'getByCode\|getEmojiCode\|EMOJI_REF_PATTERN' packages/emoji` → 0.

---

## T3 — Bổ sung 50 emoji thiếu (điều kiện tiên quyết của T4)

- [ ] Viết `scripts/emoji/audit-refs.ts`: quét corpus, in mã `EMJ-*` không tra được kèm số lần và file.
- [ ] Chạy audit, xác nhận đúng **50 mã · 297 lần** như §2.4 của plan.
- [ ] Soạn hàng cho `EMJ-coin` → 🪙 (`number-symbol`) — 84 lần dùng.
- [ ] Soạn hàng cho `EMJ-yarn` → 🧶 (`tool`) — 52 lần dùng.
- [ ] Soạn 48 hàng còn lại; mỗi hàng đủ `name` tiếng Việt · `keywords` ≥2 (Anh + Việt) · `categories` · `curriculum_themes` · `age_min`.
- [ ] `EMJ-nonexistent-999` (fixture ca âm): đổi thành một glyph ngoài danh sách, không thêm vào registry.

**Xong khi:**
- [ ] `audit-refs.ts` báo 0 mã không tra được.
- [ ] **Ca âm:** xoá một hàng vừa thêm → audit đỏ, nêu đúng mã đó.

---

## T4 — Codemod `EMJ-*` → glyph (3.249 chỗ)

- [ ] Viết `scripts/emoji/codemod-to-glyph.ts` (thay `packages/db/scripts/fix-emoji-refs.ts`).
- [ ] Bản đồ mã→glyph dựng **trước khi gộp trùng**, lấy hàng đầu theo `Object.values(EMOJI_CATEGORIES).flat()` (D-EG).
- [ ] Trường quét: `ref` · `emoji_ref` · `label_emoji` · `icon_emoji_ref` · `thumbnail_emoji` · helper `emoji("…")`.
- [ ] Chạy `--dry-run`, kiểm ba phần báo cáo:
  - [ ] phần 1 — số ref đổi trên từng file;
  - [ ] phần 2 — **15 mã nhập nhằng** và glyph `find()` chọn;
  - [ ] phần 3 — ref không đổi được, phải **rỗng**.
- [ ] Người soạn nội dung duyệt bảng phần 2. 4 mã nghề nghiệp (`EMJ-doctor` `EMJ-teacher` `EMJ-chef` `EMJ-farmer`) tách hai hàng nam/nữ thay vì chọn một (câu hỏi mở #1).
- [ ] Chạy `--write`.
- [ ] Xoá `packages/db/scripts/fix-emoji-refs.ts`.

**Xong khi:**
- [ ] `grep -rn 'EMJ-' packages apps` → 0.
- [ ] **Ca âm:** chạy lại codemod trên cây đã đổi → 0 thay đổi (idempotent).
- [ ] `pnpm --filter @mindkid/db test` và `--filter @mindkid/game-engine test` xanh.

---

## T5 — Gộp 66 hàng trùng (825 → 759)

- [ ] 49 hàng trùng xuyên nhóm: gộp `categories`, hợp `keywords` và `curriculum_themes`.
- [ ] 12 hàng trùng trong một nhóm (`animal-water` chiếm phần lớn): giữ tên ngắn hơn, hợp `keywords`.
- [ ] 5 hàng còn lại xử theo bảng phần 2 của T4.

**Xong khi:**
- [ ] `ALL_EMOJIS.length === 759`.
- [ ] `new Set(ALL_EMOJIS.map(e => e.emoji)).size === ALL_EMOJIS.length`.
- [ ] Picker vẫn hiện ⭐ ở cả `school`, `shape-color`, `sky-space`.

---

## T6 — Cổng toàn vẹn (mọi kiểm phải có ca âm chạy được)

Tạo `packages/db/tests/gates/emoji-glyph-integrity.test.ts`.

- [ ] Kiểm: mọi glyph duy nhất — **ca âm:** thêm hàng trùng → đỏ.
- [ ] Kiểm: mọi glyph là NFC — **ca âm:** thêm hàng NFD → đỏ.
- [ ] Kiểm: Cấm — NEVER skin tone modifier (`BR-EMJ-09`, chuyển từ `seed-master/emoji.ts`) — **ca âm:** thêm 👍🏽 → đỏ.
- [ ] Kiểm: mọi `ref` emoji trong corpus seed là thành viên — **ca âm:** đổi một ref thành 🦖 → đỏ.
- [ ] Kiểm: mọi `icon_emoji_ref` của 14 chủ đề là thành viên — **ca âm:** xoá một hàng → đỏ.
- [ ] Đăng ký cổng trong `docs/specs/08-quality/runtime-gates.md`.

**Xong khi:**
- [ ] Cả năm ca âm được **chạy** và chứng minh đỏ, không chỉ khai là có.

---

## T7 — Contract Zod

- [ ] `packages/game-engine/src/contracts/shared-fields.ts`: xoá `EMOJI_REF_PATTERN`; `EmojiRef = z.string().refine(isValidGlyph, …)`.
- [ ] `packages/shared/src/custom-game.ts:327–341`: `validateEmojiReferences` dùng `isValidGlyph`; đổi thông điệp lỗi tiếng Việt.
- [ ] `packages/db/src/seed-content/gates/theme-registry.ts:290` + `tests/gates/theme-registry.test.ts:201`.
- [ ] `packages/game-engine/tests/generators.test.ts:99–123`: đảo khẳng định — `"🍎"` **được chấp nhận**, `"EMJ-red-apple"` **bị từ chối**.
- [ ] JSON Schema: `.refine` không xuất được. Bổ sung `enum` 759 glyph vào schema công bố (câu hỏi mở #2).
- [ ] Kiểm `schema-driven-form` / `GameConfigVisualEditor` vẫn ràng buộc được ô emoji.

**Xong khi:**
- [ ] `pnpm --filter @mindkid/game-engine test` và `--filter @mindkid/shared test` xanh.
- [ ] JSON Schema xuất ra chứa danh sách đóng, không phải `z.string()` trần.

---

## T8 — Xoá DB

- [ ] `packages/db/src/schema/taxonomy.ts:152–184`: xoá `emojiRegistry`, `emojiAgeSuitabilityEnum`, `emojiStatusEnum`, CHECK.
- [ ] Xoá `packages/db/src/seed-master/emoji.ts`; gỡ lời gọi trong `seed.ts`.
- [ ] Chuyển `hasSkinToneModifier` sang cổng T6 trước khi xoá file.
- [ ] `packages/db/tests/global-setup.ts:65`: bỏ `"emoji_registry"`.
- [ ] `packages/db/src/purge-scope.ts:295`: bỏ mục.
- [ ] Xoá `packages/db/tests/integration/emoji-master.test.ts`.
- [ ] `packages/shared/src/asset-resolver.ts`: xoá `emojiRegistryLookup` (hook chết, không runtime nào truyền) + 3 test dùng nó ở `tests/asset-resolver.test.ts`.
- [ ] `packages/db/scripts/reset-content.ts:25`: sửa comment.
- [ ] Migration expand mới — Cấm — NEVER sửa `0000_bumpy_secret_warriors.sql`:
  ```sql
  DROP TABLE IF EXISTS "emoji_registry";
  DROP TYPE IF EXISTS "emoji_age_suitability";
  DROP TYPE IF EXISTS "emoji_status";
  ```
- [ ] Kiểm ba dòng `CREATE EXTENSION` viết tay ở `0000` còn nguyên sau khi regenerate.

**Xong khi:**
- [ ] `\dx` đúng DB; `\dt` không còn `emoji_registry`.
- [ ] `pnpm db:migrate && pnpm db:seed` trên DB sạch xanh.
- [ ] `packages/db/tests/gates/migration-expand.test.ts` xanh.

---

## T9 — Quét lần cuối

- [ ] `grep -rn 'EMJ-' packages apps docs` → 0.
- [ ] `grep -rn 'emoji_registry' packages apps docs` → 0.
- [ ] `grep -rn 'getByCode\|getEmojiCode\|EMOJI_REF_PATTERN\|isValidRef\|emojiRegistryLookup' packages apps` → 0.
- [ ] `pnpm lint` xanh — đọc output thật, không tin dòng tóm tắt.
- [ ] `pnpm typecheck` xanh (`typecheck:web` cho server Nuxt).
- [ ] `pnpm test` xanh.
- [ ] `pnpm check` xanh.
- [ ] Chạy app: mở `/games`, một trang `/play/[code]`, và picker trong studio — xác nhận glyph render thật, không ô trống.

---

## Sổ đo — cập nhật khi chạy

| Chỉ số | Trước | Sau (đích) | Thực tế |
|---|---:|---:|---:|
| Hàng trong `packages/emoji` | 825 | 759 | |
| Glyph phân biệt | 759 | 759 | |
| Mã `EMJ-*` trong code | 3.249 | 0 | |
| Mã corpus không tra được | 50 (297 lần) | 0 | |
| Mã trỏ hai glyph khác nhau | 15 | 0 | |
| Bảng DB emoji | 1 | 0 | |
| Cổng emoji có ca âm | 0 | 5 | |
