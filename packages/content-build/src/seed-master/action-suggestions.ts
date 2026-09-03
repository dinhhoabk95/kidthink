import { skillActionSuggestions, skills } from "@mindkid/db";
import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export interface SkillActionSeedItem {
  skillCode: string;
  orderNo: number;
  text: string;
  kind: "home_activity" | "in_app";
  refEntityId?: number;
}

export const ACTION_SUGGESTIONS_SEED_DATA: SkillActionSeedItem[] = [
  // C1: Mathematical Thinking
  {
    skillCode: "C1.CNT.01",
    orderNo: 1,
    text: "Cùng bé đếm 5 chiếc thìa hoặc cốc khi dọn bàn ăn gia đình.",
    kind: "home_activity",
  },
  {
    skillCode: "C1.CNT.01",
    orderNo: 2,
    text: "Trò chơi đếm hoa quả trong ứng dụng ở mức độ cơ bản.",
    kind: "in_app",
  },
  {
    skillCode: "C1.CNT.02",
    orderNo: 1,
    text: "Đố bé tìm và đếm các nhóm 3 chiếc cúc áo hoặc hạt cườm.",
    kind: "home_activity",
  },
  {
    skillCode: "C1.CNT.03",
    orderNo: 1,
    text: "Cùng bé vỗ tay theo nhịp từ 1 đến 5 khi nghe nhạc vui nhộn.",
    kind: "home_activity",
  },
  {
    skillCode: "C1.NUM.01",
    orderNo: 1,
    text: "Chỉ cho bé các chữ số trên bảng số nhà hoặc lịch treo tường.",
    kind: "home_activity",
  },
  {
    skillCode: "C1.CMP.01",
    orderNo: 1,
    text: "Cùng bé so sánh nhóm quả táo và nhóm quả cam xem đĩa nào nhiều hơn.",
    kind: "home_activity",
  },
  {
    skillCode: "C1.CAL.01",
    orderNo: 1,
    text: "Cho bé chia 4 chiếc bánh quy đều cho 2 bạn búp bê.",
    kind: "home_activity",
  },

  // C2: Spatial Thinking
  {
    skillCode: "C2.SHP.01",
    orderNo: 1,
    text: "Tìm các đồ vật có dạng hình tròn và hình vuông trong phòng khách.",
    kind: "home_activity",
  },
  {
    skillCode: "C2.POS.01",
    orderNo: 1,
    text: "Chơi trò trốn tìm đồ chơi: đồ vật ở trên bàn hay dưới ghế.",
    kind: "home_activity",
  },
  {
    skillCode: "C2.DIR.01",
    orderNo: 1,
    text: "Cùng bé bước đi theo chỉ dẫn: bước 2 bước sang phải, 1 bước sang trái.",
    kind: "home_activity",
  },

  // C3: Logical Thinking
  {
    skillCode: "C3.SRT.01",
    orderNo: 1,
    text: "Cùng bé phân loại tất theo màu sắc sau khi giặt đồ.",
    kind: "home_activity",
  },
  {
    skillCode: "C3.PAT.01",
    orderNo: 1,
    text: "Xếp các khối lego lặp lại theo quy luật: đỏ - xanh - đỏ - xanh.",
    kind: "home_activity",
  },
  {
    skillCode: "C3.RSN.01",
    orderNo: 1,
    text: "Hỏi bé xem chuyện gì xảy ra tiếp theo khi nhân vật trong truyện gặp trời mưa.",
    kind: "home_activity",
  },

  // C4: Observation Thinking
  {
    skillCode: "C4.DET.01",
    orderNo: 1,
    text: "Cùng bé tìm điểm khác nhau giữa hai bức tranh hoa quả tương tự nhau.",
    kind: "home_activity",
  },
  {
    skillCode: "C4.MEM.01",
    orderNo: 1,
    text: "Úp 3 chiếc cốc che đồ chơi và đố bé nhớ đồ chơi nằm ở cốc nào.",
    kind: "home_activity",
  },

  // C5: Language Thinking
  {
    skillCode: "C5.VOC.01",
    orderNo: 1,
    text: "Cùng bé gọi tên các loại rau củ khi đi chợ hoặc siêu thị.",
    kind: "home_activity",
  },
  {
    skillCode: "C5.STR.01",
    orderNo: 1,
    text: "Khuyến khích bé kể lại 2 chi tiết thú vị trong câu chuyện vừa nghe.",
    kind: "home_activity",
  },

  // C6: Executive Function
  {
    skillCode: "C6.FOC.01",
    orderNo: 1,
    text: "Tập cho bé tập trung hoàn thành bức tranh tô màu trong 5 phút yên tĩnh.",
    kind: "home_activity",
  },
  {
    skillCode: "C6.INH.01",
    orderNo: 1,
    text: "Chơi trò đèn xanh đèn đỏ: dừng lại khi nghe hiệu lệnh đỏ.",
    kind: "home_activity",
  },
];

export async function seedSkillActionSuggestions(
  db: NodePgDatabase<Record<string, unknown>>
): Promise<{ seededCount: number }> {
  const allSkills = await db
    .select({ id: skills.id, code: skills.code })
    .from(skills);
  const skillIdByCode = new Map(allSkills.map((s) => [s.code, Number(s.id)]));

  let count = 0;
  for (const item of ACTION_SUGGESTIONS_SEED_DATA) {
    const skillId = skillIdByCode.get(item.skillCode);
    if (!skillId) {
      continue;
    }

    await db
      .insert(skillActionSuggestions)
      .values({
        skillId,
        orderNo: item.orderNo,
        text: item.text,
        kind: item.kind,
        refEntityId: item.refEntityId,
        status: "published",
        origin: "human",
        authoredIn: "repo_seed",
      })
      .onConflictDoUpdate({
        target: [
          skillActionSuggestions.skillId,
          skillActionSuggestions.orderNo,
        ],
        set: {
          text: item.text,
          kind: item.kind,
          refEntityId: item.refEntityId,
          status: "published",
          updatedAt: sql`now()`,
        },
      });
    count++;
  }

  // Ensure default fallback home activity for all seeded skills without an explicit item
  for (const s of allSkills) {
    const skillId = Number(s.id);
    const hasSeed = ACTION_SUGGESTIONS_SEED_DATA.some(
      (d) => d.skillCode === s.code
    );
    if (!hasSeed) {
      await db
        .insert(skillActionSuggestions)
        .values({
          skillId,
          orderNo: 1,
          text: "Cùng bé tương tác qua các hoạt động đố vui thực tế đời thường tại nhà.",
          kind: "home_activity",
          status: "published",
          origin: "human",
          authoredIn: "repo_seed",
        })
        .onConflictDoNothing();
      count++;
    }
  }

  return { seededCount: count };
}
