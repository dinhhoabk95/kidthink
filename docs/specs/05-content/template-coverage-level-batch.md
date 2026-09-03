---
spec: TEMPLATE-COVERAGE-LEVEL-BATCH
title: Lô game level phủ khuôn — mười sáu khuôn chưa có nội dung
area: content
status: implemented
mvp: false
phase: P5
reviewed: 2026-08-30

owns:
  - Hạn ngạch game level cho khuôn chưa có nội dung (đã đạt 2026-08-29, bàn giao — xem mục 1.1)
  - Thứ tự nạp nội dung theo mức đói của năng lực
  - Ngưỡng khuôn ngoài rổ cơ bản trong mỗi ô phủ
depends_on:
  - GAME-LEVEL-MODEL
  - GAME-TEMPLATE-CONTRACT
  - TEMPLATE-AUTHORING-KIT
  - CONTENT-SEED-AUTHORING
  - THINKING-COVERAGE-MATRIX
  - CONTENT-TAGGING
---

# Lô game level phủ khuôn — mười sáu khuôn chưa có nội dung

## 1. Objective

> **Trạng thái 2026-08-29 — hạn ngạch của file này đã đạt.** Xem mục 1.1.

Engine có 24 khuôn trò chơi. Corpus nội dung dùng **tám**.

Đo ngày 2026-08-22 trên `packages/content/src/`: mọi hàng `template_code` đều nằm
trong `GT-001` tới `GT-008` — chạm chọn, kéo thả, ghép cặp, sắp thứ tự. `GT-009` tới `GT-024`
có `template.ts`, có `session.ts`, có `fixtures.ts` đủ ba mẫu để qua `BR-TAK-09`, và **không
một game level nào** trẻ mở được. Mê cung, cân hai bên, lưới không lặp, xoay kim đồng hồ,
nghe rồi làm, lật thẻ tìm cặp, hoàn thiện đối xứng, tìm vật thể ẩn, lắp ghép, vẽ theo nét —
mười sáu khuôn đã trả tiền xây, chưa khuôn nào gặp một đứa trẻ.

Hệ quả đo được: mỗi ô `competency × band tuổi` đạt sàn hai `mechanic` của `BR-TCM-05`, nhưng
cả 18 ô đều rút từ cùng một rổ tám khuôn dễ nhất. Sàn hai `mechanic` chỉ chứng minh ô đó có
hai cơ chế; nó không chứng minh trẻ gặp thứ gì khác ngoài chạm và kéo.

File này sở hữu **hạn ngạch** để lấp chỗ đó: mỗi khuôn chưa có nội dung được cấp một số level
tối thiểu, và mỗi ô phủ phải có ít nhất một level chạy trên khuôn ngoài rổ tám khuôn cơ bản.

### 1.1 Hạn ngạch đã đạt, sàn thường trực bàn giao cho spec khác

Đo lại ngày 2026-08-29, sau lô Montessori, lô kế thừa v1, và lô khoảng trống taxonomy:

| Số đo | 2026-08-22 | 2026-08-29 |
|---|---:|---:|
| Engine trong registry | 24 | **27** |
| Engine có ≥1 game level | 8 | **27** |
| Engine có ≥3 game level (`BR-TCL-01`) | 8 | **27** |
| Tổng game level | 172 | **228** |

`BR-TCL-01` (hạn ngạch mỗi khuôn ≥3 level) **đạt trên toàn bộ 27 engine**. Lô này xong phần
việc một lần của nó.

Nhưng 21 engine dừng **đúng** ở 3 hoặc 4 level, và ba là con số của `fixtures.ts`, không phải
con số của nội dung sản phẩm. Sàn thường trực từ đây thuộc
[`engine-content-depth.md`](engine-content-depth.md): hạn ngạch ≥3 của file này trở thành
**bậc 0** của bậc thang ở mục 7.3 spec đó, và bậc 1 nâng lên ≥6. Hai file không đặt hai sàn
khác nhau cho cùng một thứ — file này sở hữu **lô một lần**, spec kia sở hữu **sàn không
tụt**.

Nó **không** định nghĩa khuôn — đó là việc của mục 7.1 của
[`montessori-template-batch.md`](../01-platform/montessori-template-batch.md) và mục 7.1 của
[`legacy-v1-template-batch.md`](../01-platform/legacy-v1-template-batch.md). Nó cũng không
định nghĩa chuẩn biên tập của một level — đó là
[`game-level-model.md`](game-level-model.md).

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người soạn nội dung | `content_reviewer` | Soạn level theo hạn ngạch mục 7.2 |
| Cổng seed | — | Chặn level không parse được bằng `content_contract` |
| Cổng phủ | — | Chặn khi một ô thiếu khuôn ngoài rổ cơ bản |
| Người quyết | — | Duyệt đổi hạn ngạch hoặc đổi thứ tự nạp |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `packages/content/src/skills/c<n>/` · `manual/` | Người soạn nội dung | Nơi level mới được thêm |
| `pnpm --filter @mindkid/content-build seed:check` | Cổng seed | Bộ cổng nội dung, xem mục 7.3 của [`content-seed-authoring.md`](../01-platform/content-seed-authoring.md) |
| `pnpm --filter @mindkid/db test` | Cổng phủ | Ma trận phủ, xem mục 7.2 của [`thinking-coverage-matrix.md`](../08-quality/thinking-coverage-matrix.md) |
| [`game-level-studio.md`](../06-admin/game-level-studio.md) | Người soạn nội dung | Bề mặt soạn level |

## 4. Main flow

Trình tự cho **một** khuôn trong lô:

1. Đọc hàng của khuôn ở mục 7.2 — số level, band tuổi mở được, năng lực nhắm tới.
2. Đọc `template.ts` của khuôn đó lấy `limits`, `age_min`, `age_max`, `banned_age_bands`.
3. Soạn level trong trần item theo band ở mục 7.1 của
   [`game-level-model.md`](game-level-model.md), giao với `limits` của khuôn.
4. Gắn tag ba trục bằng từ vựng đóng ở mục 7.1 của
   [`content-tagging.md`](../01-platform/content-tagging.md).
5. Kiểm `content_pack` parse được bằng `content_contract` của khuôn (`BR-TCL-03`).
6. Chạy `pnpm --filter @mindkid/db seed:check` rồi `pnpm --filter @mindkid/db test`.
7. Cả hai xanh thì level vào corpus qua PR.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| `content_pack` không parse được | Soạn theo hình dạng cũ | Cổng seed đỏ, nêu đường dẫn field sai. Cấm nhánh bỏ qua |
| Khuôn cấm band mà ô cần | Ví dụ `GT-024` cấm band 3–4 | Ô đó lấp bằng khuôn khác ngoài rổ cơ bản, ghi lại lựa chọn ở PR |
| Số item vượt `limits` của khuôn | Soạn theo trần của band | Lấy giao của hai trần, không lấy trần rộng hơn |
| Khuôn cần asset ngoài ba loại đã có | Ví dụ cần ảnh cặp | **Ask first** trước khi soạn |
| Ô đã đạt sàn nhưng vẫn chỉ có khuôn trong rổ cơ bản | Sàn số lượng đủ, đa dạng chưa | Cổng phủ đỏ theo `BR-TCL-04` |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-TCL-01` (hạn ngạch mỗi khuôn) | Mỗi khuôn trong mục 7.2 có **≥3** game level `published` thật trong corpus seed. **Đạt 2026-08-29 trên 27 engine**; sàn thường trực tiếp theo ở `BR-ECD-01` | Ba là con số `BR-TAK-09` đã dùng cho `fixtures.ts`. Fixture chứng minh contract chạy; level chứng minh trẻ chơi được |
| `BR-TCL-02` (level thật, không phải fixture) | Level của lô này nằm trong corpus seed, **không** tính `fixtures.ts` của thư mục khuôn | `fixtures.ts` không đi qua bộ cổng nội dung, không có tag ba trục, không vào ma trận phủ. Đếm nó là tự lừa |
| `BR-TCL-03` (parse được) | `content_pack` và `difficulty_params` của mọi level mới **parse được** bằng `content_contract` và `difficulty_contract` của khuôn | `BR-GTC-10`. Đo lại ngày 2026-08-29 trên 228 level: **162 không parse được `content_pack`** và **170 không parse được `difficulty_params`**; sáu engine MVP trượt 100% vì thiếu trường `prompt`. Vẫn không cổng nào phát hiện — nguyên nhân đọc được ở mục 7.3a của [`content-seed-authoring.md`](../01-platform/content-seed-authoring.md). Lô này cấm làm con số đó to thêm |
| `BR-TCL-04` (khuôn ngoài rổ cơ bản) | Mỗi ô `competency × band tuổi` có **≥1** level chạy trên khuôn ngoài `GT-001`..`GT-008` | Đây là chỗ chữ "đa dạng" thành số đếm được. Sàn hai `mechanic` của `BR-TCM-05` đạt được bằng hai khuôn dễ nhất, nên nó không đo được điều này |
| `BR-TCL-05` (thứ tự theo mức đói) | Nạp theo thứ tự ở mục 7.3, năng lực đói nhất trước | C4 và C5 là hai khoảng trống lớn nhất của sản phẩm. Nạp theo thứ tự mã khuôn sẽ dồn nội dung vào C1 lần nữa |
| `BR-TCL-06` (một level một skill) | Mỗi level trỏ đúng một skill `weight = 1.0` | Giữ nguyên mục 7.4 của [`game-level-model.md`](game-level-model.md). Level hai skill làm ma trận phủ đếm trùng |
| `BR-TCL-07` (không nới sàn) | Ô không đạt sàn thì soạn thêm level, **cấm** hạ sàn hay mở rộng từ vựng tag | Nới cổng để nội dung hiện tại đi qua là đúng thứ đã làm hỏng trục `thinking` một lần rồi |
| `BR-TCL-08` (band khai trong khuôn thắng) | Band tuổi của level nằm trong `age_min`..`age_max` và ngoài `banned_age_bands` của khuôn | Khuôn khai cấm band nào là có lý do phát triển, không phải tham số độ khó |

## 7. Data

**Đọc:** `packages/game-engine/src/templates/*/template.ts` · `docs/taxonomy/`.
**Ghi:** `packages/content/src/skills/c<n>/` · hàng seed `game_levels`.

### 7.1 Số đo trước lô

| Khuôn | Game level trong corpus |
|---|---:|
| `GT-001` tới `GT-008` | 172 |
| `GT-009` tới `GT-024` | 0 |

Ba level đầu tiên ngoài rổ cơ bản đã được thêm ngày 2026-08-22 để lấp ba ô thủng sàn:
`GL-C4-VIS-SCENE-0021` trên `GT-022`, `GL-C5-LIS-AUDIO-0021` trên `GT-018`,
`GL-C6-PLN-MAZE-0021` trên `GT-013`. Chúng là ca mẫu cho phần còn lại của lô.

### 7.2 Hạn ngạch

| Khuôn | Tên | Năng lực nhắm tới | Band mở | Level tối thiểu |
|---|---|---|:--:|---:|
| `GT-009` | Loại trừ theo manh mối | C3 | 4–6 | 3 |
| `GT-010` | Thay thế biểu tượng | C1 · C3 | 4–6 | 3 |
| `GT-011` | Ma trận chọn hình | C3 · C2 | 5–6 | 3 |
| `GT-012` | Nhìn chớp rồi nhớ lại | C6 · C1 | 3–6 | 3 |
| `GT-013` | Tìm đường mê cung | C6 · C2 | 4–6 | 3 |
| `GT-014` | Cân hai bên | C1 · C3 | 5–6 | 3 |
| `GT-015` | Lưới không lặp | C3 | 5–6 | 3 |
| `GT-016` | Xoay kim đồng hồ | C1 | 5–6 | 3 |
| `GT-017` | Xếp khối và phối cảnh | C2 | 5–6 | 3 |
| `GT-018` | Nghe rồi làm | C5 · C3 | 4–6 | 3 |
| `GT-019` | Xoay và lật mảnh | C2 | 4–6 | 3 |
| `GT-020` | Lật thẻ tìm cặp | C6 | 3–6 | 3 |
| `GT-021` | Hoàn thiện đối xứng | C2 | 4–6 | 3 |
| `GT-022` | Tìm vật thể ẩn | C4 | 4–6 | 3 |
| `GT-023` | Lắp ghép hình thể | C2 | 4–6 | 3 |
| `GT-024` | Vẽ theo nét | C2 | 5–6 | 3 |

Tổng: **48** game level mới. Cột năng lực lấy từ mục 7.1 của
[`montessori-template-batch.md`](../01-platform/montessori-template-batch.md) và mục 7.1 của
[`legacy-v1-template-batch.md`](../01-platform/legacy-v1-template-batch.md); cột band lấy từ
`template.ts` của chính khuôn.

### 7.3 Thứ tự nạp

| Đợt | Khuôn | Vì sao trước |
|---|---|---|
| 1 | `GT-022` · `GT-018` · `GT-020` · `GT-012` · `GT-013` | Năm khuôn này phục vụ C4, C5, C6 — ba năng lực mà [`c4-observation-thinking.md`](../../taxonomy/c4-observation-thinking.md) và [`c5-language-thinking.md`](../../taxonomy/c5-language-thinking.md) ghi là khoảng trống lớn nhất và yếu nhất |
| 2 | `GT-019` · `GT-021` · `GT-023` · `GT-024` · `GT-017` | C2 — có 11 dạng bài v1 nhưng corpus hiện tại chỉ chơi được bằng chạm và kéo |
| 3 | `GT-009` · `GT-011` · `GT-015` · `GT-010` | C3 và C1 suy luận |
| 4 | `GT-014` · `GT-016` | C1 đo lường |

### 7.4 Kiểm trước khi gửi duyệt

- [ ] `content_pack` parse được bằng `content_contract` của khuôn.
- [ ] `difficulty_params` parse được bằng `difficulty_contract` của khuôn.
- [ ] Đúng một skill `weight = 1.0`.
- [ ] Tag ba trục nằm trong từ vựng đóng.
- [ ] Band tuổi hợp lệ với khuôn.
- [ ] Số item trong giao của trần band và `limits` khuôn.
- [ ] `pnpm --filter @mindkid/db test` không tụt ô nào.

## 8. API contract

Không sở hữu route. Level của lô này đi qua route seed thuộc mục 8 của
[`content-seed-authoring.md`](../01-platform/content-seed-authoring.md), không đổi hình dạng.

## 9. Acceptance criteria

```gherkin
Scenario: BR-TCL-01 — mỗi khuôn có đủ ba level
  Given lô đã nạp xong
  When đếm game level published theo template_code
  Then mỗi mã từ GT-009 tới GT-024 có ít nhất ba level

Scenario: BR-TCL-02 — fixture không được tính thay level
  Given khuôn GT-015 có ba fixture và không có game level nào
  When chạy cổng của lô
  Then cổng báo GT-015 còn thiếu ba level

Scenario: BR-TCL-03 — level không parse được thì bị chặn
  Given một level mới khai template_code GT-013
  And content_pack của nó thiếu trường grid
  When chạy cổng seed
  Then cổng đỏ và nêu trường còn thiếu

Scenario: BR-TCL-04 — ô chỉ có khuôn cơ bản thì bị chặn
  Given ô C3 band 5-6 có tám level và tất cả chạy trên GT-001 tới GT-008
  When chạy cổng phủ
  Then cổng đỏ và nêu ô đó thiếu khuôn ngoài rổ cơ bản

Scenario: BR-TCL-05 — thứ tự nạp theo mức đói
  When đọc kế hoạch nạp của lô
  Then đợt một chỉ gồm khuôn phục vụ C4, C5, C6

Scenario: BR-TCL-07 — không nới sàn để nội dung đi qua
  Given một ô còn thiếu hai level
  When ai đó hạ sàn của ô đó xuống
  Then thay đổi đó bị từ chối ở review

Scenario: BR-TCL-08 — band khai trong khuôn thắng
  Given khuôn GT-024 khai banned_age_bands ["3-4"]
  When soạn một level GT-024 cho band 3-4
  Then cổng seed đỏ và nêu band bị cấm
```

## 10. Boundaries

**Always**

- Soạn level thật vào corpus seed, không dừng ở fixture.
- Kiểm `content_pack` parse được trước khi gửi duyệt.
- Nạp theo thứ tự mức đói ở mục 7.3.
- Lấy giao của trần band và `limits` khuôn.

**Ask first**

- Đổi hạn ngạch ba level mỗi khuôn.
- Đổi thứ tự nạp ở mục 7.3.
- Dùng loại asset ngoài ba loại đã có.

**Never**

- Đếm `fixtures.ts` thay cho game level.
- Hạ sàn hoặc mở rộng từ vựng tag để nội dung hiện tại đi qua.
- Soạn level cho band mà khuôn đã cấm.
- Gắn hai skill `weight = 1.0` cho một level.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ | Quyết định / Trạng thái |
|---|---|---|---|---|---|
| 1 | 162 trên 228 level không parse được `content_pack` và 170 không parse được `difficulty_params` (đo lại 2026-08-29). Sửa nội dung cũ trước, hay nạp nội dung mới song song rồi sửa sau? Bản published bất biến nên sửa là INSERT version mới cho từng level | Thứ tự việc của lô, và `BR-GTC-10`. Chặn cứng: bật `BR-CSA-16` (cổng 1 nạp contract thật) làm đỏ 162 level ngay | P5 | người quyết | Mở. Trùng câu hỏi 5 ở mục 11 của [`thinking-coverage-matrix.md`](../08-quality/thinking-coverage-matrix.md) |
| 2 | Ba level mỗi khuôn có đủ để một khuôn "sống" không, hay cần đủ cả ba band tuổi mà khuôn mở? Mười sáu khuôn nhân ba band là 48 so với 144 | Hạn ngạch `BR-TCL-01` | P5 | Nội dung | Mở |
| 3 | Ai soạn 48 level này? Lô Montessori có tiền lệ người soạn theo workbook, lô này không có nguồn tương đương | Kế hoạch người soạn | P5 | Nội dung | hoãn — chốt cùng lúc chốt người biên soạn |
| 4 | `GT-018` cần audio tiếng Việt. Corpus chưa có đường sản xuất audio nào | Đợt một của mục 7.3 | P5 | Nội dung | Mở |
