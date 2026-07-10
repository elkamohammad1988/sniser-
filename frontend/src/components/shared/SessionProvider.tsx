import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { endpoints } from "../../lib/api/endpoints";
import { authToken } from "../../lib/api/authToken";
import type { AuthUser, WalletSummary } from "../../lib/api/types";

export type SessionUser = AuthUser;
export type SessionWallet = WalletSummary;

export type SessionStatus = "loading" | "authenticated" | "anonymous";

interface SessionState {
  status: SessionStatus;
  user: SessionUser | null;
  wallet: SessionWallet | null;
  isArtist: boolean;
}

interface SessionContextValue extends SessionState {
  login: (email: string, password: string) => Promise<SessionUser>;
  signup: (name: string, email: string, password: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
  /** Legacy alias for `logout` (fire-and-forget). */
  signOut: () => void;
  refreshWallet: () => Promise<void>;
  applyUser: (patch: Partial<SessionUser>) => void;
  setIsArtist: (v: boolean) => void;
}

const ANON: SessionState = { status: "loading", user: null, wallet: null, isArtist: false };

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Real session store, backed by the Sniser API. The access token is held in
 * memory (see `authToken`); the refresh token lives in an httpOnly cookie and
 * is used to silently rehydrate the session on load and after expiry.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(ANON);
  const bootstrapped = useRef(false);

  const loadContext = useCallback(async (user: SessionUser) => {
    // After a token is set, pull wallet + artist flag in parallel.
    const [walletRes, meRes] = await Promise.allSettled([
      endpoints.wallet.summary(),
      endpoints.users.me(),
    ]);
    const wallet = walletRes.status === "fulfilled" ? walletRes.value.wallet : null;
    const isArtist = meRes.status === "fulfilled" ? meRes.value.isArtist : false;
    const freshUser = meRes.status === "fulfilled" ? meRes.value.user : user;
    setState({ status: "authenticated", user: freshUser, wallet, isArtist });
  }, []);

  // Silent-refresh handler used by the API client on 401s.
  useEffect(() => {
    authToken.setRefreshHandler(async () => {
      try {
        const session = await endpoints.auth.refresh();
        authToken.set(session.token);
        setState((s) => ({ ...s, status: "authenticated", user: session.user }));
        return session.token;
      } catch {
        authToken.clear();
        setState({ status: "anonymous", user: null, wallet: null, isArtist: false });
        return null;
      }
    });
    return () => authToken.setRefreshHandler(null);
  }, []);

  // Bootstrap the session once on mount.
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    (async () => {
      try {
        const session = await endpoints.auth.refresh();
        authToken.set(session.token);
        await loadContext(session.user);
      } catch {
        authToken.clear();
        setState({ status: "anonymous", user: null, wallet: null, isArtist: false });
      }
    })();
  }, [loadContext]);

  const login = useCallback(
    async (email: string, password: string): Promise<SessionUser> => {
      const session = await endpoints.auth.login({ email, password });
      authToken.set(session.token);
      await loadContext(session.user);
      return session.user;
    },
    [loadContext]
  );

  const signup = useCallback(
    async (name: string, email: string, password: string): Promise<SessionUser> => {
      const session = await endpoints.auth.signup({ name, email, password });
      authToken.set(session.token);
      await loadContext(session.user);
      return session.user;
    },
    [loadContext]
  );

  const logout = useCallback(async () => {
    try {
      await endpoints.auth.logout();
    } catch {
      /* ignore — clear locally regardless */
    }
    authToken.clear();
    setState({ status: "anonymous", user: null, wallet: null, isArtist: false });
  }, []);

  const refreshWallet = useCallback(async () => {
    try {
      const { wallet } = await endpoints.wallet.summary();
      setState((s) => ({ ...s, wallet }));
    } catch {
      /* leave prior wallet in place */
    }
  }, []);

  const applyUser = useCallback((patch: Partial<SessionUser>) => {
    setState((s) => (s.user ? { ...s, user: { ...s.user, ...patch } } : s));
  }, []);

  const setIsArtist = useCallback((v: boolean) => {
    setState((s) => ({ ...s, isArtist: v }));
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      ...state,
      login,
      signup,
      logout,
      signOut: () => void logout(),
      refreshWallet,
      applyUser,
      setIsArtist,
    }),
    [state, login, signup, logout, refreshWallet, applyUser, setIsArtist]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}

/** Truncates a wallet address to a `0xab12…cd34` display string. */
export function shortAddress(address: string): string {
  if (!address) return "";
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Returns 1–2 capitalized initials from a full name, e.g. "Alex Carter" → "AC". */
export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
