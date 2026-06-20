// ── 语音输入状态机（纯逻辑，跨平台共享）──

export type VoiceStatus =
  | "idle"
  | "requesting_permission"
  | "recording"
  | "transcribing"
  | "done"
  | "failed";

export interface VoiceState {
  status: VoiceStatus;
  /** 转录后的文本 */
  transcript: string;
  /** 录音时长（毫秒） */
  durationMs: number;
  error?: string;
}

export const INITIAL_VOICE_STATE: VoiceState = {
  status: "idle",
  transcript: "",
  durationMs: 0
};

// ── 纯函数：状态转换 ──

export function requestPermission(state: VoiceState): VoiceState {
  if (state.status !== "idle") return state;
  return { ...state, status: "requesting_permission", error: undefined };
}

export function startRecording(state: VoiceState): VoiceState {
  if (state.status !== "idle" && state.status !== "requesting_permission") return state;
  return { ...state, status: "recording", transcript: "", durationMs: 0, error: undefined };
}

export function stopRecording(state: VoiceState): VoiceState {
  if (state.status !== "recording") return state;
  return { ...state, status: "transcribing" };
}

export function completeTranscription(state: VoiceState, transcript: string): VoiceState {
  return { ...state, status: "done", transcript };
}

export function failVoice(state: VoiceState, error: string): VoiceState {
  return { ...state, status: "failed", error };
}

export function resetVoice(): VoiceState {
  return { ...INITIAL_VOICE_STATE };
}
