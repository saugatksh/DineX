const express = require("express");
const cors = require("cors");
const app = express();
const pool = require("./config/db");

app.use(cors());
app.use(express.json({ limit: "10mb" })); // large for base64 logos

app.use("/api/auth",        require("./routes/authRoutes"));
app.use("/api/admin",       require("./routes/adminRoutes"));
app.use("/api/super-admin", require("./routes/superAdminRoutes"));
app.use("/api/tables",      require("./routes/tableRoutes"));
app.use("/api/menu",        require("./routes/menuRoutes"));
app.use("/api/inventory",   require("./routes/inventoryRoutes"));
app.use("/api/orders",      require("./routes/orderRoutes"));
app.use("/api/credits",     require("./routes/creditRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/extras",      require("./routes/extrasRoutes"));
app.use("/api/stock-log",   require("./routes/stockLogRoutes"));

// ─── RESERVATION NO-SHOW CHECKER ────────────────────────────────────────────
// Every 60 s: find reserved tables where reservation_time + 1 hour has passed
// and the table is still 'reserved' (no one showed up). Auto-release the table
// to 'available' and fire a notification for admin + cash counter.
async function checkReservationNoShows() {
  try {
    const expired = await pool.query(`
      SELECT t.id, t.table_number, t.table_label, t.table_section,
             t.reserved_by_name, t.reserved_by_phone, t.reservation_time,
             t.restaurant_id
      FROM tables t
      WHERE t.status = 'reserved'
        AND t.reservation_time IS NOT NULL
        AND t.reservation_time + INTERVAL '1 hour' < NOW()
    `);

    for (const table of expired.rows) {
      // Release the table
      await pool.query(
        `UPDATE tables
         SET status = 'available',
             reserved_by_name  = NULL,
             reserved_by_phone = NULL,
             reservation_time  = NULL
         WHERE id = $1`,
        [table.id]
      );

      const label = table.table_label || `Table ${table.table_number}`;
      const section = table.table_section && table.table_section !== "Main"
        ? ` (${table.table_section})` : "";
      const resTime = new Date(table.reservation_time).toLocaleString("en-US", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
      });
      const msg = `${label}${section} reserved for ${table.reserved_by_name} (${table.reserved_by_phone}) at ${resTime} — no-show. Table auto-released to available.`;

      // Avoid duplicate notifications within 2 hours
      const dup = await pool.query(
        `SELECT id FROM notifications
         WHERE restaurant_id = $1 AND type = 'reservation_noshow'
           AND message LIKE $2
           AND created_at > NOW() - INTERVAL '2 hours'`,
        [table.restaurant_id, `%${table.reserved_by_phone}%`]
      );
      if (dup.rows.length > 0) continue;

      // Insert notification (visible to admin via /api/notifications)
      await pool.query(
        `INSERT INTO notifications (restaurant_id, type, title, message, reference_id)
         VALUES ($1, 'reservation_noshow', '🚫 Reservation No-Show', $2, $3)`,
        [table.restaurant_id, msg, table.id]
      );

      console.log(`[DineX] No-show auto-release: ${label} (restaurant ${table.restaurant_id})`);
    }
  } catch (err) {
    console.error("[DineX] Reservation no-show checker error:", err.message);
  }
}

// Run immediately on boot, then every 60 seconds
checkReservationNoShows();
setInterval(checkReservationNoShows, 60 * 1000);
// ─────────────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`DineX server running on port ${PORT}`));