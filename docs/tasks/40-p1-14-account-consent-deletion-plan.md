# Kế hoạch — Task #40: P1.14 — Account, legal consent singleton, force & deletion

> Viết 2026-08-10; **thiết kế lại 2026-08-14** theo root D12.
> Bước sở hữu: **P1.14** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu chính: [`legal-pages.md`](../specs/02-public/legal-pages.md) ·
> [`consent-management.md`](../specs/03-account/consent-management.md) ·
> [`legal-consent-admin.md`](../specs/06-admin/legal-consent-admin.md) ·
> [`account-settings.md`](../specs/03-account/account-settings.md) ·
> [`account-deletion.md`](../specs/03-account/account-deletion.md).

## Tóm tắt

Task #40 đã hoàn tất account settings, withdrawal và deletion theo contract cũ có
`policy_version`. Quyết định sản phẩm mới bỏ toàn bộ policy version: Terms, Privacy và
Child Privacy là các document singleton trong code. Khi nội dung cần đổi, đội sửa code qua PR;
deploy tự nó không hỏi lại. Sau khi xác nhận bản mới đã qua legal review và deploy,
`super_admin` có thể force một loại bằng cách dịch marker toàn cục và ghi audit.

Revision này **giữ nguyên evidence của phần account/deletion đã hoàn thành**, nhưng mở lại
P1.14 cho migration consent, gate User, admin force và dọn bề mặt version cũ. Các quyết định
`D-IH` và `D-II` của bản kế hoạch 2026-08-10 bị thay thế bởi `D-QV`–`D-QZ` dưới đây; không dùng
`summary_vi`, version URL hay `CONSENT_VERSION_STALE` cho legal consent nữa.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái cần | Ghi chú |
|---|---|---|
| Account settings, withdrawal, deletion baseline | Đã có từ lần chạy Task #40 đầu | Không viết lại; chỉ sửa integration bị contract mới tác động |
| `LEGAL-PAGES` | P1.13 đã có code | Phải chuyển từ versioned sang current-only |
| `AUDIT-LOG` · `ADMIN-AUTH` | P0 | Force cần action mới, role `super_admin`, recent reauth |
| `CHILD-DATA-COMPLIANCE` | P0 | Consent log INSERT-only và closed child-data boundary |
| `LOGIN-AND-SESSION` · `REGISTRATION` | P0 | Cần marker gate và optimistic echo khi đăng ký |
| `SOCIAL-LOGIN` | P1.15 | Task #41 nhận handoff marker; không kéo OAuth implementation vào Task #40 |

## 1. Outcome đo được

- Mỗi legal slug chỉ có một document hiện hành; route/API/version picker cũ trả 404 hoặc bị xoá.
- `consent_logs` chỉ có `consent_type` + `action` + evidence; không có `policy_version`.
- `consent_requirements` luôn có đúng ba singleton row và không chứa User list hay document body.
- Deploy document không đổi trạng thái User. Chỉ force có recent reauth mới dịch marker.
- Terms/Privacy force chặn product access nhưng luôn giữ legal, consent, export, reauth, logout
  và account deletion.
- Child-data force dừng profile/session/learning-data mới, cho phiên đang chạy hoàn tất và giữ
  quyền đọc, sửa đúng, archive, export, xoá.
- Registration và acceptance trả 409 nếu marker đổi sau khi form được tải.
- Force ghi `legal_reconsent_forced` cùng transaction; không rollback/clear marker.

## 2. Quyết định

**D-QV — legal document là singleton code-owned, không policy version.** `/terms`, `/privacy`
và `/child-privacy` luôn render bản hiện hành. Git giữ lịch sử authoring; product không có URL,
API, schema, selector hay diff version. Admin không sửa document.

**D-QW — force dùng marker toàn cục, không fan-out.** Mỗi `consent_type` có một
`reconsent_required_at`. Force UPDATE đúng một singleton và INSERT audit trong cùng transaction;
cấm UPDATE User hay consent log hàng loạt. Deploy, migration và feature flag không auto-force.

**D-QX — gate theo hậu quả của từng loại.** Terms/Privacy áp deny-by-default cho product route,
trừ allow-list quyền dữ liệu đóng. Child-data chỉ chặn tạo profile, play session và learning-data
mới; không chặn read/correction/archive/export/delete và không cắt session đã mở trước marker.

**D-QY — User phải echo marker đã xem.** Registration email, màn hình SNS và POST acceptance gửi
lại `requirement_at`. Server khoá requirement trong transaction; khác giá trị thì 409
`CONSENT_REQUIREMENT_CHANGED`, không ghi partial record.

**D-QZ — migration bảo toàn trạng thái đang có.** Migration đặc quyền:

1. thêm `action`;
2. map `terms|privacy|child_data` cũ thành `accepted`;
3. map `child_data_withdrawn` thành `{consent_type:'child_data', action:'withdrawn'}`;
4. tạo ba requirement row với marker NULL để không force vô ý;
5. drop `policy_version` và enum value cũ;
6. khôi phục quyền application INSERT-only và chạy invariant test.

Cutover không được tự dịch marker. Muốn hỏi lại sau deploy là một thao tác admin riêng.

## 3. Đồ thị increment

```text
T1 migration + consent validity query (D-QZ)
 ├─→ T2 legal registry/routes current-only (D-QV)
 ├─→ T3 guest marker + registration + User acceptance API (D-QY)
 │    └─→ T4 session/child gate + closed rights allow-list (D-QX)
 │          └─→ T5 User UI /me/settings/privacy + /consent-required
 └─→ T6 audit action + admin force API (D-QW)
       └─→ T7 admin force UI
T3 + T4 ─→ T8 Task #41 SNS handoff
T1…T8 ──→ T9 evidence, gates, promote
```

## 4. Task breakdown

### Task 1 — Migration và validity primitive

- [ ] Viết test âm trước: schema còn `policy_version`, thiếu một singleton, hoặc app role UPDATE
  được log đều đỏ.
- [ ] Implement migration `D-QZ`; kiểm dữ liệu cũ gồm chuỗi accepted → withdrawn → accepted.
- [ ] Một primitive dùng chung trả latest action, accepted_at, requirement_at và trạng thái.
- [ ] Clock so sánh ở DB; marker NULL giữ acceptance hiện có hợp lệ.
- [ ] Migration upgrade/rollback local và DB rỗng đều xanh; rollback không chạy ngoài local.

**Cỡ:** M · **Phụ thuộc:** schema identity hiện tại.

### Task 2 — Legal document current-only

- [ ] Registry code-owned có `slug`, `title`, `last_updated_on`, sections và review status; không
  có `version`, version list hay snapshot history.
- [ ] Chỉ giữ current page/API; mọi `/v/{version}` và versions endpoint bị xoá, test 404.
- [ ] `/terms`, `/privacy`, `/child-privacy` không tracking bên thứ ba.
- [ ] SEO editor từ chối legal slug ở server.
- [ ] Deploy document không đụng `consent_requirements`.

**Cỡ:** M · **Phụ thuộc:** T1 chỉ cho test integration; có thể làm song song phần registry.

### Task 3 — Marker API, registration và acceptance

- [ ] `GET /api/guest/consent-requirements` chỉ trả marker Terms/Privacy.
- [ ] Registration email echo hai marker; force giữa lúc form mở trả 409 và không tạo User/log.
- [ ] `GET/POST /api/users/consents` theo contract singleton; POST echo marker và INSERT accepted.
- [ ] `CONSENT_VERSION_STALE` bị xoá; chỉ dùng `CONSENT_REQUIREMENT_CHANGED` cho race marker.
- [ ] Acceptance response không chứa policy version, document history hay reason nội bộ.

**Cỡ:** M · **Phụ thuộc:** T1, T2.

### Task 4 — Gate Terms/Privacy và Child-data

- [ ] Viết test deny-by-default: route User mới ngoài allow-list bị 428 khi Terms/Privacy required.
- [ ] Allow-list đóng đúng [`consent-management.md`](../specs/03-account/consent-management.md)
  mục 7.4; export, withdrawal, reauth, logout và
  account deletion vẫn chạy.
- [ ] Login/password, remember và SNS session đều redirect `/consent-required` trước `return_to`.
- [ ] Child-data guard chặn create child, play session và telemetry/progress/result mới; cho phép
  correction/archive/export/delete dữ liệu cũ.
- [ ] Session bắt đầu trước marker vẫn ingest kết quả cuối; session tiếp theo bị chặn.

**Cỡ:** M · **Phụ thuộc:** T1, T3.

### Task 5 — User UI

- [ ] `/me/settings/privacy` hiện loại, document current, accepted_at, status và `notice_vi`.
- [ ] `/consent-required` checkbox không tick sẵn, hỗ trợ nhiều loại required và safe `return_to`.
- [ ] 409 marker đổi làm reload nội dung/trạng thái, không tự retry acceptance.
- [ ] Không version number, version history hay diff giả.
- [ ] Withdrawal/deletion flow baseline tiếp tục chạy khi Terms/Privacy required.

**Cỡ:** M · **Phụ thuộc:** T3, T4.

### Task 6 — Audit action và admin force API

- [ ] `POST /api/managers/auth/reauth` xác minh password hoặc TOTP/mã khôi phục, chỉ cập nhật
  Redis session hiện tại; session khác và remember restore không được nâng mốc.
- [ ] Đăng ký action `legal_reconsent_forced`; reason 20–500 ký tự, không PII trẻ.
- [ ] GET trạng thái chỉ `super_admin`; `content_reviewer` nhận 403 và không thấy affected count.
- [ ] POST force đòi recent reauth, CSRF, confirm deployed/all users và expected marker.
- [ ] Marker do DB sinh, lớn hơn marker cũ; marker + audit commit/rollback cùng nhau.
- [ ] Không route clear, rollback, giảm marker; không client timestamp; không fan-out.

**Cỡ:** M · **Phụ thuộc:** T1, audit/admin auth.

### Task 7 — Admin force UI

- [ ] `/legal-consents` chỉ đọc metadata document và link toàn văn; không editor.
- [ ] Chọn đúng một loại; `notice_vi` và reason tách biệt; hai xác nhận tác động rõ ràng.
- [ ] Recent reauth và conflict 409 có recovery rõ; không tự retry force.
- [ ] UI không có reset/clear/rollback và không cho chọn User riêng.
- [ ] Task #43 nhận debt thêm mục nav `super_admin` khi admin shell đầy đủ được build.

**Cỡ:** S · **Phụ thuộc:** T6.

### Task 8 — Handoff SNS và task lịch sử

- [ ] Task #41 dùng marker echo trong consent SNS và redirect forced consent cho User cũ.
- [ ] Task #17, #23, #39 chỉ thêm note superseded; không sửa lại evidence lịch sử.
- [ ] Master P1.14 giữ unchecked cho tới khi contract mới được implement và gate xanh.

**Cỡ:** S · **Phụ thuộc:** T3, T4.

### Task 9 — Evidence và promote

- [ ] Test tham chiếu `BR-LGL-*`, `BR-CSM-*`, `BR-LCA-*`, `BR-REG-03`, `BR-LGN-11` và
  `BR-CDC-07` cho mọi nhánh mới.
- [ ] Chứng minh 100000 User force vẫn UPDATE đúng một requirement row.
- [ ] `pnpm check`, test unit/integration/E2E, `pnpm lint:specs`, `pnpm check:progress` xanh.
- [ ] Promote lại các spec bị hạ từ `implemented` sang `approved` chỉ sau khi code mới và test tồn tại.
- [ ] Human review diff schema, gate, admin force và migration trước merge; không auto-merge.

**Cỡ:** S · **Phụ thuộc:** T1–T8.

## 5. Cổng dừng

- Không còn `policy_version`, version legal route/API/UI hay `CONSENT_VERSION_STALE` trong
  contract/code/test active.
- Deploy không force; force không fan-out; audit fail rollback marker.
- Force Terms/Privacy không khoá quyền export/withdraw/delete.
- Force Child-data không thu mới và không cắt phiên đang chạy.
- Registration/acceptance race marker luôn fail atomically bằng 409.
- Content reviewer không đọc/force được; super admin chưa reauth không force được.
- Full local gate xanh; migration chỉ chạy local trong Task #14.

## 6. Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Migration làm mất thứ tự accepted/withdrawn | Fixture nhiều action, kiểm latest-by-created_at và transaction rollback |
| Middleware chặn cả quyền từ chối | Closed allow-list + test âm cho export/withdraw/delete |
| Deploy vô tình khoá toàn bộ User | Không hook deploy/migration; marker NULL khi cutover; test deploy-no-force |
| Hai admin ghi đè nhau | `expected_requirement_at` + row lock + 409 |
| Force nhầm rồi hạ marker | Cấm clear/rollback; action mới hơn và thông báo sửa sai, không viết lại lịch sử |
| Child bị cắt giữa game | Ghim marker lúc start; cho session đó finish, chặn start tiếp theo |
| Code đang làm theo Task #40 cũ | Rebase theo T1–T5; không coi checklist đã tick của baseline là evidence contract mới |

## 7. Ngoài phạm vi

- Soạn Terms/Privacy qua admin; document vẫn sửa bằng PR.
- Quản lý hay phục vụ policy version cũ.
- Force theo từng User/tenant/segment hoặc force tự động khi deploy.
- Rollback/clear marker sau force.
- Legal opinion cuối cùng; người rà soát pháp lý vẫn là cổng go-live.
- OAuth/linking implementation; Task #41 chỉ nhận contract marker từ bước này.
