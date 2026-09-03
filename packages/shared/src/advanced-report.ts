export type SectionStatus = "ready" | "insufficient_data";

export type TrendDirection = "improving" | "steady" | "needs_attention";

export interface CompetencyReportItem {
  code: string;
  name: string;
  status: SectionStatus;
  mastery_label: string;
  sessions_have: number;
  sessions_needed: number;
  alt_text: string;
}

export interface StrandReportItem {
  code: string;
  name: string;
  competency_code: string;
  status: SectionStatus;
  mastery_label: string;
  sessions_have: number;
  sessions_needed: number;
  alt_text: string;
}

export interface SkillReportItem {
  code: string;
  name: string;
  strand_code: string;
  competency_code: string;
  status: SectionStatus;
  mastery_label: string;
  sessions_have: number;
  sessions_needed: number;
  attempts_total: number;
  exposure_only: boolean;
  alt_text: string;
}

export interface WeeklyTrendWeekData {
  week_label: string;
  sessions_count: number;
  completions_count: number;
  completion_rate: number;
}

export interface WeeklyTrendSection {
  status: SectionStatus;
  weeks_have: number;
  weeks_needed: number;
  direction?: TrendDirection;
  direction_text?: string;
  weeks_data: WeeklyTrendWeekData[];
  alt_text: string;
}

export interface IndependenceSection {
  status: SectionStatus;
  sessions_have: number;
  sessions_needed: number;
  independent_sessions_count: number;
  total_completed_sessions: number;
  independent_completion_rate?: number;
  alt_text: string;
}

export interface ReinforcementAction {
  kind: "home_activity" | "in_app";
  text: string;
  ref_entity_id?: number;
}

export interface ReinforcementSkillItem {
  skill_code: string;
  name: string;
  mastery_label: string;
  actions: ReinforcementAction[];
  alt_text: string;
}

export interface ReadyForNextSkillItem {
  skill_code: string;
  name: string;
  mastery_label: string;
  next_skill_code: string;
  next_skill_name: string;
  alt_text: string;
}

export interface VersionChangeMarker {
  level_code: string;
  played_versions: number[];
  note: string;
}

export interface AdvancedReportResult {
  child: {
    uuid: string;
    display_name: string;
    birth_year: number;
    avatar_id: string;
  };
  period: "30d" | "90d";
  from_date: string;
  to_date: string;
  sections: {
    competencies: CompetencyReportItem[];
    strands: StrandReportItem[];
    skills: SkillReportItem[];
    weekly_trend: WeeklyTrendSection;
    independence_level: IndependenceSection;
    needs_reinforcement: ReinforcementSkillItem[];
    ready_for_next: ReadyForNextSkillItem[];
  };
  version_markers: VersionChangeMarker[];
}
