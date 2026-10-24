import { z } from "zod";

export const GuideSchema = z.object({
  goal: z.string().optional(),
  outcome: z.string().optional(),
  materials: z.string().optional(),
  preparation: z.union([z.array(z.string()), z.string()]).optional(),
  opening: z.string().optional(),
  if_child_succeeds: z.string().optional(),
  if_child_needs_help: z.string().optional(),
});

export type ParsedLessonGuide = z.infer<typeof GuideSchema>;

export const ActivityInstructionSchema = z.object({
  preparation: z.string().optional(),
  steps: z
    .array(
      z.object({
        instruction: z.string(),
        say_to_child: z.string().optional(),
      })
    )
    .optional(),
  easier: z.string().optional(),
  harder: z.string().optional(),
});

export type ParsedActivityInstruction = z.infer<
  typeof ActivityInstructionSchema
>;

export interface StepDetail {
  stepIndex: number;
  kind: "warm_up" | "off_screen" | "digital_game" | "reflection" | "assessment";
  outcome: "pending" | "done" | "skipped";
  activity?: {
    id: number;
    code: string;
    kind: string;
    title: string;
    instruction: string | null;
    gameLevelCode?: string | null;
  } | null;
}

export interface LessonSession {
  runUuid: string;
  lesson: {
    id: number;
    code: string;
    title: string;
    contentVersion: number;
    guide: Record<string, string | string[] | undefined> | string | null;
    materials?: string | null;
    warmUp?: string | null;
    reflection?: string | null;
    assessment?: string | null;
    extension?: string | null;
    status: string;
  };
  steps: StepDetail[];
  currentStep: number;
  status: "in_progress" | "completed" | "abandoned";
}

export function parseLessonGuide(
  raw: Record<string, string | string[] | undefined> | string | null | undefined
): ParsedLessonGuide | null {
  if (!raw) {
    return null;
  }
  if (typeof raw === "string") {
    try {
      const parsedJson: Record<string, string | string[] | undefined> =
        JSON.parse(raw);
      const res = GuideSchema.safeParse(parsedJson);
      return res.success ? res.data : null;
    } catch {
      return null;
    }
  }
  const result = GuideSchema.safeParse(raw);
  return result.success ? result.data : null;
}

export function parseStepInstruction(
  raw: string | null | undefined
): ParsedActivityInstruction | null {
  if (!raw || typeof raw !== "string") {
    return null;
  }
  try {
    const parsedJson: Record<string, string | object | undefined> =
      JSON.parse(raw);
    const res = ActivityInstructionSchema.safeParse(parsedJson);
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

export function formatStepKind(kind: string): string {
  switch (kind) {
    case "warm_up":
      return "Khởi động & Trò chuyện";
    case "off_screen":
      return "Hoạt động ngoài màn hình";
    case "digital_game":
      return "Trò chơi tương tác";
    case "reflection":
      return "Đúc kết & Thảo luận";
    case "assessment":
      return "Quan sát & Đánh giá";
    default:
      return "Hoạt động";
  }
}

function readNonEmptyStringProperty(
  target: object,
  key: string
): string | null {
  if (!(key in target)) {
    return null;
  }
  const val = Reflect.get(target, key);
  return typeof val === "string" && val.length > 0 ? val : null;
}

export function extractErrorMessage(err: object | null | undefined): string {
  if (!err || typeof err !== "object") {
    return "Không thể kết nối đến tiết học.";
  }
  const directMsg = readNonEmptyStringProperty(err, "message");
  if (directMsg) {
    return directMsg;
  }
  if ("data" in err) {
    const payload = Reflect.get(err, "data");
    if (payload && typeof payload === "object") {
      const nestedMsg = readNonEmptyStringProperty(payload, "message");
      if (nestedMsg) {
        return nestedMsg;
      }
    }
  }
  return "Không thể kết nối đến tiết học.";
}
