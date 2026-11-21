import type { PgTable } from "drizzle-orm/pg-core";

export interface UserAuthSchemaTables {
  readonly users: PgTable;
  readonly userAccounts: PgTable;
  readonly userSessions: PgTable;
  readonly userVerifications: PgTable;
  readonly userTwoFactors: PgTable;
  readonly userPasskeys: PgTable;
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
  readonly status: string;
  readonly purgeAt: Date | null;
  readonly hasPassword: boolean;
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
  readonly sendChangeEmailVerification?: (
    data: UserEmailCallbackInput & { readonly newEmail: string }
  ) => Promise<void>;
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
}
