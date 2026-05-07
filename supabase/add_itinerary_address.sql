-- 在 Supabase SQL Editor 執行此檔案
-- 不影響現有資料，舊行程地址欄位為空白

ALTER TABLE itinerary ADD COLUMN IF NOT EXISTS address TEXT;
