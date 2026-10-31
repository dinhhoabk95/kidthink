# Báo Cáo Điều Phối Montessori Pipeline (Multi-Agent Team 4 Giai Đoạn)

## 1. Kiến Trúc Đội Ngũ Subagents (Tối Đa $\le 10$ Subagent Đồng Thời)

```
[22 Tệp PDF Học Liệu (496 trang)]
       │
       ▼ (pdftoppm 90 DPI JPEG)
[docs/montessori/extracted/chang-XX/pages/page-*.jpg]
       │
       ▼
Giai đoạn 1: montessori_pdf_analyzer (Model: 3.8 Flash)
  - Đọc trực tiếp toàn bộ trang JPEG của từng cuốn PDF
  - Trích xuất cấu trúc bài tập, câu chuyện, số lượng, đáp án, nhiễu, sư phạm CPA
  - Lưu: docs/montessori/extracted/chang-XX/analysis.json (22/22 hoàn tất)
       │
       ▼
Giai đoạn 2: montessori_spec_planner (Model: Argon / Pro)
  - Áp dụng workflow /spec để đánh giá và ánh xạ vào 38 khuôn game hiện hữu (GT-000..GT-037)
  - Lên kế hoạch bổ sung SkillDataset & SkillLevelPlan[] cho database seeder hiện tại
  - Lưu: docs/specs/montessori-pipeline/chang-XX-spec.md & chang-XX-tasks.md (22/22 hoàn tất)
       │
       ▼
Giai đoạn 3: montessori_code_implementer (Model: 3.8 Flash)
  - Phổ biến dữ liệu và màn chơi Montessori (sequence >= 0101, montessori_ref WBxx-Dy)
    trực tiếp vào 64 file kỹ năng trong packages/content/src/skills/c1..c6/
  - Bảo toàn tuyệt đối level hiện có, tuân thủ BR-MCM-06, BR-MGL-01/02/12, BR-ECD-03 (22/22 hoàn tất)
       │
       ▼
Giai đoạn 4: montessori_code_reviewer (Model: Argon / Pro)
  - Kiểm định từng file seeder qua Cổng 0..9, Cổng Montessori, Engine Content Depth, Biome & TypeScript
  - Trực tiếp sửa dứt điểm mọi vi phạm cổng và xuất báo cáo nghiệm thu
  - Lưu: docs/specs/montessori-pipeline/chang-XX-review.md (22/22 APPROVE 100%)
```

## 2. Kết Quả Nghiệm Thu Toàn Bộ Corpus (`packages/content` & `packages/content-build`)

1. **Không tạo template `GT-038+` mới**: 100% bài tập từ 22 cuốn PDF được ánh xạ vào các khuôn game chuẩn hiện hữu (`GT-000`, `GT-001`, `GT-002`, `GT-003`, `GT-005`, `GT-006`, `GT-008`, `GT-009`, `GT-010`, `GT-011`, `GT-013`, `GT-014`, `GT-015`, `GT-016`, `GT-024`, `GT-028`).
2. **Phổ biến vào Database Seeder hiện tại**: Làm giàu `SkillDataset` và bổ sung các màn chơi Montessori (`montessori_ref: "WB00-D1"` .. `"WB21-D3"`, mã `GL-<COMP>-<STRAND>-<MECH>-01xx..03xx`) trên **64 file kỹ năng** thuộc `packages/content/src/skills/`.
3. **Cổng Kiểm Định Tự Động**:
   - `pnpm --filter @mindkid/content test`: **8/8 test files, 66/66 tests PASS**.
   - `pnpm --filter @mindkid/content-build exec tsx src/cli/check-seed-gates.ts`: **2.135 / 2.135 levels PASS (0 lỗi)**.
   - `pnpm --filter @mindkid/content-build exec tsx src/cli/seed-check.ts`: **2.135 / 2.135 levels PASS (0 lỗi)**.
   - `pnpm biome check packages/content packages/content-build`: **650 files checked, 0 lỗi**.
   - `tsc --noEmit` trên `@mindkid/content` và `@mindkid/content-build`: **Exit code 0, 0 `any`, 0 `unknown`**.
