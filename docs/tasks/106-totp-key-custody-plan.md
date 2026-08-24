# Task #106 — Khoá mã hoá TOTP: một nguồn, một phép đo trước deploy

## 1. Vì sao

Review Task #104 phát hiện route xác thực MFA của Manager đổi khoá giải mã:

```
apps/web/server/api/guest/auth/managers/mfa.post.ts
-  getAdminJwtSecret(event)     // ADMIN_JWT_SECRET
+  getMfaEncryptionSecret(event) // MFA_ENCRYPTION_KEY
```

Ba sự thật đo được ngày 2026-08-24:

1. **Khoá nào cũng "chạy".** `totpEncryptionKey()` trong `packages/auth/src/totp.ts:9` băm
   SHA-256 chuỗi truyền vào, nên mọi chuỗi đều tạo được một khoá AES hợp lệ. Sai khoá không
   phải lỗi cấu hình — nó là bản rõ khác.
2. **Sai khoá rơi âm thầm.** `verifyManagerMfa` (`mfa.post.ts:57-69`) bọc giải mã trong
   `try/catch` rỗng rồi rơi xuống nhánh mã khôi phục. Manager có TOTP hợp lệ sẽ thấy "mã
   sai", không thấy "hệ thống không đọc được secret của bạn".
3. **Không có rule nào sở hữu khoá.** `BR-MFA-01` chỉ nói "secret lưu mã hoá"; không rule
   nào nói **khoá nào**, nên việc đổi khoá không vi phạm gì cả — cổng không thể đỏ.

Rủi ro thực tế nhỏ nhưng chưa được đo: repo **không có** route enroll MFA cho Manager
(xem Task #105), nên khả năng cao chưa có hàng nào. "Khả năng cao" không phải phép đo.

## 2. Quyết định kiến trúc

- **Một khoá cho TOTP, tên `MFA_ENCRYPTION_KEY`.** Không có khoá dự phòng, không thử lần
  lượt nhiều khoá — thử nhiều khoá là biến sai cấu hình thành im lặng.
- **Đổi khoá là migration, không phải đổi env.** Secret đã mã hoá không tự chuyển khoá; đổi
  khoá mà không re-encrypt nghĩa là khoá toàn bộ chủ tài khoản ra ngoài.
- **Không đọc được secret là lỗi hệ thống, không phải mã sai.** Phải phân biệt với "mã sai"
  ở cả mã lỗi lẫn audit, nếu không sự cố cấu hình sẽ trông giống người dùng gõ nhầm.
- **Phép đo trước deploy là artefact, không phải trí nhớ.** Một script chạy được, in ra con
  số, ghi vào runbook.

## 3. Kế hoạch tăng dần

1. **`BR-MFA-13` vào [`../specs/03-account/mfa.md`](../specs/03-account/mfa.md) §6:**
   secret TOTP mã hoá bằng đúng `MFA_ENCRYPTION_KEY` cho **mọi** account type; Cấm —
   **NEVER** dùng khoá khác và Cấm — **NEVER** thử nhiều khoá; đổi khoá bắt buộc re-encrypt
   toàn bộ trong cùng migration. Kèm scenario acceptance.
2. **Một nguồn khoá.** Đưa `mfaSecretKey()` thành helper dùng chung (hiện mỗi route MFA của
   User tự khai lại `requireEnv("MFA_ENCRYPTION_KEY")`, còn manager đi qua
   `getMfaEncryptionSecret`). Mọi call site `encryptTotpSecret` / `decryptTotpSecret` gọi
   đúng helper đó.
3. **Cổng `BR-MFA-13`** trong `packages/gates`: quét mọi call site của
   `encrypt/decryptTotpSecret` trong `apps/**` và yêu cầu đối số khoá là helper duy nhất;
   fixture âm là một call site truyền `process.env.SOMETHING_ELSE`.
4. **Phân biệt lỗi giải mã với mã sai** trong `verifyManagerMfa` và các nhánh User tương
   đương: giải mã hỏng thì ném lỗi hệ thống + audit riêng, Cấm — **NEVER** rơi âm thầm
   xuống nhánh mã khôi phục.
5. **Script đo:** `packages/db/scripts/count-mfa-rows.ts` in số hàng `mfa_settings` theo
   `account_type` và số hàng có `confirmed_at`. Chỉ đọc, không ghi.
6. **Runbook:** thêm mục vào tài liệu deploy — chạy script trước khi phát hành; nếu
   `account_type = 'manager'` > 0 thì các hàng đó đã mã hoá bằng khoá cũ và **phải** được
   re-enroll (không có đường giải mã ngược khi không giữ khoá cũ).

## 4. Verification

```bash
node packages/db/scripts/count-mfa-rows.ts     # phép đo, chạy trước deploy
pnpm --filter @mindkid/gates test              # BR-MFA-13 + ca âm
pnpm --filter @mindkid/web test                # nhánh lỗi giải mã
pnpm lint && pnpm typecheck:web
```

Ca âm bắt buộc của cổng: đổi một call site sang khoá khác thì cổng phải đỏ. Không có ca âm
thì cổng chỉ là một dòng chữ.

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Prod đã có hàng manager mã hoá bằng `ADMIN_JWT_SECRET` | Cao — chủ tài khoản không đăng nhập được | Script đo chạy **trước** deploy; có hàng thì re-enroll, không đoán |
| Sửa nhánh lỗi làm lộ thông tin cho kẻ dò mã | Trung bình | Lỗi hệ thống trả mã lỗi chung; chi tiết chỉ vào audit phía server |
| Cổng bắt nhầm test đang cố tình dùng khoá khác | Thấp | Cổng bỏ qua `tests/**/fixtures/`, giống các cổng khác |

## 6. Câu hỏi mở

- Nếu prod có hàng manager cũ: re-enroll bắt buộc, hay giữ `ADMIN_JWT_SECRET` một vòng phát
  hành để re-encrypt rồi mới bỏ? Chỉ trả lời được sau khi có con số từ bước 5.
