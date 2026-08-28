# Checklist — Task #118: Bốn mươi hai level gắn band mà engine cấm

> Kế hoạch: [`118-band-violation-cleanup-plan.md`](118-band-violation-cleanup-plan.md).
> Chỉ bắt đầu khi [`Task #117`](117-seed-gate-truth-todo.md) đã thêm phép kiểm band vào cổng 5.
> Tuyệt đối: không `UPDATE` bản published, không nới `banned_age_bands`, không chọn đường A/B
> theo cảm tính từng level.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`

## Preflight

- [ ] Liệt kê engine có `banned_age_bands`: kỳ vọng `GT-002` `GT-004` `GT-006` `GT-024` `GT-026` `GT-027`.
- [ ] Đo phân bố level vi phạm **theo từng engine**, không dùng con số tổng 42.
- [ ] Xác nhận cổng 5 đã có phép kiểm band ở chế độ báo cáo.
- [ ] Chụp danh sách `trạng-thái | tên-test` trước khi sửa.
- [ ] Người quyết chốt luật phân loại `Q118-1`.
- [ ] Người quyết trả lời `Q118-2`: ngân sách level thay thế thuộc task nào.

## WP118.1 — Đo lại và phân loại

**Cỡ:** S · không sửa dữ liệu

- [ ] Bảng: mã level · engine · band hiện tại · band engine cho phép · đường A hay B · lý do.
- [ ] Áp luật `Q118-1` đều cho mọi level, không ngoại lệ không ghi lý do.
- [ ] 15 màn `GT-006` — kiểm riêng, kỳ vọng phần lớn thuộc đường B.
- [ ] Người quyết duyệt bảng. Không sửa bản ghi nào trước chữ ký.

## WP118.2 — Luật sửa, viết một lần cho 27 task engine

**Cỡ:** S · không sửa bản ghi nào

- [ ] Viết luật đường A: INSERT version mới, chỉ đổi band **lên**, bản cũ không chạm.
- [ ] Viết luật đường B: `archived` bằng version mới, cấm xoá, số thay thế ≥ số archive.
- [ ] Ghi rõ: level thay thế cộng vào `WPn.5` của task engine đó, không đếm hai lần.
- [ ] Xác nhận sáu engine có `banned_age_bands`: `GT-002` `GT-004` `GT-006` `GT-024` `GT-026` `GT-027`.
- [ ] 21 engine còn lại chỉ đo và ghi `out_of_band_count` = 0 ở `WPn.4`.

## WP118.3 — Theo dõi và đóng nợ

**Cỡ:** S · không sửa bản ghi nào

- [ ] Bảng 42 level giao cho sáu task engine: mã · engine · band hiện tại · band cho phép · đường A/B.
- [ ] Bậc thang tổng `out_of_band_count`: chỉ giảm, tăng là đỏ.
- [ ] Theo dõi từng task engine merge; ghi con số sau mỗi lần.

## WP118.4 — Bật chặn

**Cỡ:** S

- [ ] Phép kiểm band ở cổng 5 chuyển từ báo cáo sang **chặn**.
- [ ] Ca âm: gắn một level vào band engine cấm → cổng đỏ. Hoàn tác sau khi ghi bằng chứng.
- [ ] Bật `BR-ECD-13`.

## Nghiệm thu

- [ ] `pnpm --filter @mindkid/db seed:report` in `0 level ngoài band engine`.
- [ ] Ca âm band làm cổng 5 đỏ.
- [ ] Không bản ghi published nào bị `UPDATE` hoặc `DELETE`.
- [ ] Mọi level đường B có bản thay thế; sàn chiều sâu engine không tụt.
- [ ] Bảng phân loại WP118.1 có chữ ký người duyệt.
- [ ] `pnpm --filter @mindkid/db test` xanh; danh sách test trùng khít trừ test mới.
- [ ] `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.
- [ ] Mở PR cho người review diff, không tự merge.

## Ghi chép khi làm

- Phân bố vi phạm theo engine: ................
- Luật phân loại đã chốt: ................
- Số level đi đường A / đường B: ................
- Số level phải soạn, đã chuyển sang ngân sách Task #122: ................
