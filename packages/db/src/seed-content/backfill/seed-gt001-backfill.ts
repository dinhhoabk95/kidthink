import type { ContentSeed } from "#src/seed-content/types";

function getAgeRange(i: number): [number, number] {
  if (i < 3) {
    return [3, 4];
  }
  if (i < 7) {
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

// 1. D1-03: So sánh Nhiều/Ít (C1.CMP.04, C1.CMP.05, C1.NCOMP.11, C1.NCOMP.12, C1.PROB.04, C1.PROB.05) — 10 levels
function createD103Levels(): ContentSeed<unknown, unknown>[] {
  const comparisonSets = [
    { target: "🍎", distractor: "🍌" },
    { target: "🚗", distractor: "🚌" },
    { target: "⭐", distractor: "✏️" },
    { target: "🐟", distractor: "🐬" },
    { target: "🍬", distractor: "🍰" },
    { target: "🐱", distractor: "🐶" },
    { target: "🌻", distractor: "🌳" },
    { target: "🐮", distractor: "🐷" },
    { target: "🎁", distractor: "🎈" },
    { target: "📖", distractor: "🎨" },
  ];

  const skillList = [
    "C1.CMP.04",
    "C1.CMP.05",
    "C1.NCOMP.11",
    "C1.NCOMP.11",
    "C1.NCOMP.12",
    "C1.NCOMP.12",
    "C1.PROB.04",
    "C1.PROB.04",
    "C1.PROB.05",
    "C1.PROB.05",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "school";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange(i);
    const accessTier = getAccessTier(i, 0);
    const pair = comparisonSets[i % comparisonSets.length] ?? {
      target: "🍎",
      distractor: "🍌",
    };
    const skillCode = skillList[i] ?? "C1.CMP.04";

    return {
      header: {
        code: `GL-C1-QNT-TAP-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D1-03",
        content_version: 1,
        template_code: "GT-001",
        title: `So sánh Nhiều hơn hay Ít hơn màn ${idx}`,
        instruction: "Bé hãy chạm vào nhóm có số lượng nhiều hơn nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["cmp"],
        thinking_tags: ["compare", "observe"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: "Bé hãy chọn nhóm có nhiều đồ vật hơn nhé!",
        target_item: {
          item_id: "target_more",
          asset: { kind: "emoji" as const, ref: pair.target },
        },
        options: [
          {
            item_id: "opt_more",
            asset: { kind: "emoji" as const, ref: pair.target },
            is_correct: true,
          },
          {
            item_id: "opt_less",
            asset: { kind: "emoji" as const, ref: pair.distractor },
            is_correct: false,
          },
        ],
      },
      difficulty_params: {
        distractor_count: 1,
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_items: true,
      },
    };
  });
}

// 2. D1-11: Số Đang Trốn (C1.NREC.10, C1.NREC.11, C1.NREC.12, C1.ADD.06, C1.SUB.05) — 10 levels
function createD111Levels(): ContentSeed<unknown, unknown>[] {
  const missingItems = [
    { target: "🍎", distractors: ["🍌", "🥕"] },
    { target: "📖", distractors: ["✏️", "🎨"] },
    { target: "🚗", distractors: ["🚌", "🚲"] },
    { target: "⭐", distractors: ["✨", "🌻"] },
    { target: "🐱", distractors: ["🐶", "🐮"] },
    { target: "🍬", distractors: ["🍰", "🍦"] },
    { target: "🐟", distractors: ["🐳", "🐬"] },
    { target: "🎁", distractors: ["🎈", "🎉"] },
    { target: "🍅", distractors: ["🥔", "🥒"] },
    { target: "🪑", distractors: ["🛏️", "🚪"] },
  ];

  const skillList = [
    "C1.NREC.10",
    "C1.NREC.10",
    "C1.NREC.11",
    "C1.NREC.11",
    "C1.NREC.12",
    "C1.NREC.12",
    "C1.ADD.06",
    "C1.ADD.06",
    "C1.SUB.05",
    "C1.SUB.05",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "school";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange(i);
    const accessTier = getAccessTier(i, 1);
    const itemData = missingItems[i % missingItems.length] ?? {
      target: "🍎",
      distractors: ["🍌", "🥕"],
    };
    const skillCode = skillList[i] ?? "C1.NREC.10";

    const options = [
      {
        item_id: "opt_correct",
        asset: { kind: "emoji" as const, ref: itemData.target },
        is_correct: true,
      },
      ...itemData.distractors.map((d, dIdx) => ({
        item_id: `opt_wrong_${dIdx + 1}`,
        asset: { kind: "emoji" as const, ref: d },
        is_correct: false,
      })),
    ];

    return {
      header: {
        code: `GL-C1-HNT-TAP-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D1-11",
        content_version: 1,
        template_code: "GT-001",
        title: `Tìm số hoặc vật đang trốn màn ${idx}`,
        instruction: "Bé hãy tìm xem hình nào đang trốn nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["number"],
        thinking_tags: ["observe", "match"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: "Bé hãy tìm hình bị thiếu trong chuỗi nhé!",
        target_item: {
          item_id: "target_ref",
          asset: { kind: "emoji" as const, ref: itemData.target },
        },
        options,
      },
      difficulty_params: {
        distractor_count: itemData.distractors.length,
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_items: true,
      },
    };
  });
}

// 3. D5-01: So sánh Kích thước (Thể tích/Diện tích) (C1.CMP.10..12, C1.MEAS.10, C1.MEAS.11) — 10 levels
function createD501Levels(): ContentSeed<unknown, unknown>[] {
  const sizePairs = [
    { big: "🐘", small: "🐜" },
    { big: "🐳", small: "🐟" },
    { big: "🚌", small: "🚲" },
    { big: "🏠", small: "🪑" },
    { big: "🌳", small: "🌻" },
    { big: "🐮", small: "🐱" },
    { big: "✈️", small: "🚗" },
    { big: "🍉", small: "🍓" },
    { big: "🍰", small: "🍬" },
    { big: "📖", small: "✏️" },
  ];

  const skillList = [
    "C1.CMP.10",
    "C1.CMP.11",
    "C1.CMP.12",
    "C1.MEAS.10",
    "C1.MEAS.10",
    "C1.MEAS.10",
    "C1.MEAS.11",
    "C1.MEAS.11",
    "C1.MEAS.11",
    "C1.MEAS.11",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "nature";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange(i);
    const accessTier = getAccessTier(i, 2);
    const pair = sizePairs[i % sizePairs.length] ?? {
      big: "🐘",
      small: "🐜",
    };
    const askBig = i % 2 === 0;
    const skillCode = skillList[i] ?? "C1.CMP.10";

    return {
      header: {
        code: `GL-C1-VOL-TAP-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D5-01",
        content_version: 1,
        template_code: "GT-001",
        title: `So sánh kích thước (${askBig ? "To hơn" : "Nhỏ hơn"})`,
        instruction: `Bé hãy chạm vào con vật hoặc đồ vật ${askBig ? "to hơn" : "nhỏ hơn"} nhé!`,
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["msr"],
        thinking_tags: ["compare", "observe"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: `Bé hãy chọn hình có kích thước ${askBig ? "to hơn" : "nhỏ hơn"} nhé!`,
        target_item: {
          item_id: "target_size",
          asset: {
            kind: "emoji" as const,
            ref: askBig ? pair.big : pair.small,
          },
        },
        options: [
          {
            item_id: "opt_correct",
            asset: {
              kind: "emoji" as const,
              ref: askBig ? pair.big : pair.small,
            },
            is_correct: true,
          },
          {
            item_id: "opt_wrong",
            asset: {
              kind: "emoji" as const,
              ref: askBig ? pair.small : pair.big,
            },
            is_correct: false,
          },
        ],
      },
      difficulty_params: {
        distractor_count: 1,
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_items: true,
      },
    };
  });
}

// 4. D5-02: So sánh Cao/Thấp (Chiều cao) (C1.CMP.13..15, C1.MEAS.06, C1.MEAS.08, C1.PAT.06, C1.PAT.07) — 10 levels
function createD502Levels(): ContentSeed<unknown, unknown>[] {
  const heightPairs = [
    { tall: "🦒", short: "🐶" },
    { tall: "🌳", short: "🌻" },
    { tall: "🏠", short: "🚗" },
    { tall: "✏️", short: "✏️" },
    { tall: "🍾", short: "🍵" },
    { tall: "🪜", short: "🪑" },
    { tall: "🕯️", short: "🕯️" },
    { tall: "🏠", short: "⛺" },
    { tall: "🪑", short: "📖" },
    { tall: "🌳", short: "🌻" },
  ];

  const skillList = [
    "C1.CMP.13",
    "C1.CMP.14",
    "C1.CMP.15",
    "C1.MEAS.06",
    "C1.MEAS.08",
    "C1.PAT.06",
    "C1.PAT.06",
    "C1.PAT.06",
    "C1.PAT.07",
    "C1.PAT.07",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "nature";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange(i);
    const accessTier = getAccessTier(i, 3);
    const pair = heightPairs[i % heightPairs.length] ?? {
      tall: "🦒",
      short: "🐶",
    };
    const askTall = i % 2 === 0;
    const skillCode = skillList[i] ?? "C1.CMP.13";

    return {
      header: {
        code: `GL-C1-HGT-TAP-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D5-02",
        content_version: 1,
        template_code: "GT-001",
        title: `So sánh chiều cao (${askTall ? "Cao hơn" : "Thấp hơn"})`,
        instruction: `Bé hãy chạm vào hình ${askTall ? "cao hơn" : "thấp hơn"} nhé!`,
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["msr"],
        thinking_tags: ["compare", "observe"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: `Bé hãy chọn hình ${askTall ? "cao hơn" : "thấp hơn"} nhé!`,
        target_item: {
          item_id: "target_height",
          asset: {
            kind: "emoji" as const,
            ref: askTall ? pair.tall : pair.short,
          },
        },
        options: [
          {
            item_id: "opt_correct",
            asset: {
              kind: "emoji" as const,
              ref: askTall ? pair.tall : pair.short,
            },
            is_correct: true,
          },
          {
            item_id: "opt_wrong",
            asset: {
              kind: "emoji" as const,
              ref: askTall ? pair.short : pair.tall,
            },
            is_correct: false,
          },
        ],
      },
      difficulty_params: {
        distractor_count: 1,
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_items: true,
      },
    };
  });
}

// 5. D2-06: Hình 3D → 2D (C2.CON.02..04, C2.ROT.01, C2.ROT.02) — 10 levels
function createD206Levels(): ContentSeed<unknown, unknown>[] {
  const shapeProjections = [
    {
      target2d: "🔴",
      distractors: ["🟦", "🔺"],
    },
    {
      target2d: "🟦",
      distractors: ["🔴", "⭐"],
    },
    {
      target2d: "🔺",
      distractors: ["🟦", "🔴"],
    },
    {
      target2d: "⭐",
      distractors: ["🔴", "🟦"],
    },
    {
      target2d: "🟩",
      distractors: ["🔴", "⭐"],
    },
    {
      target2d: "🔵",
      distractors: ["🔺", "🟦"],
    },
    {
      target2d: "🟡",
      distractors: ["🟦", "🔺"],
    },
    {
      target2d: "🟧",
      distractors: ["🔴", "⭐"],
    },
    {
      target2d: "🟣",
      distractors: ["🟦", "🔺"],
    },
    {
      target2d: "🌟",
      distractors: ["🔴", "🟦"],
    },
  ];

  const skillList = [
    "C2.CON.02",
    "C2.CON.02",
    "C2.CON.03",
    "C2.CON.03",
    "C2.CON.04",
    "C2.CON.04",
    "C2.ROT.01",
    "C2.ROT.01",
    "C2.ROT.02",
    "C2.ROT.02",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "art";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange(i);
    const accessTier = getAccessTier(i, 4);
    const proj = shapeProjections[i % shapeProjections.length] ?? {
      target2d: "🔴",
      distractors: ["🟦", "🔺"],
    };
    const skillCode = skillList[i] ?? "C2.CON.02";

    const options = [
      {
        item_id: "opt_correct",
        asset: { kind: "emoji" as const, ref: proj.target2d },
        is_correct: true,
      },
      ...proj.distractors.map((d, dIdx) => ({
        item_id: `opt_wrong_${dIdx + 1}`,
        asset: { kind: "emoji" as const, ref: d },
        is_correct: false,
      })),
    ];

    return {
      header: {
        code: `GL-C2-PRJ-TAP-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D2-06",
        content_version: 1,
        template_code: "GT-001",
        title: `Nhìn hình chiếu 2D của khối hình màn ${idx}`,
        instruction: "Bé hãy chọn mặt đáy phẳng của khối hình nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["shp"],
        thinking_tags: ["observe", "match"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: "Khối hình này khi nhìn từ trên xuống là hình gì bé nhỉ?",
        target_item: {
          item_id: "target_shape_ref",
          asset: { kind: "emoji" as const, ref: proj.target2d },
        },
        options,
      },
      difficulty_params: {
        distractor_count: proj.distractors.length,
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_items: true,
      },
    };
  });
}

// 6. D4-05: Tìm Kẻ lạ (Odd One Out) (C3.CLS.04, C3.ANA.02, C3.ANA.03, C3.INF.01, C3.INF.02) — 10 levels
function createD405Levels(): ContentSeed<unknown, unknown>[] {
  const oddSets = [
    { targetGroup: "🍎", odd: "🚗", label: "Hoa quả" },
    { targetGroup: "🐱", odd: "📖", label: "Động vật" },
    { targetGroup: "🚗", odd: "🍌", label: "Xe cộ" },
    { targetGroup: "✏️", odd: "🐟", label: "Dụng cụ học tập" },
    {
      targetGroup: "🌻",
      odd: "✈️",
      label: "Cây cối hoa lá",
    },
    { targetGroup: "🍬", odd: "🚌", label: "Đồ ăn ngọt" },
    { targetGroup: "🐶", odd: "✏️", label: "Thú cưng" },
    { targetGroup: "🍅", odd: "✂️", label: "Rau củ" },
    { targetGroup: "🐳", odd: "🍰", label: "Sinh vật biển" },
    { targetGroup: "🪑", odd: "🍎", label: "Đồ nội thất" },
  ];

  const skillList = [
    "C3.CLS.04",
    "C3.CLS.04",
    "C3.ANA.02",
    "C3.ANA.02",
    "C3.ANA.03",
    "C3.ANA.03",
    "C3.INF.01",
    "C3.INF.01",
    "C3.INF.02",
    "C3.INF.02",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "home";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange(i);
    const accessTier = getAccessTier(i, 0);
    const set = oddSets[i % oddSets.length] ?? {
      targetGroup: "🍎",
      odd: "🚗",
      label: "Hoa quả",
    };
    const skillCode = skillList[i] ?? "C3.CLS.04";

    const options = [
      {
        item_id: "opt_odd",
        asset: { kind: "emoji" as const, ref: set.odd },
        is_correct: true,
      },
      {
        item_id: "opt_group_1",
        asset: { kind: "emoji" as const, ref: set.targetGroup },
        is_correct: false,
      },
      {
        item_id: "opt_group_2",
        asset: { kind: "emoji" as const, ref: set.targetGroup },
        is_correct: false,
      },
    ];

    return {
      header: {
        code: `GL-C3-ODD-TAP-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D4-05",
        content_version: 1,
        template_code: "GT-001",
        title: `Tìm kẻ khác biệt (Odd One Out) màn ${idx}`,
        instruction: "Bé hãy chạm vào hình khác biệt nhất nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["cls"],
        thinking_tags: ["sort", "infer"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: `Bé hãy tìm hình khác biệt với nhóm ${set.label} nhé!`,
        target_item: {
          item_id: "target_odd_ref",
          asset: { kind: "emoji" as const, ref: set.odd },
        },
        options,
      },
      difficulty_params: {
        distractor_count: 2,
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_items: true,
      },
    };
  });
}

// 7. D4-07: Thuộc về / Không thuộc (C3.CLS.06, C3.RULE.02, C3.RULE.03, C6.FLX.01, C6.FLX.03) — 10 levels
function createD407Levels(): ContentSeed<unknown, unknown>[] {
  const belongSets = [
    {
      target: "🍎",
      groupLabel: "nhóm Quả ngọt",
      distractors: ["🚗", "✏️"],
    },
    {
      target: "🐱",
      groupLabel: "nhóm Thú cưng",
      distractors: ["📖", "🚌"],
    },
    {
      target: "✏️",
      groupLabel: "nhóm Đồ dùng học tập",
      distractors: ["🐟", "🍰"],
    },
    {
      target: "🚗",
      groupLabel: "nhóm Phương tiện đi lại",
      distractors: ["🍌", "🐶"],
    },
    {
      target: "🐟",
      groupLabel: "nhóm Động vật dưới nước",
      distractors: ["🪑", "✈️"],
    },
    {
      target: "🌻",
      groupLabel: "nhóm Hoa quả cây cối",
      distractors: ["✂️", "🎈"],
    },
    {
      target: "🍰",
      groupLabel: "nhóm Món ăn ngon",
      distractors: ["🚲", "🪜"],
    },
    {
      target: "🐶",
      groupLabel: "nhóm Bạn nhỏ 4 chân",
      distractors: ["🎨", "📖"],
    },
    {
      target: "🚌",
      groupLabel: "nhóm Xe công cộng",
      distractors: ["🍅", "🕯️"],
    },
    {
      target: "📖",
      groupLabel: "nhóm Sách vở học tập",
      distractors: ["🍎", "🐳"],
    },
  ];

  const skillList = [
    "C3.CLS.06",
    "C3.CLS.06",
    "C3.RULE.02",
    "C3.RULE.02",
    "C3.RULE.03",
    "C3.RULE.03",
    "C6.FLX.01",
    "C6.FLX.01",
    "C6.FLX.03",
    "C6.FLX.03",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "school";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange(i);
    const accessTier = getAccessTier(i, 1);
    const set = belongSets[i % belongSets.length] ?? {
      target: "🍎",
      groupLabel: "nhóm Quả ngọt",
      distractors: ["🚗", "✏️"],
    };
    const skillCode = skillList[i] ?? "C3.CLS.06";

    const options = [
      {
        item_id: "opt_belong",
        asset: { kind: "emoji" as const, ref: set.target },
        is_correct: true,
      },
      ...set.distractors.map((d, dIdx) => ({
        item_id: `opt_other_${dIdx + 1}`,
        asset: { kind: "emoji" as const, ref: d },
        is_correct: false,
      })),
    ];

    return {
      header: {
        code: `GL-C3-BLG-TAP-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D4-07",
        content_version: 1,
        template_code: "GT-001",
        title: `Thuộc về nhóm ${set.groupLabel} màn ${idx}`,
        instruction: `Bé hãy chọn hình thuộc về ${set.groupLabel} nhé!`,
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["cls"],
        thinking_tags: ["sort", "match"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: `Bé hãy chọn hình thuộc về ${set.groupLabel} nhé!`,
        target_item: {
          item_id: "target_belong_ref",
          asset: { kind: "emoji" as const, ref: set.target },
        },
        options,
      },
      difficulty_params: {
        distractor_count: set.distractors.length,
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_items: true,
      },
    };
  });
}

export const GT001_BACKFILL_LEVELS: ContentSeed<unknown, unknown>[] = [
  ...createD103Levels(),
  ...createD111Levels(),
  ...createD501Levels(),
  ...createD502Levels(),
  ...createD206Levels(),
  ...createD405Levels(),
  ...createD407Levels(),
];
