import { Link } from "react-router-dom";
import { useSession } from "./SessionProvider";
import { cn } from "../../utils/cn";

/**
 * Compact wallet balance badge for the navbar. Shows the custodial wallet
 * balance and links to the full wallet page. Only renders once a session with a
 * wallet is loaded.
 */
export default function WalletPill({ className }: { className?: string }) {
  const { wallet } = useSession();
  if (!wallet) return null;

  return (
    <Link
      to="/wallet"
      aria-label={`Wallet balance ${wallet.balance.toFixed(2)} ${wallet.currency}`}
      title="Open wallet"
      className={cn(
        "group inline-flex items-center gap-2 rounded-full bg-bg-card ring-1 ring-white/10 px-3 py-1 transition-all duration-150 hover:ring-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green",
        className
      )}
    >
      <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-green/15 text-brand-green" aria-hidden="true">
        <span className="h-2 w-2 rounded-full bg-brand-green animate-pulse-soft" />
      </span>
      <span className="text-[11px] font-bold text-white tabular-nums">
        {wallet.balance.toFixed(2)}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
        {wallet.currency}
      </span>
    </Link>
  );
}
