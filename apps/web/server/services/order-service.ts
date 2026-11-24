import { writeAudit } from "@mindkid/audit";
import {
  MissingEnvError,
  PROOF_ALLOWED_MIME_TYPES,
  PROOF_MAX_IMAGE_SIZE_BYTES,
} from "@mindkid/config";
import {
  ENTITLEMENT_SOURCE,
  ENTITLEMENT_STATUS,
  isUniqueConstraintError,
  type JsonValue,
  PAYMENT_ORDER_STATUS,
  PAYMENT_ORDER_STATUS_CODEC,
  type PaymentOrderEntity,
  type PaymentOrderStatus,
  type PaymentOrderStatusLabel,
  USER_STATUS_CODEC,
} from "@mindkid/db";
import {
  createRepositories,
  type MindKidRepositories,
} from "@mindkid/db/repositories";
import { UnauthenticatedError } from "@mindkid/errors/auth";
import {
  OfferNotFoundError,
  OrderAlreadyPendingError,
  OrderAlreadyProcessedError,
  OrderCannotBeCancelledError,
  OrderNotFoundError,
  PackageNotFoundError,
  PackageNotSellableError,
} from "@mindkid/errors/billing";
import {
  InternalError,
  NotFoundError,
  PayloadTooLargeError,
  ServiceUnavailableError,
  ValidationError,
} from "@mindkid/errors/common";
import {
  InvalidStatusTransitionError,
  UnsupportedMediaTypeError,
} from "@mindkid/errors/content";
import {
  type AutomatedPaymentProvider,
  assertPaymentOrderTransition,
  canTransitionPaymentOrderStatus,
  computeOrderPendingExpiresAt,
  computeSoftUnlockExpiresAt,
  formatTransferNote,
  generateVietQrPayload,
  type Offer,
  PACKAGE_CATALOG,
  type PaymentOrderStatus as SharedPaymentOrderStatus,
  type VietQrPayloadResult,
} from "@mindkid/shared";
import {
  detectImageMimeType,
  isSvgContent,
  uploadPrivateAsset,
} from "@mindkid/storage";
import { assertUnrestrictedUser } from "#server/utils/auth-runtime";
import { invalidateUserEntitlementsCache } from "#server/utils/entitlements-runtime";
import { useRepositories } from "#server/utils/repositories";

const VALID_ORDER_STATUS_LABELS = [
  "draft",
  "pending",
  "pending_proof",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "expired",
  "cancelled",
] as const satisfies readonly SharedPaymentOrderStatus[];

function parseValidOrderStatus(val: string): PaymentOrderStatus | null {
  const matched = VALID_ORDER_STATUS_LABELS.find((s) => s === val);
  return matched ? PAYMENT_ORDER_STATUS_CODEC.toCode(matched) : null;
}

export interface CreateUserOrderInput {
  readonly userId: number;
  readonly packageCode: string;
  readonly offerCode: string;
  readonly ipAddress: string;
  readonly userAgent: string | null;
}

export interface CreatedUserOrderResult {
  readonly uuid: string;
  readonly package_code: string;
  readonly offer_code: string;
  readonly amount_vnd: number;
  readonly currency: string;
  readonly status: PaymentOrderStatusLabel;
  readonly transfer_note: string | null;
  readonly qr_payload: string;
  readonly qr_image_url: string;
  readonly bank_info: VietQrPayloadResult["bankInfo"];
  readonly expires_at: Date | null;
  readonly created_at: Date;
}

export interface ListManagerOrdersQuery {
  readonly status: string;
  readonly package_code?: string;
  readonly amount_min?: number;
  readonly amount_max?: number;
  readonly submitted_from?: string;
  readonly submitted_to?: string;
  readonly q?: string;
  readonly sort: "oldest" | "newest";
  readonly limit: number;
}

export interface ManagerOrderItem {
  readonly uuid: string;
  readonly user: {
    readonly id: number;
    readonly email: string;
    readonly display_name: string;
    readonly child_profiles_count: number;
  };
  readonly package_code: string;
  readonly offer_code: string;
  readonly amount_vnd: number;
  readonly currency: string;
  readonly status: PaymentOrderStatusLabel;
  readonly transfer_note: string | null;
  readonly bank_txn_ref: string | null;
  readonly has_proof: boolean;
  readonly submitted_at: Date | null;
  readonly reviewed_at: Date | null;
  readonly created_at: Date;
  readonly expires_at: Date | null;
  readonly flags: {
    readonly duplicate_bank_txn_ref: boolean;
    readonly user_has_prior_rejected_order: boolean;
  };
}

export interface ManagerOrdersQueueResult {
  readonly items: readonly ManagerOrderItem[];
  readonly next_cursor: string | null;
  readonly stats: {
    readonly pending_count: number;
    readonly oldest_waiting_hours: number;
  };
}

export interface ProofFileUploadInput {
  readonly data: Buffer;
  readonly type?: string;
  readonly filename?: string;
}

export interface SubmitUserOrderProofInput {
  readonly userId: number;
  readonly orderUuid: string;
  readonly bankTxnRef: string;
  readonly proofFile?: ProofFileUploadInput;
  readonly ipAddress: string;
  readonly userAgent: string | null;
}

export interface CreateCheckoutSessionInput {
  readonly userId: number;
  readonly orderUuid: string;
  readonly provider: AutomatedPaymentProvider;
}

function parseDbPackageOffers(rawOffers: JsonValue | undefined): Offer[] {
  if (!Array.isArray(rawOffers)) {
    return [];
  }
  const offers: Offer[] = [];
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
      offers.push({
        offer_code: offerCode,
        billing_period: billingPeriod,
        price_vnd: priceVnd,
        duration_days: durationDays,
      });
    }
  }
  return offers;
}

const OPEN_ORDER_UNIQUE_COLUMNS = [
  "payment_orders.user_id",
  "payment_orders.package_code",
] as const;
const LIVE_ENTITLEMENT_UNIQUE_COLUMNS = [
  "entitlements.user_id",
  "entitlements.entitlement_key",
] as const;

export function buildVietQrOrThrow(
  amountVnd: number,
  transferNote: string
): VietQrPayloadResult {
  try {
    return generateVietQrPayload({ amountVnd, transferNote });
  } catch (error) {
    // Chỉ lỗi thiếu cấu hình mới đổi thành 503; lỗi khác (bug) phải nổi lên nguyên trạng.
    if (!(error instanceof MissingEnvError)) {
      throw error;
    }
    console.error(
      JSON.stringify({
        level: "ERROR",
        event: "order.vietqr_env_missing",
        missingEnv: error.varName,
      })
    );
    throw new ServiceUnavailableError(
      "Hệ thống thanh toán tạm thời chưa cấu hình tài khoản nhận chuyển khoản."
    );
  }
}

export async function createUserOrder(
  input: CreateUserOrderInput
): Promise<CreatedUserOrderResult> {
  const repos = useRepositories();
  const userRecord = await repos.users.findById(input.userId);
  if (!userRecord) {
    throw new UnauthenticatedError();
  }

  assertUnrestrictedUser(USER_STATUS_CODEC.toLabel(userRecord.status));

  const pkg = PACKAGE_CATALOG[input.packageCode];
  if (!pkg) {
    throw new PackageNotFoundError();
  }

  if (!pkg.is_public || pkg.status !== "active") {
    throw new PackageNotSellableError();
  }

  const dbPkg = await repos.packages.findByCode(pkg.code);
  const dbOffers = parseDbPackageOffers(dbPkg?.offers);
  const resolvedOffer =
    dbOffers.find((o) => o.offer_code === input.offerCode) ??
    pkg.offers.find((o) => o.offer_code === input.offerCode);
  if (!resolvedOffer) {
    throw new OfferNotFoundError();
  }

  const effectivePriceVnd = resolvedOffer.price_vnd;
  if (!Number.isFinite(effectivePriceVnd) || effectivePriceVnd <= 0) {
    throw new ValidationError("Gói dịch vụ hiện chưa có mức giá bán hợp lệ.");
  }

  const orderUuid = crypto.randomUUID();
  const transferNote = formatTransferNote(orderUuid);
  const expiresAt = computeOrderPendingExpiresAt();

  const vietQr = buildVietQrOrThrow(effectivePriceVnd, transferNote);

  let insertedOrder: PaymentOrderEntity;
  try {
    insertedOrder = await repos.orders.transaction(async (tx) => {
      const txRepos = createRepositories(tx);
      const existingOrder =
        await txRepos.orders.findActivePendingForUserPackage(
          userRecord.id,
          input.packageCode
        );
      if (existingOrder) {
        throw new OrderAlreadyPendingError({
          existing_order_uuid: existingOrder.uuid,
          package_code: input.packageCode,
        });
      }

      const created = await txRepos.orders.createOrder({
        uuid: orderUuid,
        userId: userRecord.id,
        packageCode: pkg.code,
        offerCode: resolvedOffer.offer_code,
        amountVnd: effectivePriceVnd,
        currency: "VND",
        status: PAYMENT_ORDER_STATUS.PENDING,
        transferNote,
        expiresAt,
      });

      const createdStatusLabel = PAYMENT_ORDER_STATUS_CODEC.toLabel(
        created.status
      );

      await writeAudit(tx, {
        actor_type: "user",
        actor_id: userRecord.id,
        action: "order_created",
        entity_type: "payment_order",
        entity_id: created.uuid,
        after_data: {
          package_code: created.packageCode,
          offer_code: created.offerCode,
          amount_vnd: created.amountVnd,
          status: createdStatusLabel,
        },
        ip_address: input.ipAddress,
        user_agent: input.userAgent,
      });

      return created;
    });
  } catch (err) {
    if (
      err instanceof Error &&
      isUniqueConstraintError(err, OPEN_ORDER_UNIQUE_COLUMNS)
    ) {
      const existingOrder = await repos.orders.findActivePendingForUserPackage(
        userRecord.id,
        input.packageCode
      );
      if (existingOrder) {
        throw new OrderAlreadyPendingError({
          existing_order_uuid: existingOrder.uuid,
          package_code: input.packageCode,
        });
      }
      throw new OrderAlreadyPendingError({
        package_code: input.packageCode,
      });
    }
    throw err;
  }

  const insertedStatusLabel = PAYMENT_ORDER_STATUS_CODEC.toLabel(
    insertedOrder.status
  );

  return {
    uuid: insertedOrder.uuid,
    package_code: insertedOrder.packageCode,
    offer_code: insertedOrder.offerCode,
    amount_vnd: insertedOrder.amountVnd,
    currency: insertedOrder.currency,
    status: insertedStatusLabel,
    transfer_note: insertedOrder.transferNote,
    qr_payload: vietQr.qrPayload,
    qr_image_url: vietQr.qrImageUrl,
    bank_info: vietQr.bankInfo,
    expires_at: insertedOrder.expiresAt,
    created_at: insertedOrder.createdAt,
  };
}

export async function getUserOrderDetail(userId: number, orderUuid: string) {
  const repos = useRepositories();
  const order = await repos.orders.findByUuidForUser(orderUuid, userId);

  if (!order) {
    throw new NotFoundError();
  }

  let vietQr: VietQrPayloadResult | null = null;
  if (
    order.status === PAYMENT_ORDER_STATUS.PENDING ||
    order.status === PAYMENT_ORDER_STATUS.PENDING_PROOF
  ) {
    const safeTransferNote = order.transferNote || "";
    vietQr = buildVietQrOrThrow(order.amountVnd, safeTransferNote);
  }

  let userRejectionReason: string | undefined;
  if (order.status === PAYMENT_ORDER_STATUS.REJECTED) {
    userRejectionReason =
      "Thông tin chứng từ hoặc mã giao dịch chưa khớp với sao kê ngân hàng. Vui lòng kiểm tra lại hoặc liên hệ hỗ trợ.";
  }

  return {
    uuid: order.uuid,
    package_code: order.packageCode,
    offer_code: order.offerCode,
    amount_vnd: order.amountVnd,
    currency: order.currency,
    status: PAYMENT_ORDER_STATUS_CODEC.toLabel(order.status),
    transfer_note: order.transferNote,
    bank_txn_ref: order.bankTxnRef,
    has_proof: Boolean(order.proofPath),
    submitted_at: order.submittedAt,
    reviewed_at: order.reviewedAt,
    expires_at: order.expiresAt,
    created_at: order.createdAt,
    rejection_reason: userRejectionReason,
    qr_payload: vietQr?.qrPayload,
    qr_image_url: vietQr?.qrImageUrl,
    bank_info: vietQr?.bankInfo,
  };
}

export async function cancelUserOrder(userId: number, orderUuid: string) {
  const repos = useRepositories();
  const order = await repos.orders.findByUuidForUser(orderUuid, userId);

  if (!order) {
    throw new NotFoundError();
  }

  const currentStatus = PAYMENT_ORDER_STATUS_CODEC.toLabel(
    order.status
  ) as SharedPaymentOrderStatus;
  if (
    order.status !== PAYMENT_ORDER_STATUS.PENDING &&
    order.status !== PAYMENT_ORDER_STATUS.PENDING_PROOF
  ) {
    throw new OrderCannotBeCancelledError({
      status: currentStatus,
      reason: "Chỉ có thể huỷ đơn hàng ở trạng thái chờ thanh toán.",
    });
  }

  assertPaymentOrderTransition(
    order.status === PAYMENT_ORDER_STATUS.PENDING_PROOF
      ? "pending"
      : currentStatus,
    "cancelled"
  );

  const updatedOrder = await repos.orders.cancelByUser(
    orderUuid,
    userId,
    new Date()
  );

  if (!updatedOrder) {
    throw new InternalError("Huỷ đơn hàng thất bại");
  }

  return {
    uuid: updatedOrder.uuid,
    status: PAYMENT_ORDER_STATUS_CODEC.toLabel(updatedOrder.status),
  };
}

export async function createUserOrderCheckoutSession(
  input: CreateCheckoutSessionInput
) {
  const repos = useRepositories();
  const order = await repos.orders.findByUuidForUser(
    input.orderUuid,
    input.userId
  );

  if (!order) {
    throw new OrderNotFoundError(input.orderUuid);
  }

  if (
    order.status !== PAYMENT_ORDER_STATUS.PENDING &&
    order.status !== PAYMENT_ORDER_STATUS.DRAFT &&
    order.status !== PAYMENT_ORDER_STATUS.PENDING_PROOF
  ) {
    throw new OrderAlreadyProcessedError();
  }

  const pkg = PACKAGE_CATALOG[order.packageCode];
  if (!pkg) {
    throw new PackageNotFoundError();
  }
  if (!pkg.is_public || pkg.status !== "active") {
    throw new PackageNotSellableError();
  }

  const offer = pkg.offers.find((o) => o.offer_code === order.offerCode);
  if (!offer) {
    throw new OfferNotFoundError();
  }

  // BR-APM-03: Price is strictly determined by server-side PACKAGE_CATALOG
  const catalogAmountVnd =
    offer.price_vnd > 0 ? offer.price_vnd : order.amountVnd;
  const transferNote = order.transferNote || formatTransferNote(order.uuid);
  const vietQr = buildVietQrOrThrow(catalogAmountVnd, transferNote);

  const checkoutUrl = `https://checkout.${input.provider}.vn/pay/${order.uuid}?amount=${catalogAmountVnd}`;

  return {
    order_uuid: order.uuid,
    provider: input.provider,
    amount_vnd: catalogAmountVnd,
    currency: order.currency,
    transfer_note: transferNote,
    checkout_url: checkoutUrl,
    qr_payload: vietQr.qrPayload,
    qr_image_url: vietQr.qrImageUrl,
    bank_info: vietQr.bankInfo,
    expires_at: order.expiresAt,
  };
}

export async function uploadProofFileIfProvided(
  proofFile: ProofFileUploadInput | undefined,
  orderUuid: string
): Promise<string | undefined> {
  if (!proofFile) {
    return undefined;
  }

  if (proofFile.data.length > PROOF_MAX_IMAGE_SIZE_BYTES) {
    throw new PayloadTooLargeError("Ảnh chứng từ không được vượt quá 1,5 MB.");
  }

  if (isSvgContent(proofFile.data)) {
    throw new UnsupportedMediaTypeError(
      "Chỉ chấp nhận tệp ảnh định dạng JPEG, PNG hoặc WEBP."
    );
  }

  const detectedMime = detectImageMimeType(proofFile.data);
  if (
    !(
      detectedMime &&
      PROOF_ALLOWED_MIME_TYPES.includes(
        detectedMime as (typeof PROOF_ALLOWED_MIME_TYPES)[number]
      )
    )
  ) {
    throw new UnsupportedMediaTypeError(
      "Chỉ chấp nhận tệp ảnh định dạng JPEG, PNG hoặc WEBP."
    );
  }

  if (proofFile.type) {
    const declaredMime = proofFile.type.toLowerCase();
    if (
      !PROOF_ALLOWED_MIME_TYPES.includes(
        declaredMime as (typeof PROOF_ALLOWED_MIME_TYPES)[number]
      )
    ) {
      throw new UnsupportedMediaTypeError(
        "Chỉ chấp nhận tệp ảnh định dạng JPEG, PNG hoặc WEBP."
      );
    }
  }

  const ext = detectedMime.split("/")[1] || "jpg";
  const storageKey = `proofs/${orderUuid}/${Date.now()}.${ext}`;

  const uploadResult = await uploadPrivateAsset({
    key: storageKey,
    body: proofFile.data,
    contentType: detectedMime,
  });
  return uploadResult.path;
}

function assertOrderAcceptsProof(
  order: PaymentOrderEntity,
  now: Date
): SharedPaymentOrderStatus {
  const currentStatus = PAYMENT_ORDER_STATUS_CODEC.toLabel(
    order.status
  ) as SharedPaymentOrderStatus;
  const isExpiredPending =
    (order.status === PAYMENT_ORDER_STATUS.PENDING ||
      order.status === PAYMENT_ORDER_STATUS.PENDING_PROOF) &&
    order.expiresAt !== null &&
    order.expiresAt.getTime() <= now.getTime();

  if (
    isExpiredPending ||
    (order.status !== PAYMENT_ORDER_STATUS.SUBMITTED &&
      !canTransitionPaymentOrderStatus(currentStatus, "submitted"))
  ) {
    throw new InvalidStatusTransitionError({
      current_status: currentStatus,
      reason: "Đơn hàng đã kết thúc xử lý hoặc đã hết hạn.",
    });
  }
  return currentStatus;
}

async function tryGrantSoftUnlockForKey(
  txRepos: MindKidRepositories,
  order: PaymentOrderEntity,
  key: string,
  softUnlockExpiresAt: Date
): Promise<boolean> {
  const existingEntitlement = await txRepos.entitlements.findByUserAndKey(
    order.userId,
    key
  );

  try {
    if (!existingEntitlement) {
      await txRepos.entitlements.grantEntitlement({
        userId: order.userId,
        entitlementKey: key,
        source: ENTITLEMENT_SOURCE.PACKAGE_ORDER,
        sourceRef: order.uuid,
        status: ENTITLEMENT_STATUS.SOFT_UNLOCK,
        expiresAt: softUnlockExpiresAt,
      });
      return true;
    }

    const canReopen =
      existingEntitlement.status === ENTITLEMENT_STATUS.EXPIRED ||
      existingEntitlement.status === ENTITLEMENT_STATUS.CANCELLED;
    if (!canReopen) {
      return false;
    }

    await txRepos.entitlements.updateEntitlementById(existingEntitlement.id, {
      status: ENTITLEMENT_STATUS.SOFT_UNLOCK,
      source: ENTITLEMENT_SOURCE.PACKAGE_ORDER,
      sourceRef: order.uuid,
      expiresAt: softUnlockExpiresAt,
      updatedAt: new Date(),
    });
    return true;
  } catch (err) {
    if (
      err instanceof Error &&
      isUniqueConstraintError(err, LIVE_ENTITLEMENT_UNIQUE_COLUMNS)
    ) {
      return false;
    }
    throw err;
  }
}

async function grantSoftUnlockEntitlements(
  txRepos: MindKidRepositories,
  order: PaymentOrderEntity,
  softUnlockExpiresAt: Date
): Promise<boolean> {
  const hasPrior = await txRepos.orders.hasPriorUnapprovedOrder(
    order.userId,
    order.id
  );

  if (hasPrior) {
    return false;
  }

  const pkg = PACKAGE_CATALOG[order.packageCode];
  const entitlementKeysToGrant = pkg?.entitlements || [];
  let grantedAny = false;

  for (const key of entitlementKeysToGrant) {
    const granted = await tryGrantSoftUnlockForKey(
      txRepos,
      order,
      key,
      softUnlockExpiresAt
    );
    if (granted) {
      grantedAny = true;
    }
  }

  return grantedAny;
}

export async function submitUserOrderProof(input: SubmitUserOrderProofInput) {
  const repos = useRepositories();
  const order = await repos.orders.findByUuidForUser(
    input.orderUuid,
    input.userId
  );

  if (!order) {
    throw new NotFoundError();
  }

  const now = new Date();
  assertOrderAcceptsProof(order, now);

  const uploadedPath = await uploadProofFileIfProvided(
    input.proofFile,
    order.uuid
  );
  const softUnlockExpiresAt = computeSoftUnlockExpiresAt(now);
  let grantedSoftUnlock = false;

  await repos.orders.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    const lockedOrder = await txRepos.orders.findByUuidForUserForUpdate(
      input.orderUuid,
      input.userId
    );

    if (!lockedOrder) {
      throw new NotFoundError();
    }

    const lockedStatus = assertOrderAcceptsProof(lockedOrder, now);
    const isFirstSubmission =
      lockedStatus === "pending" || lockedStatus === "pending_proof";
    const newProofPath = uploadedPath ?? lockedOrder.proofPath;

    const updatedOrder = await txRepos.orders.updateProof(
      lockedOrder.id,
      lockedOrder.userId,
      {
        ...(isFirstSubmission
          ? {
              status: PAYMENT_ORDER_STATUS.SUBMITTED,
              submittedAt: now,
            }
          : {}),
        bankTxnRef: input.bankTxnRef,
        proofPath: newProofPath,
        updatedAt: now,
      }
    );

    if (!updatedOrder) {
      throw new OrderAlreadyProcessedError({
        current_status: lockedStatus,
        reason: "Đơn hàng đã được nộp chứng từ hoặc xử lý trước đó.",
      });
    }

    if (isFirstSubmission) {
      grantedSoftUnlock = await grantSoftUnlockEntitlements(
        txRepos,
        lockedOrder,
        softUnlockExpiresAt
      );
    }

    await writeAudit(tx, {
      actor_type: "user",
      actor_id: lockedOrder.userId,
      action: "payment_proof_submitted",
      entity_type: "payment_order",
      entity_id: lockedOrder.uuid,
      before_data: { status: lockedStatus },
      after_data: {
        status: "submitted",
        soft_unlock_granted: grantedSoftUnlock,
      },
      ip_address: input.ipAddress,
      user_agent: input.userAgent,
    });
  });

  if (order.userId > 0) {
    await invalidateUserEntitlementsCache(order.userId);
  }

  return {
    status: "submitted",
    soft_unlock_until: grantedSoftUnlock ? softUnlockExpiresAt : null,
    message:
      "Bạn đã có thể dùng ngay. Chúng tôi sẽ xác nhận trong 12 giờ làm việc.",
  };
}

export async function listManagerOrdersQueue(
  filter: ListManagerOrdersQuery
): Promise<ManagerOrdersQueueResult> {
  const repos = useRepositories();
  const statuses = filter.status
    .split(",")
    .map((s) => parseValidOrderStatus(s.trim()))
    .filter((s): s is PaymentOrderStatus => s !== null);

  const [queuePage, stats] = await Promise.all([
    repos.orders.listQueueForManager({
      statuses: statuses.length > 0 ? statuses : undefined,
      packageCode: filter.package_code,
      amountMin: filter.amount_min,
      amountMax: filter.amount_max,
      submittedFrom: filter.submitted_from,
      submittedTo: filter.submitted_to,
      q: filter.q,
      sort: filter.sort,
      limit: filter.limit,
    }),
    repos.orders.getQueueStats(),
  ]);

  const userIds = [...new Set(queuePage.items.map((order) => order.userId))];
  const bankTxnRefs = [
    ...new Set(
      queuePage.items
        .map((order) => order.bankTxnRef)
        .filter((ref): ref is string => Boolean(ref && ref.length > 0))
    ),
  ];

  const [childCountsMap, priorRejectedUsersSet, duplicateRefsSet] =
    await Promise.all([
      repos.childProfiles.countAllByUsers(userIds),
      repos.orders.listPriorRejectedUserIds(userIds),
      repos.orders.listDuplicateBankTxnRefs(bankTxnRefs),
    ]);

  const items: ManagerOrderItem[] = queuePage.items.map((order) => {
    return {
      uuid: order.uuid,
      user: {
        id: order.userId,
        email: order.user.email,
        display_name: order.user.displayName,
        child_profiles_count: childCountsMap.get(order.userId) ?? 0,
      },
      package_code: order.packageCode,
      offer_code: order.offerCode,
      amount_vnd: order.amountVnd,
      currency: order.currency,
      status: PAYMENT_ORDER_STATUS_CODEC.toLabel(order.status),
      transfer_note: order.transferNote,
      bank_txn_ref: order.bankTxnRef,
      has_proof: Boolean(order.proofPath),
      submitted_at: order.submittedAt,
      reviewed_at: order.reviewedAt,
      created_at: order.createdAt,
      expires_at: order.expiresAt,
      flags: {
        duplicate_bank_txn_ref: Boolean(
          order.bankTxnRef && duplicateRefsSet.has(order.bankTxnRef)
        ),
        user_has_prior_rejected_order: priorRejectedUsersSet.has(order.userId),
      },
    };
  });

  return {
    items,
    next_cursor: queuePage.nextCursor,
    stats: {
      pending_count: stats.pendingCount,
      oldest_waiting_hours: stats.oldestWaitingHours,
    },
  };
}
