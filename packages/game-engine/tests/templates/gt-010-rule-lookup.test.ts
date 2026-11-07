import { describe, expect, it } from "vitest";
import type { Gesture } from "#src/interaction";
import { SAMPLE_LEVEL_1 } from "#src/templates/GT-010/fixtures";
import { SubstitutionSession } from "#src/templates/GT-010/session";

/**
 * Task #313 Phase 3 — GT-010: chạm bảng luật là tra cứu (không tính trả lời),
 * sai thì bảng luật sáng nhẹ mời tra lại, dấu sai không kẹt (`BR-E010-04`).
 */
function build(): SubstitutionSession {
  const session = new SubstitutionSession(
    SAMPLE_LEVEL_1.content_pack,
    SAMPLE_LEVEL_1.difficulty_params
  );
  session.prepareRound("4-5");
  return session;
}

function tapEntity(session: SubstitutionSession, id: string): Gesture {
  const e = session.getView().entities.find((x) => x.id === id);
  if (!e) {
    throw new Error(`Thiếu entity ${id}`);
  }
  return { type: "tap", x: e.x, y: e.y, timeMs: 0 };
}

describe("GT-010 — tra cứu bảng luật (BR-E010-04)", () => {
  it("chạm một dòng luật: hợp lệ, không phải trả lời, dòng đó được phóng to", () => {
    const session = build();
    const eqId = session.getEquations()[0]?.equation_id ?? "";
    const events = session.getTelemetry().events.length;
    const verdict = session.dispatch(tapEntity(session, eqId));
    expect(verdict?.valid).toBe(true);
    expect(verdict?.feedback).toBe("none");
    expect(session.getSelectedValue()).toBeNull();
    expect(session.checkWinCondition()).toBe(false);
    expect(session.getTelemetry().events.length).toBe(events);
    const row = session.getView().entities.find((e) => e.id === eqId);
    expect(row?.state).toBe("selected");
  });

  it("chọn phương án thì dòng tra cứu được bỏ phóng to", () => {
    const session = build();
    const eqId = session.getEquations()[0]?.equation_id ?? "";
    session.dispatch(tapEntity(session, eqId));
    session.dispatch(tapEntity(session, "opt-0"));
    const row = session.getView().entities.find((e) => e.id === eqId);
    expect(row?.state).not.toBe("selected");
  });
});

describe("GT-010 — sai: bảng luật mời tra lại, không kẹt đỏ (BR-E010-04)", () => {
  function wrongOptionIndex(session: SubstitutionSession): number {
    return session.getOptions().findIndex((o) => !o.is_correct);
  }

  it("chọn sai: các dòng luật sáng nhẹ trong nhịp, rồi trở về trung tính", () => {
    const session = build();
    session.dispatch(tapEntity(session, `opt-${wrongOptionIndex(session)}`));
    const during = session.getView().entities;
    const eqIds = new Set(session.getEquations().map((e) => e.equation_id));
    for (const e of during.filter((x) => eqIds.has(x.id))) {
      expect(e.state).toBe("active");
    }
    session.update(1000);
    const after = session.getView().entities;
    for (const e of after) {
      expect(e.state).not.toBe("incorrect");
      expect(e.state).not.toBe("active");
    }
  });

  it("trạng thái sai của phương án chỉ tồn tại trong nhịp, kể cả khi chưa có khung vẽ nào dọn nó", () => {
    const session = build();
    session.dispatch(tapEntity(session, `opt-${wrongOptionIndex(session)}`));
    const opt = (): string | undefined =>
      session
        .getView()
        .entities.find((e) => e.id === `opt-${wrongOptionIndex(session)}`)
        ?.state;
    expect(opt()).toBe("incorrect");
    session.update(1000);
    expect(opt()).toBe("idle");
  });
});
