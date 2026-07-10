import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../Modal";
import Button from "../Button";
import Spinner from "../Spinner";
import { useToast } from "../ToastProvider";
import { useModal } from "../ModalProvider";
import { useSession } from "../SessionProvider";
import { endpoints } from "../../../lib/api/endpoints";
import { ApiClientError } from "../../../lib/api/client";
import { CATEGORY_LABEL } from "../../../lib/catalog";
import type { CatalogItem } from "../../../lib/api/types";

interface Props {
  open: boolean;
  onClose: () => void;
  item: CatalogItem | null;
}

type Stage = "review" | "processing" | "success";

const PLATFORM_FEE_RATE = 0.025; // 2.5% — mirrors PLATFORM_FEE_BPS on the server

export default function PurchaseConfirmModal({ open, onClose, item }: Props) {
  const toast = useToast();
  const navigate = useNavigate();
  const modal = useModal();
  const { user, wallet, refreshWallet } = useSession();
  const [stage, setStage] = useState<Stage>("review");

  useEffect(() => {
    if (!open) {
      const id = window.setTimeout(() => setStage("review"), 300);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [open]);

  if (!item) return null;

  const isResale = item.kind === "resale";
  // Primary buyers pay a network fee on top; resale buyers pay the listed price.
  const fee = isResale ? 0 : +(item.price * PLATFORM_FEE_RATE).toFixed(2);
  const total = +(item.price + fee).toFixed(2);
  const insufficient = wallet ? wallet.balance < total : false;

  const confirm = async () => {
    setStage("processing");
    try {
      if (isResale && item.listingId) {
        await endpoints.resale.buy(item.listingId);
      } else {
        await endpoints.purchases.create(item.id);
      }
      await refreshWallet();
      setStage("success");
      toast.success("Access pass secured", `${item.title} is now in your library.`);
    } catch (err) {
      setStage("review");
      const apiErr = err instanceof ApiClientError ? err : null;
      const code = apiErr?.details && typeof apiErr.details === "object" ? (apiErr.details as { code?: string }).code : undefined;
      if (code === "INSUFFICIENT_FUNDS" || (apiErr?.status === 400 && /balance/i.test(apiErr.message))) {
        toast.error("Not enough balance", "Top up your wallet and try again.");
        onClose();
        modal.openWallet();
      } else if (apiErr?.status === 409) {
        toast.info("Already yours", "This pass is already in your library.");
        onClose();
      } else {
        toast.error("Purchase failed", apiErr?.message ?? "Please try again.");
      }
    }
  };

  const finish = () => {
    setStage("review");
    onClose();
    navigate("/library");
  };

  return (
    <Modal
      open={open}
      onClose={stage === "processing" ? () => undefined : onClose}
      hideClose={stage === "processing"}
      title={
        stage === "success"
          ? "Access pass added"
          : stage === "processing"
            ? "Processing payment"
            : "Confirm purchase"
      }
      description={
        stage === "success"
          ? "It lives in your wallet — stream anywhere you sign in."
          : stage === "processing"
            ? "Settling the transaction. This only takes a moment."
            : "Review the details, then confirm to secure your access pass."
      }
      size="md"
    >
      <div className="flex items-center gap-3 rounded-xl bg-bg-soft/60 p-3 ring-1 ring-white/10">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-brand-green/15 text-brand-green text-xs font-bold uppercase tracking-widestPlus">
          {CATEGORY_LABEL[item.category].slice(0, 3)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-white">{item.title}</p>
          <p className="truncate text-xs text-white/55">{item.artist}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] uppercase tracking-widestPlus text-white/40">Price</p>
          <p className="text-sm font-bold text-white">${item.price.toFixed(2)}</p>
        </div>
      </div>

      {stage === "review" && (
        <>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Item" value={`$${item.price.toFixed(2)}`} />
            {!isResale && <Row label="Network fee (2.5%)" value={`$${fee.toFixed(2)}`} subtle />}
            <div className="my-2 h-px bg-white/10" />
            <Row label="Total" value={`$${total.toFixed(2)}`} bold />
          </dl>

          <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-bg-soft/60 p-3 ring-1 ring-white/10">
              <dt className="text-white/45">Signed in as</dt>
              <dd className="mt-1 font-semibold text-white truncate">{user?.email ?? "—"}</dd>
            </div>
            <div className="rounded-lg bg-bg-soft/60 p-3 ring-1 ring-white/10">
              <dt className="text-white/45">Wallet balance</dt>
              <dd className={`mt-1 font-semibold truncate ${insufficient ? "text-red-400" : "text-white"}`}>
                {wallet ? `${wallet.balance.toFixed(2)} ${wallet.currency}` : "—"}
              </dd>
            </div>
          </dl>

          {insufficient && (
            <p className="mt-3 text-xs text-red-400">
              Your balance is too low for this purchase.
            </p>
          )}

          <div className="mt-5 flex gap-2">
            <Button variant="dark" size="md" fullWidth onClick={onClose}>
              Cancel
            </Button>
            {insufficient ? (
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={() => {
                  onClose();
                  modal.openWallet();
                }}
              >
                Top up wallet
              </Button>
            ) : (
              <Button variant="primary" size="md" fullWidth onClick={confirm}>
                Confirm · ${total.toFixed(2)}
              </Button>
            )}
          </div>
        </>
      )}

      {stage === "processing" && (
        <div className="mt-6 flex flex-col items-center text-center">
          <Spinner size="lg" className="text-brand-green" />
          <p className="mt-4 text-xs text-white/55">Don't close this window.</p>
        </div>
      )}

      {stage === "success" && (
        <div className="mt-6 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-green/15 text-brand-green">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m5 13 4 4L20 6" />
            </svg>
          </div>
          <p className="text-sm text-white/65">
            We sent a receipt to <span className="text-white">{user?.email}</span>.
          </p>
          <div className="mt-5 flex gap-2">
            <Button variant="dark" size="md" fullWidth onClick={() => { setStage("review"); onClose(); }}>
              Keep browsing
            </Button>
            <Button variant="primary" size="md" fullWidth onClick={finish}>
              Go to library
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Row({ label, value, bold, subtle }: { label: string; value: string; bold?: boolean; subtle?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={subtle ? "text-white/45" : "text-white/65"}>{label}</dt>
      <dd className={bold ? "text-base font-bold text-white" : subtle ? "text-white/55" : "text-white"}>{value}</dd>
    </div>
  );
}
