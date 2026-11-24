export interface IntEnumCodec<TCode extends number, TLabel extends string> {
  readonly values: readonly TCode[];
  readonly labels: readonly TLabel[];
  readonly entries: readonly (readonly [TCode, TLabel])[];
  readonly toLabel: (code: TCode) => TLabel;
  readonly toCode: (label: TLabel) => TCode;
  readonly parseCode: (input: number | string) => TCode | null;
  readonly parseLabel: (input: string) => TLabel | null;
  readonly isCode: (value: number) => value is TCode;
  readonly isLabel: (value: string) => value is TLabel;
}

export function createIntEnumCodec<TCode extends number, TLabel extends string>(
  entries: readonly (readonly [TCode, TLabel])[]
): IntEnumCodec<TCode, TLabel> {
  const values: TCode[] = [];
  const labels: TLabel[] = [];
  const codeToLabel = new Map<TCode, TLabel>();
  const labelToCode = new Map<TLabel, TCode>();

  for (const [code, label] of entries) {
    values.push(code);
    labels.push(label);
    codeToLabel.set(code, label);
    labelToCode.set(label, code);
  }

  return {
    values,
    labels,
    entries,
    toLabel(code: TCode): TLabel {
      const label = codeToLabel.get(code);
      if (label === undefined) {
        throw new Error(`Invalid enum code: ${String(code)}`);
      }
      return label;
    },
    toCode(label: TLabel): TCode {
      const code = labelToCode.get(label);
      if (code === undefined) {
        throw new Error(`Invalid enum label: ${label}`);
      }
      return code;
    },
    parseCode(input: number | string): TCode | null {
      const num = typeof input === "number" ? input : Number(input);
      if (Number.isInteger(num) && codeToLabel.has(num as TCode)) {
        return num as TCode;
      }
      if (typeof input === "string") {
        const byLabel = labelToCode.get(input as TLabel);
        if (byLabel !== undefined) {
          return byLabel;
        }
      }
      return null;
    },
    parseLabel(input: string): TLabel | null {
      return labelToCode.has(input as TLabel) ? (input as TLabel) : null;
    },
    isCode(value: number): value is TCode {
      return codeToLabel.has(value as TCode);
    },
    isLabel(value: string): value is TLabel {
      return labelToCode.has(value as TLabel);
    },
  };
}
