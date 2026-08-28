# Task #123 — Mô hình giáo án: thư viện master, tuổi là đề xuất

> **Loại task:** mã + UI (M) — tách từ WP113.0d của
> [`Task #113`](113-game-engine-depth-and-seed-diversity-plan.md).
> **Spec sở hữu:** [`lesson-flow-model.md`](../specs/05-content/lesson-flow-model.md) — đóng,
> `status: draft` → `implemented` ở cuối task.
> **Chặn bởi:** không có. Chạy song song với nhánh engine (#115–#122).
> **Chặn:** [`Task #124`](124-lesson-corpus-depth-plan.md) — không tính được cầu trước khi
> chốt mô hình.

## 1. Trả lời ngắn

Quyết định `D-SI` (2026-08-29) đổi hai thứ trong mô hình giáo án:

1. **Lesson thuộc thư viện master, không thuộc riêng một flow.** Một lesson xuất hiện trong
   nhiều chương trình.
2. **Tuổi là đề xuất, không phải khoá.** Ghi danh cấm từ chối vì tuổi trẻ ngoài nhãn của flow.

Đổi thứ nhất làm cầu giảm từ **222 buổi phân vùng theo band** xuống **126 tiết dùng chung** —
tức chiều dài của flow dài nhất, `CUR-J42`. Thiếu 141 trở thành thiếu **45**.

Đổi thứ hai gỡ một nhánh 422 đang có ở route enrollment và thay bằng **cảnh báo đọc được**:
"Flow này gợi ý cho trẻ 5–6 tuổi, bé nhà bạn 3 tuổi" — không phải "Có thể không phù hợp".

Task #123 thi công hai đổi này. Nó **không** soạn nội dung — đó là Task #124.

## 2. Bằng chứng đã đo (2026-08-29)

| Số đo | Trước `D-SI` | Sau `D-SI` |
|---|---:|---:|
| Cầu giáo án | 222 buổi, phân vùng theo band | **126 tiết dùng chung** |
| Cung | 81 lesson `published` | 81 |
| Thiếu | 141 | **45** |
| Chương trình | 5 | 5 |
| Flow dài nhất | `CUR-J42` | `CUR-J42`, 126 tiết |

Cầu là chiều dài **flow dài nhất**, không phải tổng mọi flow (`BR-LCD-02`). Cộng dồn là đếm
trùng, vì lesson dùng lại được giữa các flow theo `BR-LFM-01`.

### 2.1 Lệnh tái dựng

```bash
cd mindkid
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
pnpm --filter @mindkid/db seed:report
grep -rn "target_age_min\|target_age_max" apps/web/server --include="*.ts"
grep -rn "422" apps/web/server/api/**/enrollment* 2>/dev/null
```

## 3. Work package

### WP123.1 — Thư viện master

**Cỡ:** M · **Ranh giới PR:** `packages/db`, `apps/web/server`

1. Lesson là bản ghi trong thư viện, flow tham chiếu tới lesson. Nếu lược đồ hiện tại đã như
   vậy thì bước này chỉ là khẳng định bằng test; nếu lesson đang gắn cứng vào flow thì đây là
   migration — **chạy ngoài local là Cấm — NEVER**, migration chỉ chạy local ở task này.
2. `BR-LFM-05` — một flow cấm chứa cùng một lesson hai lần. Cổng ở tầng dữ liệu, không chỉ ở UI.
3. `BR-LFM-01` — cùng lesson xuất hiện trong nhiều flow là **hợp lệ**. Test khẳng định điều đó,
   vì nó là thứ dễ bị "sửa" nhầm thành lỗi.
4. `BR-LFM-06` — thứ tự lesson trong flow thoả prerequisite (`BR-CRM-01`). Bỏ khoá tuổi làm
   prerequisite thành ràng buộc sư phạm **duy nhất** còn lại; nó **Cấm — NEVER** được nới theo.

### WP123.2 — Gỡ khoá tuổi ở ghi danh

**Cỡ:** S · **Ranh giới PR:** `apps/web/server`

1. Bỏ nhánh trả 422 theo tuổi ở route enrollment (`BR-LFM-02`).
2. Giữ nguyên `target_age_min` / `target_age_max` trên lesson và flow — chúng chuyển từ điều
   kiện sang tín hiệu xếp hạng (`BR-LFM-03`).
3. Gói vẫn quyết định tiết nào **mở được**; nó **không** quyết định flow nào ghi danh được
   (`BR-LFM-07`). Kiểm riêng: ghi danh flow ngoài gói vẫn thành công, tiết ngoài gói vẫn khoá.

**Ca âm bắt buộc:** ghi danh trẻ 3 tuổi vào `CUR-J42` (nhãn 5–6) phải **thành công**. Test này
là ca âm của chính rule cũ — nó đỏ trên mã hôm nay, đó là bằng chứng rule đã đổi thật.

### WP123.3 — Cảnh báo đọc được

**Cỡ:** S · **Ranh giới PR:** `apps/web/app`

`BR-LFM-04`: cảnh báo phải nêu **rõ lệch bao nhiêu**.

| Cấm | Bắt buộc |
|---|---|
| "Có thể không phù hợp" | "Flow này gợi ý cho trẻ 5–6 tuổi, bé nhà bạn 3 tuổi" |

1. Cảnh báo hiện ở màn ghi danh, trước khi xác nhận.
2. Cảnh báo **không** chặn — nút xác nhận vẫn bật (`BR-LFM-02`).
3. Test: lệch 2 tuổi thì câu chữ nêu đúng hai con số tuổi.
4. Bề mặt trẻ nhìn thấy **không** hiện cảnh báo này — nó cho người lớn.

### WP123.4 — Đề xuất xếp hạng

**Cỡ:** S · **Ranh giới PR:** `apps/web/server`

1. `target_age_*` vào hàm xếp hạng gợi ý flow (`BR-LFM-03`).
2. `BR-LFM-09` — bộ đề xuất **Cấm — NEVER** tự ghi danh thay phụ huynh. Test khẳng định đường
   đề xuất không gọi đường ghi danh.

### WP123.5 — `BR-LFM-08`: flow publish được khi lắp đủ

**Cỡ:** S · **Ranh giới PR:** `packages/db`

Flow chỉ `published` khi mọi tiết trỏ tới lesson `published` có thật. Hôm nay cầu 126 và cung
81, nên rule này sẽ **chặn** `CUR-J42` publish cho tới khi Task #124 soạn xong 45 tiết. Đó là
hành vi đúng — flow có buổi trống là chỗ phụ huynh nhìn thấy đầu tiên.

Ca âm: gỡ một lesson khỏi thư viện khi flow đang lắp đủ → flow không publish được.

## 4. Điều kiện nghiệm thu

1. Ghi danh trẻ 3 tuổi vào `CUR-J42` **thành công**, và cảnh báo nêu đúng hai con số tuổi.
2. Không route nào còn trả 422 vì tuổi ở đường ghi danh.
3. Một lesson xuất hiện trong nhiều flow — hợp lệ, có test.
4. Một flow chứa cùng lesson hai lần — bị chặn ở tầng dữ liệu, có test.
5. Thứ tự lesson vi phạm prerequisite — bị chặn.
6. Flow có tiết trỏ tới lesson không `published` — không publish được.
7. Đường đề xuất không gọi đường ghi danh.
8. Cầu tính bằng flow dài nhất, không cộng dồn — test trên 5 chương trình cho ra **126**.
9. Không migration nào chạy ngoài local.
10. `lesson-flow-model.md` mang `status: implemented`.
11. `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.

## 5. Ranh giới

**Always**
- Cảnh báo nêu con số cụ thể.
- Giữ prerequisite là ràng buộc cứng.
- Migration chỉ chạy local.

**Ask first**
- Đổi định nghĩa cầu khỏi "flow dài nhất".
- Thêm bất kỳ điều kiện chặn nào vào đường ghi danh.

**Never**
- Từ chối ghi danh vì tuổi (`BR-LFM-02`).
- Cảnh báo chung chung (`BR-LFM-04`).
- Nới prerequisite theo khi bỏ khoá tuổi (`BR-LFM-06`).
- Để bộ đề xuất tự ghi danh (`BR-LFM-09`).
- Publish flow có buổi trống (`BR-LFM-08`).
- Chạy migration ngoài local.

## 6. Câu hỏi mở

| # | Câu hỏi | Chặn gì | Chủ |
|---|---|---|---|
| `Q123-1` | Lược đồ hiện tại đã là thư viện master chưa, hay lesson đang gắn cứng vào flow? Quyết bằng cách đọc bảng, không suy đoán — nó quyết WP123.1 là test hay là migration | Cỡ WP123.1 | Backend |
| `Q123-2` | `CUR-J42` bị chặn publish cho tới khi Task #124 xong. Trong lúc đó nó hiện thế nào cho phụ huynh — ẩn hẳn, hay hiện kèm nhãn "đang soạn"? | UI | Product |
