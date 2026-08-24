import { getCreditBalance, listCreditTransactions } from "@mindkid/db";
import { listCreditsQuerySchema } from "@mindkid/shared";
import { defineEventHandler, getQuery, setHeader } from "h3";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const session = await requireWebUserSession(event);
  const userId = Number(session.user_id);
  const query = getQuery(event);

  const parsedQuery = listCreditsQuerySchema.safeParse(query);
  const { limit, offset } = parsedQuery.success
    ? parsedQuery.data
    : { limit: 20, offset: 0 };

  setHeader(event, "Cache-Control", "no-store, private");

  const [bal, listResult] = await Promise.all([
    getCreditBalance(userId),
    listCreditTransactions(userId, { limit, offset }),
  ]);

  const recentTransactions = listResult.items.map((t) => ({
    uuid: t.uuid,
    delta: t.delta,
    reason: t.reason,
    feature: t.feature,
    created_at: t.createdAt.toISOString(),
  }));

  return {
    balance: bal.balance,
    total_granted: bal.totalGranted,
    total_used: bal.totalUsed,
    recent_transactions: recentTransactions,
    pagination: {
      total: listResult.total,
      limit,
      offset,
    },
  };
});
