import { MouseEvent, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import Spinner from "./Spinner";
import Button, { LinkButton } from "./Button";
import { endpoints } from "../../lib/api/endpoints";
import { ApiClientError } from "../../lib/api/client";
import { assetUrl } from "../../lib/assets";
import { resolveMediaKind, type MediaKind } from "../../lib/media";

interface Props {
  open: boolean;
  onClose: () => void;
  /** The purchased content to stream. */
  contentId: string;
  title: string;
  artist: string;
  coverUrl?: string | null;
  /** Backend content category — a fallback when the media URL is opaque. */
  category?: string | null;
  /** Optional controls rendered in the player footer (e.g. resell / unlist). */
  actions?: ReactNode;
}

interface Access {
  mediaUrl: string | null;
  category: string;
  kind?: MediaKind;
}

type Status = "loading" | "ready" | "error";

/** Block the right-click "save as" affordance — a light deterrent, not DRM. */
const blockContextMenu = (e: MouseEvent) => e.preventDefault();

/**
 * In-app player for a purchased drop. Fetches a fresh access grant when opened
 * (which also counts a play), then streams the file *inside* the platform —
 * video in a framed player, audio on a "now playing" stage, and non-streamable
 * originals as a guarded download. Replaces dumping the raw file into a new
 * browser tab. Playback stops automatically on close (the media unmounts with
 * the modal). Download is deterred client-side (`nodownload`, no context menu);
 * true content protection would require signed, auth-gated streaming URLs.
 */
export default function MediaPlayer({
  open,
  onClose,
  contentId,
  title,
  artist,
  coverUrl,
  category,
  actions,
}: Props) {
  const [status, setStatus] = useState<Status>("loading");
  const [access, setAccess] = useState<Access | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Monotonic request token: a late response for a superseded/closed player
  // (reopened, different drop) is ignored, so state never lands out of sync.
  const reqId = useRef(0);

  const load = useCallback(() => {
    if (!contentId) return;
    const id = ++reqId.current;
    setStatus("loading");
    setAccess(null);
    setErrorMsg(null);
    endpoints.purchases
      .access(contentId)
      .then((res) => {
        if (reqId.current !== id) return;
        setAccess({ mediaUrl: res.access.mediaUrl, category: res.access.category, kind: res.access.kind });
        setStatus("ready");
      })
      .catch((err) => {
        if (reqId.current !== id) return;
        setErrorMsg(err instanceof ApiClientError ? err.message : "Please try again.");
        setStatus("error");
      });
  }, [contentId]);

  useEffect(() => {
    if (open) load();
    // Closing invalidates any in-flight request so a late resolve can't flip
    // state (and re-count a play) after the user has moved on.
    else reqId.current++;
  }, [open, load]);

  const cover = assetUrl(coverUrl);
  const media = access?.mediaUrl ? assetUrl(access.mediaUrl) : null;
  // Prefer the backend-declared kind (the streaming URL carries no extension);
  // fall back to URL/category sniffing for resilience.
  const kind = access?.kind ?? resolveMediaKind(access?.mediaUrl, access?.category ?? category);

  return (
    <Modal open={open} onClose={onClose} size="xl" padded={false} hideClose>
      {/* Media stage */}
      <div className="relative w-full bg-bg-ink">
        {status === "loading" && (
          <div className="grid aspect-video w-full place-items-center">
            <Spinner size="lg" className="text-brand-green" />
          </div>
        )}

        {status === "error" && (
          <div className="grid aspect-video w-full place-items-center px-6 text-center">
            <div>
              <p className="text-sm font-semibold text-white">Couldn't open this drop</p>
              {errorMsg && <p className="mt-1 text-xs text-white/50">{errorMsg}</p>}
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={load}>
                  Retry
                </Button>
              </div>
            </div>
          </div>
        )}

        {status === "ready" && !media && <NoPreviewStage cover={cover} />}

        {status === "ready" && media && kind === "video" && (
          <video
            key={media}
            className="aspect-video w-full bg-black"
            controls
            autoPlay
            playsInline
            preload="metadata"
            poster={cover ?? undefined}
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
            onContextMenu={blockContextMenu}
            aria-label={`${title} by ${artist}`}
          >
            <source src={media} />
          </video>
        )}

        {status === "ready" && media && kind === "audio" && (
          <AudioStage src={media} cover={cover} title={title} artist={artist} />
        )}

        {status === "ready" && media && kind === "download" && (
          <DownloadStage src={media} cover={cover} />
        )}

        {/* Close — own affordance (with a scrim for legibility over bright frames) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close player"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/55 text-white/85 backdrop-blur-sm ring-1 ring-white/15 transition-colors hover:bg-black/75 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      {/* Footer — title, artist, actions */}
      <div className="flex items-center gap-4 border-t border-white/5 bg-bg-card px-5 py-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-bold text-white" title={title}>
            {title}
          </h2>
          <p className="truncate text-xs text-white/55">{artist}</p>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </Modal>
  );
}

function NoPreviewStage({ cover }: { cover: string | null }) {
  return (
    <div className="relative grid aspect-video w-full place-items-center overflow-hidden">
      {cover ? (
        <img src={cover} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-25 blur-sm" />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-brand-green/15 to-bg-ink" />
      )}
      <div className="relative px-6 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-green/15 text-brand-green">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 8v4l3 2" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-white">Preview coming soon</p>
        <p className="mx-auto mt-1 max-w-xs text-xs text-white/55">
          The artist hasn't attached a media file to this drop yet. Your access pass is safely in your library.
        </p>
      </div>
    </div>
  );
}

function AudioStage({
  src,
  cover,
  title,
  artist,
}: {
  src: string;
  cover: string | null;
  title: string;
  artist: string;
}) {
  return (
    <div className="relative flex aspect-video w-full flex-col items-center justify-center gap-5 overflow-hidden bg-gradient-to-b from-bg-soft/40 to-black px-6 py-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-brand-green/20 blur-[110px]"
      />
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl shadow-card ring-1 ring-white/10 sm:h-36 sm:w-36">
        {cover ? (
          <img src={cover} alt={`${title} cover art`} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-brand-green/25 to-bg-card text-brand-green">
            <svg viewBox="0 0 24 24" className="h-10 w-10" fill="currentColor" aria-hidden="true">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
            </svg>
          </div>
        )}
      </div>

      <Equalizer />

      <div className="relative w-full max-w-md text-center">
        <p className="truncate text-sm font-bold text-white">{title}</p>
        <p className="truncate text-xs text-white/55">{artist}</p>
        <audio
          src={src}
          controls
          autoPlay
          preload="metadata"
          controlsList="nodownload noremoteplayback"
          onContextMenu={blockContextMenu}
          className="mt-3 w-full"
          aria-label={`${title} by ${artist}`}
        />
      </div>
    </div>
  );
}

/** Purely decorative "now playing" equalizer; frozen under reduced motion. */
function Equalizer() {
  const bars = [0, 1, 2, 3, 4, 5, 6];
  return (
    <div aria-hidden="true" className="relative flex h-8 items-end gap-1">
      {bars.map((i) => (
        <span
          key={i}
          className="w-1 origin-bottom rounded-full bg-brand-green/70 animate-equalize"
          style={{
            height: "100%",
            animationDelay: `${i * 0.12}s`,
            animationDuration: `${0.9 + (i % 3) * 0.25}s`,
          }}
        />
      ))}
    </div>
  );
}

function DownloadStage({ src, cover }: { src: string; cover: string | null }) {
  return (
    <div className="relative grid aspect-video w-full place-items-center overflow-hidden">
      {cover ? (
        <img src={cover} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-30 blur-sm" />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-brand-green/15 to-bg-ink" />
      )}
      <div className="relative px-6 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-green/15 text-brand-green">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-white">Original file</p>
        <p className="mx-auto mt-1 mb-4 max-w-xs text-xs text-white/55">
          This exclusive drop is delivered as a downloadable original.
        </p>
        <LinkButton variant="primary" size="sm" href={src} download rel="noopener">
          Download
        </LinkButton>
      </div>
    </div>
  );
}
