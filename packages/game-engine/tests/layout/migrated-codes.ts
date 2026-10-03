/**
 * Engine đã dời vào khung năm vùng (Task #277 S4..S7, #283). Dời thêm engine
 * thì thêm mã vào đây và đổi cờ `usesPromptZone` của nó; mọi test khung theo
 * mã (`stage-engines.test.ts`, `prompt-single-source.test.ts`, gate
 * `zone-primitives-only`) đọc từ một nguồn này.
 */
export const MIGRATED_CODES: readonly string[] = [
  "GT-001",
  "GT-003",
  "GT-004",
  "GT-007",
  "GT-008",
  "GT-015",
  "GT-021",
  "GT-023",
  "GT-009",
  "GT-010",
  "GT-011",
  "GT-012",
  "GT-022",
  "GT-025",
  "GT-029",
  "GT-032",
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
