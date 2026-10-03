/**
 * Engine đã dời vào khung năm vùng (Task #277 S4..S7, #283). Dời thêm engine
 * thì thêm mã vào đây và đổi cờ `usesPromptZone` của nó; mọi test khung theo
 * mã (`stage-engines.test.ts`, `prompt-single-source.test.ts`, gate
 * `zone-primitives-only`) đọc từ một nguồn này.
 */
export const MIGRATED_CODES: readonly string[] = [
  "GT-001",
  "GT-003",
  "GT-028",
  "GT-034",
  "GT-035",
  "GT-036",
  "GT-005",
  "GT-006",
  "GT-013",
  "GT-020",
  "GT-024",
];
