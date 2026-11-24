/**
 * Khai báo tối thiểu cho module ảo `cloudflare:workers` (workerd cấp lúc chạy).
 * Không kéo `@cloudflare/workers-types` vào lưới typecheck của cả monorepo.
 */
declare module "cloudflare:workers" {
  export class DurableObject<Env = unknown> {
    protected readonly ctx: unknown;
    protected readonly env: Env;
    constructor(ctx: unknown, env: Env);
  }
}
