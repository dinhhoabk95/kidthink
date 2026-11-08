import { ALL_SEED_LEVELS } from "@mindkid/content-build";
import { beforeAll, describe, expect, it } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { TemplateGameSession } from "#src/game-session";
import {
  ALL_TEMPLATE_CODES,
  createGameSessionSync,
  type EngineConfig,
  preloadGameSession,
  TEMPLATE_SEED_ENTRIES,
} from "#src/index";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeStageZones, type ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  GT035ContentSchema,
  GT035DifficultySchema,
} from "#src/templates/GT-035/template";
import { FIXTURES_BY_CODE, type FixturePayload } from "../fixtures-map.ts";
import { GT035SlotOnActionSession } from "./fixtures/action-zone-overlap.ts";

/**
 * Phase 24 mục 1: vùng hành động (nút nộp/chạy) không được giao với ô chạm nào,
 * ở mọi khung điện thoại (`BR-PSZ-03`, `BR-PSZ-05`).
 */
const BANDS: readonly AgeBand[] = ["3-4", "4-5", "5-6"];
const FRAMES = [
  { name: "360x640", w: 360, h: 640 },
  { name: "390x844", w: 390, h: 844 },
  { name: "330x697", w: 330, h: 697 },
  { name: "610x350", w: 610, h: 350 },
] as const;

/** Kiểu `content_pack`/`difficulty_params` của seed, lấy từ chính catalog. */
type SeedPayload = (typeof ALL_SEED_LEVELS)[number]["content_pack"];

function asPayload(val: SeedPayload): FixturePayload {
  return typeof val === "object" && val !== null && !Array.isArray(val)
    ? { ...val }
    : {};
}

function configFor(
  code: string,
  band: AgeBand,
  content: FixturePayload,
  difficulty: FixturePayload
): EngineConfig {
  return {
    level_code: `${code}-LV1`,
    content_version: 1,
    template_code: code,
    content_pack: content,
    difficulty_params: difficulty,
    theme_id: "default",
    age_band: band,
    reduced_motion: false,
    audio_enabled: true,
  };
}

/**
 * Nợ bố cục vật lý ở khung nhỏ nhất 360x640: ĐÃ HẾT (Phase 25, product owner chốt
 * 2026-11-08, giảm số ô thay vì phân trang). GT-009 trần 6 ứng viên (`BR-E009-09`),
 * GT-035 lưới tối đa 3 hàng (`BR-E035-17`), cùng luật chung `BR-LAY-12`. Bậc thang
 * giữ nguyên: ca tràn mới (không có trong sổ nợ) là đỏ, và sổ nợ rỗng nên mọi ca
 * tràn đều đỏ. Cần thêm nợ thì phải có quyết định sản phẩm, không thêm lặng lẽ.
 */
const KNOWN_PHYSICAL_OVERFLOW: ReadonlySet<string> = new Set<string>();

function intersects(slot: Slot, zone: ZoneRect): boolean {
  const left = slot.x - slot.hitW / 2;
  const right = slot.x + slot.hitW / 2;
  const top = slot.y - slot.hitH / 2;
  const bottom = slot.y + slot.hitH / 2;
  return (
    left < zone.x + zone.w &&
    right > zone.x &&
    top < zone.y + zone.h &&
    bottom > zone.y
  );
}

function casesFor(code: string, band: AgeBand) {
  const fixtures = (FIXTURES_BY_CODE[code] ?? []).map((f, i) => ({
    name: `mẫu ${i}`,
    config: configFor(code, band, f.content, f.difficulty),
  }));
  const seeds = ALL_SEED_LEVELS.filter(
    (level) => level.header.template_code === code
  ).map((level) => ({
    name: `seed ${level.header.code}`,
    config: configFor(
      code,
      band,
      asPayload(level.content_pack),
      asPayload(level.difficulty_params)
    ),
  }));
  return [...fixtures, ...seeds];
}

type Frame = (typeof FRAMES)[number];

/** Dựng vòng ở khung `frame`; `true` khi có ô chạm giao `zones.action`. */
function hitsAction(
  session: TemplateGameSession,
  band: AgeBand,
  frame: Frame
): boolean {
  const space = deriveLogicSpace(frame.w, frame.h);
  const cssPerLogic = frame.w / space.w;
  const zones = computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand: band,
    cssPerLogic,
    needsTray: session.needsTray,
    trayItems: session.trayItemCount,
    trayLabels: session.trayHasLabels,
    needsCommit: session.needsCommit,
    stageRows: session.stageRowCount,
  });
  session.prepareRound(
    band,
    space,
    zones.stage,
    zones.tray ?? undefined,
    cssPerLogic
  );
  return session.slots.some((s) => intersects(s, zones.action));
}

/** Bậc thang: ca mới không có trong sổ nợ, và ca trong sổ nợ của `code` đã hết tràn. */
function ratchet(
  code: string,
  problems: readonly string[],
  known: ReadonlySet<string>
): { fresh: string[]; healed: string[] } {
  const mine = [...known].filter((key) => key.startsWith(`${code} `));
  return {
    fresh: problems.filter((p) => !known.has(p)),
    healed: mine.filter((key) => !problems.includes(key)),
  };
}

describe("ca âm: phép kiểm bắt được ô đè nút hành động", () => {
  beforeAll(async () => {
    await preloadGameSession("GT-035");
  });
  const fixture = FIXTURES_BY_CODE["GT-035"]?.[0];
  const frame = FRAMES[1];

  it("ô bị đẩy xuống hàng nút thì báo đè; bố cục thật cùng level thì không", () => {
    if (!fixture) {
      throw new Error("Thiếu fixture GT-035");
    }
    const config = configFor(
      "GT-035",
      "5-6",
      fixture.content,
      fixture.difficulty
    );
    const real = createGameSessionSync("GT-035", config);
    const broken = new GT035SlotOnActionSession(
      GT035ContentSchema.parse(fixture.content),
      GT035DifficultySchema.parse(fixture.difficulty)
    );
    if (!(real instanceof TemplateGameSession)) {
      throw new Error("GT-035 không phải TemplateGameSession");
    }
    expect(broken.needsCommit).toBe(true);
    expect(hitsAction(real, "5-6", frame)).toBe(false);
    expect(hitsAction(broken, "5-6", frame)).toBe(true);
  });

  it("bậc thang báo ca mới (nợ tăng) và ca đã lành (nợ chưa gỡ)", () => {
    const known = new Set(["GT-035 5-6 360x640 mẫu 1"]);
    expect(ratchet("GT-035", ["GT-035 5-6 360x640 mẫu 9"], known)).toEqual({
      fresh: ["GT-035 5-6 360x640 mẫu 9"],
      healed: ["GT-035 5-6 360x640 mẫu 1"],
    });
    expect(ratchet("GT-035", ["GT-035 5-6 360x640 mẫu 1"], known)).toEqual({
      fresh: [],
      healed: [],
    });
  });
});

describe.each(ALL_TEMPLATE_CODES)(
  "%s — nút hành động không đè ô chạm",
  (code) => {
    beforeAll(async () => {
      await preloadGameSession(code);
    });

    it("mọi khung điện thoại, mọi band", () => {
      const problems: string[] = [];
      const banned: readonly string[] =
        TEMPLATE_SEED_ENTRIES.find((e) => e.templateCode === code)
          ?.bannedAgeBands ?? [];
      for (const band of BANDS.filter((b) => !banned.includes(b))) {
        for (const frame of FRAMES) {
          for (const { name, config } of casesFor(code, band)) {
            const session = createGameSessionSync(code, config);
            if (
              !(session instanceof TemplateGameSession && session.needsCommit)
            ) {
              continue;
            }
            if (hitsAction(session, band, frame)) {
              problems.push(`${code} ${band} ${frame.name} ${name}`);
            }
          }
        }
      }
      const { fresh, healed } = ratchet(
        code,
        problems,
        KNOWN_PHYSICAL_OVERFLOW
      );
      expect(fresh, "ca mới đè nút hành động").toEqual([]);
      expect(healed, "ca đã hết tràn: gỡ khỏi KNOWN_PHYSICAL_OVERFLOW").toEqual(
        []
      );
    });
  }
);
