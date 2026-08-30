/**
 * Hạt giống level chưa diễn đạt được bằng 27 engine hiện có.
 *
 * Bối cảnh: `docs/tasks/162-seed-content-contract-migration-plan.md`.
 * Codemod của task đó đã chuyển 102 hạt về đúng contract. 73 hạt dưới đây
 * **không** chuyển được vì cơ chế chơi của chúng không có engine nào nhận:
 *
 * | Số | Cơ chế của nội dung | Vì sao không có engine |
 * | --- | --- | --- |
 * | 21 | so sánh hai nhóm nhiều/ít | `GT-014` đòi `tray` ≥ 2 vật để đặt; so sánh thuần không dùng khay |
 * | 21 | chọn phần tử tiếp theo của dãy | `GT-011` là ô vuông Latinh (hàng **và** cột cùng tập ký hiệu); dãy AB không thoả |
 * | 15 | tìm vật theo vị trí trên lưới 2 ô | `GT-022` đòi `scene_objects` ≥ 3 |
 * | 12 | nhìn chớp rồi chọn **tên** | `GT-012` chỉ nhận phương án là **số**; phương án ở đây là nhãn chữ, không có asset |
 * | 2 | chọn đĩa nhiều hơn | phương án là **nhóm** vật, `GT-001` chỉ nhận một asset cho mỗi phương án |
 * | 1 | nối hoạt động với giờ | `GT-016` chế độ `match` đòi ≥ 2 thẻ hoạt động, nội dung chỉ có 1 |
 * | 1 | ma trận xoay 2×2 | vi phạm quy luật ô vuông Latinh của `GT-011` |
 *
 * Cách gỡ là soạn lại nội dung hoặc thêm engine — không phải nới contract.
 * Danh sách này chỉ được **ngắn đi**; cổng
 * `packages/db/tests/gates/seed-quarantine.test.ts` chặn mọi lần dài thêm và
 * chặn cả mã đã hết lý do cách ly mà còn nằm lại.
 */
export const QUARANTINED_LEVEL_CODES: readonly string[] = [
  "GL-C1-CLK-HND-0039", // GT-016 · activity_cards,mode,options,prompt,target_time
  "GL-C1-CMP-CARD-0115", // GT-001 · options,scaffolding
  "GL-C1-CMP-CARD-0116", // GT-001 · options,scaffolding
  "GL-C1-CMP-NUM-0010", // GT-003 · left_group,right_group,target
  "GL-C1-CMP-NUM-0011", // GT-003 · left_group,right_group,target
  "GL-C1-CMP-NUM-0012", // GT-003 · left_group,right_group,target
  "GL-C1-CMP-NUM-0013", // GT-003 · left_group,right_group,target
  "GL-C1-PAT-SEQ-0121", // GT-006 · next_item,pattern_type,scaffolding,sequence
  "GL-C1-PAT-SEQ-0122", // GT-006 · next_item,pattern_type,scaffolding,sequence
  "GL-C1-POS-LOC-0017", // GT-005 · grid,target_id
  "GL-C1-POS-LOC-0018", // GT-005 · grid,target_id
  "GL-C1-SEQ-PAT-0014", // GT-004 · correct_option,options,sequence
  "GL-C1-SEQ-PAT-0015", // GT-004 · correct_option,options,sequence
  "GL-C1-SEQ-PAT-0016", // GT-004 · correct_option,options,sequence
  "GL-C2-CMP-SIZ-0008", // GT-003 · left_group,right_group,target
  "GL-C2-CMP-SIZ-0009", // GT-003 · left_group,right_group,target
  "GL-C2-CMP-SIZ-0017", // GT-003 · left_group,right_group,target
  "GL-C2-DIR-NAV-0010", // GT-005 · grid,target_id
  "GL-C2-DIR-NAV-0016", // GT-005 · grid,target_id
  "GL-C2-POS-LOC-0004", // GT-005 · grid,target_id
  "GL-C2-POS-LOC-0005", // GT-005 · grid,target_id
  "GL-C2-POS-LOC-0014", // GT-005 · grid,target_id
  "GL-C2-SEQ-PAT-0011", // GT-004 · correct_option,options,sequence
  "GL-C2-SEQ-PAT-0012", // GT-004 · correct_option,options,sequence
  "GL-C2-SEQ-PAT-0018", // GT-004 · correct_option,options,sequence
  "GL-C2-SUB-FAST-0013", // GT-006 · correct_answer,flash_duration_ms,flash_items,options
  "GL-C2-SUB-FAST-0019", // GT-006 · correct_answer,flash_duration_ms,flash_items,options
  "GL-C3-LOG-CMP-0008", // GT-003 · left_group,right_group,target
  "GL-C3-LOG-CMP-0009", // GT-003 · left_group,right_group,target
  "GL-C3-LOG-CMP-0015", // GT-003 · left_group,right_group,target
  "GL-C3-LOG-CMP-0020", // GT-003 · left_group,right_group,target
  "GL-C3-LOG-POS-0011", // GT-005 · grid,target_id
  "GL-C3-MAT-CHO-0026", // GT-011 · matrix,options,prompt
  "GL-C3-PAT-SEQ-0006", // GT-004 · correct_option,options,sequence
  "GL-C3-PAT-SEQ-0007", // GT-004 · correct_option,options,sequence
  "GL-C3-PAT-SEQ-0012", // GT-004 · correct_option,options,sequence
  "GL-C3-PAT-SEQ-0016", // GT-004 · correct_option,options,sequence
  "GL-C3-SUB-FAST-0013", // GT-006 · correct_answer,flash_duration_ms,flash_items,options
  "GL-C3-SUB-FAST-0018", // GT-006 · correct_answer,flash_duration_ms,flash_items,options
  "GL-C4-DIF-CMP-0007", // GT-003 · left_group,right_group,target
  "GL-C4-DIF-CMP-0013", // GT-003 · left_group,right_group,target
  "GL-C4-DIF-CMP-0017", // GT-003 · left_group,right_group,target
  "GL-C4-OBS-CARD-0003", // GT-003 · left_group,right_group,target
  "GL-C4-OBS-LOC-0005", // GT-005 · grid,target_id
  "GL-C4-OBS-LOC-0009", // GT-005 · grid,target_id
  "GL-C4-OBS-LOC-0016", // GT-005 · grid,target_id
  "GL-C4-SEQ-OBS-0006", // GT-004 · correct_option,options,sequence
  "GL-C4-SEQ-OBS-0012", // GT-004 · correct_option,options,sequence
  "GL-C4-SEQ-OBS-0018", // GT-004 · correct_option,options,sequence
  "GL-C4-SUB-FAST-0010", // GT-006 · correct_answer,flash_duration_ms,flash_items,options
  "GL-C4-SUB-FAST-0015", // GT-006 · correct_answer,flash_duration_ms,flash_items,options
  "GL-C4-SUB-FAST-0019", // GT-006 · correct_answer,flash_duration_ms,flash_items,options
  "GL-C5-EXP-CMP-0006", // GT-003 · left_group,right_group,target
  "GL-C5-EXP-CMP-0007", // GT-003 · left_group,right_group,target
  "GL-C5-EXP-CMP-0013", // GT-003 · left_group,right_group,target
  "GL-C5-EXP-CMP-0017", // GT-003 · left_group,right_group,target
  "GL-C5-SUB-FAST-0010", // GT-006 · correct_answer,flash_duration_ms,flash_items,options
  "GL-C5-SUB-FAST-0016", // GT-006 · correct_answer,flash_duration_ms,flash_items,options
  "GL-C5-SUB-FAST-0020", // GT-006 · correct_answer,flash_duration_ms,flash_items,options
  "GL-C5-VOC-LOC-0009", // GT-005 · grid,target_id
  "GL-C5-VOC-LOC-0015", // GT-005 · grid,target_id
  "GL-C5-VOC-SEQ-0008", // GT-004 · correct_option,options,sequence
  "GL-C5-VOC-SEQ-0014", // GT-004 · correct_option,options,sequence
  "GL-C5-VOC-SEQ-0019", // GT-004 · correct_option,options,sequence
  "GL-C6-ATT-LOC-0008", // GT-005 · grid,target_id
  "GL-C6-ATT-LOC-0014", // GT-005 · grid,target_id
  "GL-C6-MEM-CMP-0007", // GT-003 · left_group,right_group,target
  "GL-C6-MEM-CMP-0015", // GT-003 · left_group,right_group,target
  "GL-C6-MEM-SEQ-0006", // GT-004 · correct_option,options,sequence
  "GL-C6-MEM-SEQ-0012", // GT-004 · correct_option,options,sequence
  "GL-C6-MEM-SEQ-0017", // GT-004 · correct_option,options,sequence
  "GL-C6-SUB-FAST-0009", // GT-006 · correct_answer,flash_duration_ms,flash_items,options
  "GL-C6-SUB-FAST-0013", // GT-006 · correct_answer,flash_duration_ms,flash_items,options
];

export const QUARANTINED_LEVEL_SET: ReadonlySet<string> = new Set(
  QUARANTINED_LEVEL_CODES
);
