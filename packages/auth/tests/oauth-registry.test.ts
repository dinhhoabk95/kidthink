import { describe, expect, it } from "vitest";
import { getEnabledOAuthProviders } from "#src/index";

describe("OAuth Provider Availability (BR-OAP-06, BR-OAP-13, BR-SCL-13)", () => {
  it("enables google and facebook only when both clientId and clientSecret are present", () => {
    expect(
      getEnabledOAuthProviders({
        google: { clientId: "g-id", clientSecret: "g-sec" },
        facebook: { clientId: "fb-id", clientSecret: "fb-sec" },
      })
    ).toEqual({ google: true, facebook: true });

    expect(
      getEnabledOAuthProviders({
        google: { clientId: "g-id", clientSecret: "g-sec" },
        facebook: { clientId: "fb-id", clientSecret: "" },
      })
    ).toEqual({ google: true, facebook: false });

    expect(getEnabledOAuthProviders()).toEqual({
      google: false,
      facebook: false,
    });
  });
});
