import { FormEvent, useEffect, useState } from "react";
import Modal from "../Modal";
import Button from "../Button";
import { useToast } from "../ToastProvider";
import { useSession } from "../SessionProvider";
import { endpoints } from "../../../lib/api/endpoints";
import { ApiClientError } from "../../../lib/api/client";
import { cn } from "../../../utils/cn";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PRESETS = [25, 50, 100, 250];

/**
 * Adds funds to the user's custodial Sniser wallet. Real deposit — hits the
 * wallet API, then refreshes the session balance so every surface updates.
 */
export default function TopUpModal({ open, onClose }: Props) {
  const toast = useToast();
  const { wallet, refreshWallet } = useSession();
  const [amount, setAmount] = useState<number>(50);
  const [custom, setCustom] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setAmount(50);
      setCustom("");
      setSubmitting(false);
    }
  }, [open]);

  const effective = custom ? Number(custom) : amount;
  const valid = Number.isFinite(effective) && effective > 0 && effective <= 10_000;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid) {
      toast.error("Enter a valid amount", "Between 1 and 10,000 USDC.");
      return;
    }
    setSubmitting(true);
    try {
      await endpoints.wallet.deposit(effective);
      await refreshWallet();
      toast.success("Wallet topped up", `${effective.toFixed(2)} USDC added to your balance.`);
      onClose();
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Please try again.";
      toast.error("Top-up failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add funds"
      description="Top up your Sniser wallet to buy access passes instantly."
      size="md"
    >
      <div className="mb-5 flex items-center justify-between rounded-xl bg-bg-soft/60 p-3 ring-1 ring-white/10">
        <span className="text-xs text-white/55">Current balance</span>
        <span className="text-sm font-bold text-white tabular-nums">
          {wallet ? `${wallet.balance.toFixed(2)} ${wallet.currency}` : "—"}
        </span>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
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

        <div>
          <label htmlFor="topup-custom" className="mb-1.5 block text-xs font-semibold text-white/75">
            Or enter a custom amount (USDC)
          </label>
          <input
            id="topup-custom"
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

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="dark" size="md" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" fullWidth isLoading={submitting} loadingText="Adding…">
            Add ${valid ? effective.toFixed(2) : "0.00"}
          </Button>
        </div>
      </form>

      <p className="mt-4 text-center text-[11px] text-white/40">
        Demo funds — top-ups are simulated custodial credit, not a real charge.
      </p>
    </Modal>
  );
}
