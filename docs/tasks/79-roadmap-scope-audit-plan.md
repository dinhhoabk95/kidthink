# Kế hoạch — Task #79: Audit roadmap, scope và mức sẵn sàng

> Audit lại 2026-08-12 theo yêu cầu Product. Task này chỉ sửa canonical specs và hồ sơ
> plan/todo; không viết runtime code, schema hay migration.

## Kết luận

**Chưa thể kết luận toàn hệ thống đã được plan đầy đủ.** Coverage cấu trúc đã đủ cho corpus
hiện tại, nhưng coverage semantic và execution readiness còn thiếu.

| Phép kiểm | Kết quả |
|---|---:|
| Module spec xuất hiện trong [`roadmap.md`](../specs/roadmap.md) | 130/130 |
| File plan có todo cùng số/slug | 72/72 lúc bắt đầu audit; 75/75 sau remediation |
| Increment plan active từ Task #16–#72 và #78 | 58 |
| Work package tự gắn cỡ `L`/`XL` trước audit | 19 trong 10 plan |
| Khoảng trống contract/implementation có bằng chứng | 3 nhóm |

Ba nhóm thiếu là audio tiếng Việt, evidence sư phạm/kiểm thử với trẻ, và tích hợp account P3.
Vì vậy câu “P0–P4 đã đủ” trong bản trước chỉ đúng theo nghĩa **có tên task**, không đúng theo
nghĩa “có thể giao cho một agent implement an toàn ngay”.

## 1. Assumptions đã khóa

1. Phạm vi sản phẩm hiện hành vẫn là web responsive, tablet-first, vận hành tại Việt Nam;
   PWA là web delivery.
2. “Đủ coverage” nghĩa là mọi outcome có spec owner và đường task. “Implementation-ready” còn
   đòi contract đã duyệt, dependency đứng trước, work package S/M, acceptance và verification.
3. Không tự chọn TTS hay thu âm; không tự đổi ≥60 thành ≥126 lesson; không tự đặt ngưỡng hiệu
   quả sư phạm. Ba quyết định này cần người sở hữu.
4. Hồ sơ Task #1–#14 là audit trail. Không sửa tick lịch sử để làm tiến độ trông tốt hơn.

## 2. Bằng chứng coverage cấu trúc

- Structural query trả `module_specs=130`, `roadmap_linked_unique=130`,
  `missing_from_roadmap=0`.
- Baseline có 72 plan và 72 todo. Sau khi thêm Task #80–#82 có 75 plan và 75 todo; không có
  `MISSING_PLAN` hay `MISSING_TODO`.
- P0 dùng Task #1/#2/#3/#7/#14 và increment #16–#25; P1 dùng #26–#42; P2 dùng #43–#53;
  P3 dùng #54–#61; P4 dùng #62–#69; P5 dùng #70–#72/#78.
- Task #14 là dependency graph/phase gate, không thay acceptance chi tiết của increment plan.

## 3. Thiếu sót semantic

### 3.1 Audio tiếng Việt không có owner end-to-end

[`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md) và
[`game-config-delivery.md`](../specs/04-play/game-config-delivery.md) sở hữu runtime. Quyết định
`D-AV` chọn audio clip tĩnh + Web Speech ở P1. Nhưng Task #47 ghi audio widget sang P2.7 trong
khi Task #49 chỉ sở hữu image storage/upload; corpus không có spec audio storage/authoring,
fallback khi không có giọng `vi-VN`, hay offline behavior. Đây là debt mất địa chỉ.

Xử lý: [`Task #80`](80-audio-contract-closure-plan.md) contract-first; Task #33/#47/#49 không
còn được coi P2.7 ảnh là coverage audio.

### 3.2 Mục tiêu sư phạm chưa có success contract

[`SPEC.md`](../SPEC.md) mục 1.7 đo acquisition, engagement, revenue, kỹ thuật và khối lượng nội
dung, nhưng chưa có KPI trả lời “trẻ được rèn luyện tư duy như thế nào”. Các plan #26/#36/#57
có ca “trẻ thật” rải rác mà không có protocol consent, stop criteria, sampling, data retention
hay ranh giới claim. Test chức năng không thay evidence sư phạm.

Xử lý: [`Task #81`](81-pedagogical-evidence-contract-plan.md) tạo spec owner và phase gate trước
khi kết quả playtest được dùng làm claim sản phẩm.

### 3.3 Ba debt account P3 không có task nhận

Task #38 ghi sang P3 ba việc: bật khối “Chương trình đang học”, chốt bố cục tài khoản nhiều trẻ,
và quyết định thư viện chung hay theo từng trẻ. Không plan #54–#61 nào nhắc ba việc này.

Xử lý: thêm P3.9 và [`Task #82`](82-p3-account-curriculum-integration-plan.md). Task này dùng
spec owner hiện có, không tạo outcome mới nếu Checkpoint A giữ nguyên contract.

### 3.4 Hai blocker nội dung bị mô tả định tính

- Guest cần **đúng sáu mã** level, một mỗi competency, nhưng Task #36 trước audit chỉ ghi “đủ
  level free”. Task #36 đã được sửa để chọn, in và kiểm đúng sáu mã.
- Root contract là ≥60 lesson, Task #54 đề xuất ≥126 lesson distinct. Cả hai không thể cùng là
  nguồn thật. Câu hỏi được đưa vào [`SPEC.md`](../SPEC.md) mục 15 và phải chốt trước P3.1.

### 3.5 Registry câu hỏi mở có blocker giả

Ba dòng ở [`SPEC.md`](../SPEC.md) §15 vẫn nằm dưới “Open questions” dù owner đã chốt:

- #4 trùng quyết định `D-CN` về Nhóm Nội dung và baseline review.
- #7 mâu thuẫn với chính §2.4: 60 game type v1 là backlog nội dung, sáu template là MVP.
- #8 đã đóng bằng `D-AS` trong
  [`legal-pages.md`](../specs/02-public/legal-pages.md): ngân sách 50M VND.

Audit đã chuyển #7/#8 sang “Đã chốt” và bỏ ba blocker giả khỏi bảng mở. Các câu thực sự còn mở
đều có đường xử lý: #1→Task #45, #2→Task #36, #5→Task #80, #10→Task #70/#71,
#11→Task #20/#42, #12→Task #81 và #13→Task #54 Checkpoint 0.

## 4. Scope drift đã xử lý

`D11` vẫn là canonical boundary: không classroom/native mobile/licensing/localization/market
placeholder. Task #73–#77 retired, không tái dùng. P5 chỉ còn Web scale qua Task #70–#72/#78.
Phần này của bản audit 2026-08-11 được giữ nguyên.

## 5. Đồ thị remediation

```text
Task #79 audit
  ├──→ Task #80 audio contract ──→ spec owner ──→ implementation task mới
  ├──→ Task #81 pedagogical evidence contract ──→ P1 evidence gate
  ├──→ P3.3 curriculum + P3.4 player ──→ Task #82 account integration
  └──→ atomize 19 L/XL package ──→ work package S/M ──→ test RED
```

Task #80/#81 phải đi trước code tương ứng. Task #82 chạy sau P3.3/P3.4. Việc atomize có thể
chạy theo lô độc lập vì chỉ sửa plan/todo, nhưng mỗi lô phải tránh file đang có implementation
song song.

## 6. Work package atomize

Audit ban đầu tìm 19 nhãn `L`/`XL`. Bốn nhãn được đổi thành work package M trong Task
#36/#47/#49; 15 nhãn còn lại đã được tách theo các lô dưới đây. Mỗi lô chạm tối đa hai cặp
plan/todo:

| Lô | Plan | Kết quả bắt buộc |
|---|---|---|
| A1 | #21, #27 | Hoàn tất — lô LO ≤30; core engine 3 M; mỗi template một M |
| A2 | #35 | Hoàn tất — gate 3 M; CLI/write path 3 M |
| B1 | #45 | Hoàn tất — order/proof/queue/approval tách API, UI và transaction tests |
| B2 | #48 | Hoàn tất — preview và level API, mỗi outcome 2 M |
| B3 | #50 | Hoàn tất — review screen, publish/version và SEO, mỗi outcome 2 M |
| B4 | #51 | Hoàn tất — data export tách query/privacy khỏi job/file delivery |

Query `rg '\*\*Cỡ:\*\* (L|XL)' docs/tasks/*-plan.md` hiện trả rỗng. Lô nội dung lớn được
biểu diễn bằng số work package M và batch limit, không giữ nhãn XL.

## 7. Acceptance criteria

- [ ] Coverage report phân biệt rõ structural coverage và implementation readiness.
- [ ] Task #80–#82 có plan/todo, dependency, acceptance, verification, checkpoint và human gate.
- [ ] Không tài liệu active nào gán audio implementation cho Task #49 ảnh.
- [ ] P3 có task nhận đủ ba debt account từ Task #38.
- [ ] Task #36 chốt đúng sáu mã allow-list guest và dùng protocol Task #81 cho ca trẻ thật.
- [ ] Quyết định ≥60/≥126 lesson còn mở được nêu ở canonical root, không bị plan tự chốt.
- [ ] [`SPEC.md`](../SPEC.md) §15 không còn liệt kê #4/#7/#8 như blocker sau khi chúng đã được
      chốt.
- [ ] Mọi work package L/XL kỹ thuật được tách xuống S/M trước test RED.
- [ ] D11 và danh sách task retired #73–#77 vẫn nguyên nghĩa.
- [ ] Human review diff trước merge; không auto-merge.

## 8. Verification

```bash
pnpm --filter @mindkid/gates test
pnpm check
pnpm test
rg -n "Task #7[3-7]|73-p5|74-p5|75-p5|76-p5|77-p5" SPEC.md docs/specs docs/tasks
rg -n "audio.*P2.7|P2.7.*audio" docs/tasks docs/specs
rg -n "Chương trình đang học|thư viện.*trẻ|bố cục.*nhiều trẻ" docs/tasks
rg -n "\\*\\*Cỡ:\\*\\* (L|XL)" docs/tasks/*-plan.md
```

Hai query đầu về retired/audio chỉ được trả về lịch sử giải thích hoặc blocker, không active
promise. Query debt P3 phải trả Task #82. Query size phải giảm theo từng work package.

### Kết quả chạy 2026-08-12

- `pnpm --filter @mindkid/gates test`: xanh — 130 specs, 15 checks, 0 lỗi.
- Coverage query: 130/130 spec trong roadmap; 75/75 plan có todo; không thiếu cặp.
- Size query: không còn nhãn `L`/`XL` trong plan active.
- `pnpm check`: lint, token, dependency, spec, emoji và progress xanh; dừng ở typecheck vì
  `packages/db/src/seed-master/taxonomy/index.ts` thiếu tên type `NodePgDatabase` tại sáu vị trí
  dòng 303/328/357/391/418/452. Audit tài liệu không chạm file này.
- `pnpm test`: chưa vào suite vì PostgreSQL local `127.0.0.1:5433` không chạy
  (`ECONNREFUSED` từ `packages/db/tests/global-setup.ts:97`). Không có test assertion nào chạy.

Hai gate cuối giữ trạng thái chưa đạt; không được đổi chúng thành xanh chỉ vì nguyên nhân nằm
ngoài diff tài liệu.

## 9. Risks

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Đếm file plan rồi tuyên bố đủ | Debt không có owner chỉ lộ ra khi code tới nơi | Tách coverage/readiness ở roadmap |
| Tự chốt TTS, lesson count hay KPI | Bịa contract sản phẩm và ngân sách | Task #80/#81 + human checkpoint; Task #54 phụ thuộc quyết định |
| Gộp audio vào image pipeline | Sai security/lifecycle và một spec sở hữu hai outcome | Spec owner riêng trước code |
| Playtest trẻ không protocol | Rủi ro pháp lý, đạo đức và evidence không dùng được | Task #81 + child-data boundary |
| Một task P3 trộn dữ liệu hai trẻ | Sai báo cáo và lộ dữ liệu trong cùng tài khoản | Task #82 có negative test chuyển active child |
| Giữ work package L/XL | Diff quá rộng, review người mất hiệu lực | Quy trình chín việc của Task #14 + lô atomize |

## 10. Open decisions cần người duyệt

1. Audio P1 dùng chiến lược nào khi thiết bị không có giọng `vi-VN`; P2 có thu âm/upload hay
   tiếp tục TTS?
2. Claim sư phạm nào MindKid được phép nói, và evidence tối thiểu nào đủ cho claim đó?
3. Giữ ≥60 lesson có tái sử dụng hay nhận ≥126 lesson distinct?
4. Thư viện ở P3 thuộc account hay từng child; layout nhiều trẻ dùng active-child hay overview?
