import type { ChatAttachment } from '@agent-chat/chat-core';
import { create } from 'zustand';

interface AttachmentStore {
  inputAttachments: readonly ChatAttachment[];
  clearInputAttachments(): void;
  removeInputAttachment(attachmentId: ChatAttachment['id']): void;
  setInputAttachments(attachments: readonly ChatAttachment[]): void;
}

export const useAttachmentStore = create<AttachmentStore>((set, get) => ({
  inputAttachments: [],

  clearInputAttachments() {
    set({ inputAttachments: [] });
  },

  removeInputAttachment(attachmentId) {
    set({ inputAttachments: get().inputAttachments.filter((attachment) => attachment.id !== attachmentId) });
  },

  setInputAttachments(attachments) {
    set({ inputAttachments: attachments });
  }
}));
