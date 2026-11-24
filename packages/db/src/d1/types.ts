export type D1BindValue = string | number | boolean | Uint8Array | null;

export type D1CellValue = string | number | boolean | Uint8Array | null;

export interface MinimalD1ExecResult {
  readonly count: number;
  readonly duration: number;
}

export interface MinimalD1RunResult {
  readonly success: boolean;
  readonly meta?: {
    readonly changes?: number;
    readonly last_row_id?: number;
  };
}

export interface MinimalD1PreparedStatement {
  bind(...values: D1BindValue[]): MinimalD1PreparedStatement;
  raw(options: { columnNames: true }): Promise<[string[], ...D1CellValue[][]]>;
  raw(options?: { columnNames?: false }): Promise<D1CellValue[][]>;
  run(): Promise<MinimalD1RunResult>;
}

export interface MinimalD1Database {
  prepare(query: string): MinimalD1PreparedStatement;
  batch(
    statements: MinimalD1PreparedStatement[]
  ): Promise<MinimalD1RunResult[]>;
  exec(query: string): Promise<MinimalD1ExecResult>;
}

export interface D1ShardBindings {
  readonly core: MinimalD1Database;
}

export type D1BindingInput = MinimalD1Database | D1ShardBindings;
