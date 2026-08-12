# Kế hoạch — Task #81: Contract evidence sư phạm và playtest với trẻ

> **Loại task:** specification/quality gate. Không tuyển trẻ, không thu dữ liệu, không chạy
> nghiên cứu và không đưa claim marketing trong task này.

## 1. Outcome

Biến mục tiêu “rèn luyện, khai phá tư duy cho trẻ mầm non” thành một success contract có thể
kiểm chứng trong phạm vi sản phẩm, đồng thời tạo protocol an toàn để playtest với trẻ không trở
thành collection dữ liệu tuỳ tiện hoặc bằng chứng bị diễn giải quá mức.

Test chức năng chứng minh phần mềm chạy đúng; Task #81 định nghĩa bằng chứng nào mới được dùng
để nói trải nghiệm hỗ trợ luyện tập một năng lực tư duy. Đây không phải nghiên cứu chẩn đoán,
đo IQ hay chứng minh quan hệ nhân quả lâm sàng.

## 2. Bằng chứng cần xử lý

- [`SPEC.md`](../SPEC.md) §1.7 có KPI acquisition, engagement, revenue, kỹ thuật và content
  volume nhưng chưa có KPI/criterion sư phạm.
- Task #26/#36/#57 nhắc quan sát hoặc kiểm thử với trẻ thật nhưng chưa có một protocol chung về
  consent, assent, stop criteria, sampling, retention và ranh giới claim.
- Telemetry gameplay hiện tại không tự chứng minh trẻ hiểu chiến lược hay chuyển giao năng lực.

## 3. Assumptions và ranh giới

1. Evidence đầu tiên là product evidence trong hệ thống: trẻ hiểu nhiệm vụ, thử chiến lược,
   tiến bộ qua lượt và không bị UI/audio cản trở; không gọi đó là clinical efficacy.
2. Mọi phiên với trẻ cần đồng ý của người giám hộ, assent phù hợp độ tuổi và quyền dừng ngay.
3. Chỉ thu trường tối thiểu đã được duyệt; không ghi hình/giọng, tên thật hay free text mặc định.
4. Nhóm tuổi, competency và game template phải được phân tầng; một tổng số trung bình không đủ.
5. Ngưỡng thành công, cỡ mẫu và claim cuối cùng là quyết định người, không do agent tự đặt.
6. Nếu cần dữ liệu trẻ vượt contract hiện có, sửa spec dữ liệu/consent trước mọi collection.

## 4. Dependencies và đồ thị

```text
Task #79 audit
  └──→ Checkpoint A: claim + measure + ngưỡng + nhóm quan sát
         └──→ WP81.2 pedagogical-evidence spec
                └──→ WP81.3 child-playtest protocol
                       ├──→ Task #26/#36 gate P1
                       └──→ Task #57 gate P3
                              └──→ evidence implementation task mới
```

Task #80 phải đóng các biến audio ảnh hưởng khả năng hiểu instruction trước khi dùng kết quả
playtest để đánh giá thiết kế sư phạm. Auth/consent/child-data specs là dependency bắt buộc nếu
protocol ghi bất kỳ dữ liệu nào vào hệ thống.

## 5. Work packages

| ID | Cỡ | Công việc | Kết quả kiểm được |
|---|---:|---|---|
| WP81.1 | S | Decision brief về claim, đơn vị đo, age band/competency/template và ngưỡng | Checkpoint A có người duyệt; không có số placeholder |
| WP81.2 | M | Soạn một quality spec sở hữu pedagogical evidence | Objective, metric definition, exclusions, decision rule và traceability |
| WP81.3 | M | Soạn protocol playtest: consent/assent, nhiệm vụ, stop criteria, trường dữ liệu, retention, incident path | Checklist phiên thử có thể audit; không PII mặc định |
| WP81.4 | S | Cập nhật [`SPEC.md`](../SPEC.md) KPI/success criteria và link Task #26/#36/#57/roadmap | Một nguồn contract, plan khác chỉ link |
| WP81.5 | S | Tạo task implementation/collection riêng sau khi spec `approved` | Work package S/M, negative tests, privacy/security review |

Nếu “pedagogical evidence” và “child playtest operations” là hai outcome ship độc lập, chúng
phải là hai spec; plan không ép gộp để tiết kiệm file.

## 6. Checkpoint A — quyết định người

Product/Pedagogy/Privacy phải duyệt:

1. Claim chính xác được phép nói: ví dụ “hỗ trợ luyện tập” khác với “cải thiện năng lực”.
2. Measure nào phản ánh mục tiêu: task comprehension, strategy variety, assisted-to-independent
   transition, mastery retention hay transfer; measure nào chỉ là engagement.
3. Ngưỡng, cỡ mẫu tối thiểu và cách phân tầng theo tuổi/competency/template.
4. Dữ liệu nào được phép thu, retention bao lâu, ai xem và cách rút consent/xoá.
5. Khi nào phải dừng phiên, loại kết quả hoặc quay lại sửa game/audio trước khi ship.

## 7. Acceptance criteria

- [ ] [`SPEC.md`](../SPEC.md) có criterion/KPI sư phạm được người duyệt, không lẫn engagement
      với learning.
- [ ] Có đúng một spec owner cho mỗi outcome evidence/protocol được nhận.
- [ ] Mọi metric có định nghĩa, mẫu số, cửa sổ thời gian, phân tầng và decision rule.
- [ ] Claim exclusions cấm IQ/clinical/causal claim khi evidence không hỗ trợ.
- [ ] Protocol có guardian consent, child assent, stop criteria, minimal data, access, retention,
      deletion và incident escalation.
- [ ] Task #26/#36/#57 link protocol thay vì tự tạo ba chuẩn “trẻ thật” khác nhau.
- [ ] Không playtest/collection trước human checkpoint và child-data/privacy review.
- [ ] Spec lint/gate xanh; diff được người review, không auto-merge.

## 8. Verification

```bash
pnpm lint:specs
pnpm check
rg -n "trẻ thật|playtest|evidence|sư phạm|pedagog" SPEC.md docs/specs docs/tasks
rg -n "consent|assent|stop criteria|retention|clinical|IQ" docs/specs docs/tasks
```

Kết quả phải chỉ ra một owner canonical và các consumer link tới owner; không được có claim cao
hơn strength của evidence.

## 9. Risks

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Dùng completion/retention làm learning KPI | Tối ưu nghiện dùng thay vì tư duy | Tách engagement khỏi evidence sư phạm |
| Agent tự đặt ngưỡng đẹp | Contract không có căn cứ | Checkpoint A + lý do cho từng decision rule |
| Thu quá nhiều dữ liệu trẻ | Rủi ro privacy và vận hành | Data minimization, retention, deletion, no recording mặc định |
| Gộp mọi tuổi/template | Che thất bại của nhóm nhỏ tuổi | Phân tầng bắt buộc |
| Claim nhân quả từ playtest nhỏ | Sai khoa học và marketing | Claim ladder + exclusions |

## 10. Definition of done

Task #81 hoàn tất khi claim/measure/ngưỡng đã được người duyệt, spec owner và protocol ở trạng
thái `approved`, root KPI/cross-link đã cập nhật, lint xanh và task triển khai evidence kế tiếp
được tạo. Chỉ thêm checklist “thử với trẻ” không đủ hoàn tất.
