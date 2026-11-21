import { getEnabledOAuthProviders } from "@mindkid/auth";
import { defineEventHandler } from "h3";

export default defineEventHandler(() => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";
  const facebookClientId = process.env.FACEBOOK_CLIENT_ID?.trim() ?? "";
  const facebookClientSecret = process.env.FACEBOOK_CLIENT_SECRET?.trim() ?? "";

  const enabled = getEnabledOAuthProviders({
    google: { clientId: googleClientId, clientSecret: googleClientSecret },
    facebook: {
      clientId: facebookClientId,
      clientSecret: facebookClientSecret,
    },
  });

  return {
    providers: [
      { provider: "google", label: "Google", is_enabled: enabled.google },
      {
        provider: "facebook",
        label: "Facebook",
        is_enabled: enabled.facebook,
      },
    ],
  };
});
