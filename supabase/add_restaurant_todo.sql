-- 在 Supabase SQL Editor 執行此檔案

-- 1. proposals 表加 category 欄位（hotel / restaurant）
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'hotel'
    CHECK (category IN ('hotel', 'restaurant'));

-- 2. 待辦清單表
CREATE TABLE IF NOT EXISTS todos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content     TEXT NOT NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  is_done     BOOLEAN NOT NULL DEFAULT false,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE todos DISABLE ROW LEVEL SECURITY;
