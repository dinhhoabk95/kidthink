import { getCreditBalance, listCreditTransactions } from "@kidthink/db";
import { listCreditsQuerySchema } from "@kidthink/shared";
import { defineEventHandler, getQuery, setHeader } from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../utils/auth-runtime.ts";

export default defineEventHandler(async (event) => {
  try {
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
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
});
