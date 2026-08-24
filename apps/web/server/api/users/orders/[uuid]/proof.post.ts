import { appError } from "@mindkid/auth";
import {
  PROOF_ALLOWED_MIME_TYPES,
  PROOF_MAX_IMAGE_SIZE_BYTES,
} from "@mindkid/config";
import { entitlements, getDb, paymentOrders } from "@mindkid/db";
import {
  computeSoftUnlockExpiresAt,
  PACKAGE_CATALOG,
  type PaymentOrderStatus,
} from "@mindkid/shared";
import { uploadPrivateAsset } from "@mindkid/storage";
import { and, eq } from "drizzle-orm";
import { defineEventHandler, getRouterParam, readMultipartFormData } from "h3";
import { requireWebUserSession } from "#server/utils/auth-runtime";

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
    throw appError(
      "PAYMENT_PROOF_REQUIRED",
      "Mã giao dịch ngân hàng là bắt buộc (từ 4 đến 64 ký tự)."
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
    throw appError(
      "PAYLOAD_TOO_LARGE",
      "Ảnh chứng từ không được vượt quá 5 MB."
    );
  }

  const mimeType = proofFile.type?.toLowerCase() || "";
  if (
    !PROOF_ALLOWED_MIME_TYPES.includes(
      mimeType as (typeof PROOF_ALLOWED_MIME_TYPES)[number]
    )
  ) {
    throw appError(
      "UNSUPPORTED_MEDIA_TYPE",
      "Chỉ chấp nhận tệp ảnh định dạng JPEG, PNG hoặc WEBP."
    );
  }

  const ext = mimeType.split("/")[1] || "jpg";
  const storageKey = `proofs/${orderUuid}/${Date.now()}.${ext}`;

  const uploadResult = await uploadPrivateAsset({
    key: storageKey,
    body: proofFile.data,
    contentType: mimeType,
  });
  return uploadResult.path;
}

export default defineEventHandler(async (event) => {
  const session = requireWebUserSession(event);
  const orderUuid = getRouterParam(event, "uuid");
  if (!orderUuid) {
    throw appError("VALIDATION_FAILED", "Order UUID is required");
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
    throw appError("NOT_FOUND");
  }

  const currentStatus = order.status as PaymentOrderStatus;
  if (
    currentStatus === "approved" ||
    currentStatus === "expired" ||
    currentStatus === "rejected" ||
    currentStatus === "cancelled"
  ) {
    throw appError("INVALID_STATUS_TRANSITION", {
      current_status: currentStatus,
      reason: "Đơn hàng đã kết thúc xử lý hoặc đã hết hạn.",
    });
  }

  const { bankTxnRef, proofFile } = await extractProofFormData(event);
  const uploadedPath = await uploadProofFileIfProvided(proofFile, order.uuid);
  const newProofPath = uploadedPath ?? order.proofPath;

  const softUnlockExpiresAt = computeSoftUnlockExpiresAt();

  await db.transaction(async (tx) => {
    await tx
      .update(paymentOrders)
      .set({
        status: "submitted",
        submittedAt: new Date(),
        bankTxnRef,
        proofPath: newProofPath,
        updatedAt: new Date(),
      })
      .where(eq(paymentOrders.id, order.id));

    const pkg = PACKAGE_CATALOG[order.packageCode];
    const entitlementKeysToGrant = pkg?.entitlements || [];

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

      if (existingEntitlement) {
        if (existingEntitlement.status !== "active") {
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
        }
      } else {
        await tx.insert(entitlements).values({
          userId: order.userId,
          entitlementKey: key,
          source: "package_order",
          sourceRef: order.uuid,
          status: "soft_unlock",
          expiresAt: softUnlockExpiresAt,
        });
      }
    }
  });

  return {
    status: "submitted",
    soft_unlock_until: softUnlockExpiresAt,
    message:
      "Bạn đã có thể dùng ngay. Chúng tôi sẽ xác nhận trong 12 giờ làm việc.",
  };
});
