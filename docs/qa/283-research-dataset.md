# #283 — Đối chiếu nghiên cứu và ứng dụng thực tế cho các thay đổi dataset

Ngày 2026-10-04. Đối tượng: trẻ 3–6 tuổi. Đọc cùng [`283-dataset-review.md`](283-dataset-review.md).
Mức tin cậy ghi từng nguồn: **[đọc]** = đã mở và đọc nội dung trang; **[tóm tắt]** = chỉ thấy đoạn tóm tắt
của công cụ tìm kiếm, chưa mở bài; **[nhớ]** = kiến thức nền, chưa kiểm lại trong phiên này.

## 1. Bằng chứng

| # | Điều rút ra | Nguồn | Mức |
| --- | --- | --- | --- |
| E1 | Mục tiêu chạm ≥ **2 × 2 cm** cho trẻ nhỏ (gấp 4 mục tiêu 1 × 1 cm của người lớn); **tránh kéo chính xác** (đường hẹp, điểm đích nhỏ) dưới 9 tuổi hoặc có cách thay thế | [NN/g — Children's UX: physical development](https://www.nngroup.com/articles/children-ux-physical-development/) | đọc |
| E2 | 89 trẻ 3–6 tuổi: khuyến nghị mục tiêu **48 dp** (tối thiểu 32 dp), tương đương 7–10 mm; hiệu năng tăng theo tuổi và tương quan với kỹ năng vận động tinh | [Vatavu, Cramariuc, Schipor 2015 (IJHCS)](https://mintviz.usv.ro/publications/ijhcs2015.pdf) | tóm tắt |
| E3 | Mục tiêu 0,125" (~3 mm) khó nhất cho cả trẻ và người lớn; trẻ trượt mục tiêu và nét cử chỉ nhiều hơn người lớn | [Anthony và cộng sự 2012 (ITS)](https://link.springer.com/article/10.1007/s00779-013-0749-9) | tóm tắt |
| E4 | 4 tuổi làm được mọi cử chỉ (tap, kéo, phóng, xoay một ngón); 3 tuổi gặp khó ở thao tác phức tạp; 2 tuổi tap và kéo được. Kéo thả tốt hơn ở trẻ có kỹ năng thị giác–không gian cao | [Nacher, Jaen và cộng sự — pre-kindergarten multi-touch](https://link.springer.com/chapter/10.1007/978-3-319-22668-2_42) | tóm tắt |
| E5 | Tap đúng chỗ: 2–3 tuổi 27%, 4–6 tuổi 57%; tap vật đang chuyển động 37%; chạm giữ 20%. Ứng dụng cho ≤ 8 tuổi **không dùng lời nhắc bằng chữ và không đòi cử chỉ nhiều ngón** | [PMC7303424 — gestures & prompting](https://pmc.ncbi.nlm.nih.gov/articles/PMC7303424/) | đọc |
| E6 | Sức chứa bộ nhớ thị giác **2–3 vật ở 3–5 tuổi**, tiệm cận người lớn khoảng 6–8 tuổi; 5 tuổi: 58–72% có tầm nhớ vị trí ≤ 3 | [Visual WM 3–8 tuổi (Atten Percept Psychophys)](https://link.springer.com/article/10.3758/s13414-016-1140-5), [Missing Scan Task, PMC4310560](https://pmc.ncbi.nlm.nih.gov/articles/PMC4310560/) | tóm tắt |
| E7 | Nhìn thấy cùng lúc ≠ nhớ: giới hạn 2–3 vật áp cho thông tin **phải giữ trong đầu**; số vật **hiện sẵn trên màn** để tìm/chọn không bị giới hạn này, mà bị giới hạn bởi sàn chạm và độ quét thị giác | suy ra từ E6 và `GT-009.md` N2 (dải manh mối ghim cả lượt) | suy luận |
| E8 | Nhiều lựa chọn hơn → tải nhận thức cao hơn; dạng 1 đúng + 2 sai là hiệu quả | [The eLearning Coach](https://theelearningcoach.com/elearning_design/rules-for-multiple-choice-questions/) (nguồn dành cho người lớn, chỉ dùng làm tham khảo) | tóm tắt |
| E9 | Apple ≥ 44 pt, Material ≥ 48 dp cho người lớn | tài liệu HIG/Material | nhớ |
| E10 | **Không tìm được** số lựa chọn trên mỗi màn của Khan Academy Kids, Lingokids, ABCmouse, Duolingo ABC, Todo Math: tài liệu công khai không nêu. Chỉ biết Lingokids chia hoạt động theo tuổi (≤ 3 và 4–5) và Khan Academy Kids phủ 2–8 tuổi | [Lingokids help](https://help.lingokids.com/hc/en-us/articles/115005118529-What-ages-does-Lingokids-teach), [Khan Academy Kids (Common Sense)](https://www.commonsensemedia.org/app-reviews/khan-academy-kids) | đọc kết quả tìm kiếm |

Hạn chế: không có nguồn nào ở E10 cho phép so số vật cụ thể với dataset này; đối chiếu với ứng dụng thật cần mở
ứng dụng và đếm trực tiếp, tôi chưa làm. Kết luận dưới đây dựa chủ yếu vào E1–E7.

Đối chiếu sàn chạm của repo: sàn band 3–4 là 96 CSS px ≈ 2,5 cm trên màn 160 dpi chuẩn CSS (96 px ≈ 2,54 cm),
**cao hơn** khuyến nghị 2 cm của E1 và gấp ~3 lần 7–10 mm của E2. Nên chưa có lý do hạ sàn; việc giảm vật là đúng
hướng, không phải do sàn quá chặt.

## 2. Quyết định từng mục

| Mục | Thay đổi #283 | Quyết định | Lý do |
| --- | --- | --- | --- |
| A1 | GT-004 band 4–5: 11 level bậc 5 → 4, mất bậc 5 | **Nhận** | Bậc 5 vẫn còn ở band 5–6; kéo thả thao tác ghép cặp ở 4–5 tuổi dư sức với sàn chạm ≥ 2 cm (E1, E4); không có bằng chứng cần một bậc khó hơn ở band này |
| A2 | GT-008 band 3–4: `slot_count` ≤ 4 (4 → 3 ở 3 level) | **Nhận** | Khớp E6: 3 tuổi giữ 2–3 vật; trùng spec `GT-008.md:124` |
| A3 | GT-015 band 5–6: 6 level bậc 5 → 4 | **Sửa**: bậc 5 trở lại bằng lưới 3×3 với ô trống 3 (mục 3) | Sudoku 4×4 ngoài spec (`GT-015.md` chỉ 2×2/3×3) và nặng giữ ràng buộc (E6); bù độ khó bằng số ô trống, không bằng kích thước lưới |
| A4 | GT-021 band 4–5: 8 level 3/4 → 2, 18/22 level cùng bậc 2 | **Sửa**: tách 18 level theo `show_axis_guide` (mục 4) | Thang phẳng làm mất tín hiệu "khó dần" cho trẻ giỏi; tách bằng tham số vẽ, không thêm vật |
| B1 | GT-009 bậc 5: 10 → 8 ứng viên; 4 manh mối ở 5–6 | **Nhận**, kèm điều kiện: dải manh mối luôn ghim hiện | 8 ứng viên là chọn từ vật **hiện sẵn** (E7) nên không vướng giới hạn 2–3; 4 manh mối vượt E6 nếu chỉ nghe, nhưng `GT-009.md` N2 ghim thẻ biểu tượng cả lượt và `BR-E009-02` cho nghe lại. Giữ 2 manh mối đồng thời ở band 4–5 (spec đã vậy) |
| B2 | GT-029 bậc 5: 10 → 8 vật, `remove_count` 4 | **Nhận** | Đếm vật hiện sẵn (E7); 8 vật vừa sàn chạm; thang vẫn tăng (bậc 4 `remove_count` 3) |
| B3 | GT-030 bậc 5: 5 → 4 đáp án | **Nhận** | 4 lựa chọn là mức cao đã đủ cho 5–6 tuổi (E8); 1 đúng + 3 sai; khác bậc 4 ở độ dài 8 → 10 và dung sai 8 → 6% |
| B4 | GT-035 bậc 5: `collectible_count` 3 → 2 | **Nhận** | Lưới tối đa 3×4; bậc 5 vẫn khác bậc 4 ở số vật, lệnh, chướng ngại |
| C1 | GT-024 mẫu 2: sao 10 đỉnh → ngũ giác sao 5 đỉnh | **Nhận** | Nối điểm cần nét chính xác (E1, E3); 10 đỉnh dưới sàn chạm không thể chạm trúng; hình vẫn là sao một nét |
| C2 | GT-000 `recallOptions` luôn có đáp án | **Nhận** | Sửa lỗi, không đổi độ khó |
| X | Lớp xoay máy GT-035 ở điện thoại ngang | **Nhận** | Không hạ sàn chạm, không thu ô; E1 không ủng hộ ô nhỏ hơn; lớp phủ không chữ phù hợp E5 (không lời nhắc chữ) |
| Y | Điểm một phần vòng nhiều lượt GT-026/027 (`BR-SCO-09`) | **Nhận** | 75% đúng mà 0 điểm không phản ánh năng lực và làm trẻ nản; thang liên tục phù hợp mục tiêu khuyến khích |

Chưa nhận được kết luận "tối ưu" cho mục nào bằng đối chiếu ứng dụng thật (E10); các quyết định "Nhận" dựa trên
sàn chạm, sức chứa bộ nhớ và việc nội dung vẫn còn nhiều bậc.

## 3. A3 — GT-015 band 5–6: bậc 5 trở lại

Hiện `engine-difficulty-params.json`: bậc 5 = `item_count` 4, `blank_count` 3, `distractor_count` 2 — ngụ ý lưới 4×4,
ngoài spec. Bậc 4 = `item_count` 3, `blank_count` 2, `distractor_count` 2.

Đề xuất (cho dữ liệu, spec cho phép: `GT-015.md` mục 10 "Ask first — `grid_size` 3 với `blank_count` > 3", tức 3 ô
trống ở lưới 3×3 **không** thuộc nhóm phải hỏi):

| Bậc | `grid_size` | `blank_count` | `distractor_count` | Số ký hiệu trong khay | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| 4 (giữ) | 3 | 2 | 2 | 4 | |
| **5 (đề xuất)** | **3** | **3** | **1** | **4** | thêm 1 ô phải điền, bớt 1 ký hiệu nhiễu: khay không lớn hơn bậc 4 |

- Khay bằng bậc 4 (4 ký hiệu), lưới 9 ô như bậc 4, nên **không tăng số vật vật lý** và không đụng nợ B3.
- Độ khó đến từ 3 ô phải suy luận cùng lúc thay vì 2. Rủi ro bộ nhớ (E6): ràng buộc hàng/cột hiện sẵn trên lưới, trẻ
  không phải nhớ; `L2` đã tô hàng/cột nên có nâng đỡ.
- Cần: bộ giải xác nhận **lời giải duy nhất** với 3 ô trống ở 3×3 (`Never — lưới nhiều lời giải`). Nếu không đủ đề
  duy nhất thì giữ `blank_count` 2 ở bậc 5 và chấp nhận band 5–6 chỉ có bậc 1–4.
- Bỏ fixture 4×4 và `grid_size: 4` trong schema: ngoài spec.
- Level được trả về bậc 5: chỉ những level trong 6 level đã hạ (`GL-C1-PROB-HIDE-0002/0004/0007/0011`,
  `GL-C2-GRD-HIDE-0002`, `GL-C3-ALG-HIDE-0004`) mà đề thật là 3×3 với 3 ô trống. Duyệt từng level.

## 4. A4 — GT-021 band 4–5: tách thang bằng đường trục

Hiện: 4 level bậc 1, 18 level bậc 2. Tham số theo bậc (`show_axis_guide`): bậc 1–2 `true`, bậc 3–5 `false`; số mảnh
2, 3, 4, 6, 8; nhiễu 1, 1, 2, 3, 4. Ở band 4–5 số mảnh bị chặn bởi sàn chạm nên bậc 4–5 không dùng được.

Đề xuất: thêm **bậc 3 ở band 4–5 bằng cách tắt đường trục dẫn**, giữ nguyên số mảnh:

| Bậc | `item_count` | `show_axis_guide` | `distractor_count` | Trục | Điều kiện |
| --- | --- | --- | --- | --- | --- |
| 1 | 2 | true | 1 | dọc | giữ |
| 2 | 3 | true | 1 | dọc | giữ |
| **3 (đề xuất)** | **3** | **false** | 1 | **dọc** | số mảnh bằng bậc 2 |

- Spec: `GT-021.md` mục 10 "Ask first — tắt `show_axis_guide` ở band 4–5" và "trục ngang ở band 4–5". Đề xuất này
  **là yêu cầu phê duyệt đó**: chỉ tắt đường trục, trục vẫn dọc, không đưa trục ngang vào band 4–5.
- Không tăng số vật: `item_count` 3 như bậc 2; `show_axis_guide` chỉ là hình vẽ phụ. "Ô gương của ô đang chạm"
  (`GT-021.md` §7) cũng tắt cùng cờ, nên cần giữ lại ở bậc 3 hoặc tắt hẳn; đề xuất **giữ ô gương sáng** ở bậc 3 để chỉ
  bỏ một tầng nâng đỡ mỗi lần.
- Cách chọn level chuyển bậc 2 → 3: trong 18 level bậc 2, chuyển các level có `item_count` = 3 và `distractor_count` ≥ 1
  mà trục dọc và mẫu không đối xứng tầm thường (tức các level vốn được hạ từ bậc 3: 7 level; kết quả mong đợi bậc 1: 4
  · bậc 2: 11 · bậc 3: 7). 7 level này vốn là bậc 3 trước #283, nên đây là khôi phục, không phải bịa mới.
- Hạng truy cập: các level này đã ghim theo hạng cũ (`standard`; riêng `GL-C1-CNT-TANG-0003` `premium`), nên khôi phục bậc
  không đổi hạng.

## 5. Việc cần làm để áp dụng (chưa làm trong tài liệu này)

1. Spec trước: `GT-021.md` (cho phép bậc 3 không đường trục ở 4–5, trục dọc), `GT-015.md` (khay không lớn hơn bậc
   trước; bỏ tham chiếu 4×4).
2. Dữ liệu: `engine-difficulty-params.json` GT-015 bậc 5; bộ giải GT-015; map level → bậc trong
   `packages/content/src/skills` cho 6 level A3 và 7 level A4.
3. Test: thang GT-015/GT-021 không phẳng ở band đích; `check:difficulty-ladder` không vượt trần 186.
4. Nâng `GENERATED_LEVEL_CONTENT_VERSION` lên 5 và cập nhật `content-version.lock.json` (`BR-CSA-17`) **nếu chưa gieo v4
   lên staging/prod**; nếu v4 đã lên môi trường thật thì bắt buộc 5.
5. Kiểm trên thiết bị cảm ứng thật ([`touch-device-checklist.md`](touch-device-checklist.md)): GT-021 bậc 3 không đường
   trục, GT-015 bậc 5.

## 6. Nguồn

- [NN/g — Children's UX: physical development](https://www.nngroup.com/articles/children-ux-physical-development/)
- [Vatavu et al. 2015 — Touch interaction for children aged 3 to 6](https://mintviz.usv.ro/publications/ijhcs2015.pdf)
- [Anthony et al. — Designing smarter touch-based interfaces for educational contexts](https://link.springer.com/article/10.1007/s00779-013-0749-9)
- [Nacher et al. — Pre-kindergarten multi-touch accuracy](https://link.springer.com/chapter/10.1007/978-3-319-22668-2_42)
- [PMC7303424 — Children's touchscreen gestures and prompting](https://pmc.ncbi.nlm.nih.gov/articles/PMC7303424/)
- [Visual working memory 3–8 tuổi](https://link.springer.com/article/10.3758/s13414-016-1140-5)
- [Missing Scan Task, PMC4310560](https://pmc.ncbi.nlm.nih.gov/articles/PMC4310560/)
- [The eLearning Coach — multiple choice](https://theelearningcoach.com/elearning_design/rules-for-multiple-choice-questions/)
- [Lingokids help](https://help.lingokids.com/hc/en-us/articles/115005118529-What-ages-does-Lingokids-teach), [Common Sense — Khan Academy Kids](https://www.commonsensemedia.org/app-reviews/khan-academy-kids)
