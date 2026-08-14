export interface BankConfig {
  bankId: string;
  bankName: string;
  accountNo: string;
  accountName: string;
}

export function getBankConfig(): BankConfig {
  return {
    bankId: process.env.VIETQR_BANK_ID || "MB",
    bankName:
      process.env.VIETQR_BANK_NAME || "Ngân hàng TMCP Quân Đội (MB Bank)",
    accountNo: process.env.VIETQR_ACCOUNT_NO || "999988886666",
    accountName: process.env.VIETQR_ACCOUNT_NAME || "CONG TY TNHH TINIMATH",
  };
}

export interface VietQrPayloadResult {
  qrPayload: string;
  qrImageUrl: string;
  bankInfo: BankConfig;
}

export function generateVietQrPayload(options: {
  bankId?: string;
  accountNo?: string;
  accountName?: string;
  amountVnd: number;
  transferNote: string;
}): VietQrPayloadResult {
  const bank = getBankConfig();
  const bankId = options.bankId || bank.bankId;
  const accountNo = options.accountNo || bank.accountNo;
  const accountName = options.accountName || bank.accountName;
  const amount = options.amountVnd;
  const note = options.transferNote;

  const qrImageUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
    note
  )}&accountName=${encodeURIComponent(accountName)}`;

  return {
    qrPayload: `vietqr://${bankId}/${accountNo}?amount=${amount}&info=${encodeURIComponent(
      note
    )}`,
    qrImageUrl,
    bankInfo: {
      bankId,
      bankName: bank.bankName,
      accountNo,
      accountName,
    },
  };
}

/**
 * Calculates new expiration date by stacking with existing active expiration date (BR-POC-05, BR-PAP-05)
 * Formula: max(now, existing_expires_at) + duration_days + bonus_days
 * Returns null if durationDays is null (lifetime)
 */
export function computeStackedExpiryDate(
  currentExpiresAt: Date | string | null | undefined,
  durationDays: number | null | undefined,
  bonusDays = 0,
  now = new Date()
): Date | null {
  if (durationDays === null || durationDays === undefined) {
    return null; // Lifetime access
  }

  let baseDate = new Date(now);
  if (currentExpiresAt) {
    const existing = new Date(currentExpiresAt);
    if (
      !Number.isNaN(existing.getTime()) &&
      existing.getTime() > baseDate.getTime()
    ) {
      baseDate = existing;
    }
  }

  const totalDays = durationDays + (bonusDays > 0 ? bonusDays : 0);
  const result = new Date(baseDate);
  result.setDate(result.getDate() + totalDays);
  return result;
}
