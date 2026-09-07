import { isApiError } from "@mindkid/errors/client";
import { ref } from "vue";

export interface IntroQueueItemDetails {
  readonly intro_level_code: string;
  readonly skill_code?: string;
  readonly title?: string;
  readonly thumbnail_emoji?: string;
}

export interface ApiErrorDetails {
  readonly intro_level_code?: string;
  readonly intro_queue?: readonly IntroQueueItemDetails[];
  readonly intro_remaining?: number;
  readonly return_level_code?: string;
  readonly primary_skill_code?: string;
}

export function usePlayError() {
  const errorMessage = ref<string | null>(null);
  const errorTitle = ref<string>("Đã có lỗi xảy ra");
  const errorEmoji = ref<string>("😿");
  const errorActionLink = ref<string | null>(null);
  const errorActionText = ref<string>("Thử lại");

  function handleConceptOrChildError(
    levelCode: string,
    loggedIn: boolean,
    statusMessage?: string,
    details?: ApiErrorDetails
  ): Error {
    if (
      statusMessage === "INTRO_REQUIRED" ||
      details?.intro_level_code ||
      details?.intro_queue
    ) {
      const queue = details?.intro_queue;
      const introCode = String(
        details?.intro_level_code ?? queue?.[0]?.intro_level_code ?? ""
      );
      errorTitle.value = "Làm quen khái niệm trước";
      errorEmoji.value = "📖";
      errorActionLink.value = introCode
        ? `/play/${introCode}?return_to=${levelCode}`
        : "/games";
      errorActionText.value = introCode
        ? "Bắt đầu bài làm quen"
        : "Xem danh sách trò chơi";
      return new Error(
        "Bé hãy hoàn thành bài làm quen ngắn để hiểu khái niệm trước khi bước vào màn chơi nhé!"
      );
    }

    if (!loggedIn) {
      errorTitle.value = "Yêu cầu đăng nhập";
      errorEmoji.value = "🔒";
      errorActionLink.value = `/login?redirect=/play/${levelCode}`;
      errorActionText.value = "Đăng nhập để chơi";
      return new Error(
        "Trò chơi này yêu cầu đăng nhập tài khoản để bé có thể tham gia và lưu tiến độ."
      );
    }

    errorTitle.value = "Chưa chọn hồ sơ bé";
    errorEmoji.value = "👶";
    errorActionLink.value = `/me/children?redirect=/play/${levelCode}`;
    errorActionText.value = "Chọn hồ sơ bé";
    return new Error(
      "Vui lòng chọn hoặc tạo hồ sơ của bé trước khi bắt đầu bài học."
    );
  }

  function handleTierLockedError(levelCode: string, loggedIn: boolean): Error {
    if (!loggedIn) {
      errorTitle.value = "Yêu cầu đăng nhập";
      errorEmoji.value = "🔒";
      errorActionLink.value = `/login?redirect=/play/${levelCode}`;
      errorActionText.value = "Đăng nhập để chơi";
      return new Error(
        "Trò chơi này yêu cầu đăng nhập tài khoản để bé có thể tham gia và lưu tiến độ."
      );
    }

    errorTitle.value = "Cần nâng cấp gói học";
    errorEmoji.value = "⭐";
    errorActionLink.value = "/pricing";
    errorActionText.value = "Xem các gói học";
    return new Error(
      "Trò chơi này thuộc gói nâng cấp. Phụ huynh vui lòng mở khoá gói học để bé tiếp tục trải nghiệm."
    );
  }

  function handleArchivedError(): Error {
    errorTitle.value = "Trò chơi đã ngừng phát hành";
    errorEmoji.value = "📦";
    errorActionLink.value = "/games";
    errorActionText.value = "Xem danh sách trò chơi";
    return new Error(
      "Nội dung bài học này đã hoàn thành chu kỳ sử dụng hoặc được thay thế."
    );
  }

  function handleAuthError(levelCode: string): Error {
    errorTitle.value = "Yêu cầu đăng nhập";
    errorEmoji.value = "🔒";
    errorActionLink.value = `/login?redirect=/play/${levelCode}`;
    errorActionText.value = "Đăng nhập để chơi";
    return new Error("Phiên chơi cần đăng nhập để lưu kết quả của bé.");
  }

  function handleNotFoundError(): Error {
    errorTitle.value = "Không tìm thấy trò chơi";
    errorEmoji.value = "🔍";
    errorActionLink.value = "/games";
    errorActionText.value = "Xem danh sách trò chơi";
    return new Error("Màn chơi này không tồn tại hoặc đã được cập nhật.");
  }

  function getErrorMessage(
    err: Error | Record<string, string | number>
  ): string {
    if (isApiError(err)) {
      return err.message;
    }
    if (err instanceof Error) {
      return err.message;
    }
    return "Lỗi kết nối mạng";
  }

  function getErrorCodeOrStatus(err: Error | Record<string, string | number>): {
    code?: string;
    status?: number;
  } {
    if (isApiError(err)) {
      return { code: err.code, status: err.statusCode };
    }
    return {};
  }

  function handleAccessOrChildError(
    code: string | undefined,
    status: number | undefined,
    levelCode: string,
    loggedIn: boolean,
    err: Error | Record<string, string | number>
  ): Error | null {
    if (code === "TIER_LOCKED" || status === 403) {
      return handleTierLockedError(levelCode, loggedIn);
    }
    if (
      code === "INTRO_REQUIRED" ||
      code === "NO_ACTIVE_CHILD" ||
      status === 428
    ) {
      const details = isApiError(err)
        ? (err.details as ApiErrorDetails | undefined)
        : undefined;
      return handleConceptOrChildError(levelCode, loggedIn, code, details);
    }
    return null;
  }

  function handleRoutingError(
    code: string | undefined,
    status: number | undefined,
    levelCode: string
  ): Error | null {
    if (code === "AUTH_REQUIRED" || status === 401) {
      return handleAuthError(levelCode);
    }
    if (code === "LEVEL_NOT_FOUND" || status === 404) {
      return handleNotFoundError();
    }
    return null;
  }

  function handleApiError(
    err: Error | Record<string, string | number>,
    levelCode: string,
    loggedIn: boolean
  ): Error {
    errorActionLink.value = null;
    errorActionText.value = "Thử lại";

    const { code, status } = getErrorCodeOrStatus(err);

    if (code === "CONTENT_ARCHIVED") {
      return handleArchivedError();
    }

    const accessErr = handleAccessOrChildError(
      code,
      status,
      levelCode,
      loggedIn,
      err
    );
    if (accessErr) {
      return accessErr;
    }

    const routingErr = handleRoutingError(code, status, levelCode);
    if (routingErr) {
      return routingErr;
    }

    errorTitle.value = "Chưa tải được trò chơi";
    errorEmoji.value = "😿";
    errorActionLink.value = null;
    errorActionText.value = "Thử lại";
    const msg = getErrorMessage(err);
    return new Error(msg || "Chưa tải được trò chơi. Bé bấm nút thử lại nhé!");
  }

  return {
    errorMessage,
    errorTitle,
    errorEmoji,
    errorActionLink,
    errorActionText,
    handleApiError,
  };
}
