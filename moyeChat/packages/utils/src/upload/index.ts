// ── 上传状态机（纯逻辑，跨平台共享）──

/** 上传状态 */
export type UploadStatus =
  | "idle"
  | "uploading"
  | "done"
  | "failed";

/** 单个文件的上传状态 */
export interface UploadFileState {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  /** 前端可用的临时 URL（Blob URL / file:// URI） */
  previewUrl?: string;
  /** 上传进度 0-100 */
  progress: number;
  status: UploadStatus;
  /** 上传成功后的远程 URL */
  remoteUrl?: string;
  error?: string;
}

/** 上传队列状态 */
export interface UploadQueueState {
  files: readonly UploadFileState[];
}

/** 上传配置 */
export interface UploadConfig {
  /** 单文件最大字节数，默认 50MB */
  maxFileBytes: number;
  /** 允许的 MIME 类型，undefined = 不限制 */
  acceptTypes?: readonly string[];
}

export const DEFAULT_UPLOAD_CONFIG: UploadConfig = {
  maxFileBytes: 50 * 1024 * 1024
};

// ── 纯函数：状态转换 ──

export function createUploadFile(id: string, name: string, size: number, mimeType: string, previewUrl?: string): UploadFileState {
  return { id, name, size, mimeType, previewUrl, progress: 0, status: "idle" };
}

export function startUpload(file: UploadFileState): UploadFileState {
  if (file.status !== "idle" && file.status !== "failed") return file;
  return { ...file, status: "uploading", progress: 0, error: undefined };
}

export function updateProgress(file: UploadFileState, progress: number): UploadFileState {
  return { ...file, progress: Math.min(100, Math.max(0, progress)) };
}

export function completeUpload(file: UploadFileState, remoteUrl: string): UploadFileState {
  return { ...file, status: "done", progress: 100, remoteUrl };
}

export function failUpload(file: UploadFileState, error: string): UploadFileState {
  return { ...file, status: "failed", error };
}

export function removeFile(files: readonly UploadFileState[], id: string): readonly UploadFileState[] {
  return files.filter((f) => f.id !== id);
}

export function addFile(files: readonly UploadFileState[], file: UploadFileState): readonly UploadFileState[] {
  return [...files, file];
}
