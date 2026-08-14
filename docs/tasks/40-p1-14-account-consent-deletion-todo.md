# Checklist — Task #40: P1.14 — Account, legal consent singleton, force & deletion

> Kế hoạch: [`40-p1-14-account-consent-deletion-plan.md`](40-p1-14-account-consent-deletion-plan.md).
> **Mở lại 2026-08-14** theo root D12 và `D-QV`–`D-QZ`.
> Các mục baseline đã tick dưới đây là evidence của lần triển khai contract cũ; chúng không chứng
> minh phần singleton/force mới đã hoàn thành.

## Baseline đã hoàn thành trước revision

- [x] Guard recent reauth và danh sách route nhạy cảm (`D-IJ`).
- [x] `/me/settings`: profile, đổi/đặt mật khẩu, email hai bước, notification preferences.
- [x] Withdrawal child-data dùng đường archive chung; consent log INSERT-only theo schema cũ.
- [x] Purge scope ba nhóm, account deletion 30 ngày, cancel và job idempotent.
- [x] Evidence `BR-ACS-*`, baseline `BR-CSM-*`, `BR-ADL-*` và local gate của lần chạy trước.
- [x] Task #17/#23/#39 đã tạo legal/consent version surface lịch sử — **superseded**, phải dọn ở revision này.

## Preflight revision 2026-08-14

- [x] Contract root D12, specs và registry được cập nhật trước code.
- [x] Chốt `D-QV` singleton document, không version.
- [x] Chốt `D-QW` marker toàn cục + audit, không fan-out.
- [x] Chốt `D-QX` gate theo loại + closed rights allow-list.
- [x] Chốt `D-QY` echo marker chống race.
- [x] Chốt `D-QZ` migration bảo toàn trạng thái.
- [ ] Human approve revision và migration plan trước khi sửa schema.
- [ ] Xác nhận legal reviewer/go-live owner theo
  [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) mục 11.

## T1 — Migration và validity primitive

- [ ] Test âm schema còn `policy_version` hoặc thiếu `action`.
- [ ] Test âm app role UPDATE/DELETE được `consent_logs`.
- [ ] Thêm `action = accepted|withdrawn`; map dữ liệu cũ theo `D-QZ`.
- [ ] Tạo đúng ba singleton `consent_requirements`, marker ban đầu NULL.
- [ ] Drop `policy_version` và `child_data_withdrawn` enum value sau backfill.
- [ ] Một primitive tính latest action + marker validity cho mọi caller.
- [ ] DB rỗng, upgrade fixture, rollback local và INSERT-only invariant đều xanh.

## T2 — Legal document current-only

- [ ] Registry code-owned không có `version` hay history snapshot.
- [ ] `/terms`, `/privacy`, `/child-privacy` render current document.
- [ ] Xoá version list API và route/page `/v/{version}`; test 404.
- [ ] `last_updated_on` và review status có gate deploy; deploy không force marker.
- [ ] SEO editor từ chối legal slug ở server.
- [ ] Không tracking bên thứ ba trên mọi legal page.

## T3 — Marker API, registration và User acceptance

- [ ] Guest requirements API trả marker Terms/Privacy, không metadata admin.
- [ ] Registration email echo hai marker trong transaction.
- [ ] Force giữa form đăng ký → 409, không User/log partial.
- [ ] GET User consents trả current document URL, accepted_at, requirement_at, notice, status.
- [ ] POST acceptance echo marker, checkbox tường minh, INSERT `accepted`.
- [ ] Marker đổi giữa form → `CONSENT_REQUIREMENT_CHANGED`, không INSERT.
- [ ] Xoá `CONSENT_VERSION_STALE` khỏi registry/code/test active.

## T4 — Session và child-data gate

- [ ] Terms/Privacy required → product API ngoài allow-list trả 428.
- [ ] Route User mới mặc định bị gate cho tới khi được review vào allow-list.
- [ ] Legal, consent, export, withdrawal, reauth, logout, delete/cancel luôn dùng được.
- [ ] Login/remember/SNS thành công vẫn cấp session, rồi redirect `/consent-required`.
- [ ] `return_to` chỉ phục hồi sau acceptance và phải là path nội bộ hợp lệ.
- [ ] Child-data required chặn create child, play session và telemetry/progress/result mới.
- [ ] Read/correction/archive/export/delete dữ liệu trẻ cũ vẫn dùng được.
- [ ] Session đã start trước force được finish; session kế tiếp bị chặn.

## T5 — User UI

- [ ] `/me/settings/privacy` dùng document singleton và marker status.
- [ ] `/consent-required` hỗ trợ một hoặc nhiều loại required.
- [ ] Checkbox không tick sẵn; không suy consent từ continue/login.
- [ ] Hiện `notice_vi` và full current document; không version number/history/diff giả.
- [ ] 409 marker đổi reload nội dung, không tự retry.
- [ ] Withdrawal/account deletion baseline chạy được khi Terms/Privacy required.

## T6 — Audit và admin force API

- [ ] Manager reauth bằng password hoặc TOTP/mã khôi phục; chỉ Redis session hiện tại được nâng.
- [ ] Session khác và remember restore không nhận `reauthAt` mới.
- [ ] Đăng ký audit action `legal_reconsent_forced`.
- [ ] `content_reviewer` GET/POST đều 403, không lộ affected count.
- [ ] `super_admin` chưa recent reauth → 428; thiếu CSRF → 403.
- [ ] POST nhận đúng một type, `notice_vi` và reason 20–500 ký tự.
- [ ] Bắt buộc confirm deployed, confirm all users và expected marker.
- [ ] DB sinh marker mới lớn hơn marker cũ.
- [ ] Marker + audit cùng transaction; audit fail rollback marker.
- [ ] Không fan-out User/log, không client timestamp, không reset/clear/rollback route.

## T7 — Admin force UI

- [ ] `/legal-consents` chỉ `super_admin` và chỉ đọc metadata/link document.
- [ ] Không editor nội dung, version picker hay chọn User riêng lẻ.
- [ ] Hai input `notice_vi`/reason tách biệt; xác nhận tác động toàn hệ thống.
- [ ] Reauth flow và conflict 409 yêu cầu tải lại, không tự retry.
- [ ] Không nút hạ marker, clear hay rollback.
- [ ] Ghi debt nav sang Task #43.

## T8 — Handoff toàn dự án

- [ ] Task #41 registration SNS echo marker và fail atomically khi force giữa form.
- [ ] Task #41 User cũ forced consent đi `/consent-required` sau SNS login.
- [x] Task #17/#23/#39 được giữ lịch sử; thêm note superseded, không viết lại checkbox cũ.
- [ ] Task #43 thêm legal consent nav chỉ `super_admin` khi admin shell đầy đủ.
- [ ] Master P1.14 giữ unchecked cho tới T9.

## Cổng dừng và promote

- [ ] Không còn `policy_version`, legal version route/API/UI hay `CONSENT_VERSION_STALE` active.
- [ ] Force 100000 User UPDATE đúng một requirement row.
- [ ] Deploy không force; force audit fail không commit marker.
- [ ] Terms/Privacy gate không khoá export/withdraw/delete.
- [ ] Child-data gate không thu mới và không cắt session đang chạy.
- [ ] Registration/acceptance race marker trả 409 atomically.
- [ ] `BR-LGL-*`, `BR-CSM-*`, `BR-LCA-*`, `BR-REG-03`, `BR-LGN-11`, `BR-CDC-07` có test.
- [ ] `pnpm check` xanh.
- [ ] Test unit/integration/E2E liên quan xanh.
- [ ] `pnpm lint:specs && pnpm check:progress` xanh.
- [ ] Human review diff migration, gate và force; không auto-merge.
- [ ] Promote lại spec từ `approved` sang `implemented` sau evidence.
- [ ] Tick P1.14 trong master todo sau cùng.

## Câu hỏi chuyển tiếp

- [ ] Legal reviewer xác nhận wording và nghĩa vụ go-live theo Luật 91/2025/QH15, Nghị định
  13/2023 ở phần còn hiệu lực và văn bản hướng dẫn tại thời điểm phát hành.
- [ ] Hoàn tiền phần gói chưa dùng khi xoá — P2.3.
- [ ] Xoá một hồ sơ trẻ riêng lẻ có cần 30 ngày — P2.
