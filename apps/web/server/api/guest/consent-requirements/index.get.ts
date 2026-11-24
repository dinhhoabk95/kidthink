import { defineEventHandler, setHeader } from "h3";
import { getGuestConsentRequirements } from "#server/services/consent-service";

export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "no-store");
  return await getGuestConsentRequirements();
});
