export type MasteryLabel =
  | "needs_practice"
  | "progressing"
  | "mastered"
  | "Chưa có đủ dữ liệu"
  | "Mới làm quen"
  | "Đang phát triển"
  | "Khá ổn định"
  | "Thành thạo trong phạm vi bài tập";

export const BASIC_REPORT_DISCLAIMER =
  "Báo cáo phản ánh hoạt động của bé trong ứng dụng, không phải đánh giá năng lực hay chẩn đoán phát triển. Mỗi bé có nhịp riêng." as const;

export const BASIC_REPORT_MIN_SESSIONS = 3 as const;

export type BasicReportPeriod = "7d" | "30d";

export interface BasicReportActivitySection {
  sessions_count: number;
  total_minutes: number;
  days_played: number;
  explanation: string;
}

export interface BasicReportCompletionSection {
  levels_completed: number;
  levels_attempted: number;
  explanation: string;
}

export interface BasicReportSkillItem {
  code: string;
  name: string;
  mastery_label: MasteryLabel;
  sessions_count: number;
}

export interface BasicReportSkillsTouchedSection {
  count: number;
  overall_mastery_label: MasteryLabel;
  items: BasicReportSkillItem[];
  explanation: string;
}

export interface BasicReportFavoriteGameItem {
  level_code: string;
  title: string;
  plays_count: number;
  stars_earned: number;
}

export interface BasicReportFavoriteGamesSection {
  items: BasicReportFavoriteGameItem[];
  explanation: string;
}

export interface BasicReportRecentSessionItem {
  session_uuid: string;
  level_code: string;
  title: string;
  stars_earned: number;
  duration_seconds: number;
  completed_at: string | null;
  content_version: number;
  version_updated_note: string | null;
}

export interface BasicReportRecentSessionsSection {
  items: BasicReportRecentSessionItem[];
  explanation: string;
}

export interface BasicReportSuggestionItem {
  id: string;
  kind: "in_app" | "offline";
  title: string;
  description: string;
  emoji: string;
  level_code?: string;
}

export interface BasicReportSuggestionsSection {
  items: BasicReportSuggestionItem[];
  explanation: string;
}

export interface BasicReportSuggestedGame {
  level_code: string;
  title: string;
  competency_code: string;
  thumbnail_emoji: string;
}

export interface BasicReportVersionMarker {
  level_code: string;
  played_versions: number[];
  note: string;
}

export interface BasicReportResult {
  child: {
    uuid: string;
    display_name: string;
    birth_year: number;
    avatar_id: string;
    status: "active" | "archived";
    is_archived: boolean;
  };
  period: BasicReportPeriod;
  from_date: string;
  to_date: string;
  disclaimer: string;
  has_any_sessions: boolean;
  insufficient_data: boolean;
  insufficient_data_note: string | null;
  overall_mastery_label: MasteryLabel;
  suggested_initial_games: BasicReportSuggestedGame[];
  sections: {
    activity: BasicReportActivitySection;
    completion: BasicReportCompletionSection;
    skills_touched: BasicReportSkillsTouchedSection;
    favorite_games: BasicReportFavoriteGamesSection;
    recent_sessions: BasicReportRecentSessionsSection;
    suggestions: BasicReportSuggestionsSection;
  };
  version_markers: BasicReportVersionMarker[];
}
