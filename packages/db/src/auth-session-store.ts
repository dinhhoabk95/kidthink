import type { AccountReference, AuthMethod } from "@kidthink/auth";
import type postgres from "postgres";

export interface RecordDeviceSessionInput {
  readonly account_type: "user" | "manager";
  readonly account_id: number;
  readonly device_id: string;
  readonly remembered: boolean;
  readonly device_label?: string;
  readonly ip_address?: string;
  readonly auth_method: AuthMethod;
  readonly expires_at: Date;
}

export class PostgresSessionStore {
  private readonly sql: postgres.Sql;

  constructor(sql: postgres.Sql) {
    this.sql = sql;
  }

  async recordSession(
    input: RecordDeviceSessionInput
  ): Promise<{ id: number }> {
    const [row] = await this.sql<{ id: string }[]>`
      insert into active_sessions (
        account_type,
        account_id,
        device_id,
        remembered,
        device_label,
        ip_address,
        auth_method,
        expires_at
      ) values (
        ${input.account_type},
        ${input.account_id},
        ${input.device_id},
        ${input.remembered},
        ${input.device_label ?? null},
        ${input.ip_address ?? null},
        ${input.auth_method},
        ${input.expires_at.toISOString()}
      )
      returning id::text
    `;
    return { id: Number(row.id) };
  }

  async markDeviceRevoked(
    account: AccountReference,
    deviceId: string
  ): Promise<void> {
    await this.sql`
      update active_sessions
      set revoked_at = now()
      where account_type = ${account.account_type}
        and account_id = ${account.account_id}
        and device_id = ${deviceId}
        and revoked_at is null
    `;
  }

  async markAllRevoked(account: AccountReference): Promise<void> {
    await this.sql.begin(async (tx) => {
      if (account.account_type === "user") {
        await tx`
          update users
          set session_version = session_version + 1,
              updated_at = now()
          where id = ${account.account_id}
        `;
      } else {
        await tx`
          update managers
          set session_version = session_version + 1,
              updated_at = now()
          where id = ${account.account_id}
        `;
      }
      await tx`
        update active_sessions
        set revoked_at = now()
        where account_type = ${account.account_type}
          and account_id = ${account.account_id}
          and revoked_at is null
      `;
    });
  }
}
