# Task #303 Todo: Bộ đệm sự kiện khi mất mạng và dọn gói offline (Offline Play Buffer)

Plan: [`303-offline-play-buffer-plan.md`](303-offline-play-buffer-plan.md).
Spec: [`offline-play.md`](../specs/01-platform/offline-play.md) `BR-OFF-01/02/03/06`, [`offline-curriculum-pack.md`](../specs/03-account/offline-curriculum-pack.md) `BR-OCP-05`.

---

## S1 — Adapter lưu trữ + buffer trong phiên
- [ ] Đọc §6 `offline-play.md` và route ingest (khử trùng theo `seq`)
- [ ] Test đỏ: lỗi mạng giữ event, flush theo `seq` (`BR-OFF-01/02`)
- [ ] Nối `OfflineEventBuffer` vào `use-play-telemetry.ts` / `use-play-session.ts`
- [ ] Bỏ đường `console.error` rồi bỏ event

## S2 — Persist IndexedDB + flush lần mở sau
- [ ] Interface adapter lưu trữ có kiểu tường minh + bản giả cho test
- [ ] Test đỏ persist chu kỳ, flush lần mở sau (`BR-OFF-06`), guest không persist tiến độ
- [ ] Cài adapter IndexedDB

## S3 — Preload asset (`BR-OFF-03`)
- [ ] Đọc câu chữ `BR-OFF-03`
- [ ] Test đỏ + cài (nếu BR đòi)

## S4 — Dọn gói offline (`BR-OCP-05`)
- [ ] Test ca âm: sau logout cache/store còn → đỏ
- [ ] Hàm dọn dùng chung: `caches.delete(OFFLINE_PACK_CACHE_NAME)` + store client + message tới `sw.js`
- [ ] Gọi ở luồng logout và khi mất quyền

## S5 — Nghiệm thu
- [ ] `rtk proxy pnpm lint` exit 0
- [ ] `rtk proxy pnpm typecheck` exit 0
- [ ] Test web + game-engine liên quan xanh (qua `rtk proxy`)
- [ ] `rtk proxy pnpm check:test-ratchet` xanh
- [ ] Kiểm tay offline giữa phiên
- [ ] Bỏ `#303` khỏi `open_tasks` + khối "Chưa hoàn thành" ở 2 spec; nâng `implemented`; `reviewed`
- [ ] Commit vào `main`
