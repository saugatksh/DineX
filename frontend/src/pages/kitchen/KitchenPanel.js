import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../api";

/* ─── BAR categories — anything matching these goes to Bar ─────────────────── */
// The menu.category field in DB is constrained to: 'food', 'drink', 'dessert', 'snack'
// Bar items have category = 'drink'. Everything else goes to Food station.
// We also check subcategory for flexibility.
const BAR_CATS = ["drink","drinks","beverage","beverages","bar","cocktail",
  "mocktail","juice","beer","wine","alcohol","soft drink","soft drinks"];

function isBarItem(category = "", subcategory = "") {
  const cat = (category || "").toLowerCase().trim();
  const sub = (subcategory || "").toLowerCase().trim();
  return BAR_CATS.includes(cat) || BAR_CATS.includes(sub);
}

/* ─── elapsed time ─────────────────────────────────────────────────────────── */
function timeSince(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
}

/* ─── CSS ──────────────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{--font:'Outfit',sans-serif;}
[data-theme="dark"]{
  --bg:#0b0d12;--surface:#111318;--card:#161921;--elevated:#1c1f2a;
  --border:rgba(255,255,255,0.07);--border-md:rgba(255,255,255,0.11);
  --txt:#f0eee9;--txt2:#b0aaa0;--muted:#6b6760;
  --accent:#f59e0b;--accent-bg:rgba(245,158,11,0.12);--accent-border:rgba(245,158,11,0.3);
  --bar:#38bdf8;--bar-bg:rgba(56,189,248,0.1);--bar-border:rgba(56,189,248,0.3);
  --success:#10b981;--danger:#f43f5e;--warn:#f59e0b;--info:#38bdf8;
  --info-bg:rgba(56,189,248,0.1);--info-border:rgba(56,189,248,0.3);
}
[data-theme="light"]{
  --bg:#f5f2ec;--surface:#ede9e1;--card:#fff;--elevated:#fff;
  --border:rgba(0,0,0,0.08);--border-md:rgba(0,0,0,0.13);
  --txt:#1a1714;--txt2:#5a5550;--muted:#9e9890;
  --accent:#d97706;--accent-bg:rgba(217,119,6,0.08);--accent-border:rgba(217,119,6,0.25);
  --bar:#0284c7;--bar-bg:rgba(2,132,199,0.08);--bar-border:rgba(2,132,199,0.3);
  --success:#059669;--danger:#e11d48;--warn:#d97706;--info:#0284c7;
  --info-bg:rgba(2,132,199,0.08);--info-border:rgba(2,132,199,0.25);
}
body,html{font-family:var(--font);}
@keyframes spin{to{transform:rotate(360deg);}}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.55;}}
.spin{width:22px;height:22px;border:2px solid var(--border-md);border-top-color:var(--accent);border-radius:50%;animation:spin .7s linear infinite;}
.spin-sm{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;}
.pulse{animation:pulse 1.5s ease infinite;}
.btn{display:inline-flex;align-items:center;gap:6px;font-family:var(--font);font-weight:700;font-size:13px;padding:8px 16px;border-radius:9px;cursor:pointer;border:none;transition:all .15s;line-height:1;white-space:nowrap;}
.btn:active{transform:scale(.97);}
.btn-sm{padding:6px 12px;font-size:12px;border-radius:7px;}
.btn-ghost{background:transparent;color:var(--txt2);border:1px solid transparent;}
.btn-ghost:hover{background:var(--elevated);}
.btn-outline{background:transparent;color:var(--txt2);border:1px solid var(--border-md);}
.btn-outline:hover{background:var(--elevated);}
.btn-fire{background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;}
.btn-ready{background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:#fff;}

/* header */
.kp-header{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:var(--surface);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100;gap:10px;flex-wrap:wrap;}
.kp-header-l{display:flex;align-items:center;gap:10px;}
.kp-header-r{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}

/* tabs */
.station-tabs{display:flex;gap:0;background:var(--elevated);border-radius:10px;padding:3px;border:1px solid var(--border);}
.station-tab{padding:7px 18px;border-radius:8px;border:none;background:transparent;font-family:var(--font);font-size:13px;font-weight:700;cursor:pointer;transition:all .15s;color:var(--muted);}
.station-tab.active-food{background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;box-shadow:0 2px 8px rgba(245,158,11,.35);}
.station-tab.active-bar{background:linear-gradient(135deg,#38bdf8,#0284c7);color:#fff;box-shadow:0 2px 8px rgba(56,189,248,.35);}

/* grid */
.kp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;}
.kp-section-lbl{margin-bottom:10px;}

/* card */
.kp-card{background:var(--card);border:1px solid var(--border);border-radius:12px;overflow:hidden;animation:fadeIn .22s ease;transition:box-shadow .2s;}
.kp-card:hover{box-shadow:0 4px 20px rgba(0,0,0,.3);}
.kp-card.pending{border-color:rgba(245,158,11,.4);}
.kp-card.preparing{border-color:rgba(56,189,248,.4);}
.kp-card.ready{border-color:rgba(16,185,129,.4);}

/* card banner */
.kp-banner{padding:9px 14px;display:flex;align-items:center;justify-content:center;gap:8px;margin:-1px -1px 0;}
.kp-banner span{color:#fff;font-weight:900;font-size:13px;letter-spacing:.5px;text-transform:uppercase;text-shadow:0 1px 3px rgba(0,0,0,.3);}

/* card body */
.kp-head{padding:9px 14px;display:flex;justify-content:space-between;align-items:flex-start;}
.kp-body{padding:0 14px 10px;}
.kp-item{display:flex;align-items:flex-start;justify-content:space-between;padding:7px 0 7px 6px;border-bottom:1px solid var(--border);gap:8px;transition:opacity .3s;}
.kp-item:last-child{border-bottom:none;}
.kp-item-name{font-weight:700;font-size:14px;color:var(--txt);}
.kp-item-cat{font-size:11px;color:var(--muted);text-transform:capitalize;margin-top:1px;}
.kp-item-qty{font-weight:900;font-size:16px;background:var(--accent-bg);color:var(--accent);padding:3px 10px;border-radius:8px;min-width:38px;text-align:center;flex-shrink:0;}
.kp-item-qty.bar{background:var(--bar-bg);color:var(--bar);}
.kp-special{margin-top:5px;padding:5px 9px;background:rgba(251,191,36,.13);border:1px solid rgba(251,191,36,.35);border-radius:7px;font-size:12px;color:#d97706;font-weight:700;line-height:1.4;}
.kp-foot{padding:10px 14px;border-top:1px solid var(--border);display:flex;gap:8px;}
.kp-timer{font-size:12px;color:var(--muted);font-weight:600;flex-shrink:0;}
.kp-urgent{font-size:10px;font-weight:800;color:var(--danger);background:rgba(244,63,94,.1);padding:2px 7px;border-radius:20px;}

/* empty */
.kp-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;text-align:center;color:var(--muted);}
.kp-empty-icon{font-size:56px;margin-bottom:16px;}
`;

export default function KitchenPanel() {
  const [station, setStation]   = useState("food"); // "food" | "bar"
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState(null);
  const [theme, setTheme]       = useState("light");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { user, logout }        = useAuth();
  const navigate                = useNavigate();

  /* inject CSS */
  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = CSS;
    document.head.appendChild(s);
    return () => s.remove();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  /* ─── fetch orders ─────────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    try {
      // Fetch all active orders for this restaurant (no destination filter here)
      // We filter on the frontend by item category, which is more reliable
      const res = await API.get("/admin/kitchen");
      setOrders(res.data || []);
    } catch (e) {
      console.error("Kitchen fetch error", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 8000);
    return () => clearInterval(iv);
  }, [load]);

  /* ─── filter orders for current station ───────────────────────────────── */
  const stationOrders = orders
    .map(order => {
      const items = order.items || [];
      const filtered = station === "bar"
        ? items.filter(i => isBarItem(i.category, i.subcategory))
        : items.filter(i => !isBarItem(i.category, i.subcategory));
      return filtered.length > 0 ? { ...order, items: filtered } : null;
    })
    .filter(Boolean);

  // Per-station: an order card is "pending" if ALL its (station) items are pending
  // "preparing" if at least one is preparing/ready but not all ready
  // "ready" if ALL items are ready — hide from view
  const getStationStatus = (order) => {
    const statuses = order.items.map(i => i.kitchen_status || "pending");
    if (statuses.every(s => s === "ready")) return "ready";
    if (statuses.some(s => s === "preparing" || s === "ready")) return "preparing";
    return "pending";
  };

  const visibleOrders = stationOrders.filter(o => getStationStatus(o) !== "ready");
  const pending   = visibleOrders.filter(o => getStationStatus(o) === "pending");
  const preparing = visibleOrders.filter(o => getStationStatus(o) === "preparing");

  /* ─── actions ──────────────────────────────────────────────────────────── */
  const updateItemStatus = async (itemId, kitchen_status) => {
    setUpdating(itemId);
    try {
      await API.put(`/admin/kitchen/items/${itemId}/status`, { kitchen_status });
      await load();
    } catch {}
    setUpdating(null);
  };

  // Mark ALL station items in an order to a given status at once
  const updateAllItems = async (order, kitchen_status) => {
    setUpdating(order.id);
    try {
      await Promise.all(
        order.items.map(item => API.put(`/admin/kitchen/items/${item.id}/status`, { kitchen_status }))
      );
      await load();
    } catch {}
    setUpdating(null);
  };

  const handleLogout = () => setShowLogoutModal(true);
  const confirmLogout = async () => {
    try { await API.post("/auth/logout"); } catch {}
    logout();
    navigate("/");
  };

  const isBar = station === "bar";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999 }}>
          <div style={{ background:"#1e293b", borderRadius:16, padding:"32px 28px", minWidth:300, textAlign:"center", boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🚪</div>
            <h2 style={{ margin:"0 0 8px", fontSize:20, fontWeight:700, color:"#f1f5f9" }}>Logout?</h2>
            <p style={{ margin:"0 0 24px", color:"#94a3b8", fontSize:14 }}>Are you sure you want to log out?</p>
            <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
              <button onClick={() => setShowLogoutModal(false)} style={{ padding:"10px 24px", borderRadius:8, border:"1px solid #334155", background:"transparent", color:"#f1f5f9", cursor:"pointer", fontWeight:600, fontSize:14 }}>Cancel</button>
              <button onClick={confirmLogout} style={{ padding:"10px 24px", borderRadius:8, border:"none", background:"#ef4444", color:"#fff", cursor:"pointer", fontWeight:600, fontSize:14 }}>Yes, Logout</button>
            </div>
          </div>
        </div>
      )}
      {/* ── Header ── */}
      <header className="kp-header">
        <div className="kp-header-l">
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: isBar ? "linear-gradient(135deg,#38bdf8,#0284c7)" : "linear-gradient(135deg,#f59e0b,#d97706)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, boxShadow: isBar ? "0 2px 12px rgba(56,189,248,.4)" : "0 2px 12px rgba(245,158,11,.4)",
            flexShrink: 0, transition: "all .3s",
          }}>{isBar ? "🍹" : "👨‍🍳"}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "var(--txt)" }}>
              {user?.restaurant_name}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>{user?.name}</div>
          </div>
        </div>

        {/* Station tabs — center */}
        <div className="station-tabs">
          <button
            className={`station-tab ${station === "food" ? "active-food" : ""}`}
            onClick={() => setStation("food")}
          >
            🍳 Food
          </button>
          <button
            className={`station-tab ${station === "bar" ? "active-bar" : ""}`}
            onClick={() => setStation("bar")}
          >
            🍹 Bar
          </button>
        </div>

        <div className="kp-header-r">
          <span style={{ fontSize: 12, color: "var(--warn)", fontWeight: 700 }}>🕐 {pending.length}</span>
          <span style={{ fontSize: 12, color: "var(--info)", fontWeight: 700 }}>🔥 {preparing.length}</span>
          <button className="btn btn-outline btn-sm" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <button className="btn btn-outline btn-sm" onClick={load}>↻</button>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>🚪 Logout</button>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <div className="spin" />
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="kp-empty">
            <div className="kp-empty-icon">{isBar ? "🍹" : "🍽️"}</div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--txt2)", marginBottom: 8 }}>
              No Active {isBar ? "Bar" : "Food"} Orders
            </h3>
            <p style={{ fontSize: 13 }}>
              {isBar ? "Drink orders" : "Food orders"} will appear here automatically.
            </p>
            <p style={{ marginTop: 6, fontSize: 11 }}>Auto-refreshes every 8 seconds</p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div className="kp-section-lbl">
                  <span style={{
                    background: "rgba(245,158,11,.12)", color: "#f59e0b",
                    padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800,
                  }}>🕐 NEW — {pending.length} order{pending.length > 1 ? "s" : ""}</span>
                </div>
                <div className="kp-grid">
                  {pending.map(o => (
                    <KCard key={o.id} order={o} station={station}
                      updating={updating === o.id || o.items.some(i => updating === i.id)}
                      stationStatus={getStationStatus(o)}
                      onStartAll={() => updateAllItems(o, "preparing")}
                      onUpdateItem={updateItemStatus} />
                  ))}
                </div>
              </div>
            )}

            {preparing.length > 0 && (
              <div>
                <div className="kp-section-lbl">
                  <span style={{
                    background: "var(--info-bg)", color: "var(--info)",
                    padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800,
                  }}>🔥 PREPARING — {preparing.length} order{preparing.length > 1 ? "s" : ""}</span>
                </div>
                <div className="kp-grid">
                  {preparing.map(o => (
                    <KCard key={o.id} order={o} station={station}
                      updating={updating === o.id || o.items.some(i => updating === i.id)}
                      stationStatus={getStationStatus(o)}
                      onReadyAll={() => updateAllItems(o, "ready")}
                      onUpdateItem={updateItemStatus} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Order Card ────────────────────────────────────────────────────────────── */
function KCard({ order, station, updating, stationStatus, onStartAll, onReadyAll, onUpdateItem }) {
  const [elapsed, setElapsed] = useState(timeSince(order.created_at));
  const isBar     = station === "bar";
  const isTakeaway = order.order_type === "takeaway";
  const isUrgent  = (Date.now() - new Date(order.created_at)) > 15 * 60 * 1000;
  const allPending = stationStatus === "pending";
  const allReady   = order.items.every(i => (i.kitchen_status || "pending") === "ready");

  useEffect(() => {
    const t = setInterval(() => setElapsed(timeSince(order.created_at)), 15000);
    return () => clearInterval(t);
  }, [order.created_at]);

  const tableDisplay = order.table_label || `Table ${order.table_number}`;

  const bannerBg = isBar
    ? "linear-gradient(135deg,#38bdf8,#0284c7)"
    : isTakeaway
      ? "linear-gradient(135deg,#f97316,#ea580c)"
      : "linear-gradient(135deg,#22c55e,#16a34a)";

  const itemStatusColor = { pending: "var(--warn)", preparing: "var(--info)", ready: "var(--success)" };
  const itemStatusIcon  = { pending: "⏳", preparing: "🔥", ready: "✅" };

  return (
    <div className={`kp-card ${stationStatus}`} style={{
      borderColor: isUrgent && stationStatus === "pending" ? "rgba(244,63,94,.5)" : undefined,
    }}>
      {/* Banner */}
      <div className="kp-banner" style={{ background: bannerBg }}>
        <span style={{ fontSize: 16 }}>{isBar ? "🍹" : isTakeaway ? "📦" : "🪑"}</span>
        <span style={{ fontWeight: 900, letterSpacing: 0.5 }}>
          {isTakeaway ? "Packing" : tableDisplay}
        </span>
        {isTakeaway && order.table_label && (
          <span style={{ opacity: 0.85, fontSize: 11, fontWeight: 600 }}>· {order.table_label}</span>
        )}
      </div>

      {/* Head */}
      <div className="kp-head">
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--txt)" }}>
            Order #{order.id}
            {isUrgent && stationStatus === "pending" && (
              <span className="pulse kp-urgent" style={{ marginLeft: 6 }}>⚠️ URGENT</span>
            )}
          </div>
          {order.waiter_name && (
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>👤 {order.waiter_name}</div>
          )}
          {order.table_section && order.table_section !== "Main" && (
            <div style={{ fontSize: 11, color: "var(--info)", fontWeight: 700, marginTop: 2 }}>📍 {order.table_section}</div>
          )}
        </div>
        <div className="kp-timer">🕐 {elapsed}</div>
      </div>

      {/* Items — each with its own status pill + cycle button */}
      <div className="kp-body">
        {order.items.map((item, i) => {
          const ks = item.kitchen_status || "pending";
          return (
            <div key={i} className="kp-item" style={{
              borderLeft: `3px solid ${itemStatusColor[ks]}`,
              paddingLeft: 8,
              opacity: ks === "ready" ? 0.55 : 1,
              transition: "opacity 0.3s",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="kp-item-name" style={{ textDecoration: ks === "ready" ? "line-through" : "none" }}>
                  {item.item || item.name}
                </div>
                {item.category && <div className="kp-item-cat">{item.category}</div>}
                {item.special_request && (
                  <div className="kp-special">⚠️ {item.special_request}</div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <div className={`kp-item-qty ${isBar ? "bar" : ""}`}>×{item.quantity}</div>
                {/* Per-item status cycle button */}
                <button
                  title={ks === "pending" ? "Tap to start preparing" : ks === "preparing" ? "Tap to mark ready" : "Done"}
                  disabled={updating || ks === "ready"}
                  onClick={() => {
                    const next = ks === "pending" ? "preparing" : ks === "preparing" ? "ready" : "ready";
                    onUpdateItem(item.id, next);
                  }}
                  style={{
                    background: ks === "ready" ? "rgba(16,185,129,.1)" : ks === "preparing" ? "rgba(56,189,248,.1)" : "rgba(245,158,11,.1)",
                    border: `1px solid ${itemStatusColor[ks]}`,
                    color: itemStatusColor[ks],
                    borderRadius: 8,
                    padding: "3px 8px",
                    cursor: ks === "ready" ? "default" : "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    transition: "all 0.2s",
                    whiteSpace: "nowrap",
                    minWidth: 68,
                    textAlign: "center",
                  }}
                >
                  {itemStatusIcon[ks]} {ks === "pending" ? "Start" : ks === "preparing" ? "Done" : "Ready"}
                </button>
              </div>
            </div>
          );
        })}

        {order.notes && (
          <div style={{
            marginTop: 8, padding: "7px 10px", background: "rgba(245,158,11,.08)",
            borderRadius: 7, fontSize: 12, color: "var(--warn)", fontWeight: 500,
          }}>📝 {order.notes}</div>
        )}
      </div>

      {/* Footer — bulk actions */}
      <div className="kp-foot">
        {allPending && (
          <button className="btn btn-fire" style={{ flex: 1 }} onClick={onStartAll} disabled={updating}>
            {updating ? <span className="spin-sm" /> : "🔥"} Start All
          </button>
        )}
        {!allPending && !allReady && (
          <button className="btn btn-ready" style={{ flex: 1 }} onClick={onReadyAll} disabled={updating}>
            {updating ? <span className="spin-sm" /> : (isBar ? "🍹" : "✅")} All Ready
          </button>
        )}
        {allReady && (
          <div style={{ flex: 1, textAlign: "center", fontSize: 13, fontWeight: 700, color: "var(--success)", padding: "8px 0" }}>
            ✅ {isBar ? "Bar Ready!" : isTakeaway ? "Ready for Pickup!" : "Ready to Serve!"}
          </div>
        )}
      </div>
    </div>
  );
}
