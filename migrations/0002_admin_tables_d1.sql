-- Smart Meeting by ABD Finance
-- Admin management tables (lead overrides + admin settings snapshot).
-- These mirror the runtime schema created in src/lib/system-db.ts (ensureSystemSchema),
-- so `wrangler d1 migrations apply` reproduces the full system schema deterministically.

CREATE TABLE IF NOT EXISTS admin_lead_overrides (
  lead_id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  owner TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
