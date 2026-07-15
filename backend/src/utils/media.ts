import path from "node:path";

/**
 * Media presentation helpers shared by the streaming route and the access
 * service. Kept in one place so the stored file's extension maps to the same
 * content-type and player "kind" everywhere.
 */

const CONTENT_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogv": "video/ogg",
  ".ogg": "video/ogg",
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".wav": "audio/wav",
  ".oga": "audio/ogg",
  ".weba": "audio/webm",
  ".flac": "audio/flac",
};

// `.ogg` is treated as video (ambiguous container; real audio uses `.oga`),
// matching the frontend's resolveMediaKind so the two never disagree.
const VIDEO_EXT = new Set([".mp4", ".webm", ".ogv", ".ogg", ".mov", ".m4v"]);
const AUDIO_EXT = new Set([".mp3", ".m4a", ".aac", ".wav", ".oga", ".weba", ".flac"]);

export type MediaKind = "video" | "audio" | "download";

/** MIME type for a stored media path, defaulting to a generic download. */
export function contentTypeForFile(filePath: string): string {
  return CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

/** How the in-app player should present a stored media file. */
export function mediaKindForFile(filePath: string): MediaKind {
  const ext = path.extname(filePath).toLowerCase();
  if (VIDEO_EXT.has(ext)) return "video";
  if (AUDIO_EXT.has(ext)) return "audio";
  return "download";
}
