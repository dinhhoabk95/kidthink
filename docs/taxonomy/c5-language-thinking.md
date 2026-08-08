# C5 — Language Thinking

> Nguồn: Tools of the Mind (ngôn ngữ điều hoà hành vi), Visible Thinking (nói ra
> quá trình suy nghĩ), Reggio Emilia (trăm ngôn ngữ của trẻ).
> Legend + quy ước mã: [`index.md`](index.md).

**Strand:** 5 · **Skill đã đặt tên:** 21 · **Mục tiêu:** ~60 · **Còn thiếu:** 39
**Game type hiện có:** 1 (D6-09 — bài toán lời văn audio)

> Lưu ý: **Competency yếu nhất: 1/60 game type.** Cần đầu tư audio tiếng Việt trước
> khi có thể phát hành. Xem [SPEC §11 câu hỏi 6](../SPEC.md#11-open-questions).

---

## C5.LIS — Listening (3)

Nghe hiểu và hành động theo. Không yêu cầu đọc chữ.

| Code | Skill | Tuổi | Khó | Prerequisite | Thinking | Status |
|---|---|---|---|---|---|---|
| C5.LIS.01 | Nghe và chọn | 3 | 2 | — | `listen` `match` | chờ |
| C5.LIS.02 | Nghe và làm theo | 3 | 2 | C5.LIS.01 | `listen` `plan` | chờ |
| C5.LIS.03 | Nghe theo trình tự nhiều bước | 5 | 4 | C5.LIS.02 | `listen` `sequence` `recall` | |

## C5.VOC — Vocabulary (5)

Từ vựng theo chủ đề. Gắn với `THEME_REGISTRY` của engine.

| Code | Skill | Tuổi | Khó | Prerequisite | Thinking | Status |
|---|---|---|---|---|---|---|
| C5.VOC.01 | Từ vựng động vật | 3 | 1 | — | `match` `recall` | chờ |
| C5.VOC.02 | Từ vựng trái cây | 3 | 1 | — | `match` `recall` | chờ |
| C5.VOC.03 | Từ vựng nghề nghiệp | 4 | 3 | — | `match` `infer` | chờ |
| C5.VOC.04 | Từ vựng gia đình | 3 | 2 | — | `match` `recall` | chờ |
| C5.VOC.05 | Từ vựng phương tiện | 3 | 2 | — | `match` `recall` | chờ |

## C5.STO — Story (4)

| Code | Skill | Tuổi | Khó | Prerequisite | Thinking | Status |
|---|---|---|---|---|---|---|
| C5.STO.01 | Kể lại chuyện vừa nghe | 4 | 3 | C5.LIS.01 | `recall` `describe` | ⬜ |
| C5.STO.02 | Sắp xếp tranh theo trình tự truyện | 4 | 3 | C3.SEQ.04 | `sequence` `infer` | chờ |
| C5.STO.03 | Chọn kết thúc hợp lý | 5 | 4 | C5.STO.02 | `predict` `infer` | chờ |
| C5.STO.04 | Nguyên nhân – kết quả trong truyện | 5 | 4 | C3.INF.03 | `infer` `deduce` | chờ |

## C5.DES — Describe (4)

| Code | Skill | Tuổi | Khó | Prerequisite | Thinking | Status |
|---|---|---|---|---|---|---|
| C5.DES.01 | Miêu tả một vật | 3 | 2 | C4.DET.01 | `describe` `observe` | ⬜ |
| C5.DES.02 | Miêu tả một bức tranh | 4 | 3 | C5.DES.01 | `describe` `observe` | ⬜ |
| C5.DES.03 | So sánh bằng lời | 4 | 3 | C1.CMP.01 · C5.DES.01 | `describe` `compare` | ⬜ |
| C5.DES.04 | Giải thích lý do chọn | 5 | 4 | C3.DED.03 | `describe` `deduce` | ⬜ |

## C5.QUE — Question (5)

Năm câu hỏi nền tảng. Trẻ trả lời, sau đó tự đặt câu hỏi.

| Code | Skill | Tuổi | Khó | Prerequisite | Thinking | Status |
|---|---|---|---|---|---|---|
| C5.QUE.01 | Trả lời "Ai?" | 3 | 2 | C5.LIS.01 | `listen` `infer` | chờ |
| C5.QUE.02 | Trả lời "Cái gì?" | 3 | 2 | C5.LIS.01 | `listen` `infer` | chờ |
| C5.QUE.03 | Trả lời "Ở đâu?" | 4 | 3 | C5.QUE.02 · C2.ORI.07 | `listen` `infer` | chờ |
| C5.QUE.04 | Trả lời "Khi nào?" | 5 | 4 | C5.QUE.02 · C1.MEAS.10 | `listen` `sequence` | chờ |
| C5.QUE.05 | Trả lời "Tại sao?" | 5 | 4 | C5.QUE.02 · C3.INF.03 | `listen` `deduce` | chờ |

---

## Khoảng trống cần biên soạn (39 skill)

| Strand | Thêm | Hướng mở rộng |
|---|---:|---|
| C5.VOC | +15 | Đồ dùng học tập · đồ dùng nhà bếp · quần áo · bộ phận cơ thể · thời tiết · cây cối · côn trùng · động vật biển · nhạc cụ · thể thao · lễ hội Việt Nam · màu sắc mở rộng · hình dạng bằng lời · cảm xúc · vị trí bằng lời |
| C5.STO | +8 | Đoán chuyện từ một tranh · sắp xếp 5 tranh · tìm tranh không thuộc chuyện · kể chuyện theo tranh mình chọn · nhận ra nhân vật chính · chuỗi cảm xúc nhân vật · truyện có hai kết thúc · nối lời thoại với nhân vật |
| C5.LIS | +6 | Nghe phân biệt hai chỉ dẫn gần giống · nghe rồi bỏ qua chỉ dẫn sai · nghe số rồi lấy đúng lượng · nghe mô tả rồi tìm vật · nghe chỉ dẫn có phủ định · nghe chỉ dẫn ba bước |
| C5.DES | +6 | Miêu tả để bạn đoán · miêu tả theo thứ tự từ tổng thể đến chi tiết · miêu tả sự thay đổi · giải thích cách làm · kể lại quy trình · nêu ý kiến kèm lý do |
| C5.QUE | +4 | Tự đặt câu hỏi về tranh · "Như thế nào?" · "Bao nhiêu?" · phân biệt câu hỏi và câu kể |

## Ràng buộc kỹ thuật — phải giải trước khi build C5

| Vấn đề | Hệ quả |
|---|---|
| Toàn bộ C5 cần **audio tiếng Việt** — trẻ 3–6 không đọc được | Không có audio thì không có C5. Chặn cứng. |
| C5.DES và C5.STO.01 cần trẻ **nói ra** — engine chưa có input giọng nói | `packages/ai-voice` đang deferred Phase 2. Trước mắt: `asset_type = worksheet` + `parent_guide`, người lớn nghe và đánh giá. |
| Đánh giá câu trả lời mở không tự động hoá được | `mastery_state` cho C5.DES phải cho phép **người lớn nhập kết quả**, không chỉ engine ghi. Cần cột nguồn đánh giá. |

**Quyết định cần thiết:** thu âm người thật (chất lượng cao, chi phí lớn, khó
sửa) hay TTS (rẻ, sửa nhanh, kém tự nhiên với trẻ nhỏ). Ước lượng khối lượng:
~60 skill × ~4 LO × ~3 câu = **~700 file audio**.
