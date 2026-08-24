# Task #104 — Todo

- [x] Sửa lỗi gốc: web middleware resolve opaque session token từ Redis.
- [x] Thêm test middleware thật: Manager cookie pass, User cookie fail, origin lạ fail.
- [x] Tách cookie/session config User và Manager trên web host.
- [x] Chuyển Manager auth routes và dashboard về `apps/web`.
- [x] Thêm CORS allowlist, credentials và preflight.
- [x] Xóa `apps/admin/server/` sau khi inventory route hoàn tất.
- [x] Chuyển admin sang `ssr: false` + `nuxt generate` + `apiBaseUrl`.
- [x] Port `useApiClient` và thay toàn bộ API URL tương đối của admin.
- [ ] Ghi nhận open item riêng: Manager login page chưa tồn tại ở hai app.

## Sau review (2026-08-24)

- [x] C1 — middleware chỉ set `context.user` cho `/api/users/**` làm liên kết OAuth
      (`BR-SLK-01`, route `/api/guest/**`) luôn 401. Namespace `user` giờ phủ mọi path
      `/api/**` không phải `/api/managers/**`; spec §5/§6/§9 cập nhật theo.
- [x] C2 — `build.sh` chưa từng truyền `NUXT_PUBLIC_API_BASE_URL` vào container build và
      `MK_APPS` bỏ `admin` khỏi cổng env, nên bundle admin production ra `apiBaseUrl:
      undefined`. Thêm `MK_ENV_APPS` / `MK_BUILD_ENV_APPS`, `--env-file` cho build, và
      ca 13 của harness deploy.
- [x] C3 — 4 URL API tương đối còn sót trong admin (`src` ảnh, `href` PDF, hai
      `window.open`) nay đi qua `apiUrl()`; cổng `BR-ARB-04` mở rộng sang template
      literal, `href`, `src`, `window.open` và báo mọi match.
- [x] I1/I2 — `findRuntimeBoundaryViolations(root)` nhận root để có ca âm cho
      `BR-ARB-01/02/03/05/06/07`; `BR-ARB-02` (duplicate route owner) và `BR-ARB-07`
      (nginx admin block) từ rule chết thành cổng thật; CORS wildcard bị bắt.
- [x] I3 — cookie phiên Manager trả về `SameSite=Strict` như cấu hình admin cũ.
- [x] I4 — logout Manager tolerant trở lại: phiên hết hạn vẫn xoá được cookie.
- [x] I5/I6 — test middleware đi qua header `Cookie` thật; hai test grep-chuỗi của admin
      thay bằng test hành vi của `useApiClient`.
- [ ] Đo trước khi deploy: `select count(*) from mfa_settings where account_type = 'manager'`.
      Route verify MFA manager đổi khoá giải mã từ `ADMIN_JWT_SECRET` sang
      `MFA_ENCRYPTION_KEY`; nếu có hàng cũ, chúng sẽ giải mã hỏng và rơi âm thầm xuống
      nhánh recovery code.
- [x] Đổi Nginx admin block sang static `root` + `try_files`; bỏ PM2 admin.
- [x] Cập nhật env/spec/roadmap/index và Caddy-vs-Nginx decision.
- [x] Thêm gates cho `BR-ARB-01` tới `BR-ARB-06` và fixture âm.
- [x] Cập nhật `.agents/AGENTS.md`, `mindkid/AGENTS.md`, rules, agent docs và Nuxt skill.
- [x] Chạy test, build, typecheck và review diff; không merge tự động.
