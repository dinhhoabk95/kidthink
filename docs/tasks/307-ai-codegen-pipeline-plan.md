# Kế hoạch Task #307: Pipeline sinh code từ spec (AI Codegen Pipeline)

Contract: `docs/specs/01-platform/ai-codegen-pipeline.md` (`status: draft`) — §3 sáu lệnh `gen:*`, §7.1 `spec-index.json`, §7.3 header `@generated`, §7.4 `gen:check`, §8 `GenCheckResult`, `BR-AIG-01`…`BR-AIG-10` (`BR-AIG-06` đã ngưng 2026-08-29).

**Quyết định đã chốt (người dùng):** giữ spec, `status: draft`, dựng pipeline. Phạm vi cụ thể (lệnh nào, theo thứ tự nào, có dựng lại `gen:check` thành cổng không) phải chốt ở S0 trước khi viết code.

---

## 1. Bối cảnh & Mục tiêu

Gap có bằng chứng (audit G2 §A, §D, §E):

- Spec §3 tự ghi "KHÔNG lệnh nào trong bảng này tồn tại". rg `gen:(spec-index|schema|zod|routes|tests|session)` trong mọi `package.json`: không thấy.
- Chỉ còn dấu vết: header `@generated from` ở `packages/content-build/src/cli/gen-levels.ts:30` và `packages/shared/tests/quality-rules.test.ts:64`.
- `GenCheckResult` (§8) và `spec-index.json` (§7.1) chưa tồn tại.
- `BR-AIG-06` (cổng so spec↔code) đã chết cùng `packages/gates` (gỡ 2026-08-29).
- Các rule quy trình còn sống (`BR-AIG-01/03/04/05/07/10`) chỉ giữ bằng review.

Mục tiêu: dựng phần pipeline mà người dùng chốt ở S0, bắt đầu từ artefact trung tâm `spec-index.json`, mỗi generator xác định và tái lập được (`BR-AIG-02`).

## 2. Thiết kế

### 2.1 Câu hỏi phải chốt ở S0 (hỏi người dùng)

1. **Phạm vi**: sáu lệnh hay tập con? Đề xuất thứ tự giá trị/rủi ro: `gen:spec-index` → `gen:tests` (`BR-AIG-05`) → `gen:zod` → `gen:routes` → `gen:schema` → `gen:session` (LLM, `BR-AIG-08/09`).
2. **`gen:check` thành cổng?** §10 "Always" đòi chạy trong cổng tự động; CLAUDE.md cấm dựng lại cổng ở `packages/gates` và yêu cầu hỏi trước khi dựng cổng mới. Nếu dựng: đặt ở đâu (`scripts/` hay workspace mới `tests/gates/`), có ca âm, có bậc thang nợ (corpus hiện có route chưa khai trong spec sẽ đỏ hàng loạt).
3. **Chỗ đặt code generator**: workspace mới (vd `packages/codegen`, dependency `catalog:`, `vitest.config.ts` qua `defineWorkspaceTest`, không script `typecheck` riêng) hay trong `scripts/`.
4. **Parser chịu lệch chuẩn tới đâu** (OQ1 spec §11): khoảng 3 spec đang dùng khuôn mục lệch chuẩn (G7 §F: `engine-competency-allocation.md`, `skill-age-progression.md`, `preschool-age-bands.md`) — parser báo lỗi hay bỏ qua?
5. **Cách đối xử code đã viết tay**: không ép tách `.gen.ts`/`.impl.ts` ngược cho code cũ; chỉ áp cho file sinh mới.

Câu trả lời ghi vào spec (§3, §10, §11) **trước** khi code (`BR-AIG-07`).

### 2.2 Kiến trúc (dự kiến, chỉnh theo S0)

- `gen:spec-index`: parse Markdown của `docs/specs/**` (frontmatter, bảng §6 BR, bảng §8 API, khối Gherkin §9, mã lỗi) → `spec-index.json`. Parse xác định, không LLM. Kiểu đầu ra khai tường minh (không `unknown`/`any`), validate bằng Zod.
- Mọi generator đọc `spec-index.json`, không đọc lại Markdown.
- File sinh mang header `@generated from <SPEC-ID>@<sha> by \`pnpm gen:*\`` (`BR-AIG-04`); tách `*.gen.ts` / `*.impl.ts`.
- `gen:tests` chỉ sinh `test.todo` tên = tên scenario (`BR-AIG-05`), không bao giờ test rỗng pass.
- `gen:check` trả `GenCheckResult` (§8), các mức theo §7.4; hash file `.gen.ts` để bắt sửa tay.
- `gen:session` (nếu trong phạm vi): prompt version trong repo (`BR-AIG-08`), output qua kiểm hex literal (`BR-AIG-09`), không merge tự động (`BR-AIG-01`).

## 3. Lát cắt dọc

- **S0 — Chốt phạm vi với người dùng**
  - Trình 5 câu hỏi ở 2.1 kèm đề xuất mặc định.
  - Sửa spec theo câu trả lời (một commit spec riêng); spec vẫn `draft` tới khi xong.
  - Xong khi: spec §3/§10/§11 phản ánh phạm vi đã chốt; các slice dưới được cắt/giữ theo đó.
- **S1 — `gen:spec-index`**
  - Test trước: fixture spec nhỏ trong `tests/**/fixtures/` (đủ 11 mục, có BR, API, Gherkin) → JSON mong đợi; fixture lệch chuẩn → lỗi có tên file/dòng; chạy hai lần → byte giống nhau.
  - Xong khi: chạy trên corpus thật ra `spec-index.json` hợp lệ Zod; spec lệch chuẩn được liệt kê.
- **S2 — `gen:tests`** (`BR-AIG-05`)
  - Test trước: scenario Gherkin → `test.todo("<tên scenario>")`; không sinh `test(…, () => {})`. Gắn scenario `BR-AIG-05` của §9.
  - Xong khi: test xanh.
- **S3 — `gen:zod` + `gen:routes`**
  - Test trước: bảng API fixture → Zod schema + route skeleton có guard, Zod parse cùng file, mã lỗi, `TODO`; header `@generated` đúng (`BR-AIG-04`).
  - Xong khi: skeleton sinh ra qua `pnpm lint` và `typecheck` khi đặt vào thư mục tạm.
- **S4 — `gen:schema`** (nếu trong phạm vi) — Test trước: bảng Data fixture → Drizzle table có `updated_at` (`BR-DM-08`). Không sinh migration tự động.
- **S5 — `gen:check`** (+ cổng nếu S0 cho phép)
  - Test trước: các ca §7.4 — route có trong code không có trong spec → error; file `.gen.ts` bị sửa tay → error (`BR-AIG-04` scenario §9); `test.todo` → warn. Ca âm bắt buộc nếu dựng cổng.
  - Xong khi: `GenCheckResult` đúng §8; nếu là cổng: nối `scripts/check.sh` với bậc thang nợ chỉ giảm.
- **S6 — `gen:session`** (nếu trong phạm vi) — Test trước: output chứa hex literal → bị từ chối (`BR-AIG-09`); prompt đọc từ file trong repo (`BR-AIG-08`).
- **S7 — Nghiệm thu**
  - `rtk proxy pnpm lint`, `rtk proxy pnpm typecheck`, test workspace codegen, `rtk proxy pnpm lint:deps`, `rtk proxy pnpm check:test-ratchet`; nếu có cổng `gen:check`: chạy qua `rtk proxy`.
  - Spec `ai-codegen-pipeline.md`: bỏ `#307` khỏi `open_tasks` + khối "Chưa hoàn thành"; nâng `status` `draft` → `implemented` cho phần đã chốt (phần bị cắt ở S0 đã được xoá/ghi ngưng khỏi spec); `reviewed`. Cập nhật số "124 file" lỗi thời ở §1 nếu còn.
  - Commit vào `main`.
