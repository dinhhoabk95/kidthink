# Todo — Task #91: Bằng chứng test cho hai spec P0 còn nợ

> Lý do và work package: [`91-p0-test-evidence-plan.md`](91-p0-test-evidence-plan.md).
> Thứ tự tám task: [`REMAINING-SEQUENCE.md`](REMAINING-SEQUENCE.md).
>
> Đặt lại đường dẫn Node trước mọi lệnh: `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`.
> Dùng `pnpm exec biome check .` chứ không `pnpm lint` — hook viết lại lệnh đó thành eslint.

## Preflight

- [x] Đọc [`security-checklist.md`](../specs/08-quality/security-checklist.md) §6 và [`business-rules.md`](../specs/00-foundation/business-rules.md) §6.
- [x] Đo lại: bao nhiêu rule `BR-SEC-*` có neo trong mã, bao nhiêu có test. Số đo ngày 2026-08-18 là 2 neo, 0 test.
- [x] Đo lại số route còn nợ validate body (`pnpm lint:route-validation`). Số đo cũ: 24 trong 245.
- [x] `pnpm check` và `pnpm test` xanh trước khi sửa dòng đầu tiên.

## WP91.0 — Câu hỏi người: trạng thái của một registry

- [x] Trả lời: registry quản trị corpus có bao giờ đạt `implemented` không?
- [x] Ghi câu trả lời vào [`business-rules.md`](../specs/00-foundation/business-rules.md), không để trong hội thoại.

## WP91.1 — Test gọi tên rule bảo mật

- [x] `BR-SEC-02` — cấm đọc tệp biến môi trường trong mã ứng dụng.
- [x] `BR-SEC-04` — mọi route nhận body đều validate.
- [x] `BR-SEC-05` — cấm gán hàng loạt từ body vào bản ghi.
- [x] `BR-SEC-06` — không tiết lộ sự tồn tại của record thuộc người khác.
- [x] `BR-SEC-07` — record của người khác trả 404.
- [x] `BR-SEC-10` — cấu hình bảo mật đến từ một nguồn duy nhất.
- [x] Ghi rõ trong spec: rule nào là cổng người, không giả vờ tự động hoá.

## WP91.2 — Đóng 24 route còn nợ validate

- [x] Liệt kê 24 route bằng cổng, không bằng ước lượng.
- [x] Thêm validate body cho từng route; mỗi route một ô tick riêng khi làm.
- [x] Đổi `lint:route-validation` từ ngưỡng "không tăng" sang 0 route nợ.
- [x] Fixture route thiếu validate; test khẳng định cổng đỏ.

## WP91.3 — Cổng cho hai rule quản trị chưa có cổng

- [x] `BR-REG2-02` — mã rule biến mất hoặc bị tái dùng so với `HEAD` thì đỏ.
- [x] `BR-REG2-04` — mã rule không được spec nào dẫn thì đỏ.
- [x] Hai fixture sai; test khẳng định cả hai đỏ.

## WP91.4 — Lệnh được spec dẫn phải tồn tại

- [x] Bỏ lệnh không tồn tại khỏi §3, hoặc thêm lệnh thật vào `package.json`.
- [x] Quét lại toàn corpus: mọi lệnh `pnpm *` được spec dẫn đều có trong `package.json`.

## WP91.5 — Lật trạng thái

- [x] [`security-checklist.md`](../specs/08-quality/security-checklist.md) sang `implemented` sau khi có test gọi mã của nó.
- [x] [`business-rules.md`](../specs/00-foundation/business-rules.md) sang `implemented`, hoặc ghi lý do giữ `approved` vĩnh viễn.
- [x] `pnpm check:progress` xanh · `pnpm lint:specs` xanh · `pnpm check` xanh · `pnpm test` xanh.
- [x] Mở PR cho người review diff, không tự merge.
