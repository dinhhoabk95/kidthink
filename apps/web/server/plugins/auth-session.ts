import { getBrowserSessionService } from "@mindkid/auth";

declare const sessionHooks: {
  hook(
    name: "fetch",
    handler: (session: Record<string, unknown>) => Promise<void>
  ): void;
};

export default defineNitroPlugin(() => {
  const service = getBrowserSessionService();

  sessionHooks.hook("fetch", async (session: Record<string, unknown>) => {
    const secure = session.secure as { session_token?: string } | undefined;
    const token = secure?.session_token;

    if (!token || typeof token !== "string") {
      session.user = undefined;
      return;
    }

    try {
      const authCtx = await service.resolve("user", token);
      if (authCtx?.user) {
        session.user = authCtx.user;
      } else {
        session.user = undefined;
      }
    } catch {
      session.user = undefined;
    }
  });
});
