import { NotFoundError } from "@mindkid/errors/common";
import { defineEventHandler } from "h3";

/**
 * BR-CRQ-01: Cấm duyệt hoặc từ chối theo lô. Mỗi bản một quyết định.
 */
export default defineEventHandler(() => {
  throw new NotFoundError(
    "BR-CRQ-01: Thao tác theo lô trên hàng đợi duyệt không tồn tại."
  );
});
