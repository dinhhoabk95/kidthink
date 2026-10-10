import { ApiError } from "@mindkid/errors/client";
import { describe, expect, it } from "vitest";
import { usePlayError } from "~/composables/play/use-play-error";

describe("usePlayError composable (Task #286)", () => {
  it("bắt mã lỗi DAILY_PLAY_CAP_REACHED và bật cờ isPlayLimitReached (BR-HPL-04)", () => {
    const {
      handleApiError,
      isPlayLimitReached,
      errorTitle,
      errorEmoji,
      errorActionLink,
    } = usePlayError();

    const err = new ApiError({
      code: "DAILY_PLAY_CAP_REACHED",
      message: "Hôm nay bé chơi đủ rồi",
      statusCode: 402,
    });

    const result = handleApiError(err, "GL-C1-001", true);

    expect(isPlayLimitReached.value).toBe(true);
    expect(errorTitle.value).toBe("Hôm nay bé chơi đủ rồi");
    expect(errorEmoji.value).toBe("🌟");
    expect(errorActionLink.value).toBe("/play");
    expect(result.message).toContain("Hôm nay bé chơi giỏi lắm rồi");
  });

  it("bắt statusCode 402 khi không có mã code và kích hoạt màn hình hạn mức", () => {
    const { handleApiError, isPlayLimitReached } = usePlayError();

    const err = {
      statusCode: 402,
      message: "Payment Required / Limit Reached",
    };

    handleApiError(err, "GL-C1-001", true);

    expect(isPlayLimitReached.value).toBe(true);
  });

  it("không kích hoạt isPlayLimitReached với các lỗi khác (như TIER_LOCKED hoặc AUTH_REQUIRED)", () => {
    const { handleApiError, isPlayLimitReached, errorActionLink } =
      usePlayError();

    const err = new ApiError({
      code: "TIER_LOCKED",
      message: "Cần nâng cấp gói",
      statusCode: 403,
    });

    handleApiError(err, "GL-C1-001", true);

    expect(isPlayLimitReached.value).toBe(false);
    expect(errorActionLink.value).toBe("/pricing");
  });

  it("trên bề mặt trẻ, lỗi CONTENT_ARCHIVED điều hướng về /play thay vì /games", () => {
    const { handleApiError, errorActionLink } = usePlayError();

    const err = new ApiError({
      code: "CONTENT_ARCHIVED",
      message: "Nội dung lưu trữ",
      statusCode: 410,
    });

    handleApiError(err, "GL-C1-001", true);

    expect(errorActionLink.value).toBe("/play");
  });
});
