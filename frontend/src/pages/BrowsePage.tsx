import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { m } from "framer-motion";
import Section from "../components/layout/Section";
import SectionHeading from "../components/shared/SectionHeading";
import Button from "../components/shared/Button";
import { TextField } from "../components/shared/Field";
import { useModal } from "../components/shared/ModalProvider";
import { useToast } from "../components/shared/ToastProvider";
import { useSession } from "../components/shared/SessionProvider";
import { usePageMeta } from "../hooks/usePageMeta";
import { StaggerContainer, StaggerItem } from "../components/shared/Stagger";
import { cn } from "../utils/cn";
import { assetUrl } from "../lib/assets";
import {
  PlayIcon,
  WaveformIcon,
  SparkIcon,
  SwapIcon,
  SearchIcon,
  AlertCircleIcon,
} from "../components/shared/Icons";
import { endpoints } from "../lib/api/endpoints";
import type { PaginationMeta } from "../lib/api/types";
import {
  CATEGORY_BLURB,
  CATEGORY_LABEL,
  ContentCategory,
  CatalogItem,
  SORT_LABEL,
  SortKey,
} from "../lib/catalog";

type Tab = ContentCategory | "all";

// `label` holds an i18n key string — resolve with `t(...)` at the render site.
const TABS: { value: Tab; label: string }[] = [
  { value: "all", label: "browse.tabs.all" },
  { value: "video", label: CATEGORY_LABEL.video },
  { value: "audio", label: CATEGORY_LABEL.audio },
  { value: "original", label: CATEGORY_LABEL.original },
  { value: "resale", label: CATEGORY_LABEL.resale },
];

const SORTS: SortKey[] = ["newest", "popular", "price-asc", "price-desc"];

function isCategory(value: string | null): value is ContentCategory {
  return value === "video" || value === "audio" || value === "original" || value === "resale";
}

function isSort(value: string | null): value is SortKey {
  return SORTS.includes(value as SortKey);
}

function formatPlays(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function formatDuration(seconds: number): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function BrowsePage() {
  const { t } = useTranslation();
  usePageMeta({
    title: t("browse.meta.title"),
    description: t("browse.meta.description"),
    canonicalPath: "/browse",
  });

  const [params, setParams] = useSearchParams();
  const tab: Tab = isCategory(params.get("type")) ? (params.get("type") as ContentCategory) : "all";
  const sort: SortKey = isSort(params.get("sort")) ? (params.get("sort") as SortKey) : "newest";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const queryFromUrl = params.get("q") ?? "";

  const [search, setSearch] = useState(queryFromUrl);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  const patchParams = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params);
      mutate(next);
      setParams(next, { replace: true });
    },
    [params, setParams]
  );

  const setTab = (value: Tab) =>
    patchParams((next) => {
      value === "all" ? next.delete("type") : next.set("type", value);
      next.delete("page");
    });

  const setSort = (value: SortKey) =>
    patchParams((next) => {
      value === "newest" ? next.delete("sort") : next.set("sort", value);
      next.delete("page");
    });

  const setPage = (value: number) =>
    patchParams((next) => {
      value <= 1 ? next.delete("page") : next.set("page", String(value));
    });

  // Debounce the search box → URL param.
  const debounceRef = useRef<number>();
  const onSearchChange = (value: string) => {
    setSearch(value);
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      patchParams((next) => {
        value ? next.set("q", value) : next.delete("q");
        next.delete("page");
      });
    }, 350);
  };

  // Keep the input in sync when the URL is changed externally (e.g. reset).
  useEffect(() => {
    setSearch(queryFromUrl);
  }, [queryFromUrl]);

  // Fetch whenever the effective query changes.
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    endpoints.catalog
      .list({ category: tab, sort, q: queryFromUrl || undefined, page, pageSize: 12 })
      .then((res) => {
        if (cancelled) return;
        setItems(res.data);
        setPagination(res.meta?.pagination ?? null);
        setStatus("success");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [tab, sort, queryFromUrl, page]);

  const resetAll = () => {
    setSearch("");
    setParams(new URLSearchParams(), { replace: true });
  };

  const retry = () => {
    // Re-trigger the effect by nudging the page param to itself.
    setStatus("loading");
    setParams(new URLSearchParams(params), { replace: true });
  };

  return (
    <>
      <Section tone="dark" spacing="md">
        <SectionHeading eyebrow={t("browse.eyebrow")} align="left" className="max-w-2xl">
          {t("browse.heading")}
        </SectionHeading>
        <p className="mt-3 max-w-2xl text-sm sm:text-base text-white/65 text-pretty">
          {tab === "all" ? t("browse.allBlurb") : t(CATEGORY_BLURB[tab])}
        </p>

        <div role="tablist" aria-label={t("browse.tablistLabel")} className="mt-8 flex flex-wrap gap-2">
          {TABS.map((opt) => {
            const active = tab === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(opt.value)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                  active
                    ? "bg-brand-green text-bg"
                    : "bg-bg-card text-white/75 ring-1 ring-white/10 hover:text-white hover:ring-white/25"
                )}
              >
                {t(opt.label)}
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <TextField
            label={t("browse.searchLabel")}
            placeholder={t("browse.searchPlaceholder")}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            leftIcon={<SearchIcon className="h-4 w-4" />}
          />
          <div>
            <label htmlFor="browse-sort" className="mb-1.5 block text-xs font-semibold text-white/75">
              {t("browse.sortLabel")}
            </label>
            <select
              id="browse-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="block w-full sm:w-56 rounded-lg bg-bg-soft/60 border border-white/10 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-brand-green/60 focus:ring-2 focus:ring-brand-green/30"
            >
              {SORTS.map((s) => (
                <option key={s} value={s} className="bg-bg-card">
                  {t(SORT_LABEL[s])}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      <Section tone="dark" spacing="sm" id="browse-results">
        <p aria-live="polite" className="sr-only">
          {t("browse.results", { count: pagination?.total ?? 0 })}
        </p>

        {status === "loading" && <SkeletonGrid />}

        {status === "error" && <ErrorState onRetry={retry} />}

        {status === "success" && items.length === 0 && <EmptyState onReset={resetAll} />}

        {status === "success" && items.length > 0 && (
          <>
            <StaggerContainer className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <StaggerItem key={item.id}>
                  <CatalogCard item={item} />
                </StaggerItem>
              ))}
            </StaggerContainer>

            {pagination && pagination.totalPages > 1 && (
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPage={setPage}
              />
            )}
          </>
        )}
      </Section>
    </>
  );
}

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  const { t } = useTranslation();
  return (
    <nav className="mt-10 flex items-center justify-center gap-3" aria-label={t("browse.pagination.label")}>
      <Button variant="dark" size="sm" onClick={() => onPage(page - 1)} disabled={page <= 1}>
        {t("browse.pagination.previous")}
      </Button>
      <span className="text-sm text-white/60 tabular-nums">
        {t("browse.pagination.pageOf", { page, totalPages })}
      </span>
      <Button variant="dark" size="sm" onClick={() => onPage(page + 1)} disabled={page >= totalPages}>
        {t("browse.pagination.next")}
      </Button>
    </nav>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl bg-bg-card ring-1 ring-white/5">
          <div className="aspect-[4/3] animate-pulse-soft bg-white/5" />
          <div className="space-y-3 p-5">
            <div className="h-3 w-16 animate-pulse-soft rounded bg-white/10" />
            <div className="h-4 w-2/3 animate-pulse-soft rounded bg-white/10" />
            <div className="h-3 w-1/3 animate-pulse-soft rounded bg-white/10" />
            <div className="h-9 w-full animate-pulse-soft rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-bg-card p-10 text-center ring-1 ring-white/5">
      <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-red-500/15 text-red-400">
        <AlertCircleIcon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold text-white">{t("browse.error.title")}</h3>
      <p className="mt-1.5 text-sm text-white/60">{t("browse.error.body")}</p>
      <div className="mt-5">
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t("browse.error.retry")}
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  const { t } = useTranslation();
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-md rounded-2xl bg-bg-card p-10 text-center ring-1 ring-white/5"
    >
      <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-brand-green/15 text-brand-green">
        <SearchIcon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold text-white">{t("browse.empty.title")}</h3>
      <p className="mt-1.5 text-sm text-white/60">
        {t("browse.empty.body")}
      </p>
      <div className="mt-5">
        <Button variant="outline" size="sm" onClick={onReset}>
          {t("browse.empty.clear")}
        </Button>
      </div>
    </m.div>
  );
}

function CatalogCard({ item }: { item: CatalogItem }) {
  const { t } = useTranslation();
  const modal = useModal();
  const toast = useToast();
  const { user } = useSession();
  const cover = assetUrl(item.coverUrl);

  const onBuy = () => {
    if (!user) {
      modal.openAuth({ mode: "login" });
      toast.info(t("browse.card.signInToBuyTitle"), t("browse.card.signInToBuyBody"));
      return;
    }
    modal.openPurchase(item);
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-bg-card ring-1 ring-white/5 transition-all duration-300 ease-out-soft hover:-translate-y-0.5 hover:ring-white/15 hover:shadow-card">
      <CardArt category={item.category} cover={cover} title={item.title} />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widestPlus text-brand-green">
              {t(CATEGORY_LABEL[item.category])}
            </p>
            <h3 className="mt-1 truncate text-base font-bold text-white" title={item.title}>
              {item.title}
            </h3>
            <p className="mt-0.5 truncate text-xs text-white/55">{item.artist}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] uppercase tracking-widestPlus text-white/40">{t("browse.card.price")}</p>
            <p className="text-sm font-bold text-white">${item.price.toFixed(2)}</p>
          </div>
        </div>

        {item.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/70 ring-1 ring-white/10">
                {tag}
              </span>
            ))}
          </div>
        )}

        <dl className="mt-4 flex items-center gap-4 text-[11px] text-white/45">
          {item.plays > 0 && (
            <div>
              <dt className="sr-only">{t("browse.card.playsSr")}</dt>
              <dd>{t("browse.card.playsCount", { plays: formatPlays(item.plays) })}</dd>
            </div>
          )}
          {item.durationSec > 0 && (
            <div>
              <dt className="sr-only">{t("browse.card.durationSr")}</dt>
              <dd>{formatDuration(item.durationSec)}</dd>
            </div>
          )}
        </dl>

        <div className="mt-5">
          <Button variant="primary" size="sm" fullWidth onClick={onBuy}>
            {item.kind === "resale" ? t("browse.card.buyResale") : t("browse.card.buyAccess")}
          </Button>
        </div>
      </div>
    </article>
  );
}

function CardArt({ category, cover, title }: { category: ContentCategory; cover: string | null; title: string }) {
  const palette: Record<ContentCategory, string> = {
    video: "from-brand-green/30 via-brand-green/10 to-bg-card",
    audio: "from-sky-400/25 via-indigo-500/10 to-bg-card",
    original: "from-amber-400/25 via-rose-500/10 to-bg-card",
    resale: "from-fuchsia-400/25 via-violet-500/10 to-bg-card",
  };
  const glyph: Record<ContentCategory, JSX.Element> = {
    video: <PlayIcon className="h-10 w-10" />,
    audio: <WaveformIcon className="h-10 w-10" />,
    original: <SparkIcon className="h-10 w-10" />,
    resale: <SwapIcon className="h-10 w-10" />,
  };

  if (cover) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden bg-bg-ink">
        <img
          src={cover}
          alt={title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 ease-out-soft group-hover:scale-105"
        />
      </div>
    );
  }

  return (
    <div className={cn("relative aspect-[4/3] overflow-hidden bg-gradient-to-br", palette[category])}>
      <div className="absolute inset-0 grid place-items-center text-white/55 transition-transform duration-500 ease-out-soft group-hover:scale-105 group-hover:text-white/80">
        {glyph[category]}
      </div>
    </div>
  );
}
