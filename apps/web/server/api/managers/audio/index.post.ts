import crypto from "node:crypto";
import { writeAudit } from "@mindkid/audit";
import { contentAudio, getOwnerDb } from "@mindkid/db";
import { ValidationError } from "@mindkid/errors/common";
import {
  AudioFormatInvalidError,
  AudioSizeLimitExceededError,
} from "@mindkid/errors/content";
import {
  buildRelativeAudioPath,
  detectAudioMimeType,
  MAX_AUDIO_DURATION_MS,
  MAX_AUDIO_FILE_SIZE_BYTES,
  normalizeAudioAsset,
  uploadPublicAudio,
} from "@mindkid/storage";
import { getHeader, readMultipartFormData } from "h3";
import { z } from "zod";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";
import { defineApiRoute } from "#server/utils/define-api-route";

const audioMetadataSchema = z.object({
  owner_type: z.enum(["game_level", "lesson", "activity"]),
  owner_id: z.string().trim().min(1).max(64),
  label_vi: z.string().trim().min(1).max(200),
  duration_ms: z.coerce
    .number()
    .int()
    .positive()
    .max(
      MAX_AUDIO_DURATION_MS,
      "Thời lượng âm thanh không được vượt quá 30 giây."
    )
    .optional(),
});

interface MultipartFieldEntry {
  name?: string;
  filename?: string;
  type?: string;
  data: Buffer;
}

function parseAudioMultipartPayload(formData: MultipartFieldEntry[] | null) {
  if (!formData || formData.length === 0) {
    throw new ValidationError("Thiếu dữ liệu multipart form-data.");
  }

  let fileField: MultipartFieldEntry | undefined;
  const textFields: Record<string, string> = {};

  for (const field of formData) {
    if (field.name === "file" || field.filename) {
      fileField = field;
    } else if (field.name) {
      textFields[field.name] = field.data.toString("utf-8").trim();
    }
  }

  if (!fileField || fileField.data.length === 0) {
    throw new ValidationError("Vui lòng đính kèm file âm thanh hợp lệ.");
  }

  if (fileField.data.length > MAX_AUDIO_FILE_SIZE_BYTES) {
    throw new AudioSizeLimitExceededError(
      "Dung lượng file âm thanh vượt quá giới hạn 500KB."
    );
  }

  if (!detectAudioMimeType(fileField.data)) {
    throw new AudioFormatInvalidError(
      "Định dạng file âm thanh không hợp lệ (chỉ chấp nhận MP3, OGG, WAV, WebM, MP4)."
    );
  }

  const parsedMeta = audioMetadataSchema.safeParse(textFields);
  if (!parsedMeta.success) {
    throw new ValidationError({
      message: "Dữ liệu tải lên âm thanh không hợp lệ.",
      errors: parsedMeta.error.flatten().fieldErrors,
    });
  }

  return { fileBuffer: fileField.data, meta: parsedMeta.data };
}

function normalizeAudioOrThrow(
  fileBuffer: Buffer,
  declaredDurationMs: number | undefined
) {
  try {
    return normalizeAudioAsset(fileBuffer, { declaredDurationMs });
  } catch (err) {
    const code = err instanceof Error ? err.message : "";
    if (code === "AUDIO_SIZE_LIMIT_EXCEEDED") {
      throw new AudioSizeLimitExceededError();
    }
    if (code === "AUDIO_FORMAT_INVALID") {
      throw new AudioFormatInvalidError();
    }
    throw new ValidationError(
      "Thời lượng file âm thanh vượt quá giới hạn 30 giây."
    );
  }
}

export default defineApiRoute({
  auth: "manager",
  status: 201,
  handler: async ({ event, auth }) => {
    const formData = (await readMultipartFormData(event).catch(() => null)) as
      | MultipartFieldEntry[]
      | null;

    const { fileBuffer, meta } = parseAudioMultipartPayload(formData);
    const { owner_type, owner_id, label_vi, duration_ms } = meta;
    const normalized = normalizeAudioOrThrow(fileBuffer, duration_ms);

    const hashHex = crypto
      .createHash("sha256")
      .update(normalized.buffer)
      .digest("hex");
    const uniqueId = crypto.randomUUID();

    // BR-AST-05 & BR-AST-06: Relative path only, unique per upload (never overwrite)
    const relativePath = buildRelativeAudioPath(
      hashHex,
      uniqueId,
      normalized.outputExtension
    );

    await uploadPublicAudio({
      key: relativePath,
      body: normalized.buffer,
      contentType: normalized.outputMimeType,
    });

    const db = getOwnerDb();
    const ipAddress = getVerifiedRemoteIp(event);
    const userAgent = getHeader(event, "user-agent") ?? null;

    const inserted = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(contentAudio)
        .values({
          ownerType: owner_type,
          ownerId: owner_id,
          path: relativePath,
          durationMs: normalized.durationMs,
          mimeType: normalized.outputMimeType,
          fileSizeBytes: normalized.fileSizeBytes,
          status: "active",
          uploadedByManagerId: auth.manager_id,
        })
        .returning();

      if (!row) {
        throw new ValidationError("Không thể lưu thông tin âm thanh.");
      }

      // BR-AST-08: Every audio upload records an audit log entry
      await writeAudit(tx, {
        actor_type: "manager",
        actor_id: auth.manager_id,
        action: "content_created",
        entity_type: "content_audio",
        entity_id: row.id,
        after_data: {
          path: row.path,
          owner_type: row.ownerType,
          owner_id: row.ownerId,
          duration_ms: row.durationMs,
          mime_type: row.mimeType,
          file_size_bytes: row.fileSizeBytes,
          label_vi,
        },
        ip_address: ipAddress,
        user_agent: userAgent,
      });

      return row;
    });

    return {
      id: inserted.id,
      path: inserted.path,
      duration_ms: inserted.durationMs,
      mime_type: inserted.mimeType,
    };
  },
});
