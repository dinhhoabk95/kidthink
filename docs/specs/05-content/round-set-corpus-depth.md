---
spec: ROUND-SET-CORPUS-DEPTH
title: Chiều sâu chuỗi vòng trong corpus — sàn theo bậc thang và hình dạng sư phạm
area: content
status: draft
mvp: false
phase: P4
reviewed: 2026-09-02
owns:
  - Sàn số vòng thật có trong corpus seed, theo bậc thang
  - Mục tiêu số vòng mỗi band tuổi và cơ sở của con số
  - Hình dạng sư phạm bên trong một chuỗi vòng — vòng khởi động, vòng leo, vòng gọi lại
  - Cổng đo chuỗi vòng chạy trên corpus seed
depends_on:
  - ROUND-SET-MODEL
  - ROUND-SEQUENCE-PLAY
  - CONTENT-SEED-AUTHORING
  - LEVEL-GENERATOR-KIT
  - ENGINE-CONTENT-DEPTH
  - SCORING-AND-RESULT
  - PEDAGOGICAL-EVIDENCE
---

# Chiều sâu chuỗi vòng trong corpus — sàn theo bậc thang và hình dạng sư phạm

## 1. Objective

[`round-set-model.md`](round-set-model.md) sở hữu ràng buộc **giữa** các vòng của một set.
[`round-sequence-play.md`](../04-play/round-sequence-play.md) sở hữu việc **chạy** set.
Cả hai đều `status: implemented`. Không file nào sở hữu câu hỏi thứ ba: **corpus có chuỗi
vòng nào không, và một chuỗi phải có hình dạng gì thì mới rèn được tư duy.**

Chênh lệch đo được ngày 2026-09-02: tập gieo có **3.600 hạt game level**, và **0 hạt** khai
`rounds`. Toàn bộ 5 chỗ nhắc `rounds` trong `packages/db/src/seed-content/` đều là hạ tầng
(`types.ts`, `service.ts`, `gates/round-sets.ts`, `cli/gen-levels.ts`) — không có một dòng
nội dung nào. Nghĩa là mỗi bài tập hôm nay là **đúng một câu hỏi**: trẻ chọn một con vật một
lần rồi màn chơi kết thúc. Bộ máy nhiều vòng đã dựng xong và đang chạy rỗng.

File này sở hữu sàn **cung** của trục vòng và hình dạng sư phạm bên trong một chuỗi. Nó cộng
thêm vào [`engine-content-depth.md`](engine-content-depth.md) — file kia đếm **bao nhiêu
level** mỗi engine, file này đếm **bao nhiêu vòng** trong một level và các vòng đó khác nhau
ra sao.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người soạn nội dung | `content_reviewer` | Đọc bảng thiếu để biết level nào cần soạn thêm vòng |
| AI agent IDE | — | Dùng mục 6 và mục 7.4 làm ràng buộc lúc sinh seeder và lúc chạy `gen:levels --rounds` |
| Cổng chiều sâu vòng | — | Chạy trên corpus seed, chặn khi tụt dưới sàn của bậc đang bật |
| Người quyết | — | Bật bậc tiếp theo. Bậc là quyết định ngân sách biên soạn |
| Người review | quyền duyệt nội dung | Từ chối set vi phạm mục 6 ở đường publish |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `pnpm --filter @mindkid/db check:round-sets` | Dev, CI | Cổng hiện có, mục 7.5 nói nó thiếu gì |
| [`content-seed-authoring.md`](../01-platform/content-seed-authoring.md) | AI agent IDE | Ràng buộc lúc sinh seeder |
| [`level-generator-kit.md`](../01-platform/level-generator-kit.md) | Dev | `gen:levels --rounds=n` và `escalation_step` |
| [`game-level-studio.md`](../06-admin/game-level-studio.md) | Người soạn | Bề mặt soạn thủ công |

## 4. Main flow

1. Cổng đọc corpus seed từ `packages/db/src/seed-content/` — cả hạt `.ts` lẫn hạt `.json`
   dưới `corpus/c1..c6`.
2. Nguồn không đọc được, hoặc một hạt không parse được, thì cổng **dừng với mã thoát khác 0**
   kèm tên file. Cấm — NEVER nuốt lỗi parse rồi báo xanh; `corpus/index.ts` hôm nay có đúng
   một khối `catch {}` rỗng làm việc đó.
3. Cổng dựng round set của từng level: có `rounds` thì lấy nguyên, vắng `rounds` thì đếm là
   set một vòng theo `BR-RSM-09`.
4. Với mỗi level, cổng tính bảy số đo ở mục 7.3.
5. Cổng đọc bậc đang bật từ tệp cấu hình, so từng số với sàn của bậc đó.
6. Level nào thủng thì in mã level, engine, band, số vòng hiện có, và **trục nào** thiếu.
7. Có level thủng thì mã thoát khác 0.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Level nội dung không chia vòng được | Một số cơ chế chỉ có một câu hỏi tự nhiên | Khai `single_round_reason` trong header. Không tính vào mẫu số của sàn, nhưng **có** in ra danh sách để review đọc |
| Engine `deprecated` | Không nhận nội dung mới | Không tính vào sàn |
| Level `draft` hoặc `in_review` | Chưa publish | Không tính. Chiều sâu đếm thứ trẻ mở được |
| Archive làm thủng sàn | Gỡ nội dung sai | Cảnh báo, không chặn — cùng lý do với `BR-ECD-09` |
| Hạt sinh lại bằng generator | Chạy `gen:levels --rounds=n` | Diff phải đi qua PR như mọi hạt khác. Cấm — NEVER sinh thẳng vào nhánh phát hành |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-RSD-01` (mục tiêu vòng theo band) | Mục tiêu biên soạn: band 3–4 là **4** vòng, band 4–5 là **6**, band 5–6 là **8**. Dải chấp nhận ở mục 7.2 | Trần `6 · 8 · 10` của `BR-RSM-03` là **trần**, không phải mục tiêu. Không có mục tiêu thì người soạn lấy số nhỏ nhất hợp lệ, và số nhỏ nhất hợp lệ là 1 — đúng thứ đang có trong corpus hôm nay |
| `BR-RSD-02` (sàn corpus theo bậc) | Corpus đạt sàn `multi_round_ratio` và sàn engine của bậc đang bật ở mục 7.4 | Một mục tiêu không có cổng đo là một mục tiêu sẽ trôi. `check:round-sets` hiện đếm `multiRoundLevelsCount` nhưng **không so nó với ngưỡng nào**, nên 0 vòng nhiều vẫn báo ĐẠT |
| `BR-RSD-03` (sàn để điểm có nghĩa) | Set nhiều vòng phải có **≥4** vòng | `first_try_ratio` của mục 7.2 [`scoring-and-result.md`](../04-play/scoring-and-result.md) chỉ nhận `rounds_correct / rounds_total`. Với 1 vòng, tỉ lệ chỉ nhận 0 hoặc 1, nên **hai sao không bao giờ đạt được** — ngưỡng 0,55 và 0,85 sập thành một. Với 4 vòng có 5 mức, hai sao mới có chỗ tồn tại |
| `BR-RSD-04` (vòng khởi động) | Vòng 0 dùng bộ nhiễu **tương phản cao nhất** của set, không chỉ `difficulty` thấp nhất | `BR-RSM-06` đã ép vòng đầu dễ nhất theo thang `difficulty`. Thang đó không nhìn thấy độ giống nhau của nhiễu. Mở bài bằng một lần làm được là điều kiện để còn lại phần bài |
| `BR-RSD-05` (vòng gọi lại) | Set ≥4 vòng phải có **≥1 vòng gọi lại**: hỏi lại đúng mục tiêu của một vòng trước đó, cách nó **≥2 vòng**, với bộ option khác và vị trí đáp án khác | Đây là chỗ "ghi nhớ" nằm. Gọi lại có khoảng cách giữ được kiến thức sau một tuần, còn lặp lại thụ động thì không — xem mục 7.1. Không có rule này thì chuỗi vòng chỉ là bốn câu hỏi rời nhau |
| `BR-RSD-06` (đổi bộ option mỗi vòng) | Bộ option của hai vòng bất kỳ trong set phải khác nhau **≥1 phần tử**. Đổi thứ tự cấm — NEVER tính là khác | `BR-RSM-08` chỉ cấm hai vòng **liền kề** trùng nội dung. Vòng 0 và vòng 3 trùng nhau vẫn lọt, và với set 4 vòng thì đó là 50% chuỗi lặp lại |
| `BR-RSD-07` (vị trí đáp án) | Vị trí đáp án đúng cấm — NEVER lặp quá **2** vòng liên tiếp, và cấm — NEVER chiếm quá **50%** số vòng của set | Trẻ 3–6 tuổi học vị trí nhanh hơn học tiêu chí. Đáp án luôn ở ô thứ hai thì set đo được đúng một thứ: trẻ có nhớ ô thứ hai không |
| `BR-RSD-08` (đa dạng thực thể) | Số thực thể khác nhau xuất hiện trong một set ≥ **số vòng + 1** | Bài "chọn một con vật" mà cả bốn vòng đều gà, vịt, mèo thì trẻ nhận mặt ba con vật chứ không nắm tiêu chí "con vật". Từ vựng lấy từ [`content-theme-registry.md`](content-theme-registry.md), không bịa |
| `BR-RSD-09` (đường leo phải đi tới đâu) | Set ≥4 vòng có `difficulty` vòng cuối ≥ `difficulty` vòng đầu **+2** | `BR-RSM-05` cấm leo hai chiều một lúc nhưng không cấm **không leo**. Bốn vòng phẳng cùng độ khó là bốn lần luyện lại cùng một mức, không phải một chuỗi rèn tư duy |
| `BR-RSD-10` (bậc thang một chiều) | Bậc đã bật cấm — NEVER hạ. Bật bậc mới là quyết định của người quyết, ghi vào tệp cấu hình kèm ngày | Cùng cơ chế `BR-ECD-08`. Sàn hạ được là sàn sẽ bị hạ vào đúng hôm cổng đỏ trước một buổi phát hành |
| `BR-RSD-11` (không tụt) | PR làm giảm số vòng của một level đang đạt sàn thì bị chặn | Cùng cơ chế `BR-ECD-09` |
| `BR-RSD-12` (cổng có ca âm) | Mỗi rule `BR-RSD-*` có test ca âm: bớt một vòng, bỏ vòng gọi lại, hoặc ghim đáp án một vị trí phải làm cổng **đỏ** | Cổng không có ca âm là cổng không biết mình hỏng. `check:round-sets` hôm nay xanh trên một corpus 100% một vòng — đó là ca âm bị thiếu, đã thành sự thật |
| `BR-RSD-13` (báo cáo nêu thiếu bao nhiêu) | Báo cáo in **level thiếu và thiếu bao nhiêu vòng trên trục nào**, cấm — NEVER in mỗi tỉ lệ phần trăm tổng | Một con số 92% che được 3.600 level một vòng. Danh sách level thì không che được |
| `BR-RSD-14` (chiều sâu không phải bằng chứng sư phạm) | Số đo ở đây cấm — NEVER dùng làm bằng chứng hiệu quả học tập | Cùng ranh giới `BR-ECD-12` và `BR-PED-01`. Bốn vòng có mặt trong database không chứng minh trẻ tư duy tốt hơn |
| `BR-RSD-15` (con số phải được đo lại với trẻ) | Mục tiêu `4 · 6 · 8` là **giả thuyết lấy từ tài liệu**, phải được đối chiếu bằng playtest theo [`pedagogical-evidence.md`](../08-quality/pedagogical-evidence.md) trước khi bật Bậc 2 | `D-167A` nâng trần `6 · 8 · 10` bằng lập luận thời lượng, không bằng quan sát trẻ — câu hỏi 3 mục 11 của [`round-set-model.md`](round-set-model.md) vẫn mở. File này cấm — NEVER đóng câu hỏi đó bằng cách viết thêm một con số nữa |

## 7. Data

**Đọc:** `packages/db/src/seed-content/**` · registry engine ·
`packages/db/config/round-set-depth.json`.
**Ghi:** không ghi vào database. Đầu ra là báo cáo và mã thoát.

### 7.1 Cơ sở của con số `4 · 6 · 8`

Bốn ràng buộc độc lập, không cái nào tự nó chốt được số vòng.

| Ràng buộc | Số | Nó chặn gì |
|---|---|---|
| Sức chú ý | 3 tuổi 6–8 phút · 4 tuổi 8–12 · 5–6 tuổi 12–18. Quy tắc thô: 3–5 phút mỗi tuổi | **Không** phải ràng buộc chặn. Ở ~20 giây một vòng, 8 vòng là 2,7 phút — dưới cả trần 5 phút của `BR-RSM-12` lẫn sức chú ý của band nhỏ nhất |
| Số trial một phiên dạy | Phiên dạy trial rời chuẩn là **10 trial**, tiêu chí thành thạo 90% qua 3 phiên liên tiếp; trẻ mới bắt đầu hoặc dễ nản thì **ít trial hơn** | 10 là **trần thực nghiệm**, không phải mục tiêu. Band lớn nhất đặt 8 để chừa biên; band 3–4 đặt 4 vì nhóm "dễ nản" trong tài liệu chính là lứa đó |
| Gọi lại có khoảng cách | Xen trial **gọi lại** có khoảng cách giữ được từ vựng mới sau 1 tuần, hơn hẳn cùng số lần **nhìn thấy** thụ động | Đây là lý do `BR-RSD-05` tồn tại. Nó cũng đặt sàn 4: dưới 4 vòng thì không có chỗ đặt một vòng gọi lại cách gốc ≥2 vòng |
| Trí nhớ làm việc | 3–4 tuổi giữ ~2 mục; 4–5 tuổi giữ 3–4 mục | Ràng buộc **số item trong một vòng**, do mục 7.1 [`game-level-model.md`](game-level-model.md) sở hữu. Cấm — NEVER dùng nó để cắt số vòng: vòng xong là quên được, item trong một vòng thì không |

Nguồn: [DTT — NPDC on ASD](https://files.eric.ed.gov/fulltext/ED595333.pdf) ·
[Applying "Mastery" Criteria with Preschoolers](https://link.springer.com/article/10.1007/s10864-024-09564-6) ·
[Repeated spaced retrieval in word learning](https://link.springer.com/article/10.1186/s11689-021-09368-z) ·
[Retrieval practice and word learning](https://pmc.ncbi.nlm.nih.gov/articles/PMC9629778/) ·
[Working memory development, two national samples](https://pmc.ncbi.nlm.nih.gov/articles/PMC9618361/).

Cả năm nguồn nói về trẻ nói tiếng Anh, phần lớn trong bối cảnh trị liệu hoặc phòng thí
nghiệm, không phải trẻ Việt chơi trên máy tính bảng. Vì vậy `BR-RSD-15`.

### 7.2 Mục tiêu và dải chấp nhận

| Band | Tối thiểu (`BR-RSD-03`) | **Mục tiêu** (`BR-RSD-01`) | Trần (`BR-RSM-03`) |
|---|---:|---:|---:|
| 3–4 | 4 | **4** | 6 |
| 4–5 | 4 | **6** | 8 |
| 5–6 | 4 | **8** | 10 |

Set một vòng vẫn hợp lệ theo `BR-RSM-09` — nhưng từ Bậc 1 nó phải khai
`single_round_reason`, và nó không được tính vào mẫu số của sàn.

### 7.3 Bảy số đo của một level

| Số đo | Định nghĩa | Đo ngày 2026-09-02 |
|---|---|---|
| `round_count` | Số vòng của set | **1** trên toàn bộ 3.600 hạt |
| `escalation_span` | `difficulty` vòng cuối trừ vòng đầu | 0 — không set nào có vòng thứ hai |
| `retrieval_round_count` | Số vòng gọi lại theo `BR-RSD-05` | 0 |
| `option_set_min_diff` | Số phần tử khác nhau giữa cặp vòng giống nhau nhất | không đo được |
| `answer_position_max_run` | Chuỗi dài nhất đáp án đứng cùng một vị trí | không đo được |
| `answer_position_share` | Tỉ lệ vòng có đáp án ở vị trí phổ biến nhất | không đo được |
| `entity_span` | Số thực thể khác nhau trong cả set | không đo được |

Năm ô "không đo được" không phải thiếu công cụ. Chúng không đo được vì **không có vòng thứ
hai để so với vòng thứ nhất**.

### 7.4 Bậc thang

| Số đo | Bậc 0 (hôm nay) | Bậc 1 | Bậc 2 | Bậc 3 |
|---|:--:|:--:|:--:|:--:|
| `multi_round_ratio` toàn corpus | ≥0% | ≥10% | ≥50% | 100% |
| Engine có ≥3 level nhiều vòng | 0/36 | ≥12/36 | 36/36 | 36/36 |
| `round_count` của set nhiều vòng | — | ≥4 | ≥ mục tiêu band | ≥ mục tiêu band |
| `retrieval_round_count` | — | ≥0 | ≥1 | ≥1 |
| `escalation_span` | — | ≥1 | ≥2 | ≥2 |
| Chặn từ phase | đang chặn | P4 | P5 | sau go-live |

Bậc 0 ghi ra để `BR-RSD-11` (không tụt) có mốc so. Nó là mức hôm nay, và mức hôm nay là 0.

### 7.5 Vì sao cổng hiện có không bắt được gì

`packages/db/src/seed-content/gates/round-sets.ts` gọi `validateRoundSet` cho từng level. Với
level vắng `rounds`, nó tự dựng một set một phần tử — và một set một phần tử **hợp lệ** theo
`BR-RSM-09`. Nên cổng chạy hết 3.600 hạt, đếm `multiRoundLevelsCount = 0`, in con số đó ra
báo cáo, rồi kết luận ĐẠT. Đây là dạng cổng xanh giả thứ sáu: **cổng đo đúng thứ nó đo, và
thứ nó đo không phải thứ cần chặn.**

Hai chỗ hỏng kèm theo, đo cùng ngày:

- Cổng **không chạy được** dưới `tsx`: chuỗi import đứt ở
  `packages/game-engine/src/templates/GT-001/session.ts:10`, nó import
  `#src/layout/constants.js` trong khi file là `constants.ts`, nên resolver tìm
  `constants.js.ts`. `pnpm --filter @mindkid/db check:round-sets` thoát khác 0 vì lỗi module,
  không vì nội dung.
- `packages/db/src/seed-content/generated/*.ts` chứa **430 level** mà **không file nào
  import**. Chúng không vào `ALL_SEED_LEVELS`, nên không vào cả tập gieo lẫn tập cổng đo.

### 7.6 Giá phải trả của mỗi bậc

Tính trên 3.600 hạt: 3.156 hạt `.json` do generator sinh, 444 hạt `.ts` viết tay.

| Bậc | Level phải có chuỗi vòng | Sinh lại bằng generator | Soạn tay |
|---|---:|---:|---:|
| Bậc 1 | ~360 | ~360 | 0 |
| Bậc 2 | ~1.800 | ~1.578 | ~222 |
| Bậc 3 | 3.600 | 3.156 | 444 |

`escalation_step` đã có ở 19 generator từ WP167.7, và `gen:levels --rounds=n` đã nhận cờ. Nên
Bậc 1 là chạy lại generator cộng đọc diff, không phải soạn tay. Bậc 3 là lô biên soạn thật.

## 8. API contract

Không sở hữu route.

`BR-RSD-04` đến `BR-RSD-09` là ràng buộc **một set**, ép ở cổng publish của
[`content-lifecycle.md`](../00-foundation/content-lifecycle.md) cùng chỗ 13 rule `BR-RSM-*`
đã nối ở WP167.5, trả `422 VALIDATION_FAILED` kèm `details.fields[]` nêu `round_index`.

`BR-RSD-01` đến `BR-RSD-03` và `BR-RSD-10` đến `BR-RSD-13` là ràng buộc **corpus**, chỉ chạy
ở cổng CLI. Chúng cấm — NEVER chặn một PR studio đơn lẻ.

Không thêm mã lỗi mới.

## 9. Acceptance criteria

```gherkin
Scenario: BR-RSD-02 — corpus toàn set một vòng làm cổng đỏ ở Bậc 1
  Given tệp cấu hình bật Bậc 1
  And corpus có 3600 level và 0 level nhiều vòng
  When chạy cổng chiều sâu vòng
  Then cổng thoát khác 0
  And báo cáo in multi_round_ratio bằng 0 phần trăm và ngưỡng 10 phần trăm

Scenario: BR-RSD-03 — set ba vòng bị chặn
  Given một level band 5-6 có round set 3 vòng
  When gửi duyệt
  Then trả 422 VALIDATION_FAILED
  And details.fields[] nêu sàn 4 vòng

Scenario: BR-RSD-05 — set bốn vòng không có vòng gọi lại bị chặn
  Given một set 4 vòng, mỗi vòng hỏi một mục tiêu khác nhau
  When gửi duyệt
  Then trả 422 VALIDATION_FAILED
  And details nêu thiếu vòng gọi lại

Scenario: BR-RSD-05 — vòng gọi lại cách gốc một vòng bị chặn
  Given vòng 1 hỏi lại mục tiêu của vòng 0
  When gửi duyệt
  Then trả 422 VALIDATION_FAILED
  And details nêu khoảng cách tối thiểu 2 vòng

Scenario: BR-RSD-06 — hai vòng không liền kề trùng bộ option bị chặn
  Given vòng 0 và vòng 3 có bộ option giống hệt, chỉ khác thứ tự
  When gửi duyệt
  Then trả 422 VALIDATION_FAILED

Scenario: BR-RSD-07 — đáp án ghim một vị trí bị chặn
  Given một set 4 vòng có đáp án đúng ở ô thứ hai trong cả 4 vòng
  When gửi duyệt
  Then trả 422 VALIDATION_FAILED
  And details nêu answer_position_share bằng 100 phần trăm

Scenario: BR-RSD-08 — set nghèo thực thể bị chặn
  Given một set 4 vòng chỉ dùng 3 thực thể khác nhau
  When gửi duyệt
  Then trả 422 VALIDATION_FAILED
  And details nêu entity_span 3 dưới sàn 5

Scenario: BR-RSD-09 — bốn vòng phẳng độ khó bị chặn
  Given một set 4 vòng có difficulty 2, 2, 2, 2
  When gửi duyệt
  Then trả 422 VALIDATION_FAILED
  And details nêu escalation_span bằng 0

Scenario: BR-RSD-12 — bỏ một vòng của set đang sát sàn làm cổng đỏ
  Given một level đạt đúng sàn của bậc đang bật
  When xoá vòng cuối của set đó
  And chạy cổng chiều sâu vòng
  Then cổng thoát khác 0

Scenario: BR-RSD-13 — báo cáo nêu tên level chứ không chỉ tỉ lệ
  Given corpus có 12 level thủng sàn
  When chạy cổng chiều sâu vòng
  Then báo cáo in đủ 12 mã level kèm số vòng hiện có và trục thiếu

Scenario: cổng dừng khi nguồn không parse được
  Given một file hạt trong corpus/c3 là JSON hỏng
  When chạy cổng chiều sâu vòng
  Then cổng thoát khác 0 kèm tên file
  And cấm bỏ qua file đó rồi báo xanh
```

## 10. Boundaries

**Always**
- Đặt mục tiêu vòng theo band, không lấy số nhỏ nhất hợp lệ.
- Mỗi set ≥4 vòng có ít nhất một vòng gọi lại cách vòng gốc ≥2 vòng.
- Đổi bộ option và vị trí đáp án giữa các vòng.
- In tên level thiếu, kèm thiếu bao nhiêu và thiếu trục nào.
- Sinh lại hạt bằng generator rồi đọc diff, thay vì vá tay từng file.

**Ask first**
- Bật bậc tiếp theo ở mục 7.4.
- Đổi mục tiêu `4 · 6 · 8` ở mục 7.2.
- Đổi định nghĩa vòng gọi lại ở `BR-RSD-05`.
- Xử lý 430 level trong `generated/` mà không ai import.

**Never**
- Hạ bậc đã bật để cổng xanh.
- Đếm set một vòng vào mẫu số của sàn.
- Dùng cùng bộ option cho hai vòng bất kỳ trong một set.
- Dùng số đo của file này làm bằng chứng hiệu quả học tập.
- Đóng câu hỏi "bao nhiêu vòng là đúng cho trẻ" bằng lập luận, khi nó cần dữ liệu quan sát.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ | Quyết định / Trạng thái |
|---|---|---|---|---|---|
| 1 | Mục tiêu `4 · 6 · 8` lấy từ tài liệu nước ngoài, chưa đo với trẻ Việt trên máy tính bảng. Con số đúng là bao nhiêu? | Bật Bậc 2 | P4 | người quyết | **Mở.** Nối vào câu hỏi 3 mục 11 [`round-set-model.md`](round-set-model.md) — cùng một lỗ hổng dữ liệu, hai file cùng chờ một đợt playtest |
| 2 | Vòng gọi lại có tính vào `rounds_total` của `first_try_ratio` không, hay tách thành chỉ số ghi nhớ riêng? | Hình dạng số đo mục 7.1 [`scoring-and-result.md`](../04-play/scoring-and-result.md) | P4 | Backend | **Mở.** Tính vào thì trẻ nhớ tốt được thưởng đúng chỗ; tách ra thì `first_try_ratio` giữ nghĩa "làm đúng ngay lần đầu" nguyên vẹn |
| 3 | Sinh lại 3.156 hạt `.json` bằng `--rounds` có phá `legacy_v1_ref` và mã level đang được lesson trỏ tới không? | Bậc 1 | P4 | Nội dung | **Mở.** Phải đo trước khi chạy: `activities.refId` trỏ tới `game_levels.code`, đổi mã là làm chết link bước chơi của tiết học |
| 4 | 430 level trong `seed-content/generated/*.ts` không file nào import — xoá, hay nối vào tập gieo? | Mẫu số của mọi sàn trong file này | P4 | người quyết | **Mở.** Nối vào thì corpus tăng 12% và mọi con số ở mục 7.6 phải tính lại; xoá thì mất công sinh của một lô cũ |
| 5 | Cổng `check:round-sets` không chạy được vì import đứt ở `GT-001/session.ts:10`. Sửa trong task nào? | Mọi ca âm của `BR-RSD-12` | P4 | Backend | **Mở.** Một ký tự `.js` thừa, nhưng nó nằm ngoài phạm vi nội dung — cùng loại với lỗi barrel `@mindkid/config` |
