import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { RenderSystem } from "#src/systems/render-system";
import { GT001_FIXTURES } from "#src/templates/GT-001/fixtures";
import { GT001Session } from "#src/templates/GT-001/session";

/**
 * Chọn sai không được vẽ bằng vòng gợi ý nét đứt (`drawScaffoldingHighlight`):
 * đó là tín hiệu "chạm vào đây" của thang trợ giúp. Rung tại chỗ phải tắt khi
 * bật giảm chuyển động.
 */

interface CtxStub {
  readonly ctx: CanvasRenderingContext2D;
  readonly calls: string[];
}

/** Ctx giả: mọi phương thức là no-op, ghi lại tên và tham số số của mỗi lời gọi. */
function stubContext(): CtxStub {
  const calls: string[] = [];
  const gradient: Pick<CanvasGradient, "addColorStop"> = {
    addColorStop: (): void => undefined,
  };
  const known: Partial<CanvasRenderingContext2D> = {
    measureText: (text: string) => ({ width: text.length * 8 }) as TextMetrics,
    createLinearGradient: () => gradient as CanvasGradient,
    createRadialGradient: () => gradient as CanvasGradient,
  };
  const proxy = new Proxy(known, {
    get(obj, key: string | symbol) {
      if (typeof key === "string" && key in obj) {
        return Reflect.get(obj, key);
      }
      return (...args: readonly unknown[]): void => {
        const nums = args.filter((a) => typeof a === "number");
        calls.push(
          `${String(key)}(${nums.map((n) => n.toFixed(1)).join(",")})`
        );
      };
    },
    set(obj, key: string | symbol, value: unknown) {
      return Reflect.set(obj, key, value);
    },
  });
  return { ctx: proxy as CanvasRenderingContext2D, calls };
}

function wrongPick(reducedMotion: boolean) {
  const fixture = GT001_FIXTURES[0];
  if (!fixture) {
    throw new Error("Thiếu fixture GT-001");
  }
  const session = new GT001Session(fixture.content, fixture.difficulty, 1);
  session.prepareRound("4-5", DEFAULT_LOGIC_SPACE);
  const wrong = fixture.content.options.find((o) => !o.is_correct);
  const rs = new RenderSystem();
  rs.reducedMotion = reducedMotion;
  session.render(stubContext().ctx, rs, 0);
  session.commit({ type: "select_item", data: { item_id: wrong?.item_id } });
  return { session, rs };
}

describe("GT-001 — phản hồi chọn sai", () => {
  it("không vẽ vòng gợi ý quanh vật vừa chọn sai", () => {
    const { session, rs } = wrongPick(false);
    const hint = vi.spyOn(rs, "drawScaffoldingHighlight");
    session.render(stubContext().ctx, rs, 100);
    expect(hint).not.toHaveBeenCalled();
  });

  it("giảm chuyển động: vẽ y hệt nhau ở mọi thời điểm trong nhịp rung", () => {
    const { session, rs } = wrongPick(true);
    const a = stubContext();
    const b = stubContext();
    session.render(a.ctx, rs, 30);
    session.render(b.ctx, rs, 90);
    expect(a.calls).toEqual(b.calls);
  });
});
