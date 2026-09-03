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
// 1. GT-012: NHÌN CHỚP RỒI NHỚ LẠI (Age 3-6)
// ==========================================

// 1.1 D1-06: Flash Đếm Nhanh (Subitizing) (C1.CNT.04, C1.CNT.05) — 10 levels
function createD106Levels(): ContentSeed<unknown, unknown>[] {
  const emojiSets = ["🍎", "🍌", "🍓", "🥕", "🐱", "🐶", "⭐", "❤️", "🚗", "🎈"];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "food";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange3to6(i);
    const accessTier = getAccessTier(i, 0);
    const itemCount = (i % 4) + 2; // 2..5 items
    const ref = emojiSets[i % emojiSets.length] ?? "🍎";
    const skillCode = i < 5 ? "C1.CNT.04" : "C1.CNT.05";

    const flashItems = Array.from({ length: itemCount }, (_, itIdx) => ({
      item_id: `flash_item_${itIdx + 1}`,
      asset: { kind: "emoji" as const, ref },
    }));

    const distractor1 = itemCount > 1 ? itemCount - 1 : itemCount + 2;
    const distractor2 = itemCount + 1;

    const options = [
      { value: itemCount, is_correct: true },
      { value: distractor1, is_correct: false },
      { value: distractor2, is_correct: false },
    ];

    return {
      header: {
        code: `GL-C1-SUB-FLS-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D1-06",
        content_version: 1,
        template_code: "GT-012",
        title: `Flash đếm nhanh chớp nhoáng màn ${idx}`,
        instruction: "Bé hãy nhìn nhanh và nhớ số lượng nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["quantity"],
        thinking_tags: ["recall", "count"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: "Bé hãy nhìn nhanh và nhớ xem có bao nhiêu hình nhé!",
        flash_items: flashItems,
        arrangement: "dice" as const,
        options,
      },
      difficulty_params: {
        flash_ms: 1500,
        item_count: itemCount,
        distractor_count: 2,
        allow_replay: true,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  });
}

// 1.2 D1-07: Đoán Nhanh Chấm (Dot Flash) (C1.CNT.09, C1.CNT.10) — 10 levels
function createD107Levels(): ContentSeed<unknown, unknown>[] {
  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[(i + 1) % THEMES.length] ?? "school";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange3to6(i);
    const accessTier = getAccessTier(i, 1);
    const count = (i % 4) + 1; // 1..4 items
    const skillCode = i < 5 ? "C1.CNT.09" : "C1.CNT.10";

    const flashItems = Array.from({ length: count }, (_, itIdx) => ({
      item_id: `dot_${itIdx + 1}`,
      asset: { kind: "emoji" as const, ref: "⚫" },
    }));

    const distractor1 = count > 1 ? count - 1 : count + 2;
    const distractor2 = count + 1;

    const options = [
      { value: count, is_correct: true },
      { value: distractor1, is_correct: false },
      { value: distractor2, is_correct: false },
    ];

    return {
      header: {
        code: `GL-C1-DOT-FLS-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D1-07",
        content_version: 1,
        template_code: "GT-012",
        title: `Đoán nhanh số chấm tròn màn ${idx}`,
        instruction: "Bé hãy nhìn nhanh và đoán số chấm nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["quantity"],
        thinking_tags: ["observe", "count"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: "Bé hãy nhìn nhanh và đoán số chấm tròn nhé!",
        flash_items: flashItems,
        arrangement: (i % 2 === 0 ? "triangle" : "random") as
          | "triangle"
          | "random",
        options,
      },
      difficulty_params: {
        flash_ms: 1200,
        item_count: count,
        distractor_count: 2,
        allow_replay: true,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  });
}

// 1.3 D1-13: Ghi Nhớ (Flash Memory) (C6.WM.02, C6.INH.02) — 10 levels
function createD113Levels(): ContentSeed<unknown, unknown>[] {
  const itemSequences = [
    ["🐱", "🐶"],
    ["🚗", "🚌", "🚲"],
    ["🍎", "🍌", "🍓"],
    ["⭐", "❤️", "🟡", "🔵"],
    ["🐟", "🐳"],
    ["🍰", "🍬", "🍦"],
    ["✏️", "📖", "🎨"],
    ["🌻", "🌳", "🌱", "🌷"],
    ["🎁", "🎈"],
    ["🪑", "🛏️", "🚪"],
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[(i + 2) % THEMES.length] ?? "animal";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange3to6(i);
    const accessTier = getAccessTier(i, 2);
    const seq = itemSequences[i % itemSequences.length] ?? ["🐱", "🐶"];
    const count = seq.length;
    const skillCode = i < 5 ? "C6.WM.02" : "C6.INH.02";

    const flashItems = seq.map((ref, itIdx) => ({
      item_id: `mem_item_${itIdx + 1}`,
      asset: { kind: "emoji" as const, ref },
    }));

    const distractor1 = count > 1 ? count - 1 : count + 2;
    const distractor2 = count + 1;

    const options = [
      { value: count, is_correct: true },
      { value: distractor1, is_correct: false },
      { value: distractor2, is_correct: false },
    ];

    return {
      header: {
        code: `GL-C6-MEM-FLS-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D1-13",
        content_version: 1,
        template_code: "GT-012",
        title: `Flash ghi nhớ đồ vật màn ${idx}`,
        instruction: "Bé hãy ghi nhớ các đồ vật nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["category"],
        thinking_tags: ["recall", "observe"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: "Bé hãy ghi nhớ các đồ vật xuất hiện trong chớp mắt nhé!",
        flash_items: flashItems,
        arrangement: "line" as const,
        options,
      },
      difficulty_params: {
        flash_ms: 1800,
        item_count: count,
        distractor_count: 2,
        allow_replay: true,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  });
}

// ==========================================
// 2. GT-018: NGHE RỒI LÀM (AUDIO & LISTEN) (Age 4-6)
// ==========================================

const DEFAULT_SOUND_PATTERN = {
  prompt: "Ting-Tong-Ting",
  nextRef: "🔔",
  options: ["🔔", "🥁", "🎸"],
};

// 2.1 D3-04: Quy luật Âm thanh (C1.PAT.01, C1.PAT.02) — 10 levels
function createD304Levels(): ContentSeed<unknown, unknown>[] {
  const soundPatterns = [
    DEFAULT_SOUND_PATTERN,
    {
      prompt: "Tùng-Cắc-Tùng",
      nextRef: "🥁",
      options: ["🥁", "🔔", "🎺"],
    },
    {
      prompt: "La-La-Si-La-La",
      nextRef: "🎼",
      options: ["🎼", "🥁", "🔔"],
    },
    {
      prompt: "Bíp-Bíp-Bíp-Bo",
      nextRef: "🚗",
      options: ["🚗", "🚲", "✈️"],
    },
    {
      prompt: "Gâu-Meo-Gâu-Meo",
      nextRef: "🐶",
      options: ["🐶", "🐱", "🐮"],
    },
    {
      prompt: "Leng-Keng-Leng",
      nextRef: "🔔",
      options: ["🔔", "🎸", "🎻"],
    },
    {
      prompt: "Cúc-Cu-Cúc",
      nextRef: "🐦",
      options: ["🐦", "🐔", "🦆"],
    },
    {
      prompt: "Tíc-Tắc-Tíc",
      nextRef: "⏰",
      options: ["⏰", "🔔", "🥁"],
    },
    {
      prompt: "Rì-Rào-Rì",
      nextRef: "🌊",
      options: ["🌊", "⭐", "🌬️"],
    },
    {
      prompt: "Ting-Ting-Ting",
      nextRef: "⭐",
      options: ["⭐", "🔔", "❤️"],
    },
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "art";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange4to6(i);
    const accessTier = getAccessTier(i, 0);
    const pat =
      soundPatterns[i % soundPatterns.length] ?? DEFAULT_SOUND_PATTERN;
    const skillCode = i < 5 ? "C1.PAT.01" : "C1.PAT.02";

    const options = pat.options.map((ref, itIdx) => ({
      item_id: `opt_sound_${itIdx + 1}`,
      asset: { kind: "emoji" as const, ref },
      is_correct: ref === pat.nextRef,
    }));

    return {
      header: {
        code: `GL-C1-SND-PAT-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D3-04",
        content_version: 1,
        template_code: "GT-018",
        title: `Quy luật chuỗi âm thanh màn ${idx}`,
        instruction: "Bé hãy nghe và chọn hình tiếp theo nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["pattern"],
        thinking_tags: ["sequence", "infer"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: `Bé hãy nghe chuỗi âm thanh: "${pat.prompt}" và chọn hình đúng tiếp theo nhé!`,
        audio_prompt: {
          text: `Chuỗi âm thanh: ${pat.prompt}. Âm thanh tiếp theo là gì?`,
        },
        response_mode: "select" as const,
        options,
      },
      difficulty_params: {
        hint_after_ms: 8000,
        allow_retry: true,
        auto_play_audio: true,
      },
    };
  });
}

const DEFAULT_INSTRUMENT = {
  target: "🥁",
  name: "Trống",
  distractors: ["🔔", "🎸"],
};

// 2.2 D3-08: Chạm Nhạc cụ (Tap Pattern) (C4.MEM.01, C4.MEM.03) — 10 levels
function createD308Levels(): ContentSeed<unknown, unknown>[] {
  const instruments = [
    DEFAULT_INSTRUMENT,
    {
      target: "🎸",
      name: "Đàn ghi-ta",
      distractors: ["🥁", "🎹"],
    },
    {
      target: "🔔",
      name: "Chuông leng keng",
      distractors: ["🎺", "🎻"],
    },
    {
      target: "🎺",
      name: "Kèn trumpet",
      distractors: ["🥁", "🔔"],
    },
    {
      target: "🎻",
      name: "Đàn vĩ cầm",
      distractors: ["🎸", "🎹"],
    },
    {
      target: "🎹",
      name: "Đàn dương cầm",
      distractors: ["🥁", "🎺"],
    },
    {
      target: "🎷",
      name: "Kèn saxophone",
      distractors: ["🎸", "🔔"],
    },
    {
      target: "🥁",
      name: "Trống lắc",
      distractors: ["🎻", "🎹"],
    },
    {
      target: "🔔",
      name: "Chuông gió",
      distractors: ["🎺", "🪈"],
    },
    {
      target: "🎸",
      name: "Đàn dây",
      distractors: ["🥁", "🔔"],
    },
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[(i + 1) % THEMES.length] ?? "art";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange4to6(i);
    const accessTier = getAccessTier(i, 1);
    const ins = instruments[i % instruments.length] ?? DEFAULT_INSTRUMENT;
    const skillCode = i < 5 ? "C4.MEM.01" : "C4.MEM.03";

    const allRefs = [ins.target, ...ins.distractors];
    const options = allRefs.map((ref, itIdx) => ({
      item_id: `inst_${itIdx + 1}`,
      asset: { kind: "emoji" as const, ref },
      is_correct: ref === ins.target,
    }));

    return {
      header: {
        code: `GL-C4-TAP-INS-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D3-08",
        content_version: 1,
        template_code: "GT-018",
        title: `Lắng nghe và chạm vào nhạc cụ màn ${idx}`,
        instruction: "Bé hãy nghe và chạm vào nhạc cụ nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["category"],
        thinking_tags: ["match", "recall"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: `Bé hãy lắng nghe và chọn đúng: ${ins.name} nhé!`,
        audio_prompt: {
          text: `Bé hãy chọn đúng ${ins.name} nhé!`,
        },
        response_mode: "select" as const,
        options,
      },
      difficulty_params: {
        hint_after_ms: 8000,
        allow_retry: true,
        auto_play_audio: true,
      },
    };
  });
}

const DEFAULT_WORD_PROBLEM = {
  text: "Bé có 2 quả táo, mẹ cho thêm 1 quả táo. Hỏi bé có tất cả mấy quả táo?",
  ans: "🍎",
  options: ["🍎", "🍌", "🥕"],
};

// 2.3 D6-09: Bài toán Có lời văn (Audio) (C5.LIS.02, C5.VOC.01) — 10 levels
function createD609Levels(): ContentSeed<unknown, unknown>[] {
  const wordProblems = [
    DEFAULT_WORD_PROBLEM,
    {
      text: "Trong vườn có 3 chú mèo con, có thêm 1 chú mèo chạy tới. Đố bé có mấy bạn mèo?",
      ans: "🐱",
      options: ["🐱", "🐶", "🐰"],
    },
    {
      text: "Có 4 chiếc xe ô tô, 1 chiếc xe rời đi. Còn lại mấy chiếc xe ô tô?",
      ans: "🚗",
      options: ["🚗", "🚌", "🚲"],
    },
    {
      text: "Bác nông dân hái được 3 củ cà rốt ngon lành. Đố bé tìm đúng rổ cà rốt nào?",
      ans: "🥕",
      options: ["🥕", "🍓", "🍎"],
    },
    {
      text: "Trên cây có 2 chú chim hót líu lo, thêm 2 chú chim bay đến. Hỏi có mấy chú chim?",
      ans: "🐦",
      options: ["🐦", "🐟", "🦋"],
    },
    {
      text: "Có 5 ngôi sao lấp lánh trên bầu trời đêm. Bé hãy tìm ngôi sao sáng nhất nhé!",
      ans: "⭐",
      options: ["⭐", "🌙", "☀️"],
    },
    {
      text: "Bạn gấu có 2 que kem ngọt ngào. Bé hãy tìm hình que kem giúp bạn gấu nhé!",
      ans: "🍦",
      options: ["🍦", "🍰", "🍬"],
    },
    {
      text: "Dưới ao có 3 chú cá đang bơi lội tung tăng. Đâu là chú cá bơi ngoan?",
      ans: "🐟",
      options: ["🐟", "🐳", "🐬"],
    },
    {
      text: "Bé có 3 chiếc bút chì màu để vẽ tranh. Hãy chọn đúng bút chì nào!",
      ans: "✏️",
      options: ["✏️", "📖", "🎨"],
    },
    {
      text: "Sinh nhật bé có 4 quả bóng bay rực rỡ. Đâu là quả bóng bay sinh nhật?",
      ans: "🎈",
      options: ["🎈", "🎁", "🎉"],
    },
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[(i + 2) % THEMES.length] ?? "school";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange4to6(i);
    const accessTier = getAccessTier(i, 2);
    const prob = wordProblems[i % wordProblems.length] ?? DEFAULT_WORD_PROBLEM;
    const skillCode = i < 5 ? "C5.LIS.02" : "C5.VOC.01";

    const options = prob.options.map((ref, itIdx) => ({
      item_id: `ans_${itIdx + 1}`,
      asset: { kind: "emoji" as const, ref },
      is_correct: ref === prob.ans,
    }));

    return {
      header: {
        code: `GL-C5-WRD-PRB-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D6-09",
        content_version: 1,
        template_code: "GT-018",
        title: `Bài toán lời văn tương tác màn ${idx}`,
        instruction: "Bé hãy nghe bài toán và chọn đáp án nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["quantity"],
        thinking_tags: ["infer", "count"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: prob.text,
        audio_prompt: {
          text: prob.text,
        },
        response_mode: "select" as const,
        options,
      },
      difficulty_params: {
        hint_after_ms: 10_000,
        allow_retry: true,
        auto_play_audio: true,
      },
    };
  });
}

// ==========================================
// 3. GT-023: LẮP GHÉP HÌNH THỂ (Age 4-6)
// ==========================================

// 3.1 D2-02: Tangram Ghép hình (C2.CON.02, C2.CON.01) — 10 levels
function createD202Levels(): ContentSeed<unknown, unknown>[] {
  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "art";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange4to6(i);
    const accessTier = getAccessTier(i, 0);
    const skillCode = i < 5 ? "C2.CON.02" : "C2.CON.01";

    const anchors = [
      {
        anchor_id: "anc_1",
        x: 380,
        y: 220,
        accepted_part_id: "part_1",
        label: "Mảnh 1",
      },
      {
        anchor_id: "anc_2",
        x: 580,
        y: 220,
        accepted_part_id: "part_2",
        label: "Mảnh 2",
      },
      {
        anchor_id: "anc_3",
        x: 480,
        y: 340,
        accepted_part_id: "part_3",
        label: "Mảnh 3",
      },
    ];

    const parts = [
      {
        part_id: "part_1",
        target_anchor_id: "anc_1",
        asset: { kind: "emoji" as const, ref: "🔺" },
        name: "Tam giác đỏ",
      },
      {
        part_id: "part_2",
        target_anchor_id: "anc_2",
        asset: { kind: "emoji" as const, ref: "🟦" },
        name: "Vuông xanh",
      },
      {
        part_id: "part_3",
        target_anchor_id: "anc_3",
        asset: { kind: "emoji" as const, ref: "🟡" },
        name: "Tròn vàng",
      },
    ];

    return {
      header: {
        code: `GL-C2-TNG-SHP-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D2-02",
        content_version: 1,
        template_code: "GT-023",
        title: `Ghép hình Tangram mẫu màn ${idx}`,
        instruction: "Bé hãy ghép mảnh vào đúng vị trí nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["geometry"],
        thinking_tags: ["match", "plan"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: "Bé hãy ghép các mảnh hình học vào đúng khung hình mẫu nhé!",
        target_model: {
          name: "Hình mẫu Tangram",
          asset: { kind: "emoji" as const, ref: "⭐" },
        },
        anchors,
        parts,
      },
      difficulty_params: {
        snap_radius_px: 60,
        show_anchor_outline: true,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  });
}

// 3.2 D2-07: Lắp ghép Robot/Nhà (C2.CON.03, C2.CON.05) — 10 levels
function createD207Levels(): ContentSeed<unknown, unknown>[] {
  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[(i + 1) % THEMES.length] ?? "vehicle";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange4to6(i);
    const accessTier = getAccessTier(i, 1);
    const skillCode = i < 5 ? "C2.CON.03" : "C2.CON.05";

    const isRobot = i % 2 === 0;
    const anchors = isRobot
      ? [
          {
            anchor_id: "anc_head",
            x: 480,
            y: 150,
            accepted_part_id: "p_head",
            label: "Đầu",
          },
          {
            anchor_id: "anc_body",
            x: 480,
            y: 270,
            accepted_part_id: "p_body",
            label: "Thân",
          },
          {
            anchor_id: "anc_legs",
            x: 480,
            y: 390,
            accepted_part_id: "p_legs",
            label: "Chân",
          },
        ]
      : [
          {
            anchor_id: "anc_roof",
            x: 480,
            y: 160,
            accepted_part_id: "p_roof",
            label: "Mái nhà",
          },
          {
            anchor_id: "anc_wall",
            x: 480,
            y: 280,
            accepted_part_id: "p_wall",
            label: "Tường",
          },
          {
            anchor_id: "anc_door",
            x: 480,
            y: 380,
            accepted_part_id: "p_door",
            label: "Cửa",
          },
        ];

    const parts = isRobot
      ? [
          {
            part_id: "p_head",
            target_anchor_id: "anc_head",
            asset: { kind: "emoji" as const, ref: "⚙️" },
            name: "Đầu máy",
          },
          {
            part_id: "p_body",
            target_anchor_id: "anc_body",
            asset: { kind: "emoji" as const, ref: "🟦" },
            name: "Thân máy",
          },
          {
            part_id: "p_legs",
            target_anchor_id: "anc_legs",
            asset: { kind: "emoji" as const, ref: "🔧" },
            name: "Chân máy",
          },
        ]
      : [
          {
            part_id: "p_roof",
            target_anchor_id: "anc_roof",
            asset: { kind: "emoji" as const, ref: "🔺" },
            name: "Mái nhà",
          },
          {
            part_id: "p_wall",
            target_anchor_id: "anc_wall",
            asset: { kind: "emoji" as const, ref: "🟦" },
            name: "Bức tường",
          },
          {
            part_id: "p_door",
            target_anchor_id: "anc_door",
            asset: { kind: "emoji" as const, ref: "🚪" },
            name: "Cánh cửa",
          },
        ];

    return {
      header: {
        code: `GL-C2-ROB-BLD-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D2-07",
        content_version: 1,
        template_code: "GT-023",
        title: `Lắp ghép hoàn thiện mô hình màn ${idx}`,
        instruction: "Bé hãy lắp các bộ phận vào mô hình nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["geometry"],
        thinking_tags: ["match", "plan"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: `Bé hãy lắp các bộ phận để hoàn thiện ${isRobot ? "mô hình máy móc" : "ngôi nhà"} nhé!`,
        target_model: {
          name: isRobot ? "Mô hình đồ chơi" : "Ngôi nhà xinh xắn",
          asset: {
            kind: "emoji" as const,
            ref: isRobot ? "⚙️" : "🏠",
          },
        },
        anchors,
        parts,
      },
      difficulty_params: {
        snap_radius_px: 60,
        show_anchor_outline: true,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  });
}

// 3.3 D6-10: Xếp Khối (Tower Stacking) (C2.CON.04, C2.GEO.02) — 10 levels
function createD610Levels(): ContentSeed<unknown, unknown>[] {
  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[(i + 2) % THEMES.length] ?? "home";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange4to6(i);
    const accessTier = getAccessTier(i, 2);
    const skillCode = i < 5 ? "C2.CON.04" : "C2.GEO.02";

    const anchors = [
      {
        anchor_id: "anc_bottom",
        x: 480,
        y: 380,
        accepted_part_id: "p_base",
        label: "Đế tháp",
      },
      {
        anchor_id: "anc_middle",
        x: 480,
        y: 260,
        accepted_part_id: "p_mid",
        label: "Thân tháp",
      },
      {
        anchor_id: "anc_top",
        x: 480,
        y: 140,
        accepted_part_id: "p_top",
        label: "Đỉnh tháp",
      },
    ];

    const parts = [
      {
        part_id: "p_base",
        target_anchor_id: "anc_bottom",
        asset: { kind: "emoji" as const, ref: "🟦" },
        name: "Khối đế lớn",
      },
      {
        part_id: "p_mid",
        target_anchor_id: "anc_middle",
        asset: { kind: "emoji" as const, ref: "🔷" },
        name: "Khối thân vừa",
      },
      {
        part_id: "p_top",
        target_anchor_id: "anc_top",
        asset: { kind: "emoji" as const, ref: "🔺" },
        name: "Khối chóp nhỏ",
      },
    ];

    return {
      header: {
        code: `GL-C2-TOW-STK-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D6-10",
        content_version: 1,
        template_code: "GT-023",
        title: `Xếp chồng tháp khối màn ${idx}`,
        instruction: "Bé hãy xếp các khối từ dưới lên nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["size"],
        thinking_tags: ["sort", "compare"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: "Bé hãy xếp các khối để tạo thành một tòa tháp cao nhé!",
        target_model: {
          name: "Tháp khối",
          asset: { kind: "emoji" as const, ref: "🏠" },
        },
        anchors,
        parts,
      },
      difficulty_params: {
        snap_radius_px: 60,
        show_anchor_outline: true,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  });
}

// ==========================================
// 4. GT-019: XOAY VÀ LẬT MẢNH (Age 4-6)
// ==========================================

// 4.1 D2-04: Xoay Mảnh ghép (C2.ORI.01, C2.ROT.04) — 10 levels
function createD204Levels(): ContentSeed<unknown, unknown>[] {
  const shapes = ["✏️", "✈️", "🐟", "🚗", "🚀", "⛵", "🔧", "🔨", "🔑", "🌂"];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "art";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange4to6(i);
    const accessTier = getAccessTier(i, 0);
    const ref = shapes[i % shapes.length] ?? "✏️";
    const skillCode = i < 5 ? "C2.ORI.01" : "C2.ROT.04";

    const targetSlots = [
      {
        slot_id: "target_slot_1",
        target_rotation: 0 as const,
        target_flip: "none" as const,
        asset: { kind: "emoji" as const, ref },
      },
    ];

    const pieces = [
      {
        piece_id: "piece_1",
        initial_rotation: 90 as const,
        initial_flip: "none" as const,
        target_slot_id: "target_slot_1",
        asset: { kind: "emoji" as const, ref },
      },
    ];

    return {
      header: {
        code: `GL-C2-ROT-SHP-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D2-04",
        content_version: 1,
        template_code: "GT-019",
        title: `Xoay mảnh ghép đúng hướng màn ${idx}`,
        instruction: "Bé hãy xoay mảnh ghép cho khớp vị trí nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["spt"],
        thinking_tags: ["shift", "observe"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: "Bé hãy xoay hình để khớp với bóng mờ nhé!",
        target_slots: targetSlots,
        pieces,
      },
      difficulty_params: {
        allow_flip: false,
        rotation_step: 90 as const,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  });
}

// 4.2 D2-10: Lật hình (Reflection) (C2.MIR.01, C2.MIR.02) — 10 levels
function createD210Levels(): ContentSeed<unknown, unknown>[] {
  const asymmetricShapes = [
    "🖐️",
    "🫲",
    "🦶",
    "👂",
    "🤏",
    "👋",
    "✋",
    "🤙",
    "✌️",
    "🫱",
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[(i + 1) % THEMES.length] ?? "animal";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange4to6(i);
    const accessTier = getAccessTier(i, 1);
    const ref = asymmetricShapes[i % asymmetricShapes.length] ?? "🖐️";
    const skillCode = i < 5 ? "C2.MIR.01" : "C2.MIR.02";

    // Target yêu cầu lật ngang (horizontal flip) — bắt buộc lật mới giải được, xoay không giải được
    const targetSlots = [
      {
        slot_id: "target_slot_1",
        target_rotation: 0 as const,
        target_flip: "horizontal" as const,
        asset: { kind: "emoji" as const, ref },
      },
    ];

    const pieces = [
      {
        piece_id: "piece_1",
        initial_rotation: 0 as const,
        initial_flip: "none" as const,
        target_slot_id: "target_slot_1",
        asset: { kind: "emoji" as const, ref },
      },
    ];

    return {
      header: {
        code: `GL-C2-FLI-SHP-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D2-10",
        content_version: 1,
        template_code: "GT-019",
        title: `Lật hình gương đối xứng màn ${idx}`,
        instruction: "Bé hãy lật hình cho khớp bóng gương nhé!",
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["spt"],
        thinking_tags: ["shift", "observe"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: "Bé hãy lật hình để tạo đối xứng qua gương nhé!",
        target_slots: targetSlots,
        pieces,
      },
      difficulty_params: {
        allow_flip: true,
        rotation_step: 90 as const,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  });
}

// ==========================================
// 5. GT-022: TÌM VẬT THỂ ẨN (Age 4-6)
// ==========================================

const DEFAULT_HIDDEN_SHAPE = {
  targetRef: "🔺",
  name: "hình tam giác",
  backgroundRefs: ["🟦", "🟡", "⭐"],
};

// 5.1 D2-08: Tìm hình Ẩn (Hình trong hình) (C4.VIS.01, C4.VIS.02) — 10 levels
function createD208Levels(): ContentSeed<unknown, unknown>[] {
  const hiddenShapes = [
    DEFAULT_HIDDEN_SHAPE,
    {
      targetRef: "🟦",
      name: "hình vuông",
      backgroundRefs: ["🔺", "🟡", "🔷"],
    },
    {
      targetRef: "🟡",
      name: "hình tròn",
      backgroundRefs: ["🟦", "🔺", "⭐"],
    },
    {
      targetRef: "⭐",
      name: "ngôi sao",
      backgroundRefs: ["🟡", "🟦", "❤️"],
    },
    {
      targetRef: "🔷",
      name: "hình thoi",
      backgroundRefs: ["🟦", "🔺", "🟡"],
    },
    {
      targetRef: "🔺",
      name: "hình tam giác nhỏ",
      backgroundRefs: ["🌻", "🌳", "🏠"],
    },
    {
      targetRef: "🟡",
      name: "hình tròn vàng",
      backgroundRefs: ["☀️", "🌙", "⭐"],
    },
    {
      targetRef: "🟦",
      name: "hình vuông xanh",
      backgroundRefs: ["🚪", "🛏️", "🪑"],
    },
    {
      targetRef: "⭐",
      name: "ngôi sao bí mật",
      backgroundRefs: ["❤️", "☀️", "🌈"],
    },
    {
      targetRef: "❤️",
      name: "hình trái tim",
      backgroundRefs: ["⭐", "🎈", "🎁"],
    },
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[i % THEMES.length] ?? "art";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange4to6(i);
    const accessTier = getAccessTier(i, 0);
    const item = hiddenShapes[i % hiddenShapes.length] ?? DEFAULT_HIDDEN_SHAPE;
    const skillCode = i < 5 ? "C4.VIS.01" : "C4.VIS.02";

    const sceneObjects = [
      {
        id: "obj_target",
        asset: { kind: "emoji" as const, ref: item.targetRef },
        is_target: true,
        is_hidden: true,
        x: 450,
        y: 240,
      },
      ...item.backgroundRefs.map((ref, bIdx) => ({
        id: `obj_bg_${bIdx + 1}`,
        asset: { kind: "emoji" as const, ref },
        is_target: false,
        is_hidden: false,
        x: 200 + bIdx * 200,
        y: 150 + (bIdx % 2) * 180,
      })),
    ];

    return {
      header: {
        code: `GL-C4-HID-SHP-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D2-08",
        content_version: 1,
        template_code: "GT-022",
        title: `Tìm hình ẩn lồng ghép màn ${idx}`,
        instruction: `Bé hãy tìm ${item.name} trong tranh nhé!`,
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["geometry"],
        thinking_tags: ["observe", "infer"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: `Bé hãy tìm ${item.name} đang ẩn giấu nhé!`,
        target_description: `Tìm ${item.name}`,
        scene_objects: sceneObjects,
      },
      difficulty_params: {
        hint_after_ms: 8000,
        allow_retry: true,
        show_target_counter: true,
      },
    };
  });
}

const DEFAULT_SCENE_ITEM = {
  targetRef: "🐦",
  name: "chú chim nhỏ",
  bgRefs: ["🌳", "🌱", "🌻", "🌷"],
};

// 5.2 D6-06: Tìm Mẫu vật Ẩn (Vật trong cảnh nhiều vật) (C4.VIS.04, C4.DET.01) — 10 levels
function createD606Levels(): ContentSeed<unknown, unknown>[] {
  const sceneItems = [
    DEFAULT_SCENE_ITEM,
    {
      targetRef: "🐟",
      name: "chú cá nhỏ",
      bgRefs: ["🌊", "🐳", "🐬", "⛵"],
    },
    {
      targetRef: "🐰",
      name: "chú thỏ trắng",
      bgRefs: ["🥕", "🌳", "🌱", "🌻"],
    },
    {
      targetRef: "🐱",
      name: "bạn mèo con",
      bgRefs: ["🪑", "🛏️", "🚪", "🏠"],
    },
    {
      targetRef: "🍎",
      name: "quả táo đỏ",
      bgRefs: ["🌳", "🌱", "🌷", "🌻"],
    },
    {
      targetRef: "🚗",
      name: "chiếc xe ô tô",
      bgRefs: ["🚌", "🚲", "✈️", "🚁"],
    },
    {
      targetRef: "✏️",
      name: "chiếc bút chì",
      bgRefs: ["📖", "🎨", "🎒", "🏫"],
    },
    {
      targetRef: "🍬",
      name: "viên kẹo ngọt",
      bgRefs: ["🍰", "🍦", "🍪", "🍿"],
    },
    {
      targetRef: "🎁",
      name: "hộp quà bí mật",
      bgRefs: ["🎈", "🎉", "🍰", "⭐"],
    },
    {
      targetRef: "🦋",
      name: "chú bướm xinh",
      bgRefs: ["🌷", "🌻", "🌳", "🌱"],
    },
  ];

  return Array.from({ length: 10 }, (_, i) => {
    const idx = i + 1;
    const theme = THEMES[(i + 1) % THEMES.length] ?? "nature";
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3;
    const [ageMin, ageMax] = getAgeRange4to6(i);
    const accessTier = getAccessTier(i, 1);
    const scene = sceneItems[i % sceneItems.length] ?? DEFAULT_SCENE_ITEM;
    const skillCode = i < 5 ? "C4.VIS.04" : "C4.DET.01";

    const sceneObjects = [
      {
        id: "target_item",
        asset: { kind: "emoji" as const, ref: scene.targetRef },
        is_target: true,
        is_hidden: false,
        x: 480,
        y: 260,
      },
      ...scene.bgRefs.map((ref, bIdx) => ({
        id: `bg_item_${bIdx + 1}`,
        asset: { kind: "emoji" as const, ref },
        is_target: false,
        is_hidden: false,
        x: 180 + bIdx * 180,
        y: 140 + (bIdx % 2) * 200,
      })),
    ];

    return {
      header: {
        code: `GL-C4-HID-OBJ-${String(idx).padStart(4, "0")}`,
        legacy_v1_ref: "D6-06",
        content_version: 1,
        template_code: "GT-022",
        title: `Tìm mẫu vật ẩn trong khung cảnh màn ${idx}`,
        instruction: `Bé hãy tìm ${scene.name} trong bức tranh nhé!`,
        age_min: ageMin,
        age_max: ageMax,
        difficulty,
        access_tier: accessTier,
        skill_codes: [skillCode],
        learning_objective_codes: [`LO-${skillCode}-01`],
        what_tags: ["category"],
        thinking_tags: ["observe", "match"],
        theme_tag: theme,
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {
        prompt: `Bé hãy tìm ${scene.name} đang ở đâu trong khung cảnh nhé!`,
        target_description: `Tìm ${scene.name}`,
        scene_objects: sceneObjects,
      },
      difficulty_params: {
        hint_after_ms: 8000,
        allow_retry: true,
        show_target_counter: true,
      },
    };
  });
}

export const MID_LOAD_BACKFILL_LEVELS: ContentSeed<unknown, unknown>[] = [
  ...createD106Levels(),
  ...createD107Levels(),
  ...createD113Levels(),
  ...createD304Levels(),
  ...createD308Levels(),
  ...createD609Levels(),
  ...createD202Levels(),
  ...createD207Levels(),
  ...createD610Levels(),
  ...createD204Levels(),
  ...createD210Levels(),
  ...createD208Levels(),
  ...createD606Levels(),
];
