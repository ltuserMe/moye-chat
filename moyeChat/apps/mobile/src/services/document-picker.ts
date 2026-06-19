import type { ChatAttachment } from '@agent-chat/chat-core';
import { createId } from '@agent-chat/utils';
import * as DocumentPicker from 'expo-document-picker';

export async function pickDocuments(): Promise<readonly ChatAttachment[]> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: true
  });

  if (result.canceled) {
    return [];
  }

  return result.assets.map((asset) => ({
    id: createId('att'),
    mimeType: asset.mimeType ?? 'application/octet-stream',
    name: asset.name,
    size: asset.size,
    url: asset.uri
  }));
}
