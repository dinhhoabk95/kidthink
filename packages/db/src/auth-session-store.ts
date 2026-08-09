import type {
  AccountReference,
  AuthMethod,
  ManagerRole,
  RotateSessionInput,
  RotateSessionResult,
  SessionStorePort,
} from "@kidthink/auth";
import type postgres from "postgres";

interface SessionLookupRow {
  readonly session_id: string;
  readonly account_type: "user" | "manager";
  readonly account_id: string;
}

interface LockedSessionRow extends SessionLookupRow {
  readonly refresh_token_hash: string;
  readonly auth_method: AuthMethod;
  readonly reauth_at: Date | null;
  readonly expires_at: Date;
}

interface UserAccountRow {
  readonly account_id: string;
  readonly display_name: string;
  readonly refresh_token_version: number;
  readonly status: string;
}

interface ManagerAccountRow {
  readonly account_id: string;
  readonly display_name: string;
  readonly refresh_token_version: number;
  readonly role: ManagerRole;
  readonly is_active: boolean;
}

const DATABASE_SESSION_ID = /^\d+$/;

export class PostgresSessionStore implements SessionStorePort {
  private readonly sql: postgres.Sql;

  constructor(sql: postgres.Sql) {
    this.sql = sql;
  }

  rotate(input: RotateSessionInput): Promise<RotateSessionResult> {
    if (!DATABASE_SESSION_ID.test(input.session_id)) {
      return Promise.resolve({ outcome: "not_found" });
    }

    return this.sql.begin(async (tx) => {
      const [candidate] = await tx<SessionLookupRow[]>`
        select
          id::text as session_id,
          account_type,
          account_id::text as account_id
        from active_sessions
        where id = ${input.session_id}::bigint
      `;
      if (!candidate || candidate.account_type !== input.account_type) {
        return { outcome: "not_found" } as const;
      }

      if (candidate.account_type === "user") {
        const [account] = await tx<UserAccountRow[]>`
          select
            id::text as account_id,
            display_name,
            refresh_token_version,
            status
          from users
          where id = ${candidate.account_id}::bigint
          for update
        `;
        if (account?.status !== "active") {
          return { outcome: "revoked" } as const;
        }
        return this.rotateLockedUser(tx, input, candidate, account);
      }

      const [account] = await tx<ManagerAccountRow[]>`
        select
          id::text as account_id,
          display_name,
          refresh_token_version,
          role,
          is_active
        from managers
        where id = ${candidate.account_id}::bigint
        for update
      `;
      if (!account?.is_active) {
        return { outcome: "revoked" } as const;
      }
      return this.rotateLockedManager(tx, input, candidate, account);
    });
  }

  async revokeSession(
    sessionId: string,
    account: AccountReference
  ): Promise<void> {
    if (!DATABASE_SESSION_ID.test(sessionId)) {
      return;
    }
    await this.sql`
      delete from active_sessions
      where id = ${sessionId}::bigint
        and account_type = ${account.account_type}
        and account_id = ${account.account_id}
    `;
  }

  async revokeAll(account: AccountReference): Promise<void> {
    await this.sql.begin(async (tx) => {
      if (account.account_type === "user") {
        await tx`
          update users
          set refresh_token_version = refresh_token_version + 1,
              updated_at = now()
          where id = ${account.account_id}
        `;
      } else {
        await tx`
          update managers
          set refresh_token_version = refresh_token_version + 1,
              updated_at = now()
          where id = ${account.account_id}
        `;
      }
      await this.deleteAccountSessions(tx, account);
    });
  }

  async getReauthState(
    sessionId: string,
    account: AccountReference
  ): Promise<{ readonly reauth_at: Date | null } | null> {
    if (!DATABASE_SESSION_ID.test(sessionId)) {
      return null;
    }
    const [session] = await this.sql<{ reauth_at: Date | null }[]>`
      select reauth_at
      from active_sessions
      where id = ${sessionId}::bigint
        and account_type = ${account.account_type}
        and account_id = ${account.account_id}
    `;
    return session ?? null;
  }

  async markReauthenticated(
    sessionId: string,
    account: AccountReference,
    at: Date
  ): Promise<void> {
    if (!DATABASE_SESSION_ID.test(sessionId)) {
      return;
    }
    await this.sql`
      update active_sessions
      set reauth_at = ${at}
      where id = ${sessionId}::bigint
        and account_type = ${account.account_type}
        and account_id = ${account.account_id}
    `;
  }

  private async rotateLockedUser(
    tx: postgres.TransactionSql,
    input: RotateSessionInput,
    candidate: SessionLookupRow,
    account: UserAccountRow
  ): Promise<RotateSessionResult> {
    const session = await this.lockSession(tx, input, candidate);
    if (
      !session ||
      account.refresh_token_version !== input.refresh_token_version
    ) {
      return { outcome: "revoked" };
    }
    if (session.refresh_token_hash !== input.current_refresh_token_hash) {
      await this.revokeReusedToken(tx, this.toAccountReference(candidate));
      return { outcome: "reused" };
    }
    await this.writeRotation(tx, input);
    return {
      outcome: "rotated",
      session: {
        session_id: session.session_id,
        account_type: "user",
        account_id: Number(account.account_id),
        display_name: account.display_name,
        refresh_token_hash: input.next_refresh_token_hash,
        refresh_token_version: account.refresh_token_version,
        auth_method: session.auth_method,
        reauth_at: session.reauth_at,
        expires_at: input.next_expires_at,
      },
    };
  }

  private async rotateLockedManager(
    tx: postgres.TransactionSql,
    input: RotateSessionInput,
    candidate: SessionLookupRow,
    account: ManagerAccountRow
  ): Promise<RotateSessionResult> {
    const session = await this.lockSession(tx, input, candidate);
    if (
      !session ||
      account.refresh_token_version !== input.refresh_token_version
    ) {
      return { outcome: "revoked" };
    }
    if (session.refresh_token_hash !== input.current_refresh_token_hash) {
      await this.revokeReusedToken(tx, this.toAccountReference(candidate));
      return { outcome: "reused" };
    }
    await this.writeRotation(tx, input);
    return {
      outcome: "rotated",
      session: {
        session_id: session.session_id,
        account_type: "manager",
        account_id: Number(account.account_id),
        display_name: account.display_name,
        role: account.role,
        refresh_token_hash: input.next_refresh_token_hash,
        refresh_token_version: account.refresh_token_version,
        auth_method: session.auth_method,
        reauth_at: session.reauth_at,
        expires_at: input.next_expires_at,
      },
    };
  }

  private async lockSession(
    tx: postgres.TransactionSql,
    input: RotateSessionInput,
    candidate: SessionLookupRow
  ): Promise<LockedSessionRow | undefined> {
    const [session] = await tx<LockedSessionRow[]>`
      select
        id::text as session_id,
        account_type,
        account_id::text as account_id,
        refresh_token_hash,
        auth_method,
        reauth_at,
        expires_at
      from active_sessions
      where id = ${input.session_id}::bigint
      for update
    `;
    if (
      !session ||
      session.account_type !== candidate.account_type ||
      session.account_id !== candidate.account_id ||
      session.expires_at <= input.used_at
    ) {
      return undefined;
    }
    return session;
  }

  private async writeRotation(
    tx: postgres.TransactionSql,
    input: RotateSessionInput
  ): Promise<void> {
    await tx`
      update active_sessions
      set refresh_token_hash = ${input.next_refresh_token_hash},
          expires_at = ${input.next_expires_at},
          last_used_at = ${input.used_at}
      where id = ${input.session_id}::bigint
    `;
  }

  private async revokeReusedToken(
    tx: postgres.TransactionSql,
    account: AccountReference
  ): Promise<void> {
    if (account.account_type === "user") {
      await tx`
        update users
        set refresh_token_version = refresh_token_version + 1,
            updated_at = now()
        where id = ${account.account_id}
      `;
    } else {
      await tx`
        update managers
        set refresh_token_version = refresh_token_version + 1,
            updated_at = now()
        where id = ${account.account_id}
      `;
    }
    await this.deleteAccountSessions(tx, account);
  }

  private async deleteAccountSessions(
    tx: postgres.TransactionSql,
    account: AccountReference
  ): Promise<void> {
    await tx`
      delete from active_sessions
      where account_type = ${account.account_type}
        and account_id = ${account.account_id}
    `;
  }

  private toAccountReference(row: SessionLookupRow): AccountReference {
    return {
      account_type: row.account_type,
      account_id: Number(row.account_id),
    };
  }
}
