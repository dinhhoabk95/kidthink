# Kế hoạch — Task #60: P3.7 — Báo cáo nâng cao

> Viết 2026-08-11, đo tại commit `484ebaf` trên working tree đang triển khai P0.9.
> Bước sở hữu: **P3.7** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`advanced-report.md`](../specs/03-account/advanced-report.md).
> Task trước: [`59-p3-6-next-game-recommendation-plan.md`](59-p3-6-next-game-recommendation-plan.md).
>
> ```sh
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Báo cáo nâng cao là **giá trị bán được** của gói trả phí, và là nơi rủi ro ngôn ngữ cao nhất
trong sản phẩm: càng chi tiết càng dễ đọc thành chẩn đoán.

Bốn sự thật chi phối kế hoạch:

1. **P3.7 có một khối lượng biên soạn nội dung mà chưa ai xếp lịch.** `BR-ARP-06` bắt mục "cần
   củng cố" nêu hành động cụ thể, và câu hỏi mở số 2 đề xuất soạn tay theo từng skill vì `D7`
   cấm sinh runtime. Taxonomy có **230 skill**. Đó là một thư viện nội dung có chủ, cần cổng
   duyệt, không phải một bảng hằng số nhét vào code.
2. **Mục "Mức độ độc lập" chưa có nguồn dữ liệu.** Nó cần tỉ lệ hoàn thành không cần trợ giúp.
   `child_daily_stats` không có cột nào về gợi ý; `mastery_state` thì `hint_rate` đang bị `D-ML`
   của Task #58 đặt vào diện "có công thức hoặc bị bỏ". Nếu Task #58 bỏ nó, một trong bảy mục
   của P3.7 mất nguồn.
3. **Ngưỡng đếm bằng "phiên", nhưng không bảng nào đếm phiên theo competency hay strand cho một
   trẻ.** Đây là trang trả phí, nên truy vấn nối bốn tầng taxonomy cho mỗi lần mở là quyết định
   phải cân, không phải mặc định.
4. **`403` mà vẫn hiện bản mẫu là hai yêu cầu trái nhau nếu bản mẫu lấy từ dữ liệu thật.** Ranh
   giới phải được viết ra trước khi ai đó lấy dữ liệu của chính đứa trẻ đó ra làm mẫu bị làm mờ.

## 0. Điều kiện tiên quyết

| Phụ thuộc | Bước | Điều kiện vào Task 2 trở đi |
|---|---|---|
| P3.5 | P3.5 | `mastery_state` có dữ liệu thật; bảng nhãn §7.4 là một hàm duy nhất |
| `BASIC-REPORT` | P1.12 | Ràng buộc ngôn ngữ `BR-REP-*` và bề mặt báo cáo đã có |
| `ENTITLEMENT-MODEL` | P0.5 | `view_advanced_report` cấp được và kiểm được |
| `TELEMETRY-PIPELINE` | P1.5 | `child_daily_stats` được nuôi thật |
| `CONTENT-VERSIONING` | P0.6 | `play_sessions` ghim version nội dung đã chơi, `BR-VER-05` |
| `TAXONOMY-SERVICE` | P0.9 | 6 competency · 41 strand · 230 skill · ≥690 LO đã seed |
| `CONTENT-REVIEW-QUEUE` | P2.8 + P3.2 | Cổng duyệt mở rộng được cho thư viện gợi ý hành động |
| Nhóm Nội dung | — | Có người soạn và reviewer sư phạm cho thư viện `D-MY` |

**Stop condition:** trước Task 3, phụ thuộc nào chưa `implemented` thì dừng Task #60.

## 1. Đo được

### 1.1 Thư viện gợi ý hành động là 230 đơn vị nội dung chưa ai xếp lịch

| Nguồn | Nói gì |
|---|---|
| `BR-ARP-06` | Mục "cần củng cố" nói **hành động cụ thể**, không chỉ nêu vấn đề |
| §7.3 | Cấu trúc cố định: nhãn → dữ liệu → **hành động**; cấm mục nào dừng ở "dữ liệu" |
| Câu hỏi mở số 2 | Soạn tay theo từng skill; **không** sinh tự động runtime theo `D7` |
| [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) §7 | Cây có 6 competency · 41 strand · **230 skill** · ≥690 LO |

Ghép lại: cần tới **230 mục gợi ý hành động** viết tay, mỗi mục có chất lượng sư phạm đủ để
hiện cho phụ huynh trả tiền. Không bảng nào giữ chúng, không đường seed nào tạo chúng, không
cổng duyệt nào kiểm chúng.

Mẫu ở §7.3 cho thấy mỗi mục cần ít nhất hai gợi ý — một hoạt động đời thường và một trò chơi
trong hệ thống — nên khối lượng thật lớn hơn 230 dòng.

### 1.2 "Mức độ độc lập" chưa có nguồn

§7.1 định nghĩa mục này là "tỉ lệ hoàn thành **không cần trợ giúp**", ngưỡng ≥10 phiên.

| Bảng | Có gì liên quan |
|---|---|
| `child_daily_stats` | `total_play_time_seconds` · `levels_attempted` · `levels_completed` · `stars_earned` |
| `mastery_state` (sau Task #58) | `hint_rate` — **đang ở diện có công thức hoặc bị bỏ** theo `D-ML` |
| `level_daily_stats` | Không có chiều trẻ |

Không cột nào hiện có đếm số phiên hoàn thành mà trẻ không dùng gợi ý. Nếu Task #58 bỏ
`hint_rate`, mục này không có nguồn nào và phải bị bỏ hoặc đổi định nghĩa — nhưng §7.2 cấm ẩn
mục, nên "bỏ" nghĩa là sửa spec, không phải giấu ở UI.

### 1.3 Đơn vị ngưỡng là "phiên", và không bảng nào đếm nó theo competency hay strand

Bốn trong bảy mục dùng ngưỡng đếm phiên: ≥5 phiên mỗi competency · ≥3 phiên mỗi strand · ≥3 phiên
mỗi skill · ≥10 phiên cho độ độc lập.

| Nguồn có sẵn | Chiều | Đủ không |
|---|---|---|
| `mastery_state.attempts_count` | `(child, skill)` | Đếm lần cập nhật, không phải phiên; không có chiều strand hay competency |
| `child_daily_stats` | `(child, date)` | Không có chiều skill |
| `skill_daily_stats` | `(skill, date)` | **Không có chiều trẻ** — là số tổng của mọi trẻ |

Muốn đếm phiên theo competency cho một trẻ phải nối `play_sessions` → level →
`content_skill_map` → skill → strand → competency. Bốn phép nối, chạy mỗi lần mở trang trả phí,
cho khoảng thời gian 30 hoặc 90 ngày.

`skill_daily_stats.avg_mastery` còn là `smallint` trong khi `p_learn` là `numeric` trong `[0,1]`
— thang đo đã bị đổi ở đâu đó mà không có chỗ nào ghi hệ số.

### 1.4 `403` kèm bản mẫu chưa có ranh giới dữ liệu

Alt flow §5: "Không có entitlement → **403** kèm mời nâng cấp, hiện **mẫu** báo cáo với dữ liệu
ẩn". Acceptance criteria lặp lại điều đó.

Chưa nói bản mẫu lấy từ đâu. Hai cách hiểu cho hai hệ quả rất khác nhau: mẫu tổng hợp tĩnh thì
an toàn; mẫu dựng từ dữ liệu thật của chính đứa trẻ rồi làm mờ thì là gửi dữ liệu mà người gọi
không có quyền đọc, và làm mờ chỉ nằm ở tầng hiển thị.

### 1.5 "Hướng đi" chưa có tập giá trị

`BR-ARP-04` bắt xu hướng hiện **hướng đi**, không hiện độ dốc chính xác. Không chỗ nào khai tập
giá trị của "hướng đi", nên mỗi người cài một kiểu và một trong số đó sẽ là một con số phần trăm.

Ngưỡng "≥3 tuần có dữ liệu" cũng chưa nói tuần nào tính là "có dữ liệu": có ít nhất một phiên,
hay đủ một ngưỡng nào đó.

### 1.6 Mốc đổi version cần dữ liệu ghim mà báo cáo chưa đọc

`BR-ARP-08` và `BR-VER-05` bắt cảnh báo khi dữ liệu trải nhiều version nội dung. Theo `D-AE`,
`play_sessions` ghim version thật đã chơi — đó là nguồn đúng. Báo cáo hiện chưa khai truy vấn
nào đọc trường đó, và nếu phiên cũ không có version ghim thì vẽ chỉ báo là vẽ một mốc bịa.

### 1.7 Ràng buộc ngôn ngữ áp chặt hơn nhưng chưa có cổng máy

`BR-ARP-01` nói mọi ràng buộc ngôn ngữ của
[`basic-report.md`](../specs/03-account/basic-report.md) áp ở đây; `BR-ARP-05` cấm dự đoán tương
lai; `BR-ARP-07` cấm so chuẩn ngoài. Acceptance criteria kiểm bằng cách "đọc toàn bộ nội dung" —
đó là việc của người.

Với 230 mục gợi ý hành động soạn tay, kiểm bằng mắt từng lần sửa là không bền. Cần một cổng
danh sách từ cấm chạy trên chính thư viện đó, giống cổng an toàn vật liệu của `D-LE`.

## 2. Quyết định

**D-MY — Thư viện gợi ý hành động là tài sản nội dung có bảng, có provenance, có cổng duyệt.**
Bảng `skill_action_suggestions (skill_id, order_no, text, kind, ref_entity_id?)` với `kind`
là danh sách đóng: `home_activity` (việc làm cùng bé ngoài màn hình) và `in_app` (trỏ một game
level hoặc lesson `published`). Mỗi skill cần ≥1 mục `home_activity`; mục `in_app` là tuỳ chọn
và phải trỏ nội dung `published` qua `entity_id` theo `D-AE`.

Đường ghi là seeder theo lô như thư viện lesson, đi qua PR review, **không** phải studio. Khối
lượng đo được là 230 skill; chia lô và checkpoint như Task #54 chứ không gom một diff. Điểm cắt
nếu thiếu nguồn lực: phủ trước các skill xuất hiện trong năm chương trình MVP, còn lại hiện
`Chưa có gợi ý cho kỹ năng này` — **không** hiện mục "cần củng cố" mà dừng ở dữ liệu, vì §7.3
cấm điều đó.

**D-MZ — "Mức độ độc lập" có nguồn, hoặc bị bỏ khỏi bảy mục ở spec.** Nguồn duy nhất khả dĩ là
tỉ lệ phiên hoàn thành không dùng gợi ý, và nó phụ thuộc `hint_rate` của `D-ML`. **Đẩy ngược vào
Task #58:** nếu bỏ `hint_rate` thì P3.7 mất một mục, nên quyết định ở đó phải biết cái giá này.
Nếu giữ, `hint_rate` phải tách được theo phiên chứ không chỉ là EMA — báo cáo cần đếm phiên, EMA
không đếm được. Nếu bỏ, sửa §7.1 xuống sáu mục và ghi lý do; không giữ một mục vĩnh viễn hiện
`Chưa có đủ dữ liệu`, vì đó là cách nói dối lịch sự.

**D-NA — "Phiên có chạm" là đơn vị đếm duy nhất, định nghĩa một chỗ, và không materialize trước
khi đo.** Một phiên tính là "chạm" một skill khi level của phiên đó gắn skill ấy trong
`content_skill_map`, phiên `completed` hoặc `abandoned`, và không phải phiên guest hay preview —
cùng bộ điều kiện với §7.3 của
[`play-session-lifecycle.md`](../specs/04-play/play-session-lifecycle.md). Chạm một strand hay
competency là chạm ít nhất một skill con của nó.

Cài bằng truy vấn nối, có index, và **đo** trên dữ liệu 90 ngày của một trẻ chơi nhiều. Chỉ
thêm bảng tổng hợp khi số đo vượt ngưỡng đã đặt — thêm trước là tạo bản sao thứ hai của cùng một
sự thật, và bản sao sẽ lệch.

**D-NB — Bản mẫu là dữ liệu tổng hợp tĩnh, không bao giờ suy từ trẻ thật.** Route trả `403`
`ENTITLEMENT_REQUIRED` kèm `upgrade_package_codes` và **không** kèm bất kỳ số nào của trẻ. Bản
mẫu là tài sản tĩnh ở tầng UI, dùng một hồ sơ hư cấu, có nhãn nói rõ là ví dụ. Làm mờ ở tầng
hiển thị không phải là kiểm soát truy cập.

**D-NC — "Hướng đi" là tập ba giá trị đóng.** `improving` · `steady` · `needs_attention`, mỗi
giá trị có một câu tiếng Việt cố định. Không phần trăm, không độ dốc, không mũi tên kèm số.
Ngưỡng phân loại là hằng số có tên, khai một chỗ, và đổi nó là mục "Ask first". "Tuần có dữ
liệu" định nghĩa là tuần có ít nhất một phiên có chạm theo `D-NA`.

**D-ND — Chỉ báo đổi version đọc `play_sessions` đã ghim; thiếu ghim thì không vẽ.** Phiên không
có version ghim bị loại khỏi phép so sánh và được đếm riêng. Nếu số phiên thiếu ghim vượt một
tỉ lệ đã đặt thì mục xu hướng hiện `Chưa có đủ dữ liệu` thay vì vẽ một đường có mốc bịa.

**D-NE — Cổng máy cho ngôn ngữ báo cáo, chạy trên thư viện `D-MY` và trên mọi chuỗi cố định.**
Danh sách từ cấm đóng: từ mang nghĩa chẩn đoán (chậm, kém, có vấn đề, IQ, rối loạn), từ dự đoán
tương lai (sẽ đạt, dự kiến, tiên lượng), và từ so chuẩn ngoài (so với tuổi, chuẩn, trung bình
của trẻ cùng tuổi). **Ca âm bắt buộc:** một mục fixture chứa một từ cấm làm cổng **đỏ** kèm
`file:line`. Cổng máy không thay reviewer sư phạm; nó chỉ chặn lần trượt rẻ tiền.

## 3. Contract chốt trước code

```text
GET /api/users/children/{uuid}/reports/advanced?period=30d|90d
    200 → bảy mục §7.1 (hoặc sáu, theo D-MZ)
    403 → ENTITLEMENT_REQUIRED + upgrade_package_codes, KHÔNG kèm số liệu của trẻ (D-NB)
    404 → trẻ không thuộc caller
```

```ts
type TrendDirection = "improving" | "steady" | "needs_attention";   // D-NC

interface ReportSection {
  key: string;
  status: "ready" | "insufficient_data";
  sessions_have: number;
  sessions_needed: number;      // §7.2 — nêu còn thiếu bao nhiêu
  alt_text: string;          // BR-ARP-03, bắt buộc cho mọi biểu đồ
}

interface ReinforceItem extends ReportSection {
  skill_code: string;
  mastery_label: MasteryLabel;  // hàm duy nhất của P3.5
  actions: Array<{ kind: "home_activity" | "in_app"; text: string; ref?: string }>;  // D-MY
}
```

## 4. Đồ thị phụ thuộc

```text
T0 preflight + đẩy D-MZ ngược vào Task #58
 └──→ T1 sửa contract D-MY…D-NE + human approve
       ├──→ T2 cổng ngôn ngữ có ca âm
       ├──→ T3 migration bảng gợi ý hành động
       │     └──→ T6 biên soạn thư viện 230 skill
       └──→ T4 engine đếm phiên có chạm + ngưỡng
             ├──→ T5 bảy mục và route
             │     └──→ T7 UI báo cáo + a11y + ca 403
             └──→ T8 evidence và promote
```

## 5. Task

### Task 0 — Preflight và cảnh báo sớm cho Task #58

**Tiêu chí nghiệm thu**

- [ ] P3.5 `implemented`; `mastery_state` có dữ liệu thật.
- [ ] **Trước khi Task #58 chốt `D-ML`:** báo cái giá của việc bỏ `hint_rate` — mất mục "Mức độ
      độc lập" của P3.7.
- [ ] Nếu Task #58 đã bỏ `hint_rate`: chốt `D-MZ` theo hướng bỏ mục, và sửa §7.1 xuống sáu mục.
- [ ] Đếm lại số skill thật trong taxonomy; con số 230 quyết định khối lượng Task 6.
- [ ] Đo lại [`play.ts`](../../packages/db/src/schema/play.ts) và
      [`adaptive.ts`](../../packages/db/src/schema/adaptive.ts) sau P3.5.

**Kiểm chứng:** `pnpm check:progress` xanh tới P3.5; quyết định `hint_rate` và số skill thật được
ghi vào preflight trước T1.

**Phụ thuộc:** P3.5 · **Cỡ:** S

### Task 1 — Sửa contract trước code

**Tiêu chí nghiệm thu**

- [ ] Người sở hữu phê duyệt `D-MY`…`D-NE`; `D-MY` và `D-MZ` duyệt riêng vì đổi phạm vi công việc.
- [ ] Bảng gợi ý hành động, `kind` đóng và đường seed vào spec sở hữu; câu hỏi mở số 2 đóng.
- [ ] Điểm cắt của `D-MY` ghi rõ: phủ trước skill của năm chương trình MVP.
- [ ] "Phiên có chạm" định nghĩa **một chỗ**, dẫn được từ cả bốn mục dùng ngưỡng.
- [ ] `TrendDirection` ba giá trị và câu tiếng Việt cố định vào §7; "tuần có dữ liệu" định nghĩa rõ.
- [ ] Alt flow `403` sửa theo `D-NB`: không số liệu của trẻ trong response.
- [ ] Quy tắc phiên thiếu version ghim vào §7 theo `D-ND`.
- [ ] Danh sách từ cấm của `D-NE` đăng ký ở nơi dùng chung với
      [`basic-report.md`](../specs/03-account/basic-report.md), không chép hai bản.
- [ ] Câu hỏi mở số 1 đóng hoặc hoãn kèm điều kiện mở lại đo được.
- [ ] Không thêm spec mới; không thêm mã lỗi ngoài registry.

**Kiểm chứng:** `pnpm lint:specs` 0 lỗi, 0 cảnh báo mới.

**Phụ thuộc:** T0 · human decision · **Cỡ:** M

### Checkpoint A — Contract

- [ ] T0 và T1 xanh; `D-MZ` đã phản hồi về Task #58.
- [ ] Có người sở hữu và reviewer sư phạm cho thư viện `D-MY`; nếu chưa thì dừng Task 6.
- [ ] Không migration, route hay UI nào viết trước checkpoint này.

### Task 2 — Cổng ngôn ngữ có ca âm

**Tiêu chí nghiệm thu**

- [ ] **Ca âm viết trước:** fixture chứa một từ chẩn đoán, một từ dự đoán, một cụm so chuẩn ngoài
      — cả ba làm cổng **đỏ** kèm `file:line`.
- [ ] Cổng chạy trên thư viện `D-MY` và trên mọi chuỗi cố định của báo cáo.
- [ ] Danh sách từ cấm dùng chung với báo cáo cơ bản; sửa một chỗ, hai nơi cùng đổi.
- [ ] Cổng không nới ca kiểm nào đang có để đổi lấy màu xanh.

**Kiểm chứng:** `pnpm test -- report-language-gate` xanh.

**Phụ thuộc:** Checkpoint A · **Cỡ:** S

### Task 3 — Migration bảng gợi ý hành động

**Tiêu chí nghiệm thu**

- [ ] **Test âm trước:** mục `in_app` trỏ nội dung chưa `published` làm cổng **đỏ**.
- [ ] `skill_action_suggestions` với khoá ngoại `skill_id`, unique `(skill_id, order_no)`,
      `kind` là enum đóng.
- [ ] `ref_entity_id` là `entity_id` dòng dõi theo `D-AE`; không khoá ngoại cứng.
- [ ] Provenance và review fields như mọi bảng nội dung khác.
- [ ] Migration từ DB rỗng xanh; ca lỗi rollback cả transaction.

**Kiểm chứng:** `pnpm db:migrate` trên DB rỗng · `pnpm test -- action-suggestions-migration` xanh.

**Phụ thuộc:** Checkpoint A · **Cỡ:** M

### Checkpoint B — Language gate và content source

- [ ] Cổng ngôn ngữ có đủ ca âm; migration gợi ý hành động rollback sạch.
- [ ] Danh sách từ cấm dùng chung, không có bản thứ hai trong report UI.
- [ ] Full gate hiện tại xanh trước engine đếm/route.

### Task 4 — Engine đếm phiên có chạm và áp ngưỡng

**Tiêu chí nghiệm thu**

- [ ] "Phiên có chạm" cài đúng `D-NA`; phiên guest và preview bị loại; phiên `abandoned` được tính.
- [ ] Đếm theo skill, strand và competency đi qua **cùng một** hàm, khác nhau ở tầng gộp.
- [ ] Ngưỡng của bảy mục lấy từ hằng số có tên, không rải số trong code.
- [ ] Dưới ngưỡng trả `insufficient_data` kèm `sessions_needed`; **không** ẩn mục (§7.2).
- [ ] Skill chỉ chơi một lần hiện ở "đã tiếp xúc", không vào phần đánh giá.
- [ ] **Đo** truy vấn trên 90 ngày của một trẻ chơi nhiều; ghi số đo và so ngưỡng đã đặt.
- [ ] Chỉ thêm bảng tổng hợp nếu số đo vượt ngưỡng; quyết định có số kèm theo.

**Kiểm chứng:** `pnpm test -- report-session-counting` xanh, gồm test đo thời gian truy vấn.

**Phụ thuộc:** Checkpoint A · P3.5 · **Cỡ:** 2 work package M — touch aggregation và
threshold/performance; mỗi package ≤5 files

### Task 5 — Bảy mục và route

**Tiêu chí nghiệm thu**

- [ ] `requireUserAuth()` + ownership + `view_advanced_report`; thiếu quyền trả 403 theo `D-NB`,
      response **không** chứa số liệu của trẻ.
- [ ] Trẻ không thuộc caller trả 404, không phải 403 — không lộ sự tồn tại.
- [ ] Bảy mục (hoặc sáu theo `D-MZ`) đều trả, kể cả khi dưới ngưỡng.
- [ ] Nhãn thành thạo lấy từ **hàm duy nhất** của P3.5; không bảng ánh xạ thứ hai.
- [ ] `TrendDirection` chỉ nhận ba giá trị; response không chứa độ dốc hay phần trăm xu hướng.
- [ ] Mục "cần củng cố" luôn kèm ≥1 hành động; skill chưa có gợi ý hiện đúng câu đã chốt ở `D-MY`,
      không dừng ở dữ liệu.
- [ ] `BR-ARP-08`: chỉ báo mốc đổi version theo `D-ND`; phiên thiếu ghim bị loại và đếm riêng.
- [ ] `period` chỉ nhận `30d` và `90d`; giá trị khác trả 422, không im lặng ép về mặc định.

**Kiểm chứng:** `pnpm test -- advanced-report-api` xanh; mỗi `BR-ARP-*` xuất hiện trong tên test.

**Phụ thuộc:** T4 · T3 · **Cỡ:** 2 work package M — report sections và auth/version route;
mỗi package ≤5 files

### Checkpoint C — Engine và API báo cáo

- [ ] Session counting/threshold/performance và route bảy mục cùng xanh.
- [ ] Ownership/entitlement/403 không rò số liệu trẻ; version markers có nguồn ghim thật.
- [ ] Human review query + route trước biên soạn/UI.

### Task 6 — Biên soạn thư viện gợi ý hành động

Lặp cùng một work package theo lô. Mỗi lô là một file seeder có kiểu và một PR review độc lập.

**Tiêu chí nghiệm thu cho mỗi lô**

- [ ] Mỗi skill trong lô có ≥1 mục `home_activity` viết cho người lớn không được đào tạo.
- [ ] Mục `in_app` (nếu có) trỏ nội dung `published`.
- [ ] Vật liệu của hoạt động tại nhà là thứ có sẵn, cùng chuẩn với `BR-LSM-04`.
- [ ] Không mục nào chứa từ trong danh sách cấm của `D-NE`.
- [ ] Reviewer sư phạm đọc từng mục; ghi người duyệt.
- [ ] `pnpm seed:check` và dry-run riêng lô xanh.

**Checkpoint sau mỗi lô**

- [ ] Đo tốc độ review thật và so kế hoạch; lệch quá 30% thì sửa lịch hoặc cỡ lô, không hạ checklist.
- [ ] Báo cáo phủ: skill nào của năm chương trình MVP còn thiếu gợi ý.

**Cổng thư viện cuối:** mọi skill xuất hiện trong năm chương trình MVP đều có ≥1 gợi ý; phần còn
lại của 230 skill hoặc đã phủ, hoặc nằm trong danh sách hoãn đã được người sở hữu chấp nhận.

**Kiểm chứng:** `pnpm seed:check` và dry-run riêng từng lô xanh; báo cáo phủ cuối chứng minh mọi
skill trong năm curriculum MVP có ít nhất một gợi ý đã review.

**Phụ thuộc:** T3 · Nhóm Nội dung · **Cỡ:** nhiều work package cỡ M, tuần tự theo lô

### Task 7 — UI báo cáo, a11y và ca 403

**Tiêu chí nghiệm thu**

- [ ] `/me/children/{uuid}/report/advanced` hiện đủ mục; mục dưới ngưỡng hiện trạng thái, không ẩn.
- [ ] `BR-ARP-03`: mỗi biểu đồ có mô tả văn bản tương đương; test render toàn bộ biểu đồ.
- [ ] Không biểu đồ nào truyền tải thông tin **chỉ** bằng màu.
- [ ] Ca 403 hiện bản mẫu tĩnh có nhãn "ví dụ" và nút nâng cấp; không số nào của trẻ xuất hiện.
- [ ] Chọn khoảng 30 và 90 ngày đổi dữ liệu, không đổi cấu trúc mục.
- [ ] Không câu nào dự đoán tương lai hoặc so chuẩn ngoài; cổng `D-NE` chạy trên chuỗi UI.
- [ ] Đạt [`accessibility.md`](../specs/08-quality/accessibility.md); đi hết trang bằng bàn phím.

**Kiểm chứng:** `pnpm test:e2e -- advanced-report` xanh, gồm ca 403 và ca bàn phím.

**Phụ thuộc:** T5 · **Cỡ:** 2 work package M — sections/charts và 403/a11y; mỗi package ≤5 files

### Checkpoint D — Content và UI trả phí

- [ ] Mọi skill trong curriculum MVP có gợi ý đã review hoặc nằm trong điểm cắt canonical.
- [ ] UI đủ mục, a11y, static 403 sample và language gate cùng xanh.
- [ ] Full gate + human review nội dung/UI xanh trước promote.

### Task 8 — Evidence và promote P3.7

**Tiêu chí nghiệm thu**

- [ ] Mỗi `BR-ARP-*` có ít nhất một test tham chiếu bằng mã rule trong tên test.
- [ ] Cổng ngôn ngữ có ca âm và đang chạy trong `pnpm check`.
- [ ] Thư viện gợi ý đạt cổng cuối của Task 6.
- [ ] [`advanced-report.md`](../specs/03-account/advanced-report.md) sang `implemented`.
- [ ] Tick **P3.7** trong Task #14 chỉ khi `pnpm check:progress` tự xanh.

**Kiểm chứng:**
`pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

**Phụ thuộc:** T6 · T7 · **Cỡ:** S

## 6. Rủi ro

| Rủi ro | Hậu quả | Giảm thiểu |
|---|---|---|
| Không xếp lịch 230 mục gợi ý | Mục "cần củng cố" dừng ở dữ liệu, vi phạm `BR-ARP-06` | `D-MY` — bảng, seeder theo lô, điểm cắt theo chương trình MVP |
| Bỏ `hint_rate` ở Task #58 mà P3.7 không biết | Một trong bảy mục mất nguồn sau khi UI đã dựng | `D-MZ` đẩy ngược vào Task #58 trước khi `D-ML` chốt |
| Materialize bảng tổng hợp trước khi đo | Bản sao thứ hai của cùng sự thật, sẽ lệch | `D-NA` — đo trước, thêm bảng sau, có số kèm |
| Bản mẫu dựng từ dữ liệu thật | Gửi dữ liệu cho người không có quyền đọc | `D-NB` — mẫu tĩnh, hồ sơ hư cấu |
| "Hướng đi" thành phần trăm | Chính xác giả tạo từ dữ liệu thưa, trái `BR-ARP-04` | `D-NC` — ba giá trị đóng |
| Vẽ mốc đổi version từ phiên thiếu ghim | Chỉ báo bịa trên trang trả phí | `D-ND` — loại phiên thiếu ghim, có ngưỡng |
| Kiểm ngôn ngữ bằng mắt trên 230 mục | Một từ chẩn đoán lọt ra phụ huynh | `D-NE` — cổng có ca âm, cộng reviewer người |
| Truy vấn bốn tầng trên trang trả phí | Trang chậm nhất lại là trang bán được | T4 đo trên 90 ngày, có ngưỡng đặt trước |
| Hai bảng ánh xạ nhãn | Báo cáo cơ bản và nâng cao nói khác nhau | Dùng hàm duy nhất của P3.5 |

## 7. Ngoài phạm vi

- Xuất PDF báo cáo — add-on P4.
- Dự đoán, tiên lượng, so chuẩn độ tuổi — cấm vĩnh viễn.
- So sánh giữa các trẻ trong cùng tài khoản — cấm theo `BR-PRG-05`.
- Sinh gợi ý hành động tự động lúc chạy — cấm theo `D7`.
- Báo cáo cho giáo viên hoặc lớp học — P5.
- Tinh chỉnh ngưỡng bằng kiểm chứng thống kê — P4, theo câu hỏi mở số 1.
- Auto-merge, migration ngoài local.

## 8. Giả định và điều kiện dừng

1. Taxonomy có đúng 230 skill; số thật khác thì khối lượng Task 6 đổi theo và phải báo lại trước
   khi bắt đầu lô đầu tiên.
2. `child_daily_stats` được telemetry nuôi thật cho khoảng 90 ngày; thiếu thì mục xu hướng dừng
   ở `insufficient_data`, không bịa.
3. `D-MY`, `D-MZ` và `D-NB` là **đề xuất** cho tới khi người sở hữu duyệt; `D-MZ` phải chốt sớm
   nhất vì nó chặn `D-ML` của Task #58.
4. Ngưỡng thời gian truy vấn cho trang báo cáo do người sở hữu đặt trước Task 4.
5. Không có người sở hữu và reviewer sư phạm cho thư viện gợi ý thì Task 6 dừng; sáu mục còn lại
   vẫn ship được, mục "cần củng cố" thì không.
6. Task #60 không bắt đầu implementation khi P3.5 còn đỏ.
