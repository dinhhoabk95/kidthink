import type { SQLiteTable } from "drizzle-orm/sqlite-core";

export interface UserAuthSchemaTables {
  readonly users: SQLiteTable;
  readonly userAccounts: SQLiteTable;
  readonly userSessions: SQLiteTable;
  readonly userVerifications: SQLiteTable;
  readonly userTwoFactors: SQLiteTable;
  readonly userPasskeys: SQLiteTable;
}

export interface OAuthClientCredentials {
  readonly clientId: string;
  readonly clientSecret: string;
}

export interface UserEmailCallbackInput {
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly name: string;
  };
  readonly url: string;
  readonly token: string;
}

export interface UserStatusSnapshot {
  readonly id: number;
  readonly uuid?: string;
  readonly status: string;
  readonly purgeAt: Date | null;
  readonly hasPassword: boolean;
  readonly sessionVersion?: number;
  readonly twoFactorEnabled?: boolean;
}

export interface EmailSignupConsentInput {
  readonly acceptTerms: boolean;
  readonly acceptPrivacy: boolean;
  readonly termsRequirementAt: string | null;
  readonly privacyRequirementAt: string | null;
  readonly ipAddress: string;
  readonly userAgent: string;
}

export interface UserAuthCallbacks {
  readonly sendVerificationEmail?: (
    data: UserEmailCallbackInput
  ) => Promise<void>;
  readonly sendResetPassword?: (data: UserEmailCallbackInput) => Promise<void>;
  readonly onEmailVerified?: (userId: number, email: string) => Promise<void>;
  readonly getUserStatusByEmail?: (
    email: string
  ) => Promise<UserStatusSnapshot | null>;
  readonly getUserStatusById?: (
    userId: number
  ) => Promise<UserStatusSnapshot | null>;
  readonly validateConsentMarkers?: (input: {
    readonly termsRequirementAt: string | null;
    readonly privacyRequirementAt: string | null;
  }) => Promise<void>;
  readonly recordInitialConsents?: (input: {
    readonly userId: number;
    readonly ipAddress: string;
    readonly userAgent: string;
  }) => Promise<void>;
  readonly mirrorCredentialPassword?: (
    userId: number,
    passwordHash: string
  ) => Promise<void>;
  readonly countUserLoginMethods?: (userId: number) => Promise<number>;
  readonly verifySessionReauth?: (input: {
    readonly userId: number;
    readonly sessionId: string;
    readonly createdAt: Date;
    readonly dbReauthAt: Date | null;
  }) => Promise<void>;
  readonly assertNoOAuthTokens?: (input: {
    readonly accessToken?: string | null;
    readonly refreshToken?: string | null;
    readonly idToken?: string | null;
  }) => void;
  readonly enforceRateLimit?: (input: {
    readonly routeClass: string;
    readonly ipAddress: string;
    readonly identifier?: string;
  }) => Promise<void>;
  readonly revokeOtherSessions?: (
    userId: number,
    keepSessionToken: string
  ) => Promise<void>;
  readonly onPasswordReset?: (userId: number) => Promise<void>;
}
