-- 在 Supabase SQL Editor 執行此檔案
-- 為行程表新增「標題」與「地點」欄位，支援手動新增行程

ALTER TABLE itinerary ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE itinerary ADD COLUMN IF NOT EXISTS location TEXT;
