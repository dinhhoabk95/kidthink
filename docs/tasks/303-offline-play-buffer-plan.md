# Kế hoạch Task #303: Bộ đệm sự kiện khi mất mạng và dọn gói offline (Offline Play Buffer)

Contract: `docs/specs/01-platform/offline-play.md` (`BR-OFF-01`, `BR-OFF-02`, `BR-OFF-03`, `BR-OFF-06`), `docs/specs/03-account/offline-curriculum-pack.md` (`BR-OCP-05`).

---

## 1. Bối cảnh & Mục tiêu

Gap có bằng chứng (audit G3 §A, §E):

- `OfflineEventBuffer` + `FLUSH_INTERVAL_MS` có ở `packages/game-engine/src/offline-buffer.ts` (kèm test) nhưng **không được app dùng**: rg chỉ thấy export ở `packages/game-engine/src/index.ts:169`.
- Không có IndexedDB (rg `indexedDB` trong buffer = 0).
- `apps/web/app/composables/play/use-play-telemetry.ts:67-92` gửi event **một lần lúc cuối**, lỗi chỉ `console.error` rồi **bỏ** → mất mạng giữa phiên là mất event (`BR-OFF-01/02/06`).
- `BR-OCP-05` (đăng xuất / thu hồi quyền lợi → dọn gói offline): `caches.delete` chỉ có ở `apps/web/public/sw.js:32` (dọn cache cũ lúc `activate`), không có đường dọn khi logout. Tên cache: `OFFLINE_PACK_CACHE_NAME` (`packages/shared/src/pwa-offline-pack-contract.ts:69`).

Mục tiêu: event của phiên chơi không mất khi mạng chập chờn; dữ liệu offline của một tài khoản không còn trên máy sau khi đăng xuất hoặc mất quyền.

## 2. Thiết kế

### 2.1 Nối buffer vào telemetry

- `use-play-telemetry.ts` (+ `use-play-session.ts`) giữ một `OfflineEventBuffer` cho mỗi phiên: event vào buffer ngay, flush định kỳ và khi `online`, theo `seq` tăng dần (idempotent phía server — kiểm route ingest đã khử trùng theo `seq`/khoá chưa; nếu chưa, việc đó thuộc spec `play-event-ingestion` — đọc trước khi sửa).
- Persist IndexedDB mỗi 10 s (theo `BR-OFF-*`, đọc số chính xác trong spec); lần mở app sau flush phần còn lại trước khi phiên mới gửi event.
- Guest: buffer trong phiên, **không** lưu tiến độ lâu dài (theo spec offline-play — đọc §6 trước).
- Lỗi gửi: không `console.error` rồi bỏ; giữ trong buffer và thử lại có backoff. Không `try/catch` nuốt lỗi.
- Adapter IndexedDB tách sau một interface nhỏ có kiểu tường minh để test bằng bản giả trong bộ nhớ (vitest không có IndexedDB thật; cân nhắc `fake-indexeddb` qua `catalog:` nếu cần).
- Preload asset mọi round trước khi bắt đầu nếu `BR-OFF-03` đòi — đọc câu chữ BR trước, làm trong slice riêng.

### 2.2 Dọn gói offline khi logout / thu hồi (`BR-OCP-05`)

- Luồng logout web gọi một hàm dùng chung: `caches.delete(OFFLINE_PACK_CACHE_NAME)` + xoá store client (IndexedDB của buffer và gói) + `postMessage` tới `sw.js` để SW dọn phía nó.
- Thu hồi quyền lợi: khi API trả lỗi quyền (vd `TierLockedError`) cho gói offline → cùng hàm dọn.
- Có ca âm: test chứng minh sau logout `caches.has(OFFLINE_PACK_CACHE_NAME)` là `false`.

## 3. Lát cắt dọc

- **S1 — Adapter lưu trữ + buffer trong phiên**
  - Test trước (`apps/web/tests/...use-play-telemetry*.test.ts`): gửi lỗi mạng → event còn trong buffer; mạng trở lại → flush đúng thứ tự `seq`; không event nào bị bỏ. Tên `it` gắn `BR-OFF-01/02`.
  - Xong khi: test xanh; `use-play-telemetry.ts` không còn đường `console.error` rồi bỏ.
- **S2 — Persist IndexedDB + flush lần mở sau**
  - Test trước: persist sau chu kỳ; dựng lại composable (mô phỏng mở lại) → flush phần còn lại trước event mới (`BR-OFF-06`); guest không persist tiến độ.
  - Xong khi: test xanh.
- **S3 — Preload asset (`BR-OFF-03`)** — chỉ khi BR đòi đúng như vậy
  - Test trước: phiên không bắt đầu round 1 trước khi asset mọi round đã nạp.
  - Xong khi: test xanh.
- **S4 — Dọn gói offline khi logout / thu hồi (`BR-OCP-05`)**
  - Test trước: ca âm — sau logout cache và store vẫn còn → test phải đỏ trên code cũ; sau sửa thì xanh. Thêm ca thu hồi quyền.
  - Xong khi: test xanh; `sw.js` xử lý message dọn.
- **S5 — Nghiệm thu**
  - `rtk proxy pnpm lint`, `rtk proxy pnpm typecheck`, `rtk proxy pnpm --filter @mindkid/web test` (các file liên quan), `rtk proxy pnpm --filter @mindkid/game-engine test`, `rtk proxy pnpm check:test-ratchet`.
  - Kiểm tay: DevTools offline giữa phiên → bật lại → event lên đủ.
  - Spec `offline-play.md`, `offline-curriculum-pack.md`: bỏ `#303` khỏi `open_tasks` + khối "Chưa hoàn thành"; nâng `status: implemented`; `reviewed`.
  - Commit vào `main`.
