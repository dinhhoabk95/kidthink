# Kế hoạch — Task #80: Đóng contract audio tiếng Việt

> **Loại task:** contract-first, chỉ sửa spec và hồ sơ task. Không viết runtime code, không
> upload/thu âm nội dung và không phát hành asset.

## 1. Outcome

Đóng đường đi end-to-end cho audio mà trẻ chưa đọc thạo có thể dùng được: nguồn âm thanh,
fallback tiếng Việt, hành vi khi offline, lifecycle asset và ranh giới authoring phải có spec
owner rõ ràng trước khi giao implementation.

Task này không mặc định rằng Web Speech, clip tĩnh hay thu âm trong studio là đáp án. Người sở
hữu sản phẩm chốt chiến lược ở Checkpoint A; sau đó task mới tạo đúng spec owner và task
implementation tương ứng.

## 2. Bằng chứng cần xử lý

- [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md) và
  [`game-config-delivery.md`](../specs/04-play/game-config-delivery.md) cần audio ở runtime.
- Quyết định `D-AV` trong [`Task #33`](33-p1-8-scaffolding-feedback-gate-limits-plan.md) nói tới
  clip tĩnh + Web Speech nhưng chưa định nghĩa fallback khi thiết bị không có giọng `vi-VN`.
- [`Task #47`](47-p2-5-schema-driven-form-plan.md) từng đẩy audio widget sang P2.7, trong khi
  [`Task #49`](49-p2-7-asset-storage-plan.md) chỉ sở hữu image storage/upload.
- Corpus chưa có một owner duy nhất cho audio asset delivery/storage hoặc audio authoring.

## 3. Assumptions và ranh giới

1. Trẻ 3–6 tuổi có thể chưa đọc; một instruction quan trọng không được chỉ có chữ.
2. `speechSynthesis`, giọng `vi-VN` và kết nối mạng không được coi là luôn sẵn có.
3. Runtime phải fail closed theo hướng an toàn: không crash, không treo và không để trẻ ở màn
   hình không thể hiểu; visual cue là fallback tối thiểu nếu contract được duyệt.
4. Không dùng runtime LLM để sinh instruction cốt lõi; không ghi giọng trẻ.
5. Task #49 tiếp tục chỉ sở hữu ảnh. Nếu audio asset được nhận, nó có spec/lifecycle riêng.
6. Mọi quyết định làm phát sinh giá, bản quyền giọng đọc hoặc dữ liệu cá nhân cần human review.

## 4. Dependencies và thứ tự

```text
Task #79 audit
  └──→ Checkpoint A: chiến lược audio + fallback
         ├──→ WP80.2 runtime delivery contract
         └──→ WP80.3 authoring/asset contract (chỉ khi được nhận)
                  └──→ cập nhật index + BR/error/event registry
                         └──→ task implementation mới ──→ P1/P2 gate
```

- Input bắt buộc: [`SPEC.md`](../SPEC.md) §0/§11, spec runtime/config,
  [`business-rules.md`](../specs/00-foundation/business-rules.md) §7.3 và quyết định
  `D-AV` hiện hành.
- Task implementation audio không được bắt đầu trước WP80.4.
- Nếu chỉ duyệt TTS + visual fallback, WP authoring phải ghi rõ `not planned`; không tạo
  placeholder giả cho upload/recording.

## 5. Work packages

| ID | Cỡ | Công việc | Kết quả kiểm được |
|---|---:|---|---|
| WP80.1 | S | Lập decision matrix: clip tĩnh, Web Speech, audio asset; online/offline; có/không `vi-VN`; sáu engine template | Checkpoint A ký một phương án và ranh giới phase |
| WP80.2 | M | Soạn/sửa spec owner cho runtime audio delivery, fallback, cache, accessibility và lỗi | Mỗi outcome đúng một owner; test matrix đủ nhánh thiết bị |
| WP80.3 | M | Nếu được duyệt, soạn spec riêng cho storage/upload/authoring, format, kích thước, quyền dùng và lifecycle | Không trộn audio với image; nếu không nhận thì có quyết định loại bỏ rõ |
| WP80.4 | S | Cập nhật [`SPEC.md`](../SPEC.md), [`index.md`](../specs/index.md), roadmap, registry BR/error/event và cross-link task liên quan | Lint spec xanh, không contract copy |
| WP80.5 | S | Tạo task implementation lát dọc S/M sau khi spec `approved` | Có owner, dependency, negative test, file scope và gate người |

Mỗi work package chạm khoảng 1–5 file. WP80.2 và WP80.3 chỉ được tách thành spec độc lập nếu
đó là hai outcome có thể ship độc lập theo
[`CONVENTIONS.md`](../specs/CONVENTIONS.md).

## 6. Checkpoint A — quyết định người

Người sở hữu phải trả lời trước khi WP80.2 bắt đầu:

1. P1 dùng clip tĩnh, Web Speech, hay kết hợp; nguồn nào là primary?
2. Khi không có giọng `vi-VN` hoặc offline, visual cue có đủ hay phải có asset tải trước?
3. Template/competency nào bắt buộc audio theo C5, template nào chỉ là enhancement?
4. P2 có thu âm/upload/chọn audio trong studio không; ai sở hữu bản quyền và duyệt nội dung?
5. Giới hạn format, dung lượng, cache/retention và ngân sách vận hành là gì?

Không dùng placeholder để tự lấp năm câu hỏi này.

## 7. Acceptance criteria

- [ ] Có decision record được người duyệt cho primary source, fallback và offline behavior.
- [ ] Mọi instruction quan trọng có đường visual/audio phù hợp trẻ chưa đọc; thiếu audio không
      gây crash, silent dead-end hay lệch đáp án.
- [ ] Runtime delivery và authoring/storage có đúng một spec owner cho mỗi outcome được nhận.
- [ ] C5 và sáu engine template có test matrix trên thiết bị Lenovo mục tiêu, có/không `vi-VN`.
- [ ] Không plan active nào coi Task #49 ảnh là owner audio.
- [ ] BR, error code và event mới (nếu có) được đăng ký trước khi dùng.
- [ ] Có task implementation S/M riêng; spec và `pnpm lint:specs` xanh trước code.
- [ ] Diff được người review; không auto-merge, không phát hành asset.

## 8. Verification

```bash
pnpm lint:specs
pnpm check
rg -n "audio.*P2\.7|P2\.7.*audio|speechSynthesis|vi-VN" SPEC.md docs/specs docs/tasks
rg -n "BR-[A-Z]+-|[A-Z_]+_FAILED" docs/specs/00-foundation/business-rules.md docs/specs/00-foundation/error-codes.md
```

Query audio chỉ được trả về contract owner, decision/blocker hoặc lịch sử giải thích; không còn
active promise rằng image pipeline tự cung cấp audio.

## 9. Risks

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Tin rằng mọi browser có giọng Việt | Trẻ nhận màn hình im lặng | Matrix thiết bị + fallback bắt buộc |
| Gộp audio vào image storage | Lifecycle, MIME và quyền dùng sai | Owner độc lập theo outcome |
| Thu âm giọng trẻ | Phát sinh dữ liệu trẻ nhạy cảm | Ngoài scope; negative rule rõ |
| Tạo spec trước quyết định | Contract chứa placeholder mâu thuẫn | Checkpoint A đứng trước WP80.2 |
| Audio tải động không có offline plan | PWA/play bị gãy | Chốt cache/preload hoặc visual fallback |

## 10. Definition of done

Task #80 hoàn tất khi Checkpoint A đã duyệt, spec owner tương ứng ở trạng thái `approved`, mọi
registry/cross-link đã cập nhật, lint xanh và task implementation kế tiếp đã có lát S/M. Chỉ có
decision matrix mà chưa có owner không được tính là hoàn tất.
