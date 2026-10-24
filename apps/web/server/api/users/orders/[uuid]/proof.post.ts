import { writeAudit } from "@mindkid/audit";
import {
  PROOF_ALLOWED_MIME_TYPES,
  PROOF_MAX_IMAGE_SIZE_BYTES,
} from "@mindkid/config";
import { entitlements, getDb, paymentOrders } from "@mindkid/db";
import { PaymentProofRequiredError } from "@mindkid/errors/billing";
import {
  NotFoundError,
  PayloadTooLargeError,
  ValidationError,
} from "@mindkid/errors/common";
import {
  InvalidStatusTransitionError,
  UnsupportedMediaTypeError,
} from "@mindkid/errors/content";
import {
  canTransitionPaymentOrderStatus,
  computeSoftUnlockExpiresAt,
  PACKAGE_CATALOG,
  type PaymentOrderStatus,
} from "@mindkid/shared";
import {
  detectImageMimeType,
  isSvgContent,
  uploadPrivateAsset,
} from "@mindkid/storage";
import { and, eq, inArray, ne } from "drizzle-orm";
import {
  defineEventHandler,
  getHeader,
  getRouterParam,
  type H3Event,
  readMultipartFormData,
} from "h3";
import {
  getVerifiedRemoteIp,
  requireWebUserSession,
} from "#server/utils/auth-runtime";
import { invalidateUserEntitlementsCache } from "#server/utils/entitlements-runtime";

interface ParsedProofInput {
  bankTxnRef: string;
  proofFile?: { data: Buffer; type?: string; filename?: string };
}

async function extractProofFormData(event: H3Event): Promise<ParsedProofInput> {
  const formData = await readMultipartFormData(event);
  let bankTxnRef: string | undefined;
  let proofFile: { data: Buffer; type?: string; filename?: string } | undefined;

  if (formData && Array.isArray(formData)) {
    for (const part of formData) {
      if (part.name === "bank_txn_ref") {
        bankTxnRef = part.data.toString("utf-8").trim();
      } else if (part.name === "proof" && part.data && part.data.length > 0) {
        proofFile = {
          data: part.data,
          type: part.type,
          filename: part.filename,
        };
      }
    }
  }

  if (!bankTxnRef || bankTxnRef.length < 4 || bankTxnRef.length > 64) {
    throw new PaymentProofRequiredError(
      "Mã giao dịch ngân hàng là bắt buộc (từ 4 đến 64 ký tự);."
    );
  }

  return { bankTxnRef, proofFile };
}

async function uploadProofFileIfProvided(
  proofFile: { data: Buffer; type?: string } | undefined,
  orderUuid: string
): Promise<string | undefined> {
  if (!proofFile) {
    return undefined;
  }

  if (proofFile.data.length > PROOF_MAX_IMAGE_SIZE_BYTES) {
    throw new PayloadTooLargeError("Ảnh chứng từ không được vượt quá 5 MB.");
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

type DbTransaction = Parameters<
  Parameters<ReturnType<typeof getDb>["transaction"]>[0]
>[0];

async function grantSoftUnlockEntitlements(
  tx: DbTransaction,
  order: typeof paymentOrders.$inferSelect,
  softUnlockExpiresAt: Date
): Promise<boolean> {
  const [priorUnapprovedOrder] = await tx
    .select()
    .from(paymentOrders)
    .where(
      and(
        eq(paymentOrders.userId, order.userId),
        eq(paymentOrders.packageCode, order.packageCode),
        ne(paymentOrders.id, order.id),
        inArray(paymentOrders.status, ["rejected", "submitted", "under_review"])
      )
    )
    .limit(1);

  if (priorUnapprovedOrder) {
    return false;
  }

  const pkg = PACKAGE_CATALOG[order.packageCode];
  const entitlementKeysToGrant = pkg?.entitlements || [];
  let grantedAny = false;

  for (const key of entitlementKeysToGrant) {
    const [existingEntitlement] = await tx
      .select()
      .from(entitlements)
      .where(
        and(
          eq(entitlements.userId, order.userId),
          eq(entitlements.entitlementKey, key)
        )
      )
      .limit(1);

    if (!existingEntitlement) {
      await tx.insert(entitlements).values({
        userId: order.userId,
        entitlementKey: key,
        source: "package_order",
        sourceRef: order.uuid,
        status: "soft_unlock",
        expiresAt: softUnlockExpiresAt,
      });
      grantedAny = true;
      continue;
    }

    if (
      existingEntitlement.status === "expired" ||
      existingEntitlement.status === "cancelled"
    ) {
      await tx
        .update(entitlements)
        .set({
          status: "soft_unlock",
          source: "package_order",
          sourceRef: order.uuid,
          expiresAt: softUnlockExpiresAt,
          updatedAt: new Date(),
        })
        .where(eq(entitlements.id, existingEntitlement.id));
      grantedAny = true;
    }
  }

  return grantedAny;
}

function assertOrderAcceptsProof(
  order: typeof paymentOrders.$inferSelect,
  now: Date
): PaymentOrderStatus {
  const currentStatus = order.status as PaymentOrderStatus;
  const isExpiredPending =
    (currentStatus === "pending" || currentStatus === "pending_proof") &&
    order.expiresAt !== null &&
    order.expiresAt.getTime() <= now.getTime();

  if (
    isExpiredPending ||
    (currentStatus !== "submitted" &&
      !canTransitionPaymentOrderStatus(currentStatus, "submitted"))
  ) {
    throw new InvalidStatusTransitionError({
      current_status: currentStatus,
      reason: "Đơn hàng đã kết thúc xử lý hoặc đã hết hạn.",
    });
  }
  return currentStatus;
}

export default defineEventHandler(async (event) => {
  const session = requireWebUserSession(event);
  const orderUuid = getRouterParam(event, "uuid");
  if (!orderUuid) {
    throw new ValidationError("Order UUID is required");
  }

  const db = getDb();
  const [order] = await db
    .select()
    .from(paymentOrders)
    .where(
      and(
        eq(paymentOrders.uuid, orderUuid),
        eq(paymentOrders.userId, session.user_id)
      )
    )
    .limit(1);

  if (!order) {
    throw new NotFoundError();
  }

  const now = new Date();
  assertOrderAcceptsProof(order, now);

  const { bankTxnRef, proofFile } = await extractProofFormData(event);
  const uploadedPath = await uploadProofFileIfProvided(proofFile, order.uuid);
  const softUnlockExpiresAt = computeSoftUnlockExpiresAt(now);
  let grantedSoftUnlock = false;

  await db.transaction(async (tx) => {
    const [lockedOrder] = await tx
      .select()
      .from(paymentOrders)
      .where(
        and(
          eq(paymentOrders.uuid, orderUuid),
          eq(paymentOrders.userId, session.user_id)
        )
      )
      .for("update");

    if (!lockedOrder) {
      throw new NotFoundError();
    }

    const lockedStatus = assertOrderAcceptsProof(lockedOrder, now);
    const isFirstSubmission =
      lockedStatus === "pending" || lockedStatus === "pending_proof";
    const newProofPath = uploadedPath ?? lockedOrder.proofPath;

    await tx
      .update(paymentOrders)
      .set({
        ...(isFirstSubmission
          ? {
              status: "submitted" as const,
              submittedAt: now,
            }
          : {}),
        bankTxnRef,
        proofPath: newProofPath,
        updatedAt: now,
      })
      .where(eq(paymentOrders.id, lockedOrder.id));

    if (isFirstSubmission) {
      grantedSoftUnlock = await grantSoftUnlockEntitlements(
        tx,
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
      ip_address: getVerifiedRemoteIp(event),
      user_agent: getHeader(event, "user-agent") ?? null,
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
});
