import { describe, expect, it } from "vitest";
import { TEMPLATE_SEED_ENTRIES } from "#src/index";
import {
  bandsOf,
  canvasBoxOf,
  casesFor,
  SHELL_VIEWPORTS,
} from "../layout/helpers/shell-frame.ts";
import {
  DROP_JITTER_RATIO,
  type DropSnapReport,
  probeDropSnap,
  rejectedJitters,
} from "./drop-snap-probe.ts";
import {
  lenientDropSubject,
  STRICT_TARGET,
  strictDropSubject,
} from "./fixtures/strict-drop/strict-drop-subject.ts";

/**
 * Sổ nợ `KNOWN_STRICT_DROP` — `BR-ENG-19`: template có verb `drop` mà thả lệch tâm
 * đích 0,4 × sàn chạm (4 hướng) bị nhận khác thả tâm. Bậc thang hai chiều: thêm
 * template vi phạm thì đỏ; template đã lành mà còn trong sổ cũng đỏ.
 */
const KNOWN_STRICT_DROP: Readonly<Record<string, string>> = {
  "GT-030":
    "Vùng hút bị kẹp ≤ nửa cạnh đơn vị để thả chồng/qua một ô vẫn hiện vạch chồng (BR-E030-06); đơn vị co còn 38-64 logic (level 6-10 đơn vị, BR-E030-08) nên nửa cạnh nhỏ hơn 0,4 x sàn chạm. Đánh đổi có chủ đích giữa bài dạy đo và BR-ENG-19",
  "GT-024":
    "Thả là đoạn thẳng cắt đường chấm: ô trúng là ô mà đoạn đi qua, không phải điểm thả; đổi điểm thả đổi đoạn thẳng. Cần quyết định spec riêng cho nét kéo",
  "GT-013":
    "Thả là nét vẽ qua ô mê cung: đường nội suy từ ô đầu tới điểm thả đổi theo điểm thả (đường chéo qua ô nào), đích không phải một ô để hút. Cần quyết định spec riêng cho đường đi",
};

/** Template khai verb `drop` mà phép thử không dựng được lần thả nào để đo. */
const KNOWN_UNPROBED: Readonly<Record<string, string>> = {};

const BANDS = ["3-4", "4-5", "5-6"] as const;
const BOX_FOR = (band: (typeof BANDS)[number]) =>
  canvasBoxOf(SHELL_VIEWPORTS[0] ?? { name: "", w: 360, h: 640 }, band, "play");

interface CodeResult {
  probed: number;
  rejected: string[];
  dragCases: number;
}

async function measure(): Promise<Map<string, CodeResult>> {
  const out = new Map<string, CodeResult>();
  for (const entry of TEMPLATE_SEED_ENTRIES) {
    const code = entry.templateCode;
    const acc: CodeResult = { probed: 0, rejected: [], dragCases: 0 };
    for (const band of bandsOf(code, BANDS)) {
      for (const { config } of casesFor(code, band)) {
        const r: DropSnapReport | null = await probeDropSnap(
          code,
          config,
          band,
          BOX_FOR(band)
        );
        if (r) {
          acc.dragCases++;
          acc.probed += r.probed;
          acc.rejected.push(...r.rejected.map((m) => `${band} ${m}`));
        }
      }
    }
    if (acc.dragCases > 0) {
      out.set(code, acc);
    }
  }
  return out;
}

describe("Gate drop-snap-tolerance — thả lệch tâm đích vẫn được nhận (BR-ENG-19)", () => {
  it("mọi template kéo-thả nhận thả lệch 0,4 x sàn chạm như thả tâm; sổ nợ khớp đúng", async () => {
    const results = await measure();
    const strict = [...results]
      .filter(([, r]) => r.rejected.length > 0)
      .map(([code]) => code)
      .sort();
    const unprobed = [...results]
      .filter(([, r]) => r.probed === 0)
      .map(([code]) => code)
      .sort();
    const knownStrict = Object.keys(KNOWN_STRICT_DROP).sort();
    const knownUnprobed = Object.keys(KNOWN_UNPROBED).sort();
    expect({
      strictAdded: strict.filter((c) => !knownStrict.includes(c)),
      strictFixed: knownStrict.filter((c) => !strict.includes(c)),
      unprobedAdded: unprobed.filter((c) => !knownUnprobed.includes(c)),
      unprobedFixed: knownUnprobed.filter((c) => !unprobed.includes(c)),
    }).toEqual({
      strictAdded: [],
      strictFixed: [],
      unprobedAdded: [],
      unprobedFixed: [],
    });
  }, 300_000);

  it("ca âm: đích chỉ nhận đúng tâm bị phép thử báo đỏ ở cả bốn hướng", () => {
    const centre = {
      type: "drop" as const,
      fromX: 10,
      fromY: 10,
      toX: STRICT_TARGET.x,
      toY: STRICT_TARGET.y,
      timeMs: 0,
    };
    const space = { w: 540, h: 810 };
    const jitter = DROP_JITTER_RATIO * 96;
    expect(rejectedJitters(strictDropSubject, centre, jitter, space)).toEqual([
      "trái",
      "phải",
      "trên",
      "dưới",
    ]);
    expect(rejectedJitters(lenientDropSubject, centre, jitter, space)).toEqual(
      []
    );
  });
});
