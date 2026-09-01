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

// 1. D1-05: Chuỗi Số Đặt đúng (C1.NREC.06..08, C1.NCOMP.01..02) — 10 levels
function createD105Levels(): ContentSeed<unknown, unknown>[] {
  const numSequences = [
    {
      items: ["EMJ-red-apple", "EMJ-banana", "EMJ-carrot"],
      labels: ["1", "2", "3"],
    },
    { items: ["EMJ-car", "EMJ-bus", "EMJ-bicycle"], labels: ["2", "3", "4"] },
    { items: ["EMJ-cat", "EMJ-dog", "EMJ-cow"], labels: ["3", "4", "5"] },
    {
      items: ["EMJ-star", "EMJ-sparkles", "EMJ-glowing-star"],
      labels: ["1", "2", "3"],
    },
    {
      items: ["EMJ-fish", "EMJ-whale", "EMJ-dolphin"],
      labels: ["4", "5", "6"],
    },
    {
      items: ["EMJ-candy", "EMJ-cake", "EMJ-ice-cream"],
      labels: ["2", "3", "4"],
    },
    {
      items: ["EMJ-sunflower", "EMJ-deciduous-tree", "EMJ-red-apple"],
      labels: ["5", "6", "7"],
    },
    {
      items: ["EMJ-pencil", "EMJ-open-book", "EMJ-palette"],
      labels: ["1", "2", "3"],
    },
    {
      items: ["EMJ-gift", "EMJ-balloon", "EMJ-party-popper"],
      labels: ["3", "4", "5"],
    },
    { items: ["EMJ-chair", "EMJ-bed", "EMJ-door"], labels: ["2", "3", "4"] },
  ];

  const skillList = [
    "C1.NREC.06",
    "C1.NREC.06",
    "C1.NREC.07",
    "C1.NREC.07",
    "C1.NREC.08",
    "C1.NREC.08",
    "C1.NCOMP.01",
    "C1.NCOMP.01",
    "C1.NCOMP.02",
    "C1.NCOMP.02",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "school";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange(i);
    const accessTier = getAccessTier(i, 0);
    const seq = numSequences[i % numSequences.length] ?? {
      items: ["EMJ-red-apple", "EMJ-banana", "EMJ-carrot"],
      labels: ["1", "2", "3"],
    };
    const skillCode = skillList[i] ?? "C1.NREC.06";

    const slots = seq.items.map((_, sIdx) => ({
      slot_id: `slot_${sIdx + 1}`,
      label: seq.labels[sIdx],
      expected_item_id: `item_${sIdx + 1}`,
    }));

    const items = seq.items.map((ref, itIdx) => ({
      item_id: `item_${itIdx + 1}`,
      label: seq.labels[itIdx],
      asset: { kind: "emoji" as const, ref },
    }));

    return {
      header: {
        code: `GL-C1-ORD-SLOT-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D1-05",
        content_version: 1,
        template_code: "GT-008",
        title: `Đặt các số theo thứ tự màn ${idx}`,
        instruction: "Bé hãy kéo các hình vào đúng ô thứ tự nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["number"],
        thinking_tags: ["sequence", "compare"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: "Bé hãy kéo các thẻ vào ô theo đúng thứ tự nhé!",
        slots,
        items,
      },
      difficulty_params: {
        slot_count: slots.length,
        distractor_count: 0,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  });
}

// 2. D5-05: Đo bằng Thước (C1.MEAS.09, C1.MEAS.01..04) — 10 levels
function createD505Levels(): ContentSeed<unknown, unknown>[] {
  const rulerSets = [
    { items: ["EMJ-pencil", "EMJ-open-book"], slots: ["Ô ngắn", "Ô dài"] },
    { items: ["EMJ-car", "EMJ-bus"], slots: ["Vạch 1", "Vạch 2"] },
    { items: ["EMJ-banana", "EMJ-watermelon"], slots: ["Ngắn", "Dài"] },
    { items: ["EMJ-fish", "EMJ-whale"], slots: ["Vạch 2", "Vạch 4"] },
    { items: ["EMJ-sunflower", "EMJ-deciduous-tree"], slots: ["Thấp", "Cao"] },
    { items: ["EMJ-candy", "EMJ-cake"], slots: ["Bé", "Lớn"] },
    { items: ["EMJ-dog", "EMJ-giraffe"], slots: ["Vạch 1", "Vạch 3"] },
    { items: ["EMJ-chair", "EMJ-bed"], slots: ["Vạch 2", "Vạch 5"] },
    { items: ["EMJ-sparkles", "EMJ-star"], slots: ["Nhỏ", "Vừa"] },
    { items: ["EMJ-tomato", "EMJ-potato"], slots: ["Vạch 1", "Vạch 2"] },
  ];

  const skillList = [
    "C1.MEAS.09",
    "C1.MEAS.09",
    "C1.MEAS.01",
    "C1.MEAS.01",
    "C1.MEAS.02",
    "C1.MEAS.02",
    "C1.MEAS.03",
    "C1.MEAS.03",
    "C1.MEAS.04",
    "C1.MEAS.04",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "nature";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange(i);
    const accessTier = getAccessTier(i, 1);
    const set = rulerSets[i % rulerSets.length] ?? {
      items: ["EMJ-pencil", "EMJ-open-book"],
      slots: ["Ô ngắn", "Ô dài"],
    };
    const skillCode = skillList[i] ?? "C1.MEAS.09";

    const slots = set.slots.map((label, sIdx) => ({
      slot_id: `ruler_slot_${sIdx + 1}`,
      label,
      expected_item_id: `ruler_item_${sIdx + 1}`,
    }));

    const items = set.items.map((ref, itIdx) => ({
      item_id: `ruler_item_${itIdx + 1}`,
      label: set.slots[itIdx],
      asset: { kind: "emoji" as const, ref },
    }));

    return {
      header: {
        code: `GL-C1-RUL-SLOT-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D5-05",
        content_version: 1,
        template_code: "GT-008",
        title: `Đo và kéo vào vạch thước màn ${idx}`,
        instruction: "Bé hãy kéo đồ vật vào đúng vạch đo nhé!",
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
        prompt: "Bé hãy đặt đồ vật vào vạch đo tương ứng nhé!",
        slots,
        items,
      },
      difficulty_params: {
        slot_count: slots.length,
        distractor_count: 0,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  });
}

// 3. D2-01: Ghép hình vào Lỗ (C2.GEO.04..06, C2.CON.02..03) — 10 levels
function createD201Levels(): ContentSeed<unknown, unknown>[] {
  const shapeHoles = [
    {
      items: ["EMJ-red-circle", "EMJ-blue-square"],
      labels: ["Lỗ Tròn", "Lỗ Vuông"],
    },
    {
      items: ["EMJ-red-triangle-up", "EMJ-star"],
      labels: ["Lỗ Tam giác", "Lỗ Sao"],
    },
    {
      items: ["EMJ-green-square", "EMJ-orange-square"],
      labels: ["Lỗ Xanh", "Lỗ Cam"],
    },
    {
      items: ["EMJ-blue-circle", "EMJ-purple-circle"],
      labels: ["Lỗ Lam", "Lỗ Tím"],
    },
    {
      items: ["EMJ-yellow-circle", "EMJ-red-circle"],
      labels: ["Lỗ Vàng", "Lỗ Đỏ"],
    },
    {
      items: ["EMJ-red-circle", "EMJ-blue-square", "EMJ-star"],
      labels: ["Tròn", "Vuông", "Sao"],
    },
    {
      items: ["EMJ-red-triangle-up", "EMJ-green-square", "EMJ-blue-circle"],
      labels: ["Tam giác", "Vuông", "Tròn"],
    },
    {
      items: ["EMJ-star", "EMJ-orange-square", "EMJ-purple-circle"],
      labels: ["Sao", "Vuông", "Tròn"],
    },
    {
      items: ["EMJ-yellow-circle", "EMJ-red-triangle-up", "EMJ-blue-square"],
      labels: ["Tròn", "Tam giác", "Vuông"],
    },
    {
      items: ["EMJ-green-square", "EMJ-star", "EMJ-red-circle"],
      labels: ["Vuông", "Sao", "Tròn"],
    },
  ];

  const skillList = [
    "C2.GEO.04",
    "C2.GEO.04",
    "C2.GEO.05",
    "C2.GEO.05",
    "C2.GEO.06",
    "C2.GEO.06",
    "C2.CON.02",
    "C2.CON.02",
    "C2.CON.03",
    "C2.CON.03",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "art";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange(i);
    const accessTier = getAccessTier(i, 2);
    const holeData = shapeHoles[i % shapeHoles.length] ?? {
      items: ["EMJ-red-circle", "EMJ-blue-square"],
      labels: ["Lỗ Tròn", "Lỗ Vuông"],
    };
    const skillCode = skillList[i] ?? "C2.GEO.04";

    const slots = holeData.items.map((_, sIdx) => ({
      slot_id: `hole_slot_${sIdx + 1}`,
      label: holeData.labels[sIdx],
      expected_item_id: `hole_item_${sIdx + 1}`,
    }));

    const items = holeData.items.map((ref, itIdx) => ({
      item_id: `hole_item_${itIdx + 1}`,
      label: holeData.labels[itIdx],
      asset: { kind: "emoji" as const, ref },
    }));

    return {
      header: {
        code: `GL-C2-HOL-SLOT-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D2-01",
        content_version: 1,
        template_code: "GT-008",
        title: `Ghép hình học vào khung lỗ màn ${idx}`,
        instruction: "Bé hãy kéo hình vào đúng khung lỗ nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["shp"],
        thinking_tags: ["match", "observe"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: "Bé hãy ghép các hình vào đúng khung hình tương ứng nhé!",
        slots,
        items,
      },
      difficulty_params: {
        slot_count: slots.length,
        distractor_count: 0,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  });
}

// 4. D3-01: Tiếp nối Quy luật Màu (C1.PAT.02, C1.PAT.03, C1.PAT.05, C3.RULE.01, C3.RULE.02) — 10 levels
function createD301Levels(): ContentSeed<unknown, unknown>[] {
  const patternEnds = [
    {
      items: ["EMJ-red-apple", "EMJ-banana"],
      prompt: "Đỏ - Vàng - Đỏ - [ ? ]",
      label: "Tiếp nối",
    },
    {
      items: ["EMJ-star", "EMJ-pencil"],
      prompt: "Sao - Bút - Sao - [ ? ]",
      label: "Tiếp nối",
    },
    {
      items: ["EMJ-cat", "EMJ-dog"],
      prompt: "Mèo - Chó - Mèo - [ ? ]",
      label: "Tiếp nối",
    },
    {
      items: ["EMJ-car", "EMJ-bus"],
      prompt: "Xe - Buýt - Xe - [ ? ]",
      label: "Tiếp nối",
    },
    {
      items: ["EMJ-sunflower", "EMJ-deciduous-tree"],
      prompt: "Hoa - Cây - Hoa - [ ? ]",
      label: "Tiếp nối",
    },
    {
      items: ["EMJ-fish", "EMJ-whale"],
      prompt: "Cá - Cá voi - Cá - [ ? ]",
      label: "Tiếp nối",
    },
    {
      items: ["EMJ-candy", "EMJ-cake"],
      prompt: "Kẹo - Bánh - Kẹo - [ ? ]",
      label: "Tiếp nối",
    },
    {
      items: ["EMJ-balloon", "EMJ-gift"],
      prompt: "Bóng - Hộp quà - Bóng - [ ? ]",
      label: "Tiếp nối",
    },
    {
      items: ["EMJ-tomato", "EMJ-potato"],
      prompt: "Cà chua - Khoai - Cà chua - [ ? ]",
      label: "Tiếp nối",
    },
    {
      items: ["EMJ-open-book", "EMJ-palette"],
      prompt: "Sách - Bảng vẽ - Sách - [ ? ]",
      label: "Tiếp nối",
    },
  ];

  const skillList = [
    "C1.PAT.02",
    "C1.PAT.02",
    "C1.PAT.03",
    "C1.PAT.03",
    "C1.PAT.05",
    "C1.PAT.05",
    "C3.RULE.01",
    "C3.RULE.01",
    "C3.RULE.02",
    "C3.RULE.02",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "festival";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange(i);
    const accessTier = getAccessTier(i, 3);
    const pat = patternEnds[i % patternEnds.length] ?? {
      items: ["EMJ-red-apple", "EMJ-banana"],
      prompt: "Đỏ - Vàng - Đỏ - [ ? ]",
      label: "Tiếp nối",
    };
    const skillCode = skillList[i] ?? "C1.PAT.02";

    const slots = [
      {
        slot_id: "pat_slot_next",
        label: "Ô tiếp theo",
        expected_item_id: "pat_item_correct",
      },
      {
        slot_id: "pat_slot_dummy",
        label: "Ô phụ",
        expected_item_id: "pat_item_alt",
      },
    ];

    const items = [
      {
        item_id: "pat_item_correct",
        label: "Hình tiếp theo",
        asset: { kind: "emoji" as const, ref: pat.items[1] ?? "EMJ-banana" },
      },
      {
        item_id: "pat_item_alt",
        label: "Hình xen kẽ",
        asset: { kind: "emoji" as const, ref: pat.items[0] ?? "EMJ-red-apple" },
      },
    ];

    return {
      header: {
        code: `GL-C3-PXT-SLOT-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D3-01",
        content_version: 1,
        template_code: "GT-008",
        title: `Tiếp nối chuỗi quy luật màn ${idx}`,
        instruction: "Bé hãy kéo hình tiếp theo vào ô nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["pat"],
        thinking_tags: ["sequence", "predict"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: `Bé hãy chọn hình tiếp nối quy luật: ${pat.prompt}`,
        slots,
        items,
      },
      difficulty_params: {
        slot_count: slots.length,
        distractor_count: 0,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  });
}

// 5. D3-02: Điền Chỗ trống trong Chuỗi (Giữa) (C1.PAT.06..08, C3.RULE.03, C3.INF.01) — 10 levels
function createD302Levels(): ContentSeed<unknown, unknown>[] {
  const middleGaps = [
    {
      items: ["EMJ-red-apple", "EMJ-banana"],
      prompt: "Đỏ - [ ? ] - Đỏ - Vàng",
      label: "Điền giữa",
    },
    {
      items: ["EMJ-star", "EMJ-pencil"],
      prompt: "Sao - [ ? ] - Sao - Bút",
      label: "Điền giữa",
    },
    {
      items: ["EMJ-cat", "EMJ-dog"],
      prompt: "Mèo - [ ? ] - Mèo - Chó",
      label: "Điền giữa",
    },
    {
      items: ["EMJ-car", "EMJ-bus"],
      prompt: "Xe - [ ? ] - Xe - Buýt",
      label: "Điền giữa",
    },
    {
      items: ["EMJ-sunflower", "EMJ-deciduous-tree"],
      prompt: "Hoa - [ ? ] - Hoa - Cây",
      label: "Điền giữa",
    },
    {
      items: ["EMJ-fish", "EMJ-whale"],
      prompt: "Cá - [ ? ] - Cá - Cá voi",
      label: "Điền giữa",
    },
    {
      items: ["EMJ-candy", "EMJ-cake"],
      prompt: "Kẹo - [ ? ] - Kẹo - Bánh",
      label: "Điền giữa",
    },
    {
      items: ["EMJ-balloon", "EMJ-gift"],
      prompt: "Bóng - [ ? ] - Bóng - Hộp quà",
      label: "Điền giữa",
    },
    {
      items: ["EMJ-tomato", "EMJ-potato"],
      prompt: "Cà chua - [ ? ] - Cà chua - Khoai",
      label: "Điền giữa",
    },
    {
      items: ["EMJ-open-book", "EMJ-palette"],
      prompt: "Sách - [ ? ] - Sách - Bảng vẽ",
      label: "Điền giữa",
    },
  ];

  const skillList = [
    "C1.PAT.06",
    "C1.PAT.06",
    "C1.PAT.07",
    "C1.PAT.07",
    "C1.PAT.08",
    "C1.PAT.08",
    "C3.RULE.03",
    "C3.RULE.03",
    "C3.INF.01",
    "C3.INF.01",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "food";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange(i);
    const accessTier = getAccessTier(i, 4);
    const gap = middleGaps[i % middleGaps.length] ?? {
      items: ["EMJ-red-apple", "EMJ-banana"],
      prompt: "Đỏ - [ ? ] - Đỏ - Vàng",
      label: "Điền giữa",
    };
    const skillCode = skillList[i] ?? "C1.PAT.06";

    const slots = [
      {
        slot_id: "gap_slot_middle",
        label: "Ô ở giữa",
        expected_item_id: "gap_item_correct",
      },
      {
        slot_id: "gap_slot_side",
        label: "Ô hai bên",
        expected_item_id: "gap_item_alt",
      },
    ];

    const items = [
      {
        item_id: "gap_item_correct",
        label: "Hình thiếu ở giữa",
        asset: { kind: "emoji" as const, ref: gap.items[1] ?? "EMJ-banana" },
      },
      {
        item_id: "gap_item_alt",
        label: "Hình hai bên",
        asset: { kind: "emoji" as const, ref: gap.items[0] ?? "EMJ-red-apple" },
      },
    ];

    return {
      header: {
        code: `GL-C3-GAP-SLOT-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D3-02",
        content_version: 1,
        template_code: "GT-008",
        title: `Điền vào chỗ trống trong chuỗi màn ${idx}`,
        instruction: "Bé hãy kéo hình vào ô trống ở giữa nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["pat"],
        thinking_tags: ["infer", "sequence"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: `Bé hãy tìm hình bị thiếu ở giữa: ${gap.prompt}`,
        slots,
        items,
      },
      difficulty_params: {
        slot_count: slots.length,
        distractor_count: 0,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  });
}

// 6. D6-04: Hoàn thiện Bức tranh (C4.VIS.01, C4.VIS.04, C4.DET.04, C3.INF.02..03) — 10 levels
function createD604Levels(): ContentSeed<unknown, unknown>[] {
  const pictureScenes = [
    {
      items: ["EMJ-sunflower", "EMJ-deciduous-tree"],
      labels: ["Vườn hoa", "Gốc cây"],
    },
    { items: ["EMJ-fish", "EMJ-dolphin"], labels: ["Rạn san hô", "Đại dương"] },
    { items: ["EMJ-cat", "EMJ-dog"], labels: ["Sân nhà", "Chuồng cún"] },
    { items: ["EMJ-car", "EMJ-bus"], labels: ["Đường phố", "Trạm dừng"] },
    { items: ["EMJ-pencil", "EMJ-open-book"], labels: ["Bàn học", "Kệ sách"] },
    { items: ["EMJ-star", "EMJ-glowing-star"], labels: ["Bầu trời", "Vũ trụ"] },
    { items: ["EMJ-candy", "EMJ-cake"], labels: ["Đĩa bánh", "Tiệc ngọt"] },
    { items: ["EMJ-gift", "EMJ-balloon"], labels: ["Gói quà", "Chùm bóng"] },
    { items: ["EMJ-tomato", "EMJ-potato"], labels: ["Luống rau", "Giỏ củ"] },
    { items: ["EMJ-chair", "EMJ-bed"], labels: ["Phòng khách", "Phòng ngủ"] },
  ];

  const skillList = [
    "C4.VIS.01",
    "C4.VIS.01",
    "C4.VIS.04",
    "C4.VIS.04",
    "C4.DET.04",
    "C4.DET.04",
    "C3.INF.02",
    "C3.INF.02",
    "C3.INF.03",
    "C3.INF.03",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "home";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange(i);
    const accessTier = getAccessTier(i, 0);
    const scene = pictureScenes[i % pictureScenes.length] ?? {
      items: ["EMJ-sunflower", "EMJ-deciduous-tree"],
      labels: ["Vườn hoa", "Gốc cây"],
    };
    const skillCode = skillList[i] ?? "C4.VIS.01";

    const slots = scene.labels.map((label, sIdx) => ({
      slot_id: `scene_slot_${sIdx + 1}`,
      label,
      expected_item_id: `scene_item_${sIdx + 1}`,
    }));

    const items = scene.items.map((ref, itIdx) => ({
      item_id: `scene_item_${itIdx + 1}`,
      label: scene.labels[itIdx],
      asset: { kind: "emoji" as const, ref },
    }));

    return {
      header: {
        code: `GL-C4-PIC-SLOT-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D6-04",
        content_version: 1,
        template_code: "GT-008",
        title: `Hoàn thiện bức tranh phong cảnh màn ${idx}`,
        instruction: "Bé hãy ghép các mảnh ghép vào bức tranh nhé!",
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
        prompt:
          "Bé hãy ghép đúng chi tiết vào từng vị trí trong bức tranh nhé!",
        slots,
        items,
      },
      difficulty_params: {
        slot_count: slots.length,
        distractor_count: 0,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  });
}

export const GT008_BACKFILL_LEVELS: ContentSeed<unknown, unknown>[] = [
  ...createD105Levels(),
  ...createD505Levels(),
  ...createD201Levels(),
  ...createD301Levels(),
  ...createD302Levels(),
  ...createD604Levels(),
];
