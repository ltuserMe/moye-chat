// ── 文件工具（纯逻辑，跨平台）──

export type FileType = "image" | "pdf" | "doc" | "xls" | "code" | "audio" | "video" | "archive" | "unknown";

/** MIME → 文件类型 */
export function getFileType(mimeType: string): FileType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("word") || mimeType.includes("document")) return "doc";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "xls";
  if (mimeType.includes("javascript") || mimeType.includes("typescript") || mimeType.includes("json") || mimeType.includes("html") || mimeType.includes("css") || mimeType.includes("xml") || mimeType.includes("python") || mimeType.includes("java") || mimeType.includes("text/x-")) return "code";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("gzip") || mimeType.includes("7z") || mimeType.includes("tar")) return "archive";
  return "unknown";
}

/** 是否为图片 */
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

/** 从文件名推断 MIME */
export function guessMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
    gif: "image/gif", webp: "image/webp", svg: "image/svg+xml",
    pdf: "application/pdf",
    doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    txt: "text/plain", csv: "text/csv",
    json: "application/json", js: "text/javascript", ts: "text/typescript",
    html: "text/html", css: "text/css", md: "text/markdown",
    py: "text/x-python", java: "text/x-java",
    mp3: "audio/mpeg", wav: "audio/wav",
    mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
    zip: "application/zip", rar: "application/x-rar-compressed",
    gz: "application/gzip", "7z": "application/x-7z-compressed"
  };
  return map[ext] ?? "application/octet-stream";
}

/** 校验 MIME */
export function isMimeAccepted(mimeType: string, acceptTypes?: readonly string[]): boolean {
  if (!acceptTypes?.length) return true;
  return acceptTypes.some((p) => p.endsWith("/*") ? mimeType.startsWith(p.slice(0, -1)) : p === mimeType);
}

/** 校验大小 */
export function checkFileSize(bytes: number, maxBytes: number): { ok: boolean; message?: string } {
  if (bytes > maxBytes) {
    const mb = (maxBytes / (1024 * 1024)).toFixed(1);
    return { ok: false, message: `文件大小超过 ${mb}MB 限制` };
  }
  return { ok: true };
}

/** 格式化大小 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * 根据 MIME 类型返回文件 icon SVG
 * 图片类型返回 null（调用方直接展示缩略图）
 */
export function getFileIconSvg(mimeType: string): string | null {
  const type = getFileType(mimeType);
  if (type === "image") return null;

  const icons: Record<Exclude<FileType, "image">, string> = {
    pdf:    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#ef4444"/><text x="16" y="22" text-anchor="middle" fill="white" font-size="13" font-weight="700">PDF</text></svg>`,
    doc:    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#3b82f6"/><text x="16" y="22" text-anchor="middle" fill="white" font-size="13" font-weight="700">DOC</text></svg>`,
    xls:    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#10b981"/><text x="16" y="22" text-anchor="middle" fill="white" font-size="13" font-weight="700">XLS</text></svg>`,
    code:   `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#f59e0b"/><text x="16" y="21" text-anchor="middle" fill="white" font-size="10" font-weight="700">&lt;/&gt;</text></svg>`,
    audio:  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#8b5cf6"/><text x="16" y="22" text-anchor="middle" fill="white" font-size="12">&#9835;</text></svg>`,
    video:  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#ec4899"/><polygon points="13,10 24,16 13,22" fill="white"/></svg>`,
    archive:`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#6b7280"/><text x="16" y="22" text-anchor="middle" fill="white" font-size="11" font-weight="700">ZIP</text></svg>`,
    unknown:`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#9ca3af"/><text x="16" y="22" text-anchor="middle" fill="white" font-size="10" font-weight="700">FILE</text></svg>`
  };

  return `data:image/svg+xml,${encodeURIComponent(icons[type])}`;
}
