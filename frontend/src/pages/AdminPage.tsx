import { ReactNode, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import Section from "../components/layout/Section";
import SectionHeading from "../components/shared/SectionHeading";
import Button from "../components/shared/Button";
import { TextField } from "../components/shared/Field";
import Spinner from "../components/shared/Spinner";
import { useToast } from "../components/shared/ToastProvider";
import { usePageMeta } from "../hooks/usePageMeta";
import { cn } from "../utils/cn";
import { ApiClientError } from "../lib/api/client";
import { endpoints } from "../lib/api/endpoints";
import type {
  AdminStats,
  AdminUser,
  AdminTicket,
  AuditEntry,
  PaginationMeta,
} from "../lib/api/types";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

type LoadStatus = "loading" | "success" | "error";

interface SelectOption {
  value: string;
  labelKey: string;
}

const ROLE_OPTIONS: SelectOption[] = [
  { value: "viewer", labelKey: "admin.role.viewer" },
  { value: "artist", labelKey: "admin.role.artist" },
  { value: "admin", labelKey: "admin.role.admin" },
];

const ROLE_FILTER_OPTIONS: SelectOption[] = [{ value: "all", labelKey: "admin.roleFilter.all" }, ...ROLE_OPTIONS];

const STATUS_FILTER_OPTIONS: SelectOption[] = [
  { value: "all", labelKey: "admin.statusFilter.all" },
  { value: "active", labelKey: "admin.statusFilter.active" },
  { value: "suspended", labelKey: "admin.statusFilter.suspended" },
];

const TICKET_STATUS_OPTIONS: SelectOption[] = [
  { value: "open", labelKey: "admin.ticketStatus.open" },
  { value: "in_progress", labelKey: "admin.ticketStatus.inProgress" },
  { value: "closed", labelKey: "admin.ticketStatus.closed" },
];

const TICKET_FILTER_OPTIONS: SelectOption[] = [
  { value: "all", labelKey: "admin.ticketFilter.all" },
  ...TICKET_STATUS_OPTIONS,
];

const TABS: SelectOption[] = [
  { value: "users", labelKey: "admin.tabs.users" },
  { value: "tickets", labelKey: "admin.tabs.tickets" },
  { value: "audit", labelKey: "admin.tabs.audit" },
];

type AdminTab = "users" | "tickets" | "audit";

function errMessage(err: unknown): string {
  return err instanceof ApiClientError ? err.message : i18n.t("admin.errFallback");
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

function ticketLabel(status: string): string {
  const found = TICKET_STATUS_OPTIONS.find((o) => o.value === status);
  return found ? i18n.t(found.labelKey) : status;
}

type BadgeTone = "green" | "red" | "amber" | "sky" | "neutral";

function roleTone(role: string): BadgeTone {
  if (role === "admin") return "green";
  if (role === "artist") return "sky";
  return "neutral";
}

function statusTone(status: string): BadgeTone {
  return status === "active" ? "green" : "red";
}

function ticketTone(status: string): BadgeTone {
  if (status === "open") return "amber";
  if (status === "in_progress") return "sky";
  return "green";
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminPage() {
  const { t } = useTranslation();
  usePageMeta({
    title: t("admin.meta.title"),
    description: t("admin.meta.description"),
    canonicalPath: "/admin",
  });

  const [tab, setTab] = useState<AdminTab>("users");

  return (
    <>
      <Section tone="dark" spacing="md">
        <SectionHeading eyebrow={t("admin.eyebrow")} align="left" className="max-w-2xl">
          {t("admin.title")}
        </SectionHeading>
        <p className="mt-3 max-w-2xl text-sm sm:text-base text-white/65 text-pretty">
          {t("admin.subtitle")}
        </p>

        <div className="mt-8">
          <StatsOverview />
        </div>

        <div role="tablist" aria-label={t("admin.tabsAriaLabel")} className="mt-10 flex flex-wrap gap-2">
          {TABS.map((tabOption) => {
            const active = tab === tabOption.value;
            return (
              <button
                key={tabOption.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(tabOption.value as AdminTab)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                  active
                    ? "bg-brand-green text-bg"
                    : "bg-bg-card text-white/75 ring-1 ring-white/10 hover:text-white hover:ring-white/25"
                )}
              >
                {t(tabOption.labelKey)}
              </button>
            );
          })}
        </div>
      </Section>

      <Section tone="dark" spacing="sm">
        {tab === "users" && <UsersPanel />}
        {tab === "tickets" && <TicketsPanel />}
        {tab === "audit" && <AuditPanel />}
      </Section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Stats overview
// ---------------------------------------------------------------------------

function StatsOverview() {
  const { t } = useTranslation();
  const toast = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    endpoints.admin
      .stats()
      .then((res) => {
        if (cancelled) return;
        setStats(res.stats);
        setStatus("success");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus("error");
        toast.error(t("admin.stats.loadError"), errMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey, toast, t]);

  if (status === "loading") {
    return <LoadingBlock rows={4} />;
  }

  if (status === "error" || !stats) {
    return <ErrorBlock onRetry={() => setReloadKey((k) => k + 1)} />;
  }

  const cards: { label: string; value: string }[] = [
    { label: t("admin.stats.totalUsers"), value: stats.users.total.toLocaleString() },
    { label: t("admin.stats.artists"), value: stats.users.artists.toLocaleString() },
    { label: t("admin.stats.publishedContent"), value: stats.content.published.toLocaleString() },
    { label: t("admin.stats.salesCount"), value: stats.sales.count.toLocaleString() },
    {
      label: t("admin.stats.grossVolume"),
      value: `${stats.sales.grossVolume.toFixed(2)} ${stats.sales.currency}`,
    },
    { label: t("admin.stats.openTickets"), value: stats.tickets.open.toLocaleString() },
    { label: t("admin.stats.activeResale"), value: stats.resale.active.toLocaleString() },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {cards.map((c) => (
        <StatCard key={c.label} label={c.label} value={c.value} />
      ))}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-bg-card p-5 ring-1 ring-white/5">
      <p className="text-[10px] font-bold uppercase tracking-widestPlus text-white/40">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-white tabular-nums break-words">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Users panel
// ---------------------------------------------------------------------------

function UsersPanel() {
  const { t } = useTranslation();
  const toast = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  const debounceRef = useRef<number>();
  const onSearchChange = (value: string) => {
    setSearchInput(value);
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setQ(value);
      setPage(1);
    }, 350);
  };

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    endpoints.admin
      .users({
        role: role === "all" ? undefined : role,
        status: statusFilter === "all" ? undefined : statusFilter,
        q: q || undefined,
        page,
      })
      .then((res) => {
        if (cancelled) return;
        setUsers(res.data);
        setPagination(res.meta?.pagination ?? null);
        setStatus("success");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus("error");
        toast.error(t("admin.users.loadError"), errMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [role, statusFilter, q, page, reloadKey, toast, t]);

  const changeRole = async (user: AdminUser, nextRole: string) => {
    if (nextRole === user.role) return;
    setBusyId(user.id);
    try {
      const res = await endpoints.admin.updateUser(user.id, { role: nextRole });
      const applied = res.user.role as AdminUser["role"];
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: applied } : u)));
      toast.success(t("admin.users.roleUpdatedTitle"), t("admin.users.roleUpdatedBody", { email: user.email, role: applied }));
    } catch (err) {
      toast.error(t("admin.users.roleErrorTitle"), errMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const toggleStatus = async (user: AdminUser) => {
    const next = user.status === "active" ? "suspended" : "active";
    setBusyId(user.id);
    try {
      const res = await endpoints.admin.updateUser(user.id, { status: next });
      const applied = res.user.status as AdminUser["status"];
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: applied } : u)));
      toast.success(
        applied === "suspended" ? t("admin.users.suspendedTitle") : t("admin.users.activatedTitle"),
        user.email
      );
    } catch (err) {
      toast.error(t("admin.users.statusErrorTitle"), errMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto] lg:items-end">
        <TextField
          label={t("admin.users.searchLabel")}
          placeholder={t("admin.users.searchPlaceholder")}
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          leftIcon={
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          }
        />
        <Select
          label={t("admin.users.roleFilterLabel")}
          value={role}
          options={ROLE_FILTER_OPTIONS}
          onChange={(v) => {
            setRole(v);
            setPage(1);
          }}
          className="lg:w-44"
        />
        <Select
          label={t("admin.users.statusFilterLabel")}
          value={statusFilter}
          options={STATUS_FILTER_OPTIONS}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          className="lg:w-44"
        />
      </div>

      <div className="mt-6">
        {status === "loading" && <LoadingBlock rows={6} />}

        {status === "error" && <ErrorBlock onRetry={() => setReloadKey((k) => k + 1)} />}

        {status === "success" && users.length === 0 && (
          <EmptyBlock title={t("admin.users.emptyTitle")} hint={t("admin.users.emptyHint")} />
        )}

        {status === "success" && users.length > 0 && (
          <div className="overflow-x-auto rounded-2xl ring-1 ring-white/5">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-bg-card/70 text-left">
                  <Th>{t("admin.users.th.user")}</Th>
                  <Th>{t("admin.users.th.role")}</Th>
                  <Th>{t("admin.users.th.status")}</Th>
                  <Th className="text-right">{t("admin.users.th.purchases")}</Th>
                  <Th>{t("admin.users.th.joined")}</Th>
                  <Th className="text-right">{t("admin.users.th.actions")}</Th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const busy = busyId === u.id;
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3 align-middle">
                        <p className="font-semibold text-white">{u.name || "—"}</p>
                        <p className="mt-0.5 text-xs text-white/55">{u.email}</p>
                        {!u.emailVerified && (
                          <span className="mt-1 inline-flex text-[10px] font-semibold uppercase tracking-wide text-amber-300/80">
                            {t("admin.users.unverified")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <Badge tone={roleTone(u.role)}>{u.role}</Badge>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <Badge tone={statusTone(u.status)}>{u.status}</Badge>
                      </td>
                      <td className="px-4 py-3 align-middle text-right tabular-nums text-white/75">
                        {u.purchases.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 align-middle whitespace-nowrap text-white/60">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center justify-end gap-2">
                          <Select
                            label={t("admin.users.changeRoleFor", { email: u.email })}
                            hideLabel
                            compact
                            disabled={busy}
                            value={u.role}
                            options={ROLE_OPTIONS}
                            onChange={(v) => void changeRole(u, v)}
                            className="w-28"
                          />
                          <Button
                            variant={u.status === "active" ? "outline" : "primary"}
                            size="sm"
                            isLoading={busy}
                            onClick={() => void toggleStatus(u)}
                          >
                            {u.status === "active" ? t("admin.users.suspend") : t("admin.users.activate")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {status === "success" && pagination && pagination.totalPages > 1 && (
          <Pagination meta={pagination} onPage={setPage} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tickets panel
// ---------------------------------------------------------------------------

function TicketsPanel() {
  const { t } = useTranslation();
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    endpoints.admin
      .tickets({ status: statusFilter === "all" ? undefined : statusFilter, page })
      .then((res) => {
        if (cancelled) return;
        setTickets(res.data);
        setPagination(res.meta?.pagination ?? null);
        setStatus("success");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus("error");
        toast.error(t("admin.tickets.loadError"), errMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [statusFilter, page, reloadKey, toast, t]);

  const changeStatus = async (ticket: AdminTicket, next: string) => {
    if (next === ticket.status) return;
    setBusyId(ticket.id);
    try {
      const res = await endpoints.admin.updateTicket(ticket.id, next);
      const applied = res.ticket.status;
      setTickets((prev) => prev.map((item) => (item.id === ticket.id ? { ...item, status: applied } : item)));
      toast.success(t("admin.tickets.updatedTitle"), t("admin.tickets.updatedBody", { ref: ticket.reference, label: ticketLabel(applied) }));
    } catch (err) {
      toast.error(t("admin.tickets.updateErrorTitle"), errMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-[auto] sm:justify-start">
        <Select
          label={t("admin.tickets.statusFilterLabel")}
          value={statusFilter}
          options={TICKET_FILTER_OPTIONS}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          className="sm:w-56"
        />
      </div>

      <div className="mt-6">
        {status === "loading" && <LoadingBlock rows={4} />}

        {status === "error" && <ErrorBlock onRetry={() => setReloadKey((k) => k + 1)} />}

        {status === "success" && tickets.length === 0 && <EmptyBlock title={t("admin.tickets.empty")} />}

        {status === "success" && tickets.length > 0 && (
          <ul className="grid gap-4">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                busy={busyId === ticket.id}
                onChangeStatus={(next) => void changeStatus(ticket, next)}
              />
            ))}
          </ul>
        )}

        {status === "success" && pagination && pagination.totalPages > 1 && (
          <Pagination meta={pagination} onPage={setPage} />
        )}
      </div>
    </div>
  );
}

function TicketCard({
  ticket,
  busy,
  onChangeStatus,
}: {
  ticket: AdminTicket;
  busy: boolean;
  onChangeStatus: (next: string) => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const longMessage = ticket.message.length > 160;

  return (
    <li className="rounded-2xl bg-bg-card p-5 ring-1 ring-white/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-white/45">{ticket.reference}</span>
            <Badge tone={ticketTone(ticket.status)}>{ticketLabel(ticket.status)}</Badge>
          </div>
          <p className="mt-1.5 font-semibold text-white">{ticket.name || "—"}</p>
          <p className="text-xs text-white/55">{ticket.email}</p>
        </div>
        <span className="whitespace-nowrap text-xs text-white/45">{formatDate(ticket.createdAt)}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/70 ring-1 ring-white/10">
          {ticket.topic}
        </span>
      </div>

      <p
        className={cn(
          "mt-3 text-sm text-white/70 text-pretty",
          !expanded && longMessage && "line-clamp-2"
        )}
      >
        {ticket.message}
      </p>
      {longMessage && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 text-xs font-semibold text-brand-green hover:text-brand-greenDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green rounded"
        >
          {expanded ? t("admin.tickets.showLess") : t("admin.tickets.showMore")}
        </button>
      )}

      <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-4">
        <Select
          label={t("admin.tickets.setStatusFor", { ref: ticket.reference })}
          hideLabel
          compact
          disabled={busy}
          value={ticket.status}
          options={TICKET_STATUS_OPTIONS}
          onChange={onChangeStatus}
          className="w-40"
        />
        {busy && <Spinner size="sm" className="text-brand-green" />}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Audit panel
// ---------------------------------------------------------------------------

function AuditPanel() {
  const { t } = useTranslation();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    endpoints.admin
      .audit({ page })
      .then((res) => {
        if (cancelled) return;
        setEntries(res.data);
        setPagination(res.meta?.pagination ?? null);
        setStatus("success");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus("error");
        toast.error(t("admin.audit.loadError"), errMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [page, reloadKey, toast, t]);

  if (status === "loading") return <LoadingBlock rows={5} />;
  if (status === "error") return <ErrorBlock onRetry={() => setReloadKey((k) => k + 1)} />;
  if (entries.length === 0) return <EmptyBlock title={t("admin.audit.empty")} />;

  return (
    <div>
      <ul className="grid gap-3">
        {entries.map((e) => (
          <li key={e.id} className="rounded-xl bg-bg-card p-4 ring-1 ring-white/5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wide text-brand-green">
                {e.action}
              </span>
              <span className="whitespace-nowrap text-xs text-white/45">{formatDate(e.createdAt)}</span>
            </div>
            <p className="mt-2 text-xs text-white/60">
              <span className="text-white/75">{e.actorEmail ?? t("admin.audit.system")}</span>
              {(e.targetType || e.targetId) && (
                <>
                  {" · "}
                  <span className="text-white/50">
                    {e.targetType ?? "—"}
                    {e.targetId ? `/${e.targetId}` : ""}
                  </span>
                </>
              )}
              {e.ip && (
                <>
                  {" · "}
                  <span className="font-mono text-white/45">{e.ip}</span>
                </>
              )}
            </p>
            {e.metadata && Object.keys(e.metadata).length > 0 && (
              <div className="mt-2 overflow-x-auto">
                <pre className="rounded-lg bg-bg-ink/60 p-2.5 text-[11px] leading-relaxed text-white/55 ring-1 ring-white/5">
                  {JSON.stringify(e.metadata)}
                </pre>
              </div>
            )}
          </li>
        ))}
      </ul>

      {pagination && pagination.totalPages > 1 && <Pagination meta={pagination} onPage={setPage} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reusable primitives
// ---------------------------------------------------------------------------

function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-[10px] font-bold uppercase tracking-widestPlus text-white/40",
        className
      )}
    >
      {children}
    </th>
  );
}

const BADGE_TONES: Record<BadgeTone, string> = {
  green: "bg-brand-green/15 text-brand-green ring-brand-green/30",
  red: "bg-red-500/15 text-red-400 ring-red-500/30",
  amber: "bg-amber-400/15 text-amber-300 ring-amber-400/30",
  sky: "bg-sky-400/15 text-sky-300 ring-sky-400/30",
  neutral: "bg-white/5 text-white/70 ring-white/15",
};

function Badge({ children, tone }: { children: ReactNode; tone: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1",
        BADGE_TONES[tone]
      )}
    >
      {children}
    </span>
  );
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  hideLabel?: boolean;
  compact?: boolean;
  disabled?: boolean;
  className?: string;
}

function Select({
  label,
  value,
  onChange,
  options,
  hideLabel,
  compact,
  disabled,
  className,
}: SelectProps) {
  const { t } = useTranslation();
  const autoId = useId();
  const id = `sel-${autoId}`;
  return (
    <div className={cn(!hideLabel && "w-full", className)}>
      <label
        htmlFor={id}
        className={cn(
          "mb-1.5 block text-xs font-semibold text-white/75",
          hideLabel && "sr-only"
        )}
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "block w-full rounded-lg bg-bg-soft/60 border border-white/10 text-white outline-none transition-colors focus:border-brand-green/60 focus:ring-2 focus:ring-brand-green/30 disabled:opacity-60 disabled:cursor-not-allowed",
          compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2.5 text-sm"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-bg-card">
            {t(o.labelKey)}
          </option>
        ))}
      </select>
    </div>
  );
}

function Pagination({ meta, onPage }: { meta: PaginationMeta; onPage: (p: number) => void }) {
  const { t } = useTranslation();
  return (
    <nav className="mt-8 flex items-center justify-center gap-3" aria-label={t("admin.pagination.ariaLabel")}>
      <Button variant="dark" size="sm" onClick={() => onPage(meta.page - 1)} disabled={meta.page <= 1}>
        {t("admin.pagination.previous")}
      </Button>
      <span className="text-sm text-white/60 tabular-nums">
        {t("admin.pagination.pageOf", { page: meta.page, totalPages: meta.totalPages })}
      </span>
      <Button
        variant="dark"
        size="sm"
        onClick={() => onPage(meta.page + 1)}
        disabled={meta.page >= meta.totalPages}
      >
        {t("admin.pagination.next")}
      </Button>
    </nav>
  );
}

function LoadingBlock({ rows }: { rows: number }) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-3" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-16 animate-pulse-soft rounded-2xl bg-bg-card ring-1 ring-white/5"
        />
      ))}
      <span className="sr-only">
        <Spinner size="sm" /> {t("admin.loadingLabel")}
      </span>
    </div>
  );
}

function ErrorBlock({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-bg-card p-10 text-center ring-1 ring-white/5">
      <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-red-500/15 text-red-400">
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
      </div>
      <h3 className="text-lg font-bold text-white">{t("admin.errorBlock.title")}</h3>
      <p className="mt-1.5 text-sm text-white/60">{t("admin.errorBlock.body")}</p>
      <div className="mt-5">
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t("admin.errorBlock.retry")}
        </Button>
      </div>
    </div>
  );
}

function EmptyBlock({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-bg-card p-10 text-center ring-1 ring-white/5">
      <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-brand-green/15 text-brand-green">
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
          <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      {hint && <p className="mt-1.5 text-sm text-white/60">{hint}</p>}
    </div>
  );
}
