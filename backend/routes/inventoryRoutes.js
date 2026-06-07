const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authMiddleware } = require("../middleware/authMiddleware");

router.get("/", authMiddleware, async (req, res) => {
  const rid = req.user.restaurant_id;
  try {
    const result = await pool.query("SELECT * FROM inventory WHERE restaurant_id=$1 ORDER BY item_name", [rid]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", authMiddleware, async (req, res) => {
  const rid = req.user.restaurant_id;
  try {
    const { item_name, quantity, unit, min_stock, cost_per_unit } = req.body;
    const result = await pool.query(
      "INSERT INTO inventory (item_name, quantity, unit, min_stock, cost_per_unit, restaurant_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [item_name, quantity, unit, min_stock, cost_per_unit || 0, rid]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { item_name, quantity, unit, min_stock, cost_per_unit } = req.body;
    const result = await pool.query(
      "UPDATE inventory SET item_name=$1,quantity=$2,unit=$3,min_stock=$4,cost_per_unit=$5,updated_at=NOW() WHERE id=$6 AND restaurant_id=$7 RETURNING *",
      [item_name, quantity, unit, min_stock, cost_per_unit, req.params.id, req.user.restaurant_id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await pool.query("DELETE FROM inventory WHERE id=$1 AND restaurant_id=$2",
      [req.params.id, req.user.restaurant_id]);
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Sync inventory quantities from closing stock of a given date
// Updates every inventory item whose closing_stock was logged on that date
router.post("/sync-from-closing", authMiddleware, async (req, res) => {
  const rid = req.user.restaurant_id;
  const { date } = req.body;
  const logDate = date || new Date().toISOString().split("T")[0];
  try {
    const result = await pool.query(
      `UPDATE inventory i
       SET quantity   = sl.closing_stock,
           updated_at = NOW()
       FROM daily_stock_log sl
       WHERE sl.inventory_id    = i.id
         AND sl.restaurant_id   = $1
         AND i.restaurant_id    = $1
         AND sl.log_date        = $2
         AND sl.closing_stock  IS NOT NULL
       RETURNING i.id, i.item_name, i.quantity, sl.closing_stock`,
      [rid, logDate]
    );
    res.json({ updated: result.rowCount, items: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;