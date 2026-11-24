import { getUserCollections } from "#server/services/index.js";
import { defineApiRoute } from "#server/utils/define-api-route";

export default defineApiRoute({
  auth: "user",
  async handler({ auth }) {
    const collections = await getUserCollections(Number(auth.user_id));

    return {
      collections,
      total: collections.length,
      limit: 20,
    };
  },
});
