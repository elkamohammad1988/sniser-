import { FormEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Section from "../components/layout/Section";
import SectionHeading from "../components/shared/SectionHeading";
import Button from "../components/shared/Button";
import Spinner from "../components/shared/Spinner";
import { useToast } from "../components/shared/ToastProvider";
import { useSession, shortAddress } from "../components/shared/SessionProvider";
import { usePageMeta } from "../hooks/usePageMeta";
import { endpoints } from "../lib/api/endpoints";
import { ApiClientError } from "../lib/api/client";
import type { WalletTx } from "../lib/api/types";
import { cn } from "../utils/cn";

const PRESETS = [25, 50, 100, 250];

// `label` holds an i18n key string — resolve with `t(...)` at the render site.
const TX_META: Record<WalletTx["type"], { label: string; positive: boolean }> = {
  deposit: { label: "wallet.txType.deposit", positive: true },
  sale: { label: "wallet.txType.sale", positive: true },
  refund: { label: "wallet.txType.refund", positive: true },
  payout: { label: "wallet.txType.payout", positive: false },
  purchase: { label: "wallet.txType.purchase", positive: false },
  fee: { label: "wallet.txType.fee", positive: false },
};

export default function WalletPage() {
  const { t } = useTranslation();
  usePageMeta({
    title: t("wallet.meta.title"),
    description: t("wallet.meta.description"),
    canonicalPath: "/wallet",
  });

  const toast = useToast();
  const { wallet, refreshWallet } = useSession();
  const [txns, setTxns] = useState<WalletTx[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [amount, setAmount] = useState(50);
  const [custom, setCustom] = useState("");
  const [depositing, setDepositing] = useState(false);

  // Guards against state updates after unmount if a request is still in flight.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadTx = () => {
    setStatus("loading");
    endpoints.wallet
      .transactions()
      .then((res) => {
        if (!mountedRef.current) return;
        setTxns(res.transactions);
        setStatus("success");
      })
      .catch(() => {
        if (mountedRef.current) setStatus("error");
      });
  };

  useEffect(() => {
    loadTx();
    void refreshWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const effective = custom ? Number(custom) : amount;
  const valid = Number.isFinite(effective) && effective > 0 && effective <= 10_000;

  const onDeposit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid) {
      toast.error(t("wallet.toast.invalidTitle"), t("wallet.toast.invalidBody"));
      return;
    }
    setDepositing(true);
    try {
      await endpoints.wallet.deposit(effective);
      await refreshWallet();
      loadTx();
      setCustom("");
      toast.success(t("wallet.toast.toppedUpTitle"), t("wallet.toast.addedBody", { amount: effective.toFixed(2) }));
    } catch (err) {
      toast.error(t("wallet.toast.failedTitle"), err instanceof ApiClientError ? err.message : t("wallet.toast.tryAgain"));
    } finally {
      setDepositing(false);
    }
  };

  return (
    <>
      <Section tone="dark" spacing="md">
        <SectionHeading eyebrow={t("wallet.eyebrow")} align="left" className="max-w-2xl">
          {t("wallet.heading")}
        </SectionHeading>
        <p className="mt-3 max-w-2xl text-sm sm:text-base text-white/65 text-pretty">
          {t("wallet.subtitle")}
        </p>
      </Section>

      <Section tone="dark" spacing="sm">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          {/* Balance + top-up */}
          <div className="space-y-5">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-green/20 via-bg-card to-bg-card p-6 ring-1 ring-white/10">
              <p className="text-[11px] font-semibold uppercase tracking-widestPlus text-white/50">{t("wallet.balance")}</p>
              <p className="mt-2 text-4xl font-extrabold text-white tabular-nums">
                {wallet ? wallet.balance.toFixed(2) : "—"}
                <span className="ml-2 text-base font-bold text-white/50">{wallet?.currency ?? "USDC"}</span>
              </p>
              {wallet && (
                <p className="mt-4 font-mono text-xs text-white/45" title={wallet.address}>
                  {shortAddress(wallet.address)}
                </p>
              )}
            </div>

            <form onSubmit={onDeposit} className="rounded-2xl bg-bg-card p-6 ring-1 ring-white/5">
              <h2 className="text-sm font-bold uppercase tracking-widestPlus text-white">{t("wallet.addFunds")}</h2>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {PRESETS.map((p) => {
                  const active = !custom && amount === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setAmount(p);
                        setCustom("");
                      }}
                      className={cn(
                        "rounded-lg px-2 py-2.5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green",
                        active
                          ? "bg-brand-green text-bg"
                          : "bg-bg-soft/60 text-white/75 ring-1 ring-white/10 hover:text-white hover:ring-white/25"
                      )}
                    >
                      ${p}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3">
                <label htmlFor="wallet-custom" className="mb-1.5 block text-xs font-semibold text-white/75">
                  {t("wallet.customAmount")}
                </label>
                <input
                  id="wallet-custom"
                  type="number"
                  min={1}
                  max={10000}
                  step="1"
                  inputMode="decimal"
                  placeholder="e.g. 75"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  className="block w-full rounded-lg bg-bg-soft/60 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition-all focus:border-brand-green/60 focus:ring-2 focus:ring-brand-green/30"
                />
              </div>
              <div className="mt-4">
                <Button type="submit" variant="primary" size="md" fullWidth isLoading={depositing} loadingText={t("wallet.adding")}>
                  {t("wallet.addAmount", { amount: valid ? effective.toFixed(2) : "0.00" })}
                </Button>
              </div>
              <p className="mt-3 text-center text-[11px] text-white/40">
                {t("wallet.demoNote")}
              </p>
            </form>
          </div>

          {/* Transactions */}
          <div className="rounded-2xl bg-bg-card p-6 ring-1 ring-white/5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widestPlus text-white">{t("wallet.transactions")}</h2>
              <button
                type="button"
                onClick={loadTx}
                className="text-xs font-semibold text-white/55 hover:text-brand-green focus-visible:outline-none focus-visible:text-brand-green"
              >
                {t("wallet.refresh")}
              </button>
            </div>

            <div className="mt-4">
              {status === "loading" && (
                <div className="flex min-h-[12rem] items-center justify-center">
                  <Spinner size="lg" className="text-brand-green" />
                </div>
              )}

              {status === "error" && (
                <div className="py-10 text-center">
                  <p className="text-sm text-white/60">{t("wallet.tx.errorBody")}</p>
                  <div className="mt-3">
                    <Button variant="outline" size="sm" onClick={loadTx}>{t("wallet.tx.retry")}</Button>
                  </div>
                </div>
              )}

              {status === "success" && txns.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-sm font-semibold text-white">{t("wallet.tx.emptyTitle")}</p>
                  <p className="mt-1 text-xs text-white/55">{t("wallet.tx.emptyBody")}</p>
                </div>
              )}

              {status === "success" && txns.length > 0 && (
                <ul className="divide-y divide-white/5">
                  {txns.map((tx) => {
                    const meta = TX_META[tx.type];
                    const positive = tx.amount >= 0;
                    return (
                      <li key={tx.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{tx.description}</p>
                          <p className="mt-0.5 text-[11px] text-white/45">
                            {t(meta.label)} · {new Date(tx.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className={cn("text-sm font-bold tabular-nums", positive ? "text-brand-green" : "text-white")}>
                            {positive ? "+" : ""}
                            {tx.amount.toFixed(2)}
                          </p>
                          <p className="text-[11px] text-white/40 tabular-nums">{t("wallet.tx.balanceAfter", { amount: tx.balanceAfter.toFixed(2) })}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
