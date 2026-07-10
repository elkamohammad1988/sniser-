/**
 * In-memory access-token store. The token is deliberately NOT persisted to
 * localStorage — the long-lived refresh token lives in an httpOnly cookie the
 * client can't read, and the short-lived access token is rehydrated on load
 * via a silent `/auth/refresh`. This keeps tokens out of reach of XSS.
 */

type RefreshHandler = () => Promise<string | null>;

let accessToken: string | null = null;
let refreshHandler: RefreshHandler | null = null;
let inFlight: Promise<string | null> | null = null;

export const authToken = {
  get(): string | null {
    return accessToken;
  },
  set(token: string | null): void {
    accessToken = token;
  },
  clear(): void {
    accessToken = null;
  },
  /** Registered by the session provider so the API client can silently refresh. */
  setRefreshHandler(fn: RefreshHandler | null): void {
    refreshHandler = fn;
  },
  /** De-duplicated refresh — concurrent 401s trigger a single network refresh. */
  async refresh(): Promise<string | null> {
    if (!refreshHandler) return null;
    if (!inFlight) {
      inFlight = refreshHandler().finally(() => {
        inFlight = null;
      });
    }
    return inFlight;
  },
};
