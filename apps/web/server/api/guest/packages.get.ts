import { defineEventHandler, setHeader } from "h3";
import { listPublicPackages } from "#server/services/packages-service";

export default defineEventHandler((event) => {
  if (event?.node?.res) {
    setHeader(
      event,
      "Cache-Control",
      "public, max-age=600, stale-while-revalidate=1200"
    );
  }
  return listPublicPackages();
});
