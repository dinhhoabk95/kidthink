---
spec: CONCEPT-INTRO-MODEL
title: Mô hình bài làm quen khái niệm — input format và workflow chung
area: content
status: approved
mvp: false
phase: P4
reviewed: 2026-09-05
owns:
  - Ràng buộc biên tập của một bài làm quen khái niệm
  - Input format chung của `GT-000` — kho chất liệu và dãy hành động
  - Ba loại chất liệu: ký tự, từ khoá học, hình minh hoạ
  - Điều kiện một chủ đề được coi là "đã có bài làm quen"
depends_on:
  - CONCEPT-PRE-SKILL
  - GAME-LEVEL-MODEL
  - GAME-TEMPLATE-CONTRACT
  - SCHEMA-CONTENT-TAXONOMY
  - EMOJI-REGISTRY
---

# Mô hình bài làm quen khái niệm — input format và workflow chung

## 1. Objective

Cả 36 engine đang có đều **kiểm tra** thứ trẻ đã biết. Không engine nào **giới thiệu** thứ
trẻ chưa biết. Hệ quả đo được: 3.156 vòng chơi mang chỉ dẫn bằng **chữ**, 0 vòng có đường
dẫn audio — trong khi `BR-LSM-07` đã chốt Cấm — **NEVER giả định trẻ đọc được chữ**.

Bài làm quen là **một game level** chạy trên engine dạy **`GT-000`** — mã `000` vì nó đứng
trước mọi mã còn lại, cả trong danh sách lẫn trong đường đi của trẻ. Nó gắn theo **kỹ năng bậc `pre` của một chủ đề** —
quyết định `A-206-01` (gắn theo strand, chốt 2026-09-02) **bị thay** ngày 2026-09-05, xem
mục 11 câu 3. Từ vựng chủ đề và bậc `pre` ở
[`concept-pre-skill.md`](concept-pre-skill.md).

Một bài làm quen **không phải một màn chơi đơn**. Nó là **dãy nhiều hành động nhỏ nối tiếp
nhau trong cùng một level**, chạy trên **ba loại chất liệu**: **ký tự** (`glyph`), **từ khoá
học** (`word`), **hình minh hoạ** (`image`). Cả ba loại đi qua **cùng một input format** —
đó là điểm khiến người soạn viết một lần rồi dùng cho chữ, cho số, cho hình khối, cho âm
tiết mà không phải học ba khuôn.

File này sở hữu **input format và ràng buộc biên tập**. Bề mặt chạy ở
[`concept-intro-runner.md`](../04-play/concept-intro-runner.md); việc nó là bắt buộc, và
việc **một trò chơi có thể cần nhiều bài làm quen trước đó**, ở
[`concept-intro-gate.md`](../04-play/concept-intro-gate.md).

Khác biệt then chốt so với [`lesson-model.md`](lesson-model.md): lesson cần **người lớn ngồi
cạnh 20–30 phút** và phần lớn giá trị nằm ngoài màn hình. Bài làm quen chạy **một mình trẻ
với máy**, trong dưới hai phút, ngay trước màn chơi.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người soạn | `content_author` | Soạn bài làm quen như soạn một level, qua seeder hoặc studio |
| Người duyệt | `content_reviewer` | Đối chiếu checklist mục 7.6 trước khi publish |
| Cổng publish | — | Từ chối bài vi phạm mục 6 |
| Trẻ 3–6 | — | Không chạm vào file này; nó chạm vào trẻ qua runner |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `packages/content/src/**` | Người soạn | Đường soạn chính ở P4, giống mọi level khác |
| [`content-seed-authoring.md`](../01-platform/content-seed-authoring.md) | Người soạn | Quy ước hạt seed, không đổi |
| [`game-level-studio.md`](../06-admin/game-level-studio.md) | Người soạn | Studio, dùng chung form của level |

## 4. Main flow

Không có. Spec ràng buộc.

## 5. Alternative flows

Không có.

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-CIM-01` (là một level) | Bài làm quen là một hàng `game_levels` với `template_code = 'GT-000'`. Cấm — **NEVER** dựng entity nội dung riêng cho nó | Versioning, tier, seeder, QA ảnh chụp, studio và engine runtime đã có sẵn cho level. Entity riêng là bản sao của tất cả những thứ đó, và bản sao sẽ drift |
| `BR-CIM-02` (một chủ đề) | Một bài làm quen gắn **đúng một** kỹ năng bậc `pre`, và mọi giá trị của nó thuộc **cùng một** strand | Quyết định `A-206-01` gắn theo strand vì một strand "đủ hẹp để 12 hành động phủ được". Đo lại 2026-09-05: strand `C1.NREC` có 12 kỹ năng trải ba dải số 0–5, 0–10, 11–20 — 21 giá trị, không phủ nổi bằng 12 hành động. Đơn vị đúng là **chủ đề**, và mã của chủ đề là kỹ năng bậc `pre` — `BR-PRE-02` (luật một chủ đề một strand). Mã nguồn khuôn `GT-000` vốn đã gắn theo mã kỹ năng từ đầu; luật này đi theo mã nguồn, không ngược lại |
| `BR-CIM-03` (phân đoạn 2–6 chất liệu, ≤ 12 hành động) | Một `segment` có 2–6 chất liệu và 3–12 hành động. Một bài có 1–6 phân đoạn và tối đa **21** chất liệu phân biệt | Một chất liệu thì không có gì để phân biệt; trên 6 chất liệu trong **một mạch liền** thì vượt trí nhớ làm việc của trẻ 3 tuổi. Nhưng trần đó là trần của một mạch, không phải trần của một chủ đề: dãy số 0–10 có 11 giá trị và trẻ vẫn phải học đủ cả 11. Chia phân đoạn giữ được lý do gốc mà không cắt mất hai phần ba chủ đề |
| `BR-CIM-04` (mỗi chất liệu có tên nói được) | Mỗi asset BẮT BUỘC có `label` là tiếng Việt đọc lên được. `audio_path` là tuỳ chọn — thiếu thì runner đọc bằng TTS | Kênh dạy duy nhất mà trẻ chưa đọc chữ nhận được là kênh tai. Chất liệu không có tên nói được là chất liệu không dạy được |
| `BR-CIM-05` (đổi một chiều) | Chất liệu cùng `contrast_group` chỉ được khác nhau ở **một** chiều: số lượng, hoặc hình, hoặc màu, hoặc âm — Cấm — **NEVER** hai chiều trở lên. Distractor của một step `recognise` BẮT BUỘC lấy trong cùng `contrast_group` với target | Nguyên tắc cô lập khó của Montessori. Đổi hai chiều thì trẻ không biết mình đang được dạy chiều nào; distractor ngoài nhóm biến bước nhận biết thành câu đố mẹo |
| `BR-CIM-06` (trần 120 giây mỗi phân đoạn) | Mỗi phân đoạn ≤ 120 giây với trẻ trả lời ngay, và cuối mỗi phân đoạn là một chỗ trẻ dừng lại được rồi quay lại đúng chỗ đó | Bài làm quen đứng **giữa** trẻ và trò chơi. Trần thời lượng là để trẻ không bỏ cuộc, nên nó phải là trần của **một lần ngồi**, không phải trần của cả chủ đề. Chủ đề dài mà không có chỗ dừng thì trẻ bỏ ở giữa và mất sạch |
| `BR-CIM-07` (mặt chữ được thấy, không được đòi) | Chất liệu `glyph` và `word` BẮT BUỘC hiện mặt chữ. Cấm — **NEVER** dùng việc đọc được mặt chữ làm điều kiện đi tiếp | Người đặt việc muốn trẻ làm quen ký tự và từ; `BR-LSM-07` cấm giả định trẻ đọc được. Hai điều sống chung được đúng theo cách này: cho thấy, không bắt đọc |
| `BR-CIM-08` (Cấm chấm điểm) | `scoring` của bài làm quen là `none`. Cấm — **NEVER** có sao, điểm, đồng hồ, hay trạng thái thua | `BR-ENG-11` cấm điểm ở nơi trẻ nhìn thấy. Bài làm quen còn chặt hơn: hành động `present` **không có đáp án để sai** |
| `BR-CIM-09` (Cấm giọng chê) | Phản hồi khi trẻ chạm sai là **nhắc lại**, Cấm — **NEVER** là lời chê hay âm báo sai | `BR-SCF-08`. Trẻ đang gặp khái niệm lần đầu; báo sai ở lần đầu dạy trẻ rằng thử là rủi ro |
| `BR-CIM-10` (Cấm thu giọng trẻ) | Hành động `recall` là **nghe rồi chạm**. Cấm — **NEVER** yêu cầu micro, Cấm — **NEVER** lưu giọng trẻ | `BR-CDC-04` và `BR-AST-04`. Luật 91/2025/QH15 và Nghị định 13/2023 |
| `BR-CIM-11` (tier không cao hơn game) | `access_tier` của bài làm quen ≤ tier thấp nhất trong các level thuộc những kỹ năng mà chủ đề đó dạy | Bài làm quen `premium` đứng trước một trò chơi `free` là dựng tường thu phí ở chỗ `access-ladder.md` không cho phép |
| `BR-CIM-12` (asset đã đăng ký) | Mọi hình kiểu emoji phải có trong [`emoji-registry.md`](../01-platform/emoji-registry.md) | Emoji ngoài registry hiển thị khác nhau giữa Android và iOS — chất liệu được dạy phải là **cùng một thứ** trên mọi máy |
| `BR-CIM-13` (một chủ đề, một bài publish) | Một kỹ năng bậc `pre` có tối đa **một** bài làm quen ở trạng thái `published` | Cổng phải trỏ được tới **một** mã level cho mỗi chủ đề còn thiếu. Hai bài cùng publish thì cổng phải chọn, và không có luật nào để chọn |
| `BR-CIM-14` (giới thiệu trước, hỏi sau) | Mọi asset xuất hiện trong step `recognise`, `link` hay `recall` BẮT BUỘC có một step `present` của chính nó **đứng trước** trong `steps` | Đây là bất biến sư phạm của cả engine: hỏi một thứ chưa từng giới thiệu là quay về đúng cái lỗi mà 36 engine kia đang mắc. Kiểm được bằng máy, nên nó là cổng chứ không phải lời khuyên |
| `BR-CIM-15` (input format chung) | Mọi step trỏ chất liệu bằng `asset_id`. Cấm — **NEVER** nhúng nhãn, hình, hay đường dẫn audio thẳng vào một step | Đây là thứ làm ký tự, từ và hình dùng chung một khuôn. Nhúng thẳng thì mỗi loại chất liệu sinh một biến thể step, và người soạn phải học ba khuôn |
| `BR-CIM-16` (ba loại chất liệu, đóng) | `kind ∈ glyph \| word \| image`. Thêm loại phải sửa spec này trước | Trục đóng thì cổng và runner đối chiếu được. Trục mở là chỗ loại thứ tư lọt vào mà không ai dựng đường render cho nó |
| `BR-CIM-17` (từ phải có hình neo nghĩa) | Bài có asset `kind = 'word'` BẮT BUỘC có ít nhất một asset `kind = 'image'`, và có ít nhất một step `link` nối từ đó với hình | Trẻ chưa đọc không neo được nghĩa của một từ vào mặt chữ. Không có hình thì "mẹ" chỉ là hai nét vẽ |
| `BR-CIM-18` (mỗi phân đoạn có kết, cả bài có ôn) | Mỗi `segment` BẮT BUỘC kết thúc bằng ít nhất một step `recall`. Phân đoạn cuối của bài BẮT BUỘC là **phân đoạn ôn**, gộp mọi giá trị đã dạy trong bài | `recall` là phép đo xếp chỗ của phân đoạn. Không có phân đoạn ôn thì trẻ học sáu giá trị rời rạc và chưa lần nào thấy chúng đứng cạnh nhau — mà chủ đề chính là chỗ chúng đứng cạnh nhau |

## 7. Data

**Đọc:** `strands` · `skills` · `emoji_registry` · `game_templates` (`GT-000`).
**Ghi:** `game_levels` · `game_level_rounds` · `content_skill_map` — không bảng mới.

### 7.1 Input format chung — ba khối

`content_pack` của `GT-000` có đúng ba khối: **chủ đề** (`concept`), **kho chất liệu**
(`assets`) của cả bài, và **các phân đoạn** (`segments`). Kho khai *cái gì được dạy*; mỗi
phân đoạn khai *lát nào được dạy trong một lần ngồi, theo trình tự nào*. Ba loại chất
liệu đi qua cùng một hình dạng asset, và mọi step trỏ chất liệu bằng `asset_id`
(`BR-CIM-15`).

| Field | Kiểu | Ràng buộc |
|---|---|---|
| `concept.pre_skill_code` | `string` | Mã kỹ năng bậc `pre` của chủ đề, tồn tại trong `skills` — `BR-CIM-02` |
| `concept.label` | `string` | Tên chủ đề nói được, ví dụ `"số 0 đến 10"` |
| `assets[]` | `array` | Kho chất liệu của cả bài, 2–21 phần tử — `BR-CIM-03` |
| `segments[]` | `array` | 1–6 phân đoạn, có thứ tự — `BR-CIM-03` |
| `segments[].segment_id` | `string` | Duy nhất trong bài; là mốc trẻ quay lại được — `BR-CIM-06` |
| `segments[].asset_ids[]` | `array` | 2–6 mã chất liệu của phân đoạn — `BR-CIM-03` |
| `segments[].steps[]` | `array` | 3–12 phần tử, có thứ tự — `BR-CIM-03` |
| `segments[].is_review` | `boolean` | Mặc định `false`. Phân đoạn cuối BẮT BUỘC `true` — `BR-CIM-18` |
| `narration` | `object` | Mẫu câu mặc định cho từng hành động, mục 7.3 |
| `requires_reintro` | `boolean` | Mặc định `false`. `true` thì lần publish này bắt trẻ chạy lại |

### 7.2 Một asset — chung cho cả ba loại

| Field | Kiểu | Ràng buộc |
|---|---|---|
| `asset_id` | `string` | Duy nhất trong bài |
| `kind` | `glyph \| word \| image` | Trục đóng — `BR-CIM-16` |
| `label` | `string` | Tiếng Việt, đọc lên được — `BR-CIM-04` |
| `audio_path` | `string?` | Thiếu thì runner dùng TTS `vi-VN` |
| `contrast_group` | `string` | Chất liệu cùng nhóm chỉ khác nhau một chiều — `BR-CIM-05` |
| `glyph` | `string?` | Bắt buộc khi `kind = 'glyph'`. Ký tự, chữ số, hoặc dấu |
| `text` | `string?` | Bắt buộc khi `kind = 'word'`. Mặt chữ của từ |
| `syllables` | `string[]?` | Chỉ với `kind = 'word'`. Tách âm tiết để runner đọc chậm từng tiếng |
| `image` | `{ kind, ref }?` | Bắt buộc khi `kind = 'image'`. `kind ∈ emoji \| image \| shape`; emoji phải trong registry — `BR-CIM-12` |

### 7.3 Bốn hành động — workflow chung

| `action` | Trẻ làm gì | Field riêng | Sai được không |
|---|---|---|---|
| `present` | Nghe và nhìn một chất liệu, chạm để đi tiếp | — | Không có đáp án để sai |
| `recognise` | Chạm đúng chất liệu trong 2–4 lựa chọn | `distractor_asset_ids[]` — cùng `contrast_group` (`BR-CIM-05`) | Sai thì nhắc lại `present` của chính target rồi hỏi lại |
| `link` | Ghép hai chất liệu khác loại: ký tự ↔ hình, từ ↔ hình | `source_asset_id` | Như `recognise` |
| `recall` | Nghe tên, chạm tên đúng | `option_asset_ids[]` — 2–4 mã chất liệu | Sai vẫn đi tiếp; kết quả là tín hiệu, không phải cửa |

Mọi step dùng chung hai field: `action` và `target_asset_id`. Tên trường ở đây là tên **trong
mã nguồn** `template.ts`, không phải tên rút gọn — corpus và spec dùng chung một bộ tên thì
không có chỗ cho drift.

Lời dẫn của một step lấy theo thứ tự: `narration_line` (với `present`) hoặc `prompt_line`
(với ba hành động còn lại) nếu người soạn khai riêng; không khai thì lấy mẫu câu tương ứng
trong khối `narration`; không có nữa thì runner dùng câu mặc định của engine.

**Workflow mặc định** mà bộ chiếu dựng khi người soạn không khai `segments`: cắt dãy giá trị
của chủ đề thành các phân đoạn 3–4 giá trị theo đúng thứ tự, rồi dựng trong mỗi phân đoạn:

```
present(mọi chất liệu của phân đoạn, theo thứ tự khai)
  → link(mỗi cặp word↔image trong phân đoạn)
  → recognise(mọi chất liệu của phân đoạn)
  → recall(mọi chất liệu của phân đoạn)
```

Rồi thêm **một phân đoạn ôn** ở cuối, gồm `recognise` và `recall` trên mọi giá trị của chủ đề.

Người soạn được xen kẽ khác đi — dạy xong ký tự thì hỏi ngay ký tự, rồi mới sang từ — miễn
là giữ `BR-CIM-14`: mỗi asset phải được `present` trước khi bị hỏi. Cấm — **NEVER** để bộ
chiếu dừng ở hai giá trị đầu của dataset rồi coi là xong chủ đề (`BR-PRE-09`).

### 7.4 Ví dụ — chủ đề `C5.PHO`, âm /m/ qua cả ba loại chất liệu

```json
{
  "concept": { "pre_skill_code": "C5.PHO.04", "label": "âm mờ" },
  "assets": [
    { "asset_id": "g_m",  "kind": "glyph", "label": "chữ mờ", "glyph": "m", "contrast_group": "phu_am_moi" },
    { "asset_id": "g_n",  "kind": "glyph", "label": "chữ nờ", "glyph": "n", "contrast_group": "phu_am_moi" },
    { "asset_id": "i_me", "kind": "image", "label": "mẹ", "image": { "kind": "emoji", "ref": "👩" }, "contrast_group": "nguoi_than" },
    { "asset_id": "w_me", "kind": "word",  "label": "mẹ", "text": "mẹ", "syllables": ["mẹ"], "contrast_group": "tu_am_m" }
  ],
  "segments": [
    {
      "segment_id": "seg_glyph",
      "asset_ids": ["g_m", "g_n"],
      "steps": [
        { "action": "present",   "target_asset_id": "g_m" },
        { "action": "present",   "target_asset_id": "g_n" },
        { "action": "recognise", "target_asset_id": "g_m", "distractor_asset_ids": ["g_n"] },
        { "action": "recall",    "target_asset_id": "g_m", "option_asset_ids": ["g_m", "g_n"] }
      ]
    },
    {
      "segment_id": "seg_word",
      "asset_ids": ["i_me", "w_me"],
      "steps": [
        { "action": "present", "target_asset_id": "i_me" },
        { "action": "present", "target_asset_id": "w_me" },
        { "action": "link",    "target_asset_id": "w_me", "source_asset_id": "i_me" },
        { "action": "recall",  "target_asset_id": "w_me", "option_asset_ids": ["w_me", "g_n"] }
      ]
    },
    {
      "segment_id": "seg_review",
      "is_review": true,
      "asset_ids": ["g_m", "g_n", "i_me", "w_me"],
      "steps": [
        { "action": "recognise", "target_asset_id": "g_m",  "distractor_asset_ids": ["g_n"] },
        { "action": "recall",    "target_asset_id": "w_me", "option_asset_ids": ["w_me", "i_me"] },
        { "action": "recall",    "target_asset_id": "g_n",  "option_asset_ids": ["g_n", "g_m"] }
      ]
    }
  ],
  "narration": {
    "present": "Đây là {label}",
    "recognise": "Chỉ cho cô {label}",
    "link": "Từ này là của hình nào?",
    "recall": "Đây là gì?"
  },
  "requires_reintro": false
}
```

`g_m` và `g_n` chỉ khác nhau ở **một nét chữ** — đó là `BR-CIM-05` trong thực tế. `w_me` có
`i_me` neo nghĩa và có step `link` nối hai thứ — đó là `BR-CIM-17`. Phân đoạn thứ ba là phân
đoạn ôn: nó không dạy gì mới, nó đặt cả bốn chất liệu cạnh nhau — đó là `BR-CIM-18`.

### 7.5 Điều kiện "chủ đề đã có bài làm quen"

Một chủ đề được coi là **đã phủ** khi tồn tại một `game_levels` thoả cả bốn:

| # | Điều kiện |
|---|---|
| 1 | `template_code = 'GT-000'` |
| 2 | `status = 'published'` |
| 3 | `content_pack.concept.pre_skill_code` bằng đúng mã kỹ năng bậc `pre` của chủ đề |
| 4 | `access_tier` ≤ tier thấp nhất của các level thuộc kỹ năng mà chủ đề dạy (`BR-CIM-11`) |

Đợt 1 là **5 chủ đề**, liệt kê ở [`concept-pre-skill.md`](concept-pre-skill.md) mục 7.3.
Cầu đầy đủ chưa chốt: nó phụ thuộc thời lượng thật của một chủ đề, đo được sau đợt 1 — câu 3
mục 11 của file đó. Cổng bậc thang ở
[`concept-intro-gate.md`](../04-play/concept-intro-gate.md) mục 7.4 giữ con số thiếu chỉ đi xuống.

### 7.6 Checklist người duyệt

1. Nghe hết một lượt **với loa bật** — có câu nào chỉ đọc được bằng mắt không?
2. Chạy `steps` của từng phân đoạn từ trên xuống — có asset nào bị hỏi trước khi được giới thiệu không?
3. Distractor có nằm cùng `contrast_group` với target không?
4. Bài có từ khoá học thì có hình neo nghĩa và step `link` không?
5. Bấm hết **một phân đoạn** mất bao lâu? Trên 120 giây thì cắt phân đoạn làm đôi, không cắt `present`.
6. Mặt chữ có hiện không, và có bắt trẻ đọc nó để đi tiếp không?
7. Đếm giá trị: bài có dạy **đủ** mọi giá trị của chủ đề không, hay dừng ở vài giá trị đầu?
8. Phân đoạn cuối có ôn lại **mọi** giá trị đã dạy không, hay chỉ ôn phân đoạn ngay trước nó?

## 8. API contract

Không sở hữu route. Bài làm quen đi qua đúng những route mà một level đi qua:
[`game-config-delivery.md`](../04-play/game-config-delivery.md) và
[`content-lifecycle.md`](../00-foundation/content-lifecycle.md). Ràng buộc mục 6 ép ở cổng
publish.

## 9. Acceptance criteria

```gherkin
Scenario: BR-CIM-02 — bài làm quen gắn hai chủ đề thì không publish được
  Given một level GT-000 có content_pack khai hai pre_skill_code
  When gửi publish
  Then trả 422
  And lý do nêu bài làm quen chỉ được gắn một chủ đề

Scenario: BR-CIM-03 — phân đoạn quá 12 hành động thì bị từ chối
  Given một level GT-000 có một phân đoạn với 13 step
  When gửi publish
  Then trả 422
  And lý do nêu trần hành động mỗi phân đoạn là 12

Scenario: BR-CIM-03 — bài quá 21 chất liệu thì bị từ chối
  Given một level GT-000 có 22 chất liệu phân biệt
  When gửi publish
  Then trả 422
  And lý do nêu trần chất liệu mỗi bài là 21

Scenario: BR-CIM-04 — chất liệu thiếu tên nói được
  Given một asset không có field label
  When gửi publish
  Then trả 422
  And lý do nêu chất liệu không dạy được bằng kênh tai

Scenario: BR-CIM-05 — distractor ngoài nhóm tương phản
  Given một step recognise có distractor khác contrast_group với target
  When gửi publish
  Then trả 422

Scenario: BR-CIM-14 — hỏi một chất liệu chưa giới thiệu
  Given steps có recognise trên asset g_m mà không có present g_m đứng trước
  When gửi publish
  Then trả 422
  And lý do nêu chất liệu bị hỏi trước khi được giới thiệu

Scenario: BR-CIM-15 — step nhúng nội dung thẳng thay vì trỏ asset_id
  Given một step khai label và image ngay trong step
  When gửi publish
  Then trả 422

Scenario: BR-CIM-16 — loại chất liệu ngoài ba loại
  Given một asset khai kind = "video"
  When gửi publish
  Then trả 422

Scenario: BR-CIM-17 — từ khoá học không có hình neo nghĩa
  Given bài có asset kind = word nhưng không có asset kind = image
  When gửi publish
  Then trả 422

Scenario: BR-CIM-18 — phân đoạn không kết bằng recall
  Given một phân đoạn chỉ có present và recognise
  When gửi publish
  Then trả 422

Scenario: BR-CIM-18 — bài không có phân đoạn ôn ở cuối
  Given một level GT-000 có ba phân đoạn và không phân đoạn nào is_review
  When gửi publish
  Then trả 422
  And lý do nêu phân đoạn cuối phải ôn mọi giá trị đã dạy

Scenario: BR-CIM-07 — mặt chữ không được là điều kiện đi tiếp
  When đọc mọi bài làm quen published
  Then không bài nào yêu cầu trẻ đọc glyph hay text để sang step sau

Scenario: BR-CIM-08 — không có điểm
  When đọc scoring của mọi level GT-000
  Then mọi bản đều là none
  And không bản nào khai sao hay đồng hồ

Scenario: BR-CIM-10 — không xin micro
  When quét toàn bộ nguồn của GT-000
  Then không có lời gọi getUserMedia nào

Scenario: BR-CIM-11 — tier không cao hơn game của cùng chủ đề
  Given kỹ năng C1.NREC.03 có một level free
  And bài làm quen của nó khai access_tier = premium
  When chạy cổng publish
  Then trả 422

Scenario: BR-CIM-13 — hai bài làm quen cùng publish cho một chủ đề
  Given C1.NREC.14 đã có một bài làm quen published
  When publish bài thứ hai cho cùng kỹ năng bậc pre đó
  Then trả 409
```

## 10. Boundaries

**Always**
- Soạn bài làm quen bằng đúng đường soạn level: seeder hoặc studio, qua `content-lifecycle`.
- Đọc to bài lên khi duyệt. Bài không nghe được là bài không dạy được.
- Giới thiệu một chất liệu trước khi hỏi nó, kể cả khi thấy thừa.
- Trỏ chất liệu bằng `asset_id`, luôn luôn.

**Ask first**
- Đổi trần 120 giây mỗi phân đoạn của `BR-CIM-06`, hoặc trần 12 step mỗi phân đoạn của `BR-CIM-03`.
- Nới trần 21 chất liệu mỗi bài.
- Thêm loại chất liệu thứ tư ngoài `glyph | word | image`.
- Thêm hành động thứ năm ngoài `present | recognise | link | recall`.
- Chốt cầu soạn đầy đủ sau khi đợt 1 đo được thời lượng thật của một chủ đề.

**Never**
- Cấm — **NEVER** thu, xin quyền, hay lưu giọng trẻ.
- Cấm — **NEVER** thêm điểm, sao, đồng hồ, hay trạng thái thua vào bài làm quen.
- Cấm — **NEVER** hỏi một chất liệu chưa được giới thiệu trong cùng bài.
- Cấm — **NEVER** dựng entity nội dung riêng song song với `game_levels`.
- Cấm — **NEVER** để bài làm quen có tier cao hơn trò chơi mà nó đứng chắn.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Gắn theo skill (230 bài) hay theo strand (71 bài)?~~ **Đóng 2026-09-02 (Task #206)**: Chốt gắn theo **Strand** cho giai đoạn ban đầu để tinh gọn chi phí và đảm bảo độ phủ nhanh. Cầu thật là **41 bài** — số strand đang có nội dung game (mục 7.5); 71 là tổng strand của taxonomy, 30 trong đó chưa có level nào. | — | Đã đóng | Người quyết |
| 2 | `syllables` có cần cho tiếng Việt đa âm tiết, hay tách âm tiết là việc của runner? | Hình dạng asset `word` | P4 | Nội dung |
| ~~3~~ | ~~Strand rộng (trên 10 kỹ năng, ví dụ `C1.NREC` có 12) có phủ nổi bằng 12 hành động không, hay phải tách theo band tuổi?~~ **Đóng 2026-09-05**: không phủ nổi. `C1.NREC` trải ba dải số 0–5, 0–10, 11–20 — 21 giá trị. Tách theo **chủ đề**, không theo band tuổi; đơn vị gắn đổi từ strand sang kỹ năng bậc `pre`, xem [`concept-pre-skill.md`](concept-pre-skill.md). | — | Đã đóng | người quyết |
| 4 | Giọng thu sẵn thay TTS ở mốc nào? | Ngân sách audio | P5 | hoãn — mở lại khi `audio-storage.md` P2 chạy |
