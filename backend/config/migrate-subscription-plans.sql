-- ============================================================
-- SUBSCRIPTION PLAN MIGRATION
-- Adds plan tier to restaurants table
-- Run once on existing databases
-- ============================================================

-- Add subscription_plan column (starter | business | pro)
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20) DEFAULT 'starter'
    CHECK (subscription_plan IN ('starter', 'business', 'pro'));

-- Backfill existing restaurants with 'starter' plan
UPDATE restaurants
  SET subscription_plan = 'starter'
  WHERE subscription_plan IS NULL;

-- ============================================================
-- PLAN FEATURE MATRIX (for reference)
-- ============================================================
-- STARTER (Basic):
--   Core POS: order_management, menu_management, table_management,
--             kitchen_bar_display, cash_counter, waiter_panel,
--             tax_bill_management, credit_payments, dark_light_mode
--   Reports:  daily_sales_report
--
-- BUSINESS (Standard) — everything in Starter PLUS:
--   daily_specials, staff_attendance, in_app_notifications,
--   table_reservations, bar_kitchen_routing, special_requests,
--   inventory_management, daily_stock_log, expense_tracking,
--   income_expenditure_pl
--
-- PRO (Premium) — everything in Business PLUS:
--   insights_analytics, best_sellers_view, stock_comparison,
--   inventory_auto_sync, waste_log_tracking
-- ============================================================
