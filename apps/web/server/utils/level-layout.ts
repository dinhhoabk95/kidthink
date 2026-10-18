import {
  LayoutNotSupportedError,
  TemplateNotSupportedError,
} from "@mindkid/errors/game-level";
import { getGameTemplate } from "@mindkid/game-engine/registry";

export function assertTemplateLayoutSupported(
  templateCode: string,
  difficultyParams?: object | null
): void {
  const template = getGameTemplate(templateCode);
  if (!template) {
    throw new TemplateNotSupportedError(
      `Template ${templateCode} is not supported`
    );
  }
  if (!(difficultyParams && "layout_id" in difficultyParams)) {
    return;
  }
  const rawLayoutId = difficultyParams.layout_id;
  if (typeof rawLayoutId !== "string" || rawLayoutId.length === 0) {
    return;
  }
  if (!template.layouts.some((layoutId) => layoutId === rawLayoutId)) {
    throw new LayoutNotSupportedError(
      `Layout '${rawLayoutId}' is not supported by template '${templateCode}' (BR-LAY-02)`
    );
  }
}
