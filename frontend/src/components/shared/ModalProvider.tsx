import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import AuthModal, { AuthMode } from "./modals/AuthModal";
import TopUpModal from "./modals/TopUpModal";
import AdvertiseModal from "./modals/AdvertiseModal";
import PurchaseConfirmModal from "./modals/PurchaseConfirmModal";
import type { CatalogItem } from "../../lib/api/types";

type ModalKey = "auth" | "wallet" | "advertise" | "purchase" | null;

interface AuthOptions {
  mode?: AuthMode;
}

interface ModalContextValue {
  openAuth: (opts?: AuthOptions) => void;
  openWallet: () => void;
  openAdvertise: () => void;
  openPurchase: (item: CatalogItem) => void;
  close: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

/**
 * Single mount-point for all global modals. Components anywhere in the tree
 * call `useModal().openAuth({ mode: "signup" })` and the right modal opens —
 * no prop-drilling, one source of truth for which modal is visible.
 */
export function ModalProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ModalKey>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [purchaseItem, setPurchaseItem] = useState<CatalogItem | null>(null);

  const close = useCallback(() => setActive(null), []);

  const value = useMemo<ModalContextValue>(
    () => ({
      openAuth: ({ mode = "login" } = {}) => {
        setAuthMode(mode);
        setActive("auth");
      },
      openWallet: () => setActive("wallet"),
      openAdvertise: () => setActive("advertise"),
      openPurchase: (item) => {
        setPurchaseItem(item);
        setActive("purchase");
      },
      close,
    }),
    [close]
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      <AuthModal open={active === "auth"} onClose={close} initialMode={authMode} />
      <TopUpModal open={active === "wallet"} onClose={close} />
      <AdvertiseModal open={active === "advertise"} onClose={close} />
      <PurchaseConfirmModal open={active === "purchase"} onClose={close} item={purchaseItem} />
    </ModalContext.Provider>
  );
}

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used inside <ModalProvider>");
  return ctx;
}
