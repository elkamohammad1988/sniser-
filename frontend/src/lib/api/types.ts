/** Server response envelopes — must mirror backend `utils/ApiResponse.ts`. */

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ResponseMeta {
  requestId?: string;
  timestamp?: string;
  pagination?: PaginationMeta;
  [key: string]: unknown;
}

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: ResponseMeta;
}

export interface ErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: ResponseMeta;
}

export type ApiEnvelope<T> = SuccessEnvelope<T> | ErrorEnvelope;

// ---------------------------------------------------------------------------
// Domain DTOs (mirror the backend service DTOs)
// ---------------------------------------------------------------------------

export type UserRole = "viewer" | "artist" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
  avatarUrl: string | null;
  createdAt: string;
}

export interface SessionDto {
  token: string;
  user: AuthUser;
}

export interface WalletSummary {
  address: string;
  balance: number;
  currency: string;
}

export interface WalletTx {
  id: string;
  type: "deposit" | "purchase" | "sale" | "fee" | "refund" | "payout";
  amount: number;
  balanceAfter: number;
  description: string;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
}

export type CatalogCategory = "video" | "audio" | "original" | "resale";
export type SortKey = "newest" | "popular" | "price-asc" | "price-desc";

export interface CatalogItem {
  id: string;
  slug: string;
  title: string;
  artist: string;
  artistHandle: string;
  category: CatalogCategory;
  kind: "primary" | "resale";
  listingId: string | null;
  price: number;
  currency: string;
  releasedAt: string;
  plays: number;
  durationSec: number;
  coverUrl: string | null;
  tags: string[];
}

export interface CatalogDetail {
  id: string;
  slug: string;
  title: string;
  category: "video" | "audio" | "original";
  description: string | null;
  price: number;
  currency: string;
  coverUrl: string | null;
  durationSec: number;
  supply: number | null;
  status: string;
  plays: number;
  releasedAt: string | null;
  createdAt: string;
  tags: string[];
  owned: boolean;
  artist: {
    id: string;
    handle: string;
    name: string;
    avatarUrl: string | null;
    verified: boolean;
  };
}

export interface CategorySummary {
  key: CatalogCategory;
  count: number;
}

export interface PurchaseItem {
  id: string;
  contentId: string;
  slug: string;
  title: string;
  artist: string;
  category: string;
  coverUrl: string | null;
  price: number;
  fee: number;
  currency: string;
  acquiredVia: "primary" | "resale";
  status: string;
  createdAt: string;
  listing: { id: string; price: number; status: string } | null;
}

export interface ResaleListing {
  id: string;
  contentId: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  price: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface ArtistProfile {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  verified: boolean;
  createdAt: string;
}

export interface ArtistRelease {
  id: string;
  slug: string;
  title: string;
  category: "video" | "audio" | "original";
  status: string;
  price: number;
  currency: string;
  coverUrl: string | null;
  durationSec: number;
  supply: number | null;
  plays: number;
  releasedAt: string | null;
  createdAt: string;
  tags: string[];
  sales: number;
}

export interface ArtistDashboard {
  releases: number;
  published: number;
  totalPlays: number;
  sales: number;
  revenue: number;
  walletBalance: number;
  currency: string;
}

export interface PublicArtist extends ArtistProfile {
  releases: Array<{
    id: string;
    slug: string;
    title: string;
    category: string;
    price: number;
    currency: string;
    coverUrl: string | null;
    durationSec: number;
    plays: number;
    releasedAt: string | null;
    tags: string[];
  }>;
  stats: { releases: number; totalPlays: number };
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

export interface AdminStats {
  users: { total: number; artists: number; admins: number; suspended: number };
  content: { total: number; published: number };
  sales: { count: number; grossVolume: number; currency: string };
  tickets: { open: number };
  resale: { active: number };
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: "active" | "suspended";
  emailVerified: boolean;
  purchases: number;
  createdAt: string;
}

export interface AdminTicket {
  id: string;
  reference: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  status: string;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  actorEmail: string | null;
  targetType: string | null;
  targetId: string | null;
  ip: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ContactReceipt {
  ticketId: string;
  receivedAt: string;
}
