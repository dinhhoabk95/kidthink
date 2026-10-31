---
spec: MONTESSORI-CHANG-00-INTRO
title: Chặng 0: Khởi Hành — Đường Ray Sau Cầu Vồng & Vương Quốc Số
area: content
status: draft
mvp: true
phase: P1
reviewed: 2026-10-29
stage: chang-00-intro
workbook_ref: WB00
owns:
  - Phân tích sư phạm và giải mã 4 trang PDF Chặng 0 (A - Giới thiệu.pdf)
  - Ánh xạ 4 dạng bài mở đầu (WB00-D1..D4) vào các game engine hiện tại GT-000, GT-001, GT-008
  - Thiết kế SkillDataset (items, relations, phrasing) tích hợp cốt truyện Chuyến Tàu Toán Học
  - Thiết kế SkillLevelPlan[] chuẩn GL-<COMP>-<STRAND>-<MECH>-01xx
  - Kiến trúc World Map Hub & Tiến trình Gamification 20 Mảnh Đường Ray Ánh Sáng
depends_on:
  - MONTESSORI-CORPUS-MAPPING
  - ACTIVITY-TYPES-TABLE
  - ENGINE-SPEC-SHEET
  - GAME-TEMPLATE-CONTRACT
---

# Chặng 0: Khởi Hành — Đường Ray Sau Cầu Vồng & Vương Quốc Số

## 1. Objective (Mục tiêu cốt lõi)

Tài liệu này sở hữu đặc tả kỹ thuật và sư phạm nhằm tích hợp dữ liệu trích xuất từ tài liệu PDF mở đầu **"Chặng 0: Khởi Hành — Đường Ray Sau Cầu Vồng & Vương Quốc Số"** (`docs/montessori/extracted/chang-00-intro/analysis.json`, nguồn: *A - Giới thiệu.pdf*, 4 trang, bộ sách *Gấu Logic & Thỏ Quan Sát - Chuyến Tàu Toán Học*, Montessori VN) vào nền tảng **TiniMath v2**.

### Mục tiêu chiến lược:
1. **Thiết lập Vũ trụ Cốt truyện (Narrative Universe) & Động lực Nội tại**:
   - Giới thiệu bối cảnh kỳ diệu: Cây Cầu Vồng (Rainbow Tree), Cánh Cổng Ánh Sáng, Đường ray vàng lấp lánh và Chuyến Tàu Toán Học.
   - Thiết lập biến cố khởi đầu: Cơn Bão Lộn Xộn bất ngờ quét qua làm vỡ nát Đường Ray Ánh Sáng thành 20 mảnh và xáo trộn toàn bộ số lượng, hình khối, trật tự tại Vương quốc Số.
   - Nhiệm vụ học tập (Learning Quest): Bé đồng hành cùng Gấu Logic và Thỏ Quan Sát thu thập đủ 20 Mảnh Đường Ray Ánh Sáng qua 20 chặng thử thách để khôi phục lại trật tự cho vương quốc.
2. **Khai thác triệt để các Game Engine hiện hữu (`GT-000`..`GT-037`)**:
   - **TUYỆT ĐỐI KHÔNG TẠO MỚI `GT-038+`**.
   - Phân giải 4 trang PDF thành 4 dạng bài chuẩn (`WB00-D1`..`WB00-D4`) tương thích 100% với các khuôn đã có:
     - `GT-000` (concept-intro / Bài học 3 bước Montessori): Giới thiệu câu chuyện, nhân vật và phong thư cứu viện.
     - `GT-001` (tap-select): Phát hiện lỗi bất tương thích Số - Lượng (Số 2 đi cùng 3 quả táo) và nhận diện các khối 3D ngổn ngang.
     - `GT-008` (drag-to-slot): Kéo thả số 1–5 vào các bục đá bị đảo lộn theo đúng thứ tự tuyến tính.
3. **Phổ biến kho ngữ liệu `SkillDataset` & `SkillLevelPlan[]`**:
   - Bổ sung vật phẩm (`items`) và câu thoại (`phrasing`) của Gấu Logic & Thỏ Quan Sát vào các seeder kỹ năng hiện có trong `packages/content/src/skills/c1/` và `c2/`.
   - Cấp mã level chuẩn `GL-<COMP>-<STRAND>-<MECH>-01xx` (sequence $\ge 0101$), gắn nhãn `montessori_ref: "WB00-D<n>"`, phân bổ `access_tier` khớp `difficulty` (1: `free`, 2: `login`), tuân thủ nghiêm ngặt `BR-MCM-06` (không chứa từ khóa thương mại IQ/Raven/trí tuệ).
4. **Kiến trúc Bản đồ Hành trình (World Map Hub) & Gamification Tracker**:
   - Định hình cơ chế tiến trình: 20 Mảnh Đường Ray Ánh Sáng tương ứng với 20 chặng chơi tiếp nối (Chặng 1 đến Chặng 20).

---

## 2. Actors & Pedagogical Roles

| Tác nhân / Nhân vật | Vai trò hệ thống | Vai trò sư phạm & Đặc điểm nhận diện |
|---|---|---|
| **Bé (Kid Player)** | Người chơi chính (3–6 tuổi) | Nhập vai hiệp sĩ nhỏ bước lên Chuyến Tàu Toán Học, trực tiếp tương tác chạm, kéo thả, thu thập các mảnh đường ray ánh sáng để cứu vương quốc. |
| **Gấu Logic (`gau_logic`)** | Nhân vật đồng hành (Scaffolding Guide) | Đại diện tư duy phân tích (bán cầu não trái), điềm tĩnh, yêu thích trật tự, lý thuyết số. Ngoại hình: Gấu nâu tròn trĩnh, kính cận tròn màu xanh dương, áo gile xanh có cúc vàng, bảng tính hạt. Thường đặt câu hỏi định hướng logic (*"Đường ray này dẫn đến đâu nhỉ?", "Các con số và đồ vật đều bị xáo trộn!", "Mỗi vùng đất đang giữ một mảnh đường ray."*). |
| **Thỏ Quan Sát (`tho_quan_sat`)** | Nhân vật đồng hành (Sensory Observer) | Đại diện tư duy trực quan & thị giác không gian (bán cầu não phải), nhanh nhẹn, tò mò, giàu năng lượng. Ngoại hình: Thỏ trắng hoạt bát, tai dài viền hồng, kính lúp thám tử viền vàng cam cán đỏ, túi da chéo. Lời thoại cổ vũ, thúc giục hành động (*"Nhìn kìa! Một cánh cổng đang mở ra!", "Chúng ta lên đường thôi!", "Bé hãy nhìn thật kỹ và giúp chúng mình nhé!", "Chúng ta phải tìm đủ 20 mảnh!"*). |
| **Phụ huynh / Giáo viên** | Người đồng hành ngoài màn hình | Hướng dẫn theo mô hình 4 bước: Khơi gợi $\rightarrow$ Khám phá $\rightarrow$ Giải quyết $\rightarrow$ Khen ngợi nỗ lực (`analysis.json:97`). |
| **Content Seeder Engine** | Hệ thống tự động | Chuyển hóa `SkillLevelPlan[]` thành `ContentSeed` hợp lệ, xác thực qua bộ cổng kiểm thử `montessori-gate.ts`. |

---

## 3. Entry Points & File Mapping

```
docs/montessori/extracted/chang-00-intro/analysis.json
   │
   ├──> docs/montessori/dataset/activity-types-table.md  (Thêm WB00-D1..D4)
   ├──> docs/specs/05-content/montessori-corpus-mapping.md (Thêm hàng WB00)
   │
   ├──> packages/content/src/skills/c1/nrec/C1.NREC.01.ts (WB00-D1 -> GT-000: GL-C1-NREC-INTRO-0101)
   ├──> packages/content/src/skills/c1/oto/C1.OTO.01.ts   (WB00-D2 -> GT-001: GL-C1-OTO-TAP-0101)
   ├──> packages/content/src/skills/c1/nrec/C1.NREC.09.ts (WB00-D3 -> GT-008: GL-C1-NREC-SLOT-0101)
   └──> packages/content/src/skills/c2/sol/C2.SOL.01.ts   (WB00-D4 -> GT-001: GL-C2-SOL-TAP-0101)
```

- **Mã nguồn Engine sử dụng**:
  - `packages/game-engine/src/templates/GT-000/` (`GT000Session` — Concept Introduction / 3-Period Lesson).
  - `packages/game-engine/src/templates/GT-001/` (`TapSelectSession` — Single Choice Tap Select).
  - `packages/game-engine/src/templates/GT-008/` (`DragToSlotSession` — Drag and Drop to Target Slots).
- **Phạm vi kiểm thử & Xác thực**:
  - `packages/content-build/src/gates/montessori-gate.ts`.
  - `packages/content-build/tests/gates/montessori-corpus.test.ts`.

---

## 4. Main Flow: Kịch Bản 4 Trang PDF Chặng 0

Quy trình trải nghiệm số hóa của Chặng 0 chuyển tải trọn vẹn 4 trang PDF qua 4 phân đoạn tương tác:

### Phân đoạn 1: Trang 1 — Đường Ray Sau Cầu Vồng (`WB00-D1.1`)
1. Màn hình Canvas 2D mở ra khung cảnh Cây Cầu Vồng (Rainbow Tree) cổ thụ rực rỡ với trái tim vàng phát sáng giữa thân cây.
2. Một tia sáng lấp lánh phóng ra từ gốc cây, biến thành dải đường ray bằng vàng uốn lượn qua bãi cỏ hoa rực rỡ.
3. Gấu Logic và Thỏ Quan Sát xuất hiện bên đường ray.
4. Lồng tiếng tự động:
   - Gấu Logic: *"Đường ray này dẫn đến đâu nhỉ?"*
   - Thỏ Quan Sát: *"Nhìn kìa! Một cánh cổng đang mở ra!"*
5. Trẻ chạm vào Cây Cầu Vồng để phát hiệu ứng chuông gió ma thuật (`magic_sparkle.mp3`), chạm vào cánh cổng vòm cầu vồng để mở ra luồng sáng chuyển cảnh.

### Phân đoạn 2: Trang 2 — Lá Thư Từ Vương Quốc Số (`WB00-D1.2`)
1. Phong thư hoàng gia màu vàng kim lơ lửng giữa màn hình, mang dấu niêm phong hoàng gia.
2. Gấu Logic mở bức thư, luồng bụi phép màu vàng phát ra cùng các con số tí hon (1, 3, 5, 9, dấu `?`) bay lượn xung quanh.
3. Giọng đọc truyền cảm đọc nội dung bức thư:
   *"Vương quốc Số đang gặp nguy hiểm! Cơn Bão Lộn Xộn đã cuốn mất 20 mảnh Đường Ray Ánh Sáng. Xin hãy giúp chúng tôi!"*
4. Thỏ Quan Sát giơ kính lúp hào hứng thốt lên: *"Chúng ta lên đường thôi!"*.
5. Nút chạm "Khám phá Vương Quốc Số" phát sáng mời gọi trẻ bước tiếp.

### Phân đoạn 3: Trang 3 — Vương Quốc Bị Đảo Lộn (`WB00-D2`, `WB00-D3`, `WB00-D4`)
1. Đoàn tàu tiến vào Vương quốc Số. Toàn bộ cảnh vật rơi vào trạng thái đảo lộn hỗn loạn:
   - Gấu Logic chỉ tay: *"Các con số và đồ vật đều bị xáo trộn!"*
   - Thỏ Quan Sát cầm kính lúp: *"Bé hãy nhìn thật kỹ và giúp chúng mình nhé!"*
2. **Thử thách 1 (`WB00-D3` - `GT-008`)**:
   - 5 bục đá tròn xếp ngang trên đường ray. Các con số 1, 2, 3, 4, 5 bị bão cuốn bay lệch vị trí (1, 3, 5, 4, 2).
   - Bé kéo thả các viên số 1, 2, 3, 4, 5 vào 5 bục đá theo đúng trật tự $1 \rightarrow 2 \rightarrow 3 \rightarrow 4 \rightarrow 5$. Khi xong, dãy bục bừng sáng vàng óng.
3. **Thử thách 2 (`WB00-D2` - `GT-001`)**:
   - Tại bục số 2 màu xanh lá cây, Thỏ Quan Sát soi kính lúp phát hiện có 3 quả táo đỏ mọng: *"Ủa, số 2 mà lại có 3 quả táo kìa!"*.
   - Bé chạm vào đĩa có đúng 2 quả táo đỏ (hoặc chạm chọn số 2 tương ứng) để sửa lại lỗi tương ứng 1-1. Đĩa táo phát ra âm thanh nảy pop vui tai.
4. **Thử thách 3 (`WB00-D4` - `GT-001`)**:
   - Dưới chân bục đá, ba khối hình 3D nằm ngổn ngang: Khối lập phương xanh lam (`cube`), Khối cầu tím (`sphere`), Khối hình trụ vàng (`cylinder`).
   - Gấu Logic yêu cầu: *"Bé hãy tìm khối lập phương màu xanh lam giúp chúng mình nhé!"*. Bé chạm đúng khối lập phương để thu dọn vào hòm đồ nghề.

### Phân đoạn 4: Trang 4 — 20 Mảnh Đường Ray Ánh Sáng & Bản Đồ Hành Trình (`WB00-Progress`)
1. Đầu tàu hơi nước Chuyến Tàu Toán Học bằng kim loại bóng bẩy xuất hiện, sao vàng 5 cánh ở mũi tàu xoay nhẹ, còi tàu hụ vang *"Tu tu xình xịch!"*.
2. Tấm bản đồ da cuộn khổng lồ trải rộng, thể hiện 20 vùng đất của Vương quốc Số uốn lượn từ Ga số 1 đến Trạm cuối cùng.
3. Con số 20 khổng lồ phát sáng giữa bản đồ cùng 20 ô rãnh đường ray ánh sáng đang chờ được lắp ghép.
4. Banner chỉ dẫn vang lên: *"Hoàn thành một thử thách, bé sẽ nhận được một mảnh Đường Ray Ánh Sáng!"*.
5. Gấu Logic: *"Mỗi vùng đất đang giữ một mảnh đường ray."*
6. Thỏ Quan Sát: *"Chúng ta phải tìm đủ 20 mảnh!"*
7. Mảnh đường ray đầu tiên phát sáng dẫn lối vào Chặng 1: Ga Những Con Số Thức Giấc.

---

## 5. Alternative Flows & Xử Lý Biên

| # | Tình huống / Biên | Phản hồi của hệ thống | Sư phạm Montessori |
|---|---|---|---|
| 1 | Trẻ chần chừ không thao tác sau 10 giây | Tự động kích hoạt Scaffolding Cấp 1 (L1 - Nudge): Viền đối tượng cần tương tác (phong thư, số cần kéo, khối hình) nhấp nháy ánh vàng dịu (`amberGlow`). | Scaffolding tự động leo thang không cần trẻ yêu cầu. |
| 2 | Trẻ dừng lại sau 18–25 giây | Scaffolding Cấp 2 (L2 - Guide): Thỏ Quan Sát giơ kính lúp soi vào đối tượng hoặc Bàn tay ma (`ghostHand`) xuất hiện trỏ vào mục tiêu. | Gợi ý trực quan không phán xét. |
| 3 | Trẻ kéo thả sai vị trí bục số (`GT-008`) | Bục đá phát xung nhịp thở hổ phách dịu (`amber_soft`, 340ms). Số trôi êm ái về vị trí cũ trong khay. Tuyệt đối KHÔNG có dấu X đỏ, KHÔNG có tiếng còi buzzer lỗi, KHÔNG trừ điểm. | Kiểm soát lỗi tự thân (Control of Error). |
| 4 | Trẻ chạm nhầm quả táo / khối hình sai (`GT-001`) | Đối tượng chạm sai phát nhịp rung nhẹ 200ms, giọng Thỏ Quan Sát nhắc nhẹ: *"Bé hãy nhìn kỹ lại số lượng quả táo nhé!"*. | Phản hồi dịu dàng, khích lệ tự sửa sai. |
| 5 | Trẻ bấm vào màn hình liên tục không chủ đích | Hệ thống áp dụng debounce chạm 300ms, bỏ qua cử chỉ đa điểm (multi-touch), giữ vững trạng thái của Canvas 2D. | Bảo vệ trải nghiệm cho trẻ mầm non. |
| 6 | Bật chế độ giảm chuyển động (`prefers-reduced-motion`) | Tắt toàn bộ hiệu ứng rung nảy, xoay 3D; chuyển các hoạt cảnh mở cổng, bay số thành hiệu ứng mờ chồng (cross-fade 200ms). | Đảm bảo tính tiếp cận (Accessibility WCAG AA). |

---

## 6. Business Rules & Sư Phạm Bất Biến

| Mã Rule | Tên quy tắc | Nội dung & Lý do cưỡng chế |
|---|---|---|
| `BR-ENG-FIXED` | **Không tạo mới `GT-038+`** | Tuyệt đối chỉ sử dụng các game engine đã được đăng ký chính thức trong hệ thống (`GT-000`..`GT-037`). Mọi biến thể tương tác của Chặng 0 được phổ biến vào `GT-000`, `GT-001`, `GT-008`. |
| `BR-MCM-06` | **Cấm từ khóa thương mại & đo trí tuệ** | Cấm — **NEVER dùng các từ "IQ", "Raven", "trí tuệ", "chỉ số thông minh", "WISC", "Stanford-Binet"**. Cụm từ "Căn phòng IQ bí mật" trong PDF gốc bắt buộc phải đổi thành "Phòng Thử Thách Vinh Danh" hoặc "Căn Phòng Thử Thách Về Đích". |
| `BR-MGL-02` | **Khối mã số thứ tự dành riêng Montessori** | Mọi mã game level Montessori sử dụng số thứ tự từ `0101` trở lên: `GL-<COMP>-<STRAND>-<MECH>-01xx`. Mã dạng bài `montessori_ref` là duy nhất (`WB00-D1`..`WB00-D4`). |
| `BR-MGL-12` | **Access Tier khớp chặt chẽ Độ khó** | Mức độ khó `difficulty: 1` $\rightarrow$ `access_tier: "free"`; `difficulty: 2` $\rightarrow$ `access_tier: "login"`; `difficulty: 3` $\rightarrow$ `access_tier: "standard"`; `difficulty: 4/5` $\rightarrow$ `access_tier: "premium"`. |
| `BR-MCM-13` | **Cô lập một thuộc tính (Isolation of Property)** | Mỗi thử thách chỉ biến thiên một chiều nhận thức: `WB00-D2` cô lập số lượng đối chiếu; `WB00-D3` cô lập thứ tự vị trí; `WB00-D4` cô lập hình dạng khối 3D. |
| `BR-MCM-15` | **Thứ tự nhận thức CPA** | Tiến trình đi từ vật phẩm cụ thể (quả táo, khối gỗ 3D, bục đá) $\rightarrow$ hình ảnh trực quan $\rightarrow$ ký hiệu chữ số trừu tượng (1, 2, 3, 4, 5). |
| `BR-MLS-07` | **Không giả định trẻ biết đọc** | 100% chỉ dẫn và lời thoại nhân vật phải có audio lồng tiếng chuẩn tiếng Việt; trên màn hình có biểu tượng hình ảnh minh họa tương ứng. |
| `BR-E001-04` | **Chính xác một đáp án đúng cho `GT-001`** | Mọi round của `GT-001` phải có duy nhất một `is_correct === true` trong `options`. Mồi nhử (distractor) phải phân biệt rõ ràng. |
| `BR-E008-01` | **Tap-tap fallback cho kéo thả `GT-008`** | Vì trẻ 3–4 tuổi gặp khó khăn khi vuốt kéo liên tục, `GT-008` bắt buộc hỗ trợ cơ chế chạm số ở khay rồi chạm bục đá mục tiêu để tự động đưa số vào ô. |

---

## 7. Ma Trận Ánh Xạ Dạng Bài Montessori Chặng 0

Bảng đối chiếu chuẩn hóa 4 dạng bài phát sinh từ Chặng 0 để cập nhật vào `docs/montessori/dataset/activity-types-table.md`:

| Mã dạng bài | Trang PDF | Tên dạng bài | Khuôn hiện hành | Strand | Skill Code | Band | Diff | Tier | Lô | Trạng thái |
|---|:---:|---|:---:|---|---|:---:|:---:|:---:|:---:|:---:|
| `WB00-D1` | Trang 1–2 | Kể chuyện tương tác & Mở màn nhiệm vụ Chuyến Tàu Toán Học | `GT-000` | `C1.NREC` | `C1.NREC.01` | 3–4 | 1 | `free` | A | Nhận (Lô A) |
| `WB00-D2` | Trang 3 | Phát hiện lỗi bất tương thích Số - Lượng: Số 2 vs 3 quả táo | `GT-001` | `C1.OTO` | `C1.OTO.01` | 3–4 | 1 | `free` | A | Nhận (Lô A) |
| `WB00-D3` | Trang 3 | Khôi phục trật tự dãy số 1–5 trên các bục đá bị đảo lộn | `GT-008` | `C1.NREC` | `C1.NREC.09` | 3–4 | 2 | `login` | B | Nhận (Lô B - A1) |
| `WB00-D4` | Trang 3 | Nhận biết & Thu dọn các khối hình 3D ngổn ngang (Lập phương, Cầu, Trụ) | `GT-001` | `C2.SOL` | `C2.SOL.01` | 4–5 | 2 | `login` | A | Nhận (Lô A) |

---

## 8. Thiết Kế SkillDataset Cho Từng Dạng Bài

### 8.1. Dataset cho `WB00-D1` — Kể Chuyện Mở Đầu (`C1.NREC.01`)

```typescript
import type { SkillDataset } from "@mindkid/shared";

export const CHANG_00_PROLOGUE_DATASET: SkillDataset = {
  skill_code: "C1.NREC.01",
  concept_label: "Chuyến Tàu Toán Học — Mở Màn Vương Quốc Số",
  surface: "game",
  items: [
    {
      id: "rainbow_tree",
      label: "Cây Cầu Vồng",
      audio_path: "/audio/voice/montessori/intro/rainbow_tree.mp3",
      image: { kind: "emoji", ref: "🌈" },
      category: { type: "bối cảnh" },
      contrast_group: "story_intro",
    },
    {
      id: "magic_letter",
      label: "Phong thư cứu viện",
      audio_path: "/audio/voice/montessori/intro/magic_letter.mp3",
      image: { kind: "emoji", ref: "✉️" },
      category: { type: "vật phẩm" },
      contrast_group: "story_intro",
    },
    {
      id: "light_rail",
      label: "Đường Ray Ánh Sáng",
      audio_path: "/audio/voice/montessori/intro/light_rail.mp3",
      image: { kind: "emoji", ref: "🛤️" },
      category: { type: "nhiệm vụ" },
      contrast_group: "story_intro",
    },
    {
      id: "bear_logic",
      label: "Gấu Logic",
      audio_path: "/audio/voice/characters/bear_logic_hello.mp3",
      image: { kind: "emoji", ref: "🐻" },
      category: { type: "nhân vật" },
      contrast_group: "characters",
    },
    {
      id: "rabbit_scout",
      label: "Thỏ Quan Sát",
      audio_path: "/audio/voice/characters/rabbit_scout_hello.mp3",
      image: { kind: "emoji", ref: "🐰" },
      category: { type: "nhân vật" },
      contrast_group: "characters",
    },
  ],
  relations: [
    { type: "sequence", source_id: "rainbow_tree", target_id: "magic_letter" },
    { type: "sequence", source_id: "magic_letter", target_id: "light_rail" },
  ],
  ladder: [
    { rung: 1, dimension: "story_stage", description: "Làm quen với Cây Cầu Vồng và hai người bạn" },
    { rung: 2, dimension: "story_stage", description: "Lắng nghe lá thư kêu cứu từ Vương quốc Số" },
    { rung: 3, dimension: "story_stage", description: "Xác nhận mục tiêu thu thập 20 mảnh Đường Ray Ánh Sáng" },
  ],
  phrasing: {
    prompt_template: "Bé hãy cùng Gấu Logic và Thỏ Quan Sát khám phá {label} nhé!",
    narration_template: "Một tia sáng từ Cây Cầu Vồng biến thành đường ray vàng lấp lánh dẫn vào Vương quốc Số.",
  },
  ordering: ["rainbow_tree", "magic_letter", "light_rail", "bear_logic", "rabbit_scout"],
};
```

---

### 8.2. Dataset cho `WB00-D2` — Phát Hiện Lỗi Bất Tương Thích Số - Lượng (`C1.OTO.01`)

```typescript
import type { SkillDataset } from "@mindkid/shared";

export const CHANG_00_APPLES_MISMATCH_DATASET: SkillDataset = {
  skill_code: "C1.OTO.01",
  concept_label: "Sửa Lỗi Số - Lượng (Số 2 và Quả Táo)",
  surface: "game",
  items: [
    {
      id: "plate_2_apples",
      label: "Hai quả táo đỏ",
      value: 2,
      audio_path: "/audio/voice/montessori/intro/two_apples.mp3",
      image: { kind: "emoji", ref: "🍎" },
      category: { type: "đáp án đúng", count: "2" },
      contrast_group: "apple_quantities",
    },
    {
      id: "plate_3_apples",
      label: "Ba quả táo đỏ",
      value: 3,
      audio_path: "/audio/voice/montessori/intro/three_apples.mp3",
      image: { kind: "emoji", ref: "🍎" },
      category: { type: "mồi nhử", count: "3" },
      contrast_group: "apple_quantities",
    },
    {
      id: "plate_1_apple",
      label: "Một quả táo đỏ",
      value: 1,
      audio_path: "/audio/voice/montessori/intro/one_apple.mp3",
      image: { kind: "emoji", ref: "🍎" },
      category: { type: "mồi nhử", count: "1" },
      contrast_group: "apple_quantities",
    },
    {
      id: "plinth_number_2",
      label: "Bục số hai",
      value: 2,
      glyph: "2",
      audio_path: "/audio/voice/common/numbers/2.mp3",
      image: { kind: "emoji", ref: "2️⃣" },
      category: { type: "bục đá" },
      contrast_group: "plinths",
    },
  ],
  relations: [
    { type: "pair", source_id: "plinth_number_2", target_id: "plate_2_apples" },
  ],
  ladder: [
    { rung: 1, dimension: "distractor_count", description: "Phát hiện số 2 tương ứng với 2 quả táo đỏ giữa 2 phương án" },
    { rung: 2, dimension: "distractor_count", description: "Đối chiếu số 2 với 3 phương án đĩa táo (1, 2, 3 quả)" },
  ],
  phrasing: {
    prompt_template: "Bục đá mang số 2. Bé hãy chọn đĩa có đúng 2 quả táo để giúp bạn Thỏ nhé!",
    narration_template: "Thỏ Quan Sát phát hiện số 2 đang đứng cùng 3 quả táo. Chúng mình hãy sửa lại cho đúng nào!",
  },
  ordering: ["plinth_number_2", "plate_2_apples", "plate_3_apples", "plate_1_apple"],
};
```

---

### 8.3. Dataset cho `WB00-D3` — Sắp Xếp Trật Tự Dãy Số 1–5 (`C1.NREC.09`)

```typescript
import type { SkillDataset } from "@mindkid/shared";
import { numeralItem } from "#src/inventories/index";

export const CHANG_00_ORDER_RESTORATION_DATASET: SkillDataset = {
  skill_code: "C1.NREC.09",
  concept_label: "Khôi Phục Trật Tự Bục Số 1–5",
  surface: "game",
  items: [
    numeralItem("num_1", { label: "Số một", value: 1, contrast_group: "plinths_1_5", image: { kind: "emoji", ref: "1️⃣" } }),
    numeralItem("num_2", { label: "Số hai", value: 2, contrast_group: "plinths_1_5", image: { kind: "emoji", ref: "2️⃣" } }),
    numeralItem("num_3", { label: "Số ba", value: 3, contrast_group: "plinths_1_5", image: { kind: "emoji", ref: "3️⃣" } }),
    numeralItem("num_4", { label: "Số bốn", value: 4, contrast_group: "plinths_1_5", image: { kind: "emoji", ref: "4️⃣" } }),
    numeralItem("num_5", { label: "Số năm", value: 5, contrast_group: "plinths_1_5", image: { kind: "emoji", ref: "5️⃣" } }),
  ],
  relations: [
    { type: "sequence", source_id: "num_1", target_id: "num_2" },
    { type: "sequence", source_id: "num_2", target_id: "num_3" },
    { type: "sequence", source_id: "num_3", target_id: "num_4" },
    { type: "sequence", source_id: "num_4", target_id: "num_5" },
  ],
  ladder: [
    { rung: 1, dimension: "slot_count", description: "Điền 2 số còn thiếu trên bục đá (ví dụ 1, _, 3, _, 5)" },
    { rung: 2, dimension: "slot_count", description: "Sắp xếp toàn bộ 5 số 1–5 vào 5 bục đá theo đúng trật tự" },
  ],
  phrasing: {
    prompt_template: "Bão Lộn Xộn làm đảo lộn bục đá! Bé hãy kéo các số về đúng thứ tự từ 1 đến 5 nhé!",
    narration_template: "Gấu Logic nói: Mọi thứ trong vương quốc phải được sắp xếp theo đúng quy luật và trật tự.",
  },
  ordering: ["num_1", "num_2", "num_3", "num_4", "num_5"],
};
```

---

### 8.4. Dataset cho `WB00-D4` — Nhận Biết Khối Hình 3D Ngổn Ngang (`C2.SOL.01`)

```typescript
import type { SkillDataset } from "@mindkid/shared";

export const CHANG_00_SOLIDS_CLEANUP_DATASET: SkillDataset = {
  skill_code: "C2.SOL.01",
  concept_label: "Thu Dọn Khối 3D Vương Quốc Số",
  surface: "game",
  items: [
    {
      id: "cube_blue",
      label: "Khối lập phương màu xanh lam",
      audio_path: "/audio/voice/geometry/cube_blue.mp3",
      image: { kind: "emoji", ref: "🧊" },
      category: { type: "khối lập phương", color: "blue" },
      contrast_group: "3d_solids",
    },
    {
      id: "sphere_purple",
      label: "Khối cầu màu tím",
      audio_path: "/audio/voice/geometry/sphere_purple.mp3",
      image: { kind: "emoji", ref: "🔮" },
      category: { type: "khối cầu", color: "purple" },
      contrast_group: "3d_solids",
    },
    {
      id: "cylinder_gold",
      label: "Khối hình trụ màu vàng",
      audio_path: "/audio/voice/geometry/cylinder_gold.mp3",
      image: { kind: "emoji", ref: "🪵" },
      category: { type: "khối trụ", color: "gold" },
      contrast_group: "3d_solids",
    },
  ],
  ladder: [
    { rung: 1, dimension: "shape_type", description: "Nhận biết khối cầu tròn có thể lăn được" },
    { rung: 2, dimension: "shape_type", description: "Nhận biết khối lập phương có các mặt phẳng vuông vức" },
    { rung: 3, dimension: "shape_type", description: "Phân biệt khối lập phương, khối cầu và khối trụ" },
  ],
  phrasing: {
    prompt_template: "Bé hãy chạm vào {label} để giúp hai bạn cất gọn vào hòm đồ nghề nhé!",
    narration_template: "Mặt đất ngổn ngang ba khối hình học không gian kỳ lạ. Chúng mình cùng nhận biết nào!",
  },
  ordering: ["cube_blue", "sphere_purple", "cylinder_gold"],
};
```

---

## 9. Thiết Kế SkillLevelPlan[] Chi Tiết

Dưới đây là 4 bản kế hoạch level (`SkillLevelPlan`) sẵn sàng tích hợp vào seeder:

### Level 1: `GL-C1-NREC-INTRO-0101` (`WB00-D1`)
- **Mã level**: `GL-C1-NREC-INTRO-0101`
- **Template engine**: `GT-000` (concept-intro)
- **Band tuổi**: `3-4`
- **Độ khó (`difficulty`)**: `1`
- **Nấc truy cập (`access_tier`)**: `free`
- **Chủ đề (`theme`)**: `nature` / `railway`
- **Số vòng (`rounds`)**: 1
- **Montessori Ref**: `WB00-D1`
- **Kỹ năng sở hữu**: `C1.NREC.01`
- **Cấu hình `content_pack` (`GT000ContentSchema`)**:
  ```json
  {
    "assets": [
      { "asset_id": "rainbow_tree", "kind": "glyph", "glyph": "🌈", "label": "Cây Cầu Vồng", "contrast_group": "intro" },
      { "asset_id": "magic_letter", "kind": "glyph", "glyph": "✉️", "label": "Phong Thư", "contrast_group": "intro" },
      { "asset_id": "light_rail", "kind": "glyph", "glyph": "🛤️", "label": "Đường Ray Ánh Sáng", "contrast_group": "intro" }
    ],
    "segments": [
      {
        "segment_id": "seg_intro_prologue",
        "asset_ids": ["rainbow_tree", "magic_letter", "light_rail"],
        "steps": [
          { "action": "present", "target_asset_id": "rainbow_tree", "narration_line": "Một tia sáng từ Cây Cầu Vồng biến thành đường ray vàng lấp lánh dẫn vào Vương quốc Số." },
          { "action": "echo", "target_asset_id": "rainbow_tree", "repeat_count": 1, "prompt_line": "Bé hãy cùng Thỏ Quan Sát gọi to: Cây Cầu Vồng ơi!" },
          { "action": "present", "target_asset_id": "magic_letter", "narration_line": "Bức thư hoàng gia bay tới! Cơn Bão Lộn Xộn đã cuốn mất 20 mảnh Đường Ray Ánh Sáng." },
          { "action": "recognise", "target_asset_id": "light_rail", "distractor_asset_ids": ["rainbow_tree"], "prompt_line": "Bé hãy chỉ vào mảnh Đường Ray Ánh Sáng mà chúng ta cần tìm nhé!" },
          { "action": "recall", "target_asset_id": "magic_letter", "option_asset_ids": ["magic_letter", "rainbow_tree"], "prompt_line": "Vật phẩm nào đã mang lời kêu cứu đến cho chúng mình?" }
        ]
      }
    ]
  }
  ```

---

### Level 2: `GL-C1-OTO-TAP-0101` (`WB00-D2`)
- **Mã level**: `GL-C1-OTO-TAP-0101`
- **Template engine**: `GT-001` (tap-select)
- **Band tuổi**: `3-4`
- **Độ khó (`difficulty`)**: `1`
- **Nấc truy cập (`access_tier`)**: `free`
- **Chủ đề (`theme`)**: `nature`
- **Số vòng (`rounds`)**: 3
- **Montessori Ref**: `WB00-D2`
- **Kỹ năng sở hữu**: `C1.OTO.01`
- **Cấu hình `content_pack` (`GT001ContentSchema`) Round 1**:
  ```json
  {
    "prompt": "Bục đá mang số 2. Bé hãy chọn đĩa có đúng 2 quả táo nhé!",
    "prompt_audio_path": "/audio/voice/montessori/intro/prompt_find_2_apples.mp3",
    "target_item": {
      "item_id": "target_num_2",
      "asset": { "kind": "emoji", "ref": "2️⃣" }
    },
    "options": [
      {
        "item_id": "opt_2_apples",
        "asset": { "kind": "image", "path": "/images/content/apples_2.png" },
        "is_correct": true
      },
      {
        "item_id": "opt_3_apples",
        "asset": { "kind": "image", "path": "/images/content/apples_3.png" },
        "is_correct": false
      },
      {
        "item_id": "opt_1_apple",
        "asset": { "kind": "image", "path": "/images/content/apples_1.png" },
        "is_correct": false
      }
    ]
  }
  ```

---

### Level 3: `GL-C1-NREC-SLOT-0101` (`WB00-D3`)
- **Mã level**: `GL-C1-NREC-SLOT-0101`
- **Template engine**: `GT-008` (drag-to-slot)
- **Band tuổi**: `3-4`
- **Độ khó (`difficulty`)**: `2`
- **Nấc truy cập (`access_tier`)**: `login`
- **Chủ đề (`theme`)**: `railway`
- **Số vòng (`rounds`)**: 2
- **Montessori Ref**: `WB00-D3`
- **Kỹ năng sở hữu**: `C1.NREC.09`
- **Cấu hình `content_pack` (`GT008ContentSchema`) Round 1**:
  ```json
  {
    "prompt": "Bé hãy kéo các con số vào 5 bục đá theo đúng thứ tự từ 1 đến 5 nhé!",
    "prompt_audio_path": "/audio/voice/montessori/intro/prompt_order_1_5.mp3",
    "slots": [
      { "slot_id": "slot_plinth_1", "label": "Bục thứ nhất", "expected_item_id": "item_num_1" },
      { "slot_id": "slot_plinth_2", "label": "Bục thứ hai", "expected_item_id": "item_num_2" },
      { "slot_id": "slot_plinth_3", "label": "Bục thứ ba", "expected_item_id": "item_num_3" },
      { "slot_id": "slot_plinth_4", "label": "Bục thứ tư", "expected_item_id": "item_num_4" },
      { "slot_id": "slot_plinth_5", "label": "Bục thứ năm", "expected_item_id": "item_num_5" }
    ],
    "items": [
      { "item_id": "item_num_1", "label": "Số một", "asset": { "kind": "emoji", "ref": "1️⃣" } },
      { "item_id": "item_num_2", "label": "Số hai", "asset": { "kind": "emoji", "ref": "2️⃣" } },
      { "item_id": "item_num_3", "label": "Số ba", "asset": { "kind": "emoji", "ref": "3️⃣" } },
      { "item_id": "item_num_4", "label": "Số bốn", "asset": { "kind": "emoji", "ref": "4️⃣" } },
      { "item_id": "item_num_5", "label": "Số năm", "asset": { "kind": "emoji", "ref": "5️⃣" } }
    ]
  }
  ```

---

### Level 4: `GL-C2-SOL-TAP-0101` (`WB00-D4`)
- **Mã level**: `GL-C2-SOL-TAP-0101`
- **Template engine**: `GT-001` (tap-select)
- **Band tuổi**: `4-5`
- **Độ khó (`difficulty`)**: `2`
- **Nấc truy cập (`access_tier`)**: `login`
- **Chủ đề (`theme`)**: `nature`
- **Số vòng (`rounds`)**: 3
- **Montessori Ref**: `WB00-D4`
- **Kỹ năng sở hữu**: `C2.SOL.01` (hoặc `C2.SOL.04`)
- **Cấu hình `content_pack` (`GT001ContentSchema`) Round 1**:
  ```json
  {
    "prompt": "Bé hãy chạm vào khối lập phương màu xanh lam để cất vào hòm đồ nhé!",
    "prompt_audio_path": "/audio/voice/montessori/intro/prompt_find_cube.mp3",
    "target_item": {
      "item_id": "target_cube",
      "asset": { "kind": "emoji", "ref": "🧊" }
    },
    "options": [
      {
        "item_id": "opt_cube_blue",
        "asset": { "kind": "emoji", "ref": "🧊" },
        "is_correct": true
      },
      {
        "item_id": "opt_sphere_purple",
        "asset": { "kind": "emoji", "ref": "🔮" },
        "is_correct": false
      },
      {
        "item_id": "opt_cylinder_gold",
        "asset": { "kind": "emoji", "ref": "🪵" },
        "is_correct": false
      }
    ]
  }
  ```

---

## 10. Kiến Trúc World Map Hub & Gamification

### 10.1. Thanh tiến độ "20 Mảnh Đường Ray Ánh Sáng"
- Được hiển thị ở thanh HUD trên cùng của màn hình chính trong suốt cuộc hành trình:
  - Trạng thái ban đầu: `0/20` mảnh đường ray ánh sáng.
  - Khi hoàn thành bài kiểm tra cuối chặng của Chặng $N$ ($1 \le N \le 20$):
    - Hoạt cảnh: Mảnh đường ray bằng vàng bay từ tâm màn hình gắn vào thanh tiến độ với âm thanh chuông ngân `rail_snap_gold.mp3`.
    - Chỉ số tăng: $N/20$.
  - Khi đạt đủ `20/20`: Mở khóa Chặng 21 (Phòng Thử Thách Vinh Danh — TUYỆT ĐỐI KHÔNG DÙNG TỪ "IQ" per `BR-MCM-06`).

### 10.2. Bản đồ thế giới tương tác (Interactive World Map Hub)
- Tấm bản đồ da cuộn nối liền 21 điểm ga trên nền Canvas 2D:
  - Ga 0: Cây Cầu Vồng & Cánh Cổng Ánh Sáng (`chang-00-intro`)
  - Ga 1 đến Ga 20: 20 vùng đất thử thách tương ứng 20 workbook Montessori
  - Ga 21: Phòng Thử Thách Vinh Danh (Về Đích an toàn)
- Chạm vào đầu tàu Chuyến Tàu Toán Học để phát còi hụ `train_whistle.mp3`.

---

## 11. BDD Gherkin Scenarios

```gherkin
Feature: Chặng 0 - Mở Màn Chuyến Tàu Toán Học & Khắc Phục Bão Lộn Xộn
  As a preschool child (age 3-6)
  I want to experience the story of Rainbow Tree and help Bear Logic and Rabbit Scout
  So that I understand my quest to collect 20 light rail pieces and restore order to the Number Kingdom

  Scenario: Trẻ hoàn thành phân đoạn câu chuyện mở đầu (WB00-D1 / GT-000)
    Given Trẻ đang ở màn chơi "GL-C1-NREC-INTRO-0101"
    When Hoạt cảnh Cây Cầu Vồng và Phong thư cứu viện xuất hiện
    And Giọng đọc phát câu hỏi nhận diện "Vật phẩm nào mang lời kêu cứu đến cho chúng mình?"
    And Trẻ chạm vào biểu tượng "Phong thư cứu viện"
    Then Hệ thống phát âm thanh leng keng ngôi sao vui tươi
    And Chuyển sang màn hình giới thiệu Vương quốc Bị Đảo Lộn

  Scenario: Trẻ sửa lỗi số 2 đi cùng 3 quả táo (WB00-D2 / GT-001)
    Given Trẻ đang ở màn chơi "GL-C1-OTO-TAP-0101" với bục đá hiển thị chữ số 2
    And Màn hình hiển thị 3 đĩa táo: 1 quả, 2 quả, 3 quả
    When Trẻ chạm vào đĩa có 2 quả táo
    Then Đĩa 2 quả táo phát sáng viền hổ phách và nảy pop nhẹ
    And Thỏ Quan Sát vui vẻ reo lên: "Hoan hô! Số 2 đã đi cùng đúng 2 quả táo rồi!"
    And Vòng chơi được tính là hoàn thành chính xác

  Scenario: Trẻ kéo thả số 1-5 về đúng thứ tự bục đá (WB00-D3 / GT-008)
    Given Trẻ đang ở màn chơi "GL-C1-NREC-SLOT-0101" với 5 bục đá trống từ 1 đến 5
    When Trẻ lần lượt kéo thả các viên số 1, 2, 3, 4, 5 vào các bục tương ứng
    Then Mỗi viên số thả đúng snap vào tâm bục và phát nốt nhạc thăng tiến Đô - Rê - Mi - Pha - Son
    And Khi đủ 5 số, toàn bộ đoàn bục đá bừng sáng màu vàng ánh kim
    And Hệ thống ghi nhận hoàn thành thử thách khôi phục trật tự dãy số
```

---

## 12. Verification & Safety Checklist

- [x] **Không tạo mới `GT-038+`**: Hoàn toàn kế thừa `GT-000`, `GT-001`, `GT-008`.
- [x] **Tuân thủ `BR-MCM-06`**: Không chứa các từ "IQ", "Raven", "trí tuệ", "chỉ số thông minh".
- [x] **Dải mã Montessori**: Toàn bộ mã level bắt đầu từ `-0101` trở lên (`GL-C1-NREC-INTRO-0101`, `GL-C1-OTO-TAP-0101`, `GL-C1-NREC-SLOT-0101`, `GL-C2-SOL-TAP-0101`).
- [x] **Access Tier khớp Difficulty**: Diff 1 gán `free`, Diff 2 gán `login` (tuân thủ `BR-MGL-12`).
- [x] **Montessori Ref**: Khai báo rõ ràng `WB00-D1`, `WB00-D2`, `WB00-D3`, `WB00-D4`.
- [x] **CPA & Control of Error**: Duy trì trọn vẹn nguyên lý giáo cụ tự báo sai và tiến trình cụ thể tới trừu tượng.
- [x] **Touch floor**: Đạt tiêu chuẩn tối thiểu $\ge 64\text{px}$ (band 3–4 tối thiểu $96\text{px}$).
