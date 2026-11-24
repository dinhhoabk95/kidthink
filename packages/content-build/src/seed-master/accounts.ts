import { hashPassword } from "@mindkid/auth";
import {
  CHILD_RELATIONSHIP_CODEC,
  CHILD_STATUS,
  CONSENT_ACTION,
  CONSENT_TYPE_CODEC,
  childProfiles,
  consentLogs,
  type DbExecutor,
  ENTITLEMENT_SOURCE,
  ENTITLEMENT_STATUS,
  entitlements,
  MANAGER_ROLE_CODEC,
  managerAccounts,
  managers,
  USER_STATUS,
  userAccounts,
  users,
} from "@mindkid/db";
import { type EntitlementKey, PACKAGE_CATALOG } from "@mindkid/shared";
import { and, eq } from "drizzle-orm";

export interface SeedManagerAccount {
  email: string;
  passwordRaw: string;
  displayName: string;
  role: "super_admin";
  mfaEnabled: boolean;
  isActive: boolean;
}

export interface SeedChildProfile {
  displayName: string;
  birthYear: number;
  avatarId: string;
  relationship: "child" | "student" | "other";
  dailyPlayCapMinutes: number;
}

export interface SeedUserAccount {
  email: string;
  passwordRaw: string;
  displayName: string;
  packageCode?: "PKG-standard" | "PKG-premium";
  children: SeedChildProfile[];
}

export const SEED_MANAGERS: readonly SeedManagerAccount[] = [
  {
    email: "admin@mindkid.test",
    passwordRaw: "xK9#mQ2$vL8!wP5@",
    displayName: "Super Admin",
    role: "super_admin",
    mfaEnabled: false,
    isActive: true,
  },
] as const;

export const SEED_USERS: readonly SeedUserAccount[] = [
  {
    email: "parent.free@mindkid.test",
    passwordRaw: "hB8#kF3$sV6!dQ1*",
    displayName: "Phụ Huynh Free",
    children: [
      {
        displayName: "Bé Bắp",
        birthYear: 2021,
        avatarId: "avatar-rabbit-01",
        relationship: "child",
        dailyPlayCapMinutes: 60,
      },
    ],
  },
  {
    email: "parent.standard@mindkid.test",
    passwordRaw: "wP2$uN9#tX4!cA7^",
    displayName: "Phụ Huynh Standard",
    packageCode: "PKG-standard",
    children: [
      {
        displayName: "Bé Đậu",
        birthYear: 2020,
        avatarId: "avatar-bear-01",
        relationship: "child",
        dailyPlayCapMinutes: 60,
      },
      {
        displayName: "Bé Mầm",
        birthYear: 2022,
        avatarId: "avatar-cat-01",
        relationship: "child",
        dailyPlayCapMinutes: 60,
      },
    ],
  },
  {
    email: "parent.pro@mindkid.test",
    passwordRaw: "qM5#gH8$rK3!yB6%",
    displayName: "Phụ Huynh Premium",
    packageCode: "PKG-premium",
    children: [
      {
        displayName: "Bé Sóc",
        birthYear: 2019,
        avatarId: "avatar-fox-01",
        relationship: "child",
        dailyPlayCapMinutes: 90,
      },
      {
        displayName: "Bé Gấu",
        birthYear: 2021,
        avatarId: "avatar-panda-01",
        relationship: "child",
        dailyPlayCapMinutes: 90,
      },
    ],
  },
] as const;

export interface SeedAccountsStats {
  managerCount: number;
  userCount: number;
  childProfileCount: number;
  entitlementCount: number;
}

type DatabaseClient = DbExecutor;

async function seedManagers(db: DatabaseClient): Promise<number> {
  let count = 0;
  for (const mgr of SEED_MANAGERS) {
    const passwordHash = await hashPassword(mgr.passwordRaw);
    await db
      .insert(managers)
      .values({
        email: mgr.email,
        passwordHash,
        displayName: mgr.displayName,
        emailVerified: true,
        role: MANAGER_ROLE_CODEC.toCode(mgr.role),
        mfaEnabled: mgr.mfaEnabled,
        isActive: mgr.isActive,
      })
      .onConflictDoNothing({ target: managers.email });

    const [mgrRecord] = await db
      .select({ id: managers.id })
      .from(managers)
      .where(eq(managers.email, mgr.email));

    if (mgrRecord) {
      await db
        .insert(managerAccounts)
        .values({
          userId: mgrRecord.id,
          accountId: String(mgrRecord.id),
          providerId: "credential",
          password: passwordHash,
        })
        .onConflictDoNothing({
          target: [managerAccounts.userId, managerAccounts.providerId],
        });
      count++;
    }
  }
  return count;
}

async function ensureUserConsents(
  db: DatabaseClient,
  userId: number
): Promise<void> {
  const consentTypes = ["terms", "privacy", "child_data"] as const;
  for (const cType of consentTypes) {
    const consentTypeCode = CONSENT_TYPE_CODEC.toCode(cType);
    const [existing] = await db
      .select({ id: consentLogs.id })
      .from(consentLogs)
      .where(
        and(
          eq(consentLogs.userId, userId),
          eq(consentLogs.consentType, consentTypeCode)
        )
      );

    if (!existing) {
      await db.insert(consentLogs).values({
        userId,
        consentType: consentTypeCode,
        action: CONSENT_ACTION.ACCEPTED,
        ipAddress: "127.0.0.1",
        userAgent: "Seed Initial Accounts",
      });
    }
  }
}

async function seedUserChildren(
  db: DatabaseClient,
  userId: number,
  children: readonly SeedChildProfile[]
): Promise<number> {
  let createdCount = 0;
  for (const child of children) {
    const [existingChild] = await db
      .select({ id: childProfiles.id })
      .from(childProfiles)
      .where(
        and(
          eq(childProfiles.userId, userId),
          eq(childProfiles.displayName, child.displayName)
        )
      );

    if (!existingChild) {
      await db.insert(childProfiles).values({
        userId,
        displayName: child.displayName,
        birthYear: child.birthYear,
        avatarId: child.avatarId,
        relationship: CHILD_RELATIONSHIP_CODEC.toCode(child.relationship),
        dailyPlayCapMinutes: child.dailyPlayCapMinutes,
        status: CHILD_STATUS.ACTIVE,
      });
    }
    createdCount++;
  }
  return createdCount;
}

async function seedUserEntitlements(
  db: DatabaseClient,
  userId: number,
  packageCode: "PKG-standard" | "PKG-premium" | undefined,
  now: Date,
  expiresAt: Date
): Promise<number> {
  if (!packageCode) {
    return 0;
  }
  const pkgDef = PACKAGE_CATALOG[packageCode];
  if (!pkgDef) {
    return 0;
  }

  let createdCount = 0;
  for (const entKey of pkgDef.entitlements) {
    const [existingEnt] = await db
      .select({ id: entitlements.id })
      .from(entitlements)
      .where(
        and(
          eq(entitlements.userId, userId),
          eq(entitlements.entitlementKey, entKey)
        )
      );

    if (!existingEnt) {
      await db.insert(entitlements).values({
        userId,
        entitlementKey: entKey as EntitlementKey,
        source: ENTITLEMENT_SOURCE.PACKAGE_ORDER,
        status: ENTITLEMENT_STATUS.ACTIVE,
        grantedAt: now,
        expiresAt,
        grantReason: `Seed default package ${packageCode}`,
      });
    }
    createdCount++;
  }
  return createdCount;
}

export async function seedInitialAccounts(
  db: DatabaseClient
): Promise<SeedAccountsStats> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed default test accounts in production");
  }
  const managerCount = await seedManagers(db);

  let userCount = 0;
  let childProfileCount = 0;
  let entitlementCount = 0;

  const now = new Date();
  const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  for (const usr of SEED_USERS) {
    const passwordHash = await hashPassword(usr.passwordRaw);

    await db
      .insert(users)
      .values({
        email: usr.email,
        passwordHash,
        displayName: usr.displayName,
        emailVerified: true,
        status: USER_STATUS.ACTIVE,
        emailVerifiedAt: now,
      })
      .onConflictDoNothing({ target: users.email });

    const [userRecord] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, usr.email));

    if (!userRecord) {
      continue;
    }
    userCount++;

    await db
      .insert(userAccounts)
      .values({
        userId: userRecord.id,
        accountId: String(userRecord.id),
        providerId: "credential",
        password: passwordHash,
      })
      .onConflictDoNothing({
        target: [userAccounts.userId, userAccounts.providerId],
      });

    await ensureUserConsents(db, userRecord.id);

    const childrenAdded = await seedUserChildren(
      db,
      userRecord.id,
      usr.children
    );
    childProfileCount += childrenAdded;

    const entitlementsAdded = await seedUserEntitlements(
      db,
      userRecord.id,
      usr.packageCode,
      now,
      oneYearLater
    );
    entitlementCount += entitlementsAdded;
  }

  return {
    managerCount,
    userCount,
    childProfileCount,
    entitlementCount,
  };
}
