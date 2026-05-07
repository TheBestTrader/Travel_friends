-- 在 Supabase SQL Editor 執行此檔案

-- 1. users 表加入 avatar_url 欄位
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. 建立 avatars storage bucket（公開讀取）
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. 允許所有人上傳／讀取
DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
DROP POLICY IF EXISTS "avatars public upload" ON storage.objects;
DROP POLICY IF EXISTS "avatars public update" ON storage.objects;

CREATE POLICY "avatars public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars public upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "avatars public update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars');
