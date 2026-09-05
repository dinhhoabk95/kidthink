import { ALL_TEMPLATES } from "@mindkid/game-engine/registry";
import { describe, expect, it } from "vitest";
import {
  ALL_SEED_LEVELS,
  QUARANTINED_LEVEL_CODES,
  SHIPPABLE_SEED_LEVELS,
} from "#src/index";
import { INVALID_CONTRACT_FIXTURE } from "./fixtures/quarantine-negative.ts";

/**
 * Bậc thang cách ly nội dung — `docs/tasks/162-...-plan.md`.
 *
 * Một level không parse được `content_contract` là một trò chơi không dựng
 * được. Trước task 162, 175 hạt như vậy nằm im trong lô seed và làm cả lô
 * rollback; codemod chuyển 102, và 73 hạt còn lại đã được soạn lại nên trần
 * giờ là **0**. Phép đo này giữ hai bất biến:
 *
 * 1. Danh sách chỉ ngắn đi — không ai được thêm nội dung hỏng rồi cách ly nó.
 * 2. Mọi mã trong danh sách vẫn **thật sự** hỏng — mã đã sửa xong mà còn nằm
 *    lại là nội dung bị giấu khỏi người dùng mà không ai biết.
 */
const MAX_QUARANTINED = 0;

interface LevelLike {
  header: { code: string; template_code: string };
  content_pack: unknown;
  difficulty_params: unknown;
}

function isContractValid(level: LevelLike): boolean {
  const template = ALL_TEMPLATES[level.header.template_code];
  if (!template) {
    return false;
  }
  return (
    template.content_contract.safeParse(level.content_pack).success &&
    template.difficulty_contract.safeParse(level.difficulty_params).success
  );
}

describe("cách ly nội dung seed", () => {
  it("danh sách cách ly chỉ ngắn đi", () => {
    expect(QUARANTINED_LEVEL_CODES.length).toBeLessThanOrEqual(MAX_QUARANTINED);
  });

  it("không có mã trùng trong danh sách cách ly", () => {
    const unique = new Set(QUARANTINED_LEVEL_CODES);
    expect(unique.size).toBe(QUARANTINED_LEVEL_CODES.length);
  });

  it("mọi mã cách ly đều tồn tại trong corpus", () => {
    const corpus = new Set(ALL_SEED_LEVELS.map((level) => level.header.code));
    const missing = QUARANTINED_LEVEL_CODES.filter((code) => !corpus.has(code));
    expect(missing).toEqual([]);
  });

  it("mã đã sửa xong không được nằm lại trong danh sách cách ly", () => {
    const byCode = new Map(
      ALL_SEED_LEVELS.map((level) => [level.header.code, level])
    );
    const stale = QUARANTINED_LEVEL_CODES.filter((code) => {
      const level = byCode.get(code);
      return level ? isContractValid(level) : false;
    });
    expect(stale).toEqual([]);
  });

  it("tập gieo được không còn hạt nào trượt contract", () => {
    const broken = SHIPPABLE_SEED_LEVELS.filter(
      (level) => !isContractValid(level)
    ).map((level) => level.header.code);
    expect(broken).toEqual([]);
  });

  it("ca âm: một level sai contract bị phép đo bắt được", () => {
    expect(isContractValid(INVALID_CONTRACT_FIXTURE)).toBe(false);
  });
});
