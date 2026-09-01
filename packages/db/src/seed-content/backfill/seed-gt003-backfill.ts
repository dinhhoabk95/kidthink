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
  "space",
  "festival",
] as const;

// 1. D1-01: Đếm & Kéo vào Rổ (C1.CNT.02, C1.CNT.09, C1.CNT.10, C1.NCOMP.11, C1.NCOMP.12) — 10 levels
function createD101Levels(): ContentSeed<unknown, unknown>[] {
  const emojiSets = [
    ["EMJ-red-apple", "EMJ-banana"],
    ["EMJ-cow", "EMJ-pig"],
    ["EMJ-car", "EMJ-bus"],
    ["EMJ-sunflower", "EMJ-deciduous-tree"],
    ["EMJ-fish", "EMJ-dolphin"],
    ["EMJ-pencil", "EMJ-open-book"],
    ["EMJ-star", "EMJ-sparkles"],
    ["EMJ-candy", "EMJ-cake"],
    ["EMJ-cat", "EMJ-dog"],
    ["EMJ-gift", "EMJ-balloon"],
  ];

  const skillList = [
    "C1.CNT.02",
    "C1.CNT.09",
    "C1.CNT.09",
    "C1.CNT.10",
    "C1.CNT.10",
    "C1.NCOMP.11",
    "C1.NCOMP.11",
    "C1.NCOMP.12",
    "C1.NCOMP.12",
    "C1.NCOMP.12",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "school";
    const targetCount = (i % 3) + 2;
    const totalItems = targetCount + (i % 2 === 0 ? 1 : 2);
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange(i);
    const accessTier = getAccessTier(i, 0);
    const emjs = emojiSets[i % emojiSets.length] ?? [
      "EMJ-star",
      "EMJ-sunflower",
    ];

    const items = Array.from({ length: totalItems }, (_, itemIdx) => {
      const isTarget = itemIdx < targetCount;
      const ref = isTarget
        ? (emjs[0] ?? "EMJ-star")
        : (emjs[1] ?? "EMJ-sunflower");
      return {
        item_id: `item_${itemIdx + 1}`,
        attribute: isTarget ? `count_${targetCount}` : "other_count",
        asset: { kind: "emoji" as const, ref },
        is_correct: isTarget,
      };
    });

    const skillCode = skillList[i] ?? "C1.CNT.02";

    return {
      header: {
        code: `GL-C1-CNT-BSK-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D1-01",
        content_version: 1,
        template_code: "GT-003",
        title: `Đếm và kéo vào giỏ màn ${idx}`,
        instruction: `Bé hãy kéo đúng ${targetCount} món đồ vào giỏ nhé!`,
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["cnt"],
        thinking_tags: ["count", "sort"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: `Bé hãy đếm và kéo đủ ${targetCount} món đồ vào giỏ nhé!`,
        container: {
          container_id: "basket_1",
          label: `Giỏ ${targetCount} món`,
          accepts_attribute: `count_${targetCount}`,
        },
        items,
      },
      difficulty_params: {
        distractor_count: totalItems - targetCount,
        target_count: targetCount,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  });
}

// 2. D1-04: Nhận diện Chữ số (C1.NREC.01, C1.NREC.02, C1.NREC.09..12) — 10 levels
function createD104Levels(): ContentSeed<unknown, unknown>[] {
  const numberEmojis = [
    "EMJ-open-book",
    "EMJ-pencil",
    "EMJ-gift",
    "EMJ-star",
    "EMJ-sunflower",
    "EMJ-candy",
  ];

  const skillList = [
    "C1.NREC.01",
    "C1.NREC.02",
    "C1.NREC.09",
    "C1.NREC.09",
    "C1.NREC.10",
    "C1.NREC.10",
    "C1.NREC.11",
    "C1.NREC.11",
    "C1.NREC.12",
    "C1.NREC.12",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "school";
    const targetDigit = (i % 5) + 1;
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange(i);
    const accessTier = getAccessTier(i, 1);

    const items = [
      {
        item_id: "item_1",
        attribute: `digit_${targetDigit}`,
        asset: { kind: "emoji" as const, ref: numberEmojis[0] ?? "EMJ-star" },
        is_correct: true,
      },
      {
        item_id: "item_2",
        attribute: `digit_${targetDigit}`,
        asset: {
          kind: "emoji" as const,
          ref: numberEmojis[1] ?? "EMJ-open-book",
        },
        is_correct: true,
      },
      {
        item_id: "item_3",
        attribute: "digit_other_1",
        asset: { kind: "emoji" as const, ref: numberEmojis[2] ?? "EMJ-gift" },
        is_correct: false,
      },
      {
        item_id: "item_4",
        attribute: "digit_other_2",
        asset: { kind: "emoji" as const, ref: numberEmojis[3] ?? "EMJ-pencil" },
        is_correct: false,
      },
    ];

    const skillCode = skillList[i] ?? "C1.NREC.01";

    return {
      header: {
        code: `GL-C1-NRC-BSK-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D1-04",
        content_version: 1,
        template_code: "GT-003",
        title: `Nhận diện chữ số ${targetDigit}`,
        instruction: `Bé hãy kéo các thẻ số ${targetDigit} vào hộp nhé!`,
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
        prompt: `Bé hãy tìm và kéo các thẻ có số ${targetDigit} vào hộp nhé!`,
        container: {
          container_id: "box_num",
          label: `Số ${targetDigit}`,
          accepts_attribute: `digit_${targetDigit}`,
        },
        items,
      },
      difficulty_params: {
        distractor_count: 2,
        target_count: 2,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  });
}

// 3. D2-05: Phân loại Hình (C2.GEO.02, C2.GEO.04, C2.CON.02, C2.CON.03) — 10 levels
function createD205Levels(): ContentSeed<unknown, unknown>[] {
  const shapes = ["circle", "square", "triangle", "star"] as const;
  const shapeLabels: Record<string, string> = {
    circle: "Hình tròn",
    square: "Hình vuông",
    triangle: "Hình tam giác",
    star: "Hình ngôi sao",
  };
  const shapeEmojis: Record<string, string[]> = {
    circle: ["EMJ-red-circle", "EMJ-blue-circle"],
    square: ["EMJ-blue-square", "EMJ-green-square"],
    triangle: ["EMJ-red-triangle-up", "EMJ-red-triangle-up"],
    star: ["EMJ-star", "EMJ-glowing-star"],
  };

  const skillList = [
    "C2.GEO.02",
    "C2.GEO.02",
    "C2.GEO.04",
    "C2.GEO.04",
    "C2.CON.02",
    "C2.CON.02",
    "C2.CON.02",
    "C2.CON.03",
    "C2.CON.03",
    "C2.CON.03",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "art";
    const targetShape = shapes[i % shapes.length] ?? "circle";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange(i);
    const accessTier = getAccessTier(i, 2);

    const targetRefs = shapeEmojis[targetShape] ?? [
      "EMJ-red-circle",
      "EMJ-blue-circle",
    ];
    const distractorShape = targetShape === "circle" ? "square" : "circle";
    const distractorRefs = shapeEmojis[distractorShape] ?? [
      "EMJ-blue-square",
      "EMJ-green-square",
    ];

    const items = [
      {
        item_id: "item_1",
        attribute: `shape_${targetShape}`,
        asset: {
          kind: "emoji" as const,
          ref: targetRefs[0] ?? "EMJ-red-circle",
        },
        is_correct: true,
      },
      {
        item_id: "item_2",
        attribute: `shape_${targetShape}`,
        asset: {
          kind: "emoji" as const,
          ref: targetRefs[1] ?? "EMJ-blue-circle",
        },
        is_correct: true,
      },
      {
        item_id: "item_3",
        attribute: `shape_${distractorShape}`,
        asset: {
          kind: "emoji" as const,
          ref: distractorRefs[0] ?? "EMJ-blue-square",
        },
        is_correct: false,
      },
      {
        item_id: "item_4",
        attribute: `shape_${distractorShape}`,
        asset: {
          kind: "emoji" as const,
          ref: distractorRefs[1] ?? "EMJ-green-square",
        },
        is_correct: false,
      },
    ];

    const label = shapeLabels[targetShape] ?? "Hình học";
    const skillCode = skillList[i] ?? "C2.GEO.02";

    return {
      header: {
        code: `GL-C2-SHP-BSK-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D2-05",
        content_version: 1,
        template_code: "GT-003",
        title: `Phân loại ${label}`,
        instruction: "Bé kéo đúng hình vào hộp nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["shp"],
        thinking_tags: ["sort", "match"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: `Bé hãy kéo tất cả ${label} vào hộp nhé!`,
        container: {
          container_id: "box_shape",
          label,
          accepts_attribute: `shape_${targetShape}`,
        },
        items,
      },
      difficulty_params: {
        distractor_count: 2,
        target_count: 2,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  });
}

// 4. D4-01: Phân nhóm theo Màu (C3.CLS.05, C6.FLX.02, C3.SRT.01, C3.SRT.02, C3.SRT.04) — 10 levels
function createD401Levels(): ContentSeed<unknown, unknown>[] {
  const colors = ["red", "blue", "green", "yellow"] as const;
  const colorLabels: Record<string, string> = {
    red: "Màu đỏ",
    blue: "Màu xanh dương",
    green: "Màu xanh lá",
    yellow: "Màu vàng",
  };
  const colorItems: Record<string, string[]> = {
    red: ["EMJ-red-apple", "EMJ-tomato"],
    blue: ["EMJ-blue-circle", "EMJ-whale"],
    green: ["EMJ-green-apple", "EMJ-deciduous-tree"],
    yellow: ["EMJ-banana", "EMJ-sunflower"],
  };

  const skillList = [
    "C3.CLS.05",
    "C3.CLS.05",
    "C6.FLX.02",
    "C6.FLX.02",
    "C3.SRT.01",
    "C3.SRT.01",
    "C3.SRT.02",
    "C3.SRT.02",
    "C3.SRT.04",
    "C3.SRT.04",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "art";
    const targetColor = colors[i % colors.length] ?? "red";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange(i);
    const accessTier = getAccessTier(i, 3);

    const targetList = colorItems[targetColor] ?? [
      "EMJ-red-apple",
      "EMJ-tomato",
    ];
    const distractorColor = targetColor === "red" ? "blue" : "red";
    const distractorList = colorItems[distractorColor] ?? [
      "EMJ-blue-circle",
      "EMJ-whale",
    ];

    const items = [
      {
        item_id: "item_1",
        attribute: `color_${targetColor}`,
        asset: {
          kind: "emoji" as const,
          ref: targetList[0] ?? "EMJ-red-apple",
        },
        is_correct: true,
      },
      {
        item_id: "item_2",
        attribute: `color_${targetColor}`,
        asset: { kind: "emoji" as const, ref: targetList[1] ?? "EMJ-tomato" },
        is_correct: true,
      },
      {
        item_id: "item_3",
        attribute: `color_${distractorColor}`,
        asset: {
          kind: "emoji" as const,
          ref: distractorList[0] ?? "EMJ-blue-circle",
        },
        is_correct: false,
      },
      {
        item_id: "item_4",
        attribute: `color_${distractorColor}`,
        asset: {
          kind: "emoji" as const,
          ref: distractorList[1] ?? "EMJ-whale",
        },
        is_correct: false,
      },
    ];

    const label = colorLabels[targetColor] ?? "Màu sắc";
    const skillCode = skillList[i] ?? "C3.CLS.05";

    return {
      header: {
        code: `GL-C3-COL-BSK-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D4-01",
        content_version: 1,
        template_code: "GT-003",
        title: `Phân nhóm ${label}`,
        instruction: "Bé kéo đồ vật đúng màu vào giỏ nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["colour"],
        thinking_tags: ["sort", "match"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: `Bé hãy kéo các đồ vật có ${label} vào giỏ nhé!`,
        container: {
          container_id: "basket_color",
          label,
          accepts_attribute: `color_${targetColor}`,
        },
        items,
      },
      difficulty_params: {
        distractor_count: 2,
        target_count: 2,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  });
}

// 5. D4-02: Phân nhóm theo Hình (C3.CLS.02, C6.INH.02, C6.INH.03, C6.INH.04) — 10 levels
function createD402Levels(): ContentSeed<unknown, unknown>[] {
  const skillList = [
    "C3.CLS.02",
    "C3.CLS.02",
    "C3.CLS.02",
    "C6.INH.02",
    "C6.INH.02",
    "C6.INH.02",
    "C6.INH.03",
    "C6.INH.03",
    "C6.INH.04",
    "C6.INH.04",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "school";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange(i);
    const accessTier = getAccessTier(i, 4);

    const items = [
      {
        item_id: "item_1",
        attribute: "shape_round",
        asset: { kind: "emoji" as const, ref: "EMJ-red-circle" },
        is_correct: true,
      },
      {
        item_id: "item_2",
        attribute: "shape_round",
        asset: { kind: "emoji" as const, ref: "EMJ-blue-circle" },
        is_correct: true,
      },
      {
        item_id: "item_3",
        attribute: "shape_pointed",
        asset: { kind: "emoji" as const, ref: "EMJ-star" },
        is_correct: false,
      },
      {
        item_id: "item_4",
        attribute: "shape_pointed",
        asset: { kind: "emoji" as const, ref: "EMJ-red-triangle-up" },
        is_correct: false,
      },
    ];

    const skillCode = skillList[i] ?? "C3.CLS.02";

    return {
      header: {
        code: `GL-C3-SHP-BSK-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D4-02",
        content_version: 1,
        template_code: "GT-003",
        title: `Phân loại hình dạng đồ vật màn ${idx}`,
        instruction: "Bé hãy kéo các đồ vật hình tròn vào giỏ nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["shp"],
        thinking_tags: ["sort", "match"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: "Bé hãy kéo các đồ vật hình tròn vào giỏ nhé!",
        container: {
          container_id: "basket_round",
          label: "Hình tròn",
          accepts_attribute: "shape_round",
        },
        items,
      },
      difficulty_params: {
        distractor_count: 2,
        target_count: 2,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  });
}

function createD403Items(targetSize: "big" | "small") {
  const isBig = targetSize === "big";
  const targetEmoji1 = isBig ? "EMJ-elephant" : "EMJ-ant";
  const targetEmoji2 = isBig ? "EMJ-whale" : "EMJ-bee";
  const distractorEmoji1 = isBig ? "EMJ-ant" : "EMJ-elephant";
  const distractorEmoji2 = isBig ? "EMJ-bee" : "EMJ-whale";
  const otherAttr = isBig ? "size_small" : "size_big";

  return [
    {
      item_id: "item_1",
      attribute: `size_${targetSize}`,
      asset: { kind: "emoji" as const, ref: targetEmoji1 },
      is_correct: true,
    },
    {
      item_id: "item_2",
      attribute: `size_${targetSize}`,
      asset: { kind: "emoji" as const, ref: targetEmoji2 },
      is_correct: true,
    },
    {
      item_id: "item_3",
      attribute: otherAttr,
      asset: { kind: "emoji" as const, ref: distractorEmoji1 },
      is_correct: false,
    },
    {
      item_id: "item_4",
      attribute: otherAttr,
      asset: { kind: "emoji" as const, ref: distractorEmoji2 },
      is_correct: false,
    },
  ];
}

// 6. D4-03: Phân nhóm theo Kích thước (C3.CLS.03, C1.CMP.01, C1.CMP.02, C1.CMP.06) — 10 levels
function createD403Levels(): ContentSeed<unknown, unknown>[] {
  const skillList = [
    "C3.CLS.03",
    "C3.CLS.03",
    "C1.CMP.01",
    "C1.CMP.01",
    "C1.CMP.01",
    "C1.CMP.02",
    "C1.CMP.02",
    "C1.CMP.02",
    "C1.CMP.06",
    "C1.CMP.06",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "nature";
    const targetSize = i % 2 === 0 ? "big" : "small";
    const sizeLabel = targetSize === "big" ? "đồ vật To" : "đồ vật Nhỏ";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange(i);
    const accessTier = getAccessTier(i, 0);
    const items = createD403Items(targetSize);
    const skillCode = skillList[i] ?? "C3.CLS.03";

    return {
      header: {
        code: `GL-C3-SIZ-BSK-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D4-03",
        content_version: 1,
        template_code: "GT-003",
        title: `Phân nhóm theo kích thước (${sizeLabel})`,
        instruction: `Bé hãy kéo các ${sizeLabel} vào giỏ nhé!`,
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["msr"],
        thinking_tags: ["compare", "sort"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: `Bé hãy kéo các ${sizeLabel} vào giỏ nhé!`,
        container: {
          container_id: "basket_size",
          label: sizeLabel,
          accepts_attribute: `size_${targetSize}`,
        },
        items,
      },
      difficulty_params: {
        distractor_count: 2,
        target_count: 2,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  });
}

// 7. D4-04: Phân nhóm Đa thuộc tính (C3.CLS.06, C6.FLX.01, C6.FLX.03, C3.SEQ.01) — 10 levels
function createD404Levels(): ContentSeed<unknown, unknown>[] {
  const skillList = [
    "C3.CLS.06",
    "C3.CLS.06",
    "C6.FLX.01",
    "C6.FLX.01",
    "C6.FLX.01",
    "C6.FLX.03",
    "C6.FLX.03",
    "C6.FLX.03",
    "C3.SEQ.01",
    "C3.SEQ.01",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "art";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = i < 5 ? [4, 5] : [5, 6];
    const accessTier = getAccessTier(i, 1);

    const items = [
      {
        item_id: "item_1",
        attribute: "red_and_round",
        asset: { kind: "emoji" as const, ref: "EMJ-red-circle" },
        is_correct: true,
      },
      {
        item_id: "item_2",
        attribute: "red_and_round",
        asset: { kind: "emoji" as const, ref: "EMJ-red-apple" },
        is_correct: true,
      },
      {
        item_id: "item_3",
        attribute: "red_and_square",
        asset: { kind: "emoji" as const, ref: "EMJ-gift" },
        is_correct: false,
      },
      {
        item_id: "item_4",
        attribute: "blue_and_round",
        asset: { kind: "emoji" as const, ref: "EMJ-blue-circle" },
        is_correct: false,
      },
    ];

    const skillCode = skillList[i] ?? "C3.CLS.06";

    return {
      header: {
        code: `GL-C3-MUL-BSK-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D4-04",
        content_version: 1,
        template_code: "GT-003",
        title: `Phân nhóm vừa Đỏ vừa Tròn màn ${idx}`,
        instruction: "Bé kéo đồ vừa đỏ vừa tròn vào giỏ nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["colour", "shp"],
        thinking_tags: ["sort", "infer"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: "Bé hãy kéo các đồ vật vừa màu đỏ vừa hình tròn vào giỏ nhé!",
        container: {
          container_id: "basket_multi",
          label: "Vừa Đỏ vừa Tròn",
          accepts_attribute: "red_and_round",
        },
        items,
      },
      difficulty_params: {
        distractor_count: 2,
        target_count: 2,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  });
}

// 8. D4-08: Phân loại Đời thực (C3.CLS.04, C3.DED.01, C3.ANA.02, C3.ANA.03) — 10 levels
function createD408Levels(): ContentSeed<unknown, unknown>[] {
  const categories = ["food", "vehicle", "school_supply", "animal"] as const;
  const catLabels: Record<string, string> = {
    food: "Đồ ăn",
    vehicle: "Phương tiện giao thông",
    school_supply: "Dụng cụ học tập",
    animal: "Động vật",
  };
  const catItems: Record<string, string[]> = {
    food: ["EMJ-red-apple", "EMJ-banana"],
    vehicle: ["EMJ-car", "EMJ-bus"],
    school_supply: ["EMJ-pencil", "EMJ-open-book"],
    animal: ["EMJ-cat", "EMJ-dog"],
  };

  const skillList = [
    "C3.CLS.04",
    "C3.CLS.04",
    "C3.DED.01",
    "C3.DED.01",
    "C3.DED.01",
    "C3.ANA.02",
    "C3.ANA.02",
    "C3.ANA.02",
    "C3.ANA.03",
    "C3.ANA.03",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "home";
    const targetCat = categories[i % categories.length] ?? "food";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange(i);
    const accessTier = getAccessTier(i, 2);

    const targetList = catItems[targetCat] ?? ["EMJ-red-apple", "EMJ-banana"];
    const distractorCat = targetCat === "food" ? "vehicle" : "food";
    const distractorList = catItems[distractorCat] ?? ["EMJ-car", "EMJ-bus"];

    const items = [
      {
        item_id: "item_1",
        attribute: `cat_${targetCat}`,
        asset: {
          kind: "emoji" as const,
          ref: targetList[0] ?? "EMJ-red-apple",
        },
        is_correct: true,
      },
      {
        item_id: "item_2",
        attribute: `cat_${targetCat}`,
        asset: { kind: "emoji" as const, ref: targetList[1] ?? "EMJ-banana" },
        is_correct: true,
      },
      {
        item_id: "item_3",
        attribute: `cat_${distractorCat}`,
        asset: {
          kind: "emoji" as const,
          ref: distractorList[0] ?? "EMJ-car",
        },
        is_correct: false,
      },
      {
        item_id: "item_4",
        attribute: `cat_${distractorCat}`,
        asset: {
          kind: "emoji" as const,
          ref: distractorList[1] ?? "EMJ-bus",
        },
        is_correct: false,
      },
    ];

    const label = catLabels[targetCat] ?? "Phân loại";
    const skillCode = skillList[i] ?? "C3.CLS.04";

    return {
      header: {
        code: `GL-C3-RLF-BSK-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D4-08",
        content_version: 1,
        template_code: "GT-003",
        title: `Phân loại ${label}`,
        instruction: "Bé kéo đúng nhóm đồ vật vào giỏ nhé!",
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
        prompt: `Bé hãy kéo các ${label} vào giỏ nhé!`,
        container: {
          container_id: "basket_cat",
          label,
          accepts_attribute: `cat_${targetCat}`,
        },
        items,
      },
      difficulty_params: {
        distractor_count: 2,
        target_count: 2,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  });
}

export const GT003_BACKFILL_LEVELS: ContentSeed<unknown, unknown>[] = [
  ...createD101Levels(),
  ...createD104Levels(),
  ...createD205Levels(),
  ...createD401Levels(),
  ...createD402Levels(),
  ...createD403Levels(),
  ...createD404Levels(),
  ...createD408Levels(),
];
