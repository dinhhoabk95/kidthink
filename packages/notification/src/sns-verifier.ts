import { createVerify } from "node:crypto";

const AWS_SNS_DOMAIN_REGEX = /^sns\.[a-z0-9-]+\.amazonaws\.com$/;

/** AWS ký `SignatureVersion: "1"` bằng SHA1, `"2"` bằng SHA256. */
const SIGNATURE_ALGORITHMS: Record<string, string> = {
  "1": "RSA-SHA1",
  "2": "RSA-SHA256",
};

const CERT_CACHE_TTL_MS = 60 * 60 * 1000;
const certCache = new Map<string, { pem: string; fetchedAt: number }>();

export interface SnsMessage {
  Type: string;
  MessageId: string;
  TopicArn: string;
  Subject?: string;
  Message: string;
  Timestamp: string;
  SignatureVersion: string;
  Signature: string;
  SigningCertURL: string;
  UnsubscribeURL?: string;
  SubscribeURL?: string;
  Token?: string;
}

export interface SesEventMessage {
  eventType: "Delivery" | "Bounce" | "Complaint";
  mail: {
    messageId: string;
    destination: string[];
  };
  bounce?: {
    bounceType: "Permanent" | "Transient";
    bouncedRecipients: Array<{ emailAddress: string }>;
  };
  complaint?: {
    complainedRecipients: Array<{ emailAddress: string }>;
  };
}

export interface VerifySnsOptions {
  allowedTopicArns?: string[];
  maxAgeSeconds?: number;
}

export function verifySnsCertUrl(certUrl: string): boolean {
  try {
    const parsed = new URL(certUrl);
    if (parsed.protocol !== "https:") {
      return false;
    }
    return AWS_SNS_DOMAIN_REGEX.test(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Dựng chuỗi ký chuẩn của AWS SNS: các trường theo **đúng thứ tự bảng chữ cái**,
 * mỗi trường là hai dòng `tên\ngiá trị\n`. Sai một dấu xuống dòng là chữ ký
 * không khớp, nên đây là hàm riêng để test ký được đúng thứ nó verify.
 */
export function buildSnsStringToSign(msg: SnsMessage): string | null {
  if (msg.Type === "Notification") {
    let stringToSign = `Message\n${msg.Message}\nMessageId\n${msg.MessageId}\n`;
    if (msg.Subject) {
      stringToSign += `Subject\n${msg.Subject}\n`;
    }
    return `${stringToSign}Timestamp\n${msg.Timestamp}\nTopicArn\n${msg.TopicArn}\nType\n${msg.Type}\n`;
  }

  if (
    msg.Type === "SubscriptionConfirmation" ||
    msg.Type === "UnsubscribeConfirmation"
  ) {
    return `Message\n${msg.Message}\nMessageId\n${msg.MessageId}\nSubscribeURL\n${msg.SubscribeURL}\nTimestamp\n${msg.Timestamp}\nToken\n${msg.Token ?? ""}\nTopicArn\n${msg.TopicArn}\nType\n${msg.Type}\n`;
  }

  return null;
}

/**
 * Khẳng định chữ ký RSA khớp chứng chỉ đã cho.
 *
 * Bản trước của hàm này dựng đúng chuỗi ký rồi **vứt đi**, trả
 * `Boolean(stringToSign && msg.Signature)` — nghĩa là bất kỳ chuỗi khác rỗng
 * nào ở trường `Signature` cũng qua. Cấm — NEVER để một hàm tên `verify*` chỉ
 * kiểm trường có tồn tại.
 */
export function verifySnsSignatureWithCert(
  msg: SnsMessage,
  certPem: string
): boolean {
  if (!verifySnsCertUrl(msg.SigningCertURL)) {
    return false;
  }

  const algorithm = SIGNATURE_ALGORITHMS[msg.SignatureVersion];
  if (!(algorithm && msg.Signature && certPem)) {
    return false;
  }

  const stringToSign = buildSnsStringToSign(msg);
  if (!stringToSign) {
    return false;
  }

  try {
    const verifier = createVerify(algorithm);
    verifier.update(stringToSign, "utf8");
    verifier.end();
    return verifier.verify(certPem, msg.Signature, "base64");
  } catch {
    return false;
  }
}

/**
 * Tải chứng chỉ ký từ `SigningCertURL`, có nhớ đệm theo URL.
 *
 * Host đã được `verifySnsCertUrl` chặn về đúng `sns.<region>.amazonaws.com`
 * trước khi gọi — nếu bỏ bước đó thì đây là một lỗ SSRF: kẻ tấn công tự chọn
 * URL và máy chủ sẽ đi tải nó.
 */
export async function fetchSnsSigningCert(
  certUrl: string
): Promise<string | null> {
  if (!verifySnsCertUrl(certUrl)) {
    return null;
  }

  const cached = certCache.get(certUrl);
  if (cached && Date.now() - cached.fetchedAt < CERT_CACHE_TTL_MS) {
    return cached.pem;
  }

  try {
    const response = await fetch(certUrl);
    if (!response.ok) {
      return null;
    }
    const pem = await response.text();
    certCache.set(certUrl, { pem, fetchedAt: Date.now() });
    return pem;
  } catch {
    return null;
  }
}

export async function verifySnsSignature(msg: SnsMessage): Promise<boolean> {
  const certPem = await fetchSnsSigningCert(msg.SigningCertURL);
  if (!certPem) {
    return false;
  }
  return verifySnsSignatureWithCert(msg, certPem);
}

export function parseAndVerifySesNotification(
  payload: unknown,
  options?: VerifySnsOptions
): { valid: boolean; event?: SesEventMessage; error?: string } {
  if (!payload || typeof payload !== "object") {
    return { valid: false, error: "Invalid SNS payload structure" };
  }

  const msg = payload as SnsMessage;
  if (!(msg.Type && msg.TopicArn && msg.Signature && msg.SigningCertURL)) {
    return { valid: false, error: "Missing required SNS fields" };
  }

  if (
    options?.allowedTopicArns &&
    !options.allowedTopicArns.includes(msg.TopicArn)
  ) {
    return { valid: false, error: "TopicArn not in allow-list" };
  }

  if (!verifySnsCertUrl(msg.SigningCertURL)) {
    return { valid: false, error: "Invalid SigningCertURL host" };
  }

  const msgTimestamp = new Date(msg.Timestamp).getTime();
  if (Number.isNaN(msgTimestamp)) {
    return { valid: false, error: "Invalid Timestamp format" };
  }

  const maxAge = options?.maxAgeSeconds ?? 300;
  if (Math.abs(Date.now() - msgTimestamp) > maxAge * 1000) {
    return { valid: false, error: "SNS message timestamp expired" };
  }

  try {
    const sesEvent = JSON.parse(msg.Message) as SesEventMessage;
    if (!(sesEvent.eventType && sesEvent.mail?.messageId)) {
      return {
        valid: false,
        error: "Invalid SES event structure inside SNS Message",
      };
    }

    return { valid: true, event: sesEvent };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      valid: false,
      error: `JSON parse error for SES event: ${errorMsg}`,
    };
  }
}
