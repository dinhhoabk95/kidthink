import type {
  AccountReference,
  ReauthMethod,
  ReauthMethodAvailabilityPort,
} from "@mindkid/auth";
import type postgres from "postgres";

interface UserMethodsRow {
  readonly has_password: boolean;
  readonly has_social: boolean;
  readonly has_totp: boolean;
}

interface ManagerMethodsRow {
  readonly has_totp: boolean;
}

export class PostgresReauthMethodAvailability
  implements ReauthMethodAvailabilityPort
{
  private readonly sql: postgres.Sql;

  constructor(sql: postgres.Sql) {
    this.sql = sql;
  }

  async getAvailableMethods(
    account: AccountReference
  ): Promise<readonly ReauthMethod[]> {
    if (account.account_type === "user") {
      const [row] = await this.sql<UserMethodsRow[]>`
        select
          password_hash is not null as has_password,
          exists (
            select 1 from social_identities
            where user_id = users.id
          ) as has_social,
          exists (
            select 1 from mfa_settings
            where account_type = 'user'
              and account_id = users.id
              and confirmed_at is not null
          ) as has_totp
        from users
        where id = ${account.account_id}
      `;
      if (!row) {
        return [];
      }
      return [
        ...(row.has_password ? (["password"] as const) : []),
        ...(row.has_social ? (["social"] as const) : []),
        ...(row.has_totp ? (["totp"] as const) : []),
      ];
    }

    const [row] = await this.sql<ManagerMethodsRow[]>`
      select
        mfa_enabled and exists (
          select 1 from mfa_settings
          where account_type = 'manager'
            and account_id = managers.id
            and confirmed_at is not null
        ) as has_totp
      from managers
      where id = ${account.account_id}
        and is_active = true
    `;
    if (!row) {
      return [];
    }
    return ["password", ...(row.has_totp ? (["totp"] as const) : [])];
  }
}
