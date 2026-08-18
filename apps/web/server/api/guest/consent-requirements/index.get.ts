import { consentRequirements, getAppDb } from "@mindkid/db";
import { defineEventHandler, setHeader } from "h3";

export default defineEventHandler(async (event) => {
  const db = getAppDb();
  const reqs = await db.select().from(consentRequirements);

  const terms = reqs.find((r) => r.consentType === "terms");
  const privacy = reqs.find((r) => r.consentType === "privacy");

  setHeader(event, "Cache-Control", "no-store");

  return {
    terms: {
      requirement_at: terms?.reconsentRequiredAt
        ? terms.reconsentRequiredAt.toISOString()
        : null,
    },
    privacy: {
      requirement_at: privacy?.reconsentRequiredAt
        ? privacy.reconsentRequiredAt.toISOString()
        : null,
    },
  };
});
