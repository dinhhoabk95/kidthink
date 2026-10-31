---
spec: MONTESSORI-CORPUS-MAPPING
title: Ánh xạ corpus Montessori sang taxonomy và khuôn trò chơi
area: content
status: implemented
mvp: false
phase: P3
reviewed: 2026-10-18
owns:
  - Ánh xạ bất biến từ workbook Montessori sang strand, band tuổi và khuôn trò chơi
  - Quy tắc tái biên soạn nội dung nguồn bên thứ ba cho corpus Montessori
  - Ranh giới lô A và lô B của corpus Montessori
  - Hạn ngạch, khối mã, mã batch và phân bổ access_tier của game level Montessori
  - Hạn ngạch, khối mã và trạng thái phát hành của lesson Montessori
  - Quy tắc thay giáo cụ Montessori bằng vật liệu có sẵn trong nhà
  - Ranh giới giữa lesson Montessori và chương trình theo tuổi
depends_on:
  - GAME-TEMPLATE-CONTRACT
  - GAME-LEVEL-MODEL
  - TAXONOMY-SERVICE
  - CONTENT-SEED-AUTHORING
  - ENGINE-SPEC-SHEET
  - THINKING-COVERAGE-MATRIX
  - CURRICULUM-MODEL
---

# Ánh xạ corpus Montessori sang taxonomy và khuôn trò chơi

## 1. Objective

`docs/montessori/dataset/raw-montessori-corpus.md` là bản phân tích 21 tập tài liệu bài tập
mầm non thành cấu trúc bài toán, đáp án, distractor và gợi ý sư phạm. Nó là **nguồn soạn
thảo**, không phải nội dung. Không hàng nào trong đó chạy được cho trẻ.

File này sở hữu bước dịch giữa hai thứ đó: mỗi workbook được gán strand nào của taxonomy,
band tuổi nào, và khuôn trò chơi nào chạy được nó. Nó cũng sở hữu hai ràng buộc mà bản
phân tích không thể tự mang: nội dung gốc là tài liệu của bên thứ ba nên phải **tái biên
soạn**, và một phần lớn dạng bài **chưa có khuôn nào chạy được** nên phải tách ra khỏi
đường găng nội dung.

Ranh giới lô A và lô B ở mục 7.3 là kết quả chính của file này. Không có nó, mọi kế hoạch
nội dung Montessori đều ngầm giả định mười một khuôn trò chơi mới đã tồn tại.

File này cũng sở hữu luật nạp corpus vào sản phẩm: **bao nhiêu game level, mã nào, nạp theo
thứ tự ưu tiên nào** (mục 7.7 tới 7.10), và **lesson Montessori** — thay giáo cụ bằng vật liệu
trong nhà, an toàn với band 3-4, và vì sao lesson của nguồn này không dựng được một chương
trình theo tuổi (mục 7.11 tới 7.13). Corpus lệch nặng về C1 — 14 workbook lấy C1 làm
competency chính, không workbook nào lấy C5 hay C6 — nên hạn ngạch tính ngược từ cổng phủ,
không từ độ dày của nguồn.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người biên soạn | `content_reviewer` | Đọc bảng ánh xạ để biết một workbook đi vào lô nào, gắn strand nào |
| Người review PR | `content_reviewer` | Đối chiếu seeder với hàng ánh xạ tương ứng trước khi approve |
| Dev | — | Đọc mục 7.3 để biết khuôn nào còn thiếu trước khi nhận việc lô B |
| AI agent IDE | — | Soạn seeder theo hàng ánh xạ. Cấm tự gán strand không có trong bảng |
| Chuyên gia sư phạm mầm non | `content_reviewer` | Đọc và duyệt bản thô lesson trước khi mở PR (`BR-MLS-11`) |
| Cổng seed | — | `montessori-gate` chặn mã ngoài khối, batch nhiều workbook, `access_tier` lệch độ khó, vượt hạn ngạch |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `docs/montessori/dataset/raw-montessori-corpus.md` | Người biên soạn | Nguồn soạn thảo, đọc-only. Cấm sửa để khớp bảng ánh xạ |
| `docs/montessori/Phần 1 - khởi đầu/` … `Phần 3 - Phát triển/` | Người biên soạn | 21 tập PDF gốc của bên thứ ba. Chỉ tra cứu, không trích xuất tài sản |
| [`taxonomy/index.md`](../../taxonomy/index.md) | Người biên soạn | Nguồn sự thật của strand và skill code |
| [`content-seed-authoring.md`](../01-platform/content-seed-authoring.md) | Người biên soạn | Đường ống nạp nội dung sau khi ánh xạ xong |
| `pnpm --filter @mindkid/content-build seed:check` | Người biên soạn, cổng seed | Bộ cổng seed, gồm `packages/content-build/src/gates/montessori-gate.ts` |
| `packages/content-build/tests/gates/montessori-corpus.test.ts` | Cổng | So bảng ở mục 7.9 với [`activity-types-table.md`](../../montessori/dataset/activity-types-table.md) và seeder |
| `packages/content/src/skills/c1/` tới `c6/` · `lessons/` · `activities/` | Người biên soạn | Seeder game level, lesson, activity |

## 4. Main flow

1. Chọn một workbook trong bảng 7.1.
2. Tách workbook thành **dạng bài** — đơn vị nhỏ nhất có một chỉ dẫn, một đáp án đúng, một
   bộ distractor.
3. Với mỗi dạng bài, tra hàng 7.1 để lấy strand và band tuổi.
4. Phân giải strand thành **skill code thật** trong [`taxonomy/index.md`](../../taxonomy/index.md); không có skill khớp
   thì dừng và mở câu hỏi cho chủ taxonomy, cấm tự đặt skill mới.
5. Tra cột khuôn của hàng 7.1: dạng bài chạy được trên sáu khuôn hiện có thì vào **lô A**;
   ngược lại vào **lô B**.
6. Tái biên soạn dạng bài theo mục 7.4 — đổi bối cảnh, đổi số liệu, viết lại chỉ dẫn.
7. Đối chiếu hạn ngạch còn lại của competency ở mục 7.7; hết hạn ngạch thì dừng. Lô B chỉ
   soạn khi khuôn tương ứng đã `active` (`BR-MTB-11`).
8. Cấp mã trong khối dành riêng ở mục 7.8, một batch một workbook, khai `access_tier` theo
   mục 7.10.
9. Chạy `pnpm --filter @mindkid/content-build seed:check` rồi cổng phủ trên tập published cộng
   lô đang soạn (`BR-MGL-05`); ô nào tụt sàn thì sửa phân bổ band trước khi mở PR.
10. Lesson: viết theo mục 7.11 tới 7.13 — giáo cụ thay theo mục 7.12, hoạt động ngoài màn hình
    là hoạt động chính, chuyên gia sư phạm đọc bản thô trước khi mở PR.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Không có skill code khớp dạng bài | Strand tồn tại nhưng chưa có skill mô tả đúng hành vi | Dừng. Mở câu hỏi cho chủ taxonomy. Cấm seed với skill gần đúng |
| Dạng bài vượt trần item của band | Trần ở mục 7.1 của [`game-level-model.md`](game-level-model.md) | Chia nhỏ dạng bài, hoặc dời lên band cao hơn nếu strand cho phép. Cấm nới trần |
| Workbook thiếu phần gợi ý sư phạm | 18 trên 21 workbook không có | Người biên soạn tự viết ba mức theo [`scaffolding-and-hints.md`](../04-play/scaffolding-and-hints.md). Cấm seed level không có gợi ý |
| Dạng bài mang tên một bộ test có bản quyền | Workbook 21 nêu tên một bộ test tâm lý thương mại | Giữ cấu trúc bài toán, bỏ tên bộ test, bỏ mọi tuyên bố đo chỉ số trí tuệ |
| Dạng bài chỉ chạy được với khuôn chưa có | 11 khuôn ở mục 7.3 | Ghi vào lô B. Cấm ép sang khuôn gần đúng để ship sớm |
| Emoji trong dataset không có trong registry | glyph chưa đăng ký | Đăng ký emoji trước theo [`emoji-registry.md`](../01-platform/emoji-registry.md), hoặc đổi vật liệu |
| Hết hạn ngạch competency | C1 chạm trần trước khi hết workbook | Dừng soạn cho competency đó. Dạng bài còn lại hoãn, vẫn nằm trong bảng ánh xạ (`D-RQ`) |
| Lô làm thủng một ô phủ | Phân bổ band lệch | Sửa phân bổ, không nới sàn. `BR-TCM-08` chặn publish làm thủng sàn |
| Một workbook sinh ít level hơn dự kiến | Dạng bài trùng nhau sau tái biên soạn | Trả hạn ngạch về, ghi vào báo cáo lô. Cấm bù bằng level lặp (`BR-MGL-08`) |
| Giáo cụ gốc là đồ phải mua | Gần như mọi workbook | Thay theo mục 7.12. Cấm giữ tên giáo cụ thương mại trong danh sách vật liệu |
| Vật liệu thay thế là vật nhỏ nuốt được | Hạt, nút áo, đồng xu | Với band 3-4 đổi sang vật lớn hơn 3cm. Cấm ghi chú "cần người lớn trông" thay cho việc đổi vật liệu |
| Lesson vượt trần thời lượng | Workbook dày | Tách thành hai lesson cùng cụm learning objective. Cấm nới trần |
| Muốn dựng một chương trình Montessori riêng | Đề xuất tự nhiên khi lô lesson xong | Chặn theo mục 7.13. Cần quyết định người và nguồn bổ sung cho C5, C6 |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-MCM-01` (dataset là nguồn, không phải nội dung) | Dataset là **nguồn soạn thảo**, cấm nạp thẳng vào bảng nội dung bằng bất kỳ script nào | Nó không có `code`, không có `access_tier`, không qua bộ cổng của [`content-seed-authoring.md`](../01-platform/content-seed-authoring.md). Nạp thẳng là đi vòng qua toàn bộ cổng chất lượng |
| `BR-MCM-02` (ánh xạ bất biến) | Hàng ánh xạ ở mục 7.1 **bất biến** sau khi spec này `approved`; đổi strand hay band của một workbook là version mới của spec | Mã game level mang competency và strand ngay trong hai đoạn đầu của chính nó, theo mục 7.1 của [`id-conventions.md`](../00-foundation/id-conventions.md). Đổi ánh xạ sau khi seed là đổi mã đã published |
| `BR-MCM-03` (strand phân giải thành skill thật) | Cột strand ở 7.1 là **gợi ý tra cứu**, không phải giá trị seed. Seeder phải mang skill code có thật trong [`taxonomy/index.md`](../../taxonomy/index.md) | Strand không phải đơn vị gắn được vào `content_skill_map`. Seed strand là seed một thứ không tồn tại |
| `BR-MCM-04` (cấm tự đặt skill) | Người biên soạn và AI agent IDE cấm — **NEVER tạo skill hay strand mới** để khớp một workbook | `BR-CSA-08` (AI không sinh taxonomy) — taxonomy là Lớp 1. Một workbook không khớp taxonomy là tín hiệu về taxonomy, không phải giấy phép mở rộng nó |
| `BR-MCM-05` (tái biên soạn bắt buộc) | Mọi dạng bài phải **tái biên soạn** theo mục 7.4 trước khi vào seeder: đổi bối cảnh, đổi số liệu, viết lại chỉ dẫn | Nguồn là tài liệu của bên thứ ba. Cơ chế bài toán không độc quyền được, nhưng lời văn, bố cục trang và hình vẽ thì có |
| `BR-MCM-06` (cấm tuyên bố đo trí tuệ) | Cấm — **NEVER dùng tên một bộ test tâm lý thương mại**, cấm mọi câu chữ nói nội dung đo chỉ số trí tuệ của trẻ | `BR-PED-01` cấm tuyên bố hiệu quả không có bằng chứng; tên bộ test thương mại còn là vấn đề nhãn hiệu. Xem [`pedagogical-evidence.md`](../08-quality/pedagogical-evidence.md) |
| `BR-MCM-07` (band tuổi theo phần nguồn) | Band tuổi lấy từ phần chứa workbook: Phần 1 là `3-4`, Phần 2 là `4-5`, Phần 3 là `5-6`. Đổi band của một workbook cần lý do sư phạm viết ra | Ba phần của nguồn đã là một thang tiến trình. Xáo trộn nó mà không nêu lý do là mất thông tin duy nhất nguồn mang theo |
| `BR-MCM-08` (trần item thắng nguồn) | Khi dạng bài gốc vượt trần item của band, **trần thắng** — chia nhỏ dạng bài, cấm nới trần | Trần ở mục 7.1 của [`game-level-model.md`](game-level-model.md) là lý do từ chối duyệt. Một nguồn giấy không có giới hạn trí nhớ làm việc như một màn chơi |
| `BR-MCM-09` (gợi ý sư phạm là bắt buộc) | Dạng bài không có ba mức gợi ý thì người biên soạn **phải viết**, cấm seed level thiếu gợi ý | Đo trên dataset: 3 trên 21 workbook có phần gợi ý. Coi im lặng là "không cần gợi ý" thì 18 workbook ra level không có đường thoát cho trẻ đang bí |
| `BR-MCM-10` (lô B không ép sang khuôn gần đúng) | Dạng bài thuộc lô B cấm — **NEVER ép sang một khuôn lô A** để phát hành sớm | Ép một bài cân bằng vào khuôn chọn-một-đáp-án giữ được câu hỏi và mất toàn bộ cơ chế. Trẻ học cơ chế, không học nội dung |
| `BR-MCM-11` (mã khuôn của nguồn không ràng buộc) | Mã `GT-*` trong bảng tổng kết của dataset là **đề xuất của người phân tích**, không ràng buộc. Mã thật cấp theo luật cấp mã ở mục 6 của [`engine-spec-sheet.md`](../01-platform/engine-spec-sheet.md) (`BR-MTB-01`, `BR-MTB-02`) | Dataset đề xuất `GT-008`..`GT-018` và bỏ trống `GT-007`. Mã `GT-*` bất biến theo [`id-conventions.md`](../00-foundation/id-conventions.md); cấp mã theo một tài liệu không phải spec sở hữu là cách tạo lỗ hổng |
| `BR-MCM-12` (dạng bài là đơn vị ánh xạ) | Đơn vị ánh xạ là **dạng bài**, không phải workbook. Một workbook có thể vừa có dạng lô A vừa có dạng lô B | Workbook 18 vừa có dạng đọc giờ chạy được ngay trên khuôn chọn-một-đáp-án, vừa có dạng xoay kim cần khuôn mới. Ánh xạ theo workbook thì mất nửa nội dung dùng được |
| `BR-MCM-13` (cô lập thuộc tính) | Mỗi dạng bài đưa vào hệ thống chỉ **biến thiên một thuộc tính** so với dạng bài trước cùng skill: màu, kích thước, số lượng, hoặc hình dạng — không đổi hai thứ cùng lúc | Nguyên lý cô lập thuộc tính của nguồn (mục 7.0), và `BR-GLM-08` (tăng một chiều) nói đúng cùng một điều từ phía biên tập. Đổi hai thuộc tính cùng lúc thì trẻ không biết mình đang học cái nào, và người lớn không biết trẻ hỏng ở đâu |
| `BR-MCM-14` (giữ kiểm soát lỗi tự thân) | Mỗi dạng bài phải ghi lại **vật liệu tự báo sai bằng cách nào**; dạng bài mất cơ chế đó khi chuyển sang màn hình thì ghi rõ là mất | Đây là thứ làm giáo cụ Montessori hoạt động mà không cần người lớn phán xét. Chuyển lên màn hình rồi thay bằng dấu đỏ là giữ hình thức và bỏ nguyên lý — `BR-MTB-14` ép điều này ở phía khuôn |
| `BR-MCM-15` (thứ tự CPA) | Trong cùng một workbook, dạng bài dùng vật đếm được đứng **trước** dạng bài dùng biểu tượng, và biểu tượng đứng trước ký hiệu số | Nguồn xếp theo tiến trình cụ thể tới trừu tượng. Đảo thứ tự này là đưa ký hiệu trước khi trẻ có nghĩa để gắn vào nó |
| `BR-MGL-01` (hạn ngạch là trần cứng) | Hạn ngạch game level mỗi competency ở mục 7.7 là **trần cứng**; PR vượt trần bị từ chối kể cả khi từng bản đạt chất lượng | Trần tính ngược từ `BR-TCM-07` (luật cân bằng). Vượt trần rồi sửa sau nghĩa là archive nội dung tốt, hoặc nới sàn — cả hai đều tệ hơn dừng đúng lúc |
| `BR-MGL-02` (khối mã dành riêng) | Game level Montessori dùng số thứ tự từ `0101` trở lên trong mỗi competency; mã dạng bài trong bảng tra là duy nhất | Khối `0001` tới `0020` đã seed. Khối liền kề làm không phân biệt được lô nào khi cần thu hồi một lô sai |
| `BR-MGL-03` (một dạng bài ít nhất hai level) | Mỗi dạng bài đưa vào hệ thống sinh **ít nhất hai** level khác độ khó | Một level cho một dạng bài không đủ để trẻ luyện, và không kiểm được `BR-GLM-08` (tăng một chiều) |
| `BR-MGL-04` (tăng một chiều trong một dạng bài) | Trong cùng một dạng bài, level sau chỉ tăng **một chiều** so với level trước | `BR-GLM-08` (tăng một chiều) — tăng cả số item lẫn số nhiễu cùng lúc làm không biết cái nào gây khó |
| `BR-MGL-05` (đo phủ trước khi mở PR) | Chạy cổng phủ trên tập published cộng lô đang soạn **trước khi** mở PR | Phát hiện ô thủng lúc review là phát hiện sau khi đã tốn công đọc từng bản |
| `BR-MGL-06` (lô A trước lô B) | Nạp hết dạng bài lô A đã nhận trước khi mở batch lô B đầu tiên | Lô A không phụ thuộc code mới. Chạy song song hai lô làm đường găng nội dung trộn với đường găng engine |
| `BR-MGL-07` (một batch một workbook) | Một batch chứa level của **đúng một** workbook | Khi một workbook hoá ra sai về bản quyền hoặc sư phạm, thu hồi được nguyên lô bằng một mã batch |
| `BR-MGL-08` (không bù bằng level lặp) | Hạn ngạch chưa dùng hết cấm — **NEVER lấp bằng biến thể chỉ đổi số liệu** | `BR-GLM-07` (level cùng skill phải khác nội dung). Hạn ngạch là trần, không phải chỉ tiêu |
| `BR-MGL-09` (band theo bảng ánh xạ) | Band tuổi của level lấy từ mục 7.1, không chọn lại theo cảm tính khi soạn | `BR-MCM-07` (band tuổi theo phần nguồn) — ba phần của nguồn là một thang tiến trình; chọn lại từng level làm thang đó biến mất |
| `BR-MGL-10` (đa dạng cơ chế trong mỗi ô) | Mỗi ô `competency × band` mà corpus Montessori chạm phải giữ **ít nhất hai** mechanic khác nhau | `BR-TCM-05` (đa dạng cơ chế) — một năng lực chỉ luyện qua một cơ chế thì trẻ đang học cơ chế, không học năng lực |
| `BR-MGL-11` (báo cáo lô) | Mỗi batch merge kèm một dòng báo cáo: workbook nguồn, số level, hạn ngạch còn lại, ô phủ bị chạm | Không có dòng đó thì hạn ngạch chỉ tồn tại trong spec, và người soạn thứ hai không biết còn bao nhiêu |
| `BR-MGL-12` (tier gán lúc soạn) | Mọi game level Montessori khai `access_tier` tường minh trong seeder, theo bảng ở mục 7.10 | `access_tier` là `NOT NULL` không default; nguồn không mang trường này (mục 7.5) nên nó luôn là quyết định của người soạn |
| `BR-MLS-01` (một workbook một lesson) | Mỗi workbook sinh **đúng một** lesson | `BR-LSM-08` (một cụm learning objective) — một workbook đã là một cụm learning objective liên quan; tách nhỏ hơn làm mất cung bậc, gộp lớn hơn làm vượt trần thời lượng |
| `BR-MLS-02` (thay giáo cụ bắt buộc) | Mọi giáo cụ Montessori gốc phải thay bằng vật liệu ở mục 7.12; cấm — **NEVER để tên giáo cụ thương mại** trong danh sách vật liệu | `BR-LSM-04` (vật liệu có sẵn trong nhà) — lesson yêu cầu mua bộ giáo cụ là lesson không ai dùng, và là quảng cáo cho bên thứ ba |
| `BR-MLS-03` (an toàn thắng độ trung thực) | Khi vật liệu trung thực với giáo cụ gốc vi phạm danh sách an toàn, **an toàn thắng** | Cấm vật đường kính dưới 3cm với band 3-4. Hạt đếm Montessori nằm đúng trong nhóm đó |
| `BR-MLS-04` (hoạt động ngoài màn hình là hoạt động chính) | Trong lesson Montessori, hoạt động ngoài màn hình là **hoạt động chính**, không phải phần thêm cuối buổi | Nguồn mạnh nhất ở đúng chỗ game level yếu nhất. Đặt nó ở cuối biến lesson thành một game level có lời dẫn dài |
| `BR-MLS-05` (activity đứng độc lập) | Activity Montessori cấm tham chiếu workbook nguồn hay lesson chứa nó | `BR-ACM-01` (activity đứng độc lập) — tái dùng ở lesson khác thì ngữ cảnh đó sai |
| `BR-MLS-06` (đánh giá bằng hành vi) | Phần đánh giá mô tả hành vi quan sát được, kèm số lần thử | `BR-LSM-06` — "bé hiểu khái niệm số lượng" không đo được, "bé chỉ đúng nhóm nhiều hơn trong 3 lần thử" thì đo được |
| `BR-MLS-07` (không giả định biết đọc) | Mọi chỉ dẫn dành cho trẻ là lời nói hoặc hình, cấm — **NEVER yêu cầu trẻ tự đọc chữ** | `BR-LSM-07` — nguồn là sách bài tập in, và sách in ngầm giả định có người lớn đọc hộ. Lesson phải nói rõ điều đó thay vì thừa hưởng nó |
| `BR-MLS-08` (khối mã lesson) | Lesson Montessori dùng mã từ `LES-0101`, activity từ `ACT-0101` | 60 lesson và 60 activity đã seed chiếm khối `0001` tới `0060`. Khối liền kề làm không thu hồi được nguyên lô khi cần |
| `BR-MLS-09` (một batch một workbook) | Một batch chứa lesson và activity của **đúng một** workbook | Cùng lý do `BR-MGL-07` — thu hồi theo workbook là đơn vị thu hồi tự nhiên khi một nguồn hoá ra sai |
| `BR-MLS-10` (không dựng chương trình theo tuổi) | Lesson Montessori cấm — **NEVER dùng một mình để dựng một chương trình `age_based`** | `BR-CRM-08` (phủ đủ sáu competency) và `BR-CRM-07` (không competency nào quá 40%). Nguồn phủ bốn competency và lệch 14 trên 21 về C1 — xem mục 7.13 |
| `BR-MLS-11` (chuyên gia đọc bản thô) | Mỗi lesson được một người có nền sư phạm mầm non đọc trước khi mở PR; chưa có người thì lesson dừng ở `draft` (mục 7.11) | Bộ cổng seed không kiểm được cung bậc sư phạm của một buổi học |
| `BR-MLS-12` (gắn game level đã published) | Activity kiểu `digital_game` chỉ trỏ game level Montessori đã `published` | Trỏ một level chưa publish là một buổi học có một bước không mở được |
| `BR-MLS-13` (cung bậc theo CPA) | Hoạt động chính đi theo thứ tự **vật thật, rồi hình ảnh, rồi ký hiệu số**; khởi động luôn ở mức vật thật | Nguyên lý CPA ở mục 7.0. Lesson mở bằng ký hiệu số là đưa trẻ vào phần trừu tượng trước khi có nghĩa để gắn vào — cũng là lý do `BR-LSM-01` đòi có khởi động |
| `BR-MTB-11` (lô B mở khoá theo khuôn) | Một dạng bài lô B chỉ được soạn khi khuôn tương ứng đã `active` trong registry | Soạn nội dung cho khuôn chưa có nghĩa là nội dung không kiểm được bằng `content_contract` — đúng thứ `BR-GTC-02` (parse ở server) tồn tại để chặn |


## 7. Data

**Đọc:** dataset và 21 tập PDF nguồn · [`taxonomy/index.md`](../../taxonomy/index.md) · `@mindkid/emoji`.
**Ghi:** không ghi vào database. Đầu ra là bảng ánh xạ trong chính file này.

### 7.0 Bốn nguyên lý sư phạm của nguồn

21 workbook không phải một tập bài tập rời. Chúng dựng trên bốn nguyên lý, và mỗi nguyên lý đã
có một chỗ tương ứng trong hệ thống. Bỏ nguyên lý mà giữ bài tập là giữ vỏ.

| Nguyên lý của nguồn | Nghĩa | Chỗ tương ứng trong hệ thống |
|---|---|---|
| CPA — cụ thể tới trừu tượng | Vật đếm được, rồi biểu tượng hình ảnh, rồi ký hiệu số | Thứ tự dạng bài trong một workbook, `BR-MCM-15`; thang `difficulty` 1 tới 5 ở mục 7.2 của [`game-level-model.md`](game-level-model.md) |
| Cô lập thuộc tính | Mỗi bài chỉ biến thiên **một** chiều: màu, kích thước, số lượng, hình dạng | `BR-MCM-13`, và `BR-GLM-08` (tăng một chiều) ở phía biên tập |
| Kiểm soát lỗi tự thân | Vật liệu tự báo sai: hình không khớp khuôn, hai bên cân không thăng bằng, lưới lặp giá trị | `BR-MCM-14` ở phía nội dung, `BR-MTB-14` ở phía khuôn |
| Scaffolding ba mức | Nudge nhấp nháy, Guidance đếm nhịp chậm, Demo bàn tay làm mẫu | Ba bậc L1, L2, L3 đã có trong engine — L1 highlight, L2 ghost hand tốc độ thật, L3 ghost hand 0,5× lặp, theo [`scaffolding-and-hints.md`](../04-play/scaffolding-and-hints.md) |

Hàng cuối là tin tốt đo được: ba mức gợi ý của nguồn khớp **một-một** với ba bậc đã có trong
`packages/game-engine/src/systems/scaffolding.ts`. 18 workbook thiếu phần gợi ý (mục 7.5) cần
người **viết lời**, không cần ai xây cơ chế.

Hàng thứ ba là hàng dễ mất nhất. Một bài cân đòn bẩy chuyển lên màn hình mà chỉ hiện dấu đỏ khi
sai thì đã bỏ đúng thứ khiến bài đó dạy được: đòn cân nghiêng **là** câu trả lời.

### 7.1 Bảng ánh xạ 21 workbook

Cột `Khuôn lô A` liệt kê khuôn đã tồn tại chạy được **ít nhất một** dạng bài của workbook.
Cột `Khuôn lô B` nêu cơ chế từng thiếu khi lập bảng; mã cấp theo luật ở mục 6 của [`engine-spec-sheet.md`](../01-platform/engine-spec-sheet.md).

| # | Workbook | Band | Competency | Strand | Khuôn lô A | Cơ chế lô B còn thiếu |
|---:|---|:--:|:--:|---|---|---|
| 01 | Nhận biết số | 3-4 | C1 | `C1.NREC` · `C1.OTO` | `GT-001` · `GT-003` | — |
| 02 | Thứ tự dãy số | 3-4 | C1 | `C1.NREC` | `GT-001` · `GT-006` | `GT-008` kéo vào ô khuyết |
| 03 | Tìm bóng đúng | 3-4 | C4 | `C4.VIS` | `GT-001` · `GT-005` | — |
| 04 | Đếm nhanh chọn đúng | 3-4 | C1 | `C1.CNT` | — | `GT-012` nhìn chớp rồi nhớ lại |
| 05 | Đếm nhanh điền đúng | 3-4 | C1 | `C1.CNT` | `GT-002` · `GT-003` | — |
| 06 | So sánh số lượng | 3-4 | C1 | `C1.CMP` | `GT-001` · `GT-003` | — |
| 07 | Tách gộp số lượng | 3-4 | C1 | `C1.NCOMP` | — | `GT-007` cây tách gộp |
| 08 | Tách gộp phạm vi 10 | 4-5 | C1 | `C1.NCOMP` | — | `GT-007` cây tách gộp |
| 09 | Vượt mê cung | 4-5 | C2 | `C2.MAZ` · `C6.PLN` | — | `GT-013` tìm đường mê cung |
| 10 | Tư duy màu sắc | 4-5 | C4 | `C4.SEN` · `C3.CLS` | `GT-004` · `GT-006` | — |
| 11 | Điền số thông minh | 4-5 | C1 | `C1.CNT` · `C3.RULE` | `GT-001` | `GT-008` kéo vào ô khuyết |
| 12 | Bài toán thay thế sơ đẳng | 4-5 | C1 | `C1.PROB` · `C3.INF` | — | `GT-010` thay thế biểu tượng |
| 13 | Tách gộp phạm vi 20 | 4-5 | C1 | `C1.NCOMP` | — | `GT-007` cây tách gộp |
| 14 | Tìm số bí ẩn | 4-5 | C3 | `C3.DED` · `C6.WM` | — | `GT-009` loại trừ theo manh mối |
| 15 | Cùng bé tìm quy luật | 5-6 | C1 | `C1.PAT` · `C3.RULE` | `GT-001` · `GT-006` | `GT-011` ma trận chọn hình |
| 16 | Tư duy cân bằng | 5-6 | C1 | `C1.MEAS` · `C3.DED` | — | `GT-014` cân hai bên |
| 17 | Thử thách Sudoku | 5-6 | C3 | `C3.MTX` | — | `GT-015` lưới không lặp |
| 18 | Làm quen với đồng hồ | 5-6 | C1 | `C1.MEAS` | `GT-001` · `GT-005` | `GT-016` xoay kim đồng hồ |
| 19 | Tư duy hình khối | 5-6 | C2 | `C2.GEO` · `C2.PER` | `GT-005` | `GT-017` xếp khối và phối cảnh |
| 20 | Bài toán thay thế nâng cao | 5-6 | C1 | `C1.PROB` · `C3.DED` | — | `GT-010` thay thế biểu tượng |
| 21 | Ma trận suy luận tổng hợp | 5-6 | C3 | `C3.MTX` · `C2.ROT` | — | `GT-011` ma trận chọn hình |

Cột `Competency` ghi competency **chính** — thứ quyết định tiền tố mã level.

**Strand phụ không vào `skill_codes`** (quyết định `D-RH`, 2026-08-20). Trường `skill_codes`
của seeder là một mảng phẳng không mang trọng số, nên nó không biểu diễn được `weight = 1.0`
mà `BR-GLM-01` (một mục tiêu học tập mỗi level) nói tới. Mỗi level Montessori mang **đúng một**
skill code, lấy từ strand đầu tiên của hàng; strand phụ đi vào tag trục `what` và `thinking`
theo [`content-tagging.md`](content-tagging.md).

### 7.2 Phân bố competency của nguồn

| Competency | Số workbook có competency chính |
|---|---:|
| C1 Mathematical Thinking | 14 |
| C2 Spatial Thinking | 2 |
| C3 Logical Thinking | 3 |
| C4 Observation Thinking | 2 |
| C5 Language Thinking | 0 |
| C6 Executive Function | 0 |

Nguồn **không phủ** C5, và chỉ chạm C6 ở vị trí strand phụ. Đây là dữ kiện chặn: catalog
hiện tại cân bằng 20 level mỗi competency, và `BR-TCM-07` (luật cân bằng) chặn từ P4 khi
competency nhiều nhất vượt ba lần competency ít nhất. Nạp corpus này mà không kèm kế hoạch
C5 là đẩy catalog về phía cổng đó. Hạn ngạch ở mục 7.7.

### 7.3 Ranh giới lô A và lô B

| Lô | Định nghĩa | Chạy được từ | Số workbook có ít nhất một dạng bài |
|---|---|---|---:|
| A | Dạng bài chạy được trên `GT-001`…`GT-006` | ngay, không dòng code engine nào | 10 |
| B | Dạng bài cần khuôn chưa tồn tại | sau khi khuôn tương ứng ship | 16 |

Năm workbook (02, 11, 15, 18, 19) nằm ở **cả hai lô**, năm workbook (01, 03, 05, 06, 10)
chỉ ở lô A, mười một workbook còn lại chỉ ở lô B. Cộng lại đúng 21 — đó là hệ quả trực tiếp
của `BR-MCM-12` (dạng bài là đơn vị ánh xạ).

Mười một cơ chế còn thiếu, gom từ cột cuối của mục 7.1, đã được cấp mã ở lô `montessori` (mục 7.5
của [`engine-spec-sheet.md`](../01-platform/engine-spec-sheet.md)) và đều đã có khuôn: `GT-007` cây tách gộp · `GT-008` kéo vào ô khuyết ·
`GT-009` loại trừ theo manh mối · `GT-010` thay thế biểu tượng · `GT-011` ma trận chọn hình ·
`GT-012` nhìn chớp rồi nhớ lại · `GT-013` tìm đường mê cung · `GT-014` cân hai bên ·
`GT-015` lưới không lặp · `GT-016` xoay kim đồng hồ · `GT-017` xếp khối và phối cảnh.

Mã cấp theo **lớp chi phí**, không theo thứ tự workbook: `GT-007` tới `GT-011` chỉ cần layout
mới, `GT-012` tới `GT-017` mỗi khuôn kéo theo một system engine chưa tồn tại.

### 7.4 Quy tắc tái biên soạn

| Thành phần nguồn | Được lấy | Phải thay |
|---|---|---|
| Cơ chế bài toán | Có | — |
| Cấu trúc distractor và lý do gây nhiễu | Có | — |
| Tiến trình độ khó giữa các dạng | Có | — |
| Số liệu cụ thể của một bài | Không | Sinh lại bộ số khác, giữ nguyên cấu trúc |
| Lời dẫn nguyên văn | Không | Viết lại theo mục 7.3 của [`game-level-model.md`](game-level-model.md) |
| Bối cảnh và nhân vật | Không | Chọn lại từ theme đã đăng ký |
| Hình vẽ, bố cục trang | Không | Dựng lại bằng emoji trong `@mindkid/emoji` |
| Tên bộ test tâm lý thương mại | Không | Bỏ hẳn, không thay bằng tên khác |

### 7.5 Độ đầy đủ đo được của dataset

Đo ngày 2026-08-20 trên [`raw-montessori-corpus.md`](../../montessori/dataset/raw-montessori-corpus.md):

| Thuộc tính | Số đo | Hệ quả |
|---|---|---|
| Workbook | 21 | — |
| Dạng bài tách được bằng cú pháp thống nhất | 59 | Đơn vị đếm hạn ngạch ở mục 7.9. Bản đo đầu ghi 57 là lỗi cộng, sửa ngày 2026-08-20 |
| Workbook chưa tách dạng | 0 | Chuẩn hoá xong 2026-08-20 (`D-RI`); workbook 09 và 17 đã tách |
| Workbook có phần gợi ý sư phạm ba mức | 3 | 18 workbook cần người viết gợi ý, `BR-MCM-09` |
| Workbook khai `access_tier` | 0 | Toàn bộ phải gán tier lúc soạn seeder |
| Workbook khai learning objective code | 0 | Phải phân giải từ strand lúc soạn seeder |

Ba hàng cuối là lý do dataset không phải một seeder chờ chạy: nó thiếu đúng những trường mà
cổng 5 của [`content-seed-authoring.md`](../01-platform/content-seed-authoring.md) bắt buộc.

### 7.6 Khoảng trống đã biết — tô nét số

Mục tiêu giáo dục của workbook 01 nêu "tập tô nét số", và phương pháp Montessori tương đương là
thẻ số cát. Đó là cơ chế `trace-path` — vẽ theo nét, có kiểm soát lỗi tự thân rõ nhất trong cả
nguồn: ngón tay trượt ra khỏi nét là trẻ tự biết.

**Nó không nằm trong bảng ánh xạ**: dataset không có dạng bài nào cho nó. Nó chỉ xuất hiện ở
dòng mục tiêu giáo dục của workbook 01, không thành một bài có chỉ dẫn, đáp án và distractor.
`BR-MCM-12` (dạng bài là đơn vị ánh xạ) nên nó không có đơn vị để ánh xạ.

Khuôn thì nay đã có: `GT-024` vẽ theo nét (`traceSystem`, band 5-6, cấm band 3-4 theo
`BR-LVB-06`). Ghi ở đây để lần sau không ai phải phát hiện lại. Mở nó cần một dạng bài viết mới
trong dataset trước; band của dạng bài đó phải nằm trong band của `GT-024` (`BR-MTB-10`).

### 7.7 Hạn ngạch game level theo competency

Trần tính ngược từ `BR-TCM-07`: sau khi nạp hết, competency nhiều level nhất không được vượt
ba lần competency ít nhất. C5 và C6 không có workbook nguồn nên giữ nguyên 20, và chúng là mẫu
số của phép chia đó. Cổng `montessori-gate` giữ cùng bảng này (`MONTESSORI_QUOTA_LIMITS`).

| Competency | Level published trước corpus | Trần corpus Montessori | Tổng sau khi nạp đủ |
|---|---:|---:|---:|
| C1 Mathematical Thinking | 20 | 36 | 56 |
| C2 Spatial Thinking | 20 | 9 | 29 |
| C3 Logical Thinking | 20 | 15 | 35 |
| C4 Observation Thinking | 20 | 9 | 29 |
| C5 Language Thinking | 20 | 0 | 20 |
| C6 Executive Function | 20 | 0 | 20 |
| **Tổng** | **120** | **69** | **189** |

Tỉ lệ sau khi nạp đủ là 56 trên 20, tức 2,8 lần — dưới trần ba lần với biên an toàn. Nếu C5
hoặc C6 được bổ sung từ một nguồn khác, trần C1 tính lại theo cùng công thức, không nới bằng tay.

### 7.8 Khối mã và mã batch

Mã level giữ định dạng bốn đoạn ở mục 7.1 của [`id-conventions.md`](../00-foundation/id-conventions.md):
competency, strand, mechanic, số thứ tự bốn chữ số.

| Đoạn hoặc loại | Giá trị cho corpus Montessori |
|---|---|
| Competency | Competency chính ở mục 7.1 |
| Strand | Strand của skill chính, lấy từ [`taxonomy/index.md`](../../taxonomy/index.md) |
| Mechanic | Đoạn mã ở bảng dưới, với khuôn lô B |
| Số thứ tự game level | Từ `0101` trở lên, tăng dần trong mỗi competency (`BR-MGL-02`) |
| Lesson · activity | Từ `LES-0101` · `ACT-0101` (`BR-MLS-08`) |
| `batch_code` game level | `SEED-MONT-<lô><workbook 2 chữ số>` — ví dụ `SEED-MONT-A01`, `SEED-MONT-B16` |
| `batch_code` lesson | `SEED-MONT-L<workbook 2 chữ số>` |

Đoạn `<MECHANIC>` cho mười một khuôn lô B (`D-RP`):

| Khuôn | Đoạn mã | Khuôn | Đoạn mã |
|---|---|---|---|
| `GT-007` cây tách gộp | `NBOND` | `GT-013` tìm đường mê cung | `MAZE` |
| `GT-008` kéo vào ô khuyết | `SLOT` | `GT-014` cân hai bên | `BALAN` |
| `GT-009` loại trừ theo manh mối | `CLUE` | `GT-015` lưới không lặp | `SUDOK` |
| `GT-010` thay thế biểu tượng | `SUBST` | `GT-016` xoay kim đồng hồ | `CLOCK` |
| `GT-011` ma trận chọn hình | `MATRX` | `GT-017` xếp khối và phối cảnh | `BLOCK` |
| `GT-012` nhìn chớp rồi nhớ lại | `FLASH` | | |

### 7.9 Phân bổ dạng bài — dạng bài nào được nhận

Nguồn có **59 dạng bài** sau chuẩn hoá (`D-RI`). Ở hai level mỗi dạng bài, nạp hết là 118 level
và tỉ lệ cân bằng lên 4,8 lần. Trần ở mục 7.7 chỉ chứa được một phần.

Số ở bảng dưới **đo bằng lệnh** trên [`activity-types-table.md`](../../montessori/dataset/activity-types-table.md)
và trên chính seeder, không ước lượng. Cổng `packages/content-build/tests/gates/montessori-corpus.test.ts`
giữ ba chỗ khớp nhau và đọc đúng bảng này.

| Competency | Dạng bài trong nguồn | Trần level | Dạng bài nhận đợt này | Dạng bài đã soạn | Level đã soạn |
|---|---:|---:|---:|---:|---:|
| C1 | 35 | 36 | 23 | 18 | 36 |
| C2 | 7 | 9 | 2 | 2 | 4 |
| C3 | 13 | 15 | 5 | 0 | 0 |
| C4 | 4 | 9 | 4 | 4 | 9 |
| **Tổng** | **59** | **69** | **34** | **24** | **49** |

**Trần C1 đã đầy.** 36 level của C1 chỉ chứa 18 dạng bài ở sàn 2 level mỗi dạng, và 18 dạng ấy
đã soạn xong. Năm dạng C1 còn lại trong nhóm "nhận đợt này" không seed được cho tới khi người
quyết mở trần.

**25 dạng bài còn lại không bị loại** — chúng vẫn nằm trong bảng ánh xạ và chờ đợt sau, khi C5
hoặc C6 có nguồn bổ sung làm mẫu số lớn lên (`D-RQ`). Cắt workbook khỏi bảng ánh xạ là mất thông
tin; hoãn dạng bài thì không.

Thứ tự ưu tiên khi chọn dạng bài, áp theo đúng ba bước:

1. Band thấp trước — 3-4, rồi 4-5, rồi 5-6. Trẻ nhỏ có ít nội dung phù hợp nhất.
2. Dạng bài lô A trước dạng bài lô B (`BR-MGL-06`).
3. Trong cùng workbook, dạng bài số nhỏ trước — thứ tự nguồn đã là thứ tự tăng độ khó.

### 7.10 Phân bổ `access_tier` và trần theo band

| `difficulty` | `access_tier` |
|---:|---|
| 1 | `free` |
| 2 | `login` |
| 3 | `standard` |
| 4 hoặc 5 | `premium` |

Quy tắc máy kiểm được (`montessori-gate`), khớp bậc bao hàm của
[`access-ladder.md`](../00-foundation/access-ladder.md): level dễ nhất là mặt tiếp xúc đầu tiên
của khách chưa đăng nhập, level khó nhất nằm sau gói trả phí (`D-RR`).

| Band của workbook | Trần item mỗi level | Nhiễu tối đa | Số level tối thiểu mỗi dạng bài |
|---|---:|---:|---:|
| 3-4 | 4 | 1 | 2 |
| 4-5 | 6 | 2 | 2 |
| 5-6 | 8 | 3 | 2 |

Trần item và nhiễu chép chiếu từ mục 7.1 của [`game-level-model.md`](game-level-model.md) và
không được nới ở đây. Dạng bài gốc vượt trần thì chia nhỏ theo `BR-MCM-08`.

### 7.11 Lesson Montessori — hạn ngạch và trạng thái phát hành

| Band | Workbook | Lesson | Activity ngoài màn hình tối thiểu |
|---|---:|---:|---:|
| 3-4 | 01 tới 07 | 7 | 7 |
| 4-5 | 08 tới 14 | 7 | 7 |
| 5-6 | 15 tới 21 | 7 | 7 |
| **Tổng lesson** | **21** | **21** | **21** |

Ba band chia đều bảy workbook mỗi band là hình dạng sẵn có của nguồn. Mỗi lesson theo cấu trúc
chuẩn — khởi động, hoạt động chính, đúc kết,
đánh giá — và có ít nhất một activity ngoài màn hình cộng một activity gắn game level Montessori
đã `published`. Workbook có dạng bài thuộc khuôn chưa `active` vẫn viết được lesson với activity
ngoài màn hình; phần gắn game level bổ sung bằng version sau.

Lesson Montessori dừng ở `draft` cho tới khi có một người có nền sư phạm mầm non đọc và duyệt
(`D-RT`). Đây là cách `BR-MLS-11` được thi hành khi chưa có người.

| Hệ quả | Nội dung |
|---|---|
| Lesson Montessori | Seed ở `draft`, không vào ma trận phủ (`BR-TCM-03` chỉ đếm `published`) |
| Game level Montessori | **Không** bị chặn bởi cổng này — chúng không có người lớn tham gia, và đi qua bộ cổng seed |
| Activity | Theo trạng thái của lesson chứa nó |
| Khi có người duyệt | Lật sang `published` bằng version mới, không sửa tại chỗ |

Lesson ở `draft` không mang tuyên bố hiệu quả nào (`D-RV`). Lesson vào **thư viện lesson rời**,
không ghép vào chương trình nào; ghép chương trình là một outcome khác, cần đo lại cân bằng
competency của từng chương trình sau khi ghép (`D-RU`).

### 7.12 Thay giáo cụ bằng vật liệu trong nhà

| Tiêu chí chọn vật liệu thay | Yêu cầu |
|---|---|
| Có sẵn trong nhà | Có |
| Đường kính lớn hơn 3cm với band 3-4 | Có |
| Không cần in ấn | Có |
| Không cần cắt, đun, hoặc nguồn nhiệt | Có |
| Giữ được thuộc tính sư phạm của giáo cụ gốc | Có |
| Dùng được ở mức vật thật của thang CPA | Có |

Hàng cuối tồn tại vì `BR-MLS-13`: hoạt động ngoài màn hình là **mức vật thật** của lesson; thay
giáo cụ bằng một tấm thẻ in hình là nhảy thẳng sang mức hình ảnh. Hàng áp chót là hàng khó: thang
số hạt dạy **số lượng tăng dần nhìn thấy được**, thay bằng vật không có thuộc tính đó thì lesson
mất mục tiêu.

| Giáo cụ gốc trong nguồn | Thuộc tính sư phạm phải giữ | Vật liệu thay |
|---|---|---|
| Thẻ số cát | Nét số cảm nhận được bằng ngón tay | Số viết bằng keo khô trên bìa, hoặc vẽ trên khay bột |
| Hộp thoi số, thẻ số và chấm tròn | Ghép ký hiệu số với số lượng rời | Nắp chai và giấy ghi số |
| Thang số hạt, gậy số | Số lượng tăng dần nhìn thấy được | Que kem xếp thành bậc, hoặc cốc giấy chồng cao dần |
| Tủ hình học | Đối chiếu hình với khung rỗng | Hình cắt từ bìa và khung vẽ trên giấy |
| Tháp hồng, khối lập phương nhị thức | Kích thước giảm dần theo một chiều | Hộp giấy các cỡ, hoặc sách xếp chồng |
| Khối hình học ba chiều | Nhận diện khối trong không gian | Đồ vật trong bếp: hộp, lon, quả bóng, mũ giấy |
| Đồng hồ gỗ hai kim đồng bộ | Hai kim ràng buộc nhau | Đĩa giấy và hai kim cắt từ bìa, ghim ở tâm |
| Mê cung ngón tay trên bảng gỗ | Đi theo đường không nhấc tay | Đường dán bằng băng dính trên sàn |
| Hạt đếm nhỏ | Đếm từng vật rời | Band 3-4 dùng nắp chai hoặc quả bóng nhỏ; cấm hạt |

Không có hàng khớp thì người biên soạn tự chọn theo bảng tiêu chí và **bổ sung một hàng vào bảng
này trong cùng PR** — bảng lớn dần là đúng, mỗi người tự chọn lại là sai.

### 7.13 Vì sao lesson Montessori không dựng được một chương trình theo tuổi

| Ràng buộc | Số của lesson Montessori | Kết luận |
|---|---|---|
| `BR-CRM-08` — phủ đủ sáu competency | Phủ 4, thiếu C5 và C6 | Không đạt |
| `BR-CRM-07` — không competency nào quá 40% | C1 chiếm 14 trên 21, tức 67% | Không đạt |
| `BR-CRM-02` — mỗi tuần chạm 2 tới 4 competency | Dựng được nếu trộn với lesson đã có | Đạt có điều kiện |

Hai hàng đầu không sửa được bằng cách xếp lại thứ tự. Corpus Montessori là **nguồn lesson**, và
lesson của nó ghép vào chương trình đã có cạnh lesson của các competency khác. Một chương trình
mang tên Montessori là một quyết định sản phẩm riêng, cần thêm nguồn cho C5 và C6.

## 8. API contract

Không sở hữu route. Bảng ánh xạ là tài liệu, đọc bằng mắt lúc soạn và lúc review PR. Game
level đi qua CLI seeder và bộ cổng seed (thoát khác 0 khi hỏng).

## 9. Acceptance criteria

```gherkin
Scenario: BR-MCM-01 — dataset không nạp thẳng vào database
  When quét mọi script dưới packages/db và scripts
  Then không script nào đọc docs/montessori/dataset/raw-montessori-corpus.md
  And không đường nào ghi vào game_levels mà bỏ qua cổng seed

Scenario: BR-MCM-03 — seeder mang skill code thật, không mang strand
  Given một seeder Montessori khai skill_codes là "C1.NREC"
  When chạy pnpm --filter @mindkid/db seed:check
  Then cổng 5 fail
  And thông báo nêu giá trị không khớp regex skill code

Scenario: BR-MCM-04 — seeder không tạo được skill mới
  Given một seeder Montessori khai một skill code chưa có trong taxonomy
  When chạy pnpm --filter @mindkid/db seed:check
  Then cổng 5 fail với thông báo taxonomy là Lớp 1

Scenario: BR-MCM-06 — tên bộ test thương mại bị chặn
  Given một level Montessori có title chứa tên một bộ test tâm lý thương mại
  When chạy pnpm --filter @mindkid/db seed:check
  Then cổng 7 fail
  And thông báo nêu đúng chuỗi vi phạm

Scenario: BR-MCM-06 — không tuyên bố đo trí tuệ
  When đọc title và instruction của mọi level Montessori published
  Then không chuỗi nào nói nội dung đo chỉ số trí tuệ của trẻ

Scenario: BR-MCM-08 — dạng bài vượt trần item bị chia nhỏ
  Given workbook 01 dạng ba có 8 vật ở band 3-4
  When soạn level tương ứng
  Then level mang tối đa 4 item
  And phần còn lại thành một level khác cùng skill

Scenario: BR-MCM-09 — level thiếu gợi ý bị chặn
  Given một level Montessori không khai gợi ý mức nào
  When gửi duyệt
  Then trả 422
  And lý do nêu thiếu gợi ý sư phạm

Scenario: BR-MCM-10 — dạng bài lô B không ép sang khuôn lô A
  Given workbook 16 dạng cân đòn bẩy
  When kiểm mọi level Montessori published
  Then không level nào dùng GT-001 tới GT-006 cho dạng bài đó

Scenario: BR-MCM-11 — mã khuôn của dataset không vào code
  When quét packages/game-engine/src/templates
  Then không thư mục khuôn nào lấy mã từ bảng tổng kết của dataset mà không qua luật cấp mã của engine-spec-sheet

Scenario: BR-MCM-02 — ánh xạ bất biến sau khi approved
  Given spec này ở trạng thái approved
  When một hàng ở mục 7.1 đổi strand hoặc band
  Then thay đổi đi kèm version mới của spec
  And mọi mã level đã seed theo hàng cũ giữ nguyên

Scenario: BR-MGL-01 — batch vượt hạn ngạch bị từ chối
  Given competency C1 đã nạp 36 level Montessori
  When chạy pnpm --filter @mindkid/content-build seed:check trên một batch C1 Montessori nữa
  Then cổng montessori-gate báo vượt hạn ngạch C1

Scenario: BR-MGL-01 — bảng mục 7.9 lệch seeder thì cổng đỏ
  Given mục 7.9 khai C4 đã soạn 10 level
  And seeder chỉ có 9 level C4
  When chạy montessori-corpus.test.ts
  Then cổng báo "C4 level đã soạn: viết 10, đo được 9"

Scenario: BR-MGL-02 — mã Montessori nằm trong khối dành riêng
  When đọc mã của mọi level thuộc batch có tiền tố SEED-MONT
  Then mọi số thứ tự đều từ 0101 trở lên

Scenario: BR-MGL-03 — dạng bài chỉ có một level bị chặn
  Given một batch chỉ có một level cho một dạng bài
  When người review kiểm checklist lô
  Then mục số level mỗi dạng bài không tick được

Scenario: BR-MGL-04 — level sau tăng hai chiều bị trả lại
  Given hai level liên tiếp của một dạng bài tăng cả số item lẫn số nhiễu
  When người review đọc batch
  Then người review từ chối PR

Scenario: BR-MGL-05 — lô làm thủng ô phủ bị chặn trước PR
  Given lô đang soạn làm ô C2 band 5-6 chỉ còn một mechanic
  When chạy cổng phủ trên tập published cộng lô
  Then cổng thoát với mã khác 0
  And nêu ô thiếu đa dạng cơ chế

Scenario: BR-MGL-06 — batch lô B mở trước khi lô A xong bị chặn
  Given còn dạng bài lô A đã nhận chưa nạp
  When mở batch SEED-MONT-B07
  Then người review từ chối PR

Scenario: BR-MGL-07 — một batch một workbook
  Given batch SEED-MONT-A01 chứa một level thuộc workbook 03
  When chạy pnpm --filter @mindkid/content-build seed:check
  Then cổng montessori-gate báo batch chứa nhiều workbook

Scenario: BR-MGL-08 — level chỉ khác số liệu bị loại
  Given hai level cùng skill chỉ khác số lượng vật
  When chạy pnpm --filter @mindkid/content-build seed:check
  Then cổng 6 fail
  And nêu mã của cả hai bản

Scenario: BR-MGL-09 — band lệch bảng ánh xạ bị bắt
  Given workbook 09 được xếp band 4-5 ở bảng ánh xạ
  When một seeder khai band 5-6 cho level của workbook đó
  Then người review từ chối PR

Scenario: BR-MGL-10 — ô chỉ còn một mechanic bị bắt
  Given corpus Montessori làm ô C1 band 3-4 chỉ còn một mechanic
  When chạy cổng phủ
  Then cổng đỏ theo BR-TCM-05

Scenario: BR-MGL-11 — mỗi batch có dòng báo cáo
  When đọc content_seed_batches sau khi nạp một lô Montessori
  Then mỗi hàng có workbook nguồn, số level và hạn ngạch còn lại

Scenario: BR-MGL-12 — access_tier lệch độ khó bị chặn
  Given một level Montessori difficulty 1 khai access_tier premium
  When chạy pnpm --filter @mindkid/content-build seed:check
  Then cổng montessori-gate báo access_tier không khớp bảng mục 7.10

Scenario: BR-MLS-01 — một workbook một lesson
  When đếm lesson Montessori theo workbook nguồn
  Then mỗi workbook có đúng một lesson

Scenario: BR-MLS-02 — tên giáo cụ thương mại bị chặn
  Given một lesson Montessori có materials chứa tên một bộ giáo cụ thương mại
  When gửi duyệt
  Then trả 422
  And thông báo nêu đúng chuỗi vi phạm

Scenario: BR-MLS-03 — vật nhỏ ở band 3-4 bị chặn
  Given một activity band 3-4 dùng hạt đếm đường kính 1cm
  When gửi duyệt
  Then trả 422
  And lý do trỏ danh sách an toàn

Scenario: BR-MLS-04 — hoạt động ngoài màn hình là hoạt động chính
  When đọc mọi lesson Montessori
  Then hoạt động chính của mỗi lesson là một activity ngoài màn hình

Scenario: BR-MLS-05 — activity không nhắc workbook nguồn
  When đọc mọi activity Montessori
  Then không activity nào nhắc mã workbook hay lesson chứa nó

Scenario: BR-MLS-06 — đánh giá bằng hành vi quan sát được
  When đọc phần đánh giá của mọi lesson Montessori
  Then mỗi mô tả nêu hành vi và số lần thử
  And không dùng từ trừu tượng như hiểu hay nắm được

Scenario: BR-MLS-07 — không giả định biết đọc
  When đọc mọi chỉ dẫn dành cho trẻ trong lesson Montessori
  Then không hoạt động nào yêu cầu trẻ tự đọc chữ

Scenario: BR-MLS-08 — mã lesson nằm trong khối dành riêng
  When đọc mã lesson và activity Montessori
  Then mọi mã đều từ số thứ tự 0101 trở lên

Scenario: BR-MLS-09 — một batch lesson một workbook
  Given batch SEED-MONT-L05 chứa lesson của workbook 06
  When chạy pnpm --filter @mindkid/content-build seed:check
  Then cổng montessori-gate báo batch chứa nhiều workbook

Scenario: BR-MLS-10 — không dựng chương trình theo tuổi chỉ bằng lesson Montessori
  Given một chương trình age_based chỉ gồm lesson Montessori
  When chạy cổng kiểm chương trình
  Then cổng đỏ vì thiếu competency C5 và C6
  And vì C1 vượt 40 phần trăm

Scenario: BR-MLS-11 — chưa có người duyệt thì lesson ở draft
  When đọc trạng thái mọi lesson Montessori đã seed
  Then lesson chưa có dấu vết chuyên gia đọc bản thô đều ở draft

Scenario: BR-MLS-12 — activity trỏ level chưa published bị chặn
  Given một activity kind digital_game trỏ một game level draft
  When gửi duyệt
  Then trả 422

Scenario: BR-MLS-13 — khởi động ở mức vật thật
  When đọc phần khởi động của mọi lesson Montessori
  Then không phần khởi động nào mở bằng ký hiệu số

Scenario: BR-MTB-11 — nội dung cho khuôn chưa active bị chặn
  Given một batch khai template_code của khuôn chưa có trong registry
  When chạy pnpm --filter @mindkid/content-build seed:check
  Then cổng 1 fail
  And thông báo nêu khuôn chưa tồn tại
```

## 10. Boundaries

**Always**
- Tách workbook thành dạng bài trước khi ánh xạ.
- Phân giải strand thành skill code có thật.
- Tái biên soạn số liệu, lời dẫn và bối cảnh.
- Ghi rõ dạng bài thuộc lô A hay lô B trước khi mở PR seeder.
- Đối chiếu hạn ngạch trước khi soạn bản đầu tiên của một workbook; cấp mã trong khối dành riêng.
- Chạy cổng phủ trước khi mở PR; một batch một workbook; khai `access_tier` tường minh.
- Thay mọi giáo cụ gốc bằng vật liệu ở mục 7.12; đặt hoạt động ngoài màn hình làm hoạt động chính.
- Cho chuyên gia sư phạm mầm non đọc bản thô lesson trước khi mở PR.

**Ask first**
- Đổi band tuổi của một workbook so với phần nguồn của nó.
- Thêm workbook mới vào bảng 7.1.
- Gắn một workbook vào competency chính khác với mục 7.1.
- Nới trần của một competency ở mục 7.7, hoặc cho một workbook chiếm quá một phần tư hạn ngạch của competency nó thuộc về.
- Thêm một hàng vật liệu thay thế không giữ đủ thuộc tính sư phạm gốc; tách một workbook thành hai lesson.
- Dựng một chương trình mang tên Montessori.

**Never**
- Nạp dataset thẳng vào database.
- Tạo skill hoặc strand mới để khớp một workbook.
- Dùng tên bộ test tâm lý thương mại, hoặc tuyên bố đo chỉ số trí tuệ.
- Ép dạng bài lô B sang khuôn lô A.
- Nới trần item của band để giữ nguyên một dạng bài gốc.
- Sao chép nguyên văn lời dẫn, số liệu hoặc hình vẽ của nguồn.
- Vượt hạn ngạch rồi sửa sau bằng archive; lấp hạn ngạch thừa bằng biến thể chỉ đổi số liệu.
- Nạp batch lô B khi dạng bài lô A đã nhận chưa xong; soạn nội dung cho khuôn chưa `active`.
- Giữ tên giáo cụ thương mại trong danh sách vật liệu; dùng vật nhỏ nuốt được với band 3-4.
- Yêu cầu trẻ tự đọc chữ; trỏ activity tới game level chưa `published`.
- Dựng chương trình theo tuổi chỉ bằng lesson Montessori.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~21 tập PDF nguồn có giấy phép sử dụng nào?~~ **Đóng 2026-08-20 (T98, `D-RG`)**: mặc định coi nguồn là **có bản quyền đầy đủ**. Mục 7.4 đã là posture chặt nhất — chỉ cơ chế bài toán được tái dùng, mọi lời văn, số liệu, bố cục và hình vẽ phải viết lại. Một giấy phép rộng hơn chỉ **nới** được posture này, không siết thêm, nên nó không chặn lô A. Vẫn cần người quyết trước khi **nêu tên nguồn ra công khai** hoặc dùng lại ảnh chụp trang | — | Đã đóng | D-RG |
| ~~2~~ | ~~Strand phụ ở mục 7.1 gắn vào `content_skill_map` với trọng số bao nhiêu?~~ **Đóng 2026-08-20 (T98, `D-RH`)**: không gắn. `skill_codes` là mảng phẳng không mang trọng số nên không biểu diễn được `weight = 1.0`; mỗi level mang đúng một skill code, strand phụ đi vào tag — xem mục 7.1 | — | Đã đóng | D-RH |
| ~~3~~ | ~~Hai workbook chưa tách dạng (09, 17) chuẩn hoá thế nào?~~ **Đóng 2026-08-20 (T98, `D-RI`)**: sửa cú pháp trong chính dataset. "Đọc-only" cấm sửa **nội dung** để khớp bảng ánh xạ, không cấm chuẩn hoá **cú pháp**. Sau chuẩn hoá: 21 workbook, 59 dạng bài (đếm lại ở T99 WP99.0) | — | Đã đóng | D-RI |
| ~~4~~ | ~~Corpus Montessori có phải nguồn duy nhất của đợt nội dung này?~~ **Đóng 2026-08-20 (T98, `D-RJ`)**: có, ở Task #98. Hạn ngạch ở mục 7.7 đã tính với C5 và C6 giữ nguyên 20 level, nên luật cân bằng `BR-TCM-07` không bị chạm. Nguồn cho C5 và C6 là quyết định phạm vi của một đợt sau | — | Đã đóng | D-RJ |
