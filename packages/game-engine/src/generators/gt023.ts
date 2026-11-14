import type {
  GT023Content,
  GT023Difficulty,
} from "#src/templates/GT-023/template";
import {
  getNouns,
  pickOne,
  sampleUnique,
  VALID_GENERATOR_THEMES,
} from "./helpers.js";
import type { LevelGenerator } from "./types.js";

interface BlueprintAnchor {
  readonly x: number;
  readonly y: number;
  readonly label: string;
  readonly sharedGroup?: number;
}

interface Blueprint {
  readonly anchors: readonly BlueprintAnchor[];
}

const BLUEPRINTS_2: readonly Blueprint[] = [
  {
    anchors: [
      { x: 450, y: 210, label: "Phần trên" },
      { x: 450, y: 330, label: "Phần dưới" },
    ],
  },
  {
    anchors: [
      { x: 330, y: 270, label: "Bên trái" },
      { x: 570, y: 270, label: "Bên phải" },
    ],
  },
];

const BLUEPRINTS_3: readonly Blueprint[] = [
  {
    anchors: [
      { x: 450, y: 200, label: "Thân trên" },
      { x: 350, y: 330, label: "Bánh trái", sharedGroup: 1 },
      { x: 550, y: 330, label: "Bánh phải", sharedGroup: 1 },
    ],
  },
  {
    anchors: [
      { x: 450, y: 170, label: "Đỉnh tháp" },
      { x: 450, y: 270, label: "Thân tháp" },
      { x: 450, y: 370, label: "Chân tháp" },
    ],
  },
];

const BLUEPRINTS_4: readonly Blueprint[] = [
  {
    anchors: [
      { x: 360, y: 200, label: "Góc trên trái" },
      { x: 540, y: 200, label: "Góc trên phải" },
      { x: 360, y: 340, label: "Bánh trái", sharedGroup: 1 },
      { x: 540, y: 340, label: "Bánh phải", sharedGroup: 1 },
    ],
  },
  {
    anchors: [
      { x: 360, y: 200, label: "Ô trên trái" },
      { x: 540, y: 200, label: "Ô trên phải" },
      { x: 360, y: 340, label: "Ô dưới trái" },
      { x: 540, y: 340, label: "Ô dưới phải" },
    ],
  },
];

export const GT023Generator: LevelGenerator<GT023Content, GT023Difficulty> = {
  engine: "GT-023",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["spatial", "assembly", "construction"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band, vocabulary, escalation_step = 0 }) {
    const nouns = getNouns(vocabulary, 6);
    const step = Math.max(0, escalation_step);
    let itemCount = 2;
    if (age_band === "5-6") {
      itemCount = step >= 2 ? 4 : 3;
    } else if (step >= 2) {
      itemCount = 3;
    }
    let pool = BLUEPRINTS_2;
    if (itemCount === 3) {
      pool = BLUEPRINTS_3;
    } else if (itemCount >= 4) {
      pool = BLUEPRINTS_4;
    }
    const bp = pickOne(rng, [...pool]);
    const sampled = sampleUnique(rng, nouns, itemCount + 1);
    const targetModel = sampled[0] ?? pickOne(rng, nouns);
    const partPool = sampled.slice(1);
    const groupNoun = new Map<number, (typeof nouns)[number]>();

    const anchors: GT023Content["anchors"] = [];
    const rawParts: GT023Content["parts"] = [];
    bp.anchors.forEach((spec, idx) => {
      const anchorId = `anchor_${idx + 1}`;
      const partId = `part_${idx + 1}`;
      let noun = partPool[idx] ?? targetModel;
      if (spec.sharedGroup !== undefined) {
        const existing = groupNoun.get(spec.sharedGroup);
        if (existing) {
          noun = existing;
        } else {
          groupNoun.set(spec.sharedGroup, noun);
        }
      }
      anchors.push({
        anchor_id: anchorId,
        x: spec.x,
        y: spec.y,
        accepted_part_id: partId,
        label: spec.label,
      });
      rawParts.push({
        part_id: partId,
        target_anchor_id: anchorId,
        asset: { kind: "emoji", ref: noun.emoji_ref },
        name: noun.label_vi,
      });
    });

    const parts = sampleUnique(rng, rawParts, rawParts.length);
    const snapRadius = age_band === "4-5" ? 68 : Math.max(52, 64 - step * 4);
    const showOutline = age_band === "4-5" ? true : step < 3;

    return {
      content_pack: {
        prompt: "Bé hãy ghép các mảnh ghép vào đúng vị trí nhé!",
        target_model: {
          name: targetModel.label_vi,
          asset: { kind: "emoji", ref: targetModel.emoji_ref },
        },
        anchors,
        parts,
      },
      difficulty_params: {
        item_count: anchors.length,
        snap_radius_px: snapRadius,
        show_anchor_outline: showOutline,
        hint_after_ms: age_band === "4-5" ? 8000 : 10_000,
        allow_retry: true,
      },
    };
  },
};
