import type { ChatAttachment } from '@agent-chat/chat-core';
import {
  createId,
  checkFileSize,
  isMimeAccepted,
  guessMimeType,
  DEFAULT_UPLOAD_CONFIG,
  type UploadConfig
} from '@agent-chat/utils';
import * as DocumentPicker from 'expo-document-picker';

export interface PickResult {
  attachments: readonly ChatAttachment[];
  errors: readonly string[];
}

/**
 * 打开文件选择器并校验文件
 */
export async function pickDocuments(config: UploadConfig = DEFAULT_UPLOAD_CONFIG): Promise<PickResult> {
  const errors: string[] = [];

  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: true
  });

  if (result.canceled) {
    return { attachments: [], errors: [] };
  }

  const attachments = result.assets
    .map((asset) => {
      const mimeType = asset.mimeType ?? guessMimeType(asset.name);

      // MIME 校验
      if (!isMimeAccepted(mimeType, config.acceptTypes)) {
        errors.push(`${asset.name}: 不支持的文件类型`);
        return null;
      }

      // 大小校验
      if (asset.size !== undefined) {
        const sizeCheck = checkFileSize(asset.size, config.maxFileBytes);
        if (!sizeCheck.ok) {
          errors.push(`${asset.name}: ${sizeCheck.message}`);
          return null;
        }
      }

      return {
        id: createId('att'),
        mimeType,
        name: asset.name,
        size: asset.size,
        url: asset.uri
      } as ChatAttachment;
    })
    .filter((a): a is ChatAttachment => a !== null);

  return { attachments, errors };
}
