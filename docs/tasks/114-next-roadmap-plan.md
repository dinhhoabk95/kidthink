# Task #114 — Roadmap tiếp theo: đóng 49 spec chưa `implemented`

> **Loại task:** roadmap (M) — không sửa mã sản phẩm, không sửa spec đã approve.
> Sản phẩm của task này là **thứ tự** và **ranh giới task** cho phần corpus chưa đóng.
> **Yêu cầu gốc (2026-08-29):** *"Lên roadmap tiếp theo và lên plan cho tất cả các spec chưa
> implement. Tạo plan theo thứ tự tiếp theo cho tới khi xử lý xong toàn bộ spec chưa xử lý."*
> **Spec sở hữu liên quan:** không spec nào — file này là hồ sơ task, nguồn sự thật về thứ tự
> vẫn là [`roadmap.md`](../specs/roadmap.md). Task #114 **ghi thêm** một mục vào file đó.

## 1. Trả lời ngắn

Corpus có **171 spec**. **149** mang `status: implemented`. Còn lại **22 spec** cộng **27 phiếu
engine** — tổng **49 file** chưa đóng. Con số 13 ghi ở mục *"Thứ tự task cho spec chưa triển
khai, chốt 2026-08-18"* của [`roadmap.md`](../specs/roadmap.md) đã cũ: từ ngày đó corpus nhận
thêm 8 spec `draft` (Task #113) và 27 phiếu engine.

Cả 49 file **đều đã có plan sở hữu**. Không file nào mồ côi. Nhưng ba plan đang gánh quá tải:

| Plan | Todo | Vấn đề |
|---|---:|---|
| [`113-game-engine-depth-and-seed-diversity`](113-game-engine-depth-and-seed-diversity-todo.md) | 45/109 | Một plan gánh 8 spec, 27 phiếu, 5 cổng mới, và 103 đơn vị nội dung phải soạn |
| [`109-vps-golive-blockers`](109-vps-golive-blockers-todo.md) | 60/77 | 17 việc còn lại **đều** nằm sau 3 quyết định người chưa có |
| [`99-montessori-template-designs`](99-montessori-template-designs-todo.md) | 68/74 | Chờ quyết định nới trần C1 |

Task #113 là chỗ tắc thật. Nó gộp bốn loại việc có nhịp khác hẳn nhau — phê duyệt spec, thi
công cổng, sửa nợ dữ liệu, và soạn nội dung — nên không lát nào đóng được trọn vẹn. Task #114
**tách** phạm vi mở của #113 thành 11 task có ranh giới PR riêng, rồi xếp chúng cùng 4 task
đóng đuôi cho phần còn lại.

**Sửa lần hai, cùng ngày.** Bản đầu của mục 4 vẫn gộp 27 engine vào ba task ngang: #115 vẽ 6
engine, #116 vẽ 21, #120 duyệt 27 phiếu, #122 soạn 55 level. Người quyết bác: *"phân chia mỗi
engine game là một plan tương ứng với 1 spec thay vì gộp chung hết tất cả để dễ control vì là
core chính. Spec cần phải define chi tiết theo đúng SDD."*

Đúng, và lý do đo được: gộp ngang làm mất câu trả lời *"engine này xong chưa"* — mỗi engine
luôn xong một phần ba ở ba task khác nhau. Trục chia đổi sang **một engine một lát dọc**:
27 task `#130`–`#156`, mỗi task đóng **một spec engine**. Ba task ngang thu hẹp còn hạ tầng và
cổng. Chi tiết ở [`Task #116`](116-engine-vertical-slices-plan.md), nay là hồ sơ chương trình.

## 2. Bằng chứng đã đo (2026-08-29)

Đo bằng cách đọc frontmatter của toàn bộ `docs/specs/**/*.md` và đối chiếu với `docs/tasks/`.
Lệnh tái dựng ở mục 2.6.

### 2.1 Phân bố `status` trên 171 spec cộng 27 phiếu

| `status` | Số file | Ghi chú |
|---|---:|---|
| `implemented` | 149 | Acceptance criteria đã xanh tại thời điểm đặt cờ |
| `approved` | 14 | Spec chốt, code chưa đóng |
| `draft` (spec) | 8 | Bốn spec chiều sâu + hai spec go-live + hai spec giáo án, thêm ngày 2026-08-29 |
| `draft` (phiếu engine) | 27 | `GT-001` … `GT-027` ở `01-platform/engines/` |
| **Chưa đóng** | **49** | |

### 2.2 Mười bốn spec `approved` — chia đúng ba nhóm

| Spec | Phase | Plan sở hữu | Còn lại |
|---|:--:|---|---|
| [`app-runtime-boundary`](../specs/00-foundation/app-runtime-boundary.md) | P0 | [#104](104-app-runtime-boundary-todo.md) | 2 việc |
| [`manager-mfa-enrollment`](../specs/06-admin/manager-mfa-enrollment.md) | P0 | [#105](105-manager-login-surface-todo.md) · [#106](106-totp-key-custody-todo.md) | 2 việc, chặn bởi một số đo DB |
| [`server-provisioning`](../specs/01-platform/server-provisioning.md) | P0 | [#90](90-vps-deploy-todo.md) · [#109](109-vps-golive-blockers-todo.md) | Chặn người |
| [`env-contract`](../specs/01-platform/env-contract.md) | P0 | [#90](90-vps-deploy-todo.md) · [#109](109-vps-golive-blockers-todo.md) · [#110](110-env-layout-todo.md) | Chặn người |
| [`process-supervision`](../specs/01-platform/process-supervision.md) | P0 | [#90](90-vps-deploy-todo.md) · [#109](109-vps-golive-blockers-todo.md) | Chặn người |
| [`release-deploy`](../specs/01-platform/release-deploy.md) | P0 | [#90](90-vps-deploy-todo.md) · [#109](109-vps-golive-blockers-todo.md) | Chặn người |
| [`release-rollback`](../specs/01-platform/release-rollback.md) | P0 | [#90](90-vps-deploy-todo.md) | Chặn người |
| [`montessori-corpus-mapping`](../specs/05-content/montessori-corpus-mapping.md) | P3 | [#98](98-montessori-corpus-intake-todo.md) | 1 việc — mở PR |
| [`montessori-game-level-batch`](../specs/05-content/montessori-game-level-batch.md) | P3 | [#98](98-montessori-corpus-intake-todo.md) | 1 việc — mở PR |
| [`montessori-lesson-batch`](../specs/05-content/montessori-lesson-batch.md) | P3 | [#98](98-montessori-corpus-intake-todo.md) | 1 việc — mở PR |
| [`montessori-template-batch`](../specs/01-platform/montessori-template-batch.md) | P4 | [#98](98-montessori-corpus-intake-todo.md) · [#99](99-montessori-template-designs-todo.md) | 6 việc, chặn bởi trần C1 |
| [`taxonomy-gap-batch`](../specs/01-platform/taxonomy-gap-batch.md) | P5 | [#102](102-template-diversity-todo.md) | Todo đã tick hết, cờ chưa lật |
| [`lesson-template-variety`](../specs/05-content/lesson-template-variety.md) | P5 | [#102](102-template-diversity-todo.md) | Todo đã tick hết, cờ chưa lật |
| [`template-coverage-level-batch`](../specs/05-content/template-coverage-level-batch.md) | P5 | [#102](102-template-diversity-todo.md) | Todo đã tick hết, cờ chưa lật |

Ba spec cuối là ca đáng ngờ: checklist `102-template-diversity-todo.md` **đã tick hết** nhưng
ba spec vẫn `approved`. Hoặc acceptance chưa từng chạy, hoặc chạy rồi mà không ai lật cờ. Task
#127 phải đo lại trước khi lật, không được lật theo checklist.

### 2.3 Tám spec `draft` — toàn bộ thuộc Task #113

| Spec | Nó sở hữu gì mà chưa ai sở hữu |
|---|---|
| [`engine-render-contract`](../specs/01-platform/engine-render-contract.md) | Hợp đồng vẽ. **0 trên 27** engine cài `render()` — canvas trống |
| [`engine-spec-sheet`](../specs/01-platform/engine-spec-sheet.md) | Phiếu một engine một file, thay cho một hàng bảng trong spec lô |
| [`level-generator-kit`](../specs/01-platform/level-generator-kit.md) | Cách sinh level tới sàn bậc 2 mà không soạn tay |
| [`content-theme-registry`](../specs/05-content/content-theme-registry.md) | Từ vựng chủ đề đóng — hôm nay có **ba** nguồn song song |
| [`engine-content-depth`](../specs/05-content/engine-content-depth.md) | Sàn nội dung **mỗi engine**, thay cho sàn tổng 120 level |
| [`lesson-flow-model`](../specs/05-content/lesson-flow-model.md) | Thư viện giáo án master; tuổi là đề xuất chứ không phải khoá (`D-SI`) |
| [`lesson-corpus-depth`](../specs/05-content/lesson-corpus-depth.md) | Cầu 126 tiết đối chiếu cung 81 (`D-SJ`) |
| [`go-live-readiness`](../specs/08-quality/go-live-readiness.md) | Câu *"trẻ mở được chưa"*, khác câu *"cái gì thuộc MVP"* |

### 2.4 Hai mươi bảy phiếu engine

Cả 27 phiếu đã tồn tại ở `docs/specs/01-platform/engines/GT-0NN.md`, `status: draft`, có
frontmatter `sheet`/`engine`/`batch`. Sáu phiếu MVP cộng `GT-007`, `GT-008` đã có phần viết tay
thật; **21 phiếu còn lại** chưa ai soạn nội dung — chúng là bản sinh từ registry.

Không cổng nào đối chiếu phiếu với registry hôm nay. Xoá một phiếu, đổi một giá trị `limits`,
không gì đỏ.

### 2.5 Số đo mã nguồn, đo lại hôm nay

| Số đo | Giá trị | Lệnh |
|---|---:|---|
| Thư mục engine ở `packages/game-engine/src/templates/` | 27 | `ls packages/game-engine/src/templates` |
| Engine cài `render()` | **0** | `grep -rn "render(" packages/game-engine/src/templates --include="*.ts"` |
| Bản `CUSTOM_GAME_TEMPLATE_CODES` trong monorepo | **2** | `grep -rn "CUSTOM_GAME_TEMPLATE_CODES" packages apps` |
| Layout id đã đăng ký | 21 | `packages/game-engine/src/layout/registry.ts` |
| System engine đã có | 20 | `ls packages/game-engine/src/systems` |
| Nguyên thuỷ vẽ của `RenderSystem` | 5 | `drawClayBody` · `drawClayContainer` · `drawScaffoldingHighlight` · `drawParticles` · `clear` |

`core.ts` dòng 184 đã gọi `this.activeSession?.render?.(this.ctx, this.renderSystem, now)`.
Vòng lặp, canvas, DPR scaling, layout geometry, bộ vẽ nguyên thuỷ — **đều có**. Thiếu đúng một
thứ: thân hàm `render()` của từng engine. Đó là lý do Task #115 và #116 đứng đầu hàng.

### 2.6 Lệnh tái dựng số đo mục 2.1

```bash
cd mindkid
for f in $(find docs/specs -name '*.md'); do
  awk '/^---$/{n++; next} n==1 && /^status:/{print $2; exit}' "$f"
done | sort | uniq -c
```

## 3. Vì sao tách Task #113 thay vì chạy tiếp

Bốn loại việc trong #113 có nhịp, người duyệt, và rủi ro hoàn tác khác nhau:

1. **Phê duyệt spec** — một chữ ký, không mã. Đứng trước mọi thứ.
2. **Thi công cổng** — mã hạ tầng, có ca âm, review nhanh.
3. **Sửa nợ dữ liệu** — 162 level không parse, 42 level ngoài band. Bản published bất biến nên
   mọi cách sửa là INSERT version mới (`BR-CSA-01`). Rủi ro hoàn tác cao nhất.
4. **Soạn nội dung** — 55 + 48 level, 45 giáo án. Chặn bởi năng lực đọc review của người, y hệt
   đường găng của P1.

Gộp chúng làm một PR nghĩa là người review phải nuốt cả bốn cùng lúc. Đó là lý do checklist
dừng ở 45/109 mà không nhánh nào đóng.

**Cấm — NEVER** gộp lại. Mỗi task dưới đây giữ một loại việc, một cổng, một PR.

## 4. Thứ tự chốt — mười lăm task ngang cộng hai mươi bảy lát dọc engine

Thứ tự suy ra từ `depends_on` của spec cộng ba ràng buộc đo được: cổng phải thật trước khi đo
nội dung; từ vựng phải đóng trước khi gắn tag; và nội dung phải tồn tại trước khi nối.

```
HẠ TẦNG VÀ CỔNG — chạy trước, không chạm engine nào
  #115 hạ tầng vẽ + check:render ──┐
  #120 khuôn spec engine + cổng ───┤
  #117 cổng seed nói thật ─────────┤
  #118 luật band ──────────────────┼──→ #116 chương trình 27 lát dọc
  #119 registry chủ đề ────────────┤
  #121 bộ sinh level ──────────────┤
  #122 cổng chiều sâu + ngân sách ─┘

HAI MƯƠI BẢY LÁT DỌC ENGINE — mỗi engine một spec, một plan
  #130 GT-001 (pilot) ──→ #131 … #156   (26 task còn lại chạy song song được)

TRỤC GIÁO ÁN — độc lập với trục engine
  #123 mô hình ──→ #124 cung (45 tiết + 48 level)

HỢP LƯU
  #156 xong  +  #124 xong  ──→ #125 cổng go-live

ĐÓNG ĐUÔI — độc lập
  #126 Montessori · #127 ba spec P5 · #128 hạ tầng go-live · #129 MFA + ranh giới runtime
```

| Task | Đóng spec nào | Loại | Chặn bởi |
|---|---|---|---|
| [#115](115-render-contract-core-plan.md) | [`engine-render-contract`](../specs/01-platform/engine-render-contract.md) (hạ tầng + cổng) | cổng + mã | Không |
| [#116](116-engine-vertical-slices-plan.md) | chương trình 27 lát dọc — không sở hữu spec nào | chương trình | #115 #120 |
| [#117](117-seed-gate-truth-plan.md) | không spec mới — sửa nợ [`content-seed-authoring`](../specs/01-platform/content-seed-authoring.md) | cổng + nợ dữ liệu | Quyết định người về 162 level |
| [#118](118-band-violation-cleanup-plan.md) | không spec mới — sửa nợ | nợ dữ liệu | #117, quyết định người |
| [#119](119-theme-registry-plan.md) | [`content-theme-registry`](../specs/05-content/content-theme-registry.md) | cổng + từ vựng | Quyết định 14 giá trị |
| [#120](120-engine-spec-contract-plan.md) | [`engine-spec-sheet`](../specs/01-platform/engine-spec-sheet.md) — khuôn spec engine SDD | contract + cổng | Không |
| [#121](121-level-generator-kit-plan.md) | [`level-generator-kit`](../specs/01-platform/level-generator-kit.md) | mã | #119, quyết định cách sinh |
| [#122](122-engine-content-depth-plan.md) | [`engine-content-depth`](../specs/05-content/engine-content-depth.md) | cổng + ngân sách | #117 #119 #120 #121 |
| [#123](123-lesson-flow-model-plan.md) | [`lesson-flow-model`](../specs/05-content/lesson-flow-model.md) | mã + UI | Không |
| [#124](124-lesson-corpus-depth-plan.md) | [`lesson-corpus-depth`](../specs/05-content/lesson-corpus-depth.md) | nội dung + cổng | #123 |
| [#125](125-go-live-readiness-plan.md) | [`go-live-readiness`](../specs/08-quality/go-live-readiness.md) | cổng | #156 #122 #124 |
| [#126](126-montessori-closure-plan.md) | bốn spec Montessori | đóng đuôi | Trần C1 |
| [#127](127-template-diversity-ratification-plan.md) | ba spec P5 lô khuôn | đo + phê chuẩn | Không |
| [#128](128-infra-go-live-plan.md) | năm spec phát hành P0 | hạ tầng | Ba quyết định người |
| [#129](129-mfa-and-runtime-boundary-closure-plan.md) | [`manager-mfa-enrollment`](../specs/06-admin/manager-mfa-enrollment.md) · [`app-runtime-boundary`](../specs/00-foundation/app-runtime-boundary.md) | đóng đuôi | Một số đo DB |
| [#130](130-engine-gt-001-plan.md) … [#156](156-engine-gt-027-plan.md) | **27 spec engine** `GT-001`…`GT-027` — một task một spec | lát dọc | #115 #120; #130 là pilot, chặn 26 task còn lại |

### 4.1 Vì sao render đứng đầu

Ba lý do đo được, không phải ưu tiên cảm tính:

1. Sàn MVP ≥120 game level **đang đạt ở 228**, trong khi **không màn nào vẽ ra hình**. Mọi số
   đo nội dung phía sau đều đo một thứ trẻ chưa mở được.
2. `render()` không phụ thuộc corpus. Nó chạy song song với mọi việc dữ liệu ở #117–#122.
3. Chi phí thật chưa ai đo. [`Task #130`](130-engine-gt-001-plan.md) là **pilot**: `GT-001` có
   contract đơn giản nhất và 38 level, nên nó là chỗ rẻ nhất để chứng minh cả khuôn spec lẫn
   khuôn `render()`. 26 task engine còn lại chỉ bắt đầu sau khi #130 merge.

### 4.2 Việc chạy song song được

| Nhóm | Task | Vì sao độc lập |
|---|---|---|
| Hạ tầng vẽ và cổng | #115 ∥ #120 | Hai thư mục khác nhau trong `packages/game-engine` |
| Dữ liệu | #117 → #118 | Chỉ chạm `packages/db/src/seed-content/` và cổng của nó |
| Từ vựng | #119 | `packages/shared/src/constants` và từ vựng seed |
| **Engine** | #131 … #156 sau khi #130 merge | Mỗi task chạm đúng `templates/<mã>/`, `engines/<mã>.md`, và corpus của riêng engine đó |
| Giáo án | #123 → #124 | Chạm bảng lesson và route enrollment |
| Hạ tầng máy | #128 | Chỉ chạm `infra/` và `scripts/deploy/` |

Hai mươi sáu task engine sau pilot là **nhánh song song rộng nhất của toàn dự án**. Ba file
dùng chung, và cả ba **Cấm — NEVER** sửa trong task engine: `render-system.ts`,
`engine-depth.json`, và mọi dòng khác của `render-implemented.json`.

#122 và #125 là hai điểm hợp lưu. Chúng **Cấm — NEVER** bắt đầu trước khi mọi nhánh vào đã merge.

## 5. Ba quyết định người chặn nhiều task nhất

| Mã | Câu hỏi | Chặn |
|---|---|---|
| `Q114-1` | 162 level không parse được `content_contract`: sửa nội dung cho vừa contract, hay đổi contract cho vừa nội dung? | #117 #118 #122 #125 |
| `Q114-2` | Sàn bậc 2 là 12 hay 20 level mỗi engine? | #121 #122 #125 |
| `Q114-3` | Nhà cung cấp VPS, tên miền thật, đích sao lưu ngoài máy | #128, và toàn bộ go-live |

`Q114-1` là nặng nhất: nó quyết 162 bản ghi được sửa bằng version mới hay contract mang
breaking change. Mọi cách đều là INSERT, **Cấm — NEVER** `UPDATE` bản đã publish (`BR-CSA-01`).

## 6. Ranh giới của Task #114

Task này **chỉ** sinh hồ sơ. Nó:

- ghi **42** cặp `plan`/`todo` ở `docs/tasks/`: 15 task ngang `#115`–`#129` và 27 lát dọc
  engine `#130`–`#156`;
- ghi thêm một mục vào [`roadmap.md`](../specs/roadmap.md) thay cho bảng chốt 2026-08-18 đã cũ;
- **Cấm — NEVER** sửa file nào trong `docs/specs/**` ngoài `roadmap.md`;
- **Cấm — NEVER** lật `status` của bất kỳ spec nào;
- **Cấm — NEVER** chạm mã sản phẩm.

## 7. Điều kiện nghiệm thu

1. Cả 49 file chưa đóng — 14 spec `approved` ở mục 2.2, 8 spec `draft` ở mục 2.3, 27 phiếu
   engine ở mục 2.4 — có một task sở hữu ở bảng mục 4. Ngoại lệ duy nhất là
   [`engine-render-contract`](../specs/01-platform/engine-render-contract.md): nó xuất hiện ở
   **hai** task (#115 hạ tầng, #116 đóng), vì 27 engine không cài `render()` trong một PR được.
2. Mười lăm cặp task ngang `#115`–`#129`, đếm bằng `ls docs/tasks/1{1[5-9],2[0-9]}-*-plan.md`
   — glob `12*` sẽ bắt nhầm `12-corpus-debt-sweep`.
3. Hai mươi bảy cặp task engine `#130`–`#156`, ánh xạ một-một với `GT-001`…`GT-027`; đếm bằng
   `ls docs/tasks/1[3-5][0-9]-engine-*-plan.md`.
4. Mọi liên kết nội bộ trong 85 file mới resolve được.
5. `roadmap.md` có mục mới trỏ về Task #114, và mục chốt 2026-08-18 được đánh dấu đã thay thế.
6. Không file nào dưới `docs/specs/` đổi `status`.

## 8. Câu hỏi mở

1. `Q114-1`, `Q114-2`, `Q114-3` ở mục 5 — cả ba cần người quyết, không có mặc định an toàn.
2. Ba spec P5 ở mục 2.2 có checklist tick hết mà cờ chưa lật: đó là quên lật, hay acceptance
   chưa từng chạy? Task #127 đo, nhưng nếu là ca thứ hai thì #127 nở ra thành task nội dung.
3. Hai checklist [`55-p3-2`](55-p3-2-lesson-activity-authoring-todo.md) (0/196) và
   [`56-p3-3`](56-p3-3-curriculum-model-builder-todo.md) (0/164) chưa tick ô nào trong khi spec
   chúng phục vụ đã `implemented`. Cần một lượt đo riêng để biết đó là hồ sơ bỏ quên hay cờ đặt
   sớm. Nằm ngoài phạm vi #114 — ghi lại để không mất.
