import { beforeAll, describe, expect, it } from "vitest";
import {
  ALL_TEMPLATE_CODES,
  createGameSessionSync,
  type EngineConfig,
  preloadGameSession,
  RenderSystem,
} from "#src/index";
import { FIXTURES_BY_CODE } from "./fixtures-map.js";

function expectDefined<T>(val: T | undefined | null, msg?: string): T {
  if (val === undefined || val === null) {
    throw new Error(msg ?? "Expected value to be defined");
  }
  return val;
}

function getFixture(templateCode: string, index: number) {
  const fixtures = expectDefined(
    FIXTURES_BY_CODE[templateCode],
    `Fixtures for ${templateCode} must be defined`
  );
  return expectDefined(
    fixtures[index],
    `Fixture at index ${index} for ${templateCode} must be defined`
  );
}

const FIXTURES_MAP = FIXTURES_BY_CODE;

function createMockCanvasContext(): CanvasRenderingContext2D {
  return {
    save: () => undefined,
    restore: () => undefined,
    fillRect: () => undefined,
    strokeRect: () => undefined,
    clearRect: () => undefined,
    beginPath: () => undefined,
    closePath: () => undefined,
    arc: () => undefined,
    arcTo: () => undefined,
    moveTo: () => undefined,
    lineTo: () => undefined,
    quadraticCurveTo: () => undefined,
    bezierCurveTo: () => undefined,
    ellipse: () => undefined,
    clip: () => undefined,
    fill: () => undefined,
    stroke: () => undefined,
    fillText: () => undefined,
    strokeText: () => undefined,
    roundRect: () => undefined,
    setLineDash: () => undefined,
    getLineDash: () => [],
    scale: () => undefined,
    rotate: () => undefined,
    translate: () => undefined,
    transform: () => undefined,
    resetTransform: () => undefined,
    drawImage: () => undefined,
    createLinearGradient: () => ({ addColorStop: () => undefined }),
    createRadialGradient: () => ({ addColorStop: () => undefined }),
    createPattern: () => null,
    measureText: (text: string) => ({
      width: text.length * 10,
      actualBoundingBoxAscent: 10,
      actualBoundingBoxDescent: 2,
    }),
    fillStyle: "#000",
    strokeStyle: "#000",
    lineWidth: 1,
    lineCap: "butt",
    lineJoin: "miter",
    font: "16px sans-serif",
    textAlign: "left",
    textBaseline: "alphabetic",
  } as unknown as CanvasRenderingContext2D;
}

describe("All 27 Game Engine Templates Interactive & Visual Harness", () => {
  const rs = new RenderSystem();
  const ctx = createMockCanvasContext();

  beforeAll(async () => {
    for (const c of ALL_TEMPLATE_CODES) {
      await preloadGameSession(c);
    }
  });

  for (const code of ALL_TEMPLATE_CODES) {
    describe(`Template ${code} Exhaustive Simulation`, () => {
      const fixtures = FIXTURES_MAP[code] ?? [];

      it("has valid fixtures available (at least 3)", () => {
        expect(fixtures.length).toBeGreaterThanOrEqual(3);
      });

      for (let fixtureIdx = 0; fixtureIdx < fixtures.length; fixtureIdx++) {
        const fixture = fixtures[fixtureIdx];
        if (!fixture) {
          continue;
        }

        it(`runs full lifecycle on fixture #${fixtureIdx + 1}`, () => {
          const cfg: EngineConfig = {
            level_code: `${code}-L${fixtureIdx + 1}`,
            content_version: 1,
            template_code: code,
            content_pack: fixture.content,
            difficulty_params: fixture.difficulty,
            theme_id: "default",
            age_band: "4-5",
            reduced_motion: false,
            audio_enabled: true,
          };

          const session = createGameSessionSync(code, cfg);
          expect(session).toBeDefined();

          // 1. Setup entities
          session.setupEntities();

          // 2. Resolve slots for each age band without throwing
          for (const ageBand of ["3-4", "4-5", "5-6"] as const) {
            const typedSession = session as unknown as {
              resolveSlots?: (band: "3-4" | "4-5" | "5-6") => void;
              slots?: readonly { x: number; y: number; w: number; h: number }[];
            };
            if (typeof typedSession.resolveSlots === "function") {
              typedSession.resolveSlots(ageBand);
              if (typedSession.slots) {
                expect(typedSession.slots.length).toBeGreaterThanOrEqual(0);
                for (const slot of typedSession.slots) {
                  expect(slot.w).toBeGreaterThan(0);
                  expect(slot.h).toBeGreaterThan(0);
                  expect(slot.x).toBeGreaterThanOrEqual(0);
                  expect(slot.y).toBeGreaterThanOrEqual(0);
                }
              }
            }
          }

          // 3. Multi-frame rendering stress test
          if (typeof session.render === "function") {
            expect(() => {
              session.render?.(ctx, rs, 0);
              session.render?.(ctx, rs, 16);
              session.render?.(ctx, rs, 200);
              session.render?.(ctx, rs, 500);
              session.render?.(ctx, rs, 1000);
            }).not.toThrow();
          }

          // 4. Update tick
          if (typeof session.update === "function") {
            expect(() => {
              session.update?.(16);
              session.update?.(50);
              session.update?.(100);
            }).not.toThrow();
          }

          // 5. Purity Assertions (BR-ENG-13): checkWinCondition
          const initialWin = session.checkWinCondition();
          for (let i = 0; i < 20; i++) {
            expect(session.checkWinCondition()).toBe(initialWin);
          }

          // 6. Purity Assertions: validateAction does not mutate state or trigger win
          // NOTE (Task #209 / BR-EIC-04): Testing with "nonexistent_action_type_test" only verifies early-return
          // for unknown action types (does not prove purity for genuine domain actions). Real action purity
          // is asserted by checkValidateActionPurity in gate tests (BR-EIC-04).
          const unknownResult = session.validateAction({
            type: "nonexistent_action_type_test",
            data: { foo: "bar" },
          });
          expect(unknownResult).toBeDefined();
          expect(typeof unknownResult.valid).toBe("boolean");
          expect(session.checkWinCondition()).toBe(initialWin);

          // 7. Telemetry inspection: verify start event recorded and no PII
          const telemetry = session.getTelemetry();
          expect(telemetry.events).toBeDefined();
          expect(telemetry.start_time_ms).toBeGreaterThan(0);

          for (const ev of telemetry.events) {
            expect(ev.event_name).toBeDefined();
            expect(typeof ev.timestamp_ms).toBe("number");
            if (ev.data) {
              const dataStr = JSON.stringify(ev.data).toLowerCase();
              expect(dataStr).not.toContain("password");
              expect(dataStr).not.toContain("token");
              expect(dataStr).not.toContain("email");
            }
          }

          // 8. Clean destroy
          expect(() => session.destroy()).not.toThrow();
        });
      }
    });
  }

  describe("Complete Gameplay Winning Simulation (GT-001..GT-027)", () => {
    it("GT-001 wins when correct option is locked", () => {
      const f = getFixture("GT-001", 0);
      const s = createGameSessionSync("GT-001", {
        level_code: "GT-001-TEST",
        content_version: 1,
        template_code: "GT-001",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        onItemLocked: (id: string) => void;
        checkWinCondition: () => boolean;
        content: { options: { item_id: string; is_correct: boolean }[] };
      };
      s.setupEntities();
      const correctOpt = expectDefined(
        s.content.options.find((o) => o.is_correct)
      );
      s.onItemLocked(correctOpt.item_id);
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-002 wins when correct items are selected and submitted", () => {
      const f = getFixture("GT-002", 0);
      const s = createGameSessionSync("GT-002", {
        level_code: "GT-002-TEST",
        content_version: 1,
        template_code: "GT-002",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        toggleItemSelection: (id: string) => void;
        onSubmitSelection: () => void;
        checkWinCondition: () => boolean;
        content: { items: { item_id: string; is_correct: boolean }[] };
      };
      s.setupEntities();
      for (const item of s.content.items) {
        if (item.is_correct) {
          s.toggleItemSelection(item.item_id);
        }
      }
      s.onSubmitSelection();
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-003 wins when correct items are placed in container", () => {
      const f = getFixture("GT-003", 0);
      const s = createGameSessionSync("GT-003", {
        level_code: "GT-003-TEST",
        content_version: 1,
        template_code: "GT-003",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        onItemDropped: (itemId: string, containerId: string) => void;
        checkWinCondition: () => boolean;
        content: {
          items: { item_id: string; is_correct: boolean }[];
          container: { container_id: string };
        };
      };
      s.setupEntities();
      for (const item of s.content.items) {
        if (item.is_correct) {
          s.onItemDropped(item.item_id, s.content.container.container_id);
        }
      }
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-004 wins when items are placed into correct groups", () => {
      const f = getFixture("GT-004", 0);
      const s = createGameSessionSync("GT-004", {
        level_code: "GT-004-TEST",
        content_version: 1,
        template_code: "GT-004",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        onItemSorted: (itemId: string, groupId: string) => void;
        checkWinCondition: () => boolean;
        content: {
          items: { item_id: string; correct_group_id: string }[];
        };
      };
      s.setupEntities();
      for (const item of s.content.items) {
        s.onItemSorted(item.item_id, item.correct_group_id);
      }
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-005 wins when all pairs are matched", () => {
      const f = getFixture("GT-005", 0);
      const s = createGameSessionSync("GT-005", {
        level_code: "GT-005-TEST",
        content_version: 1,
        template_code: "GT-005",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        onPairMatched: (leftId: string, rightId: string) => void;
        checkWinCondition: () => boolean;
        content: {
          pairs: {
            left: { item_id: string };
            right: { item_id: string };
          }[];
        };
      };
      s.setupEntities();
      for (const pair of s.content.pairs) {
        s.onPairMatched(pair.left.item_id, pair.right.item_id);
      }
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-006 wins when sequence is ordered and submitted", () => {
      const f = getFixture("GT-006", 0);
      const s = createGameSessionSync("GT-006", {
        level_code: "GT-006-TEST",
        content_version: 1,
        template_code: "GT-006",
        content_pack: f.content,
        difficulty_params: { ...f.difficulty, shuffle_initial: false },
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        onSubmitSequence: () => void;
        checkWinCondition: () => boolean;
      };
      s.setupEntities();
      s.onSubmitSequence();
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-007 wins when target part is filled with correct value", () => {
      const f = getFixture("GT-007", 0);
      const s = createGameSessionSync("GT-007", {
        level_code: "GT-007-TEST",
        content_version: 1,
        template_code: "GT-007",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        onPartFilled: (optionId: string, partId?: string) => void;
        checkWinCondition: () => boolean;
        content: {
          parts: { id: string; is_target: boolean }[];
          options: { id: string; is_correct: boolean }[];
        };
      };
      s.setupEntities();
      const targetPart = expectDefined(
        s.content.parts.find((p) => p.is_target)
      );
      const correctOpt = expectDefined(
        s.content.options.find((o) => o.is_correct)
      );
      s.onPartFilled(correctOpt.id, targetPart.id);
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-008 wins when expected items are placed in slots", () => {
      const f = getFixture("GT-008", 0);
      const s = createGameSessionSync("GT-008", {
        level_code: "GT-008-TEST",
        content_version: 1,
        template_code: "GT-008",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        onItemPlaced: (itemId: string, slotId: string) => void;
        checkWinCondition: () => boolean;
        content: {
          slots: { slot_id: string; expected_item_id: string }[];
        };
      };
      s.setupEntities();
      for (const slot of s.content.slots) {
        s.onItemPlaced(slot.expected_item_id, slot.slot_id);
      }
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-009 wins when answer candidate is selected", () => {
      const f = getFixture("GT-009", 0);
      const s = createGameSessionSync("GT-009", {
        level_code: "GT-009-TEST",
        content_version: 1,
        template_code: "GT-009",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        onCandidateSelected: (id: string) => void;
        checkWinCondition: () => boolean;
        content: { answer_candidate_id: string };
      };
      s.setupEntities();
      s.onCandidateSelected(s.content.answer_candidate_id);
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-010 wins when expected equation value is selected", () => {
      const f = getFixture("GT-010", 0);
      const s = createGameSessionSync("GT-010", {
        level_code: "GT-010-TEST",
        content_version: 1,
        template_code: "GT-010",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        selectValue: (val: number) => boolean;
        getExpectedAnswer: () => number;
        checkWinCondition: () => boolean;
      };
      s.setupEntities();
      const ans = s.getExpectedAnswer();
      s.selectValue(ans);
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-011 wins when correct matrix option is selected", () => {
      const f = getFixture("GT-011", 0);
      const s = createGameSessionSync("GT-011", {
        level_code: "GT-011-TEST",
        content_version: 1,
        template_code: "GT-011",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        onOptionSelected: (id: string) => void;
        checkWinCondition: () => boolean;
        content: { options: { option_id: string; is_correct: boolean }[] };
      };
      s.setupEntities();
      const correctOpt = expectDefined(
        s.content.options.find((o) => o.is_correct)
      );
      s.onOptionSelected(correctOpt.option_id);
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-012 wins when flash count value is selected", () => {
      const f = getFixture("GT-012", 0);
      const s = createGameSessionSync("GT-012", {
        level_code: "GT-012-TEST",
        content_version: 1,
        template_code: "GT-012",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        selectValue: (val: number) => boolean;
        checkWinCondition: () => boolean;
        content: { flash_items: unknown[] };
      };
      s.setupEntities();
      s.selectValue(s.content.flash_items.length);
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-013 wins when valid path through required cells is submitted", () => {
      const f = getFixture("GT-013", 0);
      const s = createGameSessionSync("GT-013", {
        level_code: "GT-013-TEST",
        content_version: 1,
        template_code: "GT-013",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        onPathStep: (cell: { row: number; col: number }) => void;
        onPathSubmitted: () => boolean;
        checkWinCondition: () => boolean;
        content: {
          grid: {
            start: { row: number; col: number };
            goal: { row: number; col: number };
          };
          required_cells: { row: number; col: number }[];
        };
      };
      s.setupEntities();
      for (const cell of [
        { row: 1, col: 0 },
        { row: 2, col: 0 },
        { row: 2, col: 1 },
        { row: 2, col: 2 },
      ]) {
        s.onPathStep(cell);
      }
      expect(s.onPathSubmitted()).toBe(true);
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-014 wins when heavier side is chosen", () => {
      const f = getFixture("GT-014", 0);
      const s = createGameSessionSync("GT-014", {
        level_code: "GT-014-TEST",
        content_version: 1,
        template_code: "GT-014",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        selectSide: (side: "left" | "right") => void;
        getLeftWeight: () => number;
        getRightWeight: () => number;
        checkWinCondition: () => boolean;
      };
      s.setupEntities();
      const heavier = s.getLeftWeight() > s.getRightWeight() ? "left" : "right";
      s.selectSide(heavier);
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-015 wins when sudoku cells are filled with valid symbols", () => {
      const f = getFixture("GT-015", 0);
      const s = createGameSessionSync("GT-015", {
        level_code: "GT-015-TEST",
        content_version: 1,
        template_code: "GT-015",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        fillCell: (r: number, c: number, id: string) => boolean;
        checkWinCondition: () => boolean;
        content: {
          symbols: { symbol_id: string }[];
        };
      };
      s.setupEntities();
      // Mini 2x2 sudoku solution test
      const symA = expectDefined(s.content.symbols[0]).symbol_id;
      const symB = expectDefined(s.content.symbols[1]).symbol_id;
      s.fillCell(0, 0, symA);
      s.fillCell(0, 1, symB);
      s.fillCell(1, 0, symB);
      s.fillCell(1, 1, symA);
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-016 wins when correct clock option is selected", () => {
      const f = getFixture("GT-016", 0);
      const s = createGameSessionSync("GT-016", {
        level_code: "GT-016-TEST",
        content_version: 1,
        template_code: "GT-016",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        selectOption: (idx: number) => boolean;
        checkWinCondition: () => boolean;
        content: { options: { is_correct: boolean }[] };
      };
      s.setupEntities();
      const correctIdx = s.content.options.findIndex((o) => o.is_correct);
      s.selectOption(correctIdx);
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-017 wins when correct block count option is selected", () => {
      const f = getFixture("GT-017", 0);
      const s = createGameSessionSync("GT-017", {
        level_code: "GT-017-TEST",
        content_version: 1,
        template_code: "GT-017",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        selectOption: (id: string) => boolean;
        checkWinCondition: () => boolean;
        content: { options: { option_id: string; is_correct: boolean }[] };
      };
      s.setupEntities();
      const correctOpt = expectDefined(
        s.content.options.find((o) => o.is_correct)
      );
      s.selectOption(correctOpt.option_id);
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-018 wins when correct option is selected", () => {
      const f = getFixture("GT-018", 0);
      const s = createGameSessionSync("GT-018", {
        level_code: "GT-018-TEST",
        content_version: 1,
        template_code: "GT-018",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        onItemSelect: (id: string) => void;
        checkWinCondition: () => boolean;
        content: { options: { item_id: string; is_correct: boolean }[] };
      };
      s.setupEntities();
      const correctOpt = expectDefined(
        s.content.options.find((o) => o.is_correct)
      );
      s.onItemSelect(correctOpt.item_id);
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-019 wins when pieces are placed with matching rotation", () => {
      const f = getFixture("GT-019", 0);
      const s = createGameSessionSync("GT-019", {
        level_code: "GT-019-TEST",
        content_version: 1,
        template_code: "GT-019",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        onPlacePiece: (pieceId: string, slotId: string) => void;
        onRotatePiece: (pieceId: string) => void;
        checkWinCondition: () => boolean;
        content: {
          pieces: {
            piece_id: string;
            target_slot_id: string;
            initial_rotation?: number;
          }[];
          target_slots: { slot_id: string; target_rotation?: number }[];
        };
      };
      s.setupEntities();
      for (const piece of s.content.pieces) {
        const slot = expectDefined(
          s.content.target_slots.find(
            (ts) => ts.slot_id === piece.target_slot_id
          )
        );
        const targetRot = slot.target_rotation ?? 0;
        let curRot = piece.initial_rotation ?? 0;
        while (curRot !== targetRot) {
          s.onRotatePiece(piece.piece_id);
          curRot = (curRot + 90) % 360;
        }
        s.onPlacePiece(piece.piece_id, piece.target_slot_id);
      }
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-020 wins when all memory card pairs are flipped", () => {
      const f = getFixture("GT-020", 0);
      const s = createGameSessionSync("GT-020", {
        level_code: "GT-020-TEST",
        content_version: 1,
        template_code: "GT-020",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        onTapCard: (id: string) => void;
        checkWinCondition: () => boolean;
        content: {
          pairs: { card_a: { card_id: string }; card_b: { card_id: string } }[];
        };
      };
      s.setupEntities();
      for (const pair of s.content.pairs) {
        s.onTapCard(pair.card_a.card_id);
        s.onTapCard(pair.card_b.card_id);
      }
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-021 wins when options are placed into symmetric target slots", () => {
      const f = getFixture("GT-021", 0);
      const s = createGameSessionSync("GT-021", {
        level_code: "GT-021-TEST",
        content_version: 1,
        template_code: "GT-021",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        onPlaceOption: (itemId: string, slotId: string) => void;
        checkWinCondition: () => boolean;
        content: {
          target_slots: { slot_id: string; expected_asset_ref: string }[];
          options: { item_id: string; asset_ref: string }[];
        };
      };
      s.setupEntities();
      for (const target of s.content.target_slots) {
        const matchingOpt = expectDefined(
          s.content.options.find(
            (o) => o.asset_ref === target.expected_asset_ref
          )
        );
        s.onPlaceOption(matchingOpt.item_id, target.slot_id);
      }
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-022 wins when all hidden/target objects are found", () => {
      const f = getFixture("GT-022", 0);
      const s = createGameSessionSync("GT-022", {
        level_code: "GT-022-TEST",
        content_version: 1,
        template_code: "GT-022",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        onRevealObject: (id: string) => boolean;
        onTapObject: (id: string) => void;
        checkWinCondition: () => boolean;
        content: {
          scene_objects: {
            id: string;
            is_target: boolean;
            is_hidden?: boolean;
          }[];
        };
      };
      s.setupEntities();
      for (const obj of s.content.scene_objects) {
        if (obj.is_target) {
          if (obj.is_hidden) {
            s.onRevealObject(obj.id);
          }
          s.onTapObject(obj.id);
        }
      }
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-023 wins when all parts are assembled onto anchors", () => {
      const f = getFixture("GT-023", 0);
      const s = createGameSessionSync("GT-023", {
        level_code: "GT-023-TEST",
        content_version: 1,
        template_code: "GT-023",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        onAssemblePart: (partId: string, anchorId: string) => void;
        checkWinCondition: () => boolean;
        content: {
          anchors: { anchor_id: string; accepted_part_id: string }[];
        };
      };
      s.setupEntities();
      for (const anchor of s.content.anchors) {
        s.onAssemblePart(anchor.accepted_part_id, anchor.anchor_id);
      }
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-024 wins when waypoints are traced sequentially", () => {
      const f = getFixture("GT-024", 0);
      const s = createGameSessionSync("GT-024", {
        level_code: "GT-024-TEST",
        content_version: 1,
        template_code: "GT-024",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "5-6",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        onTracePoint: (pt: { x: number; y: number; timeMs: number }) => void;
        checkWinCondition: () => boolean;
        content: {
          waypoints: { x: number; y: number; order: number }[];
        };
      };
      s.setupEntities();
      const ordered = [...s.content.waypoints].sort(
        (a, b) => a.order - b.order
      );
      for (const wp of ordered) {
        s.onTracePoint({ x: wp.x, y: wp.y, timeMs: Date.now() });
      }
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-025 wins when all difference objects are tapped", () => {
      const f = getFixture("GT-025", 0);
      const s = createGameSessionSync("GT-025", {
        level_code: "GT-025-TEST",
        content_version: 1,
        template_code: "GT-025",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        onTapObject: (id: string) => void;
        checkWinCondition: () => boolean;
        content: {
          differences: { id: string; left_id: string; right_id: string }[];
        };
      };
      s.setupEntities();
      for (const diff of s.content.differences) {
        s.onTapObject(diff.left_id);
      }
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-026 wins when go trials are tapped and nogo trials timed out", () => {
      const f = getFixture("GT-026", 0);
      const s = createGameSessionSync("GT-026", {
        level_code: "GT-026-TEST",
        content_version: 1,
        template_code: "GT-026",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        onTapStimulus: () => void;
        update: (delta: number) => void;
        getCurrentTrial: () => { kind: "go" | "nogo" } | null;
        checkWinCondition: () => boolean;
        difficulty: { stimulus_window_ms: number; isi_ms: number };
        content: { trials: { kind: "go" | "nogo" }[] };
      };
      s.setupEntities();
      for (const _trial of s.content.trials) {
        const cur = s.getCurrentTrial();
        if (cur?.kind === "go") {
          s.onTapStimulus();
        } else {
          s.update(s.difficulty.stimulus_window_ms + 10);
        }
        s.update(s.difficulty.isi_ms + 10);
      }
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-027 wins when rule matches are selected across rule switches", () => {
      const f = getFixture("GT-027", 0);
      const s = createGameSessionSync("GT-027", {
        level_code: "GT-027-TEST",
        content_version: 1,
        template_code: "GT-027",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        onSelectItem: (id: string) => { valid: boolean; feedback: string };
        update: (deltaMs: number) => void;
        getActiveRule: () => { validator: (item: unknown) => boolean };
        isSignaling: () => boolean;
        checkWinCondition: () => boolean;
        difficulty: { signal_duration_ms: number };
        content: {
          rules: unknown[];
          switch_after_trials: number;
          items: { id: string }[];
        };
      };
      s.setupEntities();
      const totalNeeded =
        s.content.rules.length * s.content.switch_after_trials;
      for (let i = 0; i < totalNeeded; i++) {
        if (s.isSignaling()) {
          s.update(s.difficulty.signal_duration_ms + 10);
        }
        const activeRule = s.getActiveRule();
        const matchingItem = expectDefined(
          s.content.items.find((item) => activeRule.validator(item))
        );
        s.onSelectItem(matchingItem.id);
      }
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-028 wins when tapped count equals target_total and submitted", () => {
      const f = getFixture("GT-028", 0);
      const s = createGameSessionSync("GT-028", {
        level_code: "GT-028-TEST",
        content_version: 1,
        template_code: "GT-028",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        onTapItem: (id: string) => { valid: boolean; feedback: string };
        onSubmitCount: () => { valid: boolean; feedback: string };
        checkWinCondition: () => boolean;
        content: {
          step: number;
          target_total: number;
          items: { item_id: string }[];
        };
      };
      s.setupEntities();
      const neededItems = s.content.target_total / s.content.step;
      for (let i = 0; i < neededItems; i++) {
        const item = expectDefined(s.content.items[i]);
        s.onTapItem(item.item_id);
      }
      const res = s.onSubmitCount();
      expect(res.valid).toBe(true);
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-029 wins when remove_count items are removed and correct answer is chosen", () => {
      const f = getFixture("GT-029", 0);
      const s = createGameSessionSync("GT-029", {
        level_code: "GT-029-TEST",
        content_version: 1,
        template_code: "GT-029",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        validateAction: (action: {
          type: string;
          data: Record<string, unknown>;
        }) => { valid: boolean; feedback: string };
        commit?: (action: {
          type: string;
          data: Record<string, unknown>;
        }) => void;
        checkWinCondition: () => boolean;
        content: {
          initial_items: { item_id: string }[];
          remove_count: number;
          answer_options: { option_id: string; is_correct: boolean }[];
        };
      };
      s.setupEntities();
      for (let i = 0; i < s.content.remove_count; i++) {
        const item = expectDefined(s.content.initial_items[i]);
        const act = {
          type: "remove_item",
          data: { item_id: item.item_id },
        };
        s.validateAction(act);
        s.commit?.(act);
      }
      const correctOpt = expectDefined(
        s.content.answer_options.find((o) => o.is_correct)
      );
      const actOpt = {
        type: "select_option",
        data: { option_id: correctOpt.option_id },
      };
      const res = s.validateAction(actOpt);
      expect(res.valid).toBe(true);
      s.commit?.(actOpt);
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-030: placement and answer selection simulation succeeds", () => {
      const f = getFixture("GT-030", 0);
      const s = createGameSessionSync("GT-030", {
        level_code: "GT-030-TEST",
        content_version: 1,
        template_code: "GT-030",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "5-6",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        validateAction: (action: {
          type: string;
          data: Record<string, unknown>;
        }) => { valid: boolean; feedback: string };
        commit?: (action: {
          type: string;
          data: Record<string, unknown>;
        }) => void;
        checkWinCondition: () => boolean;
        content: {
          object: { length_in_units: number };
          answer_options: { option_id: string; is_correct: boolean }[];
        };
      };
      s.setupEntities();
      for (let i = 0; i < s.content.object.length_in_units; i++) {
        const act = {
          type: "place_unit",
          data: {},
        };
        s.validateAction(act);
        s.commit?.(act);
      }
      const correctOpt = expectDefined(
        s.content.answer_options.find((o) => o.is_correct)
      );
      const actOpt = {
        type: "select_option",
        data: { option_id: correctOpt.option_id },
      };
      const res = s.validateAction(actOpt);
      expect(res.valid).toBe(true);
      s.commit?.(actOpt);
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-031: coin composition to target amount simulation succeeds", () => {
      const f = getFixture("GT-031", 0);
      const s = createGameSessionSync("GT-031", {
        level_code: "GT-031-TEST",
        content_version: 1,
        template_code: "GT-031",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "5-6",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        validateAction: (action: {
          type: string;
          data: Record<string, unknown>;
        }) => { valid: boolean; feedback: string };
        commit?: (action: {
          type: string;
          data: Record<string, unknown>;
        }) => void;
        checkWinCondition: () => boolean;
        content: {
          target_amount: number;
          coins: { coin_id: string; value: number }[];
        };
      };
      s.setupEntities();

      // For fixture 0: coins has 1, 1, 2, target is 3. We deposit coin c1_1 (1) and c2_1 (2)
      const c1 = expectDefined(s.content.coins.find((c) => c.value === 1));
      const c2 = expectDefined(s.content.coins.find((c) => c.value === 2));

      const c1Act = {
        type: "deposit_coin",
        data: { coin_id: c1.coin_id },
      };
      s.validateAction(c1Act);
      s.commit?.(c1Act);

      const c2Act = {
        type: "deposit_coin",
        data: { coin_id: c2.coin_id },
      };
      const res = s.validateAction(c2Act);
      expect(res.valid).toBe(true);
      s.commit?.(c2Act);
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-032: cup selection for quantity comparison simulation succeeds", () => {
      const f = getFixture("GT-032", 0); // Fixture 0: question_type is "more", cup_b has 5 (more than cup_a with 2)
      const s = createGameSessionSync("GT-032", {
        level_code: "GT-032-TEST",
        content_version: 1,
        template_code: "GT-032",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "5-6",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        validateAction: (action: {
          type: string;
          data: Record<string, unknown>;
        }) => { valid: boolean; feedback: string };
        commit?: (action: {
          type: string;
          data: Record<string, unknown>;
        }) => void;
        checkWinCondition: () => boolean;
        content: {
          question_type: string;
          cups: { cup_id: string; fill_units: number }[];
        };
      };
      s.setupEntities();

      const act = {
        type: "select_cup",
        data: { cup_id: "cup_b" },
      };
      const res = s.validateAction(act);
      expect(res.valid).toBe(true);
      s.commit?.(act);
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-033: yarn placement in weave grid simulation succeeds", () => {
      const f = getFixture("GT-033", 0); // Fixture 0: 2x2 grid, blank at index 3, solution is "red"
      const s = createGameSessionSync("GT-033", {
        level_code: "GT-033-TEST",
        content_version: 1,
        template_code: "GT-033",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "5-6",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        validateAction: (action: {
          type: string;
          data: Record<string, unknown>;
        }) => { valid: boolean; feedback: string };
        commit?: (action: {
          type: string;
          data: Record<string, unknown>;
        }) => void;
        checkWinCondition: () => boolean;
        content: {
          cells: (string | null)[];
          solution?: string[];
        };
      };
      s.setupEntities();

      const act = {
        type: "place_yarn",
        data: { cell_index: 3, color_id: "red" },
      };
      const res = s.validateAction(act);
      expect(res.valid).toBe(true);
      s.commit?.(act);
      expect(s.checkWinCondition()).toBe(true);
    });

    it("GT-034: beat sequence tapping simulation succeeds", () => {
      const f = getFixture("GT-034", 0); // Fixture 0: ["drum", "cymbal", "drum", "cymbal"]
      const s = createGameSessionSync("GT-034", {
        level_code: "GT-034-TEST",
        content_version: 1,
        template_code: "GT-034",
        content_pack: f.content,
        difficulty_params: f.difficulty,
        theme_id: "default",
        age_band: "5-6",
        reduced_motion: false,
        audio_enabled: true,
      }) as unknown as {
        setupEntities: () => void;
        validateAction: (action: {
          type: string;
          data: Record<string, unknown>;
        }) => { valid: boolean; feedback: string };
        commit?: (action: {
          type: string;
          data: Record<string, unknown>;
        }) => void;
        checkWinCondition: () => boolean;
        content: {
          target_pattern: (string | null)[];
        };
      };
      s.setupEntities();

      for (const step of f.content.target_pattern) {
        const act = {
          type: "tap_instrument",
          data: { instrument_id: step },
        };
        const res = s.validateAction(act);
        expect(res.valid).toBe(true);
        s.commit?.(act);
      }
      expect(s.checkWinCondition()).toBe(true);
    });
  });
});
