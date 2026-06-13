const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireFeature } = require("../config/subscriptionPlans");

const requireStockLog = requireFeature("daily_stock_log");

// GET all stock logs for a date (default today)
router.get("/", authMiddleware, requireStockLog, async (req, res) => {
  const rid = req.user.restaurant_id;
  const { date } = req.query;
  try {
    const result = await pool.query(
      `SELECT sl.*, i.item_name as inv_item_name, i.unit as inv_unit,
              u.name as logged_by_name
       FROM daily_stock_log sl
       LEFT JOIN inventory i ON sl.inventory_id = i.id
       LEFT JOIN users u ON sl.logged_by = u.id
       WHERE sl.restaurant_id = $1 AND sl.log_date = $2
       ORDER BY sl.item_name`,
      [rid, date || new Date().toISOString().split("T")[0]]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET log dates summary (for history view)
router.get("/dates", authMiddleware, requireStockLog, async (req, res) => {
  const rid = req.user.restaurant_id;
  try {
    const result = await pool.query(
      `SELECT log_date,
              COUNT(*) as item_count,
              SUM(CASE WHEN opening_stock IS NOT NULL THEN 1 ELSE 0 END) as with_opening,
              SUM(CASE WHEN closing_stock IS NOT NULL THEN 1 ELSE 0 END) as with_closing
       FROM daily_stock_log
       WHERE restaurant_id = $1
       GROUP BY log_date
       ORDER BY log_date DESC
       LIMIT 30`,
      [rid]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET comparison: today vs yesterday for each item
router.get("/comparison", authMiddleware, requireStockLog, async (req, res) => {
  const rid = req.user.restaurant_id;
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split("T")[0];
  try {
    const result = await pool.query(
      `SELECT
         today.item_name,
         today.unit,
         today.inventory_id,
         today.log_date as today_date,
         today.opening_stock as today_opening,
         today.closing_stock as today_closing,
         today.consumption as today_consumption,
         yesterday.log_date as prev_date,
         yesterday.opening_stock as prev_opening,
         yesterday.closing_stock as prev_closing,
         yesterday.consumption as prev_consumption,
         CASE
           WHEN today.consumption IS NOT NULL AND yesterday.consumption IS NOT NULL
           THEN today.consumption - yesterday.consumption
           ELSE NULL
         END as consumption_diff
       FROM daily_stock_log today
       LEFT JOIN daily_stock_log yesterday
         ON yesterday.inventory_id = today.inventory_id
         AND yesterday.restaurant_id = today.restaurant_id
         AND yesterday.log_date = today.log_date - INTERVAL '1 day'
       WHERE today.restaurant_id = $1 AND today.log_date = $2
       ORDER BY today.item_name`,
      [rid, targetDate]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST or UPSERT a stock log entry
router.post("/", authMiddleware, requireStockLog, async (req, res) => {
  const rid = req.user.restaurant_id;
  const uid = req.user.id;
  const { inventory_id, item_name, unit, log_date, opening_stock, closing_stock, notes } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO daily_stock_log
         (restaurant_id, inventory_id, item_name, unit, log_date, opening_stock, closing_stock, notes, logged_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (restaurant_id, inventory_id, log_date)
       DO UPDATE SET
         opening_stock = COALESCE(EXCLUDED.opening_stock, daily_stock_log.opening_stock),
         closing_stock = COALESCE(EXCLUDED.closing_stock, daily_stock_log.closing_stock),
         notes = COALESCE(EXCLUDED.notes, daily_stock_log.notes),
         logged_by = EXCLUDED.logged_by,
         updated_at = NOW()
       RETURNING *`,
      [rid, inventory_id, item_name, unit || "pcs",
       log_date || new Date().toISOString().split("T")[0],
       opening_stock ?? null, closing_stock ?? null, notes || null, uid]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH a specific log entry (update opening or closing separately)
router.patch("/:id", authMiddleware, requireStockLog, async (req, res) => {
  const { opening_stock, closing_stock, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE daily_stock_log SET
         opening_stock = COALESCE($1, opening_stock),
         closing_stock = COALESCE($2, closing_stock),
         notes = COALESCE($3, notes),
         logged_by = $4,
         updated_at = NOW()
       WHERE id = $5 AND restaurant_id = $6
       RETURNING *`,
      [opening_stock ?? null, closing_stock ?? null, notes ?? null,
       req.user.id, req.params.id, req.user.restaurant_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Log not found" });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /stock-log/sync-inventory — update inventory.quantity with closing_stock for a given date
router.post("/sync-inventory", authMiddleware, requireStockLog, async (req, res) => {
  const rid = req.user.restaurant_id;
  const { log_date } = req.body;
  const date = log_date || new Date().toISOString().split("T")[0];
  try {
    const result = await pool.query(
      `UPDATE inventory i
       SET quantity = sl.closing_stock,
           updated_at = NOW()
       FROM daily_stock_log sl
       WHERE sl.inventory_id = i.id
         AND sl.restaurant_id = $1
         AND sl.log_date = $2
         AND sl.closing_stock IS NOT NULL
         AND i.restaurant_id = $1
       RETURNING i.id, i.item_name, i.quantity`,
      [rid, date]
    );
    res.json({ updated: result.rowCount, items: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;