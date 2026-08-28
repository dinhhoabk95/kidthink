# Checklist — Task #121: Bộ sinh level

> Kế hoạch: [`121-level-generator-kit-plan.md`](121-level-generator-kit-plan.md).
> Chỉ bắt đầu khi [`Task #119`](119-theme-registry-todo.md) WP119.5 đã có vốn từ, và
> [`Task #117`](117-seed-gate-truth-todo.md) đã làm cổng 1 parse contract thật.
> Tuyệt đối: bộ sinh không mở database, không đặt tag ba trục, không viết câu lệnh tiếng Việt
> cho trẻ, không nới cổng cho nội dung sinh máy.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`

## Preflight

- [ ] Xác nhận vốn từ 14 chủ đề đã có (Task #119 WP119.5).
- [ ] Xác nhận cổng 1 đã parse `content_contract` thật (Task #117 WP117.2).
- [ ] Đọc `src/rng/mulberry32.ts` và `deriveStream()`.
- [ ] Đọc `maze-system.ts` và `constraint-system.ts` — chúng kiểm hợp lệ được tới đâu.
- [ ] Sàn bậc 2 đã chốt ở `Q114-2`: ................ level mỗi engine.
- [ ] Người quyết trả lời `Q121-1` (cách sinh) và `Q121-2` (`GT-013` / `GT-015`).
- [ ] Người quyết trả lời `Q121-3` (giá trị `origin`).
- [ ] Chụp danh sách `trạng-thái | tên-test` trước khi sửa.

## WP121.1 — Khung bộ sinh

**Cỡ:** M

- [ ] CLI `gen:levels` nhận `--engine` `--count` `--seed` `--theme` `--band`.
- [ ] Một bộ sinh một engine, kiểu từ `content_contract` qua `z.infer` (`BR-LGK-01`).
- [ ] Nguồn ngẫu nhiên từ `deriveStream()` (`BR-LGK-02`).
- [ ] Mỗi ứng viên `.parse()` gồm `refine` **trước khi** ghi file (`BR-LGK-03`).
- [ ] Ứng viên trượt thì bỏ và **đếm**; con số bỏ in ra cuối lượt.
- [ ] Đầu ra là file seed, không phải bản ghi database (`BR-LGK-04`).
- [ ] Level sinh mang `origin` theo giá trị đã chốt ở `Q121-3` (`BR-LGK-06`).
- [ ] `thinking_tags` `what_tags` `skill_codes` `instruction` `prompt` để **rỗng**.
- [ ] Ca kiểm `BR-LGK-04`: chạy với `DATABASE_URL` trỏ host không tồn tại → vẫn chạy xong.

## WP121.2 — Lô đầu, mười chín engine

**Cỡ:** M · một PR mỗi ba engine

- [ ] `GT-001` `GT-002` `GT-003` — 40 ứng viên mỗi engine; ghi tỉ lệ trượt parse và tỉ lệ trùng.
- [ ] `GT-004` `GT-005` `GT-006`.
- [ ] `GT-007` `GT-008` `GT-010`.
- [ ] `GT-011` `GT-012` `GT-018`.
- [ ] `GT-019` `GT-020` `GT-022`.
- [ ] `GT-023` `GT-025` `GT-026`.
- [ ] `GT-027`.
- [ ] Tám engine ngoài lô đầu giữ nguyên: `GT-009` `GT-013` `GT-014` `GT-015` `GT-016` `GT-017` `GT-021` `GT-024`.
- [ ] Bảng tỉ lệ trùng theo engine — trả lời `Q121-4`.

## WP121.3 — Bước người đọc

**Cỡ:** S · quy trình

- [ ] Mẫu mô tả PR: ai đọc, bao nhiêu ứng viên bị bỏ (`BR-LGK-07`).
- [ ] Luật: bỏ 0 trên 40 → PR trả lại.
- [ ] `instruction` và `prompt` viết tay (`BR-LGK-08`).
- [ ] Tag ba trục gắn tay (`BR-LGK-10`).
- [ ] Level đi qua đủ tám cổng, không nới (`BR-LGK-05`).

## WP121.4 — Cổng cho chính bộ sinh

**Cỡ:** S

- [ ] Ca âm: `gen:levels` mở database → đỏ.
- [ ] Ca âm: chạy hai lần cùng seed cho kết quả khác → đỏ.
- [ ] Ca âm: ứng viên không parse mà vẫn ghi file → đỏ.
- [ ] Ca âm: bộ sinh đặt tag → đỏ.
- [ ] Ca âm: level sinh mang `origin` bằng `human` → đỏ.
- [ ] Fixture ở `tests/**/fixtures/`, không viết thẳng vào file test.

## Nghiệm thu

- [ ] `gen:levels --engine GT-001 --count 40 --seed 42` chạy hai lần, kết quả **trùng byte**.
- [ ] Chạy với `DATABASE_URL` host không tồn tại — vẫn chạy xong.
- [ ] Mọi file sinh ra parse được `content_contract`.
- [ ] File sinh ra có năm trường người-viết để rỗng.
- [ ] `origin` phân biệt được với `human`, giữ nguyên sau khi người sửa.
- [ ] Năm ca âm đều đỏ vì đúng lý do.
- [ ] Bảng tỉ lệ trùng theo engine có trong todo.
- [ ] `level-generator-kit.md` mang `status: implemented`.
- [ ] `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.
- [ ] Mở PR cho người review diff, không tự merge.

## Ghi chép khi làm

- Cách sinh đã chốt: ................
- Tỉ lệ trượt parse theo engine: ................
- Tỉ lệ trùng theo engine (thước đo vốn từ): ................
- Chủ đề cần mở rộng vốn từ: ................
