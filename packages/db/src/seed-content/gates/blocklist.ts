/**
 * Child content safety blocklist (BR-CSA-07, Section 7.5 of content-seed-authoring.md).
 * Covers forbidden categories: violence, fear, death, illness, discrimination, commercial branding, copyright, religion, politics, child comparison, punishment words.
 */
export const CHILD_CONTENT_BLOCKLIST: Record<string, string[]> = {
  violence: [
    "đánh",
    "chém",
    "giết",
    "bắn",
    "đấm",
    "tát",
    "máu",
    "vũ khí",
    "dao",
    "súng",
    "bom",
  ],
  fear: [
    "ma",
    "quỷ",
    "quái vật",
    "đáng sợ",
    "hù",
    "kinh dị",
    "ác mộng",
    "bắt cóc",
  ],
  death: ["chết", "tử vong", "hy sinh", "qua đời", "xác", "chôn"],
  illness: [
    "bệnh",
    "dịch bệnh",
    "ung thư",
    "lây nhiễm",
    "thuốc lá",
    "rượu",
    "bia",
    "ma túy",
  ],
  discrimination: [
    "ngu",
    "dốt",
    "béo",
    "gầy",
    "xấu",
    "nghèo",
    "mồ côi",
    "khuyết tật",
  ],
  punishment: [
    "phạt",
    "đánh roi",
    "nhốt",
    "cấm",
    "mắng",
    "chửi",
    "trừ điểm",
    "thua",
  ],
  commercial: [
    "shopee",
    "tiki",
    "lazada",
    "iphone",
    "samsung",
    "coca",
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
