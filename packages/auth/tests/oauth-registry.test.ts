import { describe, expect, it } from "vitest";
import { isOAuthProvider, OAuthProviderRegistry } from "../src/index.js";

describe("Task 1 — OAuth Provider Registry (BR-OAP-01, BR-OAP-06, BR-OAP-09, BR-OAP-10, BR-OAP-13, BR-OAP-16, D-IL)", () => {
  it("BR-OAP-06: closed list contains only google and facebook", () => {
    expect(isOAuthProvider("google")).toBe(true);
    expect(isOAuthProvider("facebook")).toBe(true);
    expect(isOAuthProvider("zalo")).toBe(false);
    expect(isOAuthProvider("apple")).toBe(false);
    expect(isOAuthProvider("tiktok")).toBe(false);
  });

  it("GET providers: returns public list without exposing client_id or client_secret", () => {
    const registry = new OAuthProviderRegistry({
      googleClientId: "g-id-123",
      googleClientSecret: "g-secret-456",
      facebookClientId: "fb-id-789",
      facebookClientSecret: "fb-secret-000",
    });

    const list = registry.getPublicProviders();
    expect(list).toHaveLength(2);

    const google = list.find((p) => p.provider === "google");
    expect(google).toBeDefined();
    expect(google?.label).toBe("Google");
    expect(google?.is_enabled).toBe(true);
    expect((google as any).clientId).toBeUndefined();
    expect((google as any).clientSecret).toBeUndefined();

    const fb = list.find((p) => p.provider === "facebook");
    expect(fb).toBeDefined();
    expect(fb?.label).toBe("Facebook");
    expect(fb?.is_enabled).toBe(true);
    expect((fb as any).clientId).toBeUndefined();
    expect((fb as any).clientSecret).toBeUndefined();
  });

  it("D-IL & BR-OAP-13: missing client_secret disables provider without crashing app", () => {
    // Facebook secret missing
    const registry = new OAuthProviderRegistry({
      googleClientId: "g-id",
      googleClientSecret: "g-secret",
      facebookClientId: "fb-id",
      facebookClientSecret: "", // Missing
    });

    const list = registry.getPublicProviders();
    const fb = list.find((p) => p.provider === "facebook");
    expect(fb?.is_enabled).toBe(false);
    expect(registry.isProviderEnabled("facebook")).toBe(false);
    expect(registry.isProviderEnabled("google")).toBe(true);
  });

  it("BR-OAP-09: scopes are minimal for both providers", () => {
    const registry = new OAuthProviderRegistry({
      googleClientId: "g-id",
      googleClientSecret: "g-secret",
      facebookClientId: "fb-id",
      facebookClientSecret: "fb-secret",
    });

    const googleConfig = registry.getProviderConfig("google");
    expect(googleConfig?.scopes).toEqual(["openid", "email", "profile"]);
    expect(googleConfig?.scopes).not.toContain("friends");
    expect(googleConfig?.scopes).not.toContain("contacts");
    expect(googleConfig?.scopes).not.toContain("birthday");

    const fbConfig = registry.getProviderConfig("facebook");
    expect(fbConfig?.scopes).toEqual(["public_profile", "email"]);
    expect(fbConfig?.scopes).not.toContain("user_friends");
    expect(fbConfig?.scopes).not.toContain("user_photos");
    expect(fbConfig?.scopes).not.toContain("user_birthday");
  });

  it("BR-OAP-01 & BR-OAP-16: generates PKCE with S256 code challenge method", async () => {
    const registry = new OAuthProviderRegistry();
    const { code_verifier, code_challenge } = await registry.generatePKCE();

    expect(code_verifier).toBeDefined();
    expect(code_verifier.length).toBeGreaterThan(32);
    expect(code_challenge).toBeDefined();
    expect(code_challenge.length).toBeGreaterThan(32);
    expect(code_challenge).not.toBe(code_verifier);
  });

  it("BR-OAP-01 & BR-OAP-04: authorization URL for Facebook contains PKCE S256, state and fixed redirect_uri", async () => {
    const registry = new OAuthProviderRegistry({
      facebookClientId: "fb-app-123",
      facebookClientSecret: "fb-sec-456",
      siteUrl: "https://mindkid.edu.vn",
    });

    const { code_challenge } = await registry.generatePKCE();
    const state = "test_state_123456789012345678901234567890";
    const authUrlStr = await registry.buildAuthorizationUrl(
      "facebook",
      state,
      code_challenge
    );

    const url = new URL(authUrlStr);
    expect(url.origin).toBe("https://www.facebook.com");
    expect(url.pathname).toBe("/v21.0/dialog/oauth");
    expect(url.searchParams.get("client_id")).toBe("fb-app-123");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://mindkid.edu.vn/api/guest/auth/oauth/facebook/callback"
    );
    expect(url.searchParams.get("state")).toBe(state);
    expect(url.searchParams.get("code_challenge")).toBe(code_challenge);
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("response_type")).toBe("code");
  });

  it("buildAuthorizationUrl throws when provider is disabled", async () => {
    const registry = new OAuthProviderRegistry({
      facebookClientId: "",
      facebookClientSecret: "",
    });

    await expect(
      registry.buildAuthorizationUrl("facebook", "state", "challenge")
    ).rejects.toThrow("OAUTH_PROVIDER_DISABLED: facebook");
  });
});
