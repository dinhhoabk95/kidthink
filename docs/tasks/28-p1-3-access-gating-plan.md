# Kế hoạch — Task #28: P1.3 — Gating trước nội dung

> Viết 2026-08-09. Bước sở hữu: **P1.3** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`access-gating.md`](../specs/04-play/access-gating.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

**Cổng doanh thu.** Nguyên tắc 3 của [`roadmap.md`](../specs/roadmap.md) nói thẳng: seed 120
game level trước khi có gating nghĩa là 120 level được cho không trong khoảng thời gian đó. Và
nội dung đã phát tán thì không thu lại được — khác mọi bug khác của P1, bug ở đây **không sửa
ngược được**.

Bước này nhỏ về code và lớn về hệ quả: một middleware `assertContentAccess()`, bảy bước theo
**thứ tự cố định**, và một ma trận **20 ô** phải có test.

[`access-ladder.md`](../specs/00-foundation/access-ladder.md) (P0.5) sở hữu *luật*. Bước này
sở hữu *thứ tự thực thi* và *ma trận test*. Không viết lại luật ở đây.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `ACCESS-LADDER` · `ENTITLEMENT-MODEL` | P0.5 | bốn bậc, `allowedTiers()`, `BR-LAD-04/05/08/09` |
| `ACTORS` | P0.3 đã xong | `BR-ACT-07` — không tin giá trị client gửi lên |
| `AUTH-TOKENS-SESSIONS` | P0.3 đã xong | `requireUserAuth()` |
| `AUDIT-LOG` | P0.11 | hành động cần audit đã có registry |
| `GAME-TEMPLATE-CONTRACT` | P1.2 | có nội dung thật để chặn |

Bước này **đứng trước** P1.4 và trước mọi seeder nội dung. Đó là toàn bộ lý do nó tồn tại
thành một bước riêng.

## 1. Đo được

### 1.1 Đã có sau P0.5

Bốn bậc `free` / `login` / `standard` / `premium`, hàm `allowedTiers(caller)`, bảng
`entitlements` và `package_entitlements`. Luật `BR-LAD-*` đã `implemented`.

### 1.2 Chưa có

`assertContentAccess()` chưa tồn tại. Chưa handler nào trả nội dung — nên đây là **thời điểm
duy nhất** middleware này có thể là đường **duy nhất**, trước khi có 30 handler để đi vá.

### 1.3 Hai câu hỏi mở chặn P1

| Câu | Chủ | Xử |
|---|---|---|
| Q1 — gộp `login` vào `standard` được không? | người quyết | `D-FN` |
| Q2 — `age_mismatch` cảnh báo ở đâu? | Studio UI | `D-FP` |

## 2. Quyết định

**D-FM — 20 ô là **một bảng dữ liệu**, test sinh từ bảng.** Viết 20 test tay là 20 chỗ để chép
nhầm, và ô thứ 21 (khi thêm bậc hoặc thêm trạng thái người gọi) sẽ không ai nhớ thêm. Khai bảng
§7.1 thành dữ liệu; test duyệt **tích Descartes** của trạng thái người gọi × bậc và đối chiếu.
Thêm một bậc mà quên khai ô → test **đỏ vì thiếu ô**, không phải xanh vì không ai kiểm.

**D-FN — P1 **không** gộp `login` vào `standard`; câu hỏi §11 Q1 đóng lại bằng đo.** Bậc
`login` khác `free` ở chỗ **lưu tiến độ**. Gộp nó vào `standard` nghĩa là trẻ chưa mua gói
không lưu được tiến độ — mất lối vào miễn phí có giá trị nhất, và mâu thuẫn với ô "User, đã
chọn trẻ, không gói → `login` = 200" trong ma trận. Chi phí giữ bốn bậc: 20 ô thay vì 15. Chi
phí gộp sau khi đã seed entitlement: đổi dữ liệu + đổi ma trận + đổi mọi level đã gắn tier. Giữ
nguyên. **Nếu chủ bác quyết định này**, đổi ở đây là: bảng §7.1 còn 15 ô, `access_tier` mất một
giá trị enum → migration, và `package_entitlements` phải ánh xạ lại — làm **trước** P1.10, không
sau.

**D-FO — `assertContentAccess()` là đường **duy nhất**, và cổng canh việc đó.** `BR-GAT-01`
nói kiểm ở server handler. Nhưng "mọi handler trả nội dung" là câu chỉ đúng nếu có cổng đếm.
Xử: khai danh sách handler trả nội dung dạng dữ liệu; cổng quét route mới trả `content_pack`
hoặc `difficulty_params` mà **không** gọi `assertContentAccess` → **đỏ**. Cùng khuôn với ma
trận role của P0.11b (`D-EY`): mặc định mở là chế độ hỏng tệ nhất ở đây.

**D-FP — `age_mismatch` là **cờ trong payload**, chỗ hiện là việc của UI.** §11 Q2 hỏi hiện
cảnh báo ở đâu. Tách hai phần: server **luôn** trả cờ (bước 7 của §4, không chặn chơi); nơi
hiện là quyết định của Studio UI ở P1.8/P1.12. Bước này không chờ câu trả lời đó, nhưng ghi
tường minh: cảnh báo nhắm **người lớn**, không nhắm trẻ (`BR-ENG-11` cấm gây áp lực cho trẻ).

**D-FQ — preview tách ở **tầng dữ liệu**, không ở tầng báo cáo.** `BR-GAT-08`: cột
`play_sessions.is_preview` tồn tại để tách hai luồng ngay từ đầu. Cấm giải pháp "lọc preview
lúc dựng báo cáo" — lọc sót một chỗ là báo cáo nói sai về con của một phụ huynh thật.

## 3. Đồ thị

```
T1 bảng 20 ô + allowedTiers wiring (dữ liệu)
      └──→ T2 assertContentAccess — bảy bước đúng thứ tự
                ├──→ T3 ownership trẻ bằng DB query + ca âm cookie giả
                ├──→ T4 403 strip nội dung + metadata gate
                ├──→ T5 preview Manager, is_preview ở tầng dữ liệu
                └──→ T6 cổng "handler trả nội dung phải gọi gating"
                          └──→ T7 property test bao hàm + 20 ô sinh từ bảng
                              ── Cổng dừng ──
  T8 evidence, promote
```

## 4. Task

### Task 1 — Ma trận thành dữ liệu

**Tiêu chí nghiệm thu**
- [ ] Năm trạng thái người gọi §2 khai thành enum: `guest`, `user_no_child`, `user_child_no_pkg`, `user_standard`, `user_premium`.
- [ ] Bảng §7.1 khai thành dữ liệu 5×4, giá trị là mã HTTP kỳ vọng (`D-FM`).
- [ ] Thiếu một ô → **lỗi biên dịch hoặc test đỏ**, không phải mặc định cho phép.
- [ ] `upgrade_package_codes` lấy từ `package_entitlements`, không hằng số.

**Kiểm chứng**
- [ ] `pnpm test -- gating-matrix` đếm đúng 20 ô.

**Phụ thuộc:** P0.5 · **Cỡ:** S

### Task 2 — `assertContentAccess()`, bảy bước

**Tiêu chí nghiệm thu**
- [ ] Chữ ký đúng §8: nhận `event`, `content`, `opts.requiresChild`; trả `{ child_id, is_preview, age_mismatch }`.
- [ ] Bảy bước đúng **thứ tự cố định** §4 (`BR-GAT-02`): tồn tại/published → tier hiệu lực `max(tier)` (`BR-LAD-05`) → ngữ cảnh người gọi → 428 nếu thiếu trẻ → so bậc → quota → tuổi.
- [ ] `404 trước 403 trước 428 trước 402` — ca âm cho **từng** cặp thứ tự.
- [ ] Level `draft` hoặc `archived` → **404**, không 403 (không rò rỉ tồn tại).
- [ ] Hết quota → **402** `DAILY_PLAY_CAP_REACHED`, chỉ sau khi đã qua bước quyền.
- [ ] Tuổi ngoài khoảng → **200** + `age_mismatch: true`, **không** chặn (`D-FP`).
- [ ] Entitlement hết hạn giữa phiên → phiên đang mở chạy tiếp, yêu cầu mới bị chặn (`BR-LAD-08`).
- [ ] Mã lỗi khớp registry: `NOT_FOUND` `NO_ACTIVE_CHILD` `TIER_LOCKED` `DAILY_PLAY_CAP_REACHED`.

**Kiểm chứng**
- [ ] `pnpm test -- access-gating` xanh, assertion tham chiếu `BR-GAT-02`.

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 3 — Ownership trẻ

**Tiêu chí nghiệm thu**
- [ ] `BR-GAT-04`: `active_child_id` kiểm bằng **DB query**, không đọc thẳng từ cookie.
- [ ] Ca âm: cookie của User A trỏ trẻ của User B → **404** (không phải 403).
- [ ] `BR-GAT-07`: bỏ token/cookie **không** mở thêm quyền — ca âm gọi lại toàn bộ catalog bằng curl không cookie → mọi bậc ≠ `free` đều 403.
- [ ] Ca âm token hết hạn và token của audience Manager → không đi vòng được (dùng lại test cross-audience P0.3).

**Kiểm chứng**
- [ ] `pnpm test -- child-ownership` xanh, assertion tham chiếu `BR-GAT-04` `BR-GAT-07`.

**Phụ thuộc:** T2 · **Cỡ:** S

### Task 4 — Chặn thì chặn sạch

**Tiêu chí nghiệm thu**
- [ ] `BR-GAT-03`: 403 **strip** `content_pack` và `difficulty_params`; ca âm quét body.
- [ ] 403 mang `required_entitlement` và `upgrade_package_codes` (§7.2 + [`access-ladder.md`](../specs/00-foundation/access-ladder.md) §7.3).
- [ ] Ca âm: 403 **không** rò tên level, mô tả, hay bất kỳ trường nội dung nào ngoài metadata gate.
- [ ] 404 không phân biệt được "không tồn tại" với "chưa published" từ phía client.

**Kiểm chứng**
- [ ] `pnpm test -- gate-metadata` xanh, assertion tham chiếu `BR-GAT-03`.

**Phụ thuộc:** T2 · **Cỡ:** S

### Task 5 — Preview của Manager

**Tiêu chí nghiệm thu**
- [ ] Preview bỏ qua bước 5–6 (bậc và quota), đặt `is_preview = true`.
- [ ] `BR-GAT-08`: preview **không** ghi `mastery_state` và **không** đếm KPI nội dung.
- [ ] `play_sessions.is_preview` là cột thật, tách luồng **ở tầng dữ liệu** (`D-FQ`).
- [ ] Ca âm: manager preview 10 lần → không hàng `mastery_state` nào đổi, KPI level không tăng.
- [ ] Preview chỉ mở cho token audience Manager; User gọi route preview → 403.

**Kiểm chứng**
- [ ] `pnpm test -- preview-isolation` xanh, assertion tham chiếu `BR-GAT-08`.

**Phụ thuộc:** T2 · **Cỡ:** M

### Task 6 — Cổng "không gating là lỗi"

**Tiêu chí nghiệm thu**
- [ ] Danh sách handler trả nội dung khai dạng dữ liệu.
- [ ] Cổng quét: handler trả `content_pack`/`difficulty_params` mà không gọi `assertContentAccess` → **đỏ** (`D-FO`).
- [ ] Ca âm: thêm một handler giả không gọi gating → cổng đỏ.
- [ ] `BR-GAT-01`: ca âm — không có nhánh kiểm bậc nào ở component hay middleware client.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/gates test` (hoặc rule trong `lint:deps`) xanh trên repo sạch, đỏ trên fixture.

**Phụ thuộc:** T2 · **Cỡ:** M

### Task 7 — Ma trận và bao hàm

**Tiêu chí nghiệm thu**
- [ ] `BR-GAT-05`: **20/20 ô** có test, sinh từ bảng T1 (`D-FM`).
- [ ] `BR-GAT-06`: property test — `canAccess(tier_n)` luôn kéo theo `canAccess(tier_m)` với mọi `m < n`, trên **mọi** tổ hợp entitlement (dùng `fast-check`, đã có trong catalog).
- [ ] Ô 428 kiểm riêng: User chưa chọn trẻ gọi bậc ≥ `login` → **428**, không 403.
- [ ] Test đếm: số ô có test == số ô trong bảng; lệch là đỏ.

**Kiểm chứng**
- [ ] `pnpm test -- gating` xanh; báo cáo in ra "20/20 ô".

**Phụ thuộc:** T3 · T4 · T5 · T6 · **Cỡ:** M

### Cổng dừng

- [ ] 20/20 ô xanh; property test bao hàm xanh.
- [ ] Không handler nào trả nội dung mà bỏ qua gating — cổng đã đỏ được trên fixture.
- [ ] 403 không mang nội dung; 404 không rò tồn tại.
- [ ] Preview không chạm `mastery_state` và KPI.
- [ ] `pnpm check && pnpm test && pnpm --filter @mindkid/gates test && node packages/gates/scripts/check-progress.ts` xanh.
- [ ] Human security reviewer duyệt diff — **cổng doanh thu**, không auto-merge.

### Task 8 — Evidence và promote

**Tiêu chí nghiệm thu**
- [ ] Mỗi `BR-GAT-*` có ít nhất một test tham chiếu mã rule.
- [ ] [`access-gating.md`](../specs/04-play/access-gating.md) sang `implemented`.
- [ ] §11 Q1 ghi kết quả `D-FN` (giữ bốn bậc) và chuyển cho chủ xác nhận.
- [ ] §11 Q2 chuyển sang P1.8/P1.12 kèm ràng buộc "cảnh báo nhắm người lớn".
- [ ] Tick **P1.3** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Một handler quên gọi gating | Rò nội dung trả phí, không thu lại được | `D-FO` — cổng đếm, không dựa trí nhớ |
| Thứ tự bảy bước bị đảo khi refactor | Mã lỗi nói sai lý do, người dùng đi mua gói đã có | `BR-GAT-02` — ca âm cho từng cặp thứ tự |
| Test vài ô thay vì 20 ô | Ô còn lại là lỗ hổng im lặng | `D-FM` — sinh từ bảng, đếm ô |
| Tin cookie `active_child_id` | Đọc dữ liệu trẻ của người khác | `BR-GAT-04` — DB query + ca âm |
| Preview ghi mastery | Báo cáo nói sai về con của phụ huynh thật | `D-FQ` — tách ở tầng dữ liệu |
| Gộp bậc `login` giữa chừng | Migration + ma trận + level đã gắn tier | `D-FN` — quyết định trước P1.10 hoặc không đổi |
| 403 mang theo nội dung | Paywall thành trang trí | `BR-GAT-03` — ca âm quét body |

## 6. Giả định

1. **P0.5 đã đóng** — bốn bậc, `allowedTiers()`, bảng entitlement đã `implemented`.
2. **P1.2 đã đóng** — có nội dung thật (level mẫu) để chặn.
3. **Quota giờ chơi** đọc từ [`healthy-play-limits.md`](../specs/04-play/healthy-play-limits.md) (P1.8); ở bước này bước 6 gọi một hàm quota **có thể trả "chưa giới hạn"** — nhưng đường gọi và mã 402 phải tồn tại và có test.
4. **Chưa có màn hình nâng cấp gói.** Metadata gate là dữ liệu; màn hình ở P2.3.
5. **Preview chưa có studio.** Route preview tồn tại và có test; UI studio ở P2.6.

## 7. Ngoài phạm vi

- Giao payload config thật — P1.4.
- Vòng đời phiên đầy đủ — P1.6.
- Hạn mức giờ chơi đầy đủ — P1.8.
- Màn hình nâng cấp, thanh toán — P2.3.
- Studio preview UI — P2.6.
