import type { ContentSeed } from "#src/seed-content/types";

function getAgeRange3to6(i: number): [number, number] {
  if (i < 3) {
    return [3, 4];
  }
  if (i < 7) {
    return [4, 5];
  }
  return [5, 6];
}

function getAgeRange4to6(i: number): [number, number] {
  if (i < 5) {
    return [4, 5];
  }
  return [5, 6];
}

function getAccessTier(
  i: number,
  freeOffset = 0
): "free" | "login" | "standard" {
  const mod = (i + freeOffset) % 5;
  if (mod === 0) {
    return "free";
  }
  if (mod === 1) {
    return "login";
  }
  return "standard";
}

const THEMES = [
  "school",
  "farm",
  "food",
  "animal",
  "nature",
  "ocean",
  "vehicle",
  "art",
  "home",
  "festival",
] as const;

// ==========================================
// 1. GT-014: CÂN HAI BÊN (Age 5-6 only)
// ==========================================

const DEFAULT_OBJECT_PAIR = {
  heavyRef: "🐘",
  lightRef: "🐭",
  addRef: "🍌",
  heavyWeight: 6,
  lightWeight: 2,
  addWeight: 4,
};

// 1.1 D5-03: So sánh Nặng/Nhẹ (C1.MEAS.03, C1.MEAS.04) — 10 levels
function createD503Levels(): ContentSeed<unknown, unknown>[] {
  const objects = [
    DEFAULT_OBJECT_PAIR,
    {
      heavyRef: "🍉",
      lightRef: "🍎",
      addRef: "🍌",
      heavyWeight: 5,
      lightWeight: 2,
      addWeight: 3,
    },
    {
      heavyRef: "🚗",
      lightRef: "🚲",
      addRef: "🛹",
      heavyWeight: 7,
      lightWeight: 3,
      addWeight: 4,
    },
    {
      heavyRef: "🐳",
      lightRef: "🐟",
      addRef: "🦀",
      heavyWeight: 8,
      lightWeight: 3,
      addWeight: 5,
    },
    {
      heavyRef: "🐻",
      lightRef: "🐰",
      addRef: "🥕",
      heavyWeight: 6,
      lightWeight: 1,
      addWeight: 5,
    },
    {
      heavyRef: "🚌",
      lightRef: "🚗",
      addRef: "🚲",
      heavyWeight: 7,
      lightWeight: 4,
      addWeight: 3,
    },
    {
      heavyRef: "🐻",
      lightRef: "🐸",
      addRef: "🦆",
      heavyWeight: 6,
      lightWeight: 2,
      addWeight: 4,
    },
    {
      heavyRef: "🌽",
      lightRef: "🥕",
      addRef: "🍅",
      heavyWeight: 5,
      lightWeight: 1,
      addWeight: 4,
    },
    {
      heavyRef: "✈️",
      lightRef: "🚁",
      addRef: "🚀",
      heavyWeight: 8,
      lightWeight: 4,
      addWeight: 4,
    },
    {
      heavyRef: "🌳",
      lightRef: "🌱",
      addRef: "🌷",
      heavyWeight: 6,
      lightWeight: 2,
      addWeight: 4,
    },
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "farm";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = [5, 6] as [number, number];
    const accessTier = getAccessTier(i, 0);
    const obj = objects[i % objects.length] ?? DEFAULT_OBJECT_PAIR;
    const skillCode = i < 5 ? "C1.MEAS.03" : "C1.MEAS.04";

    const leftPan = [
      {
        item_id: "left_1",
        asset: { kind: "emoji" as const, ref: obj.heavyRef },
        weight: obj.heavyWeight,
      },
    ];

    const rightPan = [
      {
        item_id: "right_1",
        asset: { kind: "emoji" as const, ref: obj.lightRef },
        weight: obj.lightWeight,
      },
    ];

    const tray = [
      {
        item_id: "tray_correct",
        asset: { kind: "emoji" as const, ref: obj.addRef },
        weight: obj.addWeight,
      },
      {
        item_id: "tray_distractor_1",
        asset: { kind: "emoji" as const, ref: "🍓" },
        weight: obj.addWeight + 1,
      },
      {
        item_id: "tray_distractor_2",
        asset: { kind: "emoji" as const, ref: "🍋" },
        weight: Math.max(1, obj.addWeight - 1),
      },
    ];

    return {
      header: {
        code: `GL-C1-BAL-OBJ-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D5-03",
        content_version: 1,
        template_code: "GT-014",
        title: `Cân so sánh nặng nhẹ đồ vật màn ${idx}`,
        instruction: "Bé hãy đặt vật để cân thăng bằng nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["size"],
        thinking_tags: ["compare", "infer"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: "Bé hãy đặt thêm vật lên đĩa nhẹ hơn để cân thăng bằng nhé!",
        left_pan: leftPan,
        right_pan: rightPan,
        tray,
        goal: "balance" as const,
      },
      difficulty_params: {
        tray_count: 3,
        weight_span: Math.max(obj.heavyWeight, obj.lightWeight, obj.addWeight),
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  });
}

const DEFAULT_EQUATION = {
  leftCount: 4,
  rightCount: 2,
  needCount: 2,
  symbolRef: "⭐",
};

// 1.2 D6-08: Cân bằng Phương trình Hình (C1.NCOMP.11, C1.NCOMP.12) — 10 levels
function createD608Levels(): ContentSeed<unknown, unknown>[] {
  const equations = [
    DEFAULT_EQUATION,
    { leftCount: 5, rightCount: 3, needCount: 2, symbolRef: "❤️" },
    { leftCount: 6, rightCount: 2, needCount: 4, symbolRef: "🟦" },
    {
      leftCount: 7,
      rightCount: 4,
      needCount: 3,
      symbolRef: "🟡",
    },
    {
      leftCount: 5,
      rightCount: 1,
      needCount: 4,
      symbolRef: "🔺",
    },
    {
      leftCount: 6,
      rightCount: 3,
      needCount: 3,
      symbolRef: "🔷",
    },
    {
      leftCount: 8,
      rightCount: 5,
      needCount: 3,
      symbolRef: "🟨",
    },
    { leftCount: 7, rightCount: 2, needCount: 5, symbolRef: "🔴" },
    { leftCount: 6, rightCount: 4, needCount: 2, symbolRef: "🎈" },
    { leftCount: 5, rightCount: 2, needCount: 3, symbolRef: "🎁" },
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[(i + 1) % THEMES.length] ?? "school";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = [5, 6] as [number, number];
    const accessTier = getAccessTier(i, 1);
    const eq = equations[i % equations.length] ?? DEFAULT_EQUATION;
    const skillCode = i < 5 ? "C1.NCOMP.11" : "C1.NCOMP.12";

    const leftPan = [
      {
        item_id: "left_eq_1",
        asset: { kind: "emoji" as const, ref: eq.symbolRef },
        weight: eq.leftCount,
      },
    ];

    const rightPan = [
      {
        item_id: "right_eq_1",
        asset: { kind: "emoji" as const, ref: eq.symbolRef },
        weight: eq.rightCount,
      },
    ];

    const tray = [
      {
        item_id: "tray_correct_eq",
        asset: { kind: "emoji" as const, ref: eq.symbolRef },
        weight: eq.needCount,
      },
      {
        item_id: "tray_distractor_eq_1",
        asset: { kind: "emoji" as const, ref: eq.symbolRef },
        weight: eq.needCount + 1,
      },
      {
        item_id: "tray_distractor_eq_2",
        asset: { kind: "emoji" as const, ref: eq.symbolRef },
        weight: Math.max(1, eq.needCount - 1),
      },
    ];

    return {
      header: {
        code: `GL-C1-BAL-EQN-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D6-08",
        content_version: 1,
        template_code: "GT-014",
        title: `Cân bằng phương trình hình học màn ${idx}`,
        instruction: "Bé hãy tìm khối lượng còn thiếu nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["quantity"],
        thinking_tags: ["infer", "compare"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt:
          "Bé hãy tìm khối lượng hình còn thiếu để hai đĩa cân bằng nhau nhé!",
        left_pan: leftPan,
        right_pan: rightPan,
        tray,
        goal: "balance" as const,
      },
      difficulty_params: {
        tray_count: 3,
        weight_span: Math.max(eq.leftCount, eq.rightCount, eq.needCount),
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  });
}

// ==========================================
// 2. GT-013: MÊ CUNG ĐƠN GIẢN (Age 4-6)
// ==========================================

// 2.1 D6-01: Mê cung Đơn giản (C2.MAZ.01, C2.MAZ.03) — 10 levels
function createD601Levels(): ContentSeed<unknown, unknown>[] {
  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[(i + 2) % THEMES.length] ?? "nature";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange4to6(i);
    const accessTier = getAccessTier(i, 2);
    const skillCode = i < 5 ? "C2.MAZ.01" : "C2.MAZ.03";

    const walls = [
      { row: 0, col: 1, side: "s" as const },
      { row: 1, col: 1, side: "s" as const },
      { row: 2, col: 2, side: "w" as const },
      { row: 3, col: 1, side: "e" as const },
    ];

    return {
      header: {
        code: `GL-C2-MAZ-LOG-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D6-01",
        content_version: 1,
        template_code: "GT-013",
        title: `Tìm đường trong mê cung đơn giản màn ${idx}`,
        instruction: "Bé hãy vẽ đường đi đến đích nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["spt"],
        thinking_tags: ["plan", "infer"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: "Bé hãy dẫn đường cho bạn nhỏ vượt qua mê cung đến đích nhé!",
        grid: {
          rows: 4,
          cols: 4,
          walls,
          start: { row: 0, col: 0 },
          goal: { row: 3, col: 3 },
        },
        required_cells: [],
        input_mode: (i % 2 === 0 ? "draw" : "arrows") as "draw" | "arrows",
      },
      difficulty_params: {
        dead_end_count: 1,
        required_cell_count: 0,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  });
}

// ==========================================
// 3. GT-016: ĐỒNG HỒ THỜI GIAN (Age 5-6 only)
// ==========================================

const DEFAULT_CLOCK_TARGET = {
  hour: 3,
  minute: 0 as const,
  d1: 4,
  d2: 5,
};

// 3.1 D5-08: Thời gian: Đồng hồ (C1.MEAS.14, C1.MEAS.15) — 10 levels
function createD508Levels(): ContentSeed<unknown, unknown>[] {
  const clockTargets = [
    DEFAULT_CLOCK_TARGET,
    { hour: 7, minute: 0 as const, d1: 6, d2: 8 },
    { hour: 9, minute: 30 as const, d1: 9, d2: 10 },
    { hour: 2, minute: 0 as const, d1: 1, d2: 3 },
    { hour: 8, minute: 30 as const, d1: 8, d2: 7 },
    { hour: 4, minute: 0 as const, d1: 5, d2: 3 },
    { hour: 10, minute: 0 as const, d1: 11, d2: 9 },
    { hour: 1, minute: 30 as const, d1: 1, d2: 2 },
    { hour: 6, minute: 0 as const, d1: 5, d2: 7 },
    { hour: 11, minute: 30 as const, d1: 11, d2: 12 },
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "school";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = [5, 6] as [number, number];
    const accessTier = getAccessTier(i, 0);
    const clk = clockTargets[i % clockTargets.length] ?? DEFAULT_CLOCK_TARGET;
    const skillCode = i < 5 ? "C1.MEAS.14" : "C1.MEAS.15";

    const options = [
      { hour: clk.hour, minute: clk.minute, is_correct: true },
      { hour: clk.d1, minute: clk.minute, is_correct: false },
      {
        hour: clk.d2,
        minute: clk.minute === 0 ? (30 as const) : (0 as const),
        is_correct: false,
      },
    ];

    return {
      header: {
        code: `GL-C1-CLK-TIM-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D5-08",
        content_version: 1,
        template_code: "GT-016",
        title: `Xem đồng hồ và đọc thời gian màn ${idx}`,
        instruction: "Bé hãy xem đồng hồ và chọn giờ nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["time"],
        thinking_tags: ["observe", "match"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: "Bé hãy nhìn đồng hồ và chọn thời gian chính xác nhé!",
        mode: "read" as const,
        target_time: { hour: clk.hour, minute: clk.minute },
        options,
      },
      difficulty_params: {
        minute_step: 30,
        distractor_count: 2,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  });
}

// ==========================================
// 4. GT-021: ĐỐI XỨNG GƯƠNG (Age 4-6)
// ==========================================

const DEFAULT_PATTERN_SET = ["🍎", "🍌", "🍓"];

// 4.1 D2-03: Đối xứng Gương (C2.MIR.01, C2.MIR.02) — 10 levels
function createD203Levels(): ContentSeed<unknown, unknown>[] {
  const patternSets = [
    DEFAULT_PATTERN_SET,
    ["🐱", "🐶", "🐰"],
    ["🚗", "🚌", "🚲"],
    ["⭐", "❤️", "🟡"],
    ["🐟", "🐳", "🐬"],
    ["🌷", "🌻", "🌱"],
    ["✏️", "🎨", "📖"],
    ["🍰", "🍬", "🍦"],
    ["🎈", "🎁", "🎉"],
    ["🪑", "🚪", "🛏️"],
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[(i + 1) % THEMES.length] ?? "art";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange4to6(i);
    const accessTier = getAccessTier(i, 1);
    const pat = patternSets[i % patternSets.length] ?? DEFAULT_PATTERN_SET;
    const skillCode = i < 5 ? "C2.MIR.01" : "C2.MIR.02";

    const referencePattern = pat.map((ref, pIdx) => ({
      slot_id: `ref_slot_${pIdx + 1}`,
      asset: { kind: "emoji" as const, ref },
    }));

    const targetSlots = pat.map((ref, pIdx) => ({
      slot_id: `tar_slot_${pIdx + 1}`,
      expected_asset_ref: ref,
    }));

    const options = pat.map((ref, pIdx) => ({
      item_id: `opt_mir_${pIdx + 1}`,
      asset: { kind: "emoji" as const, ref },
      asset_ref: ref,
    }));

    return {
      header: {
        code: `GL-C2-SYM-MIR-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D2-03",
        content_version: 1,
        template_code: "GT-021",
        title: `Xếp hình đối xứng qua gương màn ${idx}`,
        instruction: "Bé hãy xếp hình đối xứng qua gương nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["spt"],
        thinking_tags: ["match", "observe"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: "Bé hãy xếp các hình đối xứng qua trục dọc nhé!",
        axis: "vertical" as const,
        reference_pattern: referencePattern,
        target_slots: targetSlots,
        options,
      },
      difficulty_params: {
        show_axis_guide: true,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  });
}

// ==========================================
// 5. GT-024: VẼ THEO NÉT CHẤM (Age 5-6 only)
// ==========================================

const DEFAULT_SHAPE_DOTS = {
  name: "Hình tam giác",
  points: [
    { x: 480, y: 120 },
    { x: 680, y: 400 },
    { x: 280, y: 400 },
    { x: 480, y: 120 },
  ],
};

// 5.1 D2-09: Vẽ theo Nét chấm (C1.NREC.08, C1.NREC.09) — 10 levels
function createD209Levels(): ContentSeed<unknown, unknown>[] {
  const shapes = [
    DEFAULT_SHAPE_DOTS,
    {
      name: "Hình vuông",
      points: [
        { x: 340, y: 140 },
        { x: 620, y: 140 },
        { x: 620, y: 400 },
        { x: 340, y: 400 },
        { x: 340, y: 140 },
      ],
    },
    {
      name: "Hình chữ nhật",
      points: [
        { x: 300, y: 160 },
        { x: 660, y: 160 },
        { x: 660, y: 380 },
        { x: 300, y: 380 },
        { x: 300, y: 160 },
      ],
    },
    {
      name: "Hình thoi",
      points: [
        { x: 480, y: 120 },
        { x: 680, y: 270 },
        { x: 480, y: 420 },
        { x: 280, y: 270 },
        { x: 480, y: 120 },
      ],
    },
    {
      name: "Ngôi nhà",
      points: [
        { x: 480, y: 120 },
        { x: 660, y: 240 },
        { x: 660, y: 420 },
        { x: 300, y: 420 },
        { x: 300, y: 240 },
        { x: 480, y: 120 },
      ],
    },
    {
      name: "Hình ngũ giác",
      points: [
        { x: 480, y: 120 },
        { x: 680, y: 250 },
        { x: 600, y: 420 },
        { x: 360, y: 420 },
        { x: 280, y: 250 },
        { x: 480, y: 120 },
      ],
    },
    {
      name: "Chữ V",
      points: [
        { x: 320, y: 140 },
        { x: 480, y: 400 },
        { x: 640, y: 140 },
      ],
    },
    {
      name: "Mũi tên",
      points: [
        { x: 480, y: 120 },
        { x: 640, y: 250 },
        { x: 540, y: 250 },
        { x: 540, y: 420 },
        { x: 420, y: 420 },
        { x: 420, y: 250 },
        { x: 320, y: 250 },
        { x: 480, y: 120 },
      ],
    },
    {
      name: "Hình cánh buồm",
      points: [
        { x: 360, y: 120 },
        { x: 640, y: 380 },
        { x: 360, y: 380 },
        { x: 360, y: 120 },
      ],
    },
    {
      name: "Ngôi sao 4 cánh",
      points: [
        { x: 480, y: 120 },
        { x: 520, y: 240 },
        { x: 640, y: 270 },
        { x: 520, y: 300 },
        { x: 480, y: 420 },
        { x: 440, y: 300 },
        { x: 320, y: 270 },
        { x: 440, y: 240 },
        { x: 480, y: 120 },
      ],
    },
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[(i + 2) % THEMES.length] ?? "school";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = [5, 6] as [number, number];
    const accessTier = getAccessTier(i, 2);
    const shp = shapes[i % shapes.length] ?? DEFAULT_SHAPE_DOTS;
    const skillCode = i < 5 ? "C1.NREC.08" : "C1.NREC.09";

    const waypoints = shp.points.map((pt, ptIdx) => ({
      id: `dot_${ptIdx + 1}`,
      x: pt.x,
      y: pt.y,
      order: ptIdx,
      label: `${ptIdx + 1}`,
    }));

    return {
      header: {
        code: `GL-C1-DOT-TRC-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D2-09",
        content_version: 1,
        template_code: "GT-024",
        title: `Nối nét chấm vẽ ${shp.name} màn ${idx}`,
        instruction: "Bé hãy nối chấm theo thứ tự nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["geometry"],
        thinking_tags: ["sequence", "plan"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: `Bé hãy nối các điểm theo thứ tự 1, 2, 3... để vẽ ${shp.name} nhé!`,
        shape_name: shp.name,
        guide_asset: { kind: "emoji" as const, ref: "✏️" },
        waypoints,
      },
      difficulty_params: {
        tolerance_px: 40,
        show_numbered_dots: true,
        show_guide_lines: true,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  });
}

// ==========================================
// 6. GT-015: SUDOKU HÌNH (Age 5-6 only)
// ==========================================

const DEFAULT_SYMBOL_PAIR = ["🍎", "🍌"] as const;

// 6.1 D6-02: Sudoku Hình (C3.MTX.01, C3.MTX.02) — 10 levels
function createD602Levels(): ContentSeed<unknown, unknown>[] {
  const symbolPairs = [
    DEFAULT_SYMBOL_PAIR,
    ["🐱", "🐶"] as const,
    ["⭐", "❤️"] as const,
    ["🚗", "🚌"] as const,
    ["☀️", "🌙"] as const,
    ["🐟", "🐳"] as const,
    ["🌷", "🌻"] as const,
    ["✏️", "📖"] as const,
    ["🍰", "🍬"] as const,
    ["🎁", "🎈"] as const,
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "food";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = [5, 6] as [number, number];
    const accessTier = getAccessTier(i, 0);
    const pair = symbolPairs[i % symbolPairs.length] ?? DEFAULT_SYMBOL_PAIR;
    const skillCode = i < 5 ? "C3.MTX.01" : "C3.MTX.02";

    const symbols = [
      { symbol_id: "sym_1", asset: { kind: "emoji" as const, ref: pair[0] } },
      { symbol_id: "sym_2", asset: { kind: "emoji" as const, ref: pair[1] } },
    ];

    // Lưới 2x2 có nghiệm duy nhất
    const cells = [
      { row: 0, col: 0, symbol_id: "sym_1" },
      { row: 0, col: 1, symbol_id: null },
      { row: 1, col: 0, symbol_id: null },
      { row: 1, col: 1, symbol_id: "sym_1" },
    ];

    return {
      header: {
        code: `GL-C3-SUD-IMG-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D6-02",
        content_version: 1,
        template_code: "GT-015",
        title: `Sudoku hình ảnh 2x2 màn ${idx}`,
        instruction: "Bé hãy điền hình vào ô trống nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["rule"],
        thinking_tags: ["infer", "sort"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt:
          "Bé hãy điền hình thích hợp vào ô trống để mỗi hàng và cột không bị trùng nhé!",
        grid_size: 2 as const,
        symbols,
        cells,
        regions: "row_col" as const,
      },
      difficulty_params: {
        blank_count: 2,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  });
}

// ==========================================
// 7. GT-009: THÁM TỬ LOGIC (Age 4-6)
// ==========================================

const DEFAULT_CANDIDATE_SET = {
  items: ["🍓", "🍌", "🥕", "🍎"] as const,
  values: [2, 4, 6, 8] as const,
};

// 7.1 D6-07: Thám Tử Logic (C3.DED.03, C3.CLS.02) — 10 levels
function createD607Levels(): ContentSeed<unknown, unknown>[] {
  const candidateSets = [
    DEFAULT_CANDIDATE_SET,
    {
      items: ["🐱", "🐶", "🐰", "🐻"] as const,
      values: [1, 3, 5, 7] as const,
    },
    {
      items: ["🚗", "🚌", "🚲", "✈️"] as const,
      values: [2, 4, 6, 8] as const,
    },
    {
      items: ["⭐", "❤️", "🟡", "🔵"] as const,
      values: [3, 5, 7, 9] as const,
    },
    {
      items: ["🐟", "🐳", "🐬", "🦀"] as const,
      values: [2, 4, 6, 8] as const,
    },
    {
      items: ["✏️", "📖", "🎨", "🎒"] as const,
      values: [1, 3, 5, 7] as const,
    },
    {
      items: ["🍰", "🍬", "🍦", "🍪"] as const,
      values: [2, 4, 6, 8] as const,
    },
    {
      items: ["🌷", "🌻", "🌱", "🌳"] as const,
      values: [3, 5, 7, 9] as const,
    },
    {
      items: ["🎁", "🎈", "🎉", "⭐"] as const,
      values: [2, 4, 6, 8] as const,
    },
    {
      items: ["🪑", "🛏️", "🚪", "🏠"] as const,
      values: [1, 3, 5, 7] as const,
    },
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[(i + 1) % THEMES.length] ?? "school";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange4to6(i);
    const accessTier = getAccessTier(i, 1);
    const set =
      candidateSets[i % candidateSets.length] ?? DEFAULT_CANDIDATE_SET;
    const skillCode = i < 5 ? "C3.DED.03" : "C3.CLS.02";

    const candidates = set.items.map((ref, cIdx) => ({
      candidate_id: `cand_${cIdx + 1}`,
      value: set.values[cIdx] ?? (cIdx + 1) * 2,
      asset: { kind: "emoji" as const, ref },
    }));

    // Đáp án là ứng viên thứ 2 (cand_2, value 4 hoặc 3)
    const answerCandId = "cand_2";
    const prevVal = set.values[0] ?? 2;
    const nextVal = set.values[2] ?? 6;

    const clues = [
      {
        clue_id: "clue_1",
        text: `Số lượng lớn hơn ${prevVal}`,
        predicate: { kind: "greater_than" as const, value: prevVal },
      },
      {
        clue_id: "clue_2",
        text: `Số lượng nhỏ hơn ${nextVal}`,
        predicate: { kind: "less_than" as const, value: nextVal },
      },
    ];

    return {
      header: {
        code: `GL-C3-DED-LOG-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D6-07",
        content_version: 1,
        template_code: "GT-009",
        title: `Thám tử truy tìm đồ vật bí mật màn ${idx}`,
        instruction: "Bé hãy đọc manh mối tìm đồ vật nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["rule"],
        thinking_tags: ["infer", "compare"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: "Bé hãy đọc manh mối để tìm đúng đồ vật bí mật nhé!",
        candidates,
        clues,
        answer_candidate_id: answerCandId,
      },
      difficulty_params: {
        clue_count: 2,
        candidate_count: 4,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  });
}

// ==========================================
// 8. GT-020: ĐỐI ỨNG VỊ TRÍ / MEMORY GRID (Age 3-6)
// ==========================================

const DEFAULT_CARD_PAIR = ["🐱", "🐶", "🐰"] as const;

// 8.1 D6-11: Đối Ứng Vị Trí (C6.WM.02, C6.INH.03) — 10 levels
function createD611Levels(): ContentSeed<unknown, unknown>[] {
  const cardPairs = [
    DEFAULT_CARD_PAIR,
    ["🍎", "🍌", "🥕"] as const,
    ["🚗", "🚌", "🚲"] as const,
    ["⭐", "❤️", "🟡"] as const,
    ["🐟", "🐳", "🐬"] as const,
    ["✏️", "📖", "🎨"] as const,
    ["🍰", "🍬", "🍦"] as const,
    ["🌷", "🌻", "🌱"] as const,
    ["🎈", "🎁", "🎉"] as const,
    ["🪑", "🛏️", "🚪"] as const,
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[(i + 2) % THEMES.length] ?? "animal";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange3to6(i);
    const accessTier = getAccessTier(i, 2);
    const emojis = cardPairs[i % cardPairs.length] ?? DEFAULT_CARD_PAIR;
    const skillCode = i < 5 ? "C6.WM.02" : "C6.INH.03";

    const pairs = emojis.map((ref, pIdx) => ({
      pair_key: `pair_key_${pIdx + 1}`,
      card_a: {
        card_id: `card_${pIdx + 1}_a`,
        asset: { kind: "emoji" as const, ref },
      },
      card_b: {
        card_id: `card_${pIdx + 1}_b`,
        asset: { kind: "emoji" as const, ref },
      },
    }));

    return {
      header: {
        code: `GL-C6-MEM-GRD-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D6-11",
        content_version: 1,
        template_code: "GT-020",
        title: `Lật thẻ tìm cặp hình đối ứng màn ${idx}`,
        instruction: "Bé hãy lật thẻ tìm cặp hình nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["category"],
        thinking_tags: ["recall", "match"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: "Bé hãy lật mở các thẻ và ghép đúng từng cặp hình nhé!",
        pairs,
      },
      difficulty_params: {
        flip_back_delay_ms: 1200,
        peek_all_initial_ms: 0,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  });
}

export const SINGLE_TYPE_BACKFILL_LEVELS: ContentSeed<unknown, unknown>[] = [
  ...createD503Levels(),
  ...createD608Levels(),
  ...createD601Levels(),
  ...createD508Levels(),
  ...createD203Levels(),
  ...createD209Levels(),
  ...createD602Levels(),
  ...createD607Levels(),
  ...createD611Levels(),
];
