import type { ManagerTokenPayload, UserTokenPayload } from "@mindkid/auth";
import {
  defineEventHandler,
  type EventHandler,
  type EventHandlerRequest,
  type EventHandlerResponse,
  type H3Event,
  setResponseStatus,
} from "h3";
import type { z } from "zod";
import {
  requireManagerSession,
  requireSuperAdminSession,
} from "./admin-auth-runtime.js";
import { throwValidationError } from "./api-error.js";
import { requireWebUserSession } from "./auth-runtime.js";
import { assertRequestBodySize } from "./auth-runtime-factory.js";
import { readRequestBody, readRequestQuery } from "./request-body.js";

export type ApiAuthMode = "user" | "manager" | "super_admin" | "guest";

export type ApiAuthContext<TAuth extends ApiAuthMode> = TAuth extends "user"
  ? UserTokenPayload
  : TAuth extends "manager" | "super_admin"
    ? ManagerTokenPayload
    : null;

export interface ApiHandlerContext<TAuth extends ApiAuthMode, TQuery, TBody> {
  readonly event: H3Event;
  readonly auth: ApiAuthContext<TAuth>;
  readonly query: TQuery;
  readonly body: TBody;
}

export interface DefineApiRouteOptions<
  TAuth extends ApiAuthMode,
  TQuery,
  TBody,
  TResponse,
> {
  readonly auth: TAuth;
  readonly query?: z.ZodType<TQuery>;
  readonly body?: z.ZodType<TBody>;
  readonly maxBodyBytes?: number;
  readonly status?: number;
  readonly handler: (
    context: ApiHandlerContext<TAuth, TQuery, TBody>
  ) => Promise<TResponse> | TResponse;
}

async function resolveRouteAuth<TAuth extends ApiAuthMode>(
  event: H3Event,
  authMode: TAuth
): Promise<ApiAuthContext<TAuth>> {
  if (authMode === "user") {
    return (await requireWebUserSession(event)) as never;
  }
  if (authMode === "manager") {
    return (await requireManagerSession(event)) as never;
  }
  if (authMode === "super_admin") {
    return (await requireSuperAdminSession(event)) as never;
  }
  return null as never;
}

function parseRouteQuery<TQuery>(
  event: H3Event,
  schema?: z.ZodType<TQuery>
): TQuery {
  const rawQuery = readRequestQuery(event);
  if (!schema) {
    return rawQuery as never;
  }
  const result = schema.safeParse(rawQuery);
  if (!result.success) {
    throwValidationError(result.error);
  }
  return result.data;
}

async function parseRouteBody<TBody>(
  event: H3Event,
  schema?: z.ZodType<TBody>,
  maxBodyBytes?: number
): Promise<TBody> {
  if (!schema) {
    return undefined as never;
  }
  if (maxBodyBytes !== undefined) {
    assertRequestBodySize(event, maxBodyBytes);
  }
  const rawBody = await readRequestBody(event);
  const result = schema.safeParse(rawBody);
  if (!result.success) {
    throwValidationError(result.error);
  }
  return result.data;
}

export function defineApiRoute<
  TAuth extends ApiAuthMode,
  TQuery = Record<string, string | string[]>,
  TBody = Record<string, string | number | boolean | null>,
  TResponse = EventHandlerResponse,
>(
  options: DefineApiRouteOptions<TAuth, TQuery, TBody, TResponse>
): EventHandler<EventHandlerRequest, Promise<TResponse>> {
  return defineEventHandler(async (event: H3Event): Promise<TResponse> => {
    const auth = await resolveRouteAuth(event, options.auth);
    const query = parseRouteQuery(event, options.query);
    const body = await parseRouteBody(
      event,
      options.body,
      options.maxBodyBytes
    );

    const result = await options.handler({
      event,
      auth,
      query,
      body,
    });

    if (options.status) {
      setResponseStatus(event, options.status);
    }

    return result;
  });
}
