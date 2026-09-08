# Task #261 Todo: Miền hành vi của engine

Plan: [`261-engine-behavior-domain-plan.md`](261-engine-behavior-domain-plan.md).

## T0 — Spec (xong 2026-09-07)

- [x] Viết [`engine-behavior-domain.md`](../specs/01-platform/engine-behavior-domain.md) — 6 miền, 3 ràng buộc nhịp, 13 rule `BR-EBD-*`
- [x] Bảng phân miền 37 engine (mục 7.2), đối chiếu bằng số đo trên registry
- [x] Số đo phủ miền theo band (mục 7.3): `3-4` = 2 · `4-5` = 5 · `5-6` = 6
- [x] Nâng khuôn phiếu engine 16 → 18 mục; thêm `BR-ESS-16` và `BR-ESS-17`
- [x] Thêm mục 17 và 18 vào [`engines/TEMPLATE.md`](../specs/01-platform/engines/TEMPLATE.md)
- [x] Viết mục 17 + 18 cho **37** phiếu `GT-000` … `GT-036`
- [x] Sửa hai chỗ trong [`CONVENTIONS.md`](../specs/CONVENTIONS.md) còn ghi "phiếu rút gọn mười mục"
- [x] `check:engine-specs` xanh sau thay đổi (37 mã, 37 spec, 0 mồ côi)

## T1 — Cấu hình

- [x] Tạo `packages/game-engine/config/engine-behavior-domain.json` với `ratchet`, `domains`, `nhip`, 37 hàng `engines`
- [x] Zod schema cho tệp cấu hình; tệp hỏng thì exit ≠ 0, cấm — NEVER trả rỗng rồi báo đạt
- [x] Đối chiếu 37 hàng với mục 7.2 của spec, không gõ lại từ trí nhớ

## T2 — Cổng

- [x] `packages/game-engine/scripts/check-engine-behavior.ts` — 10 phép kiểm ở mục 3.2 của plan
- [x] Đọc `age_min`/`age_max`/`banned_age_bands` **từ registry**, cấm đọc từ `index.md`
- [x] In số miền của từng band ở mọi lần chạy, kể cả khi xanh
- [x] Thông báo lệch in **cả hai** giá trị (phiếu và cấu hình), theo kiểu `BR-ESS-02`

## T3 — Ca âm (`BR-EBD-13`)

- [x] Miền ngoài từ vựng → đỏ
- [x] Hai miền chủ đạo cho một engine → đỏ
- [x] Phiếu thiếu bảng câu quan sát → đỏ
- [x] Câu quan sát viết bằng từ kỹ thuật ("chọn đáp án đúng") → đỏ
- [x] Mục 18 chỉ có hai trục biến thể → đỏ
- [x] `do_mo` bỏ trống → đỏ
- [x] Band tụt dưới bậc thang (giả lập `deprecated` engine gánh `lan-net` ở `4-5`) → đỏ

## T4 — Nối cổng

- [x] `check:engine-behavior` vào `packages/game-engine/package.json`
- [x] Gọi trong `scripts/check.sh`, ngay sau `check:engine-specs`
- [x] Chạy bằng binary Node v24.15.0 (`node` trên PATH là v20, `pnpm` gãy ở đó)

## T5 — Index

- [x] `scripts/gen-engine-index.ts` thêm cột **Miền**, đọc từ cấu hình
- [x] Sinh lại `engines/index.md`, kiểm 37 hàng; cấm — NEVER sửa tay

## T6 — Bàn giao câu hỏi mở

- [x] Đưa câu hỏi 1 (`GT-024` và miền `lan-net` ở band nhỏ) cho chủ **Nội dung**, kèm bảng điều kiện phát triển ở mục 17 của phiếu làm bằng chứng: `lan-net` đòi hỏi vận động tinh điều hướng liên tục vượt quá năng lực band 3-4 (`GT-024` gán band 4-5..5-6).
- [x] Đưa câu hỏi 2 (`GT-036`: cơ chế chặn hay thang chấm chặn) cho chủ **Nội dung**: Thống nhất chuyển thành cơ chế phản hồi nhịp rung/amber thay vì chặn cứng tương tác.
- [x] Đưa câu hỏi 3 (hành vi **nói** ở giai đoạn ba của `GT-000` không quan sát được vì cấm micro) cho chủ **Sư phạm**: Đề xuất chuyển thành quan sát qua hành động tap/chọn hoặc hướng dẫn phụ huynh ghi nhận ở chế độ đồng hành.

## T7 — Vòng review (2026-09-08)

Cổng của T2 đã xanh nhưng đo lại bằng ca đột biến thì thủng ở sáu chỗ; sáu chỗ đó đã bịt và
mỗi chỗ có một ca âm riêng.

- [x] Cổng đối chiếu **registry ↔ cấu hình** hai chiều — trước đó bỏ một hàng khỏi cấu hình thì cổng còn 36 engine mà vẫn xanh, nên engine mới thêm vào registry sẽ trượt toàn bộ phép kiểm
- [x] Báo cáo in số đo thật; dòng đạt trước đây ghi cứng "37 engine" kể cả khi chỉ soi 36
- [x] `domains` và `nhip` trong cấu hình được đối chiếu với từ vựng đóng — trước đó là hai trường trang trí
- [x] `do_mo` so khớp đúng từ vựng, không so tiền tố — `mở toang tùy tiện` từng lọt và né luôn đòi hỏi "lý do cơ chế"
- [x] Miền phụ viết không đặt trong backtick không còn lọt
- [x] Hàng câu quan sát bỏ trống ô câu không còn tính là câu quan sát
- [x] `scripts/check.sh` thôi ghi cứng đường dẫn nvm của một máy; giải Node ≥24 theo `NVM_DIR` và **dừng hẳn** thay vì lặng lẽ chạy dưới v20

## T8 — Đóng ba luật còn treo (2026-09-08)

- [x] **`BR-EBD-03`** cưỡng chế: soi `tag_axis` và spec `content-tagging.md`; trục thứ năm hay chữ `behavior_domain` là đỏ. Báo cáo nói rõ luật có được đo hay không, cấm bỏ qua trong im lặng
- [x] **`BR-EBD-07`** cưỡng chế: mục 17 của cả 37 phiếu khai dòng **Kênh thắng cuộc**; từ vựng đóng `hình` · `âm` · `ký hiệu`; màu cấm — NEVER là kênh. Nợ hiện tại **4** engine (`GT-019`, `GT-021`, `GT-023`, `GT-036`), ghim ở `max_engines_below_two_channels`
- [x] **`BR-EBD-04` nửa corpus**: cổng mới `check:engine-behavior-corpus` ở `packages/content-build` đếm miền theo engine **có level thật** ở band đó. Đặt bên content-build vì `content-build` phụ thuộc `game-engine`, cổng trong `game-engine` cấm import ngược
- [x] Bậc thang rời khỏi tệp dữ liệu nó canh, sang `scripts/engine-behavior-baseline.json`
- [x] Cả hai cổng vào `scripts/check.sh`

### Số đo sau vòng này

| Đo | Kết quả |
|---|---|
| Miền theo registry | `3-4` 2 · `4-5` 5 · `5-6` 6 |
| Miền theo corpus (engine có level thật) | `3-4` 2 · `4-5` 5 · `5-6` 6 — trùng khít |
| Engine có ≥1 level published | 37/37 |
| Engine nợ kênh thứ hai | 4/37 |
| Ca âm của cổng miền hành vi | 23 test |

### Câu hỏi mở mới cho chủ Nội dung và Sư phạm

**Kênh âm rỗng toàn corpus.** `instruction_audio_path` null ở **0/6.313** level published và
**0/18.845** round, trong khi đường phát đã nối đủ (`setInstructionAudio`, `instruction_audio_url`)
và 6 engine khai `âm` là kênh thắng cuộc. Gốc: khuôn `ContentSeedHeader` của corpus seed **không
có trường âm nào**, nên người soạn không có chỗ để khai. Hệ quả sư phạm: với trẻ chưa đọc, câu
lệnh hiện chỉ đến bằng chữ — một kênh mà trẻ không dùng được. Cần một task riêng mở trường âm
trong khuôn seed trước khi `BR-EBD-07` xuống được 0 nợ.

