import type { ChatAttachment } from '@agent-chat/chat-core';
import {
  type UploadFileState,
  type UploadConfig,
  DEFAULT_UPLOAD_CONFIG,
  createUploadFile,
  startUpload,
  completeUpload,
  failUpload,
  checkFileSize,
  isMimeAccepted
} from '@agent-chat/utils';

export type { UploadFileState, UploadConfig };
export { DEFAULT_UPLOAD_CONFIG, checkFileSize, isMimeAccepted };

export interface UploadResult {
  attachment: ChatAttachment;
  remoteUrl?: string;
}

/**
 * 将 ChatAttachment 转换为 UploadFileState
 */
export function attachmentToUploadState(attachment: ChatAttachment): UploadFileState {
  return createUploadFile(
    attachment.id,
    attachment.name,
    attachment.size ?? 0,
    attachment.mimeType,
    attachment.url
  );
}

/**
 * 上传单个文件（stub — 接入真实后替换 fetch 调用）
 */
export async function uploadFile(
  file: UploadFileState,
  _config: UploadConfig = DEFAULT_UPLOAD_CONFIG
): Promise<UploadFileState> {
  const uploading = startUpload(file);

  // TODO: 替换为真实上传逻辑
  // const formData = new FormData();
  // formData.append('file', { uri: file.previewUrl, name: file.name, type: file.mimeType });
  // const response = await fetch(UPLOAD_ENDPOINT, { method: 'POST', body: formData });
  // const { url } = await response.json();
  // return completeUpload(uploading, url);

  return completeUpload(uploading, file.previewUrl ?? '');
}

/**
 * 批量处理附件并发送
 */
export function prepareAttachmentsForSend(
  attachments: readonly ChatAttachment[]
): { attachment: ChatAttachment; remoteUrl?: string }[] {
  return attachments.map((attachment) => ({
    attachment,
    remoteUrl: attachment.url
  }));
}
