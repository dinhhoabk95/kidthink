# Todo — Task #113: Chiều sâu engine và độ đa dạng dữ liệu seed (P4)

> Lý do, bằng chứng đo, và assumption: [`113-game-engine-depth-and-seed-diversity-plan.md`](113-game-engine-depth-and-seed-diversity-plan.md).
>
> Đặt lại đường dẫn Node trước mọi lệnh: `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`.
> Node trên PATH là v20 và làm `tsx` dừng với mã 139.

> **Chuyển chủ sở hữu — 2026-08-29.** 64 việc còn mở của checklist này đã được tách thành 11
> task có ranh giới PR riêng ở [`Task #114`](114-next-roadmap-plan.md) mục 4. Lý do: một plan
> gánh cùng lúc bốn loại việc khác nhịp — phê duyệt spec, thi công cổng, sửa nợ dữ liệu, soạn
> nội dung — nên không nhánh nào đóng được trọn vẹn. **Không tick ô nào của file này theo tiến
> độ task mới**: việc chưa làm, chỉ đổi chủ.
>
> | WP của #113 | Task tiếp nhận |
> |---|---|
> | `113.0` — phê duyệt bốn spec | [#119](119-theme-registry-plan.md) · [#121](121-level-generator-kit-plan.md) · [#122](122-engine-content-depth-plan.md) · [#125](125-go-live-readiness-plan.md), mỗi task lật spec của mình |
> | `113.0b` — hợp đồng vẽ và go-live | [#115](115-render-contract-core-plan.md) · [#116](116-engine-vertical-slices-plan.md) · [#125](125-go-live-readiness-plan.md) |
> | `113.0c` — dọn `CUSTOM_GAME_TEMPLATE_CODES` | [#115](115-render-contract-core-plan.md) WP115.0 |
> | `113.0d` — trục giáo án | [#123](123-lesson-flow-model-plan.md) · [#124](124-lesson-corpus-depth-plan.md) |
> | `113.1` — 27 phiếu engine | [#120](120-engine-spec-contract-plan.md) |
> | `113.2` — cổng đối chiếu phiếu | [#120](120-engine-spec-contract-plan.md) WP120.1 |
> | `113.2a` — sửa cổng 1 và cổng 5 | [#117](117-seed-gate-truth-plan.md) |
> | `113.3` — cổng chiều sâu | [#122](122-engine-content-depth-plan.md) WP122.1 |
> | `113.4` — 42 level ngoài band | [#118](118-band-violation-cleanup-plan.md) |
> | `113.4a` — 162 level không parse | [#117](117-seed-gate-truth-plan.md) WP117.4 |
> | `113.5` — registry chủ đề | [#119](119-theme-registry-plan.md) |
> | `113.6` — bộ sinh level | [#121](121-level-generator-kit-plan.md) |
> | `113.7` — soạn nội dung tới sàn | [#122](122-engine-content-depth-plan.md) WP122.3 |

## Preflight

- [x] Đo 27 engine từ registry: cơ chế, layout, band, `limits`, khoá contract.
- [x] Đo 228 game level: phân bố theo engine, band, trục `thinking`, trục `what`, chủ đề, tier.
- [x] Đo 552 hàng seed qua tám cổng: 0 trượt.
- [x] Đối chiếu band level với band engine: **42 vi phạm** — mục 2.7 của plan.
- [x] Parse `content_pack` bằng `content_contract` thật: **162/228 trượt**; `difficulty_params`: **170/228** — mục 2.8.
- [x] Đọc đường vẽ đầu cuối: vòng lặp, canvas, layout, bộ vẽ nguyên thuỷ đều **có**; `render()` cài đặt **0/27** — mục 2.10.
- [x] Trục giáo án: 5 chương trình đòi **222 buổi**, corpus có **81 lesson** — mục 2.12.
- [x] Chuỗi lesson → activity → level: **162 liên kết, 0 mã treo**; `BR-LTV-01`/`02`/`BR-LSM-02` đạt 81/81.
- [x] `BR-LTV-04`: **151/162 bước chơi trỏ sai kỹ năng** — mục 2.13. Kiểm mẫu 4 bài học, vi phạm là thật.
- [x] Phạm vi go-live chốt: 27 engine + 222 buổi, không rút (`D-SH`) — mục 2.14.
- [x] `CUSTOM_GAME_TEMPLATE_CODES` có hai bản: 6 ở `@mindkid/shared`, 27 ở `@mindkid/game-engine` — mục 2.11.
- [x] Đối chiếu **bốn** nguồn từ vựng tag: cổng ép trên hợp 28 giá trị cho `what`, 22 cho `theme` — mục 2.9.
- [x] `pnpm --filter @mindkid/db test`: **1 fail / 798** — `thinking-coverage.test.ts`, 7 vi phạm `BR-TCM-01` ở trục `theme`. Đỏ sẵn trước Task #113.
- [ ] Người duyệt tái dựng lại số đo trên máy mình trước khi approve sàn.

## WP113.0a — Đồng bộ corpus đã có

- [x] `content-tagging.md`: bàn giao trục `theme`, thêm bảng độ trôi ba trục, thêm câu hỏi mở về trục `what`.
- [x] `content-seed-authoring.md`: cột "Thi công" cho 8 cổng, mục 7.3a bằng chứng xanh giả, `BR-CSA-15` và `BR-CSA-16`.
- [x] `thinking-coverage-matrix.md`: đo lại 172 → 228 level, ghi `BR-TCM-01` chưa đạt ở cổng seed.
- [x] `template-coverage-level-batch.md`: hạn ngạch đã đạt trên 27 engine, bàn giao sàn thường trực, đo lại 169/172 → 162/228.
- [x] `game-template-contract.md`: trỏ 27 engine, thêm bước viết phiếu, đóng câu hỏi 1 (`D-SG`), ghi `BR-GTC-10` chưa nối cổng.
- [x] `template-authoring-kit.md`: thêm bước 8 viết phiếu, ghi trần đã dời sang nội dung.
- [x] Ba spec lô khuôn: trỏ tới phiếu engine.
- [x] `game-level-model.md`: ranh giới với chiều sâu nội dung.
- [x] `CONVENTIONS.md`: thư mục `engines/`, khuôn rút gọn mười mục.
- [x] `business-rules.md`: 4 prefix mới. `error-codes.md`: `THEME_NOT_SUPPORTED`.
- [x] `roadmap.md`: thứ tự bốn spec ở P4.

## WP113.0 — Bốn spec mới

- [x] [`engine-spec-sheet.md`](../specs/01-platform/engine-spec-sheet.md) — `BR-ESS-01`…`09`.
- [x] [`engine-content-depth.md`](../specs/05-content/engine-content-depth.md) — `BR-ECD-01`…`13`.
- [x] [`level-generator-kit.md`](../specs/01-platform/level-generator-kit.md) — `BR-LGK-01`…`10`.
- [x] [`content-theme-registry.md`](../specs/05-content/content-theme-registry.md) — `BR-CTR-01`…`11`.
- [x] Đăng ký cả bốn vào [`index.md`](../specs/index.md), cập nhật bảng tổng.
- [ ] Người quyết approve, đổi `status: draft` thành `approved`.

## WP113.1 — Hai mươi bảy phiếu engine

- [x] Viết đủ 27 phiếu `GT-001`…`GT-027` theo mười mục ở mục 7.1 của [`engine-spec-sheet.md`](../specs/01-platform/engine-spec-sheet.md).
- [x] Bốn mục trích lấy từ registry, kèm nguồn dòng dạng `đường-dẫn:số-dòng`.
- [x] Mỗi phiếu có ma trận seed mục tiêu (`BR-ESS-05`) và ít nhất một ca sai không bắt được bằng schema (`BR-ESS-06`).
- [x] Sinh [`engines/index.md`](../specs/01-platform/engines/index.md) bằng `pnpm --filter @mindkid/game-engine gen:engine-index`.
- [ ] Người soạn nội dung đọc lại phần viết tay của 21 phiếu chưa từng soạn nội dung — câu hỏi 3 ở mục 11 của [`engine-spec-sheet.md`](../specs/01-platform/engine-spec-sheet.md).

## WP113.0b — Hợp đồng vẽ và go-live

> Chặn cứng ngang WP113.2a. Hai cái nhân nhau: không vẽ thì nội dung vô nghĩa, không parse được thì vẽ gì cũng không có.

- [x] [`engine-render-contract.md`](../specs/01-platform/engine-render-contract.md) — `BR-ERC-01`…`11`.
- [x] [`go-live-readiness.md`](../specs/08-quality/go-live-readiness.md) — `BR-GLR-01`…`08`, 13 mục chặn cứng và cảnh báo.
- [x] Mục 11 "Hợp đồng vẽ" cho cả 27 phiếu: slot dùng, bảng bốn lớp, trạng thái thị giác riêng, thứ tự tuột.
- [x] `engine-spec-sheet.md`: 10 → 11 mục, thêm `BR-ESS-10`.
- [x] Phạm vi go-live: **toàn bộ 27 engine và 222 buổi**, chủ dự án bác phương án rút (`D-SH`).
- [ ] Đo chi phí cài `render()` trên một engine mẫu trước khi cam kết lịch: `GT-001` đơn giản nhất, `GT-013` mê cung phức tạp nhất.
- [ ] Quyết `RenderSystem` có cần bộ vẽ nguyên thuỷ mới cho mê cung, đồng hồ, cân không.
- [ ] Cài `render()` cho engine trong phạm vi, kèm test vẽ (`BR-ERC-11`).
- [ ] Thi công `check:render` kèm ca âm: bỏ `render()` của một engine phải làm cổng đỏ.
- [ ] Thi công `check:go-live` đọc corpus và mã nguồn, đỏ khi nguồn không đọc được.

## WP113.0c — Dọn `CUSTOM_GAME_TEMPLATE_CODES`

- [ ] Xoá `CUSTOM_GAME_TEMPLATE_CODES` khỏi `packages/game-engine/src/generated/template-codes.ts` và khỏi barrel `index.ts` — bản 27 không ai dùng và tự lớn thêm mỗi lần thêm engine.
- [ ] `create.vue` import danh sách từ `@mindkid/shared` thay vì viết tay `switch`.
- [ ] Test khẳng định chỉ còn **một** hằng số mang tên đó trong monorepo.

## WP113.0d — Trục giáo án

> Mô hình đổi 2026-08-29: `D-SI` thư viện master và tuổi là đề xuất; `D-SJ` soạn thêm level.
> Cầu tiết giảm 222 → **126**, thiếu 141 → **45**. Cộng **48 level** phải soạn.

> Chạy song song WP113.0b và WP113.2a — nguồn lực khác nhau (người soạn, không phải dev).

- [x] [`lesson-flow-model.md`](../specs/05-content/lesson-flow-model.md) — `BR-LFM-01`…`09`, thư viện master, tuổi là đề xuất (`D-SI`).
- [x] [`lesson-corpus-depth.md`](../specs/05-content/lesson-corpus-depth.md) — viết lại theo mô hình flow: cầu `max` 126, cung 81, cộng `BR-LCD-10` và `BR-LCD-11` cho cầu level.
- [x] `curriculum-player.md`: bỏ điều kiện **422 khi tuổi ngoài khoảng** (`D-ME` bị thay thế).
- [x] `curriculum-model.md`: `age_based` thành nhãn đề xuất; prerequisite là ràng buộc sư phạm duy nhất còn lại.
- [x] `lesson-template-variety.md`: đo lại `digital_game` 0 → 162, thêm `BR-LTV-09` phủ engine và `BR-LTV-10` phủ level.
- [x] `go-live-readiness.md`: 8 mục chặn cứng trục giáo án, `BR-GLR-09` hai trục cùng đạt.
- [x] Câu hỏi mốc chuyển band của `CUR-J42`: **đóng** (`D-SI`) — không còn phân vùng band nào để chốt.
- [ ] Soạn **48 game level** cho 25 kỹ năng đang thiếu (23 kỹ năng có 0 level, 2 kỹ năng có 1). Ưu tiên kỹ năng nền: `C1.CNT.01` `C1.CNT.02` `C1.CNT.03` `C1.CNT.11` `C2.POS.01` `C2.2D.01` `C2.2D.02` `C3.PAT.01` `C4.LEN.01` `C4.WGT.01`.
- [ ] Nối lại **151** bước chơi vào level đúng kỹ năng, **sau khi** level tồn tại (`BR-LCD-11` cấm nối bừa).
- [ ] Nối `GT-007` và `GT-008` vào ít nhất một bài học (`BR-LTV-09`).
- [ ] Soạn **45** giáo án còn thiếu để thư viện đủ 126 tiết. Không phân theo band.
- [ ] Thi công `check:lesson-supply` kèm ca âm (`BR-LCD-09`), đo cả cầu tiết và cầu level.
- [ ] Thi công cảnh báo lệch tuổi ở giao diện ghi danh (`BR-LFM-04`), và bỏ nhánh 422 theo tuổi ở route enrollment.
- [ ] Đo lại 48 sau khi chốt danh sách 45 tiết mới — kỹ năng mới cộng thêm 2 level mỗi kỹ năng (câu hỏi 4 mục 11).

## WP113.2a — Sửa cổng 1 và cổng 5 của bộ seed

> Chặn cứng mọi thứ khác. Không có cổng thật thì mọi sàn ở dưới đo trên dữ liệu không nạp được.

- [ ] `checkGameLevelGate1` nạp `content_contract` và `difficulty_contract` từ registry engine, gọi `parse` kèm `refine` (`BR-CSA-16`).
- [ ] `checkGate5` đổi tên thành `"Sư phạm"` và thêm: FK `skill_codes`, FK `learning_objective_codes`, `difficulty ∈ [1,5]`, band level nằm trong band engine (`BR-GTC-05`).
- [ ] Bỏ nhánh `return SLUG_REGEX.test(tag)` trong `isValidTagForAxis` — `BR-TCM-01`.
- [ ] Ca âm cho **cả tám** cổng (`BR-CSA-15`), không chỉ hai cổng vừa sửa.
- [ ] Bật cổng làm đỏ 162 level — quyết đường xử lý ở WP113.4a **trước khi** bật.

## WP113.4a — 162 level không parse được

- [ ] Người quyết chọn: sửa nội dung cho vừa contract (162 version mới), hay đổi contract cho vừa nội dung (breaking change `BR-GTC-08`, đụng 27 engine). Cấm đường thứ ba là nới cổng 1.
- [ ] Sáu engine MVP trượt 100%: thiếu `prompt` (157 level), thiếu `items` (73), thiếu `target_item` (34).
- [ ] `difficulty_params`: thiếu `hint_after_ms` (169), thiếu `allow_retry` (169).
- [ ] Sau khi dọn, `BR-GTC-10` (round-trip toàn bộ level đã seed) mới có nghĩa.

## WP113.2 — Cổng đối chiếu phiếu

- [ ] Thi công `check:engine-sheets`: so danh sách phiếu với `ALL_TEMPLATE_CODES`, so trường trích với registry.
- [ ] Ca âm bắt buộc (`BR-ESS-09`): xoá một phiếu phải đỏ; đổi một giá trị `limits` phải đỏ.
- [ ] Nối vào cổng tự động trước khi merge.

## WP113.3 — Cổng chiều sâu

- [ ] Thi công `check:engine-depth` đọc corpus seed, không đọc database (mục 7.1 của [`engine-content-depth.md`](../specs/05-content/engine-content-depth.md)).
- [ ] Sáu số đo mỗi engine cộng `out_of_band_count`.
- [ ] Tệp cấu hình `packages/db/config/engine-depth.json`, bậc đang bật ghi kèm ngày (`BR-ECD-08`).
- [ ] Ca âm bắt buộc (`BR-ECD-11`): bớt một level của engine sát sàn phải đỏ.
- [ ] Nguồn không đọc được thì đỏ, cấm trả danh sách rỗng rồi báo xanh.
- [ ] Bật bậc 1 sau khi 55 level bổ sung đã merge.

## WP113.4 — Bốn mươi hai level ngoài band

- [ ] Người quyết chọn đường xử lý: sửa band thành version mới, hay archive và soạn lại cho đúng lứa (câu hỏi 5 ở mục 11 của [`engine-content-depth.md`](../specs/05-content/engine-content-depth.md)).
- [ ] Mười lăm màn `GT-006` là ca nặng nhất: engine cấm band `3-4` và `4-5`, corpus đang gắn cả hai.
- [ ] Bản published bất biến — mọi cách sửa đều là INSERT version mới, cấm `UPDATE` (`BR-CSA-01`).
- [ ] Sau khi dọn, bật `BR-ECD-13`.

## WP113.5 — Registry chủ đề

- [ ] Chốt 14 giá trị ở mục 7.1a của [`content-theme-registry.md`](../specs/05-content/content-theme-registry.md), hoặc bác bằng danh sách khác.
- [ ] Gộp ba nguồn về một: `packages/shared/src/constants/content-themes.ts` (`BR-CTR-12`); mục 7.2 của [`content-tagging.md`](../specs/01-platform/content-tagging.md) và `seed-master/content-tags.ts` trỏ về đó.
- [ ] Thi công `check:theme-registry` kèm ca âm (`BR-CTR-02`).
- [ ] Nhận `art` vào từ vựng và gắn lại `household` (2) cùng `technology` (1) — làm `thinking-coverage.test.ts` xanh lại.
- [ ] Gắn lại tag **14 level** ở mục 7.1b bằng version mới: `park`→`nature` (6), `fruit`→`food` (3), `shape`→trục `what` (2), `household`→`home` (2), `technology`→`home` (1).
- [ ] Quyết trần catalog 25% hay 20% (câu hỏi 1 ở mục 11 của file đó).
- [ ] Quyết trục `what` đóng về bộ nào — câu hỏi 3 ở mục 11 của [`content-tagging.md`](../specs/01-platform/content-tagging.md).

## WP113.6 — Bộ sinh level

- [ ] Chốt sinh bằng tổ hợp có seed hay bằng mô hình ngôn ngữ (câu hỏi 1 ở mục 11 của [`level-generator-kit.md`](../specs/01-platform/level-generator-kit.md)).
- [ ] Chốt engine nào không sinh máy được — `GT-013` và `GT-015` cần bộ giải.
- [ ] Vốn từ chủ đề: mỗi chủ đề có danh từ và emoji trong `emoji_registry`.
- [ ] `gen:levels` cấm mở kết nối database — ca kiểm với `DATABASE_URL` trỏ host không tồn tại.

## WP113.7 — Soạn nội dung tới sàn

- [ ] Bậc 1: 55 level bổ sung, ưu tiên engine ở mức mẫu có trục tư duy đang dưới sàn — `GT-027` (`shift`), `GT-013` (`plan`), `GT-011` (`predict`), `GT-018` (C5 ngôn ngữ).
- [ ] Bậc 2: quyết 12 hay 20 level mỗi engine trước khi bắt đầu (câu hỏi 1 ở mục 11 của [`engine-content-depth.md`](../specs/05-content/engine-content-depth.md)).
- [ ] Mỗi engine có ít nhất một cửa vào `free` hoặc `login` (`BR-ECD-07`).

## Nghiệm thu

- [ ] `pnpm --filter @mindkid/game-engine gen:engine-index` in "27 engine, 27 phiếu, 0 mồ côi".
- [ ] `check:engine-sheets` xanh, và đỏ khi xoá một phiếu.
- [ ] `check:engine-depth` ở bậc 1 xanh trên corpus sau WP113.7.
- [ ] `check:theme-registry` xanh, và đỏ với một chủ đề bịa đặt.
- [ ] `pnpm --filter @mindkid/db seed:content --dry-run` xanh.
- [ ] `pnpm --filter @mindkid/db test` xanh — hôm nay 1 fail / 798 ở `thinking-coverage.test.ts`.
- [ ] `check:render` in "27 engine active, 27 cài render, 0 thiếu".
- [ ] `check:go-live` xanh trên **toàn bộ** phạm vi: 27 engine và 126 tiết. Không có nhánh rút phạm vi (`BR-GLR-04`).
- [ ] `check:lesson-supply` in "cầu tiết 126, cung 126" và "0 kỹ năng thiếu level".
- [ ] Mọi liên kết nội bộ trong 4 spec và 27 phiếu resolve được.
