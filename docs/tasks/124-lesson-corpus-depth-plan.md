# Task #124 — Cung giáo án: 45 tiết, 48 level, và 151 liên kết sai kỹ năng

> **Loại task:** nội dung + cổng (M) — tách từ WP113.0d của
> [`Task #113`](113-game-engine-depth-and-seed-diversity-plan.md).
> **Spec sở hữu:** [`lesson-corpus-depth.md`](../specs/05-content/lesson-corpus-depth.md) —
> đóng, `status: draft` → `implemented` ở cuối task.
> **Chặn bởi:** [`Task #123`](123-lesson-flow-model-plan.md) — cầu chỉ tính được sau khi mô
> hình chốt.

## 1. Trả lời ngắn

Sau `D-SI`, cầu là **126 tiết**, cung là **81 lesson**, thiếu **45**.

Nhưng thiếu tiết không phải vấn đề nặng nhất. Đo cùng ngày: **151 trên 162 bước chơi trỏ sai
kỹ năng** (`BR-LTV-04`). Kiểm mẫu bốn bài học xác nhận vi phạm là thật, không phải lỗi đo.

Nguyên nhân đo được: **23 trên 40 kỹ năng của thư viện giáo án có 0 game level**, 2 kỹ năng có
1. Mỗi bài học cần đúng hai bước chơi và `BR-LTV-02` cấm hai bước cùng khuôn — nên kỹ năng có
dưới hai level thì bài học của nó **không lắp được**. Ai đó đã nối bước chơi vào level của kỹ
năng khác cho đủ số.

Quyết định `D-SJ` (2026-08-29) chốt đường xử lý: **soạn thêm level, cấm nối bừa** (`BR-LCD-11`).

Task #124 làm ba việc theo đúng thứ tự bắt buộc: soạn **48 level** cho 25 kỹ năng thiếu → nối
lại **151** bước chơi → soạn **45 giáo án**. Nối trước khi level tồn tại là lặp lại đúng lỗi cũ.

## 2. Bằng chứng đã đo (2026-08-29)

| Số đo | Giá trị |
|---|---:|
| Cầu — chiều dài `CUR-J42` | 126 tiết |
| Cung — lesson `published` | 81 |
| Thiếu | **45** |
| Kỹ năng trong thư viện giáo án | 40 |
| Kỹ năng có **0** game level | **23** |
| Kỹ năng có **1** game level | 2 |
| Level phải soạn để mọi kỹ năng có ≥2 | **48** |
| Bước chơi trỏ sai kỹ năng | **151 / 162** |
| Liên kết lesson → activity → level | 162, **0 mã treo** |
| `BR-LTV-01` `BR-LTV-02` `BR-LSM-02` | đạt 81/81 |
| `GT-007` và `GT-008` nối vào bài học | **0** — vi phạm `BR-LTV-09` |

Chuỗi liên kết **không hỏng về cấu trúc** — 0 mã treo. Nó hỏng về **ngữ nghĩa**: liên kết trỏ
tới level có thật, chỉ là level đó dạy kỹ năng khác. Đó là lý do mọi cổng cấu trúc vẫn xanh.

### 2.1 Vì sao 48 chứ không phải 50

23 kỹ năng × 2 + 2 kỹ năng × 1 = **48**. Con số này **đo lại** sau khi chốt danh sách 45 tiết
mới: tiết mới mang kỹ năng mới, mỗi kỹ năng mới cộng thêm 2 level. Đó là `Q124-1`.

### 2.2 Lệnh tái dựng

```bash
cd mindkid
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
pnpm --filter @mindkid/db seed:report
pnpm --filter @mindkid/db test -- lesson
```

## 3. Work package

### WP124.1 — Chốt danh sách 45 tiết

**Cỡ:** S · **cổng người, không soạn nội dung**

1. Liệt kê 45 tiết còn thiếu của `CUR-J42`: vị trí trong flow, kỹ năng, prerequisite.
2. Đối chiếu prerequisite (`BR-LFM-06`) — kỹ năng phải xuất hiện sau mọi prerequisite của nó.
3. Liệt kê **kỹ năng mới** mà 45 tiết này mang vào. Mỗi kỹ năng mới cộng 2 level vào ngân sách.
4. Đo lại con số 48 → con số thật. Trả lời `Q124-1`.
5. Người quyết duyệt danh sách.

**Cấm — NEVER** soạn level trước khi danh sách này có chữ ký: soạn 48 level cho danh sách kỹ
năng cũ rồi phát hiện 45 tiết mới mang thêm 12 kỹ năng là soạn hai lần.

### WP124.2 — Soạn level cho kỹ năng thiếu

**Cỡ:** M · **Ranh giới PR:** một PR mỗi năm kỹ năng

Ưu tiên kỹ năng nền trước — kỹ năng là prerequisite của nhiều kỹ năng khác chặn nhiều tiết nhất.

1. Mỗi kỹ năng đạt **≥2** level `published` (`BR-LCD-10`).
2. Hai level của cùng một kỹ năng **cấm cùng khuôn** — `BR-LTV-02` yêu cầu hai bước chơi khác
   khuôn, nên hai level cùng `GT-001` thì bài học vẫn không lắp được.
3. `GT-007` và `GT-008` nối vào ít nhất một bài học (`BR-LTV-09`) — hai engine này có 27 level
   mà 0 liên kết giáo án.
4. Level mới đi qua đủ tám cổng của [`Task #117`](117-seed-gate-truth-plan.md).
5. Số level ở WP này **cộng dồn** vào ngân sách [`Task #122`](122-engine-content-depth-plan.md).
   Soạn một lần, đếm vào cả hai chỗ.

### WP124.3 — Nối lại 151 bước chơi

**Cỡ:** M · **Ranh giới PR:** một PR mỗi bài học nhóm

**Chỉ sau khi** WP124.2 xong. `BR-LCD-11` cấm nối bừa; nối trước khi level tồn tại là bừa theo
định nghĩa.

1. Mỗi bước chơi trỏ tới level phục vụ **đúng** kỹ năng của bước đó.
2. Hai bước của một bài học khác khuôn (`BR-LTV-02`).
3. Mọi thay đổi là **version mới**, cấm `UPDATE` bản published.
4. Kiểm mẫu bốn bài học bằng tay sau khi nối lại — cùng bốn bài đã dùng để xác nhận vi phạm.

### WP124.4 — Soạn 45 giáo án

**Cỡ:** M · **Ranh giới PR:** một PR mỗi năm tiết

1. Không phân theo band — thư viện master dùng chung (`BR-LFM-01`).
2. Mỗi tiết trỏ tới lesson thật, **không** ô trống, **không** lesson giữ chỗ (`BR-LCD-04`).
3. **Cấm — NEVER** lấp tiết bằng cách lặp lesson trong cùng flow (`BR-LCD-05`).
4. Mỗi lesson lắp đủ hai bước chơi khác khuôn, trỏ đúng kỹ năng.

### WP124.5 — `check:lesson-supply`

**Cỡ:** M · **File:** 2 cộng fixture · **Ranh giới PR:** `packages/db`

Cổng đo **hai** cầu, không phải một:

| Cầu | Phép kiểm |
|---|---|
| Cầu tiết | Cung lesson `published` ≥ chiều dài flow dài nhất `published` (`BR-LCD-02`) |
| Cầu level | Mỗi kỹ năng của thư viện có ≥2 level `published` (`BR-LCD-10`) |

1. Chỉ đếm `published`; `draft` và `in_review` không tính (`BR-LCD-03`).
2. Báo cáo in **từng chương trình kèm số buổi còn thiếu** (`BR-LCD-08`). **Cấm — NEVER** in tỉ
   lệ phần trăm tổng — một con số 36 % che được `CUR-J42` thiếu 45 buổi.
3. Nguồn không đọc được → **đỏ**, cấm giá trị mặc định (`BR-LCD-06`).
4. Giảm `durationWeeks` hoặc `sessionsPerWeek` để cổng xanh cần **người quyết**, ghi vào PR kèm
   lý do (`BR-LCD-07`). Rút chương trình 42 tuần xuống 12 tuần là đổi sản phẩm.

**Ca âm bắt buộc** (`BR-LCD-09`):
- bớt một lesson khi thư viện đang sát cầu → đỏ;
- một kỹ năng tụt xuống 1 level → đỏ;
- lặp cùng một lesson hai lần trong một flow → đỏ;
- trỏ cổng vào nguồn không đọc được → đỏ, không trả 0 rồi xanh.

## 4. Điều kiện nghiệm thu

1. `check:lesson-supply` in `cầu tiết 126, cung 126` và `0 kỹ năng thiếu level`.
2. Bốn ca âm đều đỏ vì đúng lý do.
3. `CUR-J42` **publish được** — mọi tiết trỏ lesson `published` có thật (`BR-LFM-08`).
4. 0 bước chơi trỏ sai kỹ năng — `BR-LTV-04` đạt 162/162.
5. `GT-007` và `GT-008` mỗi engine nối vào ≥1 bài học (`BR-LTV-09`).
6. Mọi kỹ năng của thư viện có ≥2 level, và hai level đó **khác khuôn**.
7. Không bản ghi published nào bị `UPDATE`.
8. Báo cáo in từng chương trình kèm số buổi thiếu, không in phần trăm tổng.
9. Kiểm mẫu bốn bài học bằng tay — đúng kỹ năng, đúng khuôn.
10. `lesson-corpus-depth.md` mang `status: implemented`.
11. `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.

## 5. Ranh giới

**Always**
- Soạn level trước, nối bước chơi sau.
- Version mới cho mọi thay đổi.
- Cộng dồn ngân sách level với Task #122.

**Ask first**
- Giảm `durationWeeks` hoặc `sessionsPerWeek` (`BR-LCD-07`).
- Đổi định nghĩa cầu.

**Never**
- Nối bước chơi vào level của kỹ năng khác cho đủ số (`BR-LCD-11`).
- Lặp lesson trong cùng một flow để lấp tiết (`BR-LCD-05`).
- Ô trống hoặc lesson giữ chỗ (`BR-LCD-04`).
- Đếm lesson `draft` hoặc `in_review` (`BR-LCD-03`).
- In tỉ lệ phần trăm tổng thay danh sách thiếu (`BR-LCD-08`).
- Trả giá trị mặc định khi nguồn hỏng (`BR-LCD-06`).
- `UPDATE` bản đã publish.

## 6. Câu hỏi mở

| # | Câu hỏi | Chặn gì | Chủ |
|---|---|---|---|
| `Q124-1` | 45 tiết mới mang thêm bao nhiêu kỹ năng mới, và ngân sách level thật là bao nhiêu — 48 hay hơn? Đo sau WP124.1 | WP124.2 | Nội dung |
| `Q124-2` | Hai level của một kỹ năng phải khác khuôn. Với kỹ năng chỉ một engine phục vụ được, lấy khuôn thứ hai ở đâu? | WP124.2 | Sư phạm |
| `Q124-3` | 151 bước chơi nối lại là 151 version mới của activity. Có gộp thành một lô version hay từng cái? Ảnh hưởng khối lượng review | WP124.3 | Nội dung |
