/**
 * SUBSCRIPTION PLAN FEATURE GATES
 * ============================================================
 * Three tiers:  starter | business | pro
 * Each tier inherits ALL features of tiers below it.
 *
 * Features excluded per requirements:
 *   - multi_location_management (excluded from all — not in scope)
 * ============================================================
 */

const PLAN_FEATURES = {
  starter: [
    // Core POS
    "order_management",
    "menu_management",
    "table_management",
    "kitchen_bar_display",
    "cash_counter",
    "waiter_panel",
    "tax_bill_management",
    "credit_payments",
    "dark_light_mode",
    // Reports
    "daily_sales_report",
    // Always-on
    "notifications",       // basic system notifications (subscription alerts)
    // Support
    "customer_care_support",
  ],

  business: [
    // Everything in starter
    "order_management",
    "menu_management",
    "table_management",
    "kitchen_bar_display",
    "cash_counter",
    "waiter_panel",
    "tax_bill_management",
    "credit_payments",
    "dark_light_mode",
    "daily_sales_report",
    "notifications",
    "customer_care_support",
    // Business-exclusive additions
    "whatsapp_billing",
    "daily_specials",
    "staff_attendance",
    "in_app_notifications",
    "table_reservations",
    "bar_kitchen_routing",
    "special_requests",
    "expense_tracking",
    "income_expenditure_pl",
    "insights_analytics",
    "best_sellers_view",
    "stock_comparison",
  ],

  pro: [
    // Everything in business
    "order_management",
    "menu_management",
    "table_management",
    "kitchen_bar_display",
    "cash_counter",
    "waiter_panel",
    "tax_bill_management",
    "credit_payments",
    "dark_light_mode",
    "daily_sales_report",
    "notifications",
    "customer_care_support",
    "daily_specials",
    "staff_attendance",
    "in_app_notifications",
    "table_reservations",
    "bar_kitchen_routing",
    "special_requests",
    "expense_tracking",
    "income_expenditure_pl",
    "insights_analytics",
    "best_sellers_view",
    "stock_comparison",
    // Pro-exclusive additions
    "whatsapp_billing",
    "inventory_management",
    "daily_stock_log",
    "inventory_auto_sync",
    "waste_log_tracking",
    // Support
    "priority_support",
  ],
};

/**
 * PLAN LIMITS
 * ============================================================
 * max_tables : maximum number of tables allowed
 * max_users  : maximum number of staff users (non-admin) allowed
 * max_dishes : maximum number of menu items allowed
 * null       : unlimited
 * ============================================================
 */
const PLAN_LIMITS = {
  starter:  { max_tables: 25,   max_users: 6,    max_dishes: 600  },
  business: { max_tables: 50,   max_users: 25,   max_dishes: 1000 },
  pro:      { max_tables: null, max_users: null,  max_dishes: null },
};

/**
 * Returns the feature list for a given plan.
 * Falls back to 'starter' if plan is unknown.
 */
function getFeaturesForPlan(plan) {
  return PLAN_FEATURES[plan] || PLAN_FEATURES["starter"];
}

/**
 * Checks if a plan has a specific feature.
 */
function planHasFeature(plan, feature) {
  return getFeaturesForPlan(plan).includes(feature);
}

/**
 * Returns the limits for a given plan.
 * Falls back to 'starter' if plan is unknown.
 */
function getLimitsForPlan(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS["starter"];
}

/**
 * Express middleware: requires that the restaurant's plan includes
 * the specified feature.  Must be used AFTER authMiddleware.
 *
 * Usage:
 *   router.get("/inventory", authMiddleware, requireFeature("inventory_management"), handler)
 */
function requireFeature(feature) {
  return async (req, res, next) => {
    // Superadmin bypasses all feature gates
    if (req.user?.role === "superadmin") return next();

    const rid = req.user?.restaurant_id;
    if (!rid) return res.status(403).json({ msg: "No restaurant associated" });

    try {
      const pool = require("./db");
      const result = await pool.query(
        "SELECT subscription_plan FROM restaurants WHERE id=$1",
        [rid]
      );
      if (!result.rows.length) return res.status(404).json({ msg: "Restaurant not found" });

      const plan = result.rows[0].subscription_plan || "starter";
      if (!planHasFeature(plan, feature)) {
        return res.status(403).json({
          msg: `This feature (${feature}) is not available on your current plan (${plan}). Please upgrade.`,
          feature_locked: true,
          required_feature: feature,
          current_plan: plan,
        });
      }
      next();
    } catch (err) {
      console.error("Feature gate error:", err.message);
      res.status(500).json({ msg: "Server error during feature check" });
    }
  };
}

module.exports = { PLAN_FEATURES, PLAN_LIMITS, getFeaturesForPlan, planHasFeature, getLimitsForPlan, requireFeature };