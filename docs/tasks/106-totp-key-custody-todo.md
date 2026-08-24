# Task #106 — Todo

- [ ] Đo trước mọi thứ khác: `select account_type, count(*), count(confirmed_at) from
      mfa_settings group by account_type` trên prod. Ghi con số vào task này.
      → Script sẵn: `npx tsx packages/db/scripts/count-mfa-rows.ts`
- [x] `BR-MFA-13` vào `docs/specs/03-account/mfa.md` §6 + scenario ở §9.
- [x] Gom `mfaSecretKey()` thành helper duy nhất; mọi call site `encrypt/decryptTotpSecret`
      dùng nó. → `getMfaEncryptionKey()` trong `admin-auth-runtime.ts`, 5 bản copy xoá.
- [x] Cổng `BR-MFA-13` trong `packages/gates` + fixture âm truyền khoá khác.
      → `lint-mfa-key.ts` + 5 tests (2 red fixtures).
- [x] `verifyManagerMfa` và nhánh User tương đương: giải mã hỏng ném lỗi hệ thống + audit
      riêng, không rơi xuống nhánh mã khôi phục. → throw `MFA_SECRET_CORRUPTED` (5 catch sites).
- [x] `packages/db/scripts/count-mfa-rows.ts` — chỉ đọc, in theo `account_type`.
- [x] Mục runbook trong tài liệu deploy: chạy script trước khi phát hành.
      → [`release-deploy.md`](../specs/01-platform/release-deploy.md) §10 Always.
- [ ] Chốt câu hỏi mở về re-enroll sau khi có con số.
- [x] `pnpm --filter @mindkid/gates test` đạt (233/233), `biome check` đạt (12 files).
