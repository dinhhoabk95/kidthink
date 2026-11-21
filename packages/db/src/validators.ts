import { ValidationError } from "@mindkid/errors/common";
import {
  COMPETENCY_CODE_REGEX,
  GAME_LEVEL_CODE_REGEX,
  LEARNING_OBJECTIVE_CODE_REGEX,
  SKILL_CODE_REGEX,
  STRAND_CODE_REGEX,
} from "@mindkid/shared";

/**
 * Domain validators thay thế toàn bộ DB `CHECK` constraints (`BR-DM-14`).
 *
 * Giữ một nguồn kiểm tra duy nhất ở tầng TypeScript để vừa báo lỗi thân thiện
 * kèm mã chuẩn, vừa đổi quy tắc miền nghiệp vụ không cần khoá bảng `ALTER TABLE`.
 */

const CURRICULUM_DB_CODE_REGEX = /^CUR-[A-Za-z0-9_-]+$/;
const MAX_UINT32_SEED = 4_294_967_295;

export function assertChildBirthYear(birthYear: number): void {
  if (!Number.isInteger(birthYear) || birthYear < 2010 || birthYear > 2035) {
    throw new ValidationError(
      "Năm sinh của trẻ phải nằm trong khoảng 2010–2035."
    );
  }
}

export function assertCompetencyCode(code: string): void {
  if (!COMPETENCY_CODE_REGEX.test(code)) {
    throw new ValidationError(
      `Mã năng lực '${code}' không khớp định dạng C1..C6.`
    );
  }
}

export function assertStrandCode(code: string): void {
  if (!STRAND_CODE_REGEX.test(code)) {
    throw new ValidationError(
      `Mã mạch '${code}' không khớp định dạng C{1-6}.{STRAND}.`
    );
  }
}

export function assertSkillCode(code: string): void {
  if (!SKILL_CODE_REGEX.test(code)) {
    throw new ValidationError(
      `Mã kỹ năng '${code}' không khớp định dạng C{1-6}.{STRAND}.{NN}.`
    );
  }
}

export function assertLearningObjectiveCode(code: string): void {
  if (!LEARNING_OBJECTIVE_CODE_REGEX.test(code)) {
    throw new ValidationError(
      `Mã mục tiêu học tập '${code}' không khớp định dạng LO-C{1-6}.{STRAND}.{NN}-{NN}.`
    );
  }
}

export function assertGameLevelCode(code: string): void {
  if (!GAME_LEVEL_CODE_REGEX.test(code)) {
    throw new ValidationError(
      `Mã màn chơi '${code}' không khớp định dạng GL-C{1-6}-{STRAND}-{TEMPLATE}-{NNNN}.`
    );
  }
}

export function assertCurriculumCode(code: string): void {
  if (!CURRICULUM_DB_CODE_REGEX.test(code)) {
    throw new ValidationError(
      `Mã lộ trình '${code}' không khớp định dạng CUR-*.`
    );
  }
}

export function assertSkillMetadataRanges(input: {
  ageMin: number;
  ageMax: number;
  difficulty: number;
}): void {
  if (
    !(Number.isInteger(input.ageMin) && Number.isInteger(input.ageMax)) ||
    input.ageMin < 3 ||
    input.ageMax > 7 ||
    input.ageMin > input.ageMax
  ) {
    throw new ValidationError(
      "Độ tuổi kỹ năng phải nằm trong khoảng 3–7 và age_min <= age_max."
    );
  }
  if (
    !Number.isInteger(input.difficulty) ||
    input.difficulty < 1 ||
    input.difficulty > 5
  ) {
    throw new ValidationError("Độ khó kỹ năng phải nằm trong khoảng 1–5.");
  }
}

export function assertUnitInterval(value: number, fieldName: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new ValidationError(`${fieldName} phải nằm trong đoạn [0, 1].`);
  }
}

export function assertSkillMapWeight(weight: number | string): void {
  const numeric = Number(weight);
  if (!Number.isFinite(numeric) || numeric <= 0 || numeric > 1) {
    throw new ValidationError(
      "Trọng số content_skill_map.weight phải nằm trong khoảng (0, 1]."
    );
  }
}

export function assertMasteryProbabilities(input: {
  pLearn: number | string;
  emaCorrect?: number | string;
  hintRate?: number | string;
  bestPLearn?: number | string;
}): void {
  assertUnitInterval(Number(input.pLearn), "p_learn");
  if (input.emaCorrect !== undefined) {
    assertUnitInterval(Number(input.emaCorrect), "ema_correct");
  }
  if (input.hintRate !== undefined) {
    assertUnitInterval(Number(input.hintRate), "hint_rate");
  }
  if (input.bestPLearn !== undefined) {
    assertUnitInterval(Number(input.bestPLearn), "best_p_learn");
  }
}

export function assertPlaySessionInvariants(input: {
  childProfileId?: number | null;
  guestDeviceId?: string | null;
  layoutSeed?: number | null;
}): void {
  if (input.childProfileId == null && !input.guestDeviceId) {
    throw new ValidationError(
      "Phiên chơi phải gắn với hồ sơ trẻ hoặc thiết bị khách."
    );
  }
  if (
    input.layoutSeed != null &&
    (!Number.isInteger(input.layoutSeed) ||
      input.layoutSeed < 0 ||
      input.layoutSeed > MAX_UINT32_SEED)
  ) {
    throw new ValidationError(
      "layout_seed phải là số nguyên 32-bit không âm (0..4294967295)."
    );
  }
}

export function assertExportJobPageCount(pageCount?: number | null): void {
  if (
    pageCount != null &&
    (!Number.isInteger(pageCount) || pageCount < 1 || pageCount > 20)
  ) {
    throw new ValidationError(
      "Số trang xuất PDF phải nằm trong khoảng 1–20 trang."
    );
  }
}

export function assertAuditActorInvariant(input: {
  actorType: "user" | "manager" | "system";
  actorId?: number | null;
}): void {
  if (input.actorType === "system" && input.actorId != null) {
    throw new ValidationError("Nhật ký hệ thống không được gắn actor_id.");
  }
  if (input.actorType !== "system" && input.actorId == null) {
    throw new ValidationError(
      "Nhật ký của người dùng hoặc quản trị viên bắt buộc có actor_id."
    );
  }
}

export function assertStickerPlacementBounds(input: {
  instanceIndex: number;
  normX: number;
  normY: number;
  scale?: number;
}): void {
  if (
    !Number.isInteger(input.instanceIndex) ||
    input.instanceIndex < 0 ||
    input.instanceIndex > 23
  ) {
    throw new ValidationError("Chỉ số bản sao sticker phải nằm trong 0–23.");
  }
  if (
    !Number.isFinite(input.normX) ||
    input.normX < 0.05 ||
    input.normX > 0.95 ||
    !Number.isFinite(input.normY) ||
    input.normY < 0.05 ||
    input.normY > 0.95
  ) {
    throw new ValidationError("Toạ độ sticker phải nằm trong vùng 0.05–0.95.");
  }
  const scale = input.scale ?? 1;
  if (!Number.isFinite(scale) || scale < 0.75 || scale > 1.35) {
    throw new ValidationError("Tỷ lệ sticker phải nằm trong khoảng 0.75–1.35.");
  }
}

export function assertNoOAuthProviderTokens(input: {
  accessToken?: string | null;
  refreshToken?: string | null;
  idToken?: string | null;
}): void {
  if (
    input.accessToken != null ||
    input.refreshToken != null ||
    input.idToken != null
  ) {
    throw new ValidationError(
      "BR-SIB-10: Cấm lưu access_token, refresh_token hoặc id_token của nhà cung cấp OAuth."
    );
  }
}
