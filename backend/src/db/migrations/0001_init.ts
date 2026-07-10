/**
 * Initial schema for the Sniser platform.
 *
 * Money is stored as integer cents (never floats). Timestamps are ISO-8601
 * strings in UTC. Every relationship is enforced with a foreign key; every
 * hot query path has a supporting index.
 */
export const id = "0001_init";

export const up = /* sql */ `
--------------------------------------------------------------------------------
-- Users & identity
--------------------------------------------------------------------------------
CREATE TABLE users (
  id             TEXT PRIMARY KEY,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  name           TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'viewer'
                   CHECK (role IN ('viewer', 'artist', 'admin')),
  status         TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'suspended')),
  email_verified INTEGER NOT NULL DEFAULT 0 CHECK (email_verified IN (0, 1)),
  avatar_url     TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);
CREATE INDEX idx_users_role ON users (role);

-- Opaque refresh tokens (only the hash is stored). Enables rotation + revoke.
CREATE TABLE refresh_tokens (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TEXT NOT NULL,
  revoked_at  TEXT,
  user_agent  TEXT,
  ip          TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX idx_refresh_user ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_expires ON refresh_tokens (expires_at);

-- Single-use email tokens for verification + password reset (hashed).
CREATE TABLE email_tokens (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('verify_email', 'password_reset')),
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TEXT NOT NULL,
  used_at     TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX idx_email_tokens_user ON email_tokens (user_id, type);

--------------------------------------------------------------------------------
-- Artists & catalog
--------------------------------------------------------------------------------
CREATE TABLE artist_profiles (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  handle        TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  bio           TEXT,
  avatar_url    TEXT,
  location      TEXT,
  verified      INTEGER NOT NULL DEFAULT 0 CHECK (verified IN (0, 1)),
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE TABLE content (
  id            TEXT PRIMARY KEY,
  artist_id     TEXT NOT NULL REFERENCES artist_profiles (id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  category      TEXT NOT NULL CHECK (category IN ('video', 'audio', 'original')),
  description   TEXT,
  price_cents   INTEGER NOT NULL CHECK (price_cents >= 0),
  currency      TEXT NOT NULL DEFAULT 'USDC',
  cover_url     TEXT,
  media_url     TEXT,
  duration_sec  INTEGER NOT NULL DEFAULT 0 CHECK (duration_sec >= 0),
  supply        INTEGER CHECK (supply IS NULL OR supply > 0),
  status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'published', 'archived')),
  plays         INTEGER NOT NULL DEFAULT 0 CHECK (plays >= 0),
  released_at   TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
CREATE INDEX idx_content_status ON content (status);
CREATE INDEX idx_content_category ON content (category);
CREATE INDEX idx_content_artist ON content (artist_id);
CREATE INDEX idx_content_released ON content (released_at);

CREATE TABLE tags (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL UNIQUE
);

CREATE TABLE content_tags (
  content_id  TEXT NOT NULL REFERENCES content (id) ON DELETE CASCADE,
  tag_id      INTEGER NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, tag_id)
);
CREATE INDEX idx_content_tags_tag ON content_tags (tag_id);

--------------------------------------------------------------------------------
-- Wallets & ledger
--------------------------------------------------------------------------------
CREATE TABLE wallets (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  balance_cents  INTEGER NOT NULL DEFAULT 0 CHECK (balance_cents >= 0),
  currency       TEXT NOT NULL DEFAULT 'USDC',
  address        TEXT NOT NULL UNIQUE,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);

-- Append-only double-checked ledger. balance_after_cents snapshots the running
-- balance so the history is auditable independent of the wallet row.
CREATE TABLE wallet_transactions (
  id                  TEXT PRIMARY KEY,
  wallet_id           TEXT NOT NULL REFERENCES wallets (id) ON DELETE CASCADE,
  type                TEXT NOT NULL
                        CHECK (type IN ('deposit', 'purchase', 'sale', 'fee', 'refund', 'payout')),
  amount_cents        INTEGER NOT NULL,
  balance_after_cents INTEGER NOT NULL CHECK (balance_after_cents >= 0),
  reference_type      TEXT,
  reference_id        TEXT,
  description         TEXT NOT NULL,
  created_at          TEXT NOT NULL
);
CREATE INDEX idx_wallet_tx_wallet ON wallet_transactions (wallet_id, created_at);

--------------------------------------------------------------------------------
-- Purchases & resale
--------------------------------------------------------------------------------
CREATE TABLE purchases (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  content_id        TEXT NOT NULL REFERENCES content (id) ON DELETE CASCADE,
  price_cents       INTEGER NOT NULL CHECK (price_cents >= 0),
  fee_cents         INTEGER NOT NULL DEFAULT 0 CHECK (fee_cents >= 0),
  acquired_via      TEXT NOT NULL DEFAULT 'primary'
                      CHECK (acquired_via IN ('primary', 'resale')),
  status            TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'listed', 'resold', 'refunded')),
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);
CREATE INDEX idx_purchases_user ON purchases (user_id, status);
CREATE INDEX idx_purchases_content ON purchases (content_id);
-- A user may hold at most one active/listed pass per content item.
CREATE UNIQUE INDEX uq_purchase_owner_active
  ON purchases (user_id, content_id)
  WHERE status IN ('active', 'listed');

CREATE TABLE resale_listings (
  id           TEXT PRIMARY KEY,
  purchase_id  TEXT NOT NULL UNIQUE REFERENCES purchases (id) ON DELETE CASCADE,
  seller_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  content_id   TEXT NOT NULL REFERENCES content (id) ON DELETE CASCADE,
  price_cents  INTEGER NOT NULL CHECK (price_cents > 0),
  status       TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'sold', 'cancelled')),
  buyer_id     TEXT REFERENCES users (id) ON DELETE SET NULL,
  created_at   TEXT NOT NULL,
  sold_at      TEXT
);
CREATE INDEX idx_resale_status ON resale_listings (status);
CREATE INDEX idx_resale_content ON resale_listings (content_id, status);
CREATE INDEX idx_resale_seller ON resale_listings (seller_id);

--------------------------------------------------------------------------------
-- Engagement: notifications, tickets, audit
--------------------------------------------------------------------------------
CREATE TABLE notifications (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  data        TEXT,
  read_at     TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX idx_notifications_user ON notifications (user_id, created_at);

CREATE TABLE contact_tickets (
  id          TEXT PRIMARY KEY,
  reference   TEXT NOT NULL UNIQUE,
  user_id     TEXT REFERENCES users (id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  topic       TEXT NOT NULL
                CHECK (topic IN ('advertise', 'support', 'press', 'general')),
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'in_progress', 'closed')),
  ip          TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX idx_tickets_status ON contact_tickets (status, created_at);

CREATE TABLE audit_logs (
  id           TEXT PRIMARY KEY,
  actor_id     TEXT REFERENCES users (id) ON DELETE SET NULL,
  action       TEXT NOT NULL,
  target_type  TEXT,
  target_id    TEXT,
  ip           TEXT,
  metadata     TEXT,
  created_at   TEXT NOT NULL
);
CREATE INDEX idx_audit_actor ON audit_logs (actor_id, created_at);
CREATE INDEX idx_audit_action ON audit_logs (action, created_at);
`;
