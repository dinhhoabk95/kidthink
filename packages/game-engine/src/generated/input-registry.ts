/** @generated from TEMPLATES@a1b2c3d4 — DO NOT EDIT MANUALLY (BR-TAK-03) */

import type { EngineInputConfig } from "#src/contracts/types";
import GT000Template from "#src/templates/GT-000/template";
import GT001Template from "#src/templates/GT-001/template";
import GT002Template from "#src/templates/GT-002/template";
import GT003Template from "#src/templates/GT-003/template";
import GT004Template from "#src/templates/GT-004/template";
import GT005Template from "#src/templates/GT-005/template";
import GT006Template from "#src/templates/GT-006/template";
import GT007Template from "#src/templates/GT-007/template";
import GT008Template from "#src/templates/GT-008/template";
import GT009Template from "#src/templates/GT-009/template";
import GT010Template from "#src/templates/GT-010/template";
import GT011Template from "#src/templates/GT-011/template";
import GT012Template from "#src/templates/GT-012/template";
import GT013Template from "#src/templates/GT-013/template";
import GT014Template from "#src/templates/GT-014/template";
import GT015Template from "#src/templates/GT-015/template";
import GT016Template from "#src/templates/GT-016/template";
import GT017Template from "#src/templates/GT-017/template";
import GT018Template from "#src/templates/GT-018/template";
import GT019Template from "#src/templates/GT-019/template";
import GT020Template from "#src/templates/GT-020/template";
import GT021Template from "#src/templates/GT-021/template";
import GT022Template from "#src/templates/GT-022/template";
import GT023Template from "#src/templates/GT-023/template";
import GT024Template from "#src/templates/GT-024/template";
import GT025Template from "#src/templates/GT-025/template";
import GT026Template from "#src/templates/GT-026/template";
import GT027Template from "#src/templates/GT-027/template";
import GT028Template from "#src/templates/GT-028/template";
import GT029Template from "#src/templates/GT-029/template";
import GT030Template from "#src/templates/GT-030/template";
import GT031Template from "#src/templates/GT-031/template";
import GT032Template from "#src/templates/GT-032/template";
import GT033Template from "#src/templates/GT-033/template";
import GT034Template from "#src/templates/GT-034/template";
import GT035Template from "#src/templates/GT-035/template";
import GT036Template from "#src/templates/GT-036/template";

export const TEMPLATE_INPUT_REGISTRY: Record<string, EngineInputConfig | undefined> = {
  "GT-000": GT000Template.input,
  "GT-001": GT001Template.input,
  "GT-002": GT002Template.input,
  "GT-003": GT003Template.input,
  "GT-004": GT004Template.input,
  "GT-005": GT005Template.input,
  "GT-006": GT006Template.input,
  "GT-007": GT007Template.input,
  "GT-008": GT008Template.input,
  "GT-009": GT009Template.input,
  "GT-010": GT010Template.input,
  "GT-011": GT011Template.input,
  "GT-012": GT012Template.input,
  "GT-013": GT013Template.input,
  "GT-014": GT014Template.input,
  "GT-015": GT015Template.input,
  "GT-016": GT016Template.input,
  "GT-017": GT017Template.input,
  "GT-018": GT018Template.input,
  "GT-019": GT019Template.input,
  "GT-020": GT020Template.input,
  "GT-021": GT021Template.input,
  "GT-022": GT022Template.input,
  "GT-023": GT023Template.input,
  "GT-024": GT024Template.input,
  "GT-025": GT025Template.input,
  "GT-026": GT026Template.input,
  "GT-027": GT027Template.input,
  "GT-028": GT028Template.input,
  "GT-029": GT029Template.input,
  "GT-030": GT030Template.input,
  "GT-031": GT031Template.input,
  "GT-032": GT032Template.input,
  "GT-033": GT033Template.input,
  "GT-034": GT034Template.input,
  "GT-035": GT035Template.input,
  "GT-036": GT036Template.input,
};

export function getTemplateInput(code: string): EngineInputConfig | undefined {
  return TEMPLATE_INPUT_REGISTRY[code];
}
