# Kế hoạch — Task #89: Engine mở rộng theo số template, và tiết học mẫu

> **Loại task:** bổ sung corpus (L) — 6 spec mới, không sửa spec đã approve.
> **Câu hỏi gốc:** engine hiện tại có đáp ứng "hàng chục, hàng trăm game template rèn luyện
> 6 loại hình tư duy cho trẻ mầm non" không? Nếu chưa thì thiếu gì.
> **Spec sở hữu liên quan:** [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) · [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md) · [`lesson-model.md`](../specs/05-content/lesson-model.md) · [`content-tagging.md`](../specs/01-platform/content-tagging.md).

## 1. Trả lời ngắn

Câu hỏi gộp hai trục. Tách ra thì hai câu trả lời khác nhau:

| Trục | Mục tiêu | Trạng thái |
|---|---|---|
| **Nội dung** — nhiều màn chơi phủ 6 competency | hàng trăm `game_level` | **Đã đáp ứng về kiến trúc, đã chứng minh ở quy mô nhỏ** |
| **Cơ chế** — hàng chục, hàng trăm `game_template` | 100+ template | **Chưa đáp ứng, và chưa có spec nào sở hữu con đường đi tới** |

Trục nội dung đúng như thiết kế: `BR-GTC-01` tách mechanic khỏi nội dung học, nên một
template phục vụ nhiều mục tiêu học tập. Đo được: 120 game level đã seed, phủ đủ 6
competency, dùng lại đúng 6 template — trung bình mỗi template gánh 20 level. Không dòng
code engine nào cho 120 level đó.

Trục cơ chế thì chưa. Corpus **cố ý** dừng ở 6 template
([`game-template-contract.md`](../specs/01-platform/game-template-contract.md) §11 câu hỏi 2 hoãn template 7–10 sang P4),
nhưng "hoãn" khác "có đường đi". Hiện chưa spec nào sở hữu chi phí thêm một template, và
chi phí đó đang tuyến tính theo số nơi liệt kê mã template bằng tay.

## 2. Bằng chứng đã đo (2026-08-17)

### 2.1 Nội dung đang phủ tới đâu

| Hạng mục | Số đo |
|---|---|
| Competency | 6 (C1–C6) |
| Strand | 41 |
| Skill | 230 |
| Game level đã seed | 120 — đều 20 level mỗi competency |
| Template dùng trong 120 level đó | 6 / 6, không template nào bị bỏ không |
| Lesson đã seed | 19 |
| Activity đã seed | 19 |

Lesson đang ở 19 trên mục tiêu 60 nêu ở [`lesson-model.md`](../specs/05-content/lesson-model.md) §11 câu hỏi 1.

### 2.2 Chi phí thêm template thứ 7

Đếm file phải sửa bằng tay khi thêm một mã template mới (đo bằng danh sách file đang chứa
mã `GT-006`, bỏ test và fixture):

| Nơi | File |
|---|---|
| Engine | `contracts/registry.ts` · `index.ts` · `contracts/templates/gt00n.ts` · `templates/GT-00n/*-session.ts` |
| Shared | `shared/src/custom-game.ts` (`CUSTOM_GAME_TEMPLATE_CODES`) · `shared/src/public-seo.ts` |
| Web | `pages/play/[code].vue` (switch dựng session) · `pages/play/preview-sandbox.vue` · `pages/custom-games/create.vue` · `pages/custom-games/index.vue` |
| Admin | `pages/studio/levels/index.vue` |
| Seed | `db/src/seed-master/game-templates.ts` |

**11 nơi, không nơi nào được sinh tự động.** Ở 6 template thì chấp nhận được. Ở 100
template thì `pages/play/[code].vue` là một `switch` 100 nhánh và bundle chơi của một đứa
trẻ mang theo cả 100 Session class.

### 2.3 Ba lỗ hổng runtime chặn cả hai trục

Đo bằng đọc code, không phải suy đoán:

| # | Lỗ hổng | Bằng chứng | Hệ quả |
|---|---|---|---|
| 1 | Engine không bao giờ vẽ | `GameEngine.loop()` chỉ gọi `scaffolding.tick()` và `session.update()`. `GameSession.render?` khai optional, không nơi nào invoke | `RenderSystem` khởi tạo rồi để không. Canvas trắng |
| 2 | Bề mặt chơi gọi sai chữ ký ở ba chỗ | `pages/play/[code].vue`: `engine.start(canvasRef.value)` nhưng `start(): void` không nhận tham số; `engine.stop()` nhưng lớp chỉ có `destroy()`; `new GT001Session(cfg as never)` truyền `EngineConfig` vào tham số `content` và bỏ trống `difficulty` | Canvas không tới được engine; `onUnmounted` ném lỗi; session dựng với nội dung sai kiểu |
| 3 | `layouts` và `shuffle_*` là cờ khai rồi bỏ đó | 6 template khai `layouts` (`grid`, `two-column-matching`, `horizontal-track`, …) — không file nào cài đặt. `shuffle_items`/`shuffle_sides`/`shuffle_initial` có trong `difficulty_contract`, không nơi nào đọc. Không có nguồn ngẫu nhiên có seed | Bố cục không tái dựng được; độ khó khai báo được nhưng không có tác dụng |

Lỗ hổng 2 không bị cổng nào bắt — cùng họ với nợ đã ghi ở
[`88-schema-convention-normalisation-plan.md`](88-schema-convention-normalisation-plan.md) về phạm vi kiểm kiểu.

### 2.4 Từ vựng trục tư duy khai là đóng nhưng không được ép

[`content-tagging.md`](../specs/01-platform/content-tagging.md) §7.1 khai ba trục là **từ vựng đóng**, trục `thinking`
đúng 12 giá trị. Cổng seed thì không ép:

```ts
// packages/db/src/seed-content/vocabulary.ts
const SLUG_REGEX = /^[a-z0-9_]{2,50}$/;
export function isValidTagForAxis(axis, tag) {
  if (set?.has(tag)) return true;
  return SLUG_REGEX.test(tag);          // ← bất kỳ slug nào cũng qua
}
```

Hệ quả đo được ngay trong seed hiện tại: `LES-0001` mang `thinking_tags: ["counting"]` và
`LES-0002` mang `["gross_motor_counting"]` — cả hai đều ngoài 12 giá trị (`count` mới là
giá trị hợp lệ). Cổng in "hợp lệ".

Đây là hỏng nặng hơn nó trông: trục `thinking` là thứ duy nhất trả lời được câu
"đã phủ đủ 6 loại hình tư duy chưa". Từ vựng trôi thì câu hỏi đó không đo được nữa.

**Đo lại bằng `pnpm --filter @mindkid/db report:tags` (2026-08-17) — độ lệch lớn hơn hai ví dụ ở trên nhiều:**

| Trục | Từ vựng Lớp 1 | Giá trị khác nhau trong seed | Ngoài từ vựng | Lượt gắn ngoài / tổng |
|---|---:|---:|---:|---|
| `what` | 14 | 130 | **120** | 120 / 241 |
| `thinking` | 12 | 122 | **116** | 120 / 241 |

Một nửa số lượt gắn tag nằm ngoài từ vựng. Không phải vài trường hợp lọt lưới — đó là
cách toàn bộ corpus nội dung đang được gắn tag.

**Và có hai từ vựng đóng khác nhau, không trùng một giá trị nào:**

| Nguồn | Trục `thinking` |
|---|---|
| [`content-tagging.md`](../specs/01-platform/content-tagging.md) §7.1 | `observe` `compare` `sort` `match` `sequence` `infer` `predict` `plan` `recall` `inhibit` `shift` `count` |
| `packages/db/src/seed-master/content-tags.ts` | `visual` `auditory` `spatial` `analytical` `abstract` `deductive` `inductive` `sequential` `associative` `critical` `flexible` `inhibitory` |

Giao của hai bộ là **rỗng**. Trục `what` cũng vậy. Nghĩa là bản cài đặt Lớp 1 chưa từng
thực thi từ vựng của spec, và nhánh dự phòng slug che mất cả hai lỗi suốt thời gian đó.

Hệ quả cho kế hoạch: bỏ nhánh dự phòng **không phải một dòng sửa**. Nó làm đỏ khoảng một
nửa số lượt gắn tag trên 139 nội dung đã seed, và trước đó phải chốt từ vựng nào thắng.
Xem câu hỏi mở 4 ở §7.

## 3. Assumptions và ranh giới

Ghi ra để bác được, không hỏi lại bằng multiple-choice.

1. **"Hàng trăm template" đọc là mục tiêu năng lực, không phải mục tiêu số đếm.** Không đề
   xuất seed 100 template. Đề xuất là hạ chi phí một template từ 11 nơi sửa tay xuống một
   file mô tả, để con số là quyết định sản phẩm chứ không phải trần kỹ thuật.
2. **Không đụng 6 template MVP.** `content_contract` của chúng đã publish; đổi là
   `BR-GTC-08` breaking change. Mọi spec mới dưới đây cộng thêm, không sửa hợp đồng cũ.
3. **Ba lỗ hổng ở §2.3 là defect thi công, không phải thiếu spec.**
   [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md) đã sở hữu "Vòng lặp render và ngân sách hiệu năng".
   Nên không viết spec render mới — ghi vào todo như lỗi phải sửa.
4. **Preload asset đã có chủ** — [`game-config-delivery.md`](../specs/04-play/game-config-delivery.md) owns "Quy tắc cache
   và preload asset". Không viết spec asset mới.
5. **Spec mới để `status: draft`.** Người quyết định approve, không phải tác giả.
6. **`mvp` chỉ đặt `true` khi thiếu nó thì hợp đồng đã publish không chạy đúng.** Đúng hai
   spec đạt mức đó: layout engine và nguồn ngẫu nhiên — vì `layouts` và `shuffle_*` đã nằm
   trong contract của 6 template MVP.

## 4. Sáu spec mới

| Spec | Khu vực | Phase | MVP | Vì sao chưa ai sở hữu |
|---|---|:--:|:--:|---|
| [`game-layout-engine.md`](../specs/01-platform/game-layout-engine.md) | platform | P1 | Có | `layouts: LayoutId[]` là trường trong `GameTemplate` nhưng không spec nào định nghĩa từ vựng hay hình học |
| [`deterministic-randomness.md`](../specs/01-platform/deterministic-randomness.md) | platform | P1 | Có | `shuffle_*` khai trong difficulty contract; không spec nào nói ngẫu nhiên lấy từ đâu và tái dựng thế nào |
| [`template-authoring-kit.md`](../specs/01-platform/template-authoring-kit.md) | platform | P4 | Không | [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) §4 mô tả 6 bước thêm template nhưng không sở hữu **chi phí** của 6 bước đó |
| [`lesson-session-runner.md`](../specs/04-play/lesson-session-runner.md) | play | P4 | Không | [`lesson-model.md`](../specs/05-content/lesson-model.md) sở hữu ràng buộc biên tập; [`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md) sở hữu luồng soạn. Không ai sở hữu luồng **chạy** một tiết học |
| [`lesson-exemplar-set.md`](../specs/05-content/lesson-exemplar-set.md) | content | P4 | Không | "Tiết học mẫu" chưa có định nghĩa nào phân biệt nó với một lesson thường |
| [`thinking-coverage-matrix.md`](../specs/08-quality/thinking-coverage-matrix.md) | quality | P3 | Không | Không cổng nào trả lời được "đã phủ đủ 6 loại hình tư duy chưa" |

## 5. Cách hai trục gặp nhau

Trục cơ chế và trục nội dung không cạnh tranh nhau — chúng nhân nhau:

```
số bài luyện tập khả dụng  =  số template  ×  số content_pack hợp lệ mỗi template
                              (trục cơ chế)   (trục nội dung)
```

Hôm nay: 6 × 20 = 120. Mở trục cơ chế lên 40 template với cùng mật độ nội dung cho 800.
Nhưng nhân với 0 thì vẫn là 0 — và ba lỗ hổng ở §2.3 đang giữ hệ số vẽ ở 0. Vì vậy thứ tự
làm là: sửa defect trước, layout và ngẫu nhiên tiếp, bộ kit sau cùng.

## 6. Thứ tự

| Bước | Việc | Chặn gì |
|---|---|---|
| 1 | Sửa 3 defect §2.3 | Mọi thứ. Không sửa thì không có màn chơi nào chạy |
| 2 | Đóng lỗ hổng từ vựng §2.4 | Không đo được phủ tư duy |
| 3 | Approve và thi công layout engine + nguồn ngẫu nhiên | `layouts` và `shuffle_*` thành thật |
| 4 | Approve [`thinking-coverage-matrix.md`](../specs/08-quality/thinking-coverage-matrix.md) | Trả lời được câu hỏi gốc bằng số |
| 5 | Approve và thi công [`template-authoring-kit.md`](../specs/01-platform/template-authoring-kit.md) | Template thứ 7 trở đi |
| 6 | Approve [`lesson-session-runner.md`](../specs/04-play/lesson-session-runner.md) cùng [`lesson-exemplar-set.md`](../specs/05-content/lesson-exemplar-set.md) | Tiết học mẫu |

## 7. Câu hỏi còn mở

| # | Câu hỏi | Chặn phase | Chủ |
|---|---|---|---|
| 1 | Trần số template nên là bao nhiêu trước khi bundle chơi cần tách theo template? Cần đo kích thước một Session class trung bình | P4 | đo được sau bước 5 |
| 2 | 12 giá trị trục `thinking` có đủ phủ 230 skill không? Trùng với [`content-tagging.md`](../specs/01-platform/content-tagging.md) §11 câu hỏi 1, giờ đo được vì §2.4 đã lộ rằng seed đang tự chế giá trị mới | P3 | Nội dung |
| 3 | Ai biên soạn bộ tiết học mẫu? Trùng nợ ở [`lesson-model.md`](../specs/05-content/lesson-model.md) §11 câu hỏi 1 | P4 | người quyết |
| 4 | **Từ vựng nào thắng?** [`content-tagging.md`](../specs/01-platform/content-tagging.md) §7.1 và `seed-master/content-tags.ts` khai hai bộ giao nhau rỗng, và seed thật dùng ~120 giá trị tự do ngoài cả hai. Ba lựa chọn: giữ bộ của spec và gắn lại tag cho 139 nội dung; nâng bộ seed-master lên thành spec; hoặc tách trục thứ tư cho tag mô tả tự do và giữ ba trục sư phạm đóng. Chặn cứng bước 2 ở §6 | P3 | người quyết |
