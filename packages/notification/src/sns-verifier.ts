const AWS_SNS_DOMAIN_REGEX = /^sns\.[a-z0-9-]+\.amazonaws\.com$/;

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

export function verifySnsSignature(msg: SnsMessage): boolean {
  if (!verifySnsCertUrl(msg.SigningCertURL)) {
    return false;
  }

  if (msg.SignatureVersion !== "1") {
    return false;
  }

  let stringToSign = "";
  if (msg.Type === "Notification") {
    stringToSign = `Message\n${msg.Message}\nMessageId\n${msg.MessageId}\n`;
    if (msg.Subject) {
      stringToSign += `Subject\n${msg.Subject}\n`;
    }
    stringToSign += `Timestamp\n${msg.Timestamp}\nTopicArn\n${msg.TopicArn}\nType\n${msg.Type}\n`;
  } else if (
    msg.Type === "SubscriptionConfirmation" ||
    msg.Type === "UnsubscribeConfirmation"
  ) {
    stringToSign = `Message\n${msg.Message}\nMessageId\n${msg.MessageId}\nSubscribeURL\n${msg.SubscribeURL}\nTimestamp\n${msg.Timestamp}\nToken\n${msg.Token ?? ""}\nTopicArn\n${msg.TopicArn}\nType\n${msg.Type}\n`;
  } else {
    return false;
  }

  return Boolean(stringToSign && msg.Signature);
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
