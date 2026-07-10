import {
  FormEvent,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { m } from "framer-motion";
import Section from "../components/layout/Section";
import SectionHeading from "../components/shared/SectionHeading";
import Button from "../components/shared/Button";
import Spinner from "../components/shared/Spinner";
import { TextField, TextArea } from "../components/shared/Field";
import { useToast } from "../components/shared/ToastProvider";
import { useSession } from "../components/shared/SessionProvider";
import { useModal } from "../components/shared/ModalProvider";
import { usePageMeta } from "../hooks/usePageMeta";
import { cn } from "../utils/cn";
import { assetUrl } from "../lib/assets";
import { ApiClientError } from "../lib/api/client";
import { endpoints } from "../lib/api/endpoints";
import { validateMin, validateRequired } from "../utils/validation";
import type { ArtistDashboard, ArtistRelease } from "../lib/api/types";

type ReleaseCategory = ArtistRelease["category"];
type LoadStatus = "loading" | "success" | "error";
type PendingAction = { id: string; action: "status" | "delete" };

const HANDLE_RE = /^[a-z0-9_.]{3,30}$/;

const CATEGORIES: { value: ReleaseCategory; label: string }[] = [
  { value: "audio", label: "Audio" },
  { value: "video", label: "Video" },
  { value: "original", label: "Original (1-of-1)" },
];

const CATEGORY_LABEL: Record<ReleaseCategory, string> = {
  audio: "Audio",
  video: "Video",
  original: "Original",
};

const CATEGORY_ART: Record<ReleaseCategory, string> = {
  video: "from-brand-green/30 via-brand-green/10 to-bg-card",
  audio: "from-sky-400/25 via-indigo-500/10 to-bg-card",
  original: "from-amber-400/25 via-rose-500/10 to-bg-card",
};

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-amber-400/15 text-amber-300 ring-amber-400/30",
  published: "bg-brand-green/15 text-brand-green ring-brand-green/30",
  archived: "bg-white/10 text-white/55 ring-white/15",
};

function errMessage(err: unknown): string {
  return err instanceof ApiClientError ? err.message : "Please try again in a moment.";
}

function capitalize(value: string): string {
  return value.length ? value[0].toUpperCase() + value.slice(1) : value;
}

function validateHandle(value: string): string | null {
  const v = value.trim();
  if (!v) return "Handle is required.";
  if (!HANDLE_RE.test(v))
    return "3–30 chars: lowercase letters, numbers, dots or underscores.";
  return null;
}

/** Parse an optional non-negative integer field; returns null when empty/invalid. */
function toPositiveInt(value: string): number | null {
  const v = value.trim();
  if (!v) return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export default function StudioPage() {
  usePageMeta({
    title: "Artist Studio — Sniser",
    description:
      "Your Sniser artist studio — track plays and revenue, upload new drops, and publish releases to the marketplace.",
    canonicalPath: "/studio",
  });

  const { user, isArtist, setIsArtist, status: sessionStatus } = useSession();
  const toast = useToast();
  const modal = useModal();

  // --- Studio data (loaded only for artists) ------------------------------
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [dashboard, setDashboard] = useState<ArtistDashboard | null>(null);
  const [releases, setReleases] = useState<ArtistRelease[]>([]);
  const [pending, setPending] = useState<PendingAction | null>(null);

  // --- Apply form ---------------------------------------------------------
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [applyErrors, setApplyErrors] = useState<{
    handle?: string | null;
    displayName?: string | null;
  }>({});
  const [applying, setApplying] = useState(false);

  // --- New release form ---------------------------------------------------
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ReleaseCategory>("audio");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [supply, setSupply] = useState("");
  const [tags, setTags] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [releaseErrors, setReleaseErrors] = useState<{
    title?: string | null;
    price?: string | null;
  }>({});
  const [creating, setCreating] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoadStatus("loading");
    try {
      const [dash, rel] = await Promise.all([
        endpoints.artists.dashboard(),
        endpoints.artists.releases({ page: 1, pageSize: 20 }),
      ]);
      setDashboard(dash.stats);
      setReleases(rel.data);
      setLoadStatus("success");
    } catch {
      setLoadStatus("error");
    }
  }, []);

  const refreshDashboard = useCallback(async () => {
    try {
      const { stats } = await endpoints.artists.dashboard();
      setDashboard(stats);
    } catch {
      /* keep the prior stats in place */
    }
  }, []);

  // Load studio data whenever the visitor is (or becomes) an artist.
  useEffect(() => {
    if (isArtist) void load();
  }, [isArtist, load]);

  // Prefill the display name from the session once it hydrates (without
  // clobbering anything the user has already typed).
  useEffect(() => {
    if (user?.name) setDisplayName((prev) => (prev ? prev : user.name));
  }, [user?.name]);

  const resetReleaseForm = useCallback(() => {
    setTitle("");
    setCategory("audio");
    setDescription("");
    setPrice("");
    setDuration("");
    setSupply("");
    setTags("");
    setCoverFile(null);
    setMediaFile(null);
    setReleaseErrors({});
    if (coverInputRef.current) coverInputRef.current.value = "";
    if (mediaInputRef.current) mediaInputRef.current.value = "";
  }, []);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------
  const onApply = async (e: FormEvent) => {
    e.preventDefault();
    const nextErrors = {
      handle: validateHandle(handle),
      displayName: validateRequired(displayName, "Display name"),
    };
    setApplyErrors(nextErrors);
    if (nextErrors.handle || nextErrors.displayName) return;

    setApplying(true);
    try {
      await endpoints.artists.apply({
        handle: handle.trim(),
        displayName: displayName.trim(),
        bio: bio.trim() || undefined,
        location: location.trim() || undefined,
      });
      toast.success("You're an artist now", "Your studio is ready — create your first drop.");
      setIsArtist(true); // triggers the load effect above
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 409) {
        setApplyErrors((p) => ({ ...p, handle: err.message }));
      }
      toast.error("Couldn't complete your application", errMessage(err));
    } finally {
      setApplying(false);
    }
  };

  const onCreateRelease = async (e: FormEvent) => {
    e.preventDefault();
    const priceNum = Number(price);
    const nextErrors = {
      title: validateMin(title, 2, "Title"),
      price:
        price.trim() === "" || Number.isNaN(priceNum) || priceNum < 0
          ? "Enter a valid price (0 or more)."
          : null,
    };
    setReleaseErrors(nextErrors);
    if (nextErrors.title || nextErrors.price) return;

    setCreating(true);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("category", category);
      fd.append("price", String(priceNum));
      if (description.trim()) fd.append("description", description.trim());
      const durationSec = toPositiveInt(duration);
      if (durationSec !== null) fd.append("durationSec", String(durationSec));
      const supplyInt = toPositiveInt(supply);
      if (supplyInt !== null) fd.append("supply", String(supplyInt));
      if (tags.trim()) fd.append("tags", tags.trim());
      if (coverFile) fd.append("cover", coverFile);
      if (mediaFile) fd.append("media", mediaFile);

      const { release } = await endpoints.artists.createRelease(fd);
      setReleases((prev) => [release, ...prev]);
      toast.success(
        "Release created",
        release.status === "published" ? "It's live on the marketplace." : "Saved as a draft."
      );
      resetReleaseForm();
      setFormOpen(false);
      void refreshDashboard();
    } catch (err) {
      toast.error("Couldn't create release", errMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const onSetStatus = async (release: ArtistRelease, status: "published" | "draft") => {
    setPending({ id: release.id, action: "status" });
    try {
      const { release: updated } = await endpoints.artists.setStatus(release.id, status);
      setReleases((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(status === "published" ? "Release published" : "Moved to draft");
      void refreshDashboard();
    } catch (err) {
      toast.error("Couldn't update release", errMessage(err));
    } finally {
      setPending(null);
    }
  };

  const onDelete = async (release: ArtistRelease) => {
    setPending({ id: release.id, action: "delete" });
    try {
      await endpoints.artists.deleteRelease(release.id);
      setReleases((prev) => prev.filter((r) => r.id !== release.id));
      toast.success("Release deleted");
      void refreshDashboard();
    } catch (err) {
      toast.error("Couldn't delete release", errMessage(err));
    } finally {
      setPending(null);
    }
  };

  // -----------------------------------------------------------------------
  // Gates
  // -----------------------------------------------------------------------
  if (sessionStatus === "loading") {
    return (
      <Section tone="dark" spacing="lg">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner size="lg" className="text-brand-green" />
        </div>
      </Section>
    );
  }

  if (!user) {
    return (
      <Section tone="dark" spacing="lg">
        <div className="mx-auto max-w-md rounded-2xl bg-bg-card p-10 text-center ring-1 ring-white/5">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-brand-green/15 text-brand-green">
            <StudioIcon />
          </div>
          <h1 className="text-lg font-bold text-white">Sign in to open your studio</h1>
          <p className="mt-1.5 text-sm text-white/60 text-pretty">
            Log in or create an account to apply as an artist and start releasing on Sniser.
          </p>
          <div className="mt-6">
            <Button variant="primary" onClick={() => modal.openAuth({ mode: "login" })}>
              Sign in
            </Button>
          </div>
        </div>
      </Section>
    );
  }

  // -----------------------------------------------------------------------
  // Apply flow (non-artists)
  // -----------------------------------------------------------------------
  if (!isArtist) {
    return (
      <>
        <Section tone="dark" spacing="md">
          <SectionHeading eyebrow="Studio" align="left" className="max-w-2xl">
            Become a Sniser artist.
          </SectionHeading>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-white/65 text-pretty">
            Claim your handle to unlock the studio — upload drops, price your access passes, and get
            paid when fans buy or resell.
          </p>
        </Section>

        <Section tone="dark" spacing="sm">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl bg-bg-card p-6 sm:p-8 ring-1 ring-white/5"
            >
              <form noValidate onSubmit={onApply} className="space-y-4">
                <TextField
                  label="Artist handle"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase())}
                  onBlur={() => setApplyErrors((p) => ({ ...p, handle: validateHandle(handle) }))}
                  error={applyErrors.handle}
                  hint="Your public URL: sniser.com/artist/your-handle"
                  placeholder="nightdrive"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  leftIcon={<span className="text-sm font-semibold">@</span>}
                  required
                />
                <TextField
                  label="Display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onBlur={() =>
                    setApplyErrors((p) => ({
                      ...p,
                      displayName: validateRequired(displayName, "Display name"),
                    }))
                  }
                  error={applyErrors.displayName}
                  placeholder="Night Drive"
                  autoComplete="nickname"
                  required
                />
                <TextField
                  label="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  hint="Optional — where you're based."
                  placeholder="Berlin, DE"
                  autoComplete="off"
                />
                <TextArea
                  label="Bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  hint="Optional — tell fans what you make."
                  placeholder="A few sentences about your sound…"
                  rows={4}
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                  isLoading={applying}
                  loadingText="Submitting…"
                >
                  Open my studio
                </Button>
              </form>
            </m.div>

            <aside className="space-y-4">
              <div className="rounded-2xl bg-bg-card p-6 ring-1 ring-white/5">
                <h2 className="text-sm font-bold tracking-widestPlus uppercase text-white">
                  What you get
                </h2>
                <ul className="mt-4 space-y-3 text-sm">
                  {[
                    "Publish video, audio, and one-of-one originals.",
                    "Set your own price — earn on every primary sale.",
                    "Keep earning when fans resell their access.",
                    "Live dashboard for plays, sales, and revenue.",
                  ].map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3">
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-brand-green/15 text-brand-green">
                        <CheckIcon />
                      </span>
                      <span className="text-white/70 text-pretty">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl bg-bg-card p-6 ring-1 ring-white/5">
                <h2 className="text-sm font-bold tracking-widestPlus uppercase text-white">
                  Handle rules
                </h2>
                <p className="mt-3 text-sm text-white/65 leading-relaxed">
                  3–30 characters, lowercase letters, numbers, dots and underscores only. Your handle
                  is permanent and shown on every release.
                </p>
              </div>
            </aside>
          </div>
        </Section>
      </>
    );
  }

  // -----------------------------------------------------------------------
  // Studio (artists)
  // -----------------------------------------------------------------------
  const stats = dashboard
    ? [
        { label: "Releases", value: dashboard.releases.toLocaleString() },
        { label: "Published", value: dashboard.published.toLocaleString() },
        { label: "Total plays", value: dashboard.totalPlays.toLocaleString() },
        { label: "Sales", value: dashboard.sales.toLocaleString() },
        { label: "Revenue", value: `${dashboard.revenue.toFixed(2)} ${dashboard.currency}` },
        {
          label: "Wallet balance",
          value: `${dashboard.walletBalance.toFixed(2)} ${dashboard.currency}`,
        },
      ]
    : [];

  return (
    <>
      <Section tone="dark" spacing="md">
        <SectionHeading eyebrow="Studio" align="left" className="max-w-2xl">
          Artist Studio
        </SectionHeading>
        <p className="mt-3 max-w-2xl text-sm sm:text-base text-white/65 text-pretty">
          Welcome back{user.name ? `, ${user.name}` : ""} — track your numbers, upload new drops, and
          publish when you're ready.
        </p>
      </Section>

      <Section tone="dark" spacing="sm">
        {loadStatus === "error" ? (
          <ErrorState onRetry={() => void load()} />
        ) : (
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-10"
          >
            {/* Stats */}
            {loadStatus === "loading" || !dashboard ? (
              <StatsSkeleton />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-2xl bg-bg-card p-5 ring-1 ring-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-widestPlus text-white/45">
                      {s.label}
                    </p>
                    <p className="mt-2 text-2xl font-extrabold text-white tabular-nums">{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* New release */}
            <div className="rounded-2xl bg-bg-card ring-1 ring-white/5">
              <button
                type="button"
                onClick={() => setFormOpen((v) => !v)}
                aria-expanded={formOpen}
                aria-controls="new-release-form"
                className="flex w-full items-center justify-between gap-3 rounded-2xl p-5 sm:p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-inset"
              >
                <div>
                  <h2 className="text-base font-bold text-white">New release</h2>
                  <p className="mt-0.5 text-sm text-white/55">
                    Upload a drop, set a price, publish when ready.
                  </p>
                </div>
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-bg-soft/60 text-white/70 transition-transform duration-200",
                    formOpen && "rotate-45"
                  )}
                >
                  <PlusIcon />
                </span>
              </button>

              {formOpen && (
                <form
                  id="new-release-form"
                  noValidate
                  onSubmit={onCreateRelease}
                  className="space-y-4 border-t border-white/5 p-5 sm:p-6"
                >
                  <TextField
                    label="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() =>
                      setReleaseErrors((p) => ({ ...p, title: validateMin(title, 2, "Title") }))
                    }
                    error={releaseErrors.title}
                    placeholder="Midnight Sessions Vol. 1"
                    maxLength={120}
                    required
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="release-category"
                        className="mb-1.5 block text-xs font-semibold text-white/75"
                      >
                        Category
                      </label>
                      <select
                        id="release-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as ReleaseCategory)}
                        className="block w-full rounded-lg bg-bg-soft/60 border border-white/10 px-3.5 py-2.5 text-sm text-white outline-none transition-colors focus:border-brand-green/60 focus:ring-2 focus:ring-brand-green/30"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value} className="bg-bg-card">
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <TextField
                      label="Price"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      onBlur={() =>
                        setReleaseErrors((p) => ({
                          ...p,
                          price:
                            price.trim() === "" ||
                            Number.isNaN(Number(price)) ||
                            Number(price) < 0
                              ? "Enter a valid price (0 or more)."
                              : null,
                        }))
                      }
                      error={releaseErrors.price}
                      placeholder="9.99"
                      hint="In your wallet currency."
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      label="Duration"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="210"
                      hint="Seconds — optional."
                    />
                    <TextField
                      label="Supply"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={supply}
                      onChange={(e) => setSupply(e.target.value)}
                      placeholder="100"
                      hint="Editions — optional."
                    />
                  </div>

                  <TextField
                    label="Tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="live, exclusive, remix"
                    hint="Comma-separated — optional."
                  />

                  <TextArea
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What's in this drop?"
                    hint="Optional."
                    rows={3}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FileInput
                      id="release-cover"
                      label="Cover image"
                      accept="image/*"
                      hint="PNG or JPG — optional."
                      file={coverFile}
                      inputRef={coverInputRef}
                      onSelect={setCoverFile}
                    />
                    <FileInput
                      id="release-media"
                      label="Media file"
                      accept="audio/*,video/*"
                      hint="Audio or video — optional."
                      file={mediaFile}
                      inputRef={mediaInputRef}
                      onSelect={setMediaFile}
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    fullWidth
                    isLoading={creating}
                    loadingText="Creating…"
                  >
                    Create release
                  </Button>
                </form>
              )}
            </div>

            {/* Releases */}
            <div>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold uppercase tracking-widestPlus text-white">
                  Your releases
                </h2>
                {loadStatus === "success" && releases.length > 0 && (
                  <span className="text-xs text-white/45 tabular-nums">{releases.length} total</span>
                )}
              </div>

              <div className="mt-5 space-y-3">
                {loadStatus === "loading" && <ReleaseSkeletonList />}
                {loadStatus === "success" && releases.length === 0 && <EmptyReleases />}
                {loadStatus === "success" &&
                  releases.map((release) => (
                    <ReleaseRow
                      key={release.id}
                      release={release}
                      pending={pending}
                      onPublish={(r) => void onSetStatus(r, "published")}
                      onUnpublish={(r) => void onSetStatus(r, "draft")}
                      onDelete={(r) => void onDelete(r)}
                    />
                  ))}
              </div>
            </div>
          </m.div>
        )}
      </Section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FileInput({
  id,
  label,
  accept,
  hint,
  file,
  inputRef,
  onSelect,
}: {
  id: string;
  label: string;
  accept: string;
  hint: string;
  file: File | null;
  inputRef: RefObject<HTMLInputElement>;
  onSelect: (file: File | null) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-white/75">
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
        className="block w-full cursor-pointer rounded-lg border border-white/10 bg-bg-soft/60 text-sm text-white/70 file:mr-3 file:cursor-pointer file:border-0 file:bg-brand-green/15 file:px-3 file:py-2.5 file:text-xs file:font-semibold file:text-brand-green hover:file:bg-brand-green/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
      />
      <p className="mt-1.5 truncate text-xs text-white/50">{file ? file.name : hint}</p>
    </div>
  );
}

function ReleaseRow({
  release,
  pending,
  onPublish,
  onUnpublish,
  onDelete,
}: {
  release: ArtistRelease;
  pending: PendingAction | null;
  onPublish: (release: ArtistRelease) => void;
  onUnpublish: (release: ArtistRelease) => void;
  onDelete: (release: ArtistRelease) => void;
}) {
  const cover = assetUrl(release.coverUrl);
  const busy = pending?.id === release.id;
  const statusBusy = busy && pending?.action === "status";
  const deleteBusy = busy && pending?.action === "delete";
  const badge = STATUS_BADGE[release.status] ?? "bg-white/10 text-white/55 ring-white/15";

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-bg-card p-4 ring-1 ring-white/5 transition-colors hover:ring-white/10 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {cover ? (
          <img
            src={cover}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-16 w-16 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div
            className={cn(
              "grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-lg font-extrabold text-white/70",
              CATEGORY_ART[release.category]
            )}
          >
            {release.title.slice(0, 1).toUpperCase()}
          </div>
        )}

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1",
                badge
              )}
            >
              {capitalize(release.status)}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widestPlus text-brand-green">
              {CATEGORY_LABEL[release.category]}
            </span>
          </div>
          <h3 className="mt-1 truncate text-base font-bold text-white" title={release.title}>
            {release.title}
          </h3>
          <dl className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/50 tabular-nums">
            <div>
              <dt className="sr-only">Price</dt>
              <dd className="font-semibold text-white/70">
                {release.price.toFixed(2)} {release.currency}
              </dd>
            </div>
            <div>
              <dt className="sr-only">Plays</dt>
              <dd>{release.plays.toLocaleString()} plays</dd>
            </div>
            <div>
              <dt className="sr-only">Sales</dt>
              <dd>{release.sales.toLocaleString()} sales</dd>
            </div>
          </dl>
          {release.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {release.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/65 ring-1 ring-white/10"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {release.status === "draft" && (
          <Button
            variant="primary"
            size="sm"
            isLoading={statusBusy}
            loadingText="Publishing…"
            disabled={busy}
            onClick={() => onPublish(release)}
          >
            Publish
          </Button>
        )}
        {release.status === "published" && (
          <Button
            variant="dark"
            size="sm"
            isLoading={statusBusy}
            loadingText="Updating…"
            disabled={busy}
            onClick={() => onUnpublish(release)}
          >
            Unpublish
          </Button>
        )}
        {release.status === "archived" && (
          <Button
            variant="dark"
            size="sm"
            isLoading={statusBusy}
            loadingText="Publishing…"
            disabled={busy}
            onClick={() => onPublish(release)}
          >
            Publish
          </Button>
        )}
        <button
          type="button"
          onClick={() => onDelete(release)}
          disabled={busy}
          aria-busy={deleteBusy || undefined}
          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-red-500/25 bg-red-500/5 px-3 py-1.5 text-sm font-semibold text-red-300 transition-colors hover:border-red-500/45 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          {deleteBusy ? <Spinner size="sm" /> : <TrashIcon />}
          Delete
        </button>
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-bg-card p-5 ring-1 ring-white/5">
          <div className="h-3 w-16 animate-pulse-soft rounded bg-white/10" />
          <div className="mt-3 h-7 w-20 animate-pulse-soft rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}

function ReleaseSkeletonList() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-2xl bg-bg-card p-4 ring-1 ring-white/5"
        >
          <div className="h-16 w-16 shrink-0 animate-pulse-soft rounded-xl bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 animate-pulse-soft rounded bg-white/10" />
            <div className="h-4 w-2/3 animate-pulse-soft rounded bg-white/10" />
            <div className="h-3 w-1/3 animate-pulse-soft rounded bg-white/10" />
          </div>
        </div>
      ))}
    </>
  );
}

function EmptyReleases() {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-bg-card/40 p-10 text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand-green/15 text-brand-green">
        <MusicIcon />
      </div>
      <h3 className="text-base font-bold text-white">No releases yet</h3>
      <p className="mt-1.5 text-sm text-white/55 text-pretty">
        Create your first drop with the form above.
      </p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-bg-card p-10 text-center ring-1 ring-white/5">
      <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-red-500/15 text-red-400">
        <AlertIcon />
      </div>
      <h3 className="text-lg font-bold text-white">Couldn't load your studio</h3>
      <p className="mt-1.5 text-sm text-white/60">Something went wrong fetching your dashboard.</p>
      <div className="mt-5">
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 13 4 4L20 6" />
    </svg>
  );
}

function MusicIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function StudioIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 8v5m0 3.5v.01" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}
