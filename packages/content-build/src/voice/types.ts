export const VOICE_CATEGORIES = [
  "round_instruction",
  "gt000_step",
  "skill_item",
  "encouragement",
  "koguma_guide",
  "kid_ui",
] as const;

export type VoiceCategory = (typeof VOICE_CATEGORIES)[number];

export type VoiceCacheStatus = "cached" | "missing";

export interface VoiceCatalogEntry {
  readonly hash: string;
  readonly lookup_key: string;
  readonly raw_text: string;
  readonly spoken_script_vi: string;
  readonly relative_audio_path: string;
  readonly category: VoiceCategory;
  readonly sources: readonly string[];
  readonly occurrence_count: number;
  readonly status: VoiceCacheStatus;
}

export interface VoiceCategoryStats {
  readonly total: number;
  readonly cached: number;
  readonly missing: number;
}

export interface VoiceCatalogDocument {
  readonly profile: string;
  readonly generated_at: string;
  readonly total_entries: number;
  readonly cached_entries: number;
  readonly missing_entries: number;
  readonly by_category: Readonly<Record<VoiceCategory, VoiceCategoryStats>>;
  readonly entries: readonly VoiceCatalogEntry[];
}

export type FreeVoiceEngineId =
  | "edge-hoaimy"
  | "edge-hoaimy-teacher"
  | "piper-vais1000"
  | "piper-25hours"
  | "vieneu-myduyen"
  | "vieneu-trucly"
  | "vieneu-teacher-clone";

export type PaidVoiceEngineId = "elevenlabs" | "openai" | "gemini";

export type VoiceEngineId = FreeVoiceEngineId | PaidVoiceEngineId;

export interface VoiceEngineDescriptor {
  readonly id: VoiceEngineId;
  readonly label_vi: string;
  readonly badge_vi: string;
  readonly description_vi: string;
  readonly is_free: boolean;
  readonly is_offline: boolean;
  readonly default_speed: number;
  readonly pitch_shift_factor: number;
  readonly requires_env_key?: string;
}

export interface AuditionSampleSpec {
  readonly id: string;
  readonly category: VoiceCategory;
  readonly note_vi: string;
  readonly raw_text: string;
}

export interface AuditionClipMetric {
  readonly sample_id: string;
  readonly category: VoiceCategory;
  readonly raw_text: string;
  readonly spoken_script_vi: string;
  readonly audio_url: string;
  readonly synth_ms: number;
  readonly normalize_ms: number;
  readonly total_ms: number;
  readonly duration_sec: number;
  readonly file_size_bytes: number;
  readonly sample_rate: number;
  readonly channels: number;
}

export interface AuditionEngineReport {
  readonly engine_id: VoiceEngineId;
  readonly label_vi: string;
  readonly badge_vi: string;
  readonly description_vi: string;
  readonly is_offline: boolean;
  readonly available: boolean;
  readonly unavailable_reason?: string;
  readonly warmup_ms: number;
  readonly avg_synth_ms: number;
  readonly avg_total_ms: number;
  readonly recommended_concurrency: number;
  readonly estimated_catalog_minutes: number;
  readonly clips: readonly AuditionClipMetric[];
}

export interface AuditionReportDocument {
  readonly generated_at: string;
  readonly hardware_summary: string;
  readonly catalog_total_entries: number;
  readonly samples: readonly {
    readonly id: string;
    readonly category: VoiceCategory;
    readonly note_vi: string;
    readonly raw_text: string;
    readonly spoken_script_vi: string;
  }[];
  readonly engines: readonly AuditionEngineReport[];
}

export interface VoiceManifestEntry {
  readonly hash: string;
  readonly relative_audio_path: string;
  readonly category: VoiceCategory;
  readonly spoken_script_vi: string;
  readonly engine_id: VoiceEngineId;
  readonly speed: number;
  readonly duration_ms: number;
  readonly file_size_bytes: number;
  readonly updated_at: string;
}

export interface VoiceManifestDocument {
  readonly profile: string;
  readonly updated_at: string;
  readonly total_generated: number;
  readonly entries: Readonly<Record<string, VoiceManifestEntry>>;
}

export interface PythonWorkerJobRequest {
  readonly id: string;
  readonly engine: VoiceEngineId;
  readonly text: string;
  readonly out_wav_path: string;
}

export interface PythonWorkerJobResponse {
  readonly id: string;
  readonly ok: boolean;
  readonly synth_ms: number;
  readonly warmup_ms: number;
  readonly out_path?: string;
  readonly error?: string;
}
