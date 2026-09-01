/**
 * Registry 60 game type v1 (D1-01..D6-11) ánh xạ sang v2 (C1-01..C6-03).
 * Nguồn sự thật: docs/taxonomy/game-type-migration.md & docs/tasks/168-v1-game-list-integration-spec.md.
 * Spec sở hữu: docs/specs/08-quality/legacy-v1-coverage.md.
 */

export interface LegacyV1GameType {
  readonly legacy_id: string; // D1-01..D6-11
  readonly competency_id: string; // C1-01..C6-03
  readonly name_vi: string;
  readonly template_code: string; // GT-001..GT-036
  readonly primary_skills: readonly string[];
}

export const LEGACY_V1_GAME_TYPES: readonly LegacyV1GameType[] = [
  // C1 — Mathematical Thinking (22)
  {
    legacy_id: "D1-01",
    competency_id: "C1-01",
    name_vi: "Đếm & Kéo vào Rổ",
    template_code: "GT-003",
    primary_skills: ["C1.CNT.01"],
  },
  {
    legacy_id: "D1-02",
    competency_id: "C1-02",
    name_vi: "Tương ứng 1-1",
    template_code: "GT-005",
    primary_skills: ["C1.OTO.01"],
  },
  {
    legacy_id: "D1-03",
    competency_id: "C1-03",
    name_vi: "So sánh Nhiều/Ít",
    template_code: "GT-001",
    primary_skills: ["C1.CMP.04", "C1.CMP.05"],
  },
  {
    legacy_id: "D1-04",
    competency_id: "C1-04",
    name_vi: "Nhận diện Chữ số",
    template_code: "GT-003",
    primary_skills: ["C1.NREC.02"],
  },
  {
    legacy_id: "D1-05",
    competency_id: "C1-05",
    name_vi: "Chuỗi Số Đặt đúng",
    template_code: "GT-008",
    primary_skills: ["C1.NREC.09"],
  },
  {
    legacy_id: "D1-06",
    competency_id: "C1-06",
    name_vi: "Flash Đếm Nhanh (Subitizing)",
    template_code: "GT-012",
    primary_skills: ["C1.CNT.11"],
  },
  {
    legacy_id: "D1-07",
    competency_id: "C1-07",
    name_vi: "Đoán Nhanh Chấm (Dot Flash)",
    template_code: "GT-012",
    primary_skills: ["C1.CNT.09"],
  },
  {
    legacy_id: "D1-08",
    competency_id: "C1-08",
    name_vi: "Ghép đôi Số-Chấm",
    template_code: "GT-005",
    primary_skills: ["C1.NREC.05"],
  },
  {
    legacy_id: "D1-09",
    competency_id: "C1-09",
    name_vi: "Đếm ngược",
    template_code: "GT-006",
    primary_skills: ["C1.CNT.04"],
  },
  {
    legacy_id: "D1-10",
    competency_id: "C1-10",
    name_vi: "Đếm Nhảy cóc",
    template_code: "GT-028",
    primary_skills: ["C1.CNT.05"],
  },
  {
    legacy_id: "D1-11",
    competency_id: "C1-11",
    name_vi: "Số Đang Trốn",
    template_code: "GT-001",
    primary_skills: ["C1.NREC.12"],
  },
  {
    legacy_id: "D1-12",
    competency_id: "C1-12",
    name_vi: "Phép trừ Trực quan",
    template_code: "GT-029",
    primary_skills: ["C1.SUB.01"],
  },
  {
    legacy_id: "D5-01",
    competency_id: "C1-13",
    name_vi: "So sánh Kích thước",
    template_code: "GT-001",
    primary_skills: ["C1.CMP.01", "C1.MEAS.01"],
  },
  {
    legacy_id: "D5-02",
    competency_id: "C1-14",
    name_vi: "So sánh Cao/Thấp",
    template_code: "GT-001",
    primary_skills: ["C1.MEAS.02"],
  },
  {
    legacy_id: "D5-03",
    competency_id: "C1-15",
    name_vi: "So sánh Nặng/Nhẹ (Cân)",
    template_code: "GT-014",
    primary_skills: ["C1.MEAS.03"],
  },
  {
    legacy_id: "D5-04",
    competency_id: "C1-16",
    name_vi: "Đo bằng Đơn vị phi chuẩn",
    template_code: "GT-030",
    primary_skills: ["C1.MEAS.08"],
  },
  {
    legacy_id: "D5-05",
    competency_id: "C1-17",
    name_vi: "Đo bằng Thước",
    template_code: "GT-008",
    primary_skills: ["C1.MEAS.09"],
  },
  {
    legacy_id: "D5-06",
    competency_id: "C1-18",
    name_vi: "Sắp xếp Trật tự kích thước",
    template_code: "GT-006",
    primary_skills: ["C1.MEAS.15"],
  },
  {
    legacy_id: "D5-07",
    competency_id: "C1-19",
    name_vi: "Thời gian: Trước/Sau",
    template_code: "GT-006",
    primary_skills: ["C1.MEAS.10"],
  },
  {
    legacy_id: "D5-08",
    competency_id: "C1-20",
    name_vi: "Thời gian: Đồng hồ",
    template_code: "GT-016",
    primary_skills: ["C1.MEAS.13"],
  },
  {
    legacy_id: "D5-09",
    competency_id: "C1-21",
    name_vi: "Nhiều/Ít chất lỏng",
    template_code: "GT-032",
    primary_skills: ["C1.MEAS.05"],
  },
  {
    legacy_id: "D5-10",
    competency_id: "C1-22",
    name_vi: "Tiền xu đơn giản",
    template_code: "GT-031",
    primary_skills: ["C1.MEAS.14"],
  },

  // C2 — Spatial Thinking (11)
  {
    legacy_id: "D2-01",
    competency_id: "C2-01",
    name_vi: "Ghép hình vào Lỗ",
    template_code: "GT-008",
    primary_skills: ["C2.GEO.01", "C2.CON.01"],
  },
  {
    legacy_id: "D2-02",
    competency_id: "C2-02",
    name_vi: "Tangram Ghép hình",
    template_code: "GT-023",
    primary_skills: ["C2.CON.02"],
  },
  {
    legacy_id: "D2-03",
    competency_id: "C2-03",
    name_vi: "Đối xứng Gương",
    template_code: "GT-021",
    primary_skills: ["C2.MIR.01"],
  },
  {
    legacy_id: "D2-04",
    competency_id: "C2-04",
    name_vi: "Xoay Mảnh ghép",
    template_code: "GT-019",
    primary_skills: ["C2.ROT.01"],
  },
  {
    legacy_id: "D2-05",
    competency_id: "C2-05",
    name_vi: "Phân loại Hình",
    template_code: "GT-003",
    primary_skills: ["C3.CLS.02", "C2.GEO.04"],
  },
  {
    legacy_id: "D2-06",
    competency_id: "C2-06",
    name_vi: "Hình 3D → 2D",
    template_code: "GT-001",
    primary_skills: ["C2.PER.03"],
  },
  {
    legacy_id: "D2-07",
    competency_id: "C2-07",
    name_vi: "Lắp ghép Robot/Nhà",
    template_code: "GT-023",
    primary_skills: ["C2.CON.03"],
  },
  {
    legacy_id: "D2-09",
    competency_id: "C2-08",
    name_vi: "Vẽ theo Nét chấm",
    template_code: "GT-024",
    primary_skills: ["C1.NREC.08", "C2.GEO.01"],
  },
  {
    legacy_id: "D2-10",
    competency_id: "C2-09",
    name_vi: "Lật hình (Reflection)",
    template_code: "GT-019",
    primary_skills: ["C2.MIR.02"],
  },
  {
    legacy_id: "D6-01",
    competency_id: "C2-10",
    name_vi: "Mê cung Đơn giản",
    template_code: "GT-013",
    primary_skills: ["C2.MAZ.01"],
  },
  {
    legacy_id: "D6-10",
    competency_id: "C2-11",
    name_vi: "Xếp Khối (Tower Stacking)",
    template_code: "GT-023",
    primary_skills: ["C2.CON.04"],
  },

  // C3 — Logical Thinking (20)
  {
    legacy_id: "D3-01",
    competency_id: "C3-01",
    name_vi: "Tiếp nối Quy luật Màu",
    template_code: "GT-008",
    primary_skills: ["C1.PAT.10", "C3.RULE.02"],
  },
  {
    legacy_id: "D3-02",
    competency_id: "C3-02",
    name_vi: "Điền Chỗ trống trong Chuỗi",
    template_code: "GT-008",
    primary_skills: ["C3.RULE.02"],
  },
  {
    legacy_id: "D3-03",
    competency_id: "C3-03",
    name_vi: "Sắp xếp Thứ tự (Seriation)",
    template_code: "GT-006",
    primary_skills: ["C3.SRT.01"],
  },
  {
    legacy_id: "D3-04",
    competency_id: "C3-04",
    name_vi: "Quy luật Âm thanh (Nghe-Tap)",
    template_code: "GT-018",
    primary_skills: ["C1.PAT.01", "C4.MEM.04"],
  },
  {
    legacy_id: "D3-05",
    competency_id: "C3-05",
    name_vi: "Tự Tạo Quy luật",
    template_code: "GT-036",
    primary_skills: ["C3.RULE.02"],
  },
  {
    legacy_id: "D3-06",
    competency_id: "C3-06",
    name_vi: "Tạo Nhịp (Beat Maker)",
    template_code: "GT-034",
    primary_skills: ["C1.PAT.01"],
  },
  {
    legacy_id: "D3-07",
    competency_id: "C3-07",
    name_vi: "Dệt Hoa văn (Weaving)",
    template_code: "GT-033",
    primary_skills: ["C1.PAT.05"],
  },
  {
    legacy_id: "D3-08",
    competency_id: "C3-08",
    name_vi: "Chạm Nhạc cụ (Tap Pattern)",
    template_code: "GT-018",
    primary_skills: ["C4.MEM.04"],
  },
  {
    legacy_id: "D4-01",
    competency_id: "C3-09",
    name_vi: "Phân nhóm theo Màu",
    template_code: "GT-003",
    primary_skills: ["C3.CLS.01"],
  },
  {
    legacy_id: "D4-02",
    competency_id: "C3-10",
    name_vi: "Phân nhóm theo Hình",
    template_code: "GT-003",
    primary_skills: ["C3.CLS.02"],
  },
  {
    legacy_id: "D4-03",
    competency_id: "C3-11",
    name_vi: "Phân nhóm theo Kích thước",
    template_code: "GT-003",
    primary_skills: ["C3.CLS.03"],
  },
  {
    legacy_id: "D4-04",
    competency_id: "C3-12",
    name_vi: "Phân nhóm Đa thuộc tính",
    template_code: "GT-003",
    primary_skills: ["C3.CLS.06"],
  },
  {
    legacy_id: "D4-05",
    competency_id: "C3-13",
    name_vi: "Tìm Kẻ lạ (Odd One Out)",
    template_code: "GT-001",
    primary_skills: ["C3.DED.01"],
  },
  {
    legacy_id: "D4-06",
    competency_id: "C3-14",
    name_vi: "Sắp xếp Thứ tự",
    template_code: "GT-006",
    primary_skills: ["C3.SRT.02"],
  },
  {
    legacy_id: "D4-07",
    competency_id: "C3-15",
    name_vi: "Thuộc về / Không thuộc",
    template_code: "GT-001",
    primary_skills: ["C3.CLS.04"],
  },
  {
    legacy_id: "D4-08",
    competency_id: "C3-16",
    name_vi: "Phân loại Đời thực",
    template_code: "GT-003",
    primary_skills: ["C3.CLS.04"],
  },
  {
    legacy_id: "D6-02",
    competency_id: "C3-17",
    name_vi: "Sudoku Hình (2×2, 3×3)",
    template_code: "GT-015",
    primary_skills: ["C3.MTX.01", "C3.MTX.02"],
  },
  {
    legacy_id: "D6-03",
    competency_id: "C3-18",
    name_vi: "Nhân-Quả",
    template_code: "GT-005",
    primary_skills: ["C3.INF.03", "C5.STO.04"],
  },
  {
    legacy_id: "D6-07",
    competency_id: "C3-19",
    name_vi: "Thám Tử Logic (Logic Grid)",
    template_code: "GT-009",
    primary_skills: ["C3.DED.01", "C3.DED.02"],
  },
  {
    legacy_id: "D6-08",
    competency_id: "C3-20",
    name_vi: "Cân bằng Phương trình Hình",
    template_code: "GT-014",
    primary_skills: ["C1.NCOMP.11", "C3.DED.02"],
  },

  // C4 — Observation Thinking (3)
  {
    legacy_id: "D2-08",
    competency_id: "C4-01",
    name_vi: "Tìm hình Ẩn",
    template_code: "GT-022",
    primary_skills: ["C4.VIS.03"],
  },
  {
    legacy_id: "D6-04",
    competency_id: "C4-02",
    name_vi: "Hoàn thiện Bức tranh",
    template_code: "GT-008",
    primary_skills: ["C4.VIS.04", "C3.INF.01"],
  },
  {
    legacy_id: "D6-06",
    competency_id: "C4-03",
    name_vi: "Tìm Mẫu vật Ẩn",
    template_code: "GT-022",
    primary_skills: ["C4.VIS.03"],
  },

  // C5 — Language Thinking (1)
  {
    legacy_id: "D6-09",
    competency_id: "C5-01",
    name_vi: "Bài toán Có lời văn (Audio)",
    template_code: "GT-018",
    primary_skills: ["C5.LIS.03", "C1.PROB.06"],
  },

  // C6 — Executive Function (3)
  {
    legacy_id: "D1-13",
    competency_id: "C6-01",
    name_vi: "Ghi Nhớ (Flash Memory)",
    template_code: "GT-012",
    primary_skills: ["C6.WM.04"],
  },
  {
    legacy_id: "D6-05",
    competency_id: "C6-02",
    name_vi: "Code Đường đi (Unplugged)",
    template_code: "GT-035",
    primary_skills: ["C6.PLN.01"],
  },
  {
    legacy_id: "D6-11",
    competency_id: "C6-03",
    name_vi: "Đối Ứng Vị Trí (Memory Grid)",
    template_code: "GT-020",
    primary_skills: ["C6.WM.03"],
  },
] as const;

export const LEGACY_V1_ID_SET = new Set(
  LEGACY_V1_GAME_TYPES.map((t) => t.legacy_id)
);

export const LEGACY_V1_MAP = new Map(
  LEGACY_V1_GAME_TYPES.map((t) => [t.legacy_id, t])
);

export function getLegacyV1GameType(
  legacyId: string
): LegacyV1GameType | undefined {
  return LEGACY_V1_MAP.get(legacyId);
}

export function isValidLegacyV1Ref(ref: string): boolean {
  return LEGACY_V1_ID_SET.has(ref);
}
