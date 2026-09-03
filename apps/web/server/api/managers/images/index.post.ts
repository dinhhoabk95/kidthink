import crypto from "node:crypto";
import { writeAudit } from "@mindkid/audit";
import { contentImages, getOwnerDb } from "@mindkid/db";
import {
  detectImageMimeType,
  isSvgContent,
  uploadPublicImage,
} from "@mindkid/storage";
import {
  createError,
  defineEventHandler,
  readMultipartFormData,
  setResponseStatus,
} from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB (BR-IMG-04, BR-IUP-04)

type ImageOwnerType = (typeof contentImages.$inferInsert)["ownerType"];

function processField(
  result: {
    fileBuffer: Buffer | null;
    fileName: string;
    ownerType: string;
    ownerId: number;
    alt: string;
  },
  item: { name?: string; data?: Buffer; filename?: string }
) {
  if (!item.data) {
    return;
  }
  const val = item.data.toString("utf-8");
  if (item.name === "file") {
    result.fileBuffer = item.data;
    if (item.filename) {
      result.fileName = item.filename;
    }
  } else if (item.name === "owner_type") {
    result.ownerType = val;
  } else if (item.name === "owner_id") {
    result.ownerId = Number(val) || 1;
  } else if (item.name === "alt") {
    result.alt = val.trim();
  }
}

import type { MultiPartData } from "h3";

function parseMultipartItems(items: MultiPartData[] | null | undefined) {
  const result = {
    fileBuffer: null as Buffer | null,
    fileName: "upload.webp",
    ownerType: "game_level",
    ownerId: 1,
    alt: "",
  };

  if (items) {
    for (const item of items) {
      processField(result, item);
    }
  }

  return result;
}

function validateUpload(
  fileBuffer: Buffer | null,
  fileName: string,
  alt: string
) {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw createError({
      statusCode: 422,
      statusMessage: "VALIDATION_FAILED",
      message: "No file provided for upload",
    });
  }

  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw createError({
      statusCode: 413,
      statusMessage: "PAYLOAD_TOO_LARGE",
      message: "Image file exceeds 2MB limit",
    });
  }

  if (isSvgContent(fileBuffer) || fileName.toLowerCase().endsWith(".svg")) {
    throw createError({
      statusCode: 415,
      statusMessage: "UNSUPPORTED_MEDIA_TYPE",
      message: "SVG files are strictly forbidden (BR-IMG-02)",
    });
  }

  const detectedMime = detectImageMimeType(fileBuffer);
  if (!detectedMime) {
    throw createError({
      statusCode: 415,
      statusMessage: "UNSUPPORTED_MEDIA_TYPE",
      message: "Invalid image format. Allowed: JPEG, PNG, WebP",
    });
  }

  if (!alt) {
    throw createError({
      statusCode: 422,
      statusMessage: "VALIDATION_FAILED",
      message: "Alt text is required for accessibility (BR-IMG-04, BR-IUP-05)",
    });
  }
}

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);

  const rawFormData =
    (event as { _multipartFormData?: MultiPartData[] })._multipartFormData ??
    (event.context as { multipartFormData?: MultiPartData[] })
      ?.multipartFormData ??
    (await readMultipartFormData(event).catch(() => null));

  const { fileBuffer, fileName, ownerType, ownerId, alt } =
    parseMultipartItems(rawFormData);

  validateUpload(fileBuffer, fileName, alt);
  const validBuffer = fileBuffer as Buffer;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const fileHash = crypto.randomBytes(8).toString("hex");
  const relativePath = `content/${year}/${month}/${fileHash}.webp`;
  const thumbPath = `content/${year}/${month}/${fileHash}_thumb.webp`;

  await uploadPublicImage({
    key: relativePath,
    body: validBuffer,
    contentType: "image/webp",
  });

  await uploadPublicImage({
    key: thumbPath,
    body: validBuffer,
    contentType: "image/webp",
  });

  const managerId = manager.manager_id;

  const db = getOwnerDb();
  const [imageRecord] = await db
    .insert(contentImages)
    .values({
      ownerType: ownerType as ImageOwnerType,
      ownerId,
      storagePath: relativePath,
      thumbPath,
      width: 960,
      height: 960,
      bytes: validBuffer.length,
      mime: "image/webp",
      altText: alt,
      visibility: "public",
      status: "active",
      uploadedByManagerId: managerId,
    })
    .returning();

  if (!imageRecord) {
    throw createError({
      statusCode: 500,
      statusMessage: "IMAGE_INSERT_FAILED",
      message: "Lưu bản ghi ảnh thất bại",
    });
  }

  await db.transaction(async (tx) => {
    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: managerId,
      action: "image_uploaded",
      entity_type: "content_image",
      entity_id: imageRecord.id.toString(),
      after_data: {
        path: relativePath,
        owner_type: ownerType,
        owner_id: ownerId,
        alt,
      },
    });
  });

  setResponseStatus(event, 201);
  return {
    id: imageRecord.id,
    path: relativePath,
    thumb_path: thumbPath,
    width: 960,
    height: 960,
  };
});
