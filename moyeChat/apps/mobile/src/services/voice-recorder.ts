export interface VoiceRecorderState {
  isRecording: boolean;
  transcriptDraft?: string;
}

export async function prepareVoiceInput(): Promise<VoiceRecorderState> {
  return {
    isRecording: false,
    transcriptDraft: ''
  };
}
