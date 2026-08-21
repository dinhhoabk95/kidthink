# Kế hoạch — Task #102: Đa dạng khuôn trò chơi cho một bài học (P5)

> **Loại task:** một lô đo lại cộng hai lô nội dung cộng một lô khuôn (XL).
> Checklist: [`102-template-diversity-todo.md`](102-template-diversity-todo.md).
> **Chặn bởi** [`Task #101`](101-legacy-v1-templates-plan.md) — lô kế thừa v1 phải xong trước
> vì mã `GT-025` cấp liền sau `GT-024`.
> **Spec đóng:** [`taxonomy-gap-batch.md`](../specs/01-platform/taxonomy-gap-batch.md) (P5, 10 rule,
> 8 scenario) · [`template-coverage-level-batch.md`](../specs/05-content/template-coverage-level-batch.md)
> (P5, 8 rule, 7 scenario) · [`lesson-template-variety.md`](../specs/05-content/lesson-template-variety.md)
> (P5, 8 rule, 8 scenario).

## 1. Outcome

Một bài học rèn một trong sáu năng lực tư duy chơi được bằng **nhiều hình dạng trò chơi khác
nhau**, và câu đó đo được bằng một con số chứ không phải bằng lời.

## 2. Bằng chứng đo được (2026-08-22)

Khảo sát bắt đầu từ câu hỏi "engine v1 còn ý tưởng game nào bổ sung được cho v2 không". Trả
lời: **không còn**. Mục 1 của
[`legacy-v1-template-batch.md`](../specs/01-platform/legacy-v1-template-batch.md) đã khảo sát
trọn 60 game type v1; 45 dạng phủ bởi `GT-001` tới `GT-017`, 13 dạng còn lại phủ bởi `GT-018`
tới `GT-024`, và đúng một cơ chế bị bỏ có ghi lý do (`free-create`). Chỗ thiếu nằm ở nơi khác.

| Đo | Con số | Nguồn |
|---|---|---|
| Khuôn engine có | 24 | `packages/game-engine/src/templates/` |
| Khuôn có game level thật | 8 (`GT-001` tới `GT-008`) | `packages/db/src/seed-content/` |
| Khuôn có nội dung bằng 0 | 16 (`GT-009` tới `GT-024`) | cùng nguồn |
| Activity `kind: digital_game` | 0 trên 81 | `packages/db/src/seed-content/activities/` |
| Giá trị trục `thinking` không `mechanic` nào sinh được | 2 (`inhibit`, `shift`) | mục 7.1 của [`content-tagging.md`](../specs/01-platform/content-tagging.md) |
| `game_templates` trong cơ sở dữ liệu dev | 281 hàng, gồm `GT-999`, `GT-212` do test sinh | truy vấn trực tiếp |
| Game level trong corpus không parse được bằng `content_contract` | 169 trên 172 | đối chiếu contract từng hàng |

Hai phát hiện đáng ghi riêng.

**Cổng đo phủ đang tắt và đọc nhầm nguồn.** `packages/db/tests/gates/thinking-coverage-config.json` để
`enforceFloors: false` trong khi `phase: P3` và `BR-TCM-04` nói chặn từ P3, nên mọi vi phạm
sàn thành cảnh báo. Cổng lại đọc cơ sở dữ liệu dev dùng chung với test tích hợp, và khi không
kết nối được thì trả danh sách rỗng rồi in "18 trên 18 ô thiếu" kèm mã thoát 0. Khi kết nối
được thì nó báo `C1 3-4: 1444` vì hàng nào không quy được competency đều bị gán mặc định `C1`.

**Trục `thinking` là hư cấu.** Danh sách hợp lệ trong mã cổng có 24 giá trị, gồm 12 giá trị
của spec cộng 12 "viết tắt seed-master" (`visual`, `analytical`, `inhibitory`, …) được thêm
vào để seed đang lệch đi qua được cổng. Bốn trong 12 giá trị thật (`sort`, `recall`,
`inhibit`, `shift`) không xuất hiện lần nào trong corpus.

## 3. Assumptions và ranh giới

1. Đa dạng thật cho trẻ quan trọng hơn số khuôn, nên nội dung xếp trước khuôn mới.
2. `free-create` vẫn không port. Mở lại cần quyết định sản phẩm về "hoàn thành khác với đúng".
3. 48 level của WP102.2 do người soạn nội dung viết, không sinh bằng AI trong lô này.
4. Task này **không** sửa 169 level đang lệch contract. Nó chặn con số đó to thêm và ghi việc
   sửa thành câu hỏi còn mở.
5. Trục `what` và trục `theme` vẫn đang nới. Task này đóng `thinking` và `mechanic`; hai trục
   còn lại là việc riêng.

## 4. Thứ tự

```
WP102.1  đo lại        →  WP102.2  nội dung 16 khuôn
                       →  WP102.3  luật bài học
                       →  WP102.4  ba khuôn mới
```

WP102.1 phải xong trước vì ba gói sau đều được nghiệm thu bằng con số mà nó khôi phục.

## 5. Work packages

| WP | Nội dung | Spec sở hữu |
|---|---|---|
| WP102.1 | Khôi phục phép đo: đổi nguồn sang corpus seed, bỏ giá trị mặc định, đóng trục `thinking` và `mechanic`, bật `enforceFloors`, gắn lại tag 170 level | [`thinking-coverage-matrix.md`](../specs/08-quality/thinking-coverage-matrix.md) |
| WP102.2 | 48 game level cho `GT-009` tới `GT-024`, theo bốn đợt ưu tiên năng lực đói | [`template-coverage-level-batch.md`](../specs/05-content/template-coverage-level-batch.md) |
| WP102.3 | Luật một bài học nhiều khuôn, cộng cổng đếm và ca âm | [`lesson-template-variety.md`](../specs/05-content/lesson-template-variety.md) |
| WP102.4 | `GT-025` `spot-difference` · `GT-026` `go-nogo` · `GT-027` `rule-switch` | [`taxonomy-gap-batch.md`](../specs/01-platform/taxonomy-gap-batch.md) |

## 6. Acceptance criteria

- Cổng phủ đọc corpus seed, và nguồn hỏng thì mã thoát khác 0.
- Mọi ô `competency × band tuổi` có ít nhất một level chạy trên khuôn ngoài `GT-001` tới `GT-008`.
- Mọi khuôn `GT-009` tới `GT-024` có ít nhất ba game level `published`.
- Mọi lesson `published` có ít nhất một bước chơi số; bài có hai bước thì hai khuôn khác nhau.
- Trục `thinking` có `inhibit`, `shift`, `sort`, `recall` khác 0.

## 7. Verification

```bash
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
cd /Users/macbook/tinimath/mindkid

npx tsx packages/db/tests/gates/thinking-coverage.test.ts; echo "exit=$?"
npx tsx packages/game-engine/tests/gates/templates.test.ts
npx tsx packages/gates/tests/lint-specs.test.ts && npx tsx packages/gates/src/lint-rule-ids.ts
npx tsx packages/db/src/seed-content/cli/seed-check.ts
npx vitest run --root scripts tests/lint-thinking-coverage.test.ts
pnpm check
```

## 8. Definition of done

Ba spec ở mục 5 chuyển `status: approved`, bốn work package tick hết trong checklist, và
`pnpm check` xanh mà không file cấu hình cổng nào bị nới.
