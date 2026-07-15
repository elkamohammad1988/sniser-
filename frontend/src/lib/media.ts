/** How a purchased media file should be presented in the in-app player. */
export type MediaKind = "video" | "audio" | "download";

const VIDEO_EXT = /\.(mp4|webm|ogv|ogg|mov|m4v)(\?|#|$)/i;
const AUDIO_EXT = /\.(mp3|wav|oga|m4a|aac|weba|flac)(\?|#|$)/i;

/**
 * Decide how to render a purchased drop. The media file's extension is the
 * source of truth — an "original" drop can be an audio voicenote (play it) or a
 * downloadable artifact (offer a download) — and the content `category` is only
 * a fallback when the URL is opaque (e.g. a signed/query-string CDN link).
 *
 * `.ogg` is treated as video: it's ambiguous, but the seed and most container
 * usage lean video; a real audio `.ogg` uses `.oga`.
 */
export function resolveMediaKind(
  mediaUrl: string | null | undefined,
  category?: string | null
): MediaKind {
  if (mediaUrl) {
    if (VIDEO_EXT.test(mediaUrl)) return "video";
    if (AUDIO_EXT.test(mediaUrl)) return "audio";
  }
  if (category === "video") return "video";
  if (category === "audio") return "audio";
  return "download";
}
