import {
  type VoiceState,
  type VoiceStatus,
  INITIAL_VOICE_STATE,
  requestPermission,
  startRecording,
  stopRecording,
  completeTranscription,
  failVoice,
  resetVoice
} from '@agent-chat/utils';

export type { VoiceState, VoiceStatus };
export {
  INITIAL_VOICE_STATE,
  requestPermission,
  startRecording,
  stopRecording,
  completeTranscription,
  failVoice,
  resetVoice
};

/** 平台相关的录音实现（stub — 接入真实后替换为 expo-av） */
export async function prepareVoiceInput(): Promise<{ isRecording: boolean; transcriptDraft?: string }> {
  // TODO: 替换为 expo-av 录音
  // const { recording } = await Audio.Recording.createAsync(...);
  return { isRecording: false, transcriptDraft: '' };
}
