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

| Code | Skill | Tuổi | Khó | Prerequisite | Thinking | Bậc |
|---|---|---|---|---|---|---|
| C5.LIS.01 | Nghe và chọn | 3 | 2 | — | `listen` `match` | b |
| C5.LIS.02 | Nghe và làm theo | 3 | 2 | C5.LIS.01 | `listen` `plan` | b |
| C5.LIS.03 | Nghe theo trình tự nhiều bước | 5 | 4 | C5.LIS.02 | `listen` `sequence` `recall` | a |

## C5.VOC — Vocabulary (5)

Từ vựng theo chủ đề. Gắn với `THEME_REGISTRY` của engine.

| Code | Skill | Tuổi | Khó | Prerequisite | Thinking | Bậc |
|---|---|---|---|---|---|---|
| C5.VOC.01 | Từ vựng động vật | 3 | 1 | — | `match` `recall` | b |
| C5.VOC.02 | Từ vựng trái cây | 3 | 1 | — | `match` `recall` | b |
| C5.VOC.03 | Từ vựng nghề nghiệp | 4 | 3 | — | `match` `infer` | c |
| C5.VOC.04 | Từ vựng gia đình | 3 | 2 | — | `match` `recall` | b |
| C5.VOC.05 | Từ vựng phương tiện | 3 | 2 | — | `match` `recall` | b |

## C5.STO — Story (4)

| Code | Skill | Tuổi | Khó | Prerequisite | Thinking | Bậc |
|---|---|---|---|---|---|---|
| C5.STO.01 | Kể lại chuyện vừa nghe | 4 | 3 | C5.LIS.01 | `recall` `describe` | c |
| C5.STO.02 | Sắp xếp tranh theo trình tự truyện | 5 | 4 | C3.SEQ.04 | `sequence` `infer` | a |
| C5.STO.03 | Chọn kết thúc hợp lý | 5 | 4 | C5.STO.02 | `predict` `infer` | a |
| C5.STO.04 | Nguyên nhân – kết quả trong truyện | 5 | 4 | C3.INF.03 | `infer` `deduce` | a |

## C5.DES — Describe (4)

| Code | Skill | Tuổi | Khó | Prerequisite | Thinking | Bậc |
|---|---|---|---|---|---|---|
| C5.DES.01 | Miêu tả một vật | 3 | 2 | C4.DET.01 | `describe` `observe` | b |
| C5.DES.02 | Miêu tả một bức tranh | 4 | 3 | C5.DES.01 | `describe` `observe` | c |
| C5.DES.03 | So sánh bằng lời | 4 | 3 | C1.CMP.01 · C5.DES.01 | `describe` `compare` | c |
| C5.DES.04 | Giải thích lý do chọn | 6 | 5 | C3.DED.03 | `describe` `deduce` | a |

## C5.QUE — Question (5)

Năm câu hỏi nền tảng. Trẻ trả lời, sau đó tự đặt câu hỏi.

| Code | Skill | Tuổi | Khó | Prerequisite | Thinking | Bậc |
|---|---|---|---|---|---|---|
| C5.QUE.01 | Trả lời "Ai?" | 3 | 2 | C5.LIS.01 | `listen` `infer` | b |
| C5.QUE.02 | Trả lời "Cái gì?" | 3 | 2 | C5.LIS.01 | `listen` `infer` | b |
| C5.QUE.03 | Trả lời "Ở đâu?" | 4 | 3 | C5.QUE.02 · C2.ORI.07 | `listen` `infer` | c |
| C5.QUE.04 | Trả lời "Khi nào?" | 5 | 4 | C5.QUE.02 · C1.MEAS.10 | `listen` `sequence` | a |
| C5.QUE.05 | Trả lời "Tại sao?" | 5 | 4 | C5.QUE.02 · C3.INF.03 | `listen` `deduce` | a |

## C5.PRA — Pragmatics & Conversation (6)

Dùng lời để cùng làm việc với người khác. GOLD 10.

| Code | Skill | Tuổi | Khó | Prerequisite | Thinking | Bậc |
|---|---|---|---|---|---|---|
| C5.PRA.01 | Chào hỏi · cảm ơn · xin lỗi | 3 | 1 | — | `listen` `describe` | b |
| C5.PRA.02 | Chờ đến lượt nói | 4 | 3 | C5.LIS.01 | `listen` `inhibit` | c |
| C5.PRA.03 | Nói đủ để người khác hiểu | 5 | 4 | C5.DES.01 | `describe` `verify` | a |
| C5.PRA.04 | Hỏi lại khi chưa hiểu | 5 | 4 | C5.QUE.02 | `listen` `verify` | a |
| C5.PRA.05 | Kể lại cho người vắng mặt | 5 | 4 | C5.STO.01 · C5.PRA.03 | `recall` `describe` | a |
| C5.PRA.06 | Nói ý kiến kèm lý do | 6–7 | 5 | C5.DES.04 | `describe` `deduce` | a |

## C5.GRM — Sentence & Grammar (5)

Câu tiếng Việt ở mức nói. GOLD 9c.

| Code | Skill | Tuổi | Khó | Prerequisite | Thinking | Bậc |
|---|---|---|---|---|---|---|
| C5.GRM.01 | Câu đủ ý | 4 | 3 | C5.DES.01 | `describe` `verify` | c |
| C5.GRM.02 | Trật tự từ trong câu | 5 | 4 | C5.GRM.01 · C3.SEQ.01 | `sequence` `verify` | a |
| C5.GRM.03 | Từ nối: và · rồi · nhưng · vì | 5 | 4 | C5.GRM.01 | `describe` `infer` | a |
| C5.GRM.04 | Câu hỏi và câu kể | 5 | 4 | C5.QUE.02 | `listen` `compare` | a |
| C5.GRM.05 | Từ chỉ vị trí, từ chỉ số nhiều | 5 | 4 | C5.GRM.01 · C2.ORI.07 | `describe` `match` | a |

## C5.PHO — Phonological Awareness (7)

Nhận thức âm thanh của tiếng Việt **bằng tai**, chưa cần chữ.

> Tiếng Việt là ngôn ngữ đơn lập có thanh điệu. Đơn vị là **tiếng**; mỗi tiếng
> gồm **âm đầu + vần + thanh**. Cấm — NEVER bê khung phoneme tiếng Anh sang.

| Code | Skill | Tuổi | Khó | Prerequisite | Thinking | Bậc |
|---|---|---|---|---|---|---|
| C5.PHO.01 | Nghe ra từng tiếng trong câu | 4 | 3 | C5.LIS.01 | `listen` `sequence` | c |
| C5.PHO.02 | Đếm tiếng trong từ | 4 | 3 | C5.PHO.01 · C1.CNT.01 | `listen` `count` | c |
| C5.PHO.03 | Tiếng dài – tiếng ngắn | 4 | 3 | C5.PHO.01 | `listen` `compare` | c |
| C5.PHO.04 | Nghe ra âm đầu của tiếng | 5 | 4 | C5.PHO.02 | `listen` `compare` | a |
| C5.PHO.05 | Tìm tiếng cùng âm đầu | 5 | 4 | C5.PHO.04 | `listen` `match` | a |
| C5.PHO.06 | Tách tiếng thành âm đầu và vần | 6–7 | 5 | C5.PHO.04 · C5.RHY.02 | `listen` `deduce` | a |
| C5.PHO.07 | Ghép âm đầu với vần thành tiếng | 6–7 | 5 | C5.PHO.06 | `listen` `solve` | a |

## C5.RHY — Rhyme & Rime (8)

Vần tiếng Việt — bộ phận sau âm đầu. Vần gồm âm đệm, âm chính, âm cuối.

| Code | Skill | Tuổi | Khó | Prerequisite | Thinking | Bậc |
|---|---|---|---|---|---|---|
| C5.RHY.01 | Nghe ra hai tiếng cùng vần | 4 | 3 | C5.PHO.01 | `listen` `match` | c |
| C5.RHY.02 | Tìm tiếng cùng vần trong nhóm | 5 | 4 | C5.RHY.01 | `listen` `match` | a |
| C5.RHY.03 | Đọc đồng dao có vần | 4 | 3 | C5.RHY.01 | `listen` `recall` | c |
| C5.RHY.04 | Vần một âm: a · o · e · i · u | 5 | 4 | C5.RHY.02 · C5.ALP.03 | `match` `observe` | a |
| C5.RHY.05 | Vần có âm cuối: an · am · ang · ac | 6–7 | 5 | C5.RHY.04 | `solve` `observe` | a |
| C5.RHY.06 | Vần có âm đệm: oa · oe · uy | 6–7 | 5 | C5.RHY.04 | `solve` `observe` | a |
| C5.RHY.07 | Vần có nguyên âm đôi: ia · ua · ưa | 6–7 | 5 | C5.RHY.05 | `solve` `compare` | a |
| C5.RHY.08 | Tự nghĩ tiếng cùng vần | 6–7 | 5 | C5.RHY.02 | `create` `listen` | a |

## C5.TON — Tone (6)

Sáu thanh của tiếng Việt: ngang · huyền · sắc · hỏi · ngã · nặng.
Thanh đổi thì nghĩa đổi — trục này không có tương đương trong tiếng Anh.

| Code | Skill | Tuổi | Khó | Prerequisite | Thinking | Bậc |
|---|---|---|---|---|---|---|
| C5.TON.01 | Nghe ra hai tiếng khác thanh | 4 | 3 | C5.PHO.01 | `listen` `compare` | c |
| C5.TON.02 | Thanh ngang và thanh huyền | 5 | 4 | C5.TON.01 | `listen` `match` | a |
| C5.TON.03 | Thanh sắc và thanh nặng | 5 | 4 | C5.TON.02 | `listen` `match` | a |
| C5.TON.04 | Thanh hỏi và thanh ngã | 6–7 | 5 | C5.TON.03 | `listen` `compare` | a |
| C5.TON.05 | Nhận dấu thanh trên chữ | 6–7 | 5 | C5.TON.03 · C5.ALP.04 | `observe` `match` | a |
| C5.TON.06 | Đổi thanh, đổi nghĩa | 6–7 | 5 | C5.TON.04 | `compare` `infer` | a |

## C5.ALP — Alphabet (8)

Hai mươi chín chữ cái tiếng Việt và các chữ ghép thường gặp.

| Code | Skill | Tuổi | Khó | Prerequisite | Thinking | Bậc |
|---|---|---|---|---|---|---|
| C5.ALP.01 | Chữ khác hình, khác số | 4 | 2 | C4.DET.02 | `compare` `sort` | b |
| C5.ALP.02 | Nhận mặt chữ trong tên mình | 4 | 2 | C5.ALP.01 | `observe` `match` | b |
| C5.ALP.03 | Nhận nhóm nguyên âm: a ă â e ê i o ô ơ u ư y | 5 | 3 | C5.ALP.01 | `observe` `match` | c |
| C5.ALP.04 | Nhận đủ 29 chữ cái | 6–7 | 4 | C5.ALP.03 | `observe` `recall` | a |
| C5.ALP.05 | Chữ hoa – chữ thường | 6–7 | 4 | C5.ALP.04 | `match` `compare` | a |
| C5.ALP.06 | Âm của chữ | 6–7 | 4 | C5.ALP.04 · C5.PHO.04 | `listen` `match` | a |
| C5.ALP.07 | Chữ ghép: ch · kh · nh · th · tr · ph | 6–7 | 5 | C5.ALP.06 | `observe` `solve` | a |
| C5.ALP.08 | Chữ ghép ba: ngh · gh · gi · qu | 6–7 | 5 | C5.ALP.07 | `observe` `solve` | a |

## C5.PRN — Print Concepts (5)

Chữ viết vận hành thế nào. GOLD 17.

| Code | Skill | Tuổi | Khó | Prerequisite | Thinking | Bậc |
|---|---|---|---|---|---|---|
| C5.PRN.01 | Chữ mang nghĩa | 4 | 2 | C5.ALP.01 | `infer` `observe` | b |
| C5.PRN.02 | Chữ ở quanh ta: biển hiệu · nhãn | 4 | 2 | C5.PRN.01 | `observe` `match` | b |
| C5.PRN.03 | Đọc trái → phải, trên → dưới | 4 | 2 | C2.ORI.01 · C2.ORI.02 | `sequence` `observe` | b |
| C5.PRN.04 | Khoảng cách giữa các từ | 5 | 3 | C5.PRN.03 | `observe` `count` | c |
| C5.PRN.05 | Dấu chấm, dấu hỏi | 6–7 | 4 | C5.PRN.04 · C5.GRM.04 | `observe` `infer` | a |

## C5.BOK — Book & Story Handling (5)

Quan hệ với sách trước khi biết đọc. KDI 28 · GOLD 17a.

| Code | Skill | Tuổi | Khó | Prerequisite | Thinking | Bậc |
|---|---|---|---|---|---|---|
| C5.BOK.01 | Bìa · trang · tên truyện | 3 | 1 | — | `observe` `match` | b |
| C5.BOK.02 | Lật sách, giữ sách | 3 | 1 | — | `plan` `observe` | b |
| C5.BOK.03 | Đoán truyện qua tranh bìa | 4 | 3 | C5.BOK.01 | `predict` `infer` | c |
| C5.BOK.04 | Chọn sách mình thích và nói vì sao | 5 | 3 | C5.BOK.03 | `describe` `plan` | c |
| C5.BOK.05 | Tìm thông tin trong sách tranh | 6–7 | 4 | C5.BOK.04 · C5.PRN.02 | `observe` `infer` | a |

## C5.WRT — Pre-writing (7)

Từ nét cơ bản tới viết tên. Vận động tinh cộng kiểm soát mắt – tay.

| Code | Skill | Tuổi | Khó | Prerequisite | Thinking | Bậc |
|---|---|---|---|---|---|---|
| C5.WRT.01 | Cầm bút đúng | 4 | 2 | — | `observe` `plan` | b |
| C5.WRT.02 | Nét thẳng, nét ngang | 4 | 2 | C5.WRT.01 | `observe` `create` | b |
| C5.WRT.03 | Nét xiên, nét cong | 5 | 3 | C5.WRT.02 | `observe` `create` | c |
| C5.WRT.04 | Nét móc, nét khuyết | 5 | 3 | C5.WRT.03 | `observe` `create` | c |
| C5.WRT.05 | Tô theo nét chấm | 5 | 3 | C5.WRT.02 | `observe` `verify` | c |
| C5.WRT.06 | Viết tên mình | 6–7 | 4 | C5.WRT.05 · C5.ALP.02 | `recall` `create` | a |
| C5.WRT.07 | Viết chữ cái trong ô li | 6–7 | 5 | C5.WRT.06 · C5.ALP.04 | `create` `verify` | a |

## C5.WRD — Word Reading (6)

Đọc tiếng và từ. Toàn bộ ở band tiền tiểu học.

| Code | Skill | Tuổi | Khó | Prerequisite | Thinking | Bậc |
|---|---|---|---|---|---|---|
| C5.WRD.01 | Nối từ với hình | 6–7 | 4 | C5.PRN.01 · C5.ALP.04 | `match` `observe` | a |
| C5.WRD.02 | Đọc tiếng quen thuộc | 6–7 | 4 | C5.ALP.06 | `recall` `match` | a |
| C5.WRD.03 | Đánh vần tiếng đơn giản | 6–7 | 5 | C5.WRD.02 · C5.PHO.07 | `solve` `sequence` | a |
| C5.WRD.04 | Đọc tiếng có dấu thanh | 6–7 | 5 | C5.WRD.03 · C5.TON.05 | `solve` `verify` | a |
| C5.WRD.05 | Đọc từ hai tiếng | 6–7 | 5 | C5.WRD.04 | `solve` `sequence` | a |
| C5.WRD.06 | Đọc câu ngắn ba tiếng | 6–7 | 5 | C5.WRD.05 · C5.PRN.04 | `solve` `infer` | a |

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
