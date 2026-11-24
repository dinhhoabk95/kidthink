import {
  ACTOR_TYPE,
  CONSENT_ACTION,
  CONSENT_TYPE,
  ENTITLEMENT_GROUP_CODEC,
  ENTITLEMENT_SOURCE,
  ENTITLEMENT_SOURCE_CODEC,
  ENTITLEMENT_STATUS,
  ENTITLEMENT_STATUS_CODEC,
  type EntitlementWithKeyEntity,
  type JsonValue,
  PACKAGE_STATUS,
  PACKAGE_STATUS_CODEC,
  PAYMENT_ORDER_STATUS,
  PAYMENT_ORDER_STATUS_CODEC,
  type PaymentOrderEntity,
  RECIPIENT_TYPE,
  RECURRING_SUBSCRIPTION_STATUS,
  RECURRING_SUBSCRIPTION_STATUS_CODEC,
  USER_STATUS_CODEC,
} from "@mindkid/db";
import { UserNotFoundError } from "@mindkid/errors/account";
import { UnauthenticatedError } from "@mindkid/errors/auth";
import {
  EntitlementRequiredError,
  PackageNotFoundError,
  PackageNotSellableError,
  SubscriptionNotFoundError,
} from "@mindkid/errors/billing";
import { InternalError, ValidationError } from "@mindkid/errors/common";
import { InvalidStatusTransitionError } from "@mindkid/errors/content";
import {
  type Offer,
  PACKAGE_CATALOG,
  type PackageDefinition,
} from "@mindkid/shared";
import {
  createRecurringSubscription,
  userCancelRecurringSubscription,
} from "#server/services/recurring-billing";
import { assertUnrestrictedUser } from "#server/utils/auth-runtime";
import { mutateUserEntitlements } from "#server/utils/entitlements-runtime";
import {
  useOwnerRepositories,
  useRepositories,
} from "#server/utils/repositories";

const DATA_PRESERVATION_NOTICE =
  "Khi gói hết hạn, hồ sơ của các bé và toàn bộ tiến độ học vẫn được giữ nguyên. Bạn chỉ tạm thời không truy cập được nội dung trả phí.";

const PACKAGE_SIGNATURE_KEY: Record<string, string> = {
  "PKG-standard": "play_standard_games",
  "PKG-premium": "play_premium_games",
  "PKG-addon_curriculum": "create_custom_curriculum",
  "PKG-addon_custom_game": "create_custom_game",
  "PKG-addon_ai": "use_ai_analysis",
};

const NUMERIC_REGEX = /^\d+$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ResolvedEntitlement {
  key: string;
  label: string;
  description: string | null;
  group: string;
  status: string;
  source_label: string;
  expires_at: string | null;
  is_soft_unlock: boolean;
}

interface ActivePackageItem {
  code: string;
  name: string;
  description: string;
  status: string;
  source_label: string;
  granted_at: string;
  expires_at: string | null;
  days_left: number | null;
  is_soft_unlock: boolean;
}

export interface OptInRecurringSubscriptionInput {
  readonly userId: number;
  readonly packageCode: string;
  readonly billingPeriod: "monthly" | "annual";
  readonly offerCode?: string;
  readonly termsVersion?: string;
  readonly ipAddress: string;
  readonly userAgent: string;
}

export interface CancelUserRecurringInput {
  readonly userId: number;
  readonly subscriptionId?: number;
  readonly reason?: string;
}

export interface GrantManagerUserEntitlementsInput {
  readonly managerId: number;
  readonly userUuid: string;
  readonly packageCode: string;
  readonly durationDays: number;
  readonly grantReason: string;
  readonly notifyUser: boolean;
  readonly ipAddress: string;
  readonly userAgent: string | null;
}

function resolveSourceLabel(source: string): string {
  switch (source) {
    case "manual_grant":
      return "Được cấp";
    case "trial":
      return "Dùng thử";
    case "promo":
      return "Khuyến mãi";
    default:
      return "Gói đã mua";
  }
}

function resolveEntitlements(
  userEntitlementRows: readonly EntitlementWithKeyEntity[],
  now: Date
): {
  activeOrSoftRows: EntitlementWithKeyEntity[];
  resolved: ResolvedEntitlement[];
} {
  const activeOrSoftRows = userEntitlementRows.filter((e) => {
    const isNotExpired = !e.expiresAt || new Date(e.expiresAt) > now;
    return (
      isNotExpired &&
      (e.status === ENTITLEMENT_STATUS.ACTIVE ||
        e.status === ENTITLEMENT_STATUS.SOFT_UNLOCK ||
        e.status === ENTITLEMENT_STATUS.GRACE_PERIOD)
    );
  });

  const activeKeyMap = new Map<string, EntitlementWithKeyEntity>();
  for (const r of activeOrSoftRows) {
    if (!activeKeyMap.has(r.entitlementKey)) {
      activeKeyMap.set(r.entitlementKey, r);
    }
  }

  const resolved = Array.from(activeKeyMap.values()).map((e) => {
    const sourceLabel = ENTITLEMENT_SOURCE_CODEC.toLabel(e.source);
    return {
      key: e.entitlementKey,
      label: e.keyDefinition.label || e.entitlementKey,
      description: e.keyDefinition.description || null,
      group:
        ENTITLEMENT_GROUP_CODEC.toLabel(e.keyDefinition.group) || "content",
      status: ENTITLEMENT_STATUS_CODEC.toLabel(e.status),
      source_label: resolveSourceLabel(sourceLabel),
      expires_at: e.expiresAt ? new Date(e.expiresAt).toISOString() : null,
      is_soft_unlock: e.status === ENTITLEMENT_STATUS.SOFT_UNLOCK,
    };
  });

  return { activeOrSoftRows, resolved };
}

function toActivePackageItem(
  pkg: PackageDefinition,
  primary: EntitlementWithKeyEntity,
  now: Date
): ActivePackageItem {
  const expiresAtDate = primary.expiresAt ? new Date(primary.expiresAt) : null;
  const daysLeft = expiresAtDate
    ? Math.max(
        0,
        Math.ceil(
          (expiresAtDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
      )
    : null;

  return {
    code: pkg.code,
    name: pkg.name,
    description: pkg.description,
    status: ENTITLEMENT_STATUS_CODEC.toLabel(primary.status),
    source_label: resolveSourceLabel(
      ENTITLEMENT_SOURCE_CODEC.toLabel(primary.source)
    ),
    granted_at: new Date(primary.grantedAt).toISOString(),
    expires_at: expiresAtDate ? expiresAtDate.toISOString() : null,
    days_left: daysLeft,
    is_soft_unlock: primary.status === ENTITLEMENT_STATUS.SOFT_UNLOCK,
  };
}

function resolvePackages(
  activeOrSoftRows: readonly EntitlementWithKeyEntity[],
  now: Date
): ActivePackageItem[] {
  const activePackages: ActivePackageItem[] = [];

  for (const pkg of Object.values(PACKAGE_CATALOG) as PackageDefinition[]) {
    if (!pkg.entitlements || pkg.entitlements.length === 0) {
      continue;
    }
    const signatureKey = PACKAGE_SIGNATURE_KEY[pkg.code];
    const requiredKeys = pkg.entitlements as readonly string[];
    const hasSignature =
      signatureKey !== undefined &&
      activeOrSoftRows.some((e) => e.entitlementKey === signatureKey);
    const hasAllEntitlements = requiredKeys.every((reqKey) =>
      activeOrSoftRows.some((e) => e.entitlementKey === reqKey)
    );

    if (!(hasSignature || hasAllEntitlements)) {
      continue;
    }
    const primary =
      activeOrSoftRows.find((e) => e.entitlementKey === signatureKey) ||
      activeOrSoftRows.find((e) => requiredKeys.includes(e.entitlementKey));
    if (primary) {
      activePackages.push(toActivePackageItem(pkg, primary, now));
    }
  }

  return activePackages;
}

function calculateQuotas(
  activePackages: readonly ActivePackageItem[],
  childrenUsed: number
) {
  let maxChildProfiles = 1;
  let dailyPlayMinutes = 30;

  for (const p of activePackages) {
    const def = PACKAGE_CATALOG[p.code];
    if (def?.quotas?.child_profiles) {
      maxChildProfiles = Math.max(maxChildProfiles, def.quotas.child_profiles);
    }
    if (def?.quotas?.daily_play_minutes) {
      dailyPlayMinutes = Math.max(
        dailyPlayMinutes,
        def.quotas.daily_play_minutes
      );
    }
  }

  return [
    {
      quota_key: "child_profiles",
      label: "Hồ sơ trẻ",
      used: childrenUsed,
      total: maxChildProfiles,
    },
    {
      quota_key: "daily_play_minutes",
      label: "Thời lượng chơi mỗi ngày (phút/trẻ)",
      used: 0,
      total: dailyPlayMinutes,
    },
  ];
}

function mapOrders(orderRows: readonly PaymentOrderEntity[]) {
  return orderRows.map((o) => {
    const pkg = PACKAGE_CATALOG[o.packageCode];
    const politeReason =
      o.status === PAYMENT_ORDER_STATUS.REJECTED
        ? "Thông tin chuyển khoản hoặc chứng từ chưa khớp với giao dịch ngân hàng. Vui lòng kiểm tra lại hoặc liên hệ hỗ trợ."
        : null;

    return {
      id: o.id,
      uuid: o.uuid,
      package_code: o.packageCode,
      package_name: pkg?.name || o.packageCode,
      offer_code: o.offerCode,
      amount_vnd: Number(o.amountVnd),
      currency: o.currency,
      status: PAYMENT_ORDER_STATUS_CODEC.toLabel(o.status),
      created_at: o.createdAt.toISOString(),
      submitted_at: o.submittedAt ? o.submittedAt.toISOString() : null,
      reviewed_at: o.reviewedAt ? o.reviewedAt.toISOString() : null,
      polite_reason: politeReason,
    };
  });
}

export async function getUserSubscriptionOverview(userId: number) {
  const repos = useRepositories();
  const now = new Date();

  const userRecord = await repos.users.findById(userId);
  if (!userRecord) {
    throw new UnauthenticatedError();
  }

  const [userEntitlementRows, childrenCount, orderRows, userSubs] =
    await Promise.all([
      repos.entitlements.listWithKeysForUser(userId, [
        ENTITLEMENT_STATUS.ACTIVE,
        ENTITLEMENT_STATUS.SOFT_UNLOCK,
        ENTITLEMENT_STATUS.GRACE_PERIOD,
        ENTITLEMENT_STATUS.EXPIRED,
        ENTITLEMENT_STATUS.CANCELLED,
      ]),
      repos.childProfiles.countActiveByUser(userId),
      repos.orders.listByUser(userId, 100),
      repos.recurringSubscriptions.listByUser(userId),
    ]);

  const activeSub = userSubs.find(
    (s) =>
      s.status === RECURRING_SUBSCRIPTION_STATUS.ACTIVE ||
      s.status === RECURRING_SUBSCRIPTION_STATUS.PAST_DUE
  );

  const { activeOrSoftRows, resolved: resolvedEntitlements } =
    resolveEntitlements(userEntitlementRows, now);

  const activePackages = resolvePackages(activeOrSoftRows, now);
  const quotas = calculateQuotas(activePackages, childrenCount);

  const recurringInfo = activeSub
    ? {
        id: activeSub.id,
        package_code: activeSub.packageCode,
        billing_period: activeSub.billingPeriod,
        price_vnd: activeSub.priceVnd,
        auto_renew: activeSub.autoRenew,
        status: RECURRING_SUBSCRIPTION_STATUS_CODEC.toLabel(activeSub.status),
        current_period_end: activeSub.currentPeriodEnd.toISOString(),
        next_billing_at: activeSub.nextBillingAt
          ? activeSub.nextBillingAt.toISOString()
          : null,
        can_cancel:
          activeSub.autoRenew &&
          activeSub.status === RECURRING_SUBSCRIPTION_STATUS.ACTIVE,
      }
    : null;

  const orders = mapOrders(orderRows);
  const hasPremium = activePackages.some((p) => p.code === "PKG-premium");

  return {
    packages: activePackages,
    entitlements: resolvedEntitlements,
    quotas,
    orders,
    recurring_subscription: recurringInfo,
    cancellation_guidance:
      "Huỷ gia hạn tự động có thể thực hiện trực tiếp tại đây bất kỳ lúc nào. Quyền lợi hiện tại được giữ nguyên cho đến hết chu kỳ đã thanh toán. Trường hợp cần hỗ trợ thoả thuận hoàn tiền, vui lòng liên hệ qua Zalo OA hoặc Facebook Messenger hỗ trợ của MindKid.",
    data_preservation_notice: DATA_PRESERVATION_NOTICE,
    has_higher_tier: !hasPremium,
  };
}

export async function getUserRecurringSubscription(userId: number) {
  const repos = useRepositories();
  const subs = await repos.recurringSubscriptions.listByUser(userId);
  const sub = subs[0];

  if (!sub) {
    throw new SubscriptionNotFoundError();
  }

  const nextBillingIso = sub.nextBillingAt
    ? sub.nextBillingAt.toISOString()
    : null;

  return {
    subscription_id: String(sub.id),
    package_code: sub.packageCode,
    offer_code: sub.offerCode,
    billing_period: sub.billingPeriod,
    auto_renew: sub.autoRenew,
    status: RECURRING_SUBSCRIPTION_STATUS_CODEC.toLabel(sub.status),
    current_period_start: sub.currentPeriodStart.toISOString(),
    current_period_end: sub.currentPeriodEnd.toISOString(),
    next_billing_date: nextBillingIso,
    next_billing_at: nextBillingIso,
    price_vnd: sub.priceVnd,
    dunning_attempts: sub.dunningAttempts,
    consent_terms_version: sub.consentTermsVersion,
  };
}

function parsePackageOffersFromDb(rawOffers: JsonValue | undefined): Offer[] {
  if (!Array.isArray(rawOffers)) {
    return [];
  }
  const result: Offer[] = [];
  for (const item of rawOffers) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      continue;
    }
    const offerCode = Reflect.get(item, "offer_code");
    const billingPeriod = Reflect.get(item, "billing_period");
    const priceVnd = Reflect.get(item, "price_vnd");
    const durationDays = Reflect.get(item, "duration_days");
    if (
      typeof offerCode === "string" &&
      typeof billingPeriod === "string" &&
      typeof priceVnd === "number" &&
      (typeof durationDays === "number" || durationDays === null)
    ) {
      result.push({
        offer_code: offerCode,
        billing_period: billingPeriod,
        price_vnd: priceVnd,
        duration_days: durationDays,
      });
    }
  }
  return result;
}

function isExactBillingPeriodOffer(
  offer: Offer,
  billingPeriod: "monthly" | "annual"
): boolean {
  if (offer.duration_days === null) {
    return false;
  }
  if (offer.billing_period === billingPeriod) {
    return true;
  }
  if (offer.offer_code === billingPeriod) {
    return true;
  }
  if (
    billingPeriod === "annual" &&
    offer.billing_period === "1 năm" &&
    offer.duration_days === 365
  ) {
    return true;
  }
  if (
    billingPeriod === "monthly" &&
    offer.billing_period === "1 tháng" &&
    offer.duration_days === 30
  ) {
    return true;
  }
  return false;
}

function resolveSellableRecurringOffer(
  packageCode: string,
  billingPeriod: "monthly" | "annual",
  offerCode?: string,
  dbOffers?: readonly Offer[]
): { pkg: PackageDefinition; matchedOffer: Offer; resolvedOfferCode: string } {
  const pkg = PACKAGE_CATALOG[packageCode];
  if (!pkg) {
    throw new PackageNotFoundError();
  }

  if (!pkg.is_public || pkg.status !== "active") {
    throw new PackageNotSellableError();
  }

  if (offerCode === "lifetime") {
    throw new PackageNotSellableError(
      "Gói trọn đời không hỗ trợ thanh toán định kỳ."
    );
  }

  const candidatePool = dbOffers && dbOffers.length > 0 ? dbOffers : pkg.offers;

  const findStrictMatch = (offers: readonly Offer[]): Offer | undefined => {
    if (offerCode) {
      return offers.find(
        (o) =>
          o.offer_code === offerCode &&
          isExactBillingPeriodOffer(o, billingPeriod)
      );
    }
    return (
      offers.find(
        (o) => o.billing_period === billingPeriod && o.duration_days !== null
      ) ?? offers.find((o) => isExactBillingPeriodOffer(o, billingPeriod))
    );
  };

  const matchedDbOffer = findStrictMatch(candidatePool);
  const matchedCatalogOffer = findStrictMatch(pkg.offers);
  const matchedOffer = matchedDbOffer ?? matchedCatalogOffer;

  if (!matchedOffer || matchedOffer.duration_days === null) {
    throw new PackageNotSellableError(
      "Gói dịch vụ không hỗ trợ kỳ thanh toán định kỳ đã chọn."
    );
  }

  if (!Number.isFinite(matchedOffer.price_vnd) || matchedOffer.price_vnd <= 0) {
    throw new ValidationError(
      "Gói dịch vụ chưa được niêm yết giá bán hợp lệ cho kỳ thanh toán này."
    );
  }

  return {
    pkg,
    matchedOffer,
    resolvedOfferCode: offerCode ?? matchedOffer.offer_code,
  };
}

export async function optInUserRecurringSubscription(
  input: OptInRecurringSubscriptionInput
) {
  const repos = useOwnerRepositories();
  const userRecord = await repos.users.findById(input.userId);

  if (!userRecord) {
    throw new UnauthenticatedError();
  }

  assertUnrestrictedUser(USER_STATUS_CODEC.toLabel(userRecord.status));

  const existingDbPackage = await repos.packages.findByCode(input.packageCode);
  const dbOffers = parsePackageOffersFromDb(existingDbPackage?.offers);

  const { pkg, matchedOffer, resolvedOfferCode } =
    resolveSellableRecurringOffer(
      input.packageCode,
      input.billingPeriod,
      input.offerCode,
      dbOffers
    );

  if (!existingDbPackage) {
    await repos.packages.upsertCatalog({
      code: pkg.code,
      name: pkg.name,
      description: pkg.description,
      audience: pkg.audience,
      offers: pkg.offers.map((o) => ({
        offer_code: o.offer_code,
        billing_period: o.billing_period,
        price_vnd: o.price_vnd,
        duration_days: o.duration_days,
      })),
      isPublic: pkg.is_public,
      status:
        pkg.status === "retired"
          ? PACKAGE_STATUS.RETIRED
          : PACKAGE_STATUS_CODEC.toCode(pkg.status),
    });
  }

  const now = new Date();
  const [activeEntitlements, userOrders, existingSubs] = await Promise.all([
    repos.entitlements.listActiveForUser(userRecord.id, now),
    repos.orders.listByUser(userRecord.id, 100),
    repos.recurringSubscriptions.listByUser(userRecord.id),
  ]);

  const hasActiveRecurring = existingSubs.some(
    (sub) =>
      sub.packageCode === pkg.code &&
      sub.status === RECURRING_SUBSCRIPTION_STATUS.ACTIVE
  );
  if (hasActiveRecurring) {
    throw new InvalidStatusTransitionError(
      "Bạn đã kích hoạt gia hạn tự động cho gói dịch vụ này rồi."
    );
  }

  const pkgEntitlementKeys = new Set<string>(pkg.entitlements);
  const hasPaidActiveEntitlement = activeEntitlements.some(
    (ent) =>
      ent.source === ENTITLEMENT_SOURCE.PACKAGE_ORDER &&
      ent.status === ENTITLEMENT_STATUS.ACTIVE &&
      pkgEntitlementKeys.has(ent.entitlementKey)
  );
  const hasApprovedPackageOrder = userOrders.some(
    (ord) =>
      ord.packageCode === pkg.code &&
      ord.status === PAYMENT_ORDER_STATUS.APPROVED
  );
  if (!(hasPaidActiveEntitlement || hasApprovedPackageOrder)) {
    throw new EntitlementRequiredError({
      required_package: pkg.code,
      message:
        "Bạn cần thanh toán và kích hoạt gói dịch vụ trước khi bật gia hạn tự động.",
    });
  }

  const resolvedTermsVersion = input.termsVersion ?? "v1.0";
  const priceVnd = matchedOffer.price_vnd;

  const consentSnapshot = {
    package_code: pkg.code,
    offer_code: resolvedOfferCode,
    billing_period: input.billingPeriod,
    price_vnd: priceVnd,
    terms_version: resolvedTermsVersion,
    accepted_at: now.toISOString(),
    ip_address: input.ipAddress,
    user_agent: input.userAgent,
  };

  const subscription = await createRecurringSubscription(
    {
      userId: userRecord.id,
      packageCode: pkg.code,
      offerCode: resolvedOfferCode,
      billingPeriod: input.billingPeriod,
      priceVnd,
      termsVersion: resolvedTermsVersion,
      consentSnapshot,
    },
    now
  );

  if (!subscription) {
    throw new InternalError("Không thể khởi tạo gói gia hạn tự động.");
  }

  await repos.consents.recordConsent({
    userId: userRecord.id,
    consentType: CONSENT_TYPE.TERMS,
    action: CONSENT_ACTION.ACCEPTED,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    createdAt: now,
  });

  await repos.auditLogs.insertLog({
    actorType: ACTOR_TYPE.USER,
    actorId: userRecord.id,
    action: "subscription.opt_in_recurring",
    entityType: "recurring_subscription",
    entityId: String(subscription.id),
    afterData: consentSnapshot,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    createdAt: now,
  });

  const nextBillingIso = subscription.nextBillingAt
    ? subscription.nextBillingAt.toISOString()
    : subscription.currentPeriodEnd.toISOString();

  return {
    subscription_id: String(subscription.id),
    package_code: subscription.packageCode,
    billing_period: subscription.billingPeriod,
    price_vnd: subscription.priceVnd,
    auto_renew: true,
    status: RECURRING_SUBSCRIPTION_STATUS_CODEC.toLabel(subscription.status),
    current_period_end: subscription.currentPeriodEnd.toISOString(),
    next_billing_date: nextBillingIso,
    next_billing_at: nextBillingIso,
  };
}

export async function cancelUserRecurringSubscription(
  input: CancelUserRecurringInput
) {
  const repos = useRepositories();
  let targetSubscriptionId = input.subscriptionId;

  if (targetSubscriptionId) {
    const matchingSub = await repos.recurringSubscriptions.findByIdForUser(
      targetSubscriptionId,
      input.userId
    );
    if (!matchingSub) {
      throw new SubscriptionNotFoundError();
    }
  } else {
    const subs = await repos.recurringSubscriptions.listByUser(input.userId);
    const latestSub = subs[0];
    if (!latestSub) {
      throw new SubscriptionNotFoundError();
    }
    targetSubscriptionId = latestSub.id;
  }

  const result = await userCancelRecurringSubscription(
    input.userId,
    targetSubscriptionId,
    new Date(),
    input.reason
  );

  return {
    ok: true,
    subscription_id: String(result.subscription_id),
    status: result.status,
    auto_renew: false,
    active_until: result.effective_until,
    effective_until: result.effective_until,
  };
}

export async function grantManagerUserEntitlements(
  input: GrantManagerUserEntitlementsInput
) {
  const pkg = PACKAGE_CATALOG[input.packageCode];
  if (!pkg) {
    throw new PackageNotFoundError();
  }

  const repos = useRepositories();
  const user = await repos.users.findByUuid(input.userUuid);

  if (!user) {
    throw new UserNotFoundError(input.userUuid);
  }

  const granted = await mutateUserEntitlements({
    userId: user.id,
    packageCode: input.packageCode,
    durationDays: input.durationDays,
    source: "manual_grant",
    reason: input.grantReason,
    actor: {
      type: "manager",
      id: input.managerId,
      ip: input.ipAddress,
      userAgent: input.userAgent,
    },
  });

  if (input.notifyUser) {
    await repos.notifications.createInAppNotification({
      recipientType: RECIPIENT_TYPE.USER,
      recipientId: user.id,
      templateCode: "entitlement_granted",
      payload: {
        package_code: input.packageCode,
        package_name: pkg.name,
        duration_days: input.durationDays,
      },
    });
  }

  return {
    entitlements: granted.map((g) => ({
      key: g.key,
      expires_at: g.expires_at ? g.expires_at.toISOString() : null,
    })),
  };
}

export async function listManagerUserSubscriptions(uuidParam: string) {
  const isNumeric = NUMERIC_REGEX.test(uuidParam);
  if (!(isNumeric || UUID_REGEX.test(uuidParam))) {
    throw new UserNotFoundError(uuidParam);
  }

  const repos = useOwnerRepositories();
  const targetUser = isNumeric
    ? await repos.users.findById(Number(uuidParam))
    : await repos.users.findByUuid(uuidParam);

  if (!targetUser) {
    throw new UserNotFoundError(uuidParam);
  }

  const userSubs = await repos.recurringSubscriptions.listByUser(targetUser.id);

  return {
    user_id: targetUser.id,
    user_uuid: targetUser.uuid,
    subscriptions: userSubs.map((s) => ({
      id: s.id,
      package_code: s.packageCode,
      offer_code: s.offerCode,
      billing_period: s.billingPeriod,
      price_vnd: s.priceVnd,
      auto_renew: s.autoRenew,
      status: RECURRING_SUBSCRIPTION_STATUS_CODEC.toLabel(s.status),
      current_period_start: s.currentPeriodStart.toISOString(),
      current_period_end: s.currentPeriodEnd.toISOString(),
      next_billing_at: s.nextBillingAt ? s.nextBillingAt.toISOString() : null,
      dunning_attempts: s.dunningAttempts,
      cancelled_at: s.cancelledAt ? s.cancelledAt.toISOString() : null,
      cancelled_by: s.cancelledBy,
      cancel_reason: s.cancelReason,
      cancel_note: s.cancelNote,
      created_at: s.createdAt.toISOString(),
    })),
  };
}
