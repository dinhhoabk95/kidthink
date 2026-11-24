import { PROOF_MAX_IMAGE_SIZE_BYTES } from "@mindkid/config";
import { PayloadTooLargeError } from "@mindkid/errors/common";
import { describe, expect, it } from "vitest";
import { uploadProofFileIfProvided } from "#server/services/order-service";

describe("ảnh chứng từ vượt trần (BR-IMG-14)", () => {
  it("trần là 1,5 MB", () => {
    expect(PROOF_MAX_IMAGE_SIZE_BYTES).toBe(1_572_864);
  });

  it("ảnh > 1,5 MB bị từ chối 413 PayloadTooLargeError trước khi ghi storage", async () => {
    const data = Buffer.alloc(PROOF_MAX_IMAGE_SIZE_BYTES + 1);
    const result = uploadProofFileIfProvided(
      { data, type: "image/webp" },
      "order-uuid"
    );
    await expect(result).rejects.toBeInstanceOf(PayloadTooLargeError);
    await expect(result).rejects.toMatchObject({ statusCode: 413 });
  });
});
