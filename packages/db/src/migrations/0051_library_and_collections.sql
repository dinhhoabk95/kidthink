CREATE TABLE IF NOT EXISTS collections (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  position smallint NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT collections_user_name_unique UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections (user_id);

CREATE TABLE IF NOT EXISTS library_items (
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type varchar(30) NOT NULL,
  entity_id bigint NOT NULL,
  collection_id bigint REFERENCES collections(id) ON DELETE SET NULL,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, entity_type, entity_id),
  CONSTRAINT check_library_entity_type CHECK (entity_type IN ('game_level', 'lesson', 'curriculum', 'activity'))
);

CREATE INDEX IF NOT EXISTS idx_library_items_user_collection ON library_items (user_id, collection_id);

CREATE TABLE IF NOT EXISTS user_tag_map (
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tag_id bigint NOT NULL REFERENCES content_tags(id) ON DELETE CASCADE,
  entity_type varchar(30) NOT NULL,
  entity_id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tag_id, entity_type, entity_id),
  CONSTRAINT check_user_tag_entity_type CHECK (entity_type IN ('game_level', 'lesson', 'curriculum', 'activity'))
);

CREATE INDEX IF NOT EXISTS idx_user_tag_map_user_tag ON user_tag_map (user_id, tag_id);
