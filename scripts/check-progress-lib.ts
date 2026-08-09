export interface ProgressSpec {
  id: string;
  phase: string;
  rel: string;
  status: string;
  businessRuleIds: string[];
}

export interface PromotedCheckbox {
  label?: string;
  phase?: string;
  section: string;
  line: string;
  lineNumber: number;
  specRefs: string[];
}

export interface ProgressViolation {
  code:
    | "IMPLEMENTED_SPEC_WITHOUT_BR_TEST"
    | "PHASE_NOT_IMPLEMENTED"
    | "PROGRESS_TICK_WITHOUT_EVIDENCE"
    | "STEP_SPEC_NOT_IMPLEMENTED";
  message: string;
}

interface Checkbox extends PromotedCheckbox {
  checked: boolean;
  key: string;
}

interface ValidateProgressInput {
  beforeChecklist: string;
  afterChecklist: string;
  changedPaths: string[];
  specs: ProgressSpec[];
  testContents: string[];
}

const CHECKBOX_PATTERN = /^- \[([ xX])\]\s+(.+)$/;
const HEADING_PATTERN = /^##\s+(.+)$/;
const LABEL_PATTERN = /\*\*(P\d+(?:\.[\da-z]+)?)\*\*/i;
const PHASE_PATTERN = /\b(P\d+)\b/i;
const PHASE_GATE_SECTION_PATTERN = /^Cổng ra P\d+/;
const SPEC_LINK_PATTERN = /\]\(\.\.\/specs\/([^)]+\.md)\)/g;

function checkboxKey(section: string, body: string): string {
  const label = LABEL_PATTERN.exec(body)?.[1]?.toUpperCase();
  return label ?? `${section}::${body}`;
}

function parseCheckboxes(content: string): Checkbox[] {
  const checkboxes: Checkbox[] = [];
  let section = "";

  for (const [index, line] of content.split("\n").entries()) {
    const heading = HEADING_PATTERN.exec(line)?.[1];
    if (heading) {
      section = heading;
      continue;
    }

    const match = CHECKBOX_PATTERN.exec(line);
    if (!match) {
      continue;
    }

    const body = match[2] ?? "";
    const label = LABEL_PATTERN.exec(body)?.[1]?.toUpperCase();
    const sectionPhase = PHASE_PATTERN.exec(section)?.[1]?.toUpperCase();
    const labelPhase = label?.split(".")[0];
    const specRefs = [...body.matchAll(SPEC_LINK_PATTERN)].map(
      (item) => item[1] ?? ""
    );

    checkboxes.push({
      checked: (match[1] ?? "").toLowerCase() === "x",
      key: checkboxKey(section, body),
      label,
      phase: labelPhase ?? sectionPhase,
      section,
      line,
      lineNumber: index + 1,
      specRefs,
    });
  }

  return checkboxes;
}

export function findPromotedCheckboxes(
  beforeChecklist: string,
  afterChecklist: string
): PromotedCheckbox[] {
  const beforeByKey = new Map(
    parseCheckboxes(beforeChecklist).map((checkbox) => [checkbox.key, checkbox])
  );

  return parseCheckboxes(afterChecklist).filter((checkbox) => {
    if (!checkbox.checked) {
      return false;
    }
    return beforeByKey.get(checkbox.key)?.checked !== true;
  });
}

function hasNonDocumentationEvidence(changedPaths: string[]): boolean {
  return changedPaths.some(
    (path) =>
      path !== "docs/tasks/14-implementation-sequence-todo.md" &&
      !path.startsWith("docs/")
  );
}

function validateImplementedSpecTests(
  specs: ProgressSpec[],
  testContents: string[]
): ProgressViolation[] {
  return specs
    .filter((spec) => spec.status === "implemented")
    .filter(
      (spec) =>
        !spec.businessRuleIds.some((ruleId) =>
          testContents.some((content) => content.includes(ruleId))
        )
    )
    .map((spec) => ({
      code: "IMPLEMENTED_SPEC_WITHOUT_BR_TEST" as const,
      message: `${spec.rel}: status implemented nhưng chưa có test tham chiếu BR do spec sở hữu`,
    }));
}

function validateStepSpecs(
  promoted: PromotedCheckbox[],
  specs: ProgressSpec[]
): ProgressViolation[] {
  const specsByRel = new Map(specs.map((spec) => [spec.rel, spec]));
  return promoted
    .filter((checkbox) => checkbox.label)
    .flatMap((checkbox) =>
      checkbox.specRefs
        .filter((rel) => specsByRel.get(rel)?.status !== "implemented")
        .map((rel) => ({
          code: "STEP_SPEC_NOT_IMPLEMENTED" as const,
          message: `${checkbox.label ?? `dòng ${checkbox.lineNumber}`}: ${rel} chưa implemented`,
        }))
    );
}

function validatePhaseGates(
  promoted: PromotedCheckbox[],
  specs: ProgressSpec[]
): ProgressViolation[] {
  return promoted
    .filter(
      (checkbox) =>
        PHASE_GATE_SECTION_PATTERN.test(checkbox.section) && checkbox.phase
    )
    .flatMap((checkbox) => {
      const pending = specs.filter(
        (spec) => spec.phase === checkbox.phase && spec.status !== "implemented"
      );
      return pending.length === 0
        ? []
        : [
            {
              code: "PHASE_NOT_IMPLEMENTED" as const,
              message: `${checkbox.phase} còn ${pending.length} spec chưa implemented: ${pending
                .map((spec) => spec.id)
                .join(", ")}`,
            },
          ];
    });
}

export function validateProgress({
  beforeChecklist,
  afterChecklist,
  changedPaths,
  specs,
  testContents,
}: ValidateProgressInput): ProgressViolation[] {
  const promoted = findPromotedCheckboxes(beforeChecklist, afterChecklist);
  const evidenceViolation: ProgressViolation[] =
    promoted.length > 0 && !hasNonDocumentationEvidence(changedPaths)
      ? [
          {
            code: "PROGRESS_TICK_WITHOUT_EVIDENCE",
            message:
              "Checklist có ô mới được tick nhưng diff không chạm file nào ngoài docs/",
          },
        ]
      : [];

  return [
    ...validateImplementedSpecTests(specs, testContents),
    ...evidenceViolation,
    ...validateStepSpecs(promoted, specs),
    ...validatePhaseGates(promoted, specs),
  ];
}
