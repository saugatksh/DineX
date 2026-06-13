-- ============================================================
-- MIGRATION: Fix order_items_menu_id_fkey
-- Run once on any existing database.
-- Safe to re-run.
--
-- Problem: order_items.menu_id had no ON DELETE rule (defaulted
--          to RESTRICT), blocking restaurant deletion because
--          deleting a restaurant cascades to menu, which then
--          violated this FK on order_items.
--
-- Fix: change the constraint to ON DELETE SET NULL so order
--      history is preserved (menu_id becomes NULL) when a menu
--      item or its parent restaurant is deleted.
-- ============================================================

ALTER TABLE order_items
  DROP CONSTRAINT IF EXISTS order_items_menu_id_fkey;

ALTER TABLE order_items
  ADD CONSTRAINT order_items_menu_id_fkey
  FOREIGN KEY (menu_id) REFERENCES menu(id) ON DELETE SET NULL;