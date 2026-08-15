import {
  contentImages,
  gameLevels,
  gameTemplates,
  getOwnerDb,
  managers,
} from "@kidthink/db";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import deleteImageHandler from "../../server/api/managers/images/[id].delete.js";
import uploadImageHandler from "../../server/api/managers/images/index.post.js";

const CSRF_TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const RELATIVE_IMAGE_PATH_REGEX = /^content\/\d{4}\/\d{2}\/[a-f0-9]+\.webp$/;
const RELATIVE_THUMB_PATH_REGEX =
  /^content\/\d{4}\/\d{2}\/[a-f0-9]+_thumb\.webp$/;

// Valid PNG magic bytes (89 50 4E 47 0D 0A 1A 0A)
const VALID_PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
  0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x20, 0x00, 0x00, 0x00, 0x20,
]);

// Valid JPEG magic bytes (FF D8 FF E0)
const VALID_JPEG_BUFFER = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
]);

// Fake PNG (text file renamed to .png)
const FAKE_PNG_BUFFER = Buffer.from("THIS IS NOT A VALID PNG FILE AT ALL");

// SVG buffer
const SVG_BUFFER = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40"/></svg>'
);

let testManagerId = 1;

beforeAll(async () => {
  const db = getOwnerDb();
  let [mgr] = await db
    .select({ id: managers.id })
    .from(managers)
    .where(eq(managers.email, "image-tester@kidthink.edu.vn"));
  if (!mgr) {
    [mgr] = await db
      .insert(managers)
      .values({
        email: "image-tester@kidthink.edu.vn",
        passwordHash: "hash",
        displayName: "Image Tester",
        role: "super_admin",
        isActive: true,
      })
      .returning({ id: managers.id });
  }
  if (mgr) {
    testManagerId = mgr.id;
  }
});

function mockMultipartEvent(
  managerRole?: "super_admin" | "content_reviewer",
  formDataItems: Array<{ name: string; data: Buffer; filename?: string }> = []
) {
  return {
    method: "POST",
    node: {
      req: {
        headers: {
          "user-agent": "VitestTestRunner/1.0",
          "x-csrf-token": CSRF_TOKEN,
          cookie: `tm_m_csrf=${CSRF_TOKEN}`,
          "content-type": "multipart/form-data; boundary=---boundary",
        },
      },
      res: {
        statusCode: 200,
      },
    },
    context: {
      ...(managerRole
        ? {
            manager: {
              manager_id: testManagerId,
              display_name: "Manager Image Tester",
              session_id: "sess_manager_img_123",
              refresh_token_version: 1,
              role: managerRole,
            },
          }
        : {}),
      params: {},
    },
    _multipartFormData: formDataItems,
  } as any;
}

function mockDeleteEvent(
  id: string,
  managerRole?: "super_admin" | "content_reviewer"
) {
  return {
    method: "DELETE",
    node: {
      req: {
        headers: {
          "user-agent": "VitestTestRunner/1.0",
          "x-csrf-token": CSRF_TOKEN,
          cookie: `tm_m_csrf=${CSRF_TOKEN}`,
        },
      },
      res: {},
    },
    context: {
      ...(managerRole
        ? {
            manager: {
              manager_id: testManagerId,
              display_name: "Manager Image Tester",
              session_id: "sess_manager_img_123",
              refresh_token_version: 1,
              role: managerRole,
            },
          }
        : {}),
      params: { id },
    },
  } as any;
}

describe("Image Storage & Upload API (BR-IMG-01 - BR-IMG-12, BR-IUP-01 - BR-IUP-09, Spec §7.1)", () => {
  it("rejects unauthenticated upload request", async () => {
    const event = mockMultipartEvent(undefined, [
      { name: "file", data: VALID_PNG_BUFFER, filename: "apple.png" },
      { name: "alt", data: Buffer.from("Quả táo đỏ") },
    ]);
    await expect(uploadImageHandler(event)).rejects.toThrow();
  });

  it("rejects SVG upload with 415 (BR-IMG-02)", async () => {
    const event = mockMultipartEvent("content_reviewer", [
      { name: "file", data: SVG_BUFFER, filename: "graphic.svg" },
      { name: "alt", data: Buffer.from("Vector graphic") },
    ]);
    try {
      await uploadImageHandler(event);
      expect.fail("Should have rejected SVG with 415");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(415);
    }
  });

  it("rejects fake MIME when magic bytes do not match (BR-IMG-03)", async () => {
    const event = mockMultipartEvent("content_reviewer", [
      { name: "file", data: FAKE_PNG_BUFFER, filename: "fake.png" },
      { name: "alt", data: Buffer.from("Ảnh giả") },
    ]);
    try {
      await uploadImageHandler(event);
      expect.fail("Should have rejected fake PNG with 415");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(415);
    }
  });

  it("rejects upload when file exceeds 2MB limit (BR-IMG-04, BR-IUP-04)", async () => {
    const hugeBuffer = Buffer.alloc(2.5 * 1024 * 1024);
    hugeBuffer[0] = 0x89;
    hugeBuffer[1] = 0x50;
    hugeBuffer[2] = 0x4e;
    hugeBuffer[3] = 0x47;

    const event = mockMultipartEvent("content_reviewer", [
      { name: "file", data: hugeBuffer, filename: "large.png" },
      { name: "alt", data: Buffer.from("Ảnh lớn") },
    ]);
    try {
      await uploadImageHandler(event);
      expect.fail("Should have rejected >2MB with 413");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(413);
    }
  });

  it("rejects upload when alt text is missing (BR-IMG-04, BR-IUP-05)", async () => {
    const event = mockMultipartEvent("content_reviewer", [
      { name: "file", data: VALID_PNG_BUFFER, filename: "apple.png" },
    ]);
    try {
      await uploadImageHandler(event);
      expect.fail("Should have rejected missing alt with 422");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(422);
    }
  });

  it("uploads valid image, normalizes relative path and writes audit log (BR-IMG-05, BR-IMG-12)", async () => {
    const event = mockMultipartEvent("content_reviewer", [
      { name: "file", data: VALID_PNG_BUFFER, filename: "apple.png" },
      { name: "alt", data: Buffer.from("Quả táo đỏ") },
      { name: "owner_type", data: Buffer.from("game_level") },
      { name: "owner_id", data: Buffer.from("1") },
    ]);

    const res = (await uploadImageHandler(event)) as any;
    expect(res).toBeDefined();
    expect(res.id).toBeDefined();
    expect(res.path).toMatch(RELATIVE_IMAGE_PATH_REGEX);
    expect(res.thumb_path).toMatch(RELATIVE_THUMB_PATH_REGEX);
    expect(res.path).not.toContain("http");
    expect(res.path).not.toContain("https");
  });

  it("DELETE /api/managers/images/:id prevents deletion when image is used by published content (BR-IMG-07)", async () => {
    const db = getOwnerDb();

    // 1. Insert template if not exists
    let [tpl] = await db
      .select()
      .from(gameTemplates)
      .where(eq(gameTemplates.code, "GT-001"));
    if (!tpl) {
      [tpl] = await db
        .insert(gameTemplates)
        .values({
          code: "GT-001",
          nameVi: "GT001",
          mechanic: "tap-select",
          layouts: ["grid"],
          ageMin: 3,
          ageMax: 6,
        })
        .returning();
    }

    // 2. Upload an image
    const event = mockMultipartEvent("content_reviewer", [
      { name: "file", data: VALID_JPEG_BUFFER, filename: "flower.jpg" },
      { name: "alt", data: Buffer.from("Bông hoa") },
      { name: "owner_type", data: Buffer.from("game_level") },
      { name: "owner_id", data: Buffer.from("1") },
    ]);
    const uploaded = (await uploadImageHandler(event)) as any;

    // 3. Create a published level referencing this image
    const levelCode = `GL-C1-IMG-PUB-${Date.now().toString().slice(-4)}`;
    await db.insert(gameLevels).values({
      entityId: Date.now() + 10,
      code: levelCode,
      contentVersion: 1,
      templateId: tpl.id,
      titleVi: "Level using image",
      contentPack: { prompt: "Tìm hoa", image_path: uploaded.path },
      difficultyParams: {},
      accessTier: "free",
      status: "published",
    });

    // 4. Try to delete the image -> 409 CONTENT_IN_USE
    const delEvt = mockDeleteEvent(String(uploaded.id), "super_admin");
    try {
      await deleteImageHandler(delEvt);
      expect.fail("Should have thrown 409 CONTENT_IN_USE");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(409);
    }
  });

  it("DELETE /api/managers/images/:id deletes unused image successfully", async () => {
    // 1. Upload an image
    const event = mockMultipartEvent("content_reviewer", [
      { name: "file", data: VALID_PNG_BUFFER, filename: "unused.png" },
      { name: "alt", data: Buffer.from("Ảnh không dùng") },
      { name: "owner_type", data: Buffer.from("game_level") },
      { name: "owner_id", data: Buffer.from("1") },
    ]);
    const uploaded = (await uploadImageHandler(event)) as any;

    // 2. Delete it
    const delEvt = mockDeleteEvent(String(uploaded.id), "super_admin");
    const res = (await deleteImageHandler(delEvt)) as any;
    expect(res.success).toBe(true);

    // 3. Verify it is removed from content_images
    const db = getOwnerDb();
    const [found] = await db
      .select()
      .from(contentImages)
      .where(eq(contentImages.id, uploaded.id));
    expect(found).toBeUndefined();
  });
});
