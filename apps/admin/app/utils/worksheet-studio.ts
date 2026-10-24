import type {
  WorksheetContentBlock,
  WorksheetLayoutTemplate,
} from "@mindkid/shared/client";

export interface WorksheetItem {
  id: number;
  entity_id: number;
  code: string;
  content_version: number;
  title: string;
  layout_template: WorksheetLayoutTemplate;
  content_blocks: WorksheetContentBlock;
  instructions: string;
  learning_objective_ids: number[];
  access_tier: string;
  status: string;
  render_status?: string | null;
  render_job_id?: string | null;
  render_input_hash?: string | null;
  render_page_count?: number | null;
  render_grayscale_passed?: boolean | null;
  pdf_path?: string | null;
}

export interface WorksheetApiPayload {
  id: number;
  entity_id?: number;
  entityId?: number;
  code: string;
  content_version?: number;
  contentVersion?: number;
  title: string;
  layout_template?: WorksheetLayoutTemplate;
  layoutTemplate?: WorksheetLayoutTemplate;
  content_blocks?: WorksheetContentBlock | null;
  contentBlocks?: WorksheetContentBlock | null;
  instructions?: string | null;
  learning_objective_ids?: number[] | null;
  learningObjectiveIds?: number[] | null;
  access_tier?: string;
  accessTier?: string;
  status: string;
  render_status?: string | null;
  renderStatus?: string | null;
  render_job_id?: string | null;
  renderJobId?: string | null;
  render_input_hash?: string | null;
  renderInputHash?: string | null;
  render_page_count?: number | null;
  renderPageCount?: number | null;
  render_grayscale_passed?: boolean | null;
  renderGrayscalePassed?: boolean | null;
  pdf_path?: string | null;
  pdfPath?: string | null;
}

export const defaultBlocksByTemplate: Record<
  WorksheetLayoutTemplate,
  WorksheetContentBlock
> = {
  pattern_coloring: {
    template: "pattern_coloring",
    rule_sequence: ["circle", "triangle"],
    rows: [
      {
        row_id: "r1",
        items: [
          { id: "1", shape: "circle", is_blank: false, size_mm: 25 },
          { id: "2", shape: "triangle", is_blank: false, size_mm: 25 },
          { id: "3", shape: "circle", is_blank: true, size_mm: 25 },
          { id: "4", shape: "triangle", is_blank: true, size_mm: 25 },
        ],
      },
    ],
    stroke_pt: 2.5,
  },
  pair_matching: {
    template: "pair_matching",
    left_column: [
      { id: "L1", shape: "circle", size_mm: 25 },
      { id: "L2", shape: "square", size_mm: 25 },
    ],
    right_column: [
      { id: "R1", shape: "circle", size_mm: 25 },
      { id: "R2", shape: "square", size_mm: 25 },
    ],
    correct_pairs: [
      { left_id: "L1", right_id: "R1" },
      { left_id: "L2", right_id: "R2" },
    ],
    stroke_pt: 2.0,
  },
  group_circling: {
    template: "group_circling",
    visual_target_symbol: "star",
    items: [
      {
        id: "1",
        item_type: "star",
        is_target: true,
        pos_x_pct: 20,
        pos_y_pct: 30,
        size_mm: 22,
      },
      {
        id: "2",
        item_type: "circle",
        is_target: false,
        pos_x_pct: 60,
        pos_y_pct: 40,
        size_mm: 22,
      },
      {
        id: "3",
        item_type: "star",
        is_target: true,
        pos_x_pct: 80,
        pos_y_pct: 70,
        size_mm: 22,
      },
    ],
    target_count: 2,
    stroke_pt: 2.0,
  },
  shape_completion: {
    template: "shape_completion",
    items: [
      {
        id: "1",
        base_shape: "circle",
        missing_part: "half",
        dash_stroke_pt: 2.0,
        size_mm: 35,
      },
      {
        id: "2",
        base_shape: "square",
        missing_part: "outline_dash",
        dash_stroke_pt: 2.0,
        size_mm: 35,
      },
    ],
    stroke_pt: 2.0,
  },
  count_and_color: {
    template: "count_and_color",
    groups: [
      {
        id: "g1",
        item_symbol: "star",
        item_count: 4,
        max_boxes: 5,
        box_size_mm: 20,
      },
    ],
    stroke_pt: 2.0,
  },
  spot_differences: {
    template: "spot_differences",
    scene_theme: "farm",
    differences_count: 3,
    spots: [
      {
        spot_id: "s1",
        x_pct: 25,
        y_pct: 30,
        radius_mm: 12,
        description_adult: "Thiếu mào gà",
      },
      {
        spot_id: "s2",
        x_pct: 70,
        y_pct: 50,
        radius_mm: 12,
        description_adult: "Ngôi sao trên mái",
      },
      {
        spot_id: "s3",
        x_pct: 45,
        y_pct: 80,
        radius_mm: 12,
        description_adult: "Bụi cỏ",
      },
    ],
    stroke_pt: 2.0,
  },
};

export function normalizeWorksheetPayload(
  raw: WorksheetApiPayload
): WorksheetItem {
  const tmpl = raw.layout_template ?? raw.layoutTemplate ?? "pattern_coloring";
  const blocks =
    raw.content_blocks ?? raw.contentBlocks ?? defaultBlocksByTemplate[tmpl];
  const rawObjectives = raw.learning_objective_ids ?? raw.learningObjectiveIds;
  const objectives =
    Array.isArray(rawObjectives) && rawObjectives.length > 0
      ? rawObjectives
      : [1];
  return {
    id: raw.id,
    entity_id: raw.entity_id ?? raw.entityId ?? raw.id,
    code: raw.code,
    content_version: raw.content_version ?? raw.contentVersion ?? 1,
    title: raw.title,
    layout_template: tmpl,
    content_blocks: blocks,
    instructions: raw.instructions ?? "",
    learning_objective_ids: objectives,
    access_tier: raw.access_tier ?? raw.accessTier ?? "standard",
    status: raw.status,
    render_status: raw.render_status ?? raw.renderStatus ?? "pending",
    render_job_id: raw.render_job_id ?? raw.renderJobId ?? null,
    render_input_hash: raw.render_input_hash ?? raw.renderInputHash ?? null,
    render_page_count: raw.render_page_count ?? raw.renderPageCount ?? null,
    render_grayscale_passed:
      raw.render_grayscale_passed ?? raw.renderGrayscalePassed ?? null,
    pdf_path: raw.pdf_path ?? raw.pdfPath ?? null,
  };
}

export function getTemplateIcon(tmpl: string): string {
  const map: Record<string, string> = {
    pattern_coloring: "i-lucide-palette",
    pair_matching: "i-lucide-link",
    group_circling: "i-lucide-circle",
    shape_completion: "i-lucide-pencil",
    count_and_color: "i-lucide-hash",
    spot_differences: "i-lucide-search",
  };
  return map[tmpl] || "i-lucide-file-text";
}

export function getTierBadgeClass(tier: string): string {
  if (tier === "free") {
    return "bg-success-100 text-success-800";
  }
  if (tier === "login" || tier === "standard") {
    return "bg-brand-100 text-brand-800";
  }
  return "bg-warning-100 text-warning-800";
}

export function getStatusBadgeClass(status?: string): string {
  if (status === "published") {
    return "bg-success-500 text-white";
  }
  if (status === "approved") {
    return "bg-brand-500 text-white";
  }
  if (status === "in_review") {
    return "bg-warning-500 text-white";
  }
  if (status === "archived") {
    return "bg-surface-400 text-white";
  }
  return "bg-surface-200 text-surface-700 dark:bg-surface-700 dark:text-surface-300";
}
