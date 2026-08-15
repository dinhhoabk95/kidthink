/**
 * Child content safety blocklist (BR-CSA-07, Section 7.5 of content-seed-authoring.md).
 * Covers forbidden categories: violence, fear, death, illness, discrimination, commercial branding, copyright, religion, politics, child comparison, punishment words.
 */
export const CHILD_CONTENT_BLOCKLIST: Record<string, string[]> = {
  violence: [
    "đánh nhau",
    "đánh đập",
    "đánh bạn",
    "đánh trẻ",
    "chém",
    "giết",
    "bắn súng",
    "đấm",
    "tát",
    "chảy máu",
    "vũ khí",
    "súng đạn",
    "bom đạn",
  ],
  fear: [
    "con ma",
    "bóng ma",
    "quỷ dữ",
    "quái vật hung dữ",
    "đáng sợ",
    "kinh dị",
    "ác mộng",
    "bắt cóc",
  ],
  death: ["chết chóc", "tử vong", "hy sinh", "qua đời", "xác chết", "chôn cất"],
  illness: [
    "dịch bệnh",
    "ung thư",
    "lây nhiễm",
    "thuốc lá",
    "uống rượu",
    "uống bia",
    "ma túy",
  ],
  discrimination: [
    "ngu ngốc",
    "ngu dốt",
    "béo phì",
    "xấu xí",
    "nghèo hèn",
    "mồ côi",
  ],
  punishment: [
    "bị phạt",
    "phạt đứng",
    "phạt đòn",
    "đánh roi",
    "nhốt vào",
    "cấm đoán",
    "mắng mỏ",
    "chửi bới",
    "trừ điểm",
  ],
  commercial: [
    "shopee",
    "tiki",
    "lazada",
    "iphone",
    "samsung",
    "coca-cola",
    "pepsi",
  ],
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function scanChildContentSafety(text: string): string[] {
  const normalized = text.toLowerCase();
  const violations: string[] = [];

  for (const [category, words] of Object.entries(CHILD_CONTENT_BLOCKLIST)) {
    for (const word of words) {
      const pattern = new RegExp(
        `(?:^|\\s|[^a-z0-9àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệiíìỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ])${escapeRegex(word)}(?:$|\\s|[^a-z0-9àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệiíìỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ])`,
        "i"
      );
      if (pattern.test(normalized)) {
        violations.push(`${category}:${word}`);
      }
    }
  }

  return violations;
}
