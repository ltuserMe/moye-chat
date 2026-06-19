import type { ChatAttachment } from '@agent-chat/chat-core';

export interface UploadResult {
  attachment: ChatAttachment;
  remoteUrl?: string;
}

export async function prepareAttachmentsForSend(attachments: readonly ChatAttachment[]): Promise<readonly UploadResult[]> {
  return attachments.map((attachment) => ({
    attachment,
    remoteUrl: attachment.url
  }));
}
