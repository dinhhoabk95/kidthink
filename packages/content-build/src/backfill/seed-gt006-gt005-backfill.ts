import type { ContentSeed } from "@mindkid/content";

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

// ==========================================
// 1. GT-006: SẮP XẾP THỨ TỰ (Age 5-6 only)
// ==========================================

// 1.1 D1-09: Đếm ngược (C1.CNT.04, C1.CNT.09, C1.CNT.10) — 10 levels
function createD109Levels(): ContentSeed<unknown, unknown>[] {
  const countSequences = [
    {
      items: ["🍎", "🍌", "🥕"],
      labels: ["3 quả", "2 quả", "1 quả"],
    },
    {
      items: ["🚗", "🚌", "🚲"],
      labels: ["3 xe", "2 xe", "1 xe"],
    },
    {
      items: ["🐱", "🐶", "🐮"],
      labels: ["3 bạn", "2 bạn", "1 bạn"],
    },
    {
      items: ["⭐", "✨", "🌟"],
      labels: ["3 sao", "2 sao", "1 sao"],
    },
    {
      items: ["🐟", "🐳", "🐬"],
      labels: ["3 cá", "2 cá", "1 cá"],
    },
    {
      items: ["🍬", "🍰", "🧁"],
      labels: ["3 kẹo", "2 kẹo", "1 kẹo"],
    },
    {
      items: ["🌻", "🌳", "🌱"],
      labels: ["3 cây", "2 cây", "1 cây"],
    },
    {
      items: ["✏️", "📖", "🎨"],
      labels: ["3 bút", "2 bút", "1 bút"],
    },
    {
      items: ["🎁", "🎈", "🎉"],
      labels: ["3 quà", "2 quà", "1 quà"],
    },
    {
      items: ["🪑", "🛏️", "🚪"],
      labels: ["3 ghế", "2 ghế", "1 ghế"],
    },
  ];

  const skillList = [
    "C1.CNT.04",
    "C1.CNT.04",
    "C1.CNT.04",
    "C1.CNT.04",
    "C1.CNT.09",
    "C1.CNT.09",
    "C1.CNT.09",
    "C1.CNT.09",
    "C1.CNT.10",
    "C1.CNT.10",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "school";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const accessTier = getAccessTier(i, 0);
    const seq = countSequences[i % countSequences.length] ?? {
      items: ["🍎", "🍌", "🥕"],
      labels: ["3 quả", "2 quả", "1 quả"],
    };
    const skillCode = skillList[i] ?? "C1.CNT.04";

    const sequence = seq.items.map((ref, sIdx) => ({
      step_id: `step_cnt_${sIdx + 1}`,
      order_index: sIdx,
      label: seq.labels[sIdx],
      asset: { kind: "emoji" as const, ref },
    }));

    return {
      header: {
        code: `GL-C1-CDW-ORD-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D1-09",
        content_version: 1,
        template_code: "GT-006",
        title: `Đếm ngược số lượng giảm dần màn ${idx}`,
        instruction: "Bé hãy xếp thứ tự số lượng giảm dần nhé!",
        age_min: 5,
        age_max: 6,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["cnt"],
        thinking_tags: ["sequence", "count"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: "Bé hãy sắp xếp các thẻ theo thứ tự đếm lùi giảm dần nhé!",
        sequence,
      },
      difficulty_params: {
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_initial: true,
      },
    };
  });
}

// 1.2 D5-06: Sắp xếp Trật tự kích thước (C1.MEAS.01..02, C1.MEAS.13) — 10 levels
function createD506Levels(): ContentSeed<unknown, unknown>[] {
  const sizeSequences = [
    {
      items: ["🍓", "🍎", "🍉"],
      labels: ["Nhỏ", "Vừa", "To"],
    },
    {
      items: ["🚲", "🚗", "🚌"],
      labels: ["Bé", "Vừa", "Lớn"],
    },
    { items: ["🐱", "🐶", "🐮"], labels: ["Nhỏ", "Vừa", "To"] },
    {
      items: ["✨", "⭐", "🌟"],
      labels: ["Bé", "Vừa", "Lớn"],
    },
    {
      items: ["🐟", "🐬", "🐳"],
      labels: ["Nhỏ", "Vừa", "To"],
    },
    {
      items: ["🍬", "🧁", "🍰"],
      labels: ["Bé", "Vừa", "Lớn"],
    },
    {
      items: ["🌱", "🌻", "🌳"],
      labels: ["Thấp", "Vừa", "Cao"],
    },
    {
      items: ["✏️", "📖", "🎒"],
      labels: ["Nhỏ", "Vừa", "To"],
    },
    {
      items: ["🎈", "🎁", "🎉"],
      labels: ["Bé", "Vừa", "Lớn"],
    },
    {
      items: ["🪑", "🚪", "🏠"],
      labels: ["Nhỏ", "Vừa", "To"],
    },
  ];

  const skillList = [
    "C1.MEAS.01",
    "C1.MEAS.01",
    "C1.MEAS.01",
    "C1.MEAS.01",
    "C1.MEAS.02",
    "C1.MEAS.02",
    "C1.MEAS.02",
    "C1.MEAS.02",
    "C1.MEAS.13",
    "C1.MEAS.13",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "nature";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const accessTier = getAccessTier(i, 1);
    const seq = sizeSequences[i % sizeSequences.length] ?? {
      items: ["🍓", "🍎", "🍉"],
      labels: ["Nhỏ", "Vừa", "To"],
    };
    const skillCode = skillList[i] ?? "C1.MEAS.01";

    const sequence = seq.items.map((ref, sIdx) => ({
      step_id: `step_sz_${sIdx + 1}`,
      order_index: sIdx,
      label: seq.labels[sIdx],
      asset: { kind: "emoji" as const, ref },
    }));

    return {
      header: {
        code: `GL-C1-SZO-ORD-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D5-06",
        content_version: 1,
        template_code: "GT-006",
        title: `Sắp xếp trật tự kích thước từ bé đến lớn màn ${idx}`,
        instruction: "Bé hãy xếp thứ tự từ bé đến lớn nhé!",
        age_min: 5,
        age_max: 6,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["msr"],
        thinking_tags: ["sequence", "compare"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: "Bé hãy xếp các đồ vật theo trật tự kích thước tăng dần nhé!",
        sequence,
      },
      difficulty_params: {
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_initial: true,
      },
    };
  });
}

// 1.3 D5-07: Thời gian: Trước/Sau (C1.CNT.07, C1.NREC.09, C4.VIS.03) — 10 levels
function createD507Levels(): ContentSeed<unknown, unknown>[] {
  const timeSequences = [
    {
      items: ["☀️", "⛅", "🌙"],
      labels: ["Sáng", "Chiều", "Tối"],
    },
    {
      items: ["🌱", "🌻", "🌳"],
      labels: ["Nảy mầm", "Ra hoa", "Cây lớn"],
    },
    {
      items: ["🥚", "🐤", "🐓"],
      labels: ["Quả trứng", "Gà con", "Gà trống"],
    },
    {
      items: ["⏰", "🏫", "🛏️"],
      labels: ["Thức dậy", "Đi học", "Đi ngủ"],
    },
    {
      items: ["🍞", "🍴", "✨"],
      labels: ["Chuẩn bị", "Ăn uống", "Dọn dẹp"],
    },
    {
      items: ["✏️", "📖", "🎒"],
      labels: ["Làm bài", "Đọc sách", "Cất cặp"],
    },
    {
      items: ["🚿", "👕", "👟"],
      labels: ["Tắm rửa", "Mặc áo", "Xỏ giày"],
    },
    {
      items: ["🍅", "🍴", "🍲"],
      labels: ["Rửa rau", "Nấu ăn", "Món ngon"],
    },
    {
      items: ["🎈", "🎉", "🍰"],
      labels: ["Thổi bóng", "Bật tiệc", "Ăn bánh"],
    },
    {
      items: ["✏️", "🎨", "🖼️"],
      labels: ["Chấm màu", "Vẽ tranh", "Treo tranh"],
    },
  ];

  const skillList = [
    "C1.CNT.07",
    "C1.CNT.07",
    "C1.CNT.07",
    "C1.CNT.07",
    "C1.NREC.09",
    "C1.NREC.09",
    "C1.NREC.09",
    "C4.VIS.03",
    "C4.VIS.03",
    "C4.VIS.03",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "home";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const accessTier = getAccessTier(i, 2);
    const seq = timeSequences[i % timeSequences.length] ?? {
      items: ["☀️", "⛅", "🌙"],
      labels: ["Sáng", "Chiều", "Tối"],
    };
    const skillCode = skillList[i] ?? "C1.CNT.07";

    const sequence = seq.items.map((ref, sIdx) => ({
      step_id: `step_tm_${sIdx + 1}`,
      order_index: sIdx,
      label: seq.labels[sIdx],
      asset: { kind: "emoji" as const, ref },
    }));

    return {
      header: {
        code: `GL-C1-TIM-ORD-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D5-07",
        content_version: 1,
        template_code: "GT-006",
        title: `Sắp xếp trình tự thời gian trước sau màn ${idx}`,
        instruction: "Bé hãy xếp thứ tự các bước trước sau nhé!",
        age_min: 5,
        age_max: 6,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["time"],
        thinking_tags: ["sequence", "observe"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: "Bé hãy sắp xếp các sự kiện theo đúng dòng thời gian nhé!",
        sequence,
      },
      difficulty_params: {
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_initial: true,
      },
    };
  });
}

// 1.4 D3-03: Sắp xếp Thứ tự (Seriation) (C5.DES.01, C5.STO.01, C6.WM.03) — 10 levels
function createD303Levels(): ContentSeed<unknown, unknown>[] {
  const seriationSequences = [
    {
      items: ["🍎", "🍌", "🍉"],
      labels: ["1", "2", "3"],
    },
    {
      items: ["⭐", "✏️", "📖"],
      labels: ["1", "2", "3"],
    },
    { items: ["🐱", "🐶", "🐮"], labels: ["1", "2", "3"] },
    { items: ["🚗", "🚌", "✈️"], labels: ["1", "2", "3"] },
    {
      items: ["🐟", "🐬", "🐳"],
      labels: ["1", "2", "3"],
    },
    {
      items: ["🍬", "🧁", "🍰"],
      labels: ["1", "2", "3"],
    },
    {
      items: ["🌻", "🌳", "🏠"],
      labels: ["1", "2", "3"],
    },
    {
      items: ["🎈", "🎁", "🎉"],
      labels: ["1", "2", "3"],
    },
    {
      items: ["🍅", "🥔", "🥒"],
      labels: ["1", "2", "3"],
    },
    { items: ["🪑", "🛏️", "🚪"], labels: ["1", "2", "3"] },
  ];

  const skillList = [
    "C5.DES.01",
    "C5.DES.01",
    "C5.DES.01",
    "C5.DES.01",
    "C5.STO.01",
    "C5.STO.01",
    "C5.STO.01",
    "C5.STO.01",
    "C6.WM.03",
    "C6.WM.03",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "festival";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const accessTier = getAccessTier(i, 3);
    const seq = seriationSequences[i % seriationSequences.length] ?? {
      items: ["🍎", "🍌", "🍉"],
      labels: ["1", "2", "3"],
    };
    const skillCode = skillList[i] ?? "C5.DES.01";

    const sequence = seq.items.map((ref, sIdx) => ({
      step_id: `step_ser_${sIdx + 1}`,
      order_index: sIdx,
      label: seq.labels[sIdx],
      asset: { kind: "emoji" as const, ref },
    }));

    return {
      header: {
        code: `GL-C3-SER-ORD-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D3-03",
        content_version: 1,
        template_code: "GT-006",
        title: `Sắp xếp chuỗi liên tục (Seriation) màn ${idx}`,
        instruction: "Bé hãy xếp thứ tự liên tục nhé!",
        age_min: 5,
        age_max: 6,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["pat"],
        thinking_tags: ["sequence", "sort"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: "Bé hãy sắp xếp các thẻ theo đúng chuỗi liên tục nhé!",
        sequence,
      },
      difficulty_params: {
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_initial: true,
      },
    };
  });
}

// 1.5 D4-06: Sắp xếp Thứ tự theo nhóm (C2.CON.02..04, C2.DIR.06..07) — 10 levels
function createD406Levels(): ContentSeed<unknown, unknown>[] {
  const groupOrderSequences = [
    {
      items: ["🌱", "🌻", "🌳"],
      labels: ["Mầm", "Hoa", "Cây"],
    },
    {
      items: ["🥚", "🐤", "🐓"],
      labels: ["Trứng", "Gà con", "Gà"],
    },
    {
      items: ["🔴", "🟦", "⭐"],
      labels: ["Tròn", "Vuông", "Sao"],
    },
    {
      items: ["🚲", "🚗", "✈️"],
      labels: ["Chậm", "Vừa", "Nhanh"],
    },
    {
      items: ["🐜", "🐶", "🐘"],
      labels: ["Nhỏ", "Vừa", "Khổng lồ"],
    },
    {
      items: ["✏️", "📖", "🎓"],
      labels: ["Bút", "Sách", "Mũ"],
    },
    {
      items: ["🍬", "🍰", "🏆"],
      labels: ["Kẹo", "Bánh", "Cúp"],
    },
    {
      items: ["🎈", "🎁", "🎉"],
      labels: ["Bóng", "Quà", "Pháo"],
    },
    {
      items: ["✨", "🌙", "☀️"],
      labels: ["Sao", "Trăng", "Mặt trời"],
    },
    {
      items: ["🍅", "🍲", "🍴"],
      labels: ["Rau", "Nấu", "Ăn"],
    },
  ];

  const skillList = [
    "C2.CON.02",
    "C2.CON.02",
    "C2.CON.02",
    "C2.CON.04",
    "C2.CON.04",
    "C2.CON.04",
    "C2.DIR.06",
    "C2.DIR.06",
    "C2.DIR.06",
    "C2.DIR.07",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "food";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const accessTier = getAccessTier(i, 4);
    const seq = groupOrderSequences[i % groupOrderSequences.length] ?? {
      items: ["🌱", "🌻", "🌳"],
      labels: ["Mầm", "Hoa", "Cây"],
    };
    const skillCode = skillList[i] ?? "C2.CON.02";

    const sequence = seq.items.map((ref, sIdx) => ({
      step_id: `step_grp_${sIdx + 1}`,
      order_index: sIdx,
      label: seq.labels[sIdx],
      asset: { kind: "emoji" as const, ref },
    }));

    return {
      header: {
        code: `GL-C3-RNK-ORD-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D4-06",
        content_version: 1,
        template_code: "GT-006",
        title: `Sắp xếp thứ tự các bậc phát triển màn ${idx}`,
        instruction: "Bé hãy xếp thứ tự các bước phát triển nhé!",
        age_min: 5,
        age_max: 6,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["category"],
        thinking_tags: ["sequence", "sort"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: "Bé hãy sắp xếp các thẻ theo đúng trật tự nhé!",
        sequence,
      },
      difficulty_params: {
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_initial: true,
      },
    };
  });
}

// ==========================================
// 2. GT-005: GHÉP CẶP (Age 3-6)
// ==========================================

// 2.1 D1-02: Tương ứng 1-1 (C1.CNT.01, C1.CNT.03, C2.PER.03) — 10 levels
function createD102Levels(): ContentSeed<unknown, unknown>[] {
  const pairSets = [
    {
      pairs: [
        { l: "🍎", r: "🍌" },
        { l: "🚗", r: "🚌" },
      ],
    },
    {
      pairs: [
        { l: "🐱", r: "🐶" },
        { l: "✏️", r: "📖" },
      ],
    },
    {
      pairs: [
        { l: "⭐", r: "🌟" },
        { l: "🐟", r: "🐳" },
      ],
    },
    {
      pairs: [
        { l: "🍬", r: "🍰" },
        { l: "🌻", r: "🌳" },
      ],
    },
    {
      pairs: [
        { l: "🎁", r: "🎈" },
        { l: "🍅", r: "🥔" },
      ],
    },
    {
      pairs: [
        { l: "🪑", r: "🛏️" },
        { l: "🐮", r: "🐷" },
        { l: "🚗", r: "🚲" },
      ],
    },
    {
      pairs: [
        { l: "🔴", r: "🟦" },
        { l: "✨", r: "⭐" },
        { l: "🚌", r: "🚗" },
      ],
    },
    {
      pairs: [
        { l: "🐬", r: "🐟" },
        { l: "🍓", r: "🍎" },
        { l: "🍰", r: "🍬" },
      ],
    },
    {
      pairs: [
        { l: "🌻", r: "🌳" },
        { l: "✏️", r: "🎨" },
        { l: "🎈", r: "🎁" },
      ],
    },
    {
      pairs: [
        { l: "🐱", r: "🐶" },
        { l: "📖", r: "✏️" },
        { l: "🚗", r: "🚌" },
      ],
    },
  ];

  const skillList = [
    "C1.CNT.01",
    "C1.CNT.01",
    "C1.CNT.01",
    "C1.CNT.01",
    "C1.CNT.03",
    "C1.CNT.03",
    "C1.CNT.03",
    "C1.CNT.03",
    "C2.PER.03",
    "C2.PER.03",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "school";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange(i);
    const accessTier = getAccessTier(i, 0);
    const pSet = pairSets[i % pairSets.length] ?? {
      pairs: [
        { l: "🍎", r: "🍌" },
        { l: "🚗", r: "🚌" },
      ],
    };
    const skillCode = skillList[i] ?? "C1.CNT.01";

    const pairs = pSet.pairs.map((p, pIdx) => ({
      pair_id: `oto_pair_${pIdx + 1}`,
      left: {
        item_id: `left_${pIdx + 1}`,
        asset: { kind: "emoji" as const, ref: p.l },
      },
      right: {
        item_id: `right_${pIdx + 1}`,
        asset: { kind: "emoji" as const, ref: p.r },
      },
    }));

    return {
      header: {
        code: `GL-C1-OTO-MATCH-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D1-02",
        content_version: 1,
        template_code: "GT-005",
        title: `Nối tương ứng 1-1 các cặp đôi màn ${idx}`,
        instruction: "Bé hãy nối từng cặp tương ứng nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["quantity"],
        thinking_tags: ["match", "observe"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: "Bé hãy ghép đôi mỗi bạn bên trái với một bạn bên phải nhé!",
        pairs,
      },
      difficulty_params: {
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_sides: true,
      },
    };
  });
}

// 2.2 D1-08: Ghép đôi Số-Chấm (C6.WM.01..04) — 10 levels
function createD108Levels(): ContentSeed<unknown, unknown>[] {
  const numDotSets = [
    {
      pairs: [
        { l: "🍎", r: "🍎" },
        { l: "🍌", r: "🍌" },
      ],
    },
    {
      pairs: [
        { l: "⭐", r: "⭐" },
        { l: "✏️", r: "✏️" },
      ],
    },
    {
      pairs: [
        { l: "🚗", r: "🚗" },
        { l: "🚌", r: "🚌" },
      ],
    },
    {
      pairs: [
        { l: "🐱", r: "🐱" },
        { l: "🐶", r: "🐶" },
      ],
    },
    {
      pairs: [
        { l: "🐟", r: "🐟" },
        { l: "🐳", r: "🐳" },
      ],
    },
    {
      pairs: [
        { l: "🍬", r: "🍬" },
        { l: "🍰", r: "🍰" },
        { l: "🧁", r: "🧁" },
      ],
    },
    {
      pairs: [
        { l: "🌻", r: "🌻" },
        { l: "🌳", r: "🌳" },
        { l: "🌱", r: "🌱" },
      ],
    },
    {
      pairs: [
        { l: "🎁", r: "🎁" },
        { l: "🎈", r: "🎈" },
        { l: "🎉", r: "🎉" },
      ],
    },
    {
      pairs: [
        { l: "🍅", r: "🍅" },
        { l: "🥔", r: "🥔" },
        { l: "🥒", r: "🥒" },
      ],
    },
    {
      pairs: [
        { l: "🪑", r: "🪑" },
        { l: "🛏️", r: "🛏️" },
        { l: "🚪", r: "🚪" },
      ],
    },
  ];

  const skillList = [
    "C6.WM.01",
    "C6.WM.01",
    "C6.WM.02",
    "C6.WM.02",
    "C6.WM.02",
    "C6.WM.03",
    "C6.WM.03",
    "C6.WM.03",
    "C6.WM.04",
    "C6.WM.04",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "nature";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange(i);
    const accessTier = getAccessTier(i, 1);
    const pSet = numDotSets[i % numDotSets.length] ?? {
      pairs: [
        { l: "🍎", r: "🍎" },
        { l: "🍌", r: "🍌" },
      ],
    };
    const skillCode = skillList[i] ?? "C6.WM.01";

    const pairs = pSet.pairs.map((p, pIdx) => ({
      pair_id: `dot_pair_${pIdx + 1}`,
      left: {
        item_id: `dot_left_${pIdx + 1}`,
        asset: { kind: "emoji" as const, ref: p.l },
      },
      right: {
        item_id: `dot_right_${pIdx + 1}`,
        asset: { kind: "emoji" as const, ref: p.r },
      },
    }));

    return {
      header: {
        code: `GL-C1-DOT-PAIR-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D1-08",
        content_version: 1,
        template_code: "GT-005",
        title: `Ghép đôi thẻ hình giống nhau màn ${idx}`,
        instruction: "Bé hãy ghép hai hình giống nhau nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["number"],
        thinking_tags: ["recall", "match"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: "Bé hãy tìm và ghép các cặp hình đôi tương ứng nhé!",
        pairs,
      },
      difficulty_params: {
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_sides: true,
      },
    };
  });
}

// 2.3 D6-03: Nhân-Quả (C3.INF.02..03, C5.STO.04) — 10 levels
function createD603Levels(): ContentSeed<unknown, unknown>[] {
  const causeEffectSets = [
    {
      pairs: [
        { l: "☁️", r: "💧" },
        { l: "☀️", r: "🌻" },
      ],
    },
    {
      pairs: [
        { l: "🌱", r: "🌳" },
        { l: "🥚", r: "🐤" },
      ],
    },
    {
      pairs: [
        { l: "🍲", r: "🍴" },
        { l: "✏️", r: "📖" },
      ],
    },
    {
      pairs: [
        { l: "🧼", r: "🚿" },
        { l: "⏰", r: "☀️" },
      ],
    },
    {
      pairs: [
        { l: "🔋", r: "🔦" },
        { l: "🔑", r: "🚪" },
      ],
    },
    {
      pairs: [
        { l: "☁️", r: "🌈" },
        { l: "🌱", r: "🌻" },
        { l: "🍞", r: "🍴" },
      ],
    },
    {
      pairs: [
        { l: "🎨", r: "🖼️" },
        { l: "🔑", r: "🚪" },
        { l: "🔨", r: "🪑" },
      ],
    },
    {
      pairs: [
        { l: "👕", r: "👟" },
        { l: "🧁", r: "🍰" },
        { l: "🔥", r: "🍲" },
      ],
    },
    {
      pairs: [
        { l: "☀️", r: "🍦" },
        { l: "☁️", r: "🌱" },
        { l: "✏️", r: "🎨" },
      ],
    },
    {
      pairs: [
        { l: "🧼", r: "🚿" },
        { l: "🎁", r: "🎉" },
        { l: "🍴", r: "🍲" },
      ],
    },
  ];

  const skillList = [
    "C3.INF.03",
    "C3.INF.03",
    "C3.INF.03",
    "C3.INF.03",
    "C5.STO.04",
    "C5.STO.04",
    "C5.STO.04",
    "C5.STO.04",
    "C3.INF.02",
    "C3.INF.02",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "home";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange(i);
    const accessTier = getAccessTier(i, 2);
    const pSet = causeEffectSets[i % causeEffectSets.length] ?? {
      pairs: [
        { l: "☁️", r: "💧" },
        { l: "☀️", r: "🌻" },
      ],
    };
    const skillCode = skillList[i] ?? "C3.INF.03";

    const pairs = pSet.pairs.map((p, pIdx) => ({
      pair_id: `cause_pair_${pIdx + 1}`,
      left: {
        item_id: `cause_left_${pIdx + 1}`,
        asset: { kind: "emoji" as const, ref: p.l },
      },
      right: {
        item_id: `cause_right_${pIdx + 1}`,
        asset: { kind: "emoji" as const, ref: p.r },
      },
    }));

    return {
      header: {
        code: `GL-C3-CAU-PAIR-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D6-03",
        content_version: 1,
        template_code: "GT-005",
        title: `Ghép cặp nguyên nhân và kết quả màn ${idx}`,
        instruction: "Bé hãy nối nguyên nhân và kết quả nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["category"],
        thinking_tags: ["infer", "predict"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: "Bé hãy ghép đôi nguyên nhân và kết quả tương ứng nhé!",
        pairs,
      },
      difficulty_params: {
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_sides: true,
      },
    };
  });
}

export const GT006_GT005_BACKFILL_LEVELS: ContentSeed<unknown, unknown>[] = [
  ...createD109Levels(),
  ...createD506Levels(),
  ...createD507Levels(),
  ...createD303Levels(),
  ...createD406Levels(),
  ...createD102Levels(),
  ...createD108Levels(),
  ...createD603Levels(),
];
