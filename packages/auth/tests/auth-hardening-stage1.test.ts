import { createHash, createSign, generateKeyPairSync } from "node:crypto";
import {
  DatabaseSync,
  type SQLInputValue,
  type SQLOutputValue,
} from "node:sqlite";
import { sql } from "drizzle-orm";
import {
  booleanFromInteger,
  customType,
  dateFromStoredMilliseconds,
  integer,
  refineSqliteCodecs,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { describe, expect, it } from "vitest";
import {
  type AuthCoordinatorRpcPort,
  createMindKidManagerAuth,
  createMindKidUserAuth,
  DB_MANAGER_ROLE,
  DB_USER_STATUS,
  decodeManagerRoleValue,
  decodeUserStatusValue,
  encodeUserStatusValue,
  generateTotpCode,
  getAuthRedisClient,
  getDummyPasswordHash,
  hashPassword,
  InMemoryRedisClient,
  isSensitiveReauthRoute,
  type ManagerAuthCallbacks,
  type ManagerAuthSchemaTables,
  registerAuthCoordinatorPort,
  setAuthRedisClient,
  type UserAuthCallbacks,
  type UserAuthSchemaTables,
  verifyPassword,
} from "#src/index";

const ROOT_SECRET =
  "mindkid-stage1-test-root-secret-0123456789abcdef0123456789abcdef";
const SITE_URL = "https://app.mindkid.vn";
const ADMIN_URL = "https://admin.mindkid.vn";
const TX_CONTROL_REGEX =
  /^\s*(?:BEGIN|COMMIT|ROLLBACK|SAVEPOINT|RELEASE|ROLLBACK)/i;

type SqlParam =
  | string
  | number
  | boolean
  | bigint
  | Date
  | Uint8Array
  | null
  | undefined;
type SqlCell = string | number | Uint8Array | null;

const citext = customType<{ data: string }>({
  dataType() {
    return "text COLLATE NOCASE";
  },
});

function idPk() {
  return integer("id").primaryKey({ autoIncrement: true });
}

function uuidCol(name = "uuid") {
  return text(name)
    .notNull()
    .$defaultFn(() => crypto.randomUUID());
}

function timestampMs(name: string) {
  return integer(name, { mode: "timestamp_ms" });
}

function nowTimestampMs(name: string) {
  return integer(name, { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`)
    .$defaultFn(() => new Date());
}

function timestamps() {
  return {
    createdAt: nowTimestampMs("created_at"),
    updatedAt: nowTimestampMs("updated_at").$onUpdateFn(() => new Date()),
  };
}

function buildAuthTables() {
  const users = sqliteTable("users", {
    id: idPk(),
    uuid: uuidCol("uuid"),
    email: citext("email").notNull().unique(),
    passwordHash: text("password_hash"),
    displayName: text("display_name").notNull(),
    emailVerified: integer("email_verified", { mode: "boolean" })
      .notNull()
      .default(false),
    image: text("image"),
    twoFactorEnabled: integer("two_factor_enabled", { mode: "boolean" })
      .notNull()
      .default(false),
    status: integer("status")
      .notNull()
      .default(DB_USER_STATUS.PENDING_VERIFICATION),
    emailVerifiedAt: timestampMs("email_verified_at"),
    sessionVersion: integer("session_version").notNull().default(0),
    purgeAt: timestampMs("purge_at"),
    ...timestamps(),
  });

  const userAccounts = sqliteTable("user_accounts", {
    id: idPk(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: integer("user_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestampMs("access_token_expires_at"),
    refreshTokenExpiresAt: timestampMs("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password_hash"),
    ...timestamps(),
  });

  const userSessions = sqliteTable("user_sessions", {
    id: idPk(),
    userId: integer("user_id").notNull(),
    token: text("token").notNull().unique(),
    expiresAt: timestampMs("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    authMethod: integer("auth_method").notNull().default(1),
    reauthAt: timestampMs("reauth_at"),
    ...timestamps(),
  });

  const userVerifications = sqliteTable("user_verifications", {
    id: idPk(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestampMs("expires_at").notNull(),
    ...timestamps(),
  });

  const userTwoFactors = sqliteTable("user_two_factors", {
    id: idPk(),
    userId: integer("user_id").notNull(),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    verified: integer("verified", { mode: "boolean" }).default(true),
    failedVerificationCount: integer("failed_verification_count").default(0),
    lockedUntil: timestampMs("locked_until"),
    ...timestamps(),
  });

  const userPasskeys = sqliteTable("user_passkeys", {
    id: idPk(),
    name: text("name"),
    publicKey: text("public_key").notNull(),
    userId: integer("user_id").notNull(),
    credentialID: text("credential_id").notNull().unique(),
    counter: integer("counter").notNull().default(0),
    deviceType: text("device_type").notNull(),
    backedUp: integer("backed_up", { mode: "boolean" })
      .notNull()
      .default(false),
    transports: text("transports"),
    aaguid: text("aaguid"),
    ...timestamps(),
  });

  const managers = sqliteTable("managers", {
    id: idPk(),
    uuid: uuidCol("uuid"),
    email: citext("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name").notNull(),
    emailVerified: integer("email_verified", { mode: "boolean" })
      .notNull()
      .default(true),
    image: text("image"),
    role: integer("role").notNull().default(DB_MANAGER_ROLE.CONTENT_REVIEWER),
    mfaEnabled: integer("mfa_enabled", { mode: "boolean" })
      .notNull()
      .default(false),
    sessionVersion: integer("session_version").notNull().default(0),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    ...timestamps(),
  });

  const managerAccounts = sqliteTable("manager_accounts", {
    id: idPk(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: integer("manager_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestampMs("access_token_expires_at"),
    refreshTokenExpiresAt: timestampMs("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password_hash"),
    ...timestamps(),
  });

  const managerSessions = sqliteTable("manager_sessions", {
    id: idPk(),
    userId: integer("manager_id").notNull(),
    token: text("token").notNull().unique(),
    expiresAt: timestampMs("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    authMethod: integer("auth_method").notNull().default(1),
    reauthAt: timestampMs("reauth_at"),
    ...timestamps(),
  });

  const managerVerifications = sqliteTable("manager_verifications", {
    id: idPk(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestampMs("expires_at").notNull(),
    ...timestamps(),
  });

  const managerTwoFactors = sqliteTable("manager_two_factors", {
    id: idPk(),
    userId: integer("manager_id").notNull(),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    verified: integer("verified", { mode: "boolean" }).default(true),
    failedVerificationCount: integer("failed_verification_count").default(0),
    lockedUntil: timestampMs("locked_until"),
    ...timestamps(),
  });

  const managerPasskeys = sqliteTable("manager_passkeys", {
    id: idPk(),
    name: text("name"),
    publicKey: text("public_key").notNull(),
    userId: integer("manager_id").notNull(),
    credentialID: text("credential_id").notNull().unique(),
    counter: integer("counter").notNull().default(0),
    deviceType: text("device_type").notNull(),
    backedUp: integer("backed_up", { mode: "boolean" })
      .notNull()
      .default(false),
    transports: text("transports"),
    aaguid: text("aaguid"),
    ...timestamps(),
  });

  const userSchema: UserAuthSchemaTables = {
    users,
    userAccounts,
    userSessions,
    userVerifications,
    userTwoFactors,
    userPasskeys,
  };
  const managerSchema: ManagerAuthSchemaTables = {
    managers,
    managerAccounts,
    managerSessions,
    managerVerifications,
    managerTwoFactors,
    managerPasskeys,
  };
  return { userSchema, managerSchema };
}

const TEST_DDL = `
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT,
  display_name TEXT NOT NULL,
  email_verified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  two_factor_enabled INTEGER NOT NULL DEFAULT 0,
  status INTEGER NOT NULL DEFAULT 1,
  email_verified_at INTEGER,
  session_version INTEGER NOT NULL DEFAULT 0,
  purge_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE user_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at INTEGER,
  refresh_token_expires_at INTEGER,
  scope TEXT,
  password_hash TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  auth_method INTEGER NOT NULL DEFAULT 1,
  reauth_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE user_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE user_two_factors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  secret TEXT NOT NULL,
  backup_codes TEXT NOT NULL,
  verified INTEGER DEFAULT 1,
  failed_verification_count INTEGER DEFAULT 0,
  locked_until INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE user_passkeys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  public_key TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  counter INTEGER NOT NULL DEFAULT 0,
  device_type TEXT NOT NULL,
  backed_up INTEGER NOT NULL DEFAULT 0,
  transports TEXT,
  aaguid TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE managers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  email_verified INTEGER NOT NULL DEFAULT 1,
  image TEXT,
  role INTEGER NOT NULL DEFAULT 4,
  mfa_enabled INTEGER NOT NULL DEFAULT 0,
  session_version INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE manager_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  manager_id INTEGER NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at INTEGER,
  refresh_token_expires_at INTEGER,
  scope TEXT,
  password_hash TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE manager_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  manager_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  auth_method INTEGER NOT NULL DEFAULT 1,
  reauth_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE manager_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE manager_two_factors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  manager_id INTEGER NOT NULL,
  secret TEXT NOT NULL,
  backup_codes TEXT NOT NULL,
  verified INTEGER DEFAULT 1,
  failed_verification_count INTEGER DEFAULT 0,
  locked_until INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE manager_passkeys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  public_key TEXT NOT NULL,
  manager_id INTEGER NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  counter INTEGER NOT NULL DEFAULT 0,
  device_type TEXT NOT NULL,
  backed_up INTEGER NOT NULL DEFAULT 0,
  transports TEXT,
  aaguid TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
`;

function toSqlInput(value: SqlParam): SQLInputValue {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  return value;
}

function normalizeCell(value: SQLOutputValue | undefined): SqlCell {
  if (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    value instanceof Uint8Array
  ) {
    return value ?? null;
  }
  return Number(value);
}

const TEST_SQLITE_CODECS = refineSqliteCodecs({
  "integer:boolean": { normalize: booleanFromInteger },
  "integer:timestamp_ms": { normalize: dateFromStoredMilliseconds },
});

function createMemorySqliteDb() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(TEST_DDL);

  function toArrayRow(
    row: Record<string, SQLOutputValue> | SQLOutputValue[],
    colCount: number
  ): SqlCell[] {
    const src = Array.isArray(row) ? row : Object.values(row);
    const out: SqlCell[] = [];
    for (let i = 0; i < colCount; i++) {
      out.push(normalizeCell(src[i]));
    }
    return out;
  }

  function getRow(
    sqlText: string,
    params: SqlParam[],
    rowMode?: "array" | undefined
  ): Promise<SqlCell[] | undefined>;
  function getRow(
    sqlText: string,
    params: SqlParam[],
    rowMode: "object"
  ): Promise<Record<string, SqlCell> | undefined>;
  function getRow(
    sqlText: string,
    params: SqlParam[],
    rowMode?: "array" | "object" | undefined
  ): Promise<Record<string, SqlCell> | undefined>;
  function getRow(
    sqlText: string,
    params: SqlParam[],
    rowMode?: "array" | "object"
  ): Promise<SqlCell[] | Record<string, SqlCell> | undefined> {
    const stmt = sqlite.prepare(sqlText);
    const inputs = params.map(toSqlInput);
    if (rowMode === "object") {
      const row = stmt.get(...inputs);
      if (!row) {
        return Promise.resolve(undefined);
      }
      const mapped: Record<string, SqlCell> = {};
      for (const [k, v] of Object.entries(row)) {
        mapped[k] = normalizeCell(v);
      }
      return Promise.resolve(mapped);
    }
    const colCount = stmt.columns().length;
    stmt.setReturnArrays(true);
    const row: Record<string, SQLOutputValue> | SQLOutputValue[] | undefined =
      stmt.get(...inputs);
    return Promise.resolve(row ? toArrayRow(row, colCount) : undefined);
  }

  function allRows(
    sqlText: string,
    params: SqlParam[],
    rowMode?: "array" | undefined
  ): Promise<SqlCell[][]>;
  function allRows(
    sqlText: string,
    params: SqlParam[],
    rowMode: "object"
  ): Promise<Record<string, SqlCell>[]>;
  function allRows(
    sqlText: string,
    params: SqlParam[],
    rowMode?: "array" | "object" | undefined
  ): Promise<Record<string, SqlCell>[]>;
  function allRows(
    sqlText: string,
    params: SqlParam[],
    rowMode?: "array" | "object"
  ): Promise<SqlCell[][] | Record<string, SqlCell>[]> {
    const stmt = sqlite.prepare(sqlText);
    const inputs = params.map(toSqlInput);
    if (rowMode === "object") {
      const rows = stmt.all(...inputs);
      return Promise.resolve(
        rows.map((row) => {
          const mapped: Record<string, SqlCell> = {};
          for (const [k, v] of Object.entries(row)) {
            mapped[k] = normalizeCell(v);
          }
          return mapped;
        })
      );
    }
    const colCount = stmt.columns().length;
    stmt.setReturnArrays(true);
    const rows: readonly (Record<string, SQLOutputValue> | SQLOutputValue[])[] =
      stmt.all(...inputs);
    return Promise.resolve(rows.map((row) => toArrayRow(row, colCount)));
  }

  const db = drizzle(
    {
      get: getRow,
      all: allRows,
      run(sqlText: string, params: SqlParam[]) {
        if (params.length === 0 && TX_CONTROL_REGEX.test(sqlText)) {
          sqlite.exec(sqlText);
          return Promise.resolve({ changes: 0, lastInsertRowid: 0 });
        }
        const stmt = sqlite.prepare(sqlText);
        const res = stmt.run(...params.map(toSqlInput));
        return Promise.resolve({
          changes: Number(res.changes),
          lastInsertRowid: Number(res.lastInsertRowid),
        });
      },
    },
    { codecs: TEST_SQLITE_CODECS }
  );

  return { sqlite, db };
}

class CookieJar {
  private readonly cookies = new Map<string, string>();

  absorb(response: Response): void {
    const setCookies = response.headers.getSetCookie?.() ?? [];
    for (const raw of setCookies) {
      const [firstPart, ...attrs] = raw.split(";");
      const pair = firstPart ?? "";
      const eq = pair.indexOf("=");
      if (eq <= 0) {
        continue;
      }
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      const isExpired = attrs.some((a) =>
        a.trim().toLowerCase().startsWith("max-age=0")
      );
      if (isExpired || value.length === 0) {
        this.cookies.delete(name);
      } else {
        this.cookies.set(name, value);
      }
    }
  }

  header(): string {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }

  has(name: string): boolean {
    return this.cookies.has(name) || this.cookies.has(`__Secure-${name}`);
  }
}

async function callAuth(
  handler: (req: Request) => Promise<Response>,
  jar: CookieJar,
  path: string,
  options?: {
    readonly method?: string;
    readonly body?: object;
    readonly headers?: Record<string, string>;
  }
): Promise<Response> {
  const method = options?.method ?? (options?.body ? "POST" : "GET");
  const headers = new Headers({
    origin: SITE_URL,
    "user-agent": "MindKidTest/1.0",
  });
  const cookieHeader = jar.header();
  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }
  if (options?.headers) {
    for (const [k, v] of Object.entries(options.headers)) {
      headers.set(k, v);
    }
  }
  if (options?.body) {
    headers.set("content-type", "application/json");
  }
  const res = await handler(
    new Request(`${SITE_URL}${path}`, {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    })
  );
  jar.absorb(res);
  return res;
}

function buildTestUserEnv(callbacks?: UserAuthCallbacks) {
  const { sqlite, db } = createMemorySqliteDb();
  const { userSchema } = buildAuthTables();
  const redis = new InMemoryRedisClient();
  const auth = createMindKidUserAuth({
    db,
    schema: userSchema,
    redis,
    rootSecret: ROOT_SECRET,
    siteUrl: SITE_URL,
    trustedOrigins: [SITE_URL, ADMIN_URL],
    isProduction: false,
    oauth: {
      google: { clientId: "google-test-client", clientSecret: "google-secret" },
    },
    callbacks,
  });
  return { sqlite, redis, auth };
}

function buildTestManagerEnv(callbacks?: ManagerAuthCallbacks) {
  const { sqlite, db } = createMemorySqliteDb();
  const { managerSchema } = buildAuthTables();
  const redis = new InMemoryRedisClient();
  const auth = createMindKidManagerAuth({
    db,
    schema: managerSchema,
    redis,
    rootSecret: ROOT_SECRET,
    siteUrl: SITE_URL,
    trustedOrigins: [SITE_URL, ADMIN_URL],
    isProduction: false,
    callbacks,
  });
  return { sqlite, redis, auth };
}

function parseTotpSecretFromUri(totpUri: string): string {
  const url = new URL(totpUri);
  const secret = url.searchParams.get("secret");
  if (!secret) {
    throw new Error("Missing secret in totpURI");
  }
  return secret;
}

function createEs256PasskeyFixture() {
  const { publicKey, privateKey } = generateKeyPairSync("ec", {
    namedCurve: "P-256",
  });
  const jwk = publicKey.export({ format: "jwk" }) as { x: string; y: string };
  const xBytes = Buffer.from(jwk.x, "base64url");
  const yBytes = Buffer.from(jwk.y, "base64url");
  const coseKey = Buffer.concat([
    Buffer.from("a5010203262001215820", "hex"),
    xBytes,
    Buffer.from("225820", "hex"),
    yBytes,
  ]);
  return {
    credentialID: "cred-test-es256-1",
    publicKeyBase64: coseKey.toString("base64"),
    signAssertion(challenge: string, rpId: string, origin: string) {
      const rpIdHash = createHash("sha256").update(rpId).digest();
      const flags = Buffer.from([0x05]);
      const signCount = Buffer.from([0x00, 0x00, 0x00, 0x01]);
      const authData = Buffer.concat([rpIdHash, flags, signCount]);
      const clientDataJson = Buffer.from(
        JSON.stringify({
          type: "webauthn.get",
          challenge,
          origin,
          crossOrigin: false,
        }),
        "utf8"
      );
      const clientDataHash = createHash("sha256")
        .update(clientDataJson)
        .digest();
      const signedPayload = Buffer.concat([authData, clientDataHash]);
      const sig = createSign("SHA256")
        .update(signedPayload)
        .sign({ key: privateKey, dsaEncoding: "der" });
      return {
        id: "cred-test-es256-1",
        rawId: "cred-test-es256-1",
        type: "public-key",
        response: {
          authenticatorData: authData.toString("base64url"),
          clientDataJSON: clientDataJson.toString("base64url"),
          signature: sig.toString("base64url"),
          userHandle: Buffer.from("1", "utf8").toString("base64url"),
        },
        clientExtensionResults: {},
      };
    },
  };
}

function createSignedGoogleJwt(email: string, sub: string) {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  const pubJwk = publicKey.export({ format: "jwk" }) as Record<string, string>;
  const nowSec = Math.floor(Date.now() / 1000);
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT", kid: "google-test-kid" })
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: "https://accounts.google.com",
      aud: "google-test-client",
      sub,
      email,
      email_verified: true,
      name: "OAuth Test User",
      iat: nowSec,
      exp: nowSec + 300,
    })
  ).toString("base64url");
  const sig = createSign("RSA-SHA256")
    .update(`${header}.${payload}`)
    .sign(privateKey)
    .toString("base64url");
  return {
    idToken: `${header}.${payload}.${sig}`,
    jwk: { ...pubJwk, kid: "google-test-kid", alg: "RS256", use: "sig" },
  };
}

async function seedAndSignInUser(
  env: ReturnType<typeof buildTestUserEnv>,
  email: string,
  password: string
) {
  const jar = new CookieJar();
  const signUpRes = await callAuth(
    env.auth.handler,
    jar,
    "/api/auth/users/sign-up/email",
    {
      body: {
        email,
        password,
        name: "Parent User",
        accept_terms: true,
        accept_privacy: true,
      },
    }
  );
  expect(signUpRes.status).toBe(200);
  const signInRes = await callAuth(
    env.auth.handler,
    jar,
    "/api/auth/users/sign-in/email",
    { body: { email, password } }
  );
  expect(signInRes.status).toBe(200);
  const signInData = (await signInRes.json()) as {
    user: { id: string };
    token: string;
  };
  return {
    jar,
    userId: Number(signInData.user.id),
    token: signInData.token,
  };
}

async function seedManagerAccount(
  sqlite: DatabaseSync,
  input: {
    readonly email: string;
    readonly password: string;
    readonly role?: number;
  }
): Promise<number> {
  const hash = await hashPassword(input.password);
  const now = Date.now();
  const res = sqlite
    .prepare(
      `INSERT INTO managers (uuid, email, password_hash, display_name, email_verified, role, mfa_enabled, session_version, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, ?, 0, 0, 1, ?, ?)`
    )
    .run(
      crypto.randomUUID(),
      input.email,
      hash,
      "Admin Test",
      input.role ?? DB_MANAGER_ROLE.SUPER_ADMIN,
      now,
      now
    );
  const managerId = Number(res.lastInsertRowid);
  sqlite
    .prepare(
      `INSERT INTO manager_accounts (account_id, provider_id, manager_id, password_hash, created_at, updated_at)
       VALUES (?, 'credential', ?, ?, ?, ?)`
    )
    .run(String(managerId), managerId, hash, now, now);
  return managerId;
}

describe("Stage 1 Track 2 Auth Hardening", () => {
  it("[NEW-3] routes getAuthRedisClient via request-scoped ALS coordinator port and supports deleteByPrefix", async () => {
    const storeA = new Map<string, string>();
    const storeB = new Map<string, string>();
    const makePort = (map: Map<string, string>): AuthCoordinatorRpcPort => ({
      kvGet: (k) => Promise.resolve(map.get(k) ?? null),
      kvGetDel: (k) => {
        const v = map.get(k) ?? null;
        map.delete(k);
        return Promise.resolve(v);
      },
      kvSet: (k, v) => {
        map.set(k, v);
        return Promise.resolve("OK");
      },
      kvDel: (keys) => {
        let count = 0;
        for (const key of keys) {
          if (map.delete(key)) {
            count++;
          }
        }
        return Promise.resolve(count);
      },
      kvIncr: (k) => {
        const next = Number(map.get(k) ?? "0") + 1;
        map.set(k, String(next));
        return Promise.resolve(next);
      },
      kvExpire: (k) => Promise.resolve(map.has(k) ? 1 : 0),
      kvDeleteByPrefix: (prefix) => {
        let count = 0;
        for (const key of Array.from(map.keys())) {
          if (key.startsWith(prefix)) {
            map.delete(key);
            count++;
          }
        }
        return Promise.resolve(count);
      },
    });

    const portA = makePort(storeA);
    const portB = makePort(storeB);
    const prevRuntime = process.env.MINDKID_RUNTIME;
    const prevDriver = process.env.AUTH_STORE_DRIVER;
    try {
      setAuthRedisClient(undefined);
      process.env.MINDKID_RUNTIME = "cloudflare";
      process.env.AUTH_STORE_DRIVER = "do";
      registerAuthCoordinatorPort(undefined);
      expect(() => getAuthRedisClient().get("ba:v1:user:missing")).toThrow();

      registerAuthCoordinatorPort(portA);
      const client = getAuthRedisClient();
      await client.set("ba:v1:user:k1", "val-a", "EX", 60);
      expect(storeA.get("ba:v1:user:k1")).toBe("val-a");

      registerAuthCoordinatorPort(portB);
      await client.set("ba:v1:user:k2", "val-b", "EX", 60);
      expect(storeB.get("ba:v1:user:k2")).toBe("val-b");
      expect(storeA.has("ba:v1:user:k2")).toBe(false);

      const deleted = await client.deleteByPrefix?.("ba:v1:user:");
      expect(deleted).toBe(1);
      expect(storeB.size).toBe(0);

      registerAuthCoordinatorPort(undefined);
      const mem = new InMemoryRedisClient();
      await mem.set("p:1", "a", "EX", 60);
      await mem.set("p:2", "b", "EX", 60);
      await mem.set("other:1", "c", "EX", 60);
      expect(await mem.deleteByPrefix("p:")).toBe(2);
      expect(await mem.get("other:1")).toBe("c");
    } finally {
      registerAuthCoordinatorPort(undefined);
      process.env.MINDKID_RUNTIME = prevRuntime;
      process.env.AUTH_STORE_DRIVER = prevDriver;
    }
  });

  it("[NEW-5] fails closed on unknown enum values and sets least-privilege manager role default", () => {
    expect(decodeManagerRoleValue(DB_MANAGER_ROLE.SUPER_ADMIN)).toBe(
      "super_admin"
    );
    expect(decodeManagerRoleValue("super_admin")).toBe("super_admin");
    expect(decodeManagerRoleValue(null)).toBe("content_reviewer");
    expect(decodeManagerRoleValue(undefined)).toBe("content_reviewer");
    expect(decodeManagerRoleValue(999)).toBe("content_reviewer");
    expect(decodeManagerRoleValue("root")).toBe("content_reviewer");

    expect(decodeUserStatusValue(DB_USER_STATUS.ACTIVE)).toBe("active");
    expect(decodeUserStatusValue("active")).toBe("active");
    expect(decodeUserStatusValue(null)).toBe("suspended");
    expect(decodeUserStatusValue(undefined)).toBe("suspended");
    expect(decodeUserStatusValue(999)).toBe("suspended");
    expect(decodeUserStatusValue("ghost")).toBe("suspended");

    expect(encodeUserStatusValue("active")).toBe(DB_USER_STATUS.ACTIVE);
    expect(encodeUserStatusValue("weird_status")).toBe(
      DB_USER_STATUS.SUSPENDED
    );

    const mgrEnv = buildTestManagerEnv();
    expect(mgrEnv.auth.options.user?.additionalFields?.role?.defaultValue).toBe(
      DB_MANAGER_ROLE.CONTENT_REVIEWER
    );
  });

  it("[NEW-4] uses a PBKDF2 dummy hash on every runtime and rejects PBKDF2 hashes above 1M iterations", async () => {
    const prev = process.env.MINDKID_RUNTIME;
    try {
      process.env.MINDKID_RUNTIME = "vps";
      expect(getDummyPasswordHash().startsWith("pbkdf2$100000$")).toBe(true);

      process.env.MINDKID_RUNTIME = "cloudflare";
      const cfDummy = getDummyPasswordHash();
      expect(cfDummy.startsWith("pbkdf2$100000$")).toBe(true);
      expect(await verifyPassword("any-password-test", cfDummy)).toBe(false);

      const excessiveHash = `pbkdf2$1000001$${"01".repeat(16)}$${"ab".repeat(32)}`;
      expect(await verifyPassword("any-password-test", excessiveHash)).toBe(
        false
      );
    } finally {
      process.env.MINDKID_RUNTIME = prev;
    }
  });

  it("[#2 HIGH] enforces step-up reauth on passkey mutations, blocks createSession, and intercepts 2FA passkey login", async () => {
    let loginMethods = 1;
    const env = buildTestUserEnv({
      countUserLoginMethods: async () => loginMethods,
    });
    expect(env.auth.options.session?.freshAge).toBe(0);
    const { jar, userId, token } = await seedAndSignInUser(
      env,
      "passkey@mindkid.vn",
      "MatKhauManh#2026"
    );

    // Expire reauth_at > 300s ago -> passkey register/verify-registration/delete must 428
    const staleMs = Date.now() - 400_000;
    env.sqlite
      .prepare("UPDATE user_sessions SET reauth_at = ? WHERE token = ?")
      .run(staleMs, token);
    await env.redis.deleteByPrefix("ba:v1:user:");

    const staleGen = await callAuth(
      env.auth.handler,
      jar,
      "/api/auth/users/passkey/generate-register-options"
    );
    expect(staleGen.status).toBe(428);

    const staleDel = await callAuth(
      env.auth.handler,
      jar,
      "/api/auth/users/passkey/delete-passkey",
      { body: { id: "1" } }
    );
    expect(staleDel.status).toBe(428);

    // Restore fresh reauthAt -> delete blocked by LAST_LOGIN_METHOD when 1 method remains
    env.sqlite
      .prepare("UPDATE user_sessions SET reauth_at = ? WHERE token = ?")
      .run(Date.now(), token);
    await env.redis.deleteByPrefix("ba:v1:user:");
    const lastMethodDel = await callAuth(
      env.auth.handler,
      jar,
      "/api/auth/users/passkey/delete-passkey",
      { body: { id: "1" } }
    );
    expect(lastMethodDel.status).toBe(400);
    loginMethods = 2;

    // Fresh generate-register-options works
    const freshGen = await callAuth(
      env.auth.handler,
      jar,
      "/api/auth/users/passkey/generate-register-options"
    );
    expect(freshGen.status).toBe(200);

    // Insert ES256 passkey + enable 2FA on user -> passkey auth must intercept and issue 2FA cookie
    const fixture = createEs256PasskeyFixture();
    const now = Date.now();
    env.sqlite
      .prepare(
        `INSERT INTO user_passkeys (name, public_key, user_id, credential_id, counter, device_type, backed_up, created_at, updated_at)
         VALUES ('Key', ?, ?, ?, 0, 'singleDevice', 0, ?, ?)`
      )
      .run(fixture.publicKeyBase64, userId, fixture.credentialID, now, now);

    const enableRes = await callAuth(
      env.auth.handler,
      jar,
      "/api/auth/users/two-factor/enable",
      { body: { password: "MatKhauManh#2026" } }
    );
    expect(enableRes.status).toBe(200);
    const { totpURI } = (await enableRes.json()) as { totpURI: string };
    const secret = parseTotpSecretFromUri(totpURI);
    const verifySetupRes = await callAuth(
      env.auth.handler,
      jar,
      "/api/auth/users/two-factor/verify-totp",
      { body: { code: generateTotpCode(secret) } }
    );
    expect(verifySetupRes.status).toBe(200);

    // Sign out / fresh cookie jar for passkey login
    const loginJar = new CookieJar();
    const authOptsRes = await callAuth(
      env.auth.handler,
      loginJar,
      "/api/auth/users/passkey/generate-authenticate-options"
    );
    expect(authOptsRes.status).toBe(200);
    const authOpts = (await authOptsRes.json()) as { challenge: string };
    expect(authOpts.challenge).toBeTruthy();

    const assertion = fixture.signAssertion(
      authOpts.challenge,
      "app.mindkid.vn",
      SITE_URL
    );
    const passkeyVerifyRes = await callAuth(
      env.auth.handler,
      loginJar,
      "/api/auth/users/passkey/verify-authentication",
      { body: { response: assertion } }
    );
    expect(passkeyVerifyRes.status).toBe(200);
    const verifyBody = (await passkeyVerifyRes.json()) as {
      twoFactorRedirect?: boolean;
      twoFactorMethods?: string[];
    };
    expect(verifyBody.twoFactorRedirect).toBe(true);
    expect(verifyBody.twoFactorMethods).toEqual(["totp"]);
    expect(loginJar.has("mindkid-user.session_token")).toBe(false);
    expect(loginJar.has("mindkid-user.two_factor")).toBe(true);

    // Complete 2FA challenge with issued two_factor cookie -> real session + reauthAt stamped
    const tfFinishRes = await callAuth(
      env.auth.handler,
      loginJar,
      "/api/auth/users/two-factor/verify-totp",
      { body: { code: generateTotpCode(secret) } }
    );
    expect(tfFinishRes.status).toBe(200);
    expect(loginJar.has("mindkid-user.session_token")).toBe(true);
  });

  it("[#3 HIGH] blocks get-totp-uri, enforces step-up + TOTP lockout on disable/backup-codes, and revokes other sessions on MFA activation", async () => {
    const revokedOtherCalls: { uid: number; keep: string }[] = [];
    const env = buildTestUserEnv({
      revokeOtherSessions: (uid, keep) => {
        revokedOtherCalls.push({ uid, keep });
        return Promise.resolve();
      },
    });
    const {
      jar: jar1,
      userId,
      token: tok1,
    } = await seedAndSignInUser(env, "mfa@mindkid.vn", "MatKhauManh#2026");
    // Second concurrent session
    const jar2 = new CookieJar();
    const login2 = await callAuth(
      env.auth.handler,
      jar2,
      "/api/auth/users/sign-in/email",
      { body: { email: "mfa@mindkid.vn", password: "MatKhauManh#2026" } }
    );
    expect(login2.status).toBe(200);

    // Enable & verify TOTP on session 1 -> revokeOtherSessions fires
    const enableRes = await callAuth(
      env.auth.handler,
      jar1,
      "/api/auth/users/two-factor/enable",
      { body: { password: "MatKhauManh#2026" } }
    );
    const { totpURI } = (await enableRes.json()) as { totpURI: string };
    const secret = parseTotpSecretFromUri(totpURI);

    const activateRes = await callAuth(
      env.auth.handler,
      jar1,
      "/api/auth/users/two-factor/verify-totp",
      { body: { code: generateTotpCode(secret) } }
    );
    expect(activateRes.status).toBe(200);
    expect(revokedOtherCalls).toHaveLength(1);
    expect(revokedOtherCalls[0]?.uid).toBe(userId);
    expect(revokedOtherCalls[0]?.keep).not.toBe(tok1);

    // get-totp-uri is disabled on User
    const getUriRes = await callAuth(
      env.auth.handler,
      jar1,
      "/api/auth/users/two-factor/get-totp-uri",
      { body: { password: "MatKhauManh#2026" } }
    );
    expect([403, 404]).toContain(getUriRes.status);

    // Password-only backup code generation or disable fails without TOTP
    const missingTotpRes = await callAuth(
      env.auth.handler,
      jar1,
      "/api/auth/users/two-factor/generate-backup-codes",
      { body: { password: "MatKhauManh#2026" } }
    );
    expect(missingTotpRes.status).toBe(401);

    // Wrong TOTP triggers lockout
    const badTotpRes = await callAuth(
      env.auth.handler,
      jar1,
      "/api/auth/users/two-factor/disable",
      {
        headers: { "x-mindkid-totp": "000000" },
        body: { password: "MatKhauManh#2026" },
      }
    );
    expect(badTotpRes.status).toBe(401);

    // Valid TOTP + fresh reauth succeeds
    const validDisableRes = await callAuth(
      env.auth.handler,
      jar1,
      "/api/auth/users/two-factor/disable",
      {
        headers: { "x-mindkid-totp": generateTotpCode(secret) },
        body: { password: "MatKhauManh#2026" },
      }
    );
    expect(validDisableRes.status).toBe(200);

    // Manager blocks get-totp-uri and disable
    const mgrEnv = buildTestManagerEnv();
    await seedManagerAccount(mgrEnv.sqlite, {
      email: "admin-mfa@mindkid.vn",
      password: "AdminPassword#2026",
    });
    const mgrJar = new CookieJar();
    await callAuth(
      mgrEnv.auth.handler,
      mgrJar,
      "/api/auth/managers/sign-in/email",
      {
        body: { email: "admin-mfa@mindkid.vn", password: "AdminPassword#2026" },
      }
    );
    const mgrUri = await callAuth(
      mgrEnv.auth.handler,
      mgrJar,
      "/api/auth/managers/two-factor/get-totp-uri",
      { body: { password: "AdminPassword#2026" } }
    );
    const mgrDisable = await callAuth(
      mgrEnv.auth.handler,
      mgrJar,
      "/api/auth/managers/two-factor/disable",
      { body: { password: "AdminPassword#2026" } }
    );
    expect([403, 404]).toContain(mgrUri.status);
    expect([403, 404]).toContain(mgrDisable.status);
  });

  it("[#4 HIGH] intercepts Google OAuth sign-in & callback when 2FA is enabled, preserving safe callbackURL", async () => {
    const env = buildTestUserEnv();
    const { jar, userId } = await seedAndSignInUser(
      env,
      "oauth2fa@mindkid.vn",
      "MatKhauManh#2026"
    );
    const enableRes = await callAuth(
      env.auth.handler,
      jar,
      "/api/auth/users/two-factor/enable",
      { body: { password: "MatKhauManh#2026" } }
    );
    const { totpURI } = (await enableRes.json()) as { totpURI: string };
    const secret = parseTotpSecretFromUri(totpURI);
    await callAuth(
      env.auth.handler,
      jar,
      "/api/auth/users/two-factor/verify-totp",
      {
        body: { code: generateTotpCode(secret) },
      }
    );
    // Link google account row to user
    const now = Date.now();
    env.sqlite
      .prepare(
        `INSERT INTO user_accounts (account_id, provider_id, user_id, created_at, updated_at)
         VALUES ('google-sub-1', 'google', ?, ?, ?)`
      )
      .run(userId, now, now);

    const { idToken, jwk } = createSignedGoogleJwt(
      "oauth2fa@mindkid.vn",
      "google-sub-1"
    );
    const originalFetch = globalThis.fetch;
    globalThis.fetch = ((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.startsWith("https://oauth2.googleapis.com/token")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              access_token: "g-access",
              refresh_token: "g-refresh",
              id_token: idToken,
            }),
            { status: 200, headers: { "content-type": "application/json" } }
          )
        );
      }
      if (url.startsWith("https://www.googleapis.com/oauth2/v3/certs")) {
        return Promise.resolve(
          new Response(JSON.stringify({ keys: [jwk] }), {
            status: 200,
            headers: { "content-type": "application/json" },
          })
        );
      }
      return Promise.reject(
        new Error(`Unexpected fetch URL in OAuth test: ${url}`)
      );
    }) as typeof globalThis.fetch;

    try {
      const oauthJar = new CookieJar();
      const startRes = await callAuth(
        env.auth.handler,
        oauthJar,
        "/api/auth/users/sign-in/social",
        { body: { provider: "google", callbackURL: "/play" } }
      );
      expect(startRes.status).toBe(200);
      const startJson = (await startRes.json()) as { url: string };
      const state = new URL(startJson.url).searchParams.get("state");
      expect(state).toBeTruthy();

      const cbRes = await callAuth(
        env.auth.handler,
        oauthJar,
        `/api/auth/users/callback/google?state=${state}&code=mock-code`
      );
      expect(cbRes.status).toBe(302);
      const loc = cbRes.headers.get("location");
      expect(loc).toBe(
        "https://app.mindkid.vn/login?mfa=1&callbackURL=%2Fplay"
      );
      expect(oauthJar.has("mindkid-user.session_token")).toBe(false);
      expect(oauthJar.has("mindkid-user.two_factor")).toBe(true);

      const mfaVerifyRes = await callAuth(
        env.auth.handler,
        oauthJar,
        "/api/auth/users/two-factor/verify-totp",
        { body: { code: generateTotpCode(secret) } }
      );
      expect(mfaVerifyRes.status).toBe(200);
      expect(oauthJar.has("mindkid-user.session_token")).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("[#10,#11,#12,#31,#32] enforces x-real-ip, disabledPaths, password reset revocation, and fail-closed get-session", async () => {
    let liveStatus: {
      id: number;
      uuid: string;
      status: string;
      purgeAt: Date | null;
      hasPassword: boolean;
      sessionVersion: number;
    } | null = {
      id: 1,
      uuid: "",
      status: "active",
      purgeAt: null,
      hasPassword: true,
      sessionVersion: 0,
    };
    const resetUserIds: number[] = [];
    let resetToken = "";

    const env = buildTestUserEnv({
      getUserStatusById: () => Promise.resolve(liveStatus),
      onPasswordReset: (uid) => {
        resetUserIds.push(uid);
        return Promise.resolve();
      },
      sendResetPassword: (data) => {
        resetToken = data.token;
        return Promise.resolve();
      },
    });
    expect(env.auth.options.advanced?.ipAddress?.ipAddressHeaders).toEqual([
      "x-real-ip",
    ]);

    const jar = new CookieJar();
    await callAuth(env.auth.handler, jar, "/api/auth/users/sign-up/email", {
      body: {
        email: "ipcheck@mindkid.vn",
        password: "MatKhauManh#2026",
        name: "IP User",
        accept_terms: true,
        accept_privacy: true,
      },
    });
    const dbUser = env.sqlite
      .prepare("SELECT id, uuid FROM users WHERE email = ?")
      .get("ipcheck@mindkid.vn") as { id: number; uuid: string };
    liveStatus = {
      id: dbUser.id,
      uuid: dbUser.uuid,
      status: "active",
      purgeAt: null,
      hasPassword: true,
      sessionVersion: 0,
    };

    const loginRes = await callAuth(
      env.auth.handler,
      jar,
      "/api/auth/users/sign-in/email",
      {
        headers: {
          "x-real-ip": "203.0.113.10",
          "x-forwarded-for": "198.51.100.99",
        },
        body: { email: "ipcheck@mindkid.vn", password: "MatKhauManh#2026" },
      }
    );
    expect(loginRes.status).toBe(200);
    const sessRow = env.sqlite
      .prepare(
        "SELECT ip_address FROM user_sessions WHERE user_id = ? ORDER BY id DESC LIMIT 1"
      )
      .get(dbUser.id) as { ip_address: string | null };
    expect(sessRow.ip_address).toBe("203.0.113.10");

    // Disabled paths return 404
    for (const disabled of [
      "/api/auth/users/change-password",
      "/api/auth/users/update-user",
      "/api/auth/users/change-email",
      "/api/auth/users/delete-user",
      "/api/auth/users/list-accounts",
    ]) {
      const res = await callAuth(env.auth.handler, jar, disabled, {
        method: disabled.includes("list-accounts") ? "GET" : "POST",
        body: disabled.includes("list-accounts") ? undefined : {},
      });
      expect(res.status).toBe(404);
    }

    // Fail-closed get-session on sessionVersion mismatch and null liveStatus
    liveStatus = { ...liveStatus, sessionVersion: 1 };
    const mismatchRes = await callAuth(
      env.auth.handler,
      jar,
      "/api/auth/users/get-session"
    );
    expect(await mismatchRes.json()).toBeNull();
    expect(jar.has("mindkid-user.session_token")).toBe(false);

    // Restore valid session & test password reset revocation
    liveStatus = { ...liveStatus, sessionVersion: 0 };
    const jar2 = new CookieJar();
    await callAuth(env.auth.handler, jar2, "/api/auth/users/sign-in/email", {
      body: { email: "ipcheck@mindkid.vn", password: "MatKhauManh#2026" },
    });
    await callAuth(
      env.auth.handler,
      jar2,
      "/api/auth/users/request-password-reset",
      { body: { email: "ipcheck@mindkid.vn" } }
    );
    expect(resetToken).toBeTruthy();

    const resetRes = await callAuth(
      env.auth.handler,
      jar2,
      "/api/auth/users/reset-password",
      { body: { token: resetToken, newPassword: "MatKhauMoi#2026!" } }
    );
    expect(resetRes.status).toBe(200);
    expect(resetUserIds).toEqual([dbUser.id]);
    const remaining = env.sqlite
      .prepare("SELECT COUNT(*) AS cnt FROM user_sessions WHERE user_id = ?")
      .get(dbUser.id) as { cnt: number };
    expect(remaining.cnt).toBe(0);
  });

  it("[#23] exposes P2 manager sensitive reauth routes when includeFuturePhases=true", () => {
    const p2Routes: [string, string][] = [
      ["POST", "/api/managers/orders/ord-1/approve"],
      ["POST", "/api/managers/orders/ord-1/reject"],
      ["PATCH", "/api/managers/feature-flags/dark_mode"],
      ["POST", "/api/managers/subscriptions/sub-1/cancel"],
      ["GET", "/api/managers/audit-logs/export"],
    ];
    for (const [method, path] of p2Routes) {
      expect(isSensitiveReauthRoute(method, path, false)).toBe(false);
      expect(isSensitiveReauthRoute(method, path, true)).toBe(true);
    }
  });
});
