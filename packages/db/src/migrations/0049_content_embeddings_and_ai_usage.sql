CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS content_embeddings (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  content_type varchar(30) NOT NULL,
  content_id bigint NOT NULL,
  content_version integer NOT NULL,
  model varchar(60) NOT NULL,
  embedding vector(1536) NOT NULL,
  chunk_index integer NOT NULL DEFAULT 0,
  chunk_text text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_embeddings_unique 
  ON content_embeddings (content_type, content_id, content_version, model, chunk_index);

CREATE INDEX IF NOT EXISTS idx_content_embeddings_lookup 
  ON content_embeddings (content_type, content_id, content_version);

CREATE INDEX IF NOT EXISTS idx_content_embeddings_model 
  ON content_embeddings (model);

CREATE TABLE IF NOT EXISTS ai_usage_log (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  uuid uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature varchar(60) NOT NULL,
  credits_spent integer NOT NULL DEFAULT 0,
  model varchar(60) NOT NULL,
  prompt_version varchar(40) NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  cost_usd_micros integer NOT NULL DEFAULT 0,
  moderation_passed boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_user_created 
  ON ai_usage_log (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_feature_created 
  ON ai_usage_log (feature, created_at);
