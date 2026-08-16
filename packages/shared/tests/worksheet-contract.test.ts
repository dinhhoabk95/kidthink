import { describe, expect, it } from "vitest";
import { validateLessonModel } from "../src/lesson-model.js";
import { validatePublishChecklist } from "../src/publish-checklist.js";
import {
  validateWorksheetContent,
  WORKSHEET_LAYOUT_TEMPLATES,
  worksheetFormSchema,
} from "../src/worksheet-model.js";

describe("Worksheet Contract & Validation (BR-WSM-01..08)", () => {
  const samplePatternColoring = {
    template: "pattern_coloring",
    rule_sequence: ["circle", "square"],
    rows: [
      {
        row_id: "row_1",
        items: [
          { id: "1", shape: "circle", is_blank: false, size_mm: 25 },
          { id: "2", shape: "square", is_blank: false, size_mm: 25 },
          { id: "3", shape: "circle", is_blank: true, size_mm: 25 },
          { id: "4", shape: "square", is_blank: true, size_mm: 25 },
        ],
      },
    ],
    stroke_pt: 2.5,
  };

  const samplePairMatching = {
    template: "pair_matching",
    left_column: [
      { id: "L1", shape: "circle", size_mm: 25 },
      { id: "L2", shape: "square", size_mm: 25 },
    ],
    right_column: [
      { id: "R1", shape: "circle", size_mm: 25 },
      { id: "R2", shape: "square", size_mm: 25 },
    ],
    correct_pairs: [
      { left_id: "L1", right_id: "R1" },
      { left_id: "L2", right_id: "R2" },
    ],
    stroke_pt: 2.0,
  };

  const sampleGroupCircling = {
    template: "group_circling",
    visual_target_symbol: "apple",
    items: [
      {
        id: "1",
        item_type: "apple",
        is_target: true,
        pos_x_pct: 20,
        pos_y_pct: 30,
        size_mm: 22,
      },
      {
        id: "2",
        item_type: "banana",
        is_target: false,
        pos_x_pct: 60,
        pos_y_pct: 40,
        size_mm: 22,
      },
      {
        id: "3",
        item_type: "apple",
        is_target: true,
        pos_x_pct: 80,
        pos_y_pct: 70,
        size_mm: 22,
      },
    ],
    target_count: 2,
    stroke_pt: 2.0,
  };

  const sampleShapeCompletion = {
    template: "shape_completion",
    items: [
      {
        id: "1",
        base_shape: "circle",
        missing_part: "half",
        dash_stroke_pt: 2.0,
        size_mm: 35,
      },
      {
        id: "2",
        base_shape: "square",
        missing_part: "outline_dash",
        dash_stroke_pt: 2.0,
        size_mm: 35,
      },
    ],
    stroke_pt: 2.0,
  };

  const sampleCountAndColor = {
    template: "count_and_color",
    groups: [
      {
        id: "g1",
        item_symbol: "star",
        item_count: 4,
        max_boxes: 5,
        box_size_mm: 20,
      },
      {
        id: "g2",
        item_symbol: "heart",
        item_count: 3,
        max_boxes: 5,
        box_size_mm: 20,
      },
    ],
    stroke_pt: 2.0,
  };

  const sampleSpotDifferences = {
    template: "spot_differences",
    scene_theme: "farm",
    differences_count: 3,
    spots: [
      {
        spot_id: "s1",
        x_pct: 25,
        y_pct: 30,
        radius_mm: 12,
        description_adult_vi: "Con gà thiếu mào",
      },
      {
        spot_id: "s2",
        x_pct: 70,
        y_pct: 50,
        radius_mm: 12,
        description_adult_vi: "Ngôi sao trên mái chuồng",
      },
      {
        spot_id: "s3",
        x_pct: 45,
        y_pct: 80,
        radius_mm: 12,
        description_adult_vi: "Đám cỏ bên phải",
      },
    ],
    stroke_pt: 2.0,
  };

  it("chấp nhận đúng 6 loại template đóng chuẩn theo spec (BR-WSM-01)", () => {
    expect(WORKSHEET_LAYOUT_TEMPLATES).toEqual([
      "pattern_coloring",
      "pair_matching",
      "group_circling",
      "shape_completion",
      "count_and_color",
      "spot_differences",
    ]);

    const samples = [
      { template: "pattern_coloring", blocks: samplePatternColoring },
      { template: "pair_matching", blocks: samplePairMatching },
      { template: "group_circling", blocks: sampleGroupCircling },
      { template: "shape_completion", blocks: sampleShapeCompletion },
      { template: "count_and_color", blocks: sampleCountAndColor },
      { template: "spot_differences", blocks: sampleSpotDifferences },
    ];

    for (const s of samples) {
      const res = validateWorksheetContent({
        title: `Phiếu bài tập ${s.template}`,
        layout_template: s.template,
        content_blocks: s.blocks,
        instructions_vi:
          "Hướng dẫn người lớn: Cho trẻ quan sát hình mẫu và thực hiện theo thứ tự.",
        learning_objective_ids: [101],
      });
      expect(res.ok).toBe(true);
      expect(res.errors).toEqual([]);
    }
  });

  it("từ chối loại worksheet thứ 7 ngoài danh mục đóng", () => {
    const res = validateWorksheetContent({
      title: "Phiếu bài tập tự chế",
      layout_template: "crossword_puzzle",
      content_blocks: { template: "crossword_puzzle" },
      instructions_vi: "Hướng dẫn người lớn: giải ô chữ",
      learning_objective_ids: [101],
    });
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.includes("không hợp lệ"))).toBe(true);
  });

  it("BR-WSM-02: từ chối nếu yêu cầu trẻ đọc chữ", () => {
    const readingBlock = {
      ...samplePatternColoring,
      reading_prompt: "Bé hãy đọc chữ và tô màu",
    };
    const res = validateWorksheetContent({
      title: "Phiếu đố bé đọc chữ",
      layout_template: "pattern_coloring",
      content_blocks: readingBlock,
      instructions_vi: "Hướng dẫn người lớn cho trẻ làm bài",
      learning_objective_ids: [101],
    });
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.includes("BR-WSM-02"))).toBe(true);
  });

  it("BR-WSM-04: từ chối nếu vùng làm bài < 20mm hoặc stroke < 2pt", () => {
    const smallAreaBlock = {
      ...samplePatternColoring,
      rows: [
        {
          row_id: "row_1",
          items: [
            { id: "1", shape: "circle", is_blank: false, size_mm: 10 }, // 10mm < 20mm
          ],
        },
      ],
      stroke_pt: 1.0, // 1pt < 2pt
    };
    const res = validateWorksheetContent({
      title: "Phiếu hình vẽ quá nhỏ",
      layout_template: "pattern_coloring",
      content_blocks: smallAreaBlock,
      instructions_vi: "Hướng dẫn người lớn hỗ trợ trẻ",
      learning_objective_ids: [101],
    });
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.includes("BR-WSM-04"))).toBe(true);
  });

  it("BR-WSM-05: từ chối nếu thiếu hướng dẫn người lớn ở chân trang", () => {
    const res = validateWorksheetContent({
      title: "Phiếu thiếu hướng dẫn",
      layout_template: "pattern_coloring",
      content_blocks: samplePatternColoring,
      instructions_vi: "", // rỗng
      learning_objective_ids: [101],
    });
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.includes("BR-WSM-05"))).toBe(true);
  });

  it("worksheetFormSchema parse hợp lệ cho Manager Studio", () => {
    const validForm = {
      code: "WS-0001",
      title: "Phiếu nối cặp hình tương ứng",
      layout_template: "pair_matching",
      content_blocks: samplePairMatching,
      instructions_vi:
        "Hướng dẫn người lớn: Cho trẻ dùng bút chì nối 2 cột với nhau.",
      learning_objective_ids: [201],
      access_tier: "standard",
    };
    const parseResult = worksheetFormSchema.safeParse(validForm);
    expect(parseResult.success).toBe(true);
  });
});

describe("Publish Checklist cho Worksheet (BR-WSM-03, BR-WSM-06, D-P4J)", () => {
  const baseWorksheetPayload = {
    title: "Phiếu tô màu quy luật",
    layout_template: "pattern_coloring",
    content_blocks: {
      template: "pattern_coloring",
      rule_sequence: ["circle", "square"],
      rows: [
        {
          row_id: "r1",
          items: [
            { id: "1", shape: "circle", is_blank: false, size_mm: 25 },
            { id: "2", shape: "square", is_blank: true, size_mm: 25 },
            { id: "3", shape: "circle", is_blank: true, size_mm: 25 },
          ],
        },
      ],
      stroke_pt: 2.0,
    },
    instructions_vi:
      "Hướng dẫn người lớn: Cho trẻ tô màu hình tròn rồi đến hình vuông.",
    learning_objective_ids: [101],
    skill_ids: [1],
    access_tier: "standard",
    content_version: 2,
    pdf_path: "s3://tinimath-content/worksheets/WS-0001-v2.pdf",
    render_page_count: 1,
    render_grayscale_passed: true,
    source_content_version: 2,
    render_input_hash: "hash_abc_123",
    expected_input_hash: "hash_abc_123",
  };

  it("vượt qua checklist khi đầy đủ evidence render thành công", () => {
    const result = validatePublishChecklist("worksheet", baseWorksheetPayload);
    expect(result.ok).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it("chặn publish khi chưa có pdf_path", () => {
    const payload = { ...baseWorksheetPayload, pdf_path: null };
    const result = validatePublishChecklist("worksheet", payload);
    expect(result.ok).toBe(false);
    expect(result.missing).toContain("pdf_render_failed");
  });

  it("BR-WSM-03: chặn publish khi PDF nhiều hơn 1 trang A4", () => {
    const payload = { ...baseWorksheetPayload, render_page_count: 2 };
    const result = validatePublishChecklist("worksheet", payload);
    expect(result.ok).toBe(false);
    expect(result.missing).toContain("worksheet_multi_page_forbidden");
  });

  it("BR-WSM-01: chặn publish khi kiểm tra in đen trắng không đạt", () => {
    const payload = { ...baseWorksheetPayload, render_grayscale_passed: false };
    const result = validatePublishChecklist("worksheet", payload);
    expect(result.ok).toBe(false);
    expect(result.missing).toContain("worksheet_grayscale_failed");
  });

  it("D-P4J: chặn publish khi version bản render không khớp với version draft", () => {
    const payload = { ...baseWorksheetPayload, source_content_version: 1 }; // draft is v2
    const result = validatePublishChecklist("worksheet", payload);
    expect(result.ok).toBe(false);
    expect(result.missing).toContain("worksheet_render_version_stale");
  });

  it("D-P4J: chặn publish khi hash nội dung draft bị thay đổi sau khi render", () => {
    const payload = {
      ...baseWorksheetPayload,
      render_input_hash: "hash_old",
      expected_input_hash: "hash_new_after_edit",
    };
    const result = validatePublishChecklist("worksheet", payload);
    expect(result.ok).toBe(false);
    expect(result.missing).toContain("worksheet_render_hash_mismatch");
  });
});

describe("Lesson Alternative Requirement for Worksheet (BR-WSM-07)", () => {
  const guideText =
    "Mục tiêu: Đếm đến 5. Chuẩn bị: Thẻ số. Mở đầu: Hát bài tập đếm. Làm được: Đếm trôi chảy. Cần giúp: Dùng ngón tay đếm cùng trẻ.";

  it("từ chối lesson có activity worksheet nhưng KHÔNG có hoạt động thay thế không cần in", () => {
    const lessonWithOnlyWorksheet = {
      code: "LES-0001",
      title: "Bài học luyện tập quy luật",
      guide: guideText,
      estimated_minutes: 20,
      assessment_vi: "Trẻ chỉ ra được hình tiếp theo trong chuỗi.",
      warm_up_vi: "Khởi động cùng cô",
      reflection_vi: "Đúc kết bài học",
      activities: [
        {
          activity_code: "ACT-0001",
          kind: "worksheet",
          title: "Phiếu tô màu quy luật",
        },
      ],
    };

    const res = validateLessonModel(lessonWithOnlyWorksheet);
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.includes("BR-WSM-07"))).toBe(true);
  });

  it("chấp nhận lesson có activity worksheet KÈM hoạt động thay thế không cần in (discussion/manipulative)", () => {
    const lessonWithAlternative = {
      code: "LES-0002",
      title: "Bài học luyện tập quy luật có phương án thay thế",
      guide: guideText,
      estimated_minutes: 25,
      assessment_vi: "Trẻ xếp được các khối gỗ hoặc tô được phiếu quy luật.",
      warm_up_vi: "Khởi động cùng cô",
      reflection_vi: "Đúc kết bài học",
      activities: [
        {
          activity_code: "ACT-0001",
          kind: "worksheet",
          title: "Phiếu tô màu quy luật",
        },
        {
          activity_code: "ACT-0002",
          kind: "manipulative",
          title:
            "Xếp khối gỗ màu theo quy luật tương ứng (phương án không cần in)",
        },
      ],
    };

    const res = validateLessonModel(lessonWithAlternative);
    expect(res.ok).toBe(true);
    expect(res.errors).toEqual([]);
  });
});
