# Kế hoạch — Task #71: P5.1 — Thanh toán tự động và huỷ gói thủ công

> Viết 2026-08-11, sửa 2026-08-16 (rút refund khỏi hệ thống), đo tại commit `c444bff`.
> Phụ thuộc: Task #70 chấp nhận outcome payment và cổng ra P4.
> Vùng nhạy cảm: thanh toán; test âm trước, full gate và human review mỗi increment.

## Tóm tắt

Task #71 thêm payment provider tự động mà không phá VietQR duyệt tay, xử lý webhook theo
idempotency, và chỉ bật recurring billing khi catalog/consent đã chốt.

**Thay đổi phạm vi 2026-08-16:** hệ thống **không** xây quy trình hoàn tiền. Khách hàng tự liên hệ
qua Zalo OA / Facebook Messenger của website để yêu cầu huỷ; mức hoàn tiền do người trao đổi và
chuyển khoản ngoài hệ thống. Phần trong hệ thống chỉ còn: admin huỷ gói đăng ký của một User, có
lý do và audit. Vì vậy Task #71 phải **rút contract refund đang `approved` khỏi corpus** trước khi
viết code, nếu không plan và spec mâu thuẫn nhau.

Provider, phí, currency, recurring policy, kênh liên hệ và accounting owner đều là human decision
trước migration. Không credential/provider production call nằm trong task.

## 0. Hard rules kế thừa

- `BR-PAY-02` — không duyệt hai lần; mọi provider event cũng idempotent.
- `BR-PAY-03` — state transition, entitlement và audit cùng transaction.
- `BR-PKG-03`/`BR-POC-01` — giá từ catalog server, không từ client/webhook metadata.
- `BR-PAY-08` — không xoá `payment_orders`; `approved` là **terminal**. Huỷ gói tác động lên
  entitlement/subscription, **không** sửa đơn đã duyệt.
- `BR-EGR-06` — thu hồi entitlement có hiệu lực ngay, invalidate cache.
- `BR-EGR-08` — cấp/huỷ tay không tạo `payment_orders` giả; doanh thu và quyền là hai sổ khác nhau.
- `BR-RBL-03` — User tự huỷ auto-renew giữ quyền tới hết chu kỳ đã trả.
- VietQR manual là fallback tới khi cutover/rollback được người quyết duyệt.

## 1. Quyết định bắt buộc

**D-P5PAY-A — Provider event không phải sự thật chưa kiểm.** Verify signature, livemode,
merchant/account, amount/currency/order mapping và replay window trước transition.

**D-P5PAY-B — Exactly-once effect trên at-least-once webhook.** Lưu provider event ID và
transition idempotency trong cùng transaction; duplicate/out-of-order không cấp quyền lần hai.

**D-P5PAY-C — Recurring cần consent version.** Không tự gia hạn từ một thanh toán one-off.
User phải chọn offer recurring, thấy số tiền/kỳ/hủy và consent version được snapshot.

**D-P5PAY-D — Hoàn tiền nằm ngoài hệ thống (thay quyết định refund cũ).** Không API refund, không
gọi refund provider, không bảng `payment_refunds`, không trạng thái `refunded`/`partially_refunded`,
không tính pro-rata tự động. Số tiền trả lại khách do người thoả thuận và chuyển khoản thủ công.
Hệ quả: contract refund `approved` hiện có phải bị rút, không để trôi.

**D-P5PAY-E — Huỷ gói là thao tác quyền, không phải thao tác sổ tiền.** Admin huỷ gói thì chỉ đổi
entitlement/subscription và ghi audit; đơn hàng gốc giữ nguyên trạng thái và số tiền. Đây là điều kiện
để `BR-PAY-08` và `BR-EGR-08` còn đúng sau P5.

**D-P5PAY-F — Kênh yêu cầu huỷ phải được khai báo, không phải "khách tự biết".** Zalo OA đã chốt ở
`D-AX`; Facebook Messenger là kênh **mới** chưa có trong corpus. Trang `/contact`,
`/refund-policy` và FAQ phải nêu đúng kênh nào nhận yêu cầu huỷ và thời gian phản hồi.

## 2. Đồ thị

```text
T0 provider/policy/kênh liên hệ preflight
 └── T1 specs + state machines + error/event contract + rút contract refund ── Checkpoint A
      ├── T2 provider driver + webhook verification
      └── T3 schema/migration + idempotency/outbox
           └── T4 payment orchestration/reconciliation ── Checkpoint B
                ├── T5 recurring billing/account UX
                └── T6 admin huỷ gói + bề mặt kênh liên hệ
                     └── T7 replay/chaos/accounting drill + dispute runbook
                          └── T8 promote specs + handoff
```

## 3. Task triển khai

### T0 — Preflight provider, policy huỷ và kênh liên hệ

**Tiêu chí nghiệm thu**

- [ ] Finance/Product chọn provider, phương thức, fee/currency, settlement và VietQR fallback.
- [ ] Legal chốt recurring consent, quy trình huỷ thủ công, nội dung `/refund-policy` (nêu rõ hoàn
  tiền xử lý ngoài hệ thống) và legal-page owner.
- [ ] Product chốt kênh nhận yêu cầu huỷ (Zalo OA, Facebook Messenger, email) và SLA phản hồi;
      Facebook Messenger là kênh mới nên cần decision record riêng.
- [ ] Product/Finance chốt hiệu lực huỷ: cắt quyền ngay hay giữ tới hết kỳ đã trả — hai lựa chọn
      này quyết định số tiền thoả thuận ngoài hệ thống nên không được để mở.
- [ ] Security chốt signature, secret rotation, replay window, sandbox và incident path.
- [ ] Finance chốt runbook chargeback/dispute từ provider (vẫn xảy ra dù không có refund API).
- [ ] **Đóng ngay, không đợi P5** — hai câu hỏi mở về hoàn tiền đang chặn phase đã ship:
      [`legal-pages.md`](../specs/02-public/legal-pages.md) §11 câu 3 (chặn P2) và
      [`account-deletion.md`](../specs/03-account/account-deletion.md) §11 câu 1 (chặn P1). Cả hai
      spec đã `implemented`, nghĩa là `/refund-policy` và luồng xoá tài khoản đang chạy với chính
      sách chưa chốt. Quyết định 2026-08-16 đóng được ngay, cùng câu trả lời FAQ trong
      [`faq-and-help.md`](../specs/02-public/faq-and-help.md) (`implemented`, P1).

**Kiểm chứng:** decision record; `pnpm --filter @mindkid/gates test` xanh sau khi đóng hai câu hỏi; không SDK/migration
trước khi các owner duyệt.

**Phụ thuộc:** #70 + P4 · **Files:** evidence/task/spec decision + legal/account/FAQ specs ·
**Cỡ:** S.

### T1 — Spec-first contract và rút contract refund

Đây là task đổi nhiều nhất so với bản 2026-08-11. Corpus hiện có một spec refund `approved` đầy
đủ (state machine, BR, mã lỗi, event, câu hỏi mở). Bỏ refund mà không rút contract sẽ để lại
mâu thuẫn `approved` và làm `pnpm --filter @mindkid/gates test` gãy khi file bị xoá.

Đo tại `c444bff`: **không spec nào `depends_on: PAYMENT-REFUND`**, nên gỡ không chạm đồ thị phụ
thuộc (`C7`/`C8`). Blast radius nằm hết ở registry, index, roadmap và [`SPEC.md`](../SPEC.md).

**Tiêu chí nghiệm thu**

- [ ] Spec refund `PAYMENT-REFUND` bị rút và thay bằng spec owner cho outcome "Manager huỷ gói
      đăng ký của User theo yêu cầu nhận qua kênh ngoài"; giữ nguyên số spec thư mục `06-admin`
      để `C11` không gãy.
- [ ] Spec mới **không** trùng `owns` với `ENTITLEMENT-GRANT` (đã `implemented`, đang sở hữu
      cấp/thu hồi entitlement thủ công) và `RECURRING-BILLING` (sở hữu huỷ auto-renew phía User) —
      `C2` cấm hai spec cùng `owns` một thứ. Ranh giới phải viết ra, không suy diễn.
- [ ] Registry đồng bộ: prefix `BR-RFD` trong
      [`business-rules.md`](../specs/00-foundation/business-rules.md); mã
      `REFUND_EXCEEDS_CAPTURED_AMOUNT` và `REFUND_ALREADY_PROCESSED` trong
      [`error-codes.md`](../specs/00-foundation/error-codes.md); event `payment_refunded` trong
      [`event-catalog.md`](../specs/00-foundation/event-catalog.md). Ba nơi này đều trỏ link tới
      file refund — link chết là lỗi `C4`, không phải cảnh báo.
- [ ] Hai câu hỏi mở còn lại được đóng bằng chính quyết định này, không để "hoãn":
      [`payment-flow.md`](../specs/00-foundation/payment-flow.md) §11 câu 3 và
      [`payment-approval.md`](../specs/06-admin/payment-approval.md) §11 câu 1 (cả hai chặn P5).
      Hai câu chặn P1/P2 đã đóng ở T0.
- [ ] Bề mặt công khai khớp quyết định: `/refund-policy` có nội dung thật, FAQ trả lời "Có hoàn
      tiền không?" bằng quy trình liên hệ, `/contact` liệt kê kênh đã chốt ở T0.
- [ ] [`index.md`](../specs/index.md), [`roadmap.md`](../specs/roadmap.md) hàng P5 số 1 và
      [`SPEC.md`](../SPEC.md) §14 (mô tả `06-admin` còn chữ "refund") được sửa cùng lượt.
- [ ] Automated payment và recurring billing có owner riêng; state machine, API/webhook, events,
      errors, audit actions và negative Gherkin đầy đủ.
- [ ] Monthly offer chỉ public khi payment/renew/cancel path cùng sẵn sàng.

**Kiểm chứng:** `pnpm --filter @mindkid/gates test` xanh (chú ý `C2` owns, `C4` link chết, `C11` số spec/thư mục,
`C16`/`C17` câu hỏi mở); registry/index/dependency graph khớp.

**Phụ thuộc:** T0 · **Files:** canonical specs/index/roadmap/SPEC.md/BR/error/event registries ·
**Cỡ:** M.

### Checkpoint A — Contract money review

- [ ] Finance/Product/Legal/Security review spec diff và failure matrix.
- [ ] Xác nhận corpus không còn chỗ nào hứa hoàn tiền tự động.
- [ ] Không schema/SDK khi amount, consent, hiệu lực huỷ và idempotency còn mở.

### T2 — Provider driver và webhook verifier

**Tiêu chí nghiệm thu**

- [ ] Domain port giấu SDK; verify raw-body signature, timestamp, merchant/mode trước parse domain.
- [ ] Fake/sandbox adapter có fixtures valid, bad signature, replay, duplicate, out-of-order.
- [ ] Driver **không** expose API refund; capability refund tắt ở tầng port để không ai gọi nhầm.
- [ ] Logs không chứa secret/full payment instrument; key rotation có test.

**Kiểm chứng:** `pnpm test -- payment-provider webhook-verification`; không network thật trong test.

**Phụ thuộc:** Checkpoint A · **Files:** payment package/driver/tests · **Cỡ:** M.

### T3 — Schema, migration và delivery ledger

**Tiêu chí nghiệm thu**

- [ ] Schema theo spec cho provider customer/payment/event/subscription và unique idempotency.
      **Không** bảng `payment_refunds`, **không** cột trạng thái refund trên `payment_orders`.
- [ ] Migration DB rỗng/upgrade/rollback; existing VietQR rows giữ nguyên nghĩa và query được.
- [ ] Bảng subscription đủ field để dừng thu tiền kỳ sau khi admin huỷ (`auto_renew`, `status`,
      `cancelled_by`, `cancel_reason`).
- [ ] Outbox/reconciliation state không tạo entitlement ngoài transaction.

**Kiểm chứng:** DB integration tests cho duplicate/replay/out-of-order/rollback.

**Phụ thuộc:** Checkpoint A · **Files:** schema/migration/meta/repository tests · **Cỡ:** M mỗi lát.

### T4 — Payment orchestration và reconciliation

**Tiêu chí nghiệm thu**

- [ ] Checkout lấy price server-side, tạo provider intent idempotent và map đúng internal order.
- [ ] Verified webhook transition + entitlement + audit nguyên tử; event lạ fail-closed.
- [ ] Reconciliation job báo missing/mismatch, không tự “sửa” amount hoặc cấp quyền mù.
- [ ] Event refund do provider gửi (nếu Finance thao tác trên dashboard provider) được ghi nhận là
      **mismatch cần người xử lý**, không tự thu hồi quyền — hệ thống không có luồng refund.

**Kiểm chứng:** `pnpm test -- automated-payment reconciliation`; PG/queue thật, provider fake.

**Phụ thuộc:** T2–T3 · **Files:** service/routes/worker/integration tests · **Cỡ:** M mỗi lát.

### Checkpoint B — Money write path

- [ ] Checkout→webhook→entitlement và duplicate/out-of-order/rollback đều xanh.
- [ ] Human review raw-body boundary, transaction và reconciliation report.

### T5 — Recurring billing và account UX

**Tiêu chí nghiệm thu**

- [ ] Opt-in snapshot consent/offer; renewal success/failure/grace/cancel contract đúng spec.
- [ ] Account UI hiển thị kỳ, lần thu tới, phương thức masked, cancel và history bằng tiếng Việt.
- [ ] Trang `/me/subscription` nêu rõ: huỷ tự gia hạn làm được tại chỗ; yêu cầu hoàn tiền đi qua
      kênh liên hệ đã chốt ở T0.
- [ ] Retry/dunning không spam notification hay kéo dài entitlement trái policy.

**Kiểm chứng:** integration + E2E renewal/cancel/failure với provider clock/fake.

**Phụ thuộc:** T4 · **Files:** service/routes/account UI/worker/tests · **Cỡ:** M mỗi lát.

### T6 — Admin huỷ gói đăng ký và bề mặt kênh liên hệ

Thay hoàn toàn T6 refund cũ. Phần lớn năng lực thu hồi quyền **đã có**:
[`entitlement-grant.md`](../specs/06-admin/entitlement-grant.md) `implemented` từ P2 với
`DELETE /api/managers/entitlements/{id}`, hiệu lực ngay và audit. Phần thật sự mới là dừng thu tiền
kỳ sau của subscription và một đường vào admin đọc được cho ca "khách nhắn Zalo xin huỷ".

**Tiêu chí nghiệm thu**

- [ ] Manager `super_admin` huỷ được gói của một User từ trang chi tiết User, một thao tác, không
      phải ghép hai màn hình.
- [ ] Huỷ đồng thời: dừng auto-renew của subscription (không thu kỳ kế tiếp) và xử lý entitlement
      theo lựa chọn hiệu lực đã chốt ở T0 (cắt ngay hoặc giữ tới hết kỳ) — cả hai nhánh có test.
- [ ] Bắt buộc `reason` từ danh sách đóng + ghi chú ≥ 20 ký tự nêu kênh nhận yêu cầu
      (Zalo/Messenger/email) và mã tham chiếu hội thoại nếu có.
- [ ] Thao tác idempotent: huỷ lại gói đã huỷ trả 409, không sinh audit trùng, không đổi
      `payment_orders`.
- [ ] Audit ghi actor, user, package, hiệu lực, reason, note; UI admin và
      [`audit-log-viewer.md`](../specs/06-admin/audit-log-viewer.md) đọc được bản ghi này.
- [ ] `content_reviewer` bị chặn 403; User khác không đọc được gói của User này (404 ownership).
- [ ] Bề mặt công khai `/contact`, `/refund-policy` và FAQ nêu đúng kênh và SLA; không câu chữ nào
      hứa hoàn tiền tự động hay hoàn tiền trong ứng dụng.
- [ ] Thông báo cho User khi gói bị huỷ, nêu ngày hết hiệu lực thực tế.

**Kiểm chứng:** integration tests hai nhánh hiệu lực, duplicate cancel, 403 role, 404 ownership;
E2E "khách yêu cầu huỷ → admin huỷ → quyền mất đúng thời điểm"; `pnpm --filter @mindkid/shared test` cho trang
pháp lý.

**Phụ thuộc:** T4 + policy T1 · **Files:** service/routes/admin UI/public legal pages/tests ·
**Cỡ:** M mỗi lát.

### T7 — Security, chaos, đối soát và runbook tranh chấp

**Tiêu chí nghiệm thu**

- [ ] Replay storm, webhook reorder, provider timeout, queue retry và DB rollback không double
      effect.
- [ ] Reconciliation tổng captured/net khớp provider sandbox fixtures và internal ledger. Không còn
      cột refunded trong báo cáo vì hệ thống không sinh refund.
- [ ] Runbook chargeback/dispute và runbook "khách xin huỷ qua Zalo/Messenger" được viết, diễn tập
      một lượt và có người ký nhận — đây là nơi rủi ro chuyển từ code sang vận hành.
- [ ] Secret rotation, alert, manual fallback và rollback drill có evidence người review.

**Kiểm chứng:** security/chaos/load report + full gates; không production mutation.

**Phụ thuộc:** T5–T6 · **Files:** fixtures/load/evidence/runbook · **Cỡ:** M.

### T8 — Promote contract

**Tiêu chí nghiệm thu**

- [ ] Mọi BR payment/huỷ gói mới có test mang mã; open questions P5 payment và hoàn tiền được đóng.
- [ ] Spec chỉ `implemented` khi checkout, recurring, admin huỷ gói và fallback cùng xanh.
- [ ] Không còn tham chiếu chết tới contract refund ở bất kỳ file nào trong `docs/`.
- [ ] `pnpm check && pnpm test && pnpm --filter @mindkid/gates test && pnpm services` xanh.

**Kiểm chứng:** progress evidence Task #71 + human Finance/Security review.

**Phụ thuộc:** T7 · **Files:** spec status/progress/evidence · **Cỡ:** S.

## 4. Ngoài phạm vi

**Bỏ hẳn theo quyết định 2026-08-16:** endpoint refund, gọi API refund của provider, bảng
`payment_refunds`, trạng thái `refunded`/`partially_refunded`, mã lỗi `REFUND_*`, event
`payment_refunded`, tính pro-rata số tiền trả lại, form nhập số tiền hoàn trong admin, luồng
khách tự yêu cầu hoàn tiền trong ứng dụng.

**Vẫn ngoài phạm vi như cũ:** tự chọn provider/phí, lưu card data, production credential, live
charge, bỏ VietQR trước cutover approval, hardcode giá, auto-merge hoặc chạy migration ngoài local.

## 5. Rủi ro còn mở

| Rủi ro | Vì sao đáng lo | Xử lý trong plan |
|---|---|---|
| Chargeback từ provider | Không có refund API không có nghĩa là không có tranh chấp; tiền vẫn bị rút ngược | Runbook T7 + reconciliation mismatch T4 |
| Hiệu lực huỷ chưa chốt | Cắt ngay hay hết kỳ đổi hẳn số tiền thoả thuận ngoài hệ thống | Chặn ở T0, hai nhánh có test ở T6 |
| Facebook Messenger là kênh mới | Corpus mới chỉ chốt email + Zalo OA (`D-AX`) | Decision record riêng ở T0, bề mặt ở T6 |
| Recurring + huỷ thủ công | Khách nhắn xin huỷ nhưng kỳ thu tiếp theo chạy trước khi admin xử lý | SLA phản hồi ở T0; dừng auto-renew là bước đầu tiên của T6 |
| Nợ chính sách đang chạy trên P1/P2 | `/refund-policy` và luồng xoá tài khoản đã `implemented` với câu hỏi hoàn tiền còn mở | Tách ra đóng ở T0, không chờ P5 |
