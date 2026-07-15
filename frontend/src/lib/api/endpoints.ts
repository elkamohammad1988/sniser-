import { api, request, requestPage } from "./client";
import type {
  SessionDto,
  AuthUser,
  WalletSummary,
  WalletTx,
  CatalogItem,
  CatalogDetail,
  CategorySummary,
  PurchaseItem,
  ResaleListing,
  ArtistProfile,
  ArtistRelease,
  ArtistDashboard,
  PublicArtist,
  NotificationItem,
  AdminStats,
  AdminUser,
  AdminTicket,
  AuditEntry,
  ContactReceipt,
  SortKey,
  CatalogCategory,
} from "./types";

export interface HealthStatus {
  status: "ok";
  uptimeSeconds: number;
  timestamp: string;
  version: string;
  environment: string;
}

export interface SignupBody {
  name: string;
  email: string;
  password: string;
}
export interface LoginBody {
  email: string;
  password: string;
}
export interface ContactBody {
  name: string;
  email: string;
  topic: "advertise" | "support" | "press" | "general";
  message: string;
  website?: string;
}

export interface CatalogListParams {
  category?: CatalogCategory | "all";
  sort?: SortKey;
  q?: string;
  page?: number;
  pageSize?: number;
}

function qs(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") search.set(k, String(v));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

const AUTH_ONLY = { skipRefresh: true } as const;

/** Typed endpoint registry. One function per backend resource. */
export const endpoints = {
  health: {
    get: () => api.get<HealthStatus>("/health"),
    getVerbose: () => api.get<HealthStatus>("/health?verbose=true"),
  },

  auth: {
    signup: (body: SignupBody) => api.post<SessionDto>("/auth/signup", body, AUTH_ONLY),
    login: (body: LoginBody) => api.post<SessionDto>("/auth/login", body, AUTH_ONLY),
    logout: () => api.post<{ ok: boolean }>("/auth/logout", undefined, AUTH_ONLY),
    refresh: () => api.post<SessionDto>("/auth/refresh", undefined, AUTH_ONLY),
    me: () => api.get<{ user: AuthUser }>("/auth/me"),
    verifyEmail: (token: string) => api.post<{ user: AuthUser }>("/auth/verify-email", { token }, AUTH_ONLY),
    resendVerification: () => api.post<{ ok: boolean }>("/auth/resend-verification"),
    forgotPassword: (email: string) =>
      api.post<{ ok: boolean }>("/auth/forgot-password", { email }, AUTH_ONLY),
    resetPassword: (token: string, password: string) =>
      api.post<{ ok: boolean }>("/auth/reset-password", { token, password }, AUTH_ONLY),
    changePassword: (currentPassword: string, newPassword: string) =>
      api.post<{ ok: boolean }>("/auth/change-password", { currentPassword, newPassword }),
  },

  users: {
    me: () => api.get<{ user: AuthUser; isArtist: boolean }>("/users/me"),
    updateProfile: (form: FormData) => api.patchForm<{ user: AuthUser }>("/users/me", form),
  },

  catalog: {
    list: (params: CatalogListParams = {}) =>
      requestPage<CatalogItem[]>(
        `/catalog${qs({
          category: params.category,
          sort: params.sort,
          q: params.q,
          page: params.page,
          pageSize: params.pageSize,
        })}`
      ),
    detail: (slug: string) => api.get<{ item: CatalogDetail }>(`/catalog/${encodeURIComponent(slug)}`),
    categories: () => api.get<{ categories: CategorySummary[] }>("/catalog/categories"),
    trending: () => api.get<{ items: CatalogItem[] }>("/catalog/trending"),
  },

  wallet: {
    summary: () => api.get<{ wallet: WalletSummary }>("/wallet"),
    transactions: () => api.get<{ transactions: WalletTx[] }>("/wallet/transactions"),
    deposit: (amount: number) => api.post<{ wallet: WalletSummary }>("/wallet/deposit", { amount }),
  },

  purchases: {
    library: () => api.get<{ items: PurchaseItem[] }>("/purchases"),
    create: (contentId: string) =>
      api.post<{ purchase: PurchaseItem; balance: number }>("/purchases", { contentId }),
    access: (contentId: string) =>
      api.get<{
        access: {
          contentId: string;
          title: string;
          mediaUrl: string | null;
          category: string;
          kind: "video" | "audio" | "download";
        };
      }>(`/purchases/${contentId}/access`),
  },

  resale: {
    mine: () => api.get<{ listings: ResaleListing[] }>("/resale/mine"),
    create: (purchaseId: string, price: number) =>
      api.post<{ listing: ResaleListing }>("/resale", { purchaseId, price }),
    cancel: (id: string) => api.delete<null>(`/resale/${id}`),
    buy: (id: string) => api.post<{ purchaseId: string; balance: number }>(`/resale/${id}/buy`),
  },

  artists: {
    apply: (body: { handle: string; displayName: string; bio?: string; location?: string }) =>
      api.post<{ artist: ArtistProfile }>("/artists/apply", body),
    me: () => api.get<{ artist: ArtistProfile }>("/artists/me"),
    updateProfile: (form: FormData) => api.patchForm<{ artist: ArtistProfile }>("/artists/me", form),
    dashboard: () => api.get<{ stats: ArtistDashboard }>("/artists/me/dashboard"),
    releases: (params: { status?: string; page?: number; pageSize?: number } = {}) =>
      requestPage<ArtistRelease[]>(
        `/artists/me/releases${qs({ status: params.status, page: params.page, pageSize: params.pageSize })}`
      ),
    createRelease: (form: FormData) =>
      api.postForm<{ release: ArtistRelease }>("/artists/me/releases", form),
    updateRelease: (id: string, form: FormData) =>
      api.patchForm<{ release: ArtistRelease }>(`/artists/me/releases/${id}`, form),
    setStatus: (id: string, status: "published" | "draft" | "archived") =>
      api.post<{ release: ArtistRelease }>(`/artists/me/releases/${id}/status`, { status }),
    deleteRelease: (id: string) => api.delete<null>(`/artists/me/releases/${id}`),
    publicProfile: (handle: string) =>
      api.get<{ artist: PublicArtist }>(`/artists/${encodeURIComponent(handle)}`),
  },

  contact: {
    submit: (body: ContactBody) => api.post<ContactReceipt>("/contact", body),
  },

  notifications: {
    list: () => api.get<{ notifications: NotificationItem[]; unread: number }>("/notifications"),
    markRead: (ids?: string[]) =>
      api.post<{ updated: number; unread: number }>("/notifications/read", { ids }),
  },

  admin: {
    stats: () => api.get<{ stats: AdminStats }>("/admin/stats"),
    users: (params: { role?: string; status?: string; q?: string; page?: number } = {}) =>
      requestPage<AdminUser[]>(
        `/admin/users${qs({ role: params.role, status: params.status, q: params.q, page: params.page })}`
      ),
    updateUser: (id: string, patch: { role?: string; status?: string }) =>
      api.patch<{ user: { id: string; role: string; status: string } }>(`/admin/users/${id}`, patch),
    tickets: (params: { status?: string; page?: number } = {}) =>
      requestPage<AdminTicket[]>(`/admin/tickets${qs({ status: params.status, page: params.page })}`),
    updateTicket: (id: string, status: string) =>
      api.patch<{ ticket: { id: string; status: string } }>(`/admin/tickets/${id}`, { status }),
    audit: (params: { action?: string; page?: number } = {}) =>
      requestPage<AuditEntry[]>(`/admin/audit${qs({ action: params.action, page: params.page })}`),
  },
} as const;

// re-export for consumers
export { request, requestPage };
export type Endpoints = typeof endpoints;
