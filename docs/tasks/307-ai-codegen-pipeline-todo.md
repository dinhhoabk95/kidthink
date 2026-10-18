# Task #307 Todo: Pipeline sinh code từ spec (AI Codegen Pipeline)

Plan: [`307-ai-codegen-pipeline-plan.md`](307-ai-codegen-pipeline-plan.md).
Spec: [`ai-codegen-pipeline.md`](../specs/01-platform/ai-codegen-pipeline.md) (`draft`) §3, §7, §8, `BR-AIG-01`…`BR-AIG-10`.

---

## S0 — Chốt phạm vi với người dùng
- [ ] Hỏi: sáu lệnh hay tập con, thứ tự
- [ ] Hỏi: dựng `gen:check` thành cổng không, đặt ở đâu
- [ ] Hỏi: chỗ đặt code generator (workspace mới hay `scripts/`)
- [ ] Hỏi: parser xử lý spec lệch khuôn ra sao (OQ1)
- [ ] Sửa spec §3/§10/§11 theo câu trả lời (commit spec riêng)

## S1 — `gen:spec-index`
- [ ] Fixture spec trong `tests/**/fixtures/` + JSON mong đợi
- [ ] Test đỏ: parse đúng, lỗi có file/dòng, chạy lại byte giống nhau
- [ ] Parser + Zod schema đầu ra
- [ ] Chạy trên corpus thật, liệt kê spec lệch khuôn

## S2 — `gen:tests` (`BR-AIG-05`)
- [ ] Test đỏ: chỉ sinh `test.todo` tên = scenario
- [ ] Generator

## S3 — `gen:zod` + `gen:routes` (`BR-AIG-04`)
- [ ] Test đỏ schema + skeleton route + header `@generated`
- [ ] Generator; skeleton qua lint/typecheck ở thư mục tạm

## S4 — `gen:schema` (nếu trong phạm vi)
- [ ] Test đỏ bảng Drizzle có `updated_at`
- [ ] Generator

## S5 — `gen:check`
- [ ] Test đỏ các ca §7.4 (error/warn), hash `.gen.ts`
- [ ] Trả `GenCheckResult`
- [ ] (Nếu được duyệt) nối cổng + ca âm + bậc thang nợ

## S6 — `gen:session` (nếu trong phạm vi)
- [ ] Test đỏ hex literal bị từ chối (`BR-AIG-09`), prompt trong repo (`BR-AIG-08`)
- [ ] Generator

## S7 — Nghiệm thu
- [ ] `rtk proxy pnpm lint` exit 0
- [ ] `rtk proxy pnpm typecheck` exit 0
- [ ] Test workspace codegen + `lint:deps` xanh
- [ ] `rtk proxy pnpm check:test-ratchet` xanh
- [ ] Bỏ `#307` khỏi `open_tasks` + khối "Chưa hoàn thành"; nâng `draft` → `implemented`; `reviewed`
- [ ] Commit vào `main`
