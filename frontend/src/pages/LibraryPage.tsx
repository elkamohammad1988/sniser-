import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Section from "../components/layout/Section";
import SectionHeading from "../components/shared/SectionHeading";
import Button from "../components/shared/Button";
import Spinner from "../components/shared/Spinner";
import Modal from "../components/shared/Modal";
import MediaPlayer from "../components/shared/MediaPlayer";
import { useToast } from "../components/shared/ToastProvider";
import { usePageMeta } from "../hooks/usePageMeta";
import { endpoints } from "../lib/api/endpoints";
import { ApiClientError } from "../lib/api/client";
import { assetUrl } from "../lib/assets";
import type { PurchaseItem } from "../lib/api/types";
import { cn } from "../utils/cn";

export default function LibraryPage() {
  usePageMeta({
    title: "My Library — Sniser",
    description: "Your purchased access passes — stream them, or list them for resale.",
    canonicalPath: "/library",
  });

  const toast = useToast();
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [listing, setListing] = useState<PurchaseItem | null>(null);
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  // The drop being streamed. Kept set while the player animates closed so the
  // exit transition isn't cut short; `playerOpen` drives visibility.
  const [playing, setPlaying] = useState<PurchaseItem | null>(null);
  const [playerOpen, setPlayerOpen] = useState(false);

  const load = () => {
    setStatus("loading");
    endpoints.purchases
      .library()
      .then((res) => {
        setItems(res.items);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  };

  useEffect(() => {
    load();
  }, []);

  const openPlayer = (item: PurchaseItem) => {
    setPlaying(item);
    setPlayerOpen(true);
  };

  const openList = (item: PurchaseItem) => {
    setListing(item);
    setPrice(item.price ? String(item.price) : "");
  };

  const submitListing = async (e: FormEvent) => {
    e.preventDefault();
    if (!listing) return;
    const value = Number(price);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a valid price", "Must be greater than zero.");
      return;
    }
    setBusy(listing.id);
    try {
      await endpoints.resale.create(listing.id, value);
      toast.success("Listed for resale", `${listing.title} is now on the marketplace.`);
      setListing(null);
      load();
    } catch (err) {
      toast.error("Couldn't list", err instanceof ApiClientError ? err.message : "Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const cancelListing = async (item: PurchaseItem) => {
    if (!item.listing) return;
    setBusy(item.id);
    try {
      await endpoints.resale.cancel(item.listing.id);
      toast.info("Listing cancelled", `${item.title} is back in your library.`);
      load();
    } catch (err) {
      toast.error("Couldn't cancel", err instanceof ApiClientError ? err.message : "Please try again.");
    } finally {
      setBusy(null);
    }
  };

  // Resolve the player's item against the live list so its footer stays in sync
  // after a resale/unlist (the captured `playing` object would otherwise be stale).
  const livePlaying = playing ? items.find((i) => i.id === playing.id) ?? playing : null;
  const playerActions = livePlaying
    ? livePlaying.status === "listed" && livePlaying.listing
      ? (
          <>
            <span className="text-xs font-medium text-amber-300">
              Listed · ${livePlaying.listing.price.toFixed(2)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={busy === livePlaying.id}
              onClick={() => cancelListing(livePlaying)}
            >
              Unlist
            </Button>
          </>
        )
      : (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setPlayerOpen(false);
              openList(livePlaying);
            }}
          >
            Resell
          </Button>
        )
    : null;

  return (
    <>
      <Section tone="dark" spacing="md">
        <SectionHeading eyebrow="Library" align="left" className="max-w-2xl">
          Your access passes
        </SectionHeading>
        <p className="mt-3 max-w-2xl text-sm sm:text-base text-white/65 text-pretty">
          Everything you own on Sniser. Stream it anywhere you sign in, or list a pass for resale.
        </p>
      </Section>

      <Section tone="dark" spacing="sm">
        {status === "loading" && (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Spinner size="lg" className="text-brand-green" />
          </div>
        )}

        {status === "error" && (
          <div className="mx-auto max-w-md rounded-2xl bg-bg-card p-10 text-center ring-1 ring-white/5">
            <p className="text-sm text-white/60">Couldn't load your library.</p>
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={load}>Retry</Button>
            </div>
          </div>
        )}

        {status === "success" && items.length === 0 && (
          <div className="mx-auto max-w-md rounded-2xl bg-bg-card p-10 text-center ring-1 ring-white/5">
            <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-brand-green/15 text-brand-green">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 4h6v16H4zM14 4h6v10h-6zM14 16h6v4h-6z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Your library is empty</h3>
            <p className="mt-1.5 text-sm text-white/60">Buy your first access pass to start your collection.</p>
            <div className="mt-5">
              <Link to="/browse">
                <Button variant="primary" size="sm">Browse the catalog</Button>
              </Link>
            </div>
          </div>
        )}

        {status === "success" && items.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <LibraryCard
                key={item.id}
                item={item}
                busy={busy === item.id}
                onPlay={() => openPlayer(item)}
                onList={() => openList(item)}
                onCancel={() => cancelListing(item)}
              />
            ))}
          </div>
        )}
      </Section>

      <Modal
        open={!!listing}
        onClose={() => setListing(null)}
        title="List for resale"
        description={listing ? `Set a price for “${listing.title}”. A resale fee applies on sale.` : undefined}
        size="sm"
      >
        <form onSubmit={submitListing} className="space-y-4">
          <div>
            <label htmlFor="resale-price" className="mb-1.5 block text-xs font-semibold text-white/75">
              Resale price (USDC)
            </label>
            <input
              id="resale-price"
              type="number"
              min={1}
              step="0.5"
              inputMode="decimal"
              placeholder="e.g. 20"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="block w-full rounded-lg bg-bg-soft/60 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition-all focus:border-brand-green/60 focus:ring-2 focus:ring-brand-green/30"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="dark" size="md" fullWidth onClick={() => setListing(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" fullWidth isLoading={busy === listing?.id} loadingText="Listing…">
              List pass
            </Button>
          </div>
        </form>
      </Modal>

      <MediaPlayer
        open={playerOpen}
        onClose={() => setPlayerOpen(false)}
        contentId={playing?.contentId ?? ""}
        title={playing?.title ?? ""}
        artist={playing?.artist ?? ""}
        coverUrl={playing?.coverUrl}
        category={playing?.category}
        actions={playerActions}
      />
    </>
  );
}

interface CardProps {
  item: PurchaseItem;
  busy: boolean;
  onPlay: () => void;
  onList: () => void;
  onCancel: () => void;
}

function LibraryCard({ item, busy, onPlay, onList, onCancel }: CardProps) {
  const cover = assetUrl(item.coverUrl);
  const isListed = item.status === "listed" && item.listing;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-bg-card ring-1 ring-white/5">
      <div className="relative aspect-[16/10] overflow-hidden bg-bg-ink">
        {cover ? (
          <img src={cover} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-brand-green/20 to-bg-card text-brand-green">
            <svg viewBox="0 0 24 24" className="h-9 w-9" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
        <span className={cn(
          "absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
          isListed ? "bg-amber-400/20 text-amber-300" : "bg-brand-green/20 text-brand-green"
        )}>
          {isListed ? "Listed" : item.acquiredVia === "resale" ? "Resale" : "Owned"}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="truncate text-base font-bold text-white" title={item.title}>{item.title}</h3>
        <p className="mt-0.5 truncate text-xs text-white/55">{item.artist}</p>

        {isListed && item.listing && (
          <p className="mt-2 text-xs text-amber-300">Listed at ${item.listing.price.toFixed(2)}</p>
        )}

        <div className="mt-4 flex gap-2">
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={onPlay}
            leftIcon={
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            }
          >
            Play
          </Button>
          {isListed ? (
            <Button variant="outline" size="sm" onClick={onCancel} disabled={busy}>
              Unlist
            </Button>
          ) : (
            <Button variant="dark" size="sm" onClick={onList} disabled={busy}>
              Resell
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
