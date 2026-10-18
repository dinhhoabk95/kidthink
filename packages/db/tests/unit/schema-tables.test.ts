import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { hashPassword } from "@mindkid/auth";
import { getTableColumns, getTableName, is } from "drizzle-orm";
import {
  getTableConfig,
  PgTable,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
// biome-ignore lint/performance/noNamespaceImport: dynamically iterates all schema tables
import * as schema from "#src/schema/index";
import { SEED_MANAGERS, SEED_USERS } from "#src/seed-accounts";
import {
  SEED_ENTITLEMENT_KEYS,
  SEED_PACKAGE_ENTITLEMENTS,
  SEED_PACKAGES,
} from "#src/seed-catalog";
import { extractTableNamesFromSchema, TABLES } from "#tests/global-setup";

function findTablesMissingUpdatedAt(schemaObj: object): string[] {
  const missing: string[] = [];
  for (const value of Object.values(schemaObj)) {
    if (!is(value, PgTable)) {
      continue;
    }
    const tableName = getTableName(value);
    const cols = getTableColumns(value);
    const colNames = new Set(Object.values(cols).map((col) => col.name));
    if (colNames.has("created_at") && !colNames.has("updated_at")) {
      missing.push(tableName);
    }
  }
  return missing.sort();
}

function getColumnSqlNames(table: PgTable): string[] {
  const cols = getTableColumns(table);
  return Object.values(cols).map((col) => col.name);
}

describe("Dynamic Schema Tables Extraction (G6, Task #208)", () => {
  it("trích xuất đủ các bảng từ schema/ và không thiếu bảng mới", () => {
    expect(TABLES.length).toBeGreaterThanOrEqual(84);
    expect(TABLES).toContain("skill_datasets");
    expect(TABLES).toContain("content_objective_map");
    expect(TABLES).toContain("users");
    expect(TABLES).toContain("game_levels");
    expect(TABLES).toContain("child_lesson_plays");
    expect(TABLES).toContain("child_stickers");
  });

  it("test chứng minh bắt lỗi: thêm bảng giả vào schema ⟹ xuất hiện trong danh sách trích xuất", () => {
    const fakeTable = pgTable("fake_table_for_test", {
      id: text("id").primaryKey(),
    });

    const mockSchema = {
      realUsersTable: fakeTable,
      someOtherConstant: "ignore_me",
      someFunction: () => 123,
    };

    const extracted = extractTableNamesFromSchema(mockSchema);
    expect(extracted).toEqual(["fake_table_for_test"]);
  });

  it("BR-DM-08: lesson_run_observations và mọi bảng có created_at đều có cả updated_at NOT NULL", () => {
    const obsCols = getTableColumns(schema.lessonRunObservations);
    expect(obsCols.createdAt.name).toBe("created_at");
    expect(obsCols.createdAt.notNull).toBe(true);
    expect(obsCols.updatedAt.name).toBe("updated_at");
    expect(obsCols.updatedAt.notNull).toBe(true);

    expect(findTablesMissingUpdatedAt(schema)).toEqual([]);

    const tableWithoutUpdatedAt = pgTable("missing_updated_at_table", {
      id: text("id").primaryKey(),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    });
    expect(
      findTablesMissingUpdatedAt({ broken: tableWithoutUpdatedAt })
    ).toEqual(["missing_updated_at_table"]);
  });

  it("BR-VER-03 / BR-EVT-06: play_sessions.content_version và telemetry_events.content_version đều NOT NULL", () => {
    const playCols = getTableColumns(schema.playSessions);
    const telemetryCols = getTableColumns(schema.telemetryEvents);

    expect(playCols.contentVersion.name).toBe("content_version");
    expect(playCols.contentVersion.notNull).toBe(true);

    expect(telemetryCols.contentVersion.name).toBe("content_version");
    expect(telemetryCols.contentVersion.notNull).toBe(true);
  });

  it("BR-CLC-01 / BR-SCT-05: migration 0009 và migrate.ts gắn BEFORE UPDATE trigger bảo vệ hàng published trên cả 5 bảng nội dung", () => {
    const migrationSql = readFileSync(
      resolve(
        import.meta.dirname,
        "..",
        "..",
        "src",
        "migrations",
        "0009_published_content_immutable_triggers.sql"
      ),
      "utf8"
    );
    expect(migrationSql).toContain("BR-CLC-01 / BR-SCT-05");
    for (const table of [
      "game_levels",
      "lessons",
      "activities",
      "curricula",
      "worksheets",
    ]) {
      expect(migrationSql).toContain(`BEFORE UPDATE ON ${table}`);
    }
  });
});

describe("Schema Content & Taxonomy Rules (BR-SCT-01..BR-SCT-08)", () => {
  it("BR-SCT-01: Layer 1 (competencies, strands, skills, learning_objectives, content_tags) KHÔNG dùng content_lifecycle_status", () => {
    for (const table of [
      schema.competencies,
      schema.strands,
      schema.skills,
      schema.learningObjectives,
    ]) {
      const colNames = getColumnSqlNames(table);
      expect(colNames).not.toContain("status");
      expect(colNames).not.toContain("content_version");
    }

    const tagCols = getTableColumns(schema.contentTags);
    expect(tagCols.status.enumValues).toEqual(["active", "deprecated"]);
  });

  it("BR-SCT-02 & BR-SCT-03: Layer 2 (game_levels, lessons, activities, curricula, worksheets, seo_pages) có content_version + content_lifecycle_status 6 trạng thái + UNIQUE (code/slug, content_version) + partial UNIQUE published", () => {
    const expectedLifecycle = [
      "draft",
      "in_review",
      "approved",
      "published",
      "archived",
      "rejected",
    ];
    expect(schema.contentLifecycleStatusEnum.enumValues).toEqual(
      expectedLifecycle
    );

    const layer2Specs = [
      {
        table: schema.gameLevels,
        uqName: "game_levels_code_version_unique",
        pubIdxName: "idx_game_levels_published_code",
      },
      {
        table: schema.lessons,
        uqName: "lessons_code_version_unique",
        pubIdxName: "idx_lessons_published_code",
      },
      {
        table: schema.activities,
        uqName: "activities_code_version_unique",
        pubIdxName: "idx_activities_published_code",
      },
      {
        table: schema.curricula,
        uqName: "curricula_code_version_unique",
        pubIdxName: "idx_curricula_published_code",
      },
      {
        table: schema.worksheets,
        uqName: "worksheets_code_version_unique",
        pubIdxName: "idx_worksheets_published_code",
      },
      {
        table: schema.seoPages,
        uqName: "seo_pages_slug_version_unique",
        pubIdxName: "idx_seo_pages_published_slug",
      },
    ];

    for (const { table, uqName, pubIdxName } of layer2Specs) {
      const cols = getTableColumns(table);
      expect(cols.contentVersion.name).toBe("content_version");
      expect(cols.contentVersion.notNull).toBe(true);
      expect(cols.status.name).toBe("status");
      expect(cols.status.notNull).toBe(true);
      expect(cols.status.enumValues).toEqual(expectedLifecycle);

      const cfg = getTableConfig(table);
      const uqNames = cfg.uniqueConstraints.map((u) => u.name);
      expect(uqNames).toContain(uqName);

      const pubIdx = cfg.indexes.find((idx) => idx.config.name === pubIdxName);
      expect(pubIdx).toBeDefined();
      expect(pubIdx?.config.unique).toBe(true);
      expect(pubIdx?.config.where).toBeDefined();
    }
  });

  it("BR-SCT-04: game_levels tách riêng content_pack và difficulty_params (JSONB NOT NULL) và access_tier NOT NULL không có default", () => {
    const cols = getTableColumns(schema.gameLevels);
    expect(cols.contentPack.name).toBe("content_pack");
    expect(cols.contentPack.notNull).toBe(true);
    expect(cols.difficultyParams.name).toBe("difficulty_params");
    expect(cols.difficultyParams.notNull).toBe(true);
    expect(cols.accessTier.name).toBe("access_tier");
    expect(cols.accessTier.notNull).toBe(true);
    expect(cols.accessTier.hasDefault).toBe(false);
    expect(cols.accessTier.enumValues).toEqual([
      "free",
      "login",
      "standard",
      "premium",
    ]);
  });

  it("BR-SCT-06: 5 bảng nội dung có entity_id NOT NULL làm neo dòng dõi và curriculum_items tham chiếu qua (entity_type, entity_id)", () => {
    for (const table of [
      schema.gameLevels,
      schema.lessons,
      schema.activities,
      schema.curricula,
      schema.worksheets,
    ]) {
      const cols = getTableColumns(table);
      expect(cols.entityId.name).toBe("entity_id");
      expect(cols.entityId.notNull).toBe(true);
    }

    const itemCols = getTableColumns(schema.curriculumItems);
    expect(itemCols.entityType.name).toBe("entity_type");
    expect(itemCols.entityType.notNull).toBe(true);
    expect(itemCols.entityId.name).toBe("entity_id");
    expect(itemCols.entityId.notNull).toBe(true);

    const itemCfg = getTableConfig(schema.curriculumItems);
    const idxNames = itemCfg.indexes.map((idx) => idx.config.name);
    expect(idxNames).toContain("idx_curriculum_items_entity");
    expect(idxNames).toContain("idx_curriculum_items_entity_id");

    const itemColNames = getColumnSqlNames(schema.curriculumItems);
    expect(itemColNames).not.toContain("lesson_id");
    expect(itemColNames).not.toContain("game_level_id");
    expect(itemColNames).not.toContain("activity_id");
  });

  it("BR-SCT-07 & BR-SCT-08: content_skill_map có check weight (0, 1] và cả 3 bảng map dùng content_entity_type enum 5 giá trị", () => {
    const expectedEntities = [
      "game_level",
      "lesson",
      "activity",
      "curriculum",
      "worksheet",
    ];
    expect(schema.contentEntityTypeEnum.enumValues).toEqual(expectedEntities);

    const tagMapCols = getTableColumns(schema.contentTagMap);
    const skillMapCols = getTableColumns(schema.contentSkillMap);
    const objMapCols = getTableColumns(schema.contentObjectiveMap);

    expect(tagMapCols.entityType.enumValues).toEqual(expectedEntities);
    expect(skillMapCols.entityType.enumValues).toEqual(expectedEntities);
    expect(objMapCols.entityType.enumValues).toEqual(expectedEntities);

    expect(skillMapCols.weight.name).toBe("weight");
    expect(skillMapCols.weight.notNull).toBe(true);

    const skillMapCfg = getTableConfig(schema.contentSkillMap);
    const checkNames = skillMapCfg.checks.map((c) => c.name);
    expect(checkNames).toContain("check_content_skill_map_weight");
  });
});

describe("Schema Identity & Billing Rules (BR-SIB-01..BR-SIB-13)", () => {
  it("BR-SIB-01: bảng users KHÔNG có cột role, persona, tier, package hay tenant_id", () => {
    const userColNames = getColumnSqlNames(schema.users);
    expect(userColNames).not.toContain("role");
    expect(userColNames).not.toContain("persona");
    expect(userColNames).not.toContain("tier");
    expect(userColNames).not.toContain("package");
    expect(userColNames).not.toContain("package_code");
    expect(userColNames).not.toContain("tenant_id");
  });

  it("BR-SIB-02: seed catalog chứa đúng 16 entitlement_keys (8 MVP + 8 P2) và 2 gói MVP công khai PKG-standard, PKG-premium", () => {
    expect(SEED_ENTITLEMENT_KEYS.length).toBe(16);
    expect(SEED_ENTITLEMENT_KEYS.filter((k) => k.isMvp).length).toBe(8);
    expect(SEED_ENTITLEMENT_KEYS.filter((k) => !k.isMvp).length).toBe(8);
    expect(
      SEED_PACKAGES.filter((p) => p.isPublic)
        .map((p) => p.code)
        .sort()
    ).toEqual(["PKG-premium", "PKG-standard"]);
    expect(SEED_PACKAGES.length).toBe(6);
    expect(SEED_PACKAGE_ENTITLEMENTS.length).toBeGreaterThanOrEqual(16);
  });

  it("BR-SIB-03: manager_role enum đóng ở đúng 2 giá trị super_admin và content_reviewer", () => {
    expect(schema.managerRoleEnum.enumValues).toEqual([
      "super_admin",
      "content_reviewer",
    ]);
    const managerCols = getTableColumns(schema.managers);
    expect(managerCols.role.enumValues).toEqual([
      "super_admin",
      "content_reviewer",
    ]);
  });

  it("BR-SIB-04: 4 bảng auth phụ dùng cặp đa hình (account_type, account_id) với enum ['user', 'manager']", () => {
    for (const table of [
      schema.activeSessions,
      schema.mfaSettings,
      schema.mfaRecoveryCodes,
      schema.verificationTokens,
    ]) {
      const cols = getTableColumns(table);
      expect(cols.accountType.name).toBe("account_type");
      expect(cols.accountType.notNull).toBe(true);
      expect(cols.accountType.enumValues).toEqual(["user", "manager"]);
      expect(cols.accountId.name).toBe("account_id");
      expect(cols.accountId.notNull).toBe(true);
    }
  });

  it("BR-SIB-05 & BR-SIB-08: users và managers chỉ lưu password_hash (Argon2id), users.password_hash nullable còn managers.password_hash NOT NULL", async () => {
    const userCols = getTableColumns(schema.users);
    const managerCols = getTableColumns(schema.managers);

    expect(userCols.passwordHash.name).toBe("password_hash");
    expect(userCols.passwordHash.notNull).toBe(false);
    expect(managerCols.passwordHash.name).toBe("password_hash");
    expect(managerCols.passwordHash.notNull).toBe(true);

    for (const table of [schema.users, schema.managers]) {
      const names = getColumnSqlNames(table);
      expect(names).not.toContain("password");
      expect(names).not.toContain("password_raw");
      expect(names).not.toContain("password_plain");
    }

    const sampleHash = await hashPassword("xK9#mQ2$vL8!wP5@");
    expect(sampleHash.startsWith("$argon2id$")).toBe(true);
  });

  it("BR-SIB-06: audit_logs và consent_logs là bảng INSERT-only có created_at NOT NULL", () => {
    const auditCols = getTableColumns(schema.auditLogs);
    const consentCols = getTableColumns(schema.consentLogs);
    expect(auditCols.createdAt.notNull).toBe(true);
    expect(consentCols.createdAt.notNull).toBe(true);
    expect(consentCols.action.enumValues).toEqual(["accepted", "withdrawn"]);
  });

  it("BR-SIB-07: users và managers đều dùng kiểu citext UNIQUE cho cột email (case-insensitive)", () => {
    const userCols = getTableColumns(schema.users);
    const managerCols = getTableColumns(schema.managers);

    expect(userCols.email.getSQLType()).toBe("citext");
    expect(userCols.email.notNull).toBe(true);
    expect(userCols.email.isUnique).toBe(true);

    expect(managerCols.email.getSQLType()).toBe("citext");
    expect(managerCols.email.notNull).toBe(true);
    expect(managerCols.email.isUnique).toBe(true);
  });

  it("BR-SIB-09, BR-SIB-10, BR-SIB-11: social_identities có 2 UNIQUE constraints, KHÔNG lưu token OAuth, và FK chỉ trỏ tới users ON DELETE CASCADE", () => {
    const socialCfg = getTableConfig(schema.socialIdentities);
    const uqNames = socialCfg.uniqueConstraints.map((u) => u.name);
    expect(uqNames).toContain("social_identities_provider_user_id_unique");
    expect(uqNames).toContain("social_identities_user_id_provider_unique");

    const colNames = getColumnSqlNames(schema.socialIdentities);
    expect(colNames).not.toContain("access_token");
    expect(colNames).not.toContain("refresh_token");
    expect(colNames).not.toContain("id_token");
    expect(colNames).not.toContain("avatar_url");
    expect(colNames).not.toContain("manager_id");

    expect(socialCfg.foreignKeys.length).toBe(1);
    const fk = socialCfg.foreignKeys[0];
    expect(fk?.onDelete).toBe("cascade");
    expect(getTableName(fk?.reference().foreignTable ?? schema.users)).toBe(
      "users"
    );
  });

  it("BR-SIB-12: consent_requirements dùng PK consent_type (3 giá trị), có reconsent_required_at nullable, không có cột version hay user_id", () => {
    const cols = getTableColumns(schema.consentRequirements);
    expect(cols.consentType.primary).toBe(true);
    expect(cols.consentType.enumValues).toEqual([
      "terms",
      "privacy",
      "child_data",
    ]);
    expect(cols.reconsentRequiredAt.name).toBe("reconsent_required_at");
    expect(cols.reconsentRequiredAt.notNull).toBe(false);
    expect(cols.notice.name).toBe("notice");

    const colNames = getColumnSqlNames(schema.consentRequirements);
    expect(colNames).not.toContain("version");
    expect(colNames).not.toContain("policy_version");
    expect(colNames).not.toContain("user_id");
  });

  it("BR-SIB-13: SEED_MANAGERS và SEED_USERS định nghĩa đủ 2 Managers (mfaEnabled=false) và 3 Users phủ đủ free, standard, premium", () => {
    expect(SEED_MANAGERS.length).toBe(2);
    expect(SEED_MANAGERS.map((m) => m.role).sort()).toEqual([
      "content_reviewer",
      "super_admin",
    ]);
    for (const mgr of SEED_MANAGERS) {
      expect(mgr.mfaEnabled).toBe(false);
    }

    expect(SEED_USERS.length).toBe(3);
    expect(SEED_USERS.map((u) => u.packageCode ?? "free").sort()).toEqual([
      "PKG-premium",
      "PKG-standard",
      "free",
    ]);
    const totalChildren = SEED_USERS.reduce(
      (sum, u) => sum + u.children.length,
      0
    );
    expect(totalChildren).toBeGreaterThanOrEqual(5);
  });
});

describe("Schema Play & Telemetry Rules (BR-SPT-01..BR-SPT-08)", () => {
  it("BR-SPT-01 & BR-SPT-02: child_profiles chỉ thu dữ liệu tối thiểu (display_name, birth_year) và có CHECK birth_year + daily_play_cap_minutes", () => {
    const colNames = getColumnSqlNames(schema.childProfiles);
    expect(colNames).toContain("display_name");
    expect(colNames).toContain("birth_year");
    expect(colNames).toContain("daily_play_cap_minutes");
    expect(colNames).not.toContain("full_name");
    expect(colNames).not.toContain("birth_date");
    expect(colNames).not.toContain("date_of_birth");
    expect(colNames).not.toContain("school");
    expect(colNames).not.toContain("address");
    expect(colNames).not.toContain("photo_url");
    expect(colNames).not.toContain("email");
    expect(colNames).not.toContain("phone");

    const cols = getTableColumns(schema.childProfiles);
    expect(cols.relationship.enumValues).toEqual(["child", "student", "other"]);
    expect(cols.dailyPlayCapMinutes.notNull).toBe(true);

    const cfg = getTableConfig(schema.childProfiles);
    const checkNames = cfg.checks.map((c) => c.name);
    expect(checkNames).toContain("check_child_profiles_birth_year");
  });

  it("BR-SPT-03 & BR-SPT-04: telemetry_events chỉ dùng child_uuid (nullable, không FK/PII) và play_sessions.child_profile_id nullable cho Guest/Preview", () => {
    const tlmCols = getTableColumns(schema.telemetryEvents);
    expect(tlmCols.childUuid.name).toBe("child_uuid");
    expect(tlmCols.childUuid.notNull).toBe(false);
    expect(tlmCols.sessionUuid.name).toBe("session_uuid");
    expect(tlmCols.sessionUuid.notNull).toBe(true);

    const tlmColNames = getColumnSqlNames(schema.telemetryEvents);
    expect(tlmColNames).not.toContain("child_id");
    expect(tlmColNames).not.toContain("child_profile_id");
    expect(tlmColNames).not.toContain("user_id");
    expect(tlmColNames).not.toContain("display_name");
    expect(tlmColNames).not.toContain("birth_year");
    expect(tlmColNames).not.toContain("ip_address");

    const tlmCfg = getTableConfig(schema.telemetryEvents);
    expect(tlmCfg.foreignKeys.length).toBe(0);

    const playCols = getTableColumns(schema.playSessions);
    expect(playCols.childProfileId.name).toBe("child_profile_id");
    expect(playCols.childProfileId.notNull).toBe(false);
  });

  it("BR-SPT-05: mastery_state có UNIQUE (child_profile_id, skill_id) và CHECK p_learn, ema_correct, hint_rate, best_p_learn trong [0, 1]", () => {
    const cfg = getTableConfig(schema.masteryState);
    const uqNames = cfg.uniqueConstraints.map((u) => u.name);
    expect(uqNames).toContain("mastery_state_child_skill_unique");

    const checkNames = cfg.checks.map((c) => c.name);
    expect(checkNames).toContain("check_mastery_state_p_learn");
    expect(checkNames).toContain("check_mastery_state_ema_correct");
    expect(checkNames).toContain("check_mastery_state_hint_rate");
    expect(checkNames).toContain("check_mastery_state_best_p_learn");
  });

  it("BR-SPT-06, BR-SPT-07, BR-SPT-08: play_sessions gắn (template_code, game_level_id, content_version), cascade khi xoá child_profiles/users, và dùng JSONB cho telemetry payload", () => {
    const playCols = getTableColumns(schema.playSessions);
    expect(playCols.templateCode.name).toBe("template_code");
    expect(playCols.templateCode.notNull).toBe(true);
    expect(playCols.gameLevelId.name).toBe("game_level_id");
    expect(playCols.gameLevelId.notNull).toBe(true);
    expect(playCols.contentVersion.name).toBe("content_version");
    expect(playCols.contentVersion.notNull).toBe(true);

    const tlmCols = getTableColumns(schema.telemetryEvents);
    expect(tlmCols.payload.dataType).toBe("json");

    const playCfg = getTableConfig(schema.playSessions);
    const checkNames = playCfg.checks.map((c) => c.name);
    expect(checkNames).toContain("check_play_sessions_identity");
    expect(checkNames).toContain("check_play_sessions_layout_seed");

    const childFk = playCfg.foreignKeys.find(
      (fk) => getTableName(fk.reference().foreignTable) === "child_profiles"
    );
    expect(childFk?.onDelete).toBe("cascade");

    const childProfileCfg = getTableConfig(schema.childProfiles);
    const userFk = childProfileCfg.foreignKeys.find(
      (fk) => getTableName(fk.reference().foreignTable) === "users"
    );
    expect(userFk?.onDelete).toBe("cascade");
  });
});
