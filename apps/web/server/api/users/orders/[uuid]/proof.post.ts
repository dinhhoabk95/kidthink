import { PaymentProofRequiredError } from "@mindkid/errors/billing";
import { ValidationError } from "@mindkid/errors/common";
import {
  defineEventHandler,
  getHeader,
  getRouterParam,
  type H3Event,
  readMultipartFormData,
} from "h3";
import {
  type ProofFileUploadInput,
  submitUserOrderProof,
} from "#server/services/order-service";
import {
  getVerifiedRemoteIp,
  requireWebUserSession,
} from "#server/utils/auth-runtime";

interface ParsedProofInput {
  bankTxnRef: string;
  proofFile?: ProofFileUploadInput;
}

async function extractProofFormData(event: H3Event): Promise<ParsedProofInput> {
  const formData = await readMultipartFormData(event);
  let bankTxnRef: string | undefined;
  let proofFile: ProofFileUploadInput | undefined;

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

export default defineEventHandler(async (event) => {
  const session = requireWebUserSession(event);
  const orderUuid = getRouterParam(event, "uuid");
  if (!orderUuid) {
    throw new ValidationError("Order UUID is required");
  }

  const { bankTxnRef, proofFile } = await extractProofFormData(event);

  return await submitUserOrderProof({
    userId: session.user_id,
    orderUuid,
    bankTxnRef,
    proofFile,
    ipAddress: getVerifiedRemoteIp(event),
    userAgent: getHeader(event, "user-agent") ?? null,
  });
});
