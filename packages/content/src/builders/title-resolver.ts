export interface ThemeSubjectNoun {
  readonly pluralNoun: string;
  readonly contextLabel: string;
  readonly vnChildhoodSetting?: string;
}

export const THEME_SUBJECT_NOUNS: Readonly<Record<string, ThemeSubjectNoun>> = {
  farm: {
    pluralNoun: "con vật nông trại",
    contextLabel: "Nông trại",
    vnChildhoodSetting: "Sân rơm nông trại",
  },
  food: {
    pluralNoun: "các loại quả",
    contextLabel: "Hoa quả",
    vnChildhoodSetting: "Vườn quả quê em",
  },
  vehicle: {
    pluralNoun: "phương tiện giao thông",
    contextLabel: "Giao thông",
    vnChildhoodSetting: "Chuyến tàu tuổi thơ",
  },
  school: {
    pluralNoun: "đồ dùng học tập",
    contextLabel: "Trường học",
    vnChildhoodSetting: "Lớp mầm non tre xanh",
  },
  home: {
    pluralNoun: "đồ dùng gia đình",
    contextLabel: "Gia đình",
    vnChildhoodSetting: "Góc bếp ấm áp",
  },
  family: {
    pluralNoun: "đồ dùng gia đình",
    contextLabel: "Gia đình",
    vnChildhoodSetting: "Mái ấm sum vầy",
  },
  animal: {
    pluralNoun: "các loài động vật",
    contextLabel: "Động vật",
    vnChildhoodSetting: "Bạn nhỏ quanh vườn",
  },
  ocean: {
    pluralNoun: "sinh vật biển",
    contextLabel: "Đại dương",
    vnChildhoodSetting: "Biển xanh rì rào",
  },
  nature: {
    pluralNoun: "hoa lá thiên nhiên",
    contextLabel: "Thiên nhiên",
    vnChildhoodSetting: "Khu vườn bốn mùa",
  },
  garden: {
    pluralNoun: "côn trùng và hoa lá",
    contextLabel: "Vườn cây",
    vnChildhoodSetting: "Vườn hoa nắng sớm",
  },
  market: {
    pluralNoun: "hàng hóa đi chợ",
    contextLabel: "Đi chợ",
    vnChildhoodSetting: "Phiên chợ quê vui",
  },
  body: {
    pluralNoun: "bộ phận cơ thể",
    contextLabel: "Bản thân",
    vnChildhoodSetting: "Đôi bàn tay xinh",
  },
  weather: {
    pluralNoun: "hiện tượng thời tiết",
    contextLabel: "Thời tiết & Mùa",
    vnChildhoodSetting: "Nắng ấm mưa rào",
  },
  festival: {
    pluralNoun: "đồ vật lễ hội",
    contextLabel: "Lễ hội & Tết",
    vnChildhoodSetting: "Đêm hội trăng rằm",
  },
  job: {
    pluralNoun: "dụng cụ nghề nghiệp",
    contextLabel: "Nghề nghiệp",
    vnChildhoodSetting: "Góc nghề quanh bé",
  },
  homeland: {
    pluralNoun: "hình ảnh quê hương",
    contextLabel: "Quê hương",
    vnChildhoodSetting: "Cánh diều quê hương",
  },
  art: {
    pluralNoun: "sắc màu nghệ thuật",
    contextLabel: "Nghệ thuật",
    vnChildhoodSetting: "Góc khéo tay hay làm",
  },
  fairytale: {
    pluralNoun: "nhân vật cổ tích",
    contextLabel: "Thế giới cổ tích",
    vnChildhoodSetting: "Vườn cổ tích Việt",
  },
  space: {
    pluralNoun: "hành tinh vũ trụ",
    contextLabel: "Vũ trụ",
    vnChildhoodSetting: "Bầu trời đêm sao",
  },
  sport: {
    pluralNoun: "dụng cụ thể thao",
    contextLabel: "Thể thao",
    vnChildhoodSetting: "Sân chơi vận động",
  },
  music: {
    pluralNoun: "nhạc cụ và âm thanh",
    contextLabel: "Âm nhạc",
    vnChildhoodSetting: "Nhịp trống đồng dao",
  },
  railway: {
    pluralNoun: "toa tàu và đường ray",
    contextLabel: "Đường ray",
    vnChildhoodSetting: "Đoàn tàu xình xịch",
  },
  town: {
    pluralNoun: "công trình phố xá",
    contextLabel: "Phố xá",
    vnChildhoodSetting: "Phố phường nhộn nhịp",
  },
};

export function resolveThemeChildhoodSetting(themeCode: string): string {
  const info = THEME_SUBJECT_NOUNS[themeCode];
  return info?.vnChildhoodSetting ?? info?.contextLabel ?? "Góc chơi của bé";
}

const SIMPLE_COMPARISON_SKILLS = new Set<string>([
  "Lớn hơn",
  "Nhỏ hơn",
  "Nhiều hơn",
  "Ít hơn",
  "Bằng nhau",
  "Dài hơn",
  "Ngắn hơn",
  "Cao hơn",
  "Thấp hơn",
  "Nặng hơn",
  "Nhẹ hơn",
  "Xa hơn",
  "Gần hơn",
  "Nhanh hơn",
  "Chậm hơn",
]);

/** Thứ tự quan trọng: "bằng đồ vật" phải thay trước "đồ vật". */
const OBJECT_PLACEHOLDERS = ["bằng đồ vật", "đồ vật", "vật thể"] as const;

const DUPLICATE_SUFFIX_PREFIX = " · Bài";

function tryReplaceObjectPlaceholder(
  skillName: string,
  pluralNoun: string
): string | undefined {
  for (const placeholder of OBJECT_PLACEHOLDERS) {
    if (skillName.includes(placeholder)) {
      return skillName.replaceAll(placeholder, pluralNoun);
    }
  }
  return undefined;
}

function resolveSemanticTitle(
  skillName: string,
  themeInfo: ThemeSubjectNoun
): string {
  const replaced = tryReplaceObjectPlaceholder(skillName, themeInfo.pluralNoun);
  if (replaced) {
    return replaced;
  }

  if (skillName === "Đếm số lượng") {
    return `Đếm số lượng ${themeInfo.pluralNoun}`;
  }

  if (
    skillName.startsWith("So sánh to") ||
    skillName.startsWith("So sánh dài") ||
    skillName.startsWith("So sánh cao") ||
    skillName.startsWith("So sánh nhiều") ||
    skillName.startsWith("So sánh nặng") ||
    skillName.startsWith("Ghép cặp") ||
    skillName.startsWith("Ghép đôi") ||
    skillName.startsWith("Ghép hình")
  ) {
    return `${skillName} ${themeInfo.pluralNoun}`;
  }

  if (
    SIMPLE_COMPARISON_SKILLS.has(skillName) ||
    skillName.startsWith("Phân loại") ||
    skillName.startsWith("Tách") ||
    skillName.startsWith("Gộp")
  ) {
    return `${skillName}: ${themeInfo.contextLabel}`;
  }

  return `${skillName} — ${themeInfo.contextLabel}`;
}

/**
 * Tên màn chơi theo ngôn ngữ mầm non: tên kỹ năng + đối tượng hoặc nhãn chủ đề,
 * không lộ mã khuôn (GT-xxx) hay cấp độ thô (`BR-SDS-16`).
 */
export function resolveLevelTitle(
  skillName: string,
  themeCode: string
): string {
  const themeInfo = THEME_SUBJECT_NOUNS[themeCode];
  if (!themeInfo) {
    throw new Error(
      `[resolveLevelTitle] Theme "${themeCode}" chưa có nhãn trong THEME_SUBJECT_NOUNS (BR-SDS-16)`
    );
  }
  return resolveSemanticTitle(skillName, themeInfo);
}

/**
 * Tên trùng trong một kỹ năng được đánh số ` · Bài N` theo thứ tự xuất hiện,
 * nên tên duy nhất trong kỹ năng (`BR-SDS-16`). Tên không trùng giữ nguyên.
 */
export function numberDuplicateTitles(
  titles: readonly string[]
): readonly string[] {
  const totals = new Map<string, number>();
  for (const title of titles) {
    totals.set(title, (totals.get(title) ?? 0) + 1);
  }
  const seen = new Map<string, number>();
  return titles.map((title) => {
    if ((totals.get(title) ?? 0) < 2) {
      return title;
    }
    const position = (seen.get(title) ?? 0) + 1;
    seen.set(title, position);
    return `${title}${DUPLICATE_SUFFIX_PREFIX} ${position}`;
  });
}
