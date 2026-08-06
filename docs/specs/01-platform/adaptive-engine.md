---
spec: ADAPTIVE-ENGINE
title: Engine ước lượng thành thạo và chọn độ khó
area: platform
status: draft
mvp: true
phase: P3
reviewed: 2026-08-04
owns:
  - Luật cập nhật mastery
  - Luật chọn bước tiếp theo (ZPD)
  - Ranh giới adaptive với curriculum
depends_on:
  - TAXONOMY-SERVICE
  - EVENT-CATALOG
---

# Engine ước lượng thành thạo và chọn độ khó

## 1. Objective

Ước lượng `p_learn` của một trẻ trên từng **skill**, và chọn nội dung vừa sức.

Quá dễ thì trẻ bỏ; quá khó thì trẻ khóc. Khoảng ở giữa là ZPD, và nó khác nhau theo từng
trẻ, từng skill, từng ngày.

Pure TS. ❌ **NEVER ghi DB** — trả dữ liệu, tầng API ghi. ❌ **NEVER `new Date()`** — nhận
`now` làm tham số.

## 2. Actors

| Actor | Vai trò |
|---|---|
| `packages/adaptive` | Tính toán thuần |
| Tầng API | Đọc trạng thái, gọi engine, ghi kết quả |
| Curriculum player | Hỏi biến thể nào trong bước hiện tại |
| Người lớn | Xem kết quả qua báo cáo — ❌ không thấy `p_learn` thô |

## 3. Entry points

| Nơi | |
|---|---|
| `packages/adaptive/src/bkt.ts` | Luật cập nhật |
| `packages/adaptive/src/zpd-selector.ts` | Chọn bước tiếp |
| `packages/adaptive/src/level-params.ts` | Điều chỉnh `difficulty_params` |
| `POST /api/users/play-sessions/{uuid}/complete` | Nơi tầng API gọi và ghi |

## 4. Main flow

1. Phiên chơi kết thúc, server tính `correct_ratio` từ event.
2. Nạp `mastery_state` hiện tại cho từng skill mà level đó gắn.
3. Với mỗi skill: `computeUpdate({ prev, result, weight, now })`.
4. Tầng API ghi kết quả, map từng field tường minh.
5. Khi cần gợi ý bước tiếp: `selectNext({ tree, mastery, curriculumStep, now })`.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Phiên guest | ❌ **không** cập nhật gì |
| Phiên preview của Manager | ❌ **không** cập nhật gì |
| Trẻ chưa chơi 7 ngày | `revision_mode = true` — ôn lại trước khi đi tiếp |
| Skill phụ (`weight` thấp) | Ảnh hưởng nhỏ hơn theo đúng `weight` |
| Phiên bỏ dở | Cập nhật với `correct_ratio` tính trên round đã hoàn thành, `attempts` tăng |
| Dữ liệu quá ít (< 3 lần) | Nhãn báo cáo là `Chưa có đủ dữ liệu` |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-ADP-01` | ❌ **NEVER ghi DB từ package** | Hàm thuần test được; hàm ghi DB thì không |
| `BR-ADP-02` | ❌ **NEVER `new Date()` trong package** — nhận `now` | "Chưa chơi 7 ngày" phụ thuộc múi giờ; `new Date()` làm test không tái lập được |
| `BR-ADP-03` | **`p_learn ∈ [0,1]`** sau mọi chuỗi cập nhật — property test | Giá trị ngoài khoảng làm mọi ngưỡng vô nghĩa |
| `BR-ADP-04` | `content_skill_map.weight` điều tiết ảnh hưởng | Không có nó, một game đếm "dạy" mọi skill nó chạm tới |
| `BR-ADP-05` | ❌ **NEVER cho adaptive nhảy bước curriculum** | Nó không có thông tin để phủ quyết thứ tự sư phạm do người biên soạn quyết định |
| `BR-ADP-06` | ❌ **NEVER ghi mastery từ phiên guest hoặc preview** | Lượt test làm nhiễu dữ liệu học của trẻ |
| `BR-ADP-07` | ❌ **NEVER tin mastery do client gửi** — client gửi **event thô**, server tính | |
| `BR-ADP-08` | Kết quả ❌ **không bao giờ** hiển thị cho **trẻ** dưới dạng điểm số | `BR-ENG-11` |
| `BR-ADP-09` | Adaptive điều chỉnh **trong** bước hiện tại: chọn biến thể, đổi `difficulty_params` | |
| `BR-ADP-10` | Tham số `α`, `β` là hằng số **có version**, đổi phải chạy replay đối chiếu | Đổi tham số âm thầm làm mọi báo cáo lịch sử không so được |

## 7. Data

### 7.1 Trạng thái

```ts
interface MasteryState {
  child_id: number;
  skill_id: number;          // FK — KHÔNG phải chuỗi concept
  p_learn: number;           // [0,1]
  attempts_total: number;
  attempts_recent: number;   // 10 lần gần nhất
  ema_correct: number;
  hint_rate: number;
  last_seen_at: Date;
  params_version: string;
}
```

### 7.2 Luật cập nhật (BKT đơn giản hoá)

```
p_learn'     = clamp01( p_learn + α · weight · (correct_ratio − p_learn) )
ema_correct' = β · correct_ratio + (1 − β) · ema_correct
```

Mặc định `α = 0.2`, `β = 0.3`, `params_version = "v1"`. Tinh chỉnh bằng offline replay,
❌ không bằng cảm giác.

### 7.3 ZPD — bốn nhánh

| Điều kiện | Hành động |
|---|---|
| `p_learn < 0.4` | Lặp lại, hoặc biến thể **dễ hơn** |
| `0.4 ≤ p_learn < 0.8` | Cùng độ khó, **biến thể khác** |
| `p_learn ≥ 0.8` | Lên **một** bậc — ❌ không nhảy hai |
| `last_seen_at > 7 ngày` | `revision_mode = true`, bất kể `p_learn` |

### 7.4 Nhãn báo cáo — ánh xạ duy nhất

| `p_learn` + số lần | Nhãn |
|---|---|
| < 3 lần | `Chưa có đủ dữ liệu` |
| < 0.35 | `Mới làm quen` |
| 0.35–0.6 | `Đang phát triển` |
| 0.6–0.8 | `Khá ổn định` |
| ≥ 0.8 | `Thành thạo trong phạm vi bài tập` |

❌ **NEVER** hiển thị `p_learn` thô cho người dùng. ❌ **NEVER** nhãn mang nghĩa chẩn đoán.

## 8. API contract

```ts
computeUpdate(i: { prev: MasteryState | null; result: SessionResult; weight: number; now: Date }): MasteryUpdate;
selectNext(i: { tree: SkillTree; mastery: Map<number, MasteryState>; step: CurriculumStep | null; now: Date }): NextSuggestion;
computeAdaptiveParams(i: { base: DifficultyParams; mastery: MasteryState; ageBand: AgeBand }): DifficultyParams;
```

Tất cả **thuần**. Tầng API ghi:

```ts
const u = computeUpdate({ prev, result, weight, now });
await db.update(mastery_state).set({
  p_learn: u.p_learn, ema_correct: u.ema_correct, attempts_total: u.attempts_total,
}).where(and(eq(mastery_state.child_id, cid), eq(mastery_state.skill_id, sid)));
```

## 9. Acceptance criteria

```gherkin
Scenario: BR-ADP-03 — p_learn luôn trong [0,1]
  Given một chuỗi 1000 kết quả ngẫu nhiên sinh bởi fast-check
  When áp computeUpdate liên tiếp
  Then p_learn luôn nằm trong [0,1]

Scenario: BR-ADP-01 — package không ghi DB
  When quét import của packages/adaptive
  Then không import nào từ drizzle-orm hay packages/db

Scenario: BR-ADP-02 — không đọc đồng hồ hệ thống
  When quét source của packages/adaptive
  Then không xuất hiện new Date() hay Date.now()

Scenario: BR-ADP-04 — weight điều tiết ảnh hưởng
  Given hai skill cùng kết quả, một weight 1.0 một weight 0.3
  When áp computeUpdate
  Then độ tăng p_learn của skill weight 0.3 nhỏ hơn đáng kể

Scenario: BR-ADP-05 — không nhảy bước curriculum
  Given trẻ đang ở tuần 3 của một curriculum
  And p_learn của mọi skill tuần 3 đều ≥ 0.9
  When selectNext được gọi
  Then gợi ý vẫn nằm trong tuần 3
  And không trỏ tới tuần 4

Scenario: BR-ADP-06 — guest không cập nhật mastery
  Given một guest hoàn thành một level free
  Then không hàng mastery_state nào được tạo hay đổi

Scenario: BR-ADP-07 — không tin mastery từ client
  Given client gửi p_learn = 1.0 trong payload complete
  Then giá trị đó bị bỏ qua
  And server tính lại từ event

Scenario: nhãn không mang nghĩa chẩn đoán
  When render mọi nhãn mastery có thể có
  Then không nhãn nào chứa từ chậm, kém, có vấn đề, IQ, hay rối loạn

Scenario: BR-ADP-10 — đổi tham số có version
  Given params_version đổi từ v1 sang v2
  Then hàng mastery_state mới mang v2
  And báo cáo cảnh báo khi trộn dữ liệu hai version
```

## 10. Boundaries

**Always**
- Giữ package thuần: không DB, không đồng hồ, không locale.
- Property test mọi bất biến bằng `fast-check`.
- Ghi `params_version` mỗi hàng.
- Map từng field khi tầng API ghi.

**Ask first**
- Đổi `α`, `β`, hoặc ngưỡng ZPD.
- Đổi ánh xạ nhãn báo cáo.
- Cho adaptive tác động ngoài bước hiện tại.

**Never**
- Ghi DB hoặc đọc `new Date()` trong package.
- Cho adaptive nhảy bước curriculum.
- Ghi mastery từ phiên guest hoặc preview.
- Tin mastery từ client.
- Hiện `p_learn` thô hoặc nhãn mang nghĩa chẩn đoán.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Script replay offline (`replay-adaptive.ts`) chạy hàng tuần — ai sở hữu và chạy? Thuật toán học không có "đúng" tuyệt đối, chỉ có "không trôi" | Vận hành P3 |
| 2 | `strength` của prerequisite tham gia vào `selectNext` thế nào? | `taxonomy-service` Q3 |
| 3 | Skill ngôn ngữ mở (C5) cần người lớn chấm — luồng `assessed_by` thiết kế thế nào? | P3 |
