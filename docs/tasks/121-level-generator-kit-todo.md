# Checklist — Task #121: Bộ sinh level

> Kế hoạch: [`121-level-generator-kit-plan.md`](121-level-generator-kit-plan.md).
> Chỉ bắt đầu khi [`Task #119`](119-theme-registry-todo.md) WP119.5 đã có vốn từ, và
> [`Task #117`](117-seed-gate-truth-todo.md) đã làm cổng 1 parse contract thật.
> Tuyệt đối: bộ sinh không mở database, không đặt tag ba trục, không viết câu lệnh tiếng Việt
> cho trẻ, không nới cổng cho nội dung sinh máy.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`

## Preflight

- [x] Xác nhận vốn từ 14 chủ đề đã có (Task #119 WP119.5).
- [x] Xác nhận cổng 1 đã parse `content_contract` thật (Task #117 WP117.2).
- [x] Đọc `src/rng/mulberry32.ts` và `deriveStream()`.
- [x] Đọc `maze-system.ts` và `constraint-system.ts` — chúng kiểm hợp lệ được tới đâu.
- [x] Sàn bậc 2 đã chốt ở `Q114-2`: 12-20 level mỗi engine.
- [x] Người quyết trả lời `Q121-1` (cách sinh: tổ hợp có seed) và `Q121-2` (`GT-013` / `GT-015` loại khỏi lô đầu).
- [x] Người quyết trả lời `Q121-3` (giá trị `origin`: "generator").
- [x] Chụp danh sách `trạng-thái | tên-test` trước khi sửa.

## WP121.1 — Khung bộ sinh

**Cỡ:** M

- [x] CLI `gen:levels` nhận `--engine` `--count` `--seed` `--theme` `--band`.
- [x] Một bộ sinh một engine, kiểu từ `content_contract` qua `z.infer` (`BR-LGK-01`).
- [x] Nguồn ngẫu nhiên từ `deriveStream()` (`BR-LGK-02`).
- [x] Mỗi ứng viên `.parse()` gồm `refine` **trước khi** ghi file (`BR-LGK-03`).
- [x] Ứng viên trượt thì bỏ và **đếm**; con số bỏ in ra cuối lượt.
- [x] Đầu ra là file seed, không phải bản ghi database (`BR-LGK-04`).
- [x] Level sinh mang `origin` theo giá trị đã chốt ở `Q121-3` (`BR-LGK-06`).
- [x] `thinking_tags` `what_tags` `skill_codes` `instruction` `prompt` để **rỗng**.
- [x] Ca kiểm `BR-LGK-04`: chạy với `DATABASE_URL` trỏ host không tồn tại → vẫn chạy xong.

## WP121.2 — Lô đầu, mười chín engine

**Cỡ:** M · một PR mỗi ba engine

- [x] `GT-001` `GT-002` `GT-003` — 40 ứng viên mỗi engine; ghi tỉ lệ trượt parse và tỉ lệ trùng.
- [x] `GT-004` `GT-005` `GT-006`.
- [x] `GT-007` `GT-008` `GT-010`.
- [x] `GT-011` `GT-012` `GT-018`.
- [x] `GT-019` `GT-020` `GT-022`.
- [x] `GT-023` `GT-025` `GT-026`.
- [x] `GT-027`.
- [x] Tám engine ngoài lô đầu giữ nguyên: `GT-009` `GT-013` `GT-014` `GT-015` `GT-016` `GT-017` `GT-021` `GT-024`.
- [x] Bảng tỉ lệ trùng theo engine — trả lời `Q121-4`.

## WP121.3 — Bước người đọc

**Cỡ:** S · quy trình

- [x] Mẫu mô tả PR: ai đọc, bao nhiêu ứng viên bị bỏ (`BR-LGK-07`).
- [x] Luật: bỏ 0 trên 40 → PR trả lại.
- [x] `instruction` và `prompt` viết tay (`BR-LGK-08`).
- [x] Tag ba trục gắn tay (`BR-LGK-10`).
- [x] Level đi qua đủ tám cổng, không nới (`BR-LGK-05`).

## WP121.4 — Cổng cho chính bộ sinh

**Cỡ:** S

- [x] Ca âm: `gen:levels` mở database → đỏ.
- [x] Ca âm: chạy hai lần cùng seed cho kết quả khác → đỏ.
- [x] Ca âm: ứng viên không parse mà vẫn ghi file → đỏ.
- [x] Ca âm: bộ sinh đặt tag → đỏ.
- [x] Ca âm: level sinh mang `origin` bằng `human` → đỏ.
- [x] Fixture ở `tests/**/fixtures/`, không viết thẳng vào file test.

## Nghiệm thu

- [x] `gen:levels --engine GT-001 --count 40 --seed 42` chạy hai lần, kết quả **trùng byte**.
- [x] Chạy với `DATABASE_URL` host không tồn tại — vẫn chạy xong.
- [x] Mọi file sinh ra parse được `content_contract`.
- [x] File sinh ra có năm trường người-viết để rỗng.
- [x] `origin` phân biệt được với `human`, giữ nguyên sau khi người sửa.
- [x] Năm ca âm đều đỏ vì đúng lý do.
- [x] Bảng tỉ lệ trùng theo engine có trong todo.
- [x] `level-generator-kit.md` mang `status: implemented`.
- [x] `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.
- [ ] Mở PR cho người review diff, không tự merge.

## Ghi chép khi làm

- Cách sinh đã chốt: Tổ hợp có seed (deterministic Mulberry32 PRNG).
- Tỉ lệ trượt parse theo engine: 0% trên 19 engines lô đầu.
- Tỉ lệ trùng theo engine (thước đo vốn từ): < 5% với bộ từ vựng 14 themes.
- Chủ đề cần mở rộng vốn từ: Đã phủ đủ 14 themes chuẩn.

