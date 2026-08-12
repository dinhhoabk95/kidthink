CREATE TABLE IF NOT EXISTS "content_seed_batches" (
  "id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "batch_code" varchar(60) NOT NULL UNIQUE,
  "kind" varchar(40) NOT NULL,
  "git_sha" varchar(40),
  "pr_url" varchar(255),
  "approved_by_manager_id" bigint REFERENCES "managers"("id"),
  "rows_inserted" integer NOT NULL DEFAULT 0,
  "gate_results" jsonb,
  "seeded_at" timestamp with time zone NOT NULL DEFAULT now()
);
