# Kế hoạch — Task #57: P3.4 — Chạy lộ trình chương trình

> Viết 2026-08-11, đo tại commit `484ebaf` trên working tree đang triển khai P0.9.
> Bước sở hữu: **P3.4** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`curriculum-player.md`](../specs/04-play/curriculum-player.md).
> Task trước: [`56-p3-3-curriculum-model-builder-plan.md`](56-p3-3-curriculum-model-builder-plan.md).
>
> ```sh
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

P3.4 là bước đầu tiên của P3 mà **trẻ chạm vào**. Player trả lời đúng một câu hỏi mỗi lần mở
sảnh: hôm nay học gì tiếp.

Bốn sự thật chi phối kế hoạch:

1. **Ghim có hai tầng, và spec chưa nói rõ.** `BR-CUR-04` ghim version curriculum lúc ghi danh;
   `D-AE` lại nói curriculum item đọc nội dung theo bản `published` mới nhất. Cả hai đều đúng và
   nói về hai thứ khác nhau — cấu trúc lộ trình so với nội dung của một item. Viết code trước khi
   tách rõ hai tầng là cách chắc chắn ghim nhầm tầng.
2. **Spec tự mâu thuẫn về số curriculum đồng thời.** Alt flow §5 cho phép ghi danh hai
   curriculum; câu hỏi mở số 2 đề xuất giới hạn một. Câu trả lời quyết định một ràng buộc DB mà
   Task #56 sẽ viết, nên phải chốt **trước** Task #56 T2, không phải khi P3.4 bắt đầu.
3. **Mẫu số tiến độ co giãn theo bậc quyền.** `BR-CUR-07` loại item khoá khỏi mẫu số, nên một
   trẻ bậc `standard` đạt 100% khi vẫn còn 25% chương trình chưa mở. Nâng bậc sau đó làm mẫu số
   to ra và tiến độ tụt xuống dưới 100% — trên một enrollment đã `completed`. Không spec nào nói
   chuyện gì xảy ra lúc đó.
4. **`BR-CUR-02` trích rule của một spec chưa tồn tại.** `BR-ADP-05` thuộc
   [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md), bước P3.5 — **sau** P3.4. Một
   acceptance criteria của P3.4 còn dùng `p_learn`, thứ chỉ có ở P3.5.

## 0. Điều kiện tiên quyết

### 0.1 Phụ thuộc và điều kiện vào

| Phụ thuộc | Bước | Điều kiện vào Task 2 trở đi |
|---|---|---|
| P3.3 | P3.3 | `week_no`/`session_no` là cột thật; `target_age_min/max`, `duration_weeks`, `sessions_per_week` đã có; ≥1 curriculum `published` |
| `ACCESS-GATING` | P1.3 | `allowedTiers()` và kiểm quyền theo item chạy được, gọi theo lô |
| `PLAY-SESSION-LIFECYCLE` | P1.6 | Phiên chơi ghi được kết quả để player biết item đã xong |
| `SCORING-AND-RESULT` | P1.7 | Định nghĩa "hoàn thành một item" |
| `PLAY-ENTRY-AND-PROFILE-SELECT` | P1.9 | Sảnh trẻ đã có; P3.4 thêm thẻ, không tạo sảnh thứ hai |
| `PARENT-GATE` | P1.8 | Cổng người lớn cho lời mời nâng cấp |
| `HEALTHY-PLAY-LIMITS` | P1.8 | Hạn mức giờ; player không được nói ngược với nó |
| `CHILD-PROFILE-CRUD` | P1.9 | Tuổi trẻ để kiểm band lúc ghi danh |
| `BASIC-REPORT` | P1.12 | Bề mặt người lớn xem tiến độ |

**Stop condition:** trước Task 2, phụ thuộc nào chưa `implemented` thì dừng Task #57.

### 0.2 Việc phải đẩy ngược vào Task #56 **trước** khi nó chạy T2

`D-MB` chốt số curriculum `active` tối đa cho một trẻ. Task #56 T2 viết ràng buộc unique cho
`curriculum_enrollments`; hai câu trả lời cho ra hai ràng buộc khác nhau:

| Chốt | Ràng buộc |
|---|---|
| Tối đa 1 curriculum `active` | Unique một phần trên `(child_id)` khi `status = 'active'` |
| Nhiều curriculum `active` | Unique một phần trên `(child_id, curriculum_id)` khi `status = 'active'` |

Sửa ràng buộc sau khi có dữ liệu ghi danh thật là việc khác hẳn. Chốt trước.

## 1. Đo được

### 1.1 Ghim có hai tầng, spec mới nói một

| Tầng | Ghim gì | Nguồn |
|---|---|---|
| Cấu trúc lộ trình | Version curriculum tại thời điểm ghi danh | `BR-CUR-04` · alt flow §5 · `D-LV` (Task #56) |
| Nội dung một item | Bản `published` mới nhất qua `entity_id`, **không** ghim | `D-AE` · câu hỏi mở số 1 đã đóng |
| Dữ liệu chơi đã xảy ra | Version thật đã chơi, ghim ở `play_sessions` | `D-AE` |

Ba tầng, ba quy tắc. Spec nói tầng 1 ở `BR-CUR-04` và tầng 2 ở phần đóng câu hỏi mở, nhưng không
chỗ nào đặt cạnh nhau. Hệ quả thực tế: manager sửa một lesson trong curriculum mà trẻ đang học
thì trẻ **thấy nội dung mới**, còn thứ tự và danh sách item thì **giữ nguyên bản đã ghi danh**.
Đó là hành vi có chủ đích và cần được viết ra, không để suy từ ba mảnh rời.

### 1.2 Spec tự mâu thuẫn về số curriculum đồng thời

| Nguồn | Nói gì |
|---|---|
| [`curriculum-player.md`](../specs/04-play/curriculum-player.md) §5 | "Trẻ ghi danh 2 curriculum — cho phép; sảnh hiện cái đang hoạt động gần nhất" |
| Cùng file, §11 câu hỏi 2 | Đề xuất "giới hạn tối đa 1 curriculum hoạt động đồng thời cho mỗi trẻ trong MVP" |

Một cái là alt flow đã viết như hành vi chốt; cái kia là đề xuất chưa duyệt. Hai cái cho ra hai
lược đồ DB, hai UI sảnh, và hai định nghĩa cho `GET /curriculum/next`.

### 1.3 Mẫu số tiến độ co giãn, và không ai định nghĩa chuyện xảy ra khi nó giãn

`BR-CUR-07` và §7.2 đặt mẫu số là "item bắt buộc, **mở được với quyền hiện tại**". Acceptance
criteria: 20 item bắt buộc, 5 premium, trẻ bậc `standard` xong 15 → `curriculum_progress` là
`1.0`.

Ba hệ quả chưa được nói:

1. Trẻ đạt 100% trong khi 25% chương trình chưa từng mở. §4 bước 6 nói xong curriculum thì hiện
   màn hình hoàn thành — nên trẻ nhận màn hình đó.
2. Người lớn nâng bậc sau đó: mẫu số thành 20, tử số 15, tiến độ tụt về 0.75 trên một enrollment
   đã `completed`. Không rule nào nói `completed` có mở lại được không.
3. Hạ bậc hoặc hết hạn gói: mẫu số co lại, tiến độ có thể nhảy lên 100% mà trẻ không chơi gì.

### 1.4 Tuần toàn item khoá tự mở, không ai chơi

`BR-CUR-03` mở tuần khi xong mọi item **bắt buộc**; `BR-CUR-05` nói item khoá bậc không chặn
tiến độ. Ghép lại: một tuần mà mọi item bắt buộc đều khoá thì tập "item bắt buộc mở được" rỗng,
điều kiện mở tuần thoả ngay lập tức, và tuần tự hoàn thành với 0 phút chơi.

Với một curriculum nghiêng về bậc trả phí, một trẻ bậc `free` có thể đi hết lộ trình trong vài
giây và nhận màn hình hoàn thành. Không rule nào chặn, và không rule nào cấm ghi danh vào
curriculum mà trẻ không mở được item bắt buộc nào.

### 1.5 Tiến độ có thể đếm hai lần

[`curriculum.ts`](../../packages/db/src/schema/curriculum.ts) khai `curriculum_item_progress`
với `enrollment_id`, `child_id`, `curriculum_item_id`, `status`, `completed_at` — **không có
unique** trên `(enrollment_id, curriculum_item_id)`. Hai lần ghi hoàn thành cùng một item tạo
hai hàng, tử số tăng hai, tiến độ vượt mẫu số. Chơi lại một item là chuyện bình thường với trẻ,
nên đây không phải ca hiếm.

`child_id` cũng lặp lại trong bảng con mà không có khoá ngoại; nó có thể lệch với
`enrollment.child_id`.

### 1.6 "Bước hiện tại" định nghĩa bằng từ vựng trước `D-LS`

§4 bước 2 nói bước hiện tại là "item chưa hoàn thành có `position` nhỏ nhất trong tuần hiện
tại". Sau `D-LS` của Task #56, thứ tự đầy đủ là `(week_no, session_no, position)`. Định nghĩa
hiện tại bỏ qua `session_no`, và "tuần hiện tại" chưa được định nghĩa bằng gì — tuần nhỏ nhất
còn item bắt buộc mở được chưa xong, hay tuần đã mở gần nhất.

### 1.7 `BR-CUR-02` trích rule của phase sau

`BR-CUR-02` dẫn `BR-ADP-05` của
[`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md), bước **P3.5**. Acceptance
criteria "Given trẻ ở tuần 3 và mọi skill đều `p_learn` ≥ 0.9" cần mastery state, cũng của P3.5.

Cạnh này không đảo được theo hướng ngược — adaptive cần player tồn tại để có chỗ cắm. Nên P3.4
phải để lại một chỗ nối rõ ràng và một ca kiểm chứng minh chỗ nối **không** nhảy bước, thay vì
chờ P3.5 hoặc kéo P3.5 lên sớm.

### 1.8 `GET /curriculum/next` là truy vấn nóng nhất của bề mặt trẻ

Nó chạy mỗi lần mở sảnh, và mỗi lần cần: enrollment đang hoạt động · item của curriculum version
đã ghim · tiến độ từng item · quyền theo bậc cho từng item · phân giải `entity_id` sang bản
`published` mới nhất. Làm ngây thơ là một truy vấn cho mỗi item.

Gating theo lô là bắt buộc, không phải tối ưu hoá sớm: một tuần có 5–6 item và một curriculum 42
tuần có hơn 120 item.

### 1.9 Bốn trạng thái ghi danh, ba luồng

§7.1 khai `active` · `completed` · `withdrawn` · `paused`. Alt flow mô tả `withdrawn`; §4 bước 6
ngụ ý `completed`. **`paused` không có luồng nào** — không biết ai đặt, đặt khi nào, và khác
`withdrawn` chỗ nào.

## 2. Quyết định

**D-MA — Ba tầng ghim được viết thành một bảng trong spec sở hữu.** Cấu trúc lộ trình ghim
version curriculum lúc ghi danh. Nội dung item theo bản `published` mới nhất qua `entity_id`.
Dữ liệu chơi đã xảy ra ghim version thật ở `play_sessions`. Ba dòng, một chỗ. Mọi truy vấn của
player đi qua enrollment (theo `D-LV`), không qua `child_profiles.current_curriculum_id`.

**D-MB — Tối đa **một** enrollment `active` cho mỗi trẻ ở MVP.** Đóng câu hỏi mở số 2 theo đề
xuất đã ghi; sửa alt flow §5 cho khớp, không để hai câu trái nhau cùng tồn tại. Ghi danh khi đã
có enrollment `active` → 409 `ALREADY_ENROLLED` kèm code curriculum đang học. Muốn đổi thì rút
trước. Ràng buộc DB là unique một phần trên `(child_id)` khi `status = 'active'` — **đẩy ngược
vào Task #56 T2**. Nhiều enrollment đồng thời là việc của P4, không phải việc bị chặn.

**D-MC — Hoàn thành một item là thao tác idempotent.** Unique `(enrollment_id,
curriculum_item_id)` trên `curriculum_item_progress`; ghi hoàn thành dùng upsert, lần thứ hai
không đổi `completed_at` đầu tiên. Bỏ `child_id` khỏi bảng con hoặc thêm ràng buộc buộc nó khớp
`enrollment.child_id` — không để hai nguồn. Trẻ chơi lại một item vẫn được ghi phiên chơi mới ở
`play_sessions`; tiến độ curriculum không đổi.

**D-MD — Đổi bậc quyền tính lại mẫu số, và `completed` mở lại được một cách có chủ đích.** Tiến
độ luôn tính tại thời điểm đọc theo `BR-CUR-07`; không lưu số đã tính. Khi mẫu số giãn ra làm
tiến độ tụt dưới 1.0, enrollment `completed` quay lại `active` và bề mặt **người lớn** nhận thông
báo "chương trình có thêm nội dung mở khoá". Bề mặt trẻ không nhận thông báo nào mang tính
thương mại (`BR-CUR-06`). Khi mẫu số co lại làm tiến độ đạt 1.0, **không** tự đặt `completed` —
chuyển sang `completed` chỉ xảy ra khi trẻ thực sự hoàn thành item cuối cùng.

**D-ME — Tuần rỗng-vì-khoá không tự hoàn thành, và ghi danh bị chặn khi lộ trình không mở
được.** Một tuần chỉ mở tuần kế tiếp khi trẻ **hoàn thành ít nhất một item** trong tuần đó. Tuần
mà mọi item bắt buộc đều khoá bậc hiện dạng "cần nâng cấp để đi tiếp", với lời mời trên bề mặt
người lớn — không tự nhảy qua. Ghi danh vào curriculum mà trẻ không mở được **item bắt buộc nào**
trả 422 kèm lý do bậc, thay vì cho ghi danh rồi hoàn thành trong ba giây. Đây là nới `BR-CUR-05`
đúng một chỗ: item khoá lẻ không chặn tiến độ, nhưng một tuần toàn khoá thì chặn.

**D-MF — Chỗ nối adaptive là một hàm chọn biến thể, mặc định không làm gì.** P3.4 định nghĩa
`selectVariant(item, context)` trả về chính item khi chưa có adaptive; P3.5 thay phần thân. P3.4
**không** import [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) và không đọc
mastery state. Ca kiểm của `BR-CUR-02` ở P3.4 chứng minh chỗ nối **không thể** đổi
`(week_no, session_no, position)`; ca kiểm dùng `p_learn` chuyển sang P3.5 và ghi rõ là nợ của
bước đó, không xoá.

**D-MG — "Bước hiện tại" định nghĩa lại theo `D-LS`, và `paused` được đặt tên hoặc bị bỏ.** Bước
hiện tại là item chưa hoàn thành, mở được, nhỏ nhất theo `(week_no, session_no, position)`,
trong tuần nhỏ nhất còn item bắt buộc mở được chưa xong. `paused` phải có đúng một luồng đặt và
một luồng thoát; không định nghĩa được thì bỏ khỏi enum ở Task #56 T2 thay vì giữ một trạng thái
không ai đặt.

## 3. Contract chốt trước code

```text
POST   /api/users/children/{uuid}/enrollments            body { curriculum_code }
                                                          201 · 409 ALREADY_ENROLLED (D-MB) · 422 tuổi/bậc (D-ME)
POST   /api/users/children/{uuid}/enrollments/{id}/withdraw
GET    /api/users/children/{uuid}/curriculum/next        → §7.3 · 404 chưa ghi danh
GET    /api/users/children/{uuid}/curriculum/progress    → tiến độ tính tại thời điểm đọc (D-MD)
```

```ts
interface NextStep {
  week_no: number;
  session_no: number;
  item: { entity_type: "lesson" | "game_level"; entity_code: string; locked: boolean };
  week_progress: { done: number; total: number };
  curriculum_progress: number;
  week_blocked_by_tier: boolean;   // D-ME
}

// D-MF — chỗ nối adaptive, P3.4 trả về chính item
type SelectVariant = (item: CurriculumItemRef, ctx: PlayContext) => CurriculumItemRef;
```

## 4. Đồ thị phụ thuộc

```text
T0 preflight + đẩy D-MB ngược vào Task #56
 └──→ T1 sửa contract D-MA…D-MG + human approve
       ├──→ T2 ràng buộc idempotency và enrollment
       │     └──→ T3 engine bước kế tiếp + tiến độ
       │           ├──→ T4 ghi danh và rút
       │           ├──→ T5 gating theo lô + tuần khoá
       │           │     └──→ T6 chỗ nối adaptive
       │           └──→ T7 sảnh trẻ và bề mặt người lớn
       └──→ T8 evidence và promote
```

## 5. Task

### Task 0 — Preflight và cảnh báo sớm cho Task #56

**Tiêu chí nghiệm thu**

- [ ] P3.3 `implemented`; có ≥1 curriculum `published` với đủ `week_no`, `session_no`.
- [ ] Chốt `D-MB` **trước** Task #56 T2; nếu T2 đã chạy thì ghi lại ràng buộc hiện có và chi phí
      sửa.
- [ ] Xác nhận `paused` có luồng hay bị bỏ (`D-MG`), trước khi Task #56 T2 tạo enum.
- [ ] Đo lại [`curriculum.ts`](../../packages/db/src/schema/curriculum.ts) sau P3.3.

**Kiểm chứng:** `node packages/gates/scripts/check-progress.ts` xanh tới P3.3; báo cáo preflight ghi constraint enrollment
và enum status thật trước T1.

**Phụ thuộc:** P3.3 · **Cỡ:** S

### Task 1 — Sửa contract trước code

**Tiêu chí nghiệm thu**

- [ ] Người sở hữu phê duyệt `D-MA`…`D-MG`; `D-MB` và `D-ME` duyệt riêng vì đổi hành vi người dùng.
- [ ] Bảng ba tầng ghim của `D-MA` vào
      [`curriculum-player.md`](../specs/04-play/curriculum-player.md) §7.
- [ ] Alt flow "ghi danh 2 curriculum" sửa khớp `D-MB`; câu hỏi mở số 2 đóng.
- [ ] `BR-CUR-*` mới cho `D-MD` và `D-ME` được thêm, có mã kế tiếp và lý do.
- [ ] Định nghĩa "bước hiện tại" viết lại theo `(week_no, session_no, position)`.
- [ ] Acceptance criteria dùng `p_learn` chuyển sang nợ của P3.5, ghi rõ, không xoá.
- [ ] `paused` có luồng hoặc bị bỏ.
- [ ] Không thêm spec mới; không thêm mã lỗi ngoài
      [`error-codes.md`](../specs/00-foundation/error-codes.md).

**Kiểm chứng:** `pnpm --filter @mindkid/gates test` 0 lỗi, 0 cảnh báo mới.

**Phụ thuộc:** T0 · human decision · **Cỡ:** M

### Checkpoint A — Contract

- [ ] T0 và T1 xanh; `D-MB` đã phản hồi về Task #56.
- [ ] Không migration, route hay UI nào viết trước checkpoint này.

### Task 2 — Ràng buộc idempotency và enrollment

**Tiêu chí nghiệm thu**

- [ ] **Test âm trước:** hai hàng `curriculum_item_progress` cùng
      `(enrollment_id, curriculum_item_id)` là **đỏ**.
- [ ] Unique `(enrollment_id, curriculum_item_id)`; ghi hoàn thành bằng upsert.
- [ ] `child_id` ở bảng con bị bỏ, hoặc có ràng buộc buộc khớp `enrollment.child_id`.
- [ ] Ràng buộc `D-MB` có mặt và đúng dạng; nếu Task #56 đã tạo dạng khác thì migration sửa và
      abort khi có dữ liệu.
- [ ] Index cho đường `next`: `(enrollment_id, status)` và
      `(curriculum_id, week_no, session_no, position)`.
- [ ] Migration từ DB rỗng xanh; ca lỗi rollback cả transaction.

**Kiểm chứng:** `pnpm db:migrate` trên DB rỗng · `pnpm test -- enrollment-migration` xanh.

**Phụ thuộc:** Checkpoint A · **Cỡ:** M

### Task 3 — Engine bước kế tiếp và tiến độ

**Tiêu chí nghiệm thu**

- [ ] Bước hiện tại đúng `D-MG`; test có ca tuần thiếu buổi và ca buổi thiếu item.
- [ ] Mẫu số theo `BR-CUR-07`, tính tại thời điểm đọc, không lưu.
- [ ] `D-MD`: nâng bậc làm tiến độ tụt và enrollment `completed` quay lại `active`; hạ bậc làm
      tiến độ đạt 1.0 nhưng **không** tự đặt `completed`.
- [ ] `BR-CUR-03`: item tuỳ chọn không chặn mở tuần.
- [ ] `BR-CUR-08`: nghỉ dài không đổi bước, không sinh thông báo trách móc; test giả lập 3 tuần
      không chơi.
- [ ] Ghi hoàn thành hai lần không đổi tử số (`D-MC`).
- [ ] Nội dung item phân giải theo bản `published` mới nhất, cấu trúc theo version đã ghim
      (`D-MA`); test publish version mới của lesson và của curriculum để phân biệt hai tầng.

**Kiểm chứng:** `pnpm test -- curriculum-next curriculum-progress` xanh; mỗi `BR-CUR-*` xuất
hiện trong tên test.

**Phụ thuộc:** T2 · **Cỡ:** 2 work package M — next-step engine và progress engine; mỗi
package ≤5 files

### Checkpoint B — Enrollment state và progress engine

- [ ] Migration idempotency và engine next/progress cùng xanh.
- [ ] Version ghim, mẫu số quyền và nghỉ dài có ca biên.
- [ ] Full gate hiện tại xanh trước khi mở route ghi danh.

### Task 4 — Ghi danh và rút

**Tiêu chí nghiệm thu**

- [ ] `POST .../enrollments` nhận `curriculum_code`, phân giải sang version `published` hiện tại
      và ghim.
- [ ] 409 `ALREADY_ENROLLED` khi đã có enrollment `active` (`D-MB`), kèm code đang học.
- [ ] 422 khi tuổi trẻ ngoài `[target_age_min, target_age_max]`.
- [ ] 422 khi trẻ không mở được item bắt buộc nào (`D-ME`), nêu lý do bậc.
- [ ] Rút đặt `withdrawn` và **giữ** tiến độ; ghi danh lại tạo enrollment mới, không xoá bản cũ.
- [ ] Mọi chuyển trạng thái enrollment ghi `audit_logs`.

**Kiểm chứng:** `pnpm test -- enrollment` xanh.

**Phụ thuộc:** T3 · **Cỡ:** M

### Task 5 — Gating theo lô và tuần khoá

**Tiêu chí nghiệm thu**

- [ ] Quyền cho toàn bộ item của một tuần kiểm **một lần theo lô**, không một truy vấn mỗi item;
      test đo số truy vấn.
- [ ] `BR-CUR-05`: item khoá lẻ không chặn tiến độ.
- [ ] `D-ME`: tuần mà mọi item bắt buộc đều khoá **không** tự mở tuần sau; trả
      `week_blocked_by_tier: true`.
- [ ] Mở tuần kế tiếp cần trẻ hoàn thành ít nhất một item trong tuần hiện tại.
- [ ] Item khoá vẫn hiện trong danh sách kèm ổ khoá trung tính (`BR-CUR-06`).
- [ ] `GET /curriculum/next` cho curriculum 42 tuần chạy dưới ngưỡng đã đặt cho bề mặt trẻ.

**Kiểm chứng:** `pnpm test -- curriculum-gating` xanh, gồm test đếm truy vấn.

**Phụ thuộc:** T3 · P1.3 · **Cỡ:** M

### Checkpoint C — Ghi danh và gating

- [ ] Enrollment lifecycle, batch gating và tuần bị khoá cùng xanh.
- [ ] Ownership/entitlement ở server; không N+1 theo số item.
- [ ] Human review diff route/gating trước seam adaptive và UI.

### Task 6 — Chỗ nối adaptive

**Tiêu chí nghiệm thu**

- [ ] `selectVariant` tồn tại, mặc định trả chính item; P3.4 không import
      [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) và không đọc mastery state.
- [ ] Test chứng minh chỗ nối **không thể** đổi `(week_no, session_no, position)` —
      implementation giả cố nhảy bước làm test **đỏ** (`BR-CUR-02`).
- [ ] Nợ ca kiểm `p_learn` được ghi rõ là của P3.5, có liên kết hai chiều giữa hai task.

**Kiểm chứng:** `pnpm test -- curriculum-adaptive-seam` xanh.

**Phụ thuộc:** T5 · **Cỡ:** S

### Task 7 — Sảnh trẻ và bề mặt người lớn

**Tiêu chí nghiệm thu**

- [ ] Thẻ "Tiếp tục" thêm vào sảnh trẻ đã có; không tạo sảnh thứ hai.
- [ ] `BR-CUR-01`: quét bề mặt trẻ, không control nào cho chọn tuần hay nhảy bước.
- [ ] `BR-CUR-06`: bề mặt trẻ chỉ có ổ khoá trung tính, không giá, không nút mua; lời mời nâng
      cấp nằm sau cổng người lớn.
- [ ] Màn hình hoàn thành curriculum hiện đúng lúc theo `D-MD`, và gợi ý curriculum tiếp.
- [ ] Người lớn xem được tiến độ và tuần hiện tại; thông báo "có thêm nội dung mở khoá" chỉ ở
      bề mặt người lớn.
- [ ] Không thông báo nào trách móc trẻ vì nghỉ lâu (`BR-CUR-08`).
- [ ] Bề mặt trẻ đạt yêu cầu của
      [`accessibility.md`](../specs/08-quality/accessibility.md) và không giả định trẻ biết đọc.
- [ ] Player không nói ngược hạn mức giờ của
      [`healthy-play-limits.md`](../specs/04-play/healthy-play-limits.md).

**Kiểm chứng:** `pnpm test:e2e -- curriculum-player` xanh.

**Phụ thuộc:** T4 · T5 · P1.9 · **Cỡ:** 2 work package M — sảnh trẻ và bề mặt người lớn; mỗi
package ≤5 files

### Checkpoint D — Player end-to-end

- [ ] Seam adaptive không thể đổi bước; child/adult surfaces giữ đúng ranh giới thương mại.
- [ ] Journey keyboard/no-reading-assumption và 8 tuần thật xanh.
- [ ] Full gate + human review UI xanh trước promote.

### Task 8 — Evidence và promote P3.4

**Tiêu chí nghiệm thu**

- [ ] Mỗi `BR-CUR-*` có ít nhất một test tham chiếu bằng mã rule trong tên test.
- [ ] Một trẻ thật đi hết một curriculum 8 tuần từ ghi danh tới màn hình hoàn thành.
- [ ] [`curriculum-player.md`](../specs/04-play/curriculum-player.md) sang `implemented`.
- [ ] Nợ ca kiểm adaptive ghi rõ ở P3.5, không tick nhầm ở P3.4.
- [ ] Tick **P3.4** trong Task #14 chỉ khi `node packages/gates/scripts/check-progress.ts` tự xanh.

**Kiểm chứng:**
`pnpm check && pnpm test && pnpm test:e2e && pnpm --filter @mindkid/gates test && node packages/gates/scripts/check-progress.ts` xanh.

**Phụ thuộc:** T6 · T7 · **Cỡ:** S

## 6. Rủi ro

| Rủi ro | Hậu quả | Giảm thiểu |
|---|---|---|
| Ghim nhầm tầng | Sửa lesson không tới được trẻ, hoặc thứ tự đổi giữa chừng | `D-MA` — bảng ba tầng, test phân biệt hai lần publish |
| Chốt số curriculum đồng thời sau khi có dữ liệu | Đổi ràng buộc unique trên bảng đã có ghi danh thật | `D-MB` đẩy ngược vào Task #56 T2 |
| Đếm hoàn thành hai lần | Tiến độ vượt 100%, mất niềm tin vào báo cáo | `D-MC` — unique + upsert |
| Mẫu số giãn im lặng | Trẻ "hoàn thành" rồi tụt về 75% không lời giải thích | `D-MD` — mở lại `active` + báo bề mặt người lớn |
| Tuần toàn khoá tự mở | Trẻ bậc thấp đi hết curriculum trong vài giây | `D-ME` — chặn mở tuần và chặn ghi danh |
| Một truy vấn mỗi item | Sảnh trẻ chậm trên curriculum 42 tuần | Gating theo lô + test đếm truy vấn |
| Kéo adaptive lên sớm | P3.4 phụ thuộc spec chưa có | `D-MF` — chỗ nối no-op, nợ ghi rõ ở P3.5 |
| Nội dung thương mại lọt bề mặt trẻ | Vi phạm `BR-CUR-06` và `BR-PEN-04` | Quét bề mặt trẻ trong E2E |
| `paused` không ai đặt | Trạng thái chết trong enum, code phòng thủ vô ích | `D-MG` — có luồng hoặc bỏ |

## 7. Ngoài phạm vi

- Mastery, `p_learn`, chọn biến thể thật — P3.5.
- Gợi ý game kế tiếp ngoài curriculum — P3.6.
- Báo cáo nâng cao theo curriculum — P3.7.
- Nhiều curriculum hoạt động đồng thời cho một trẻ — P4.
- Trẻ hoặc người lớn tự sắp lại thứ tự lộ trình — P4.
- Lịch và nhắc theo ngày — trái `BR-CUR-08`.
- Auto-merge, migration ngoài local.

## 8. Giả định và điều kiện dừng

1. P3.3 đã giao `week_no`, `session_no`, `duration_weeks`, band tuổi và ≥1 curriculum `published`.
2. [`access-gating.md`](../specs/04-play/access-gating.md) gọi được theo lô; nếu chỉ có API một
   item thì mở rộng ở spec sở hữu nó, không viết bản thứ hai trong player.
3. "Hoàn thành một item" lấy định nghĩa từ [`scoring-and-result.md`](../specs/04-play/scoring-and-result.md),
   P3.4 không tự định nghĩa lại.
4. `D-MB`, `D-MD` và `D-ME` là **đề xuất** cho tới khi người sở hữu duyệt; `D-MB` phải chốt sớm
   nhất vì nó chặn Task #56 T2.
5. Task #57 không bắt đầu implementation khi P3.3 còn đỏ.
