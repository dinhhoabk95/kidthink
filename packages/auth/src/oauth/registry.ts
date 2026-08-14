import {
  authorizationCodeGrant,
  buildAuthorizationUrl,
  type Configuration,
  calculatePKCECodeChallenge,
  discovery,
  randomPKCECodeVerifier,
} from "openid-client";
import {
  isOAuthProvider,
  type NormalizedProfile,
  type OAuthProvider,
  type OAuthProviderPublicInfo,
} from "./types.js";

const TRAILING_SLASH_REGEX = /\/+$/;

function resolveOAuthDisplayName(
  rawName?: string | null,
  rawEmail?: string | null
): string {
  if (typeof rawName === "string" && rawName.trim().length > 0) {
    return rawName.trim().slice(0, 60);
  }
  if (typeof rawEmail === "string" && rawEmail.includes("@")) {
    const prefix = rawEmail.split("@")[0];
    if (prefix && prefix.length > 0) {
      return prefix.slice(0, 60);
    }
  }
  return "User";
}

export interface OAuthProviderConfig {
  readonly provider: OAuthProvider;
  readonly label: string;
  readonly clientId: string;
  readonly clientSecret: string;
  readonly redirectUri: string;
  readonly scopes: readonly string[];
  readonly isEnabled: boolean;
}

export interface OAuthRegistryOptions {
  readonly googleClientId?: string;
  readonly googleClientSecret?: string;
  readonly facebookClientId?: string;
  readonly facebookClientSecret?: string;
  readonly siteUrl?: string;
}

export class OAuthProviderRegistry {
  private readonly siteUrl: string;
  private readonly googleConfig: OAuthProviderConfig;
  private readonly facebookConfig: OAuthProviderConfig;
  private googleOidcConfigPromise: Promise<Configuration> | null = null;

  constructor(options: OAuthRegistryOptions = {}) {
    const rawSiteUrl =
      options.siteUrl ||
      process.env.NUXT_SITE_URL ||
      process.env.SITE_URL ||
      "http://localhost:3000";
    this.siteUrl = rawSiteUrl.replace(TRAILING_SLASH_REGEX, "");

    const googleId =
      options.googleClientId ||
      process.env.GOOGLE_CLIENT_ID ||
      process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID ||
      "";
    const googleSecret =
      options.googleClientSecret ||
      process.env.GOOGLE_CLIENT_SECRET ||
      process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET ||
      "";

    const facebookId =
      options.facebookClientId ||
      process.env.FACEBOOK_CLIENT_ID ||
      process.env.NUXT_OAUTH_FACEBOOK_CLIENT_ID ||
      "";
    const facebookSecret =
      options.facebookClientSecret ||
      process.env.FACEBOOK_CLIENT_SECRET ||
      process.env.NUXT_OAUTH_FACEBOOK_CLIENT_SECRET ||
      "";

    this.googleConfig = {
      provider: "google",
      label: "Google",
      clientId: googleId,
      clientSecret: googleSecret,
      redirectUri: `${this.siteUrl}/api/guest/auth/oauth/google/callback`,
      scopes: ["openid", "email", "profile"],
      isEnabled: Boolean(googleId && googleSecret),
    };

    this.facebookConfig = {
      provider: "facebook",
      label: "Facebook",
      clientId: facebookId,
      clientSecret: facebookSecret,
      redirectUri: `${this.siteUrl}/api/guest/auth/oauth/facebook/callback`,
      scopes: ["public_profile", "email"],
      isEnabled: Boolean(facebookId && facebookSecret),
    };
  }

  getPublicProviders(): OAuthProviderPublicInfo[] {
    return [
      {
        provider: "google",
        label: this.googleConfig.label,
        is_enabled: this.googleConfig.isEnabled,
      },
      {
        provider: "facebook",
        label: this.facebookConfig.label,
        is_enabled: this.facebookConfig.isEnabled,
      },
    ];
  }

  isProviderEnabled(provider: string): boolean {
    if (!isOAuthProvider(provider)) {
      return false;
    }
    const config = this.getProviderConfig(provider);
    return config.isEnabled;
  }

  getProviderConfig(provider: OAuthProvider): OAuthProviderConfig {
    if (provider === "google") {
      return this.googleConfig;
    }
    if (provider === "facebook") {
      return this.facebookConfig;
    }
    throw new Error(`OAUTH_PROVIDER_DISABLED: ${provider}`);
  }

  async generatePKCE(): Promise<{
    code_verifier: string;
    code_challenge: string;
  }> {
    const code_verifier = randomPKCECodeVerifier();
    const code_challenge = await calculatePKCECodeChallenge(code_verifier);
    return { code_verifier, code_challenge };
  }

  /**
   * Builds authorization URL with PKCE (S256) and state (BR-OAP-01, BR-OAP-04).
   */
  async buildAuthorizationUrl(
    provider: OAuthProvider,
    state: string,
    code_challenge: string
  ): Promise<string> {
    const config = this.getProviderConfig(provider);
    if (!config?.isEnabled) {
      throw new Error(`OAUTH_PROVIDER_DISABLED: ${provider}`);
    }

    if (provider === "google") {
      const oidcConfig = await this.getGoogleOidcConfig();
      const authUrl = buildAuthorizationUrl(oidcConfig, {
        redirect_uri: config.redirectUri,
        scope: config.scopes.join(" "),
        state,
        code_challenge,
        code_challenge_method: "S256",
        response_type: "code",
      });
      return authUrl.href;
    }

    // Facebook OAuth2 dialog URL
    const url = new URL("https://www.facebook.com/v21.0/dialog/oauth");
    url.searchParams.set("client_id", config.clientId);
    url.searchParams.set("redirect_uri", config.redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", config.scopes.join(","));
    url.searchParams.set("code_challenge", code_challenge);
    url.searchParams.set("code_challenge_method", "S256");
    return url.toString();
  }

  /**
   * Exchanges code for tokens and returns NormalizedProfile (BR-OAP-02, BR-OAP-10).
   * NEVER stores or logs provider access token or avatar (BR-OAP-07, BR-OAP-15, D-IP).
   */
  async handleCallback(
    provider: OAuthProvider,
    callbackUrl: URL | string,
    codeVerifier: string
  ): Promise<NormalizedProfile> {
    const config = this.getProviderConfig(provider);
    if (!config?.isEnabled) {
      throw new Error(`OAUTH_PROVIDER_DISABLED: ${provider}`);
    }

    const currentUrl =
      typeof callbackUrl === "string" ? new URL(callbackUrl) : callbackUrl;

    if (provider === "google") {
      return await this.handleGoogleCallback(currentUrl, codeVerifier);
    }

    return await this.handleFacebookCallback(currentUrl, codeVerifier);
  }

  private async handleGoogleCallback(
    currentUrl: URL,
    codeVerifier: string
  ): Promise<NormalizedProfile> {
    const oidcConfig = await this.getGoogleOidcConfig();
    const tokens = await authorizationCodeGrant(oidcConfig, currentUrl, {
      pkceCodeVerifier: codeVerifier,
      expectedState: currentUrl.searchParams.get("state") || undefined,
      idTokenExpected: true,
    });

    const claims = tokens.claims();
    if (!claims?.sub) {
      throw new Error("OAUTH_PROVIDER_ERROR: Missing Google sub claim");
    }

    const email = typeof claims.email === "string" ? claims.email : null;
    const emailVerified = Boolean(claims.email_verified);
    const name = resolveOAuthDisplayName(
      typeof claims.name === "string" ? claims.name : null,
      email
    );

    return {
      provider: "google",
      provider_user_id: claims.sub,
      email_at_provider: email,
      email_verified_at_provider: emailVerified,
      display_name_at_provider: name,
    };
  }

  private async handleFacebookCallback(
    currentUrl: URL,
    codeVerifier: string
  ): Promise<NormalizedProfile> {
    const code = currentUrl.searchParams.get("code");
    if (!code) {
      throw new Error(
        "OAUTH_PROVIDER_ERROR: Missing Facebook code in callback"
      );
    }

    const tokenUrl = new URL(
      "https://graph.facebook.com/v21.0/oauth/access_token"
    );
    tokenUrl.searchParams.set("client_id", this.facebookConfig.clientId);
    tokenUrl.searchParams.set(
      "client_secret",
      this.facebookConfig.clientSecret
    );
    tokenUrl.searchParams.set("redirect_uri", this.facebookConfig.redirectUri);
    tokenUrl.searchParams.set("code", code);
    tokenUrl.searchParams.set("code_verifier", codeVerifier);

    const tokenRes = await fetch(tokenUrl.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!tokenRes.ok) {
      throw new Error(
        `OAUTH_PROVIDER_ERROR: Facebook token exchange failed (${tokenRes.status})`
      );
    }

    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      throw new Error("OAUTH_PROVIDER_ERROR: Missing Facebook access_token");
    }

    const meUrl = new URL("https://graph.facebook.com/v21.0/me");
    meUrl.searchParams.set("fields", "id,name,email");
    meUrl.searchParams.set("access_token", tokenData.access_token);

    const meRes = await fetch(meUrl.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!meRes.ok) {
      throw new Error(
        `OAUTH_PROVIDER_ERROR: Facebook userinfo failed (${meRes.status})`
      );
    }

    const meData = (await meRes.json()) as {
      id?: string;
      name?: string;
      email?: string;
    };
    if (!meData.id) {
      throw new Error("OAUTH_PROVIDER_ERROR: Facebook did not return user id");
    }

    const fbEmail = typeof meData.email === "string" ? meData.email : null;
    const fbName = resolveOAuthDisplayName(meData.name, fbEmail);

    return {
      provider: "facebook",
      provider_user_id: meData.id,
      email_at_provider: fbEmail,
      email_verified_at_provider: false,
      display_name_at_provider: fbName,
    };
  }

  private getGoogleOidcConfig(): Promise<Configuration> {
    if (!this.googleOidcConfigPromise) {
      const issuerUrl = new URL("https://accounts.google.com");
      this.googleOidcConfigPromise = discovery(
        issuerUrl,
        this.googleConfig.clientId,
        this.googleConfig.clientSecret
      );
    }
    return this.googleOidcConfigPromise;
  }
}

let defaultRegistry: OAuthProviderRegistry | null = null;

export function getOAuthRegistry(
  options?: OAuthRegistryOptions
): OAuthProviderRegistry {
  if (options) {
    return new OAuthProviderRegistry(options);
  }
  if (!defaultRegistry) {
    defaultRegistry = new OAuthProviderRegistry();
  }
  return defaultRegistry;
}
