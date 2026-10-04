# Runbook — gieo nội dung v3 (#283) lên staging và prod

Áp dụng: `GENERATED_LEVEL_CONTENT_VERSION = 3` (`BR-CSA-17`, commit `253829cf`). **Người phát hành chạy**, AI không
chạy lên môi trường khác local (`BR-CSA-07`). Mỗi môi trường làm tuần tự: staging trước, prod sau khi staging đạt hậu kiểm.

## 0. Điều kiện tiên quyết
- [ ] Chủ nội dung đã duyệt `docs/qa/283-dataset-review.md`; PR chứa `content-version.lock.json` (version 3) đã merge vào `main`.
- [ ] Bản triển khai chứa mã #283 (cổng intro theo mã level `64d19aaf`, gợi ý theo mã `e1789af0`) **đã chạy trước** khi gieo.
  Lý do: sau khi v1 bị archive, bản mã cũ khớp theo `game_levels.id` sẽ bắt trẻ làm lại intro (`INTRO_REQUIRED`).
  Thứ tự: đổi bản → gieo (`BR-DEP-06`: migration trước đổi bản; gieo sau đổi bản).
- [ ] Node 24, `DATABASE_URL` trỏ đúng môi trường, `GIT_SHA` và `PR_URL` đặt để ghi `content_review_log` (`BR-CSA-03`).

## 1. Tiền kiểm
1. **Sao lưu**: `pg_dump -Fc "$DATABASE_URL" > mindkid-pre-v3-$(date +%F).dump`; kiểm `pg_restore -l` đọc được. Lưu ngoài máy chạy.
2. **Đếm trước** (lưu kết quả):
   ```sql
   SELECT content_version, status, count(*) FROM game_levels GROUP BY 1,2 ORDER BY 1,2;
   SELECT count(*) FROM content_skill_map WHERE entity_type='game_level';
   ```
   Kỳ vọng ở môi trường đã gieo v1 hoặc v2: một phiên bản `published` = **6380**. Môi trường khác 6380 thì dừng và hỏi.
3. **Dry-run** (giao dịch bị rollback): `pnpm db:seed:content -- --dry-run` (hoặc
   `pnpm --filter @mindkid/content-build run seed:content -- --dry-run`). Kỳ vọng: `Rows inserted` ≈ 6380 level + ánh xạ,
   không có lỗi cổng, in "Dry run completed cleanly". Có `ValidationError ... đã có version lớn hơn` nghĩa là DB đang cao hơn mã: dừng.
4. `pnpm check:migration-hashes` xanh; không có migration chờ.

## 2. Gieo
`pnpm db:seed:content -- --batch=SEED-283-v3` (một giao dịch, `BR-CSA-05`).
Kỳ vọng: toàn bộ danh mục chuyển v4: `Rows inserted` = số hàng v4; bản cũ chuyển `archived`. Chạy lần hai phải báo
inserted = 0 (idempotent, `BR-CSA-06`).

## 3. Hậu kiểm
```sql
SELECT content_version, status, count(*) FROM game_levels GROUP BY 1,2 ORDER BY 1,2;
-- Kỳ vọng: v4 published 6380; mọi bản cũ archived (dev: v1 6380 + v3 6380)
SELECT code, difficulty_params->>'collectible_count' FROM game_levels
 WHERE code IN ('GL-C1-ALG-CMD-0009','GL-C1-ALG-CMD-0010','GL-C2-DIR-CMD-0004') AND status='published';  -- = 2
SELECT count(*) FROM content_skill_map m JOIN game_levels l ON l.id=m.entity_id
 WHERE m.entity_type='game_level' AND l.status='published';   -- = 6399
```
(`collectible_count` nằm ở cột `difficulty_params`, đã kiểm trên dev 2026-10-04.)
Kiểm trên ứng dụng bằng một tài khoản bé **đã có phiên ở bản cũ**:
- [ ] `/play`, `/me`, `/home`, dashboard, stickers, map tải được; `/me` hiện khối "Đang xem", không cảnh báo hydration.
- [ ] Mở level đã qua intro ở bản cũ (ví dụ GT-026/027): **không** `INTRO_REQUIRED` (cổng khớp theo mã, `BR-CIG-08`).
- [ ] Gợi ý tiếp theo không đề xuất lại level đã chơi ở bản cũ (`recommendation.ts` khớp theo mã).
- [ ] Chơi hết một vòng ba seed GT-035 ở 390x844: lệnh và nút chạy hiện đủ.
- [ ] Hoàn thành một phiên: `play_sessions` có `score` > 0 khi đúng hết; telemetry có một `game_started` (`seq = 1`).
- [ ] `pnpm --filter @mindkid/db seed:check --against-db` không báo lệch (`BR-CSA-11`).

## 4. Rollback
Seed chỉ INSERT và archive (`BR-CSA-01`); không có lệnh "bỏ gieo". Nếu hậu kiểm đỏ:
1. Dừng gieo tiếp. Ưu tiên **sửa tiến** (sửa dữ liệu, nâng `GENERATED_LEVEL_CONTENT_VERSION` lên 4, cập nhật khoá, gieo lại).
2. Rollback thật chỉ bằng `pg_restore` từ bản sao lưu bước 1 (mất mọi phiên chơi ghi sau sao lưu). Cần chủ hệ thống duyệt.
3. Không UPDATE tay `status` hay `content_version` — vi phạm `BR-CLC-01` và làm `seed:check` lệch.

## 5. Rủi ro đã biết
- Cả danh mục chuyển v3, không chỉ ~35 level #283 đụng tới.
- `level_params.game_level_id` trỏ dòng cụ thể: điều chỉnh thích ứng của từng trẻ nằm lại ở dòng đã archive. Dev: bảng rỗng và
  không có mã server đọc. Kiểm lại số dòng `level_params` ở staging/prod trước khi gieo.
- Dev đã ở v3 (không hoàn lại được ngoài gieo lại).
