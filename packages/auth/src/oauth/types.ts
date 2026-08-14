export type OAuthProvider = "google" | "facebook";

export const OAUTH_PROVIDERS: readonly OAuthProvider[] = [
  "google",
  "facebook",
] as const;

export function isOAuthProvider(value: string): value is OAuthProvider {
  return OAUTH_PROVIDERS.includes(value as OAuthProvider);
}

/**
 * Normalized profile contract per 01-platform/oauth-provider-registry.md §7.2
 */
export interface NormalizedProfile {
  readonly provider: OAuthProvider;
  readonly provider_user_id: string;
  readonly email_at_provider: string | null;
  readonly email_verified_at_provider: boolean;
  readonly display_name_at_provider: string;
}

export interface OAuthProviderPublicInfo {
  readonly provider: OAuthProvider;
  readonly label_vi: string;
  readonly is_enabled: boolean;
}

export interface OAuthProviderEnvConfig {
  readonly clientId?: string;
  readonly clientSecret?: string;
  readonly siteUrl?: string;
}

export interface OAuthStatePayload {
  readonly state: string;
  readonly code_verifier: string;
  readonly intent: "login" | "link";
  readonly return_to: string;
  readonly provider: OAuthProvider;
  readonly user_id?: number;
  readonly created_at: number;
}
