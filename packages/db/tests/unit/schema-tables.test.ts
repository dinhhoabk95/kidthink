import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { hashPassword } from "@mindkid/auth";
import { getTableColumns, getTableName, is } from "drizzle-orm";
import {
  getTableConfig,
  integer,
  SQLiteTable,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { describe, expect, it } from "vitest";
import { NOTIFICATION_ENDPOINT_PROVIDER } from "#src/constants/billing-ops-enums";
import {
  CHILD_RELATIONSHIP_CODEC,
  CHILD_RELATIONSHIP_VALUES,
  CONSENT_ACTION_CODEC,
  CONSENT_ACTION_VALUES,
  CONSENT_TYPE_CODEC,
  CONSENT_TYPE_VALUES,
  MANAGER_ROLE,
  MANAGER_ROLE_CODEC,
  MANAGER_ROLE_VALUES,
  USER_STATUS,
} from "#src/constants/identity-enums";
import {
  ACCESS_TIER_CODEC,
  ACCESS_TIER_VALUES,
  CONTENT_ENTITY_TYPE_CODEC,
  CONTENT_ENTITY_TYPE_VALUES,
  PLAY_COMPLETION_STATUS_CODEC,
  PLAY_COMPLETION_STATUS_VALUES,
  TAG_STATUS_CODEC,
  TAG_STATUS_VALUES,
} from "#src/constants/learning-enums";
import { SqliteLocalDriver } from "#src/drivers/sqlite-local-driver";
import { createRepositories } from "#src/repositories/index";
// biome-ignore lint/performance/noNamespaceImport: dynamically iterates all schema tables
import * as schema from "#src/schema/index";
import { SEED_MANAGERS, SEED_USERS } from "#src/seed-accounts";
import { SEED_ENTITLEMENT_KEYS, SEED_PACKAGES } from "#src/seed-catalog";
import {
  assertChildBirthYear,
  assertMasteryProbabilities,
  assertNoOAuthProviderTokens,
  assertPlaySessionInvariants,
  assertSkillMapWeight,
} from "#src/validators";
import { extractTableNamesFromSchema, TABLES } from "#tests/global-setup";

const SQL_CHECK_CLAUSE_REGEX = /\bCHECK\s*\(/i;
const FORBIDDEN_PATTERNS = [
  /drizzle-orm\/pg-core/,
  /\bpgEnum\s*\(/,
  /\bpgTable\s*\(/,
  /\.(inner|left|right|full)Join\s*\(/,
] as const;
const SRC_ROOT = resolve(import.meta.dirname, "..", "..", "src");

function listTsFilesRecursive(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listTsFilesRecursive(full));
    } else if (entry.name.endsWith(".ts")) {
      files.push(full);
    }
  }
  return files;
}

function readInitialMigrationSql(): string {
  const migrationsDir = resolve(SRC_ROOT, "migrations");
  const migrationFolders = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  expect(migrationFolders.length).toBe(1);
  const initialDir = migrationFolders.find((name) =>
    name.endsWith("_initial_schema")
  );
  if (!initialDir) {
    throw new Error("Initial schema migration folder not found");
  }
  return readFileSync(
    resolve(migrationsDir, initialDir, "migration.sql"),
    "utf8"
  );
}

function findTablesMissingTimestamps(schemaObj: object): string[] {
  const missing: string[] = [];
  for (const value of Object.values(schemaObj)) {
    if (!is(value, SQLiteTable)) {
      continue;
    }
    const tableName = getTableName(value);
    const cols = getTableColumns(value);
    const colNames = new Set(Object.values(cols).map((col) => col.name));
    if (!(colNames.has("created_at") && colNames.has("updated_at"))) {
      missing.push(tableName);
    }
  }
  return missing.sort();
}

function getColumnSqlNames(table: SQLiteTable): string[] {
  const cols = getTableColumns(table);
  return Object.values(cols).map((col) => col.name);
}

describe("Dynamic Schema Tables Extraction & Architecture (SQLite + Relations + TinyInt)", () => {
  it("trích xuất đủ 66 bảng chính từ schema/ và loại bỏ 5 bảng phụ trợ", () => {
    expect(TABLES.length).toBe(66);
    expect(TABLES).toContain("skill_datasets");
    expect(TABLES).toContain("content_skill_map");
    expect(TABLES).toContain("users");
    expect(TABLES).toContain("user_accounts");
    expect(TABLES).toContain("user_sessions");
    expect(TABLES).toContain("user_two_factors");
    expect(TABLES).toContain("user_passkeys");
    expect(TABLES).toContain("manager_accounts");
    expect(TABLES).toContain("manager_sessions");
    expect(TABLES).toContain("manager_two_factors");
    expect(TABLES).toContain("manager_passkeys");
    expect(TABLES).toContain("game_levels");
    expect(TABLES).toContain("child_stickers");
    expect(TABLES).toContain("child_sticker_placements");
    expect(TABLES).toContain("child_mascot_gear");

    expect(TABLES).not.toContain("seed_manifest");
    expect(TABLES).not.toContain("stored_blobs");
    expect(TABLES).not.toContain("backup_log");
    expect(TABLES).not.toContain("error_logs");
    expect(TABLES).not.toContain("feature_flags");

    expect(TABLES).not.toContain("content_objective_map");
    expect(TABLES).not.toContain("worksheets");
    expect(TABLES).not.toContain("seo_pages");
    expect(TABLES).not.toContain("level_params");
    expect(TABLES).not.toContain("user_tags");
    expect(TABLES).not.toContain("user_tag_map");
    expect(TABLES).not.toContain("package_entitlements");
  });

  it("không còn pg-core, pgEnum, pgTable hay SQL join thủ công trong packages/db/src/", () => {
    const violations: string[] = [];
    for (const filePath of listTsFilesRecursive(SRC_ROOT)) {
      const content = readFileSync(filePath, "utf8");
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(content)) {
          violations.push(`${filePath}: matched ${pattern.source}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("test chứng minh bắt lỗi: thêm bảng giả vào schema ⟹ xuất hiện trong danh sách trích xuất", () => {
    const fakeTable = sqliteTable("fake_table_for_test", {
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

  it("BR-DM-08: mọi bảng đều có cả created_at và updated_at NOT NULL", () => {
    expect(findTablesMissingTimestamps(schema)).toEqual([]);

    const tableWithoutUpdatedAt = sqliteTable("missing_updated_at_table", {
      id: text("id").primaryKey(),
      createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    });
    expect(
      findTablesMissingTimestamps({ broken: tableWithoutUpdatedAt })
    ).toEqual(["missing_updated_at_table"]);
  });

  it("play_sessions, telemetry_events, child_session_summaries, level_daily_stats đã bỏ cột content_version", () => {
    for (const table of [
      schema.playSessions,
      schema.telemetryEvents,
      schema.childSessionSummaries,
      schema.levelDailyStats,
    ]) {
      expect(getColumnSqlNames(table)).not.toContain("content_version");
    }
  });

  it("chỉ còn duy nhất 1 file migration squashed SQLite hợp lệ với triggers & UNIQUE trực tiếp", () => {
    const migrationSql = readInitialMigrationSql();
    expect(migrationSql).not.toContain("prevent_published_update");
    expect(migrationSql).toContain("CREATE TABLE `game_levels`");
    expect(migrationSql).toContain("CREATE TABLE `curricula`");
    expect(migrationSql).toContain("`code` text NOT NULL UNIQUE");
    expect(migrationSql).toContain("trg_prevent_audit_logs_update");
    expect(migrationSql).toContain("trg_prevent_consent_logs_update");
    expect(migrationSql).toContain(
      "trg_prevent_completed_play_sessions_update"
    );
    expect(migrationSql).not.toMatch(SQL_CHECK_CLAUSE_REGEX);
  });

  it("BR-DM-14 & Relational API: toàn bộ 66 bảng có 0 CHECK constraint và đăng ký đầy đủ db.query.*", async () => {
    const tablesWithChecks: string[] = [];
    for (const value of Object.values(schema)) {
      if (!is(value, SQLiteTable)) {
        continue;
      }
      const cfg = getTableConfig(value);
      if (cfg.checks.length > 0) {
        tablesWithChecks.push(getTableName(value));
      }
    }
    expect(tablesWithChecks).toEqual([]);

    const driver = new SqliteLocalDriver({ dataDir: ":memory:" });
    try {
      const memDb = driver.getAppDb();
      expect(Object.keys(memDb.query).length).toBe(66);
      expect(memDb.query.users).toBeDefined();
      expect(memDb.query.childProfiles).toBeDefined();
      expect(memDb.query.playSessions).toBeDefined();
      expect(memDb.query.curricula).toBeDefined();
      expect(memDb.query.skills).toBeDefined();
    } finally {
      await driver.disconnect();
    }
  });
});

describe("Schema Content & Taxonomy Rules (BR-SCT-01..BR-SCT-08)", () => {
  it("BR-SCT-01: Layer 1 không dùng lifecycle status và content_tags.status dùng tinyint + TAG_STATUS_CODEC", () => {
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
    expect(tagCols.status.getSQLType()).toBe("integer");
    expect(TAG_STATUS_VALUES).toEqual([1, 2]);
    expect(TAG_STATUS_CODEC.labels).toEqual(["active", "deprecated"]);
    for (const code of TAG_STATUS_VALUES) {
      expect(TAG_STATUS_CODEC.toCode(TAG_STATUS_CODEC.toLabel(code))).toBe(
        code
      );
    }
  });

  it("BR-SCT-02 & BR-SCT-03: game_levels, curricula, skill_datasets dùng UNIQUE(code) trực tiếp", () => {
    const removedLifecycleColumns = [
      "entity_id",
      "content_version",
      "status",
      "origin",
      "authored_in",
      "seed_batch_id",
      "created_by_manager_id",
      "reviewed_by_manager_id",
      "published_at",
      "archived_at",
    ];

    for (const table of [
      schema.gameLevels,
      schema.curricula,
      schema.skillDatasets,
    ]) {
      const cols = getTableColumns(table);
      expect(cols.code.name).toBe("code");
      expect(cols.code.notNull).toBe(true);
      expect(cols.code.isUnique).toBe(true);

      const colNames = getColumnSqlNames(table);
      for (const removedCol of removedLifecycleColumns) {
        expect(colNames).not.toContain(removedCol);
      }
    }
    expect(getColumnSqlNames(schema.gameLevels)).not.toContain("legacy_v1_ref");
  });

  it("BR-SCT-04: game_levels tách riêng content_pack và difficulty_params (JSON NOT NULL) và access_tier tinyint NOT NULL", () => {
    const cols = getTableColumns(schema.gameLevels);
    expect(cols.contentPack.name).toBe("content_pack");
    expect(cols.contentPack.notNull).toBe(true);
    expect(cols.difficultyParams.name).toBe("difficulty_params");
    expect(cols.difficultyParams.notNull).toBe(true);
    expect(cols.accessTier.name).toBe("access_tier");
    expect(cols.accessTier.notNull).toBe(true);
    expect(cols.accessTier.hasDefault).toBe(false);
    expect(cols.accessTier.getSQLType()).toBe("integer");
    expect(ACCESS_TIER_VALUES).toEqual([1, 2, 3, 4]);
    expect(ACCESS_TIER_CODEC.labels).toEqual([
      "free",
      "login",
      "standard",
      "premium",
    ]);
  });

  it("BR-SCT-06: curriculum_items tham chiếu trực tiếp qua cặp đa hình (entity_type, entity_id)", () => {
    const itemCols = getTableColumns(schema.curriculumItems);
    expect(itemCols.entityType.name).toBe("entity_type");
    expect(itemCols.entityType.notNull).toBe(true);
    expect(itemCols.entityId.name).toBe("entity_id");
    expect(itemCols.entityId.notNull).toBe(true);

    const itemCfg = getTableConfig(schema.curriculumItems);
    const idxNames = itemCfg.indexes.map((idx) => idx.config.name);
    expect(idxNames).toContain("idx_curriculum_items_entity");
    expect(idxNames).not.toContain("idx_curriculum_items_entity_id");

    const itemColNames = getColumnSqlNames(schema.curriculumItems);
    expect(itemColNames).not.toContain("game_level_id");
  });

  it("BR-SCT-07 & BR-SCT-08: content_skill_map weight + entity_type dùng tinyint & CONTENT_ENTITY_TYPE_CODEC", () => {
    const expectedEntities = ["game_level", "curriculum"];
    expect(CONTENT_ENTITY_TYPE_VALUES).toEqual([1, 2]);
    expect(CONTENT_ENTITY_TYPE_CODEC.labels).toEqual(expectedEntities);
    for (const code of CONTENT_ENTITY_TYPE_VALUES) {
      expect(
        CONTENT_ENTITY_TYPE_CODEC.toCode(
          CONTENT_ENTITY_TYPE_CODEC.toLabel(code)
        )
      ).toBe(code);
    }

    const tagMapCols = getTableColumns(schema.contentTagMap);
    const skillMapCols = getTableColumns(schema.contentSkillMap);
    const curItemCols = getTableColumns(schema.curriculumItems);
    const pCurItemCols = getTableColumns(schema.personalCurriculumItems);
    const libItemCols = getTableColumns(schema.libraryItems);

    for (const col of [
      tagMapCols.entityType,
      skillMapCols.entityType,
      curItemCols.entityType,
      pCurItemCols.entityType,
      libItemCols.entityType,
    ]) {
      expect(col.getSQLType()).toBe("integer");
    }

    expect(skillMapCols.weight.name).toBe("weight");
    expect(skillMapCols.weight.notNull).toBe(true);

    const skillMapCfg = getTableConfig(schema.contentSkillMap);
    expect(skillMapCfg.checks.length).toBe(0);
    expect(() => assertSkillMapWeight("0.80")).not.toThrow();
    expect(() => assertSkillMapWeight("0.00")).toThrow();
    expect(() => assertSkillMapWeight("1.50")).toThrow();
  });
});

describe("Schema Identity, Sensitive Hiding, & Billing Rules (BR-SIB-01..BR-SIB-13)", () => {
  it("BR-SIB-01: bảng users KHÔNG có cột role, persona, tier, package hay tenant_id", () => {
    const userColNames = getColumnSqlNames(schema.users);
    expect(userColNames).not.toContain("role");
    expect(userColNames).not.toContain("persona");
    expect(userColNames).not.toContain("tier");
    expect(userColNames).not.toContain("package");
    expect(userColNames).not.toContain("package_code");
    expect(userColNames).not.toContain("tenant_id");
  });

  it("BR-SIB-02: seed catalog chứa đúng 13 entitlement_keys (8 MVP + 5 P2) và 2 gói MVP công khai", () => {
    expect(SEED_ENTITLEMENT_KEYS.length).toBe(13);
    expect(SEED_ENTITLEMENT_KEYS.filter((k) => k.isMvp).length).toBe(8);
    expect(SEED_ENTITLEMENT_KEYS.filter((k) => !k.isMvp).length).toBe(5);
    expect(
      SEED_PACKAGES.filter((p) => p.isPublic)
        .map((p) => p.code)
        .sort()
    ).toEqual(["PKG-premium", "PKG-standard"]);
    expect(SEED_PACKAGES.length).toBe(5);
  });

  it("BR-SIB-03: managers.role dùng tinyint + MANAGER_ROLE_CODEC cho super_admin / content_reviewer", () => {
    expect(MANAGER_ROLE_VALUES).toEqual([1, 2]);
    expect(MANAGER_ROLE_CODEC.labels).toEqual([
      "super_admin",
      "content_reviewer",
    ]);
    const managerCols = getTableColumns(schema.managers);
    expect(managerCols.role.getSQLType()).toBe("integer");
    expect(MANAGER_ROLE_CODEC.toLabel(MANAGER_ROLE.SUPER_ADMIN)).toBe(
      "super_admin"
    );
  });

  it("ẩn các trường nhạy cảm theo mặc định ở Repositories và chỉ trả khi gọi *ForAuth / *ForDispatch", async () => {
    const driver = new SqliteLocalDriver({ dataDir: ":memory:" });
    try {
      const repos = createRepositories(driver.getAppDb());
      const createdUser = await repos.users.create({
        email: "secret-check@mindkid.vn",
        passwordHash: "$argon2id$user-secret-hash",
        displayName: "Parent Secret",
        status: USER_STATUS.ACTIVE,
      });
      expect("passwordHash" in createdUser).toBe(false);

      const publicUser = await repos.users.findById(createdUser.id);
      const authUser = await repos.users.findForAuthById(createdUser.id);
      expect(publicUser).not.toBeNull();
      expect(publicUser ? "passwordHash" in publicUser : true).toBe(false);
      expect(authUser?.passwordHash).toBe("$argon2id$user-secret-hash");

      const createdMgr = await repos.managers.create({
        email: "mgr-secret@mindkid.vn",
        passwordHash: "$argon2id$mgr-secret-hash",
        displayName: "Admin Secret",
        role: MANAGER_ROLE.SUPER_ADMIN,
      });
      expect("passwordHash" in createdMgr).toBe(false);

      const publicMgr = await repos.managers.findByEmail(
        "mgr-secret@mindkid.vn"
      );
      const authMgr = await repos.managers.findForAuthByEmail(
        "mgr-secret@mindkid.vn"
      );
      expect(publicMgr ? "passwordHash" in publicMgr : true).toBe(false);
      expect(authMgr?.passwordHash).toBe("$argon2id$mgr-secret-hash");

      const credPublic = await repos.authAccounts.upsertUserCredentialAccount(
        createdUser.id,
        "$argon2id$acct-secret-hash"
      );
      expect("password" in credPublic).toBe(false);
      const credFoundPublic =
        await repos.authAccounts.findUserCredentialAccount(createdUser.id);
      const credFoundAuth =
        await repos.authAccounts.findUserCredentialAccountForAuth(
          createdUser.id
        );
      expect(credFoundPublic ? "password" in credFoundPublic : true).toBe(
        false
      );
      expect(credFoundAuth?.password).toBe("$argon2id$acct-secret-hash");

      const endpointPublic = await repos.notifications.upsertEndpoint({
        userId: createdUser.id,
        provider: NOTIFICATION_ENDPOINT_PROVIDER.FCM_WEB,
        clientInstallationId: "install-secret-1",
        tokenEncrypted: "enc:top-secret-token",
        tokenFingerprint: "fp-secret-1",
      });
      expect("tokenEncrypted" in endpointPublic).toBe(false);
      const endpointsPublic =
        await repos.notifications.listActiveEndpointsByUser(createdUser.id);
      const endpointsDispatch =
        await repos.notifications.listActiveEndpointsForDispatch(
          createdUser.id
        );
      expect(
        endpointsPublic[0] ? "tokenEncrypted" in endpointsPublic[0] : true
      ).toBe(false);
      expect(endpointsDispatch[0]?.tokenEncrypted).toBe("enc:top-secret-token");
    } finally {
      await driver.disconnect();
    }
  });

  it("BR-AUT-39: 10 bảng phụ Better Auth tách riêng nhánh User (FK users) và nhánh Manager (FK managers) với ON DELETE CASCADE", () => {
    for (const table of [
      schema.userAccounts,
      schema.userSessions,
      schema.userTwoFactors,
      schema.userPasskeys,
    ]) {
      const cfg = getTableConfig(table);
      const userFk = cfg.foreignKeys.find(
        (fk) => getTableName(fk.reference().foreignTable) === "users"
      );
      expect(userFk?.onDelete).toBe("cascade");
    }

    for (const table of [
      schema.managerAccounts,
      schema.managerSessions,
      schema.managerTwoFactors,
      schema.managerPasskeys,
    ]) {
      const cfg = getTableConfig(table);
      const mgrFk = cfg.foreignKeys.find(
        (fk) => getTableName(fk.reference().foreignTable) === "managers"
      );
      expect(mgrFk?.onDelete).toBe("cascade");
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

  it("BR-SIB-06: audit_logs và consent_logs là bảng INSERT-only có created_at NOT NULL, và consent_logs / payment_orders / ai_credit_ledger giữ onDelete=restrict trên user_id", () => {
    const auditCols = getTableColumns(schema.auditLogs);
    const consentCols = getTableColumns(schema.consentLogs);
    expect(auditCols.createdAt.notNull).toBe(true);
    expect(consentCols.createdAt.notNull).toBe(true);
    expect(consentCols.action.getSQLType()).toBe("integer");
    expect(CONSENT_ACTION_VALUES).toEqual([1, 2]);
    expect(CONSENT_ACTION_CODEC.labels).toEqual(["accepted", "withdrawn"]);
    for (const code of CONSENT_ACTION_VALUES) {
      expect(
        CONSENT_ACTION_CODEC.toCode(CONSENT_ACTION_CODEC.toLabel(code))
      ).toBe(code);
    }

    for (const table of [
      schema.consentLogs,
      schema.paymentOrders,
      schema.aiCreditLedger,
    ]) {
      const cfg = getTableConfig(table);
      const userFk = cfg.foreignKeys.find(
        (fk) => getTableName(fk.reference().foreignTable) === "users"
      );
      expect(userFk?.onDelete).toBe("restrict");
    }

    const migration0000 = readInitialMigrationSql();
    expect(migration0000).toContain("trg_prevent_consent_logs_update");
    expect(migration0000).toContain("ON DELETE RESTRICT");
  });

  it("BR-SIB-07: users và managers đều dùng kiểu text COLLATE NOCASE UNIQUE cho cột email", () => {
    const userCols = getTableColumns(schema.users);
    const managerCols = getTableColumns(schema.managers);

    expect(userCols.email.getSQLType()).toBe("text COLLATE NOCASE");
    expect(userCols.email.notNull).toBe(true);
    expect(userCols.email.isUnique).toBe(true);

    expect(managerCols.email.getSQLType()).toBe("text COLLATE NOCASE");
    expect(managerCols.email.notNull).toBe(true);
    expect(managerCols.email.isUnique).toBe(true);
  });

  it("BR-SIB-09, BR-SIB-10, BR-SIB-11: user_accounts có 2 UNIQUE constraints, FK chỉ trỏ tới users ON DELETE CASCADE, và validator chặn lưu token OAuth", () => {
    const accountCfg = getTableConfig(schema.userAccounts);
    const uqNames = accountCfg.uniqueConstraints.map((u) => u.name);
    expect(uqNames).toContain("user_accounts_provider_account_unique");
    expect(uqNames).toContain("user_accounts_user_provider_unique");

    const colNames = getColumnSqlNames(schema.userAccounts);
    expect(colNames).toContain("password_hash");
    expect(colNames).not.toContain("password");
    expect(colNames).not.toContain("avatar_url");
    expect(colNames).not.toContain("manager_id");

    expect(() =>
      assertNoOAuthProviderTokens({
        accessToken: null,
        refreshToken: null,
        idToken: null,
      })
    ).not.toThrow();
    expect(() =>
      assertNoOAuthProviderTokens({ accessToken: "secret-oauth-token" })
    ).toThrow("BR-SIB-10");

    expect(accountCfg.foreignKeys.length).toBe(1);
    const fk = accountCfg.foreignKeys[0];
    expect(fk?.onDelete).toBe("cascade");
    expect(getTableName(fk?.reference().foreignTable ?? schema.users)).toBe(
      "users"
    );
  });

  it("BR-SIB-12: consent_requirements dùng PK consent_type tinyint (3 giá trị), có reconsent_required_at nullable", () => {
    const cols = getTableColumns(schema.consentRequirements);
    expect(cols.consentType.primary).toBe(true);
    expect(cols.consentType.getSQLType()).toBe("integer");
    expect(CONSENT_TYPE_VALUES).toEqual([1, 2, 3]);
    expect(CONSENT_TYPE_CODEC.labels).toEqual([
      "terms",
      "privacy",
      "child_data",
    ]);
    for (const code of CONSENT_TYPE_VALUES) {
      expect(CONSENT_TYPE_CODEC.toCode(CONSENT_TYPE_CODEC.toLabel(code))).toBe(
        code
      );
    }
    expect(cols.reconsentRequiredAt.name).toBe("reconsent_required_at");
    expect(cols.reconsentRequiredAt.notNull).toBe(false);
    expect(cols.notice.name).toBe("notice");

    const colNames = getColumnSqlNames(schema.consentRequirements);
    expect(colNames).not.toContain("version");
    expect(colNames).not.toContain("policy_version");
    expect(colNames).not.toContain("user_id");
  });

  it("BR-SIB-13: SEED_MANAGERS và SEED_USERS định nghĩa đủ 1 Super Admin Manager (mfaEnabled=false) và 3 Users phủ đủ free, standard, premium", () => {
    expect(SEED_MANAGERS.length).toBe(1);
    expect(
      SEED_MANAGERS.map((m) => MANAGER_ROLE_CODEC.toLabel(m.role))
    ).toEqual(["super_admin"]);
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
  it("BR-SPT-01 & BR-SPT-02: child_profiles chỉ thu dữ liệu tối thiểu (display_name, birth_year) và kiểm tra birth_year", () => {
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
    expect(cols.relationship.getSQLType()).toBe("integer");
    expect(CHILD_RELATIONSHIP_VALUES).toEqual([1, 2, 3]);
    expect(CHILD_RELATIONSHIP_CODEC.labels).toEqual([
      "child",
      "student",
      "other",
    ]);
    for (const code of CHILD_RELATIONSHIP_VALUES) {
      expect(
        CHILD_RELATIONSHIP_CODEC.toCode(CHILD_RELATIONSHIP_CODEC.toLabel(code))
      ).toBe(code);
    }
    expect(cols.dailyPlayCapMinutes.notNull).toBe(true);

    const cfg = getTableConfig(schema.childProfiles);
    expect(cfg.checks.length).toBe(0);
    expect(() => assertChildBirthYear(2021)).not.toThrow();
    expect(() => assertChildBirthYear(2005)).toThrow();
  });

  it("BR-SPT-03 & BR-SPT-04: telemetry_events chỉ dùng child_uuid (nullable, không FK/PII) và play_sessions.child_profile_id nullable", () => {
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

  it("BR-SPT-05 & BR-SPT-08: mastery_state có UNIQUE (child_profile_id, skill_id), 0 CHECK và kiểm tra xác suất [0, 1]", () => {
    const cfg = getTableConfig(schema.masteryState);
    const uqNames = cfg.uniqueConstraints.map((u) => u.name);
    expect(uqNames).toContain("mastery_state_child_skill_unique");
    expect(cfg.checks.length).toBe(0);

    expect(() =>
      assertMasteryProbabilities({
        pLearn: "0.5000",
        emaCorrect: "0.8000",
        hintRate: "0.1000",
        bestPLearn: "0.9000",
      })
    ).not.toThrow();
    expect(() => assertMasteryProbabilities({ pLearn: "1.5000" })).toThrow();
  });

  it("BR-SPT-06, BR-SPT-07, BR-SPT-08: play_sessions dùng completion_status & access_tier tinyint, cascade khi xoá child_profiles/users", () => {
    const playCols = getTableColumns(schema.playSessions);
    expect(playCols.templateCode.name).toBe("template_code");
    expect(playCols.templateCode.notNull).toBe(true);
    expect(playCols.gameLevelId.name).toBe("game_level_id");
    expect(playCols.gameLevelId.notNull).toBe(true);
    expect(playCols.completionStatus.getSQLType()).toBe("integer");
    expect(playCols.accessTierAtStart.getSQLType()).toBe("integer");
    expect(PLAY_COMPLETION_STATUS_VALUES).toEqual([1, 2, 3]);
    expect(PLAY_COMPLETION_STATUS_CODEC.labels).toEqual([
      "in_progress",
      "completed",
      "abandoned",
    ]);
    for (const code of PLAY_COMPLETION_STATUS_VALUES) {
      expect(
        PLAY_COMPLETION_STATUS_CODEC.toCode(
          PLAY_COMPLETION_STATUS_CODEC.toLabel(code)
        )
      ).toBe(code);
    }
    expect(getColumnSqlNames(schema.playSessions)).not.toContain(
      "content_version"
    );

    const tlmCols = getTableColumns(schema.telemetryEvents);
    expect(tlmCols.payload.dataType).toBe("object json");
    expect(tlmCols.payload.getSQLType()).toBe("text");

    const playCfg = getTableConfig(schema.playSessions);
    expect(playCfg.checks.length).toBe(0);
    expect(() =>
      assertPlaySessionInvariants({ childProfileId: 1, layoutSeed: 42 })
    ).not.toThrow();
    expect(() =>
      assertPlaySessionInvariants({
        childProfileId: null,
        guestDeviceId: null,
      })
    ).toThrow();

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

  it("Performance Hot Indexes: các bảng nóng và FK có đủ index chuẩn", () => {
    const playIdxNames = getTableConfig(schema.playSessions).indexes.map(
      (i) => i.config.name
    );
    expect(playIdxNames).toContain("idx_play_sessions_session_uuid");
    expect(playIdxNames).toContain("idx_play_sessions_game_level_id");
    expect(playIdxNames).toContain("idx_play_sessions_child_started_at");
    expect(playIdxNames).toContain("idx_play_sessions_guest_status");
    expect(playIdxNames).not.toContain("idx_play_sessions_started_at");

    const summaryIdxNames = getTableConfig(
      schema.childSessionSummaries
    ).indexes.map((i) => i.config.name);
    expect(summaryIdxNames).toContain(
      "idx_child_session_summaries_game_level_id"
    );
    expect(summaryIdxNames).toContain(
      "idx_child_session_summaries_session_uuid"
    );

    const masteryIdxNames = getTableConfig(schema.masteryState).indexes.map(
      (i) => i.config.name
    );
    expect(masteryIdxNames).toContain("idx_mastery_state_skill_id");

    const strandIdxNames = getTableConfig(schema.strands).indexes.map(
      (i) => i.config.name
    );
    expect(strandIdxNames).toContain("idx_strands_competency_id");
    expect(strandIdxNames).toContain("idx_strands_parent_strand_id");

    const skillIdxNames = getTableConfig(schema.skills).indexes.map(
      (i) => i.config.name
    );
    expect(skillIdxNames).toContain("idx_skills_strand_id");

    const loIdxNames = getTableConfig(schema.learningObjectives).indexes.map(
      (i) => i.config.name
    );
    expect(loIdxNames).toContain("idx_learning_objectives_skill_id");

    const datasetIdxNames = getTableConfig(schema.skillDatasets).indexes.map(
      (i) => i.config.name
    );
    expect(datasetIdxNames).toContain("idx_skill_datasets_skill_id");

    const tlmIdxNames = getTableConfig(schema.telemetryEvents).indexes.map(
      (i) => i.config.name
    );
    expect(tlmIdxNames).toContain("idx_telemetry_events_created_at");

    const tagMapIdxNames = getTableConfig(schema.contentTagMap).indexes.map(
      (i) => i.config.name
    );
    expect(tagMapIdxNames).toContain("idx_content_tag_map_tag_entity");

    const skillMapIdxNames = getTableConfig(schema.contentSkillMap).indexes.map(
      (i) => i.config.name
    );
    expect(skillMapIdxNames).toContain("idx_content_skill_map_skill_entity");
  });
});
