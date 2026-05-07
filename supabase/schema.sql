-- ============================================================
-- 出去玩的系統 - Supabase Schema
-- 在 Supabase Dashboard > SQL Editor 執行此檔案
-- ============================================================

-- 啟用 UUID 擴充
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Table 1: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  default_name TEXT NOT NULL,
  nickname     TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 預設成員（依實際出遊人數修改）
INSERT INTO users (default_name) VALUES
  ('小明'),
  ('小華'),
  ('阿志'),
  ('小美'),
  ('大寶'),
  ('雅婷');

-- ============================================================
-- Table 2: proposals（住宿提案）
-- ============================================================
CREATE TABLE IF NOT EXISTS proposals (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  url          TEXT,
  price        NUMERIC(10, 0),
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'confirmed')),
  proposed_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Table 3: votes（投票，防止重複投票）
-- ============================================================
CREATE TABLE IF NOT EXISTS votes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proposal_id  UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, proposal_id)
);

-- ============================================================
-- Table 4: itinerary（正式行程表）
-- ============================================================
CREATE TABLE IF NOT EXISTS itinerary (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id  UUID REFERENCES proposals(id) ON DELETE SET NULL,
  date         DATE NOT NULL,
  time         TIME,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- View: proposals_with_votes（含票數的提案 View）
-- ============================================================
CREATE OR REPLACE VIEW proposals_with_votes AS
SELECT
  p.*,
  COUNT(v.id)::INT AS vote_count,
  u.default_name   AS proposer_default_name,
  COALESCE(u.nickname, u.default_name) AS proposer_display_name
FROM proposals p
LEFT JOIN votes v ON v.proposal_id = p.id
LEFT JOIN users u ON u.id = p.proposed_by
GROUP BY p.id, u.default_name, u.nickname;

-- ============================================================
-- Realtime 訂閱設定（在 Supabase Dashboard 啟用這幾張表的 Realtime）
-- Dashboard > Database > Replication > 勾選:
--   users, proposals, votes, itinerary
-- ============================================================

-- ============================================================
-- Row Level Security（如需公開存取可先關閉 RLS）
-- ============================================================
ALTER TABLE users     DISABLE ROW LEVEL SECURITY;
ALTER TABLE proposals DISABLE ROW LEVEL SECURITY;
ALTER TABLE votes     DISABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary DISABLE ROW LEVEL SECURITY;
