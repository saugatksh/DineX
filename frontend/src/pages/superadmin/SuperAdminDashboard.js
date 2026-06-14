import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../api";

/* ─── Inject super-admin styles once ─────────────────────────────────────── */
const SA_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

  .sa-root { font-family: 'Sora', sans-serif; }

  /* ── Animated hero greeting ── */
  @keyframes sa-fade-up {
    from { opacity:0; transform:translateY(22px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes sa-slide-right {
    from { opacity:0; transform:translateX(-18px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes sa-pop {
    0%   { transform:scale(0.85); opacity:0; }
    60%  { transform:scale(1.04); }
    100% { transform:scale(1); opacity:1; }
  }
  @keyframes sa-pulse-ring {
    0%   { box-shadow: 0 0 0 0 rgba(99,102,241,0.45); }
    70%  { box-shadow: 0 0 0 14px rgba(99,102,241,0); }
    100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
  }
  @keyframes sa-shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  @keyframes sa-float {
    0%,100% { transform:translateY(0px) rotate(0deg); }
    33%      { transform:translateY(-8px) rotate(1deg); }
    66%      { transform:translateY(-4px) rotate(-1deg); }
  }
  @keyframes sa-spin-slow {
    to { transform:rotate(360deg); }
  }
  @keyframes sa-count-up {
    from { opacity:0; transform:translateY(8px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes sa-bar-grow {
    from { width:0; }
  }
  @keyframes sa-tick {
    0%   { transform:scale(1); }
    50%  { transform:scale(1.18); }
    100% { transform:scale(1); }
  }
  @keyframes sa-orb1 {
    0%,100%{ transform:translate(0,0) scale(1); }
    50%    { transform:translate(40px,-30px) scale(1.15); }
  }
  @keyframes sa-orb2 {
    0%,100%{ transform:translate(0,0) scale(1); }
    50%    { transform:translate(-30px,20px) scale(0.9); }
  }
  @keyframes sa-notice-in {
    from { opacity:0; transform:translateY(-10px) scale(0.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }

  /* ── Hero banner ── */
  .sa-hero {
    position:relative; overflow:hidden;
    background:linear-gradient(135deg,#1a1040 0%,#1e1560 40%,#161230 100%);
    border-radius:16px; padding:22px 28px;
    margin:0 24px 20px; border:1px solid rgba(99,102,241,0.25);
    box-shadow:0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06);
    animation: sa-fade-up 0.55s cubic-bezier(0.34,1.3,0.64,1) both;
  }
  [data-theme="light"] .sa-hero {
    background:linear-gradient(135deg,#eef0ff 0%,#e8e5ff 40%,#ede9ff 100%);
    border:1px solid rgba(99,102,241,0.2);
    box-shadow:0 8px 32px rgba(99,102,241,0.12);
  }
  .sa-hero-orb {
    position:absolute; border-radius:50%; filter:blur(60px); pointer-events:none;
  }
  .sa-hero-orb1 {
    width:260px;height:260px; top:-80px; right:-60px;
    background:rgba(99,102,241,0.18); animation:sa-orb1 8s ease-in-out infinite;
  }
  .sa-hero-orb2 {
    width:180px;height:180px; bottom:-60px; right:180px;
    background:rgba(139,92,246,0.12); animation:sa-orb2 10s ease-in-out infinite;
  }
  .sa-hero-grid {
    position:absolute; inset:0; opacity:0.04;
    background-image:linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),
                     linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px);
    background-size:40px 40px;
  }
  [data-theme="light"] .sa-hero-grid { opacity:0.08; }

  .sa-greeting-row {
    display:flex; align-items:center; justify-content:space-between;
    gap:16px; position:relative; z-index:1;
  }
  .sa-greeting-name {
    font-size:18px; font-weight:700; letter-spacing:-0.2px;
    color:#e0e7ff; animation:sa-fade-up 0.5s 0.1s both;
    line-height:1.3; flex:1; min-width:0;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
  }
  [data-theme="light"] .sa-greeting-name { color:#1e1b4b; }
  .sa-clock {
    font-family:'JetBrains Mono',monospace;
    font-size:16px; font-weight:600;
    color:rgba(165,180,252,0.9);
    animation:sa-fade-up 0.5s 0.15s both;
    white-space:nowrap; flex-shrink:0;
  }
  [data-theme="light"] .sa-clock { color:#6366f1; }

  /* xs — phones portrait (≤480px): sidebar hidden, full width */
  @media (max-width:480px) {
    .sa-hero { padding:14px 16px; margin:0 10px 14px; border-radius:12px; }
    .sa-greeting-row { flex-direction:column; align-items:flex-start; gap:4px; }
    .sa-greeting-name { font-size:15px; white-space:normal; }
    .sa-clock { font-size:13px; }
  }

  /* sm — phones landscape / small tablets (481–767px) */
  @media (min-width:481px) and (max-width:767px) {
    .sa-hero { padding:16px 20px; margin:0 14px 16px; border-radius:13px; }
    .sa-greeting-name { font-size:16px; }
    .sa-clock { font-size:14px; }
  }

  /* md — tablets (768–1023px): sidebar visible, less room */
  @media (min-width:768px) and (max-width:1023px) {
    .sa-hero { padding:18px 22px; margin:0 18px 18px; }
    .sa-greeting-name { font-size:17px; }
    .sa-clock { font-size:15px; }
  }

  /* lg — desktop (1024–1439px): default sizing is good */
  @media (min-width:1024px) and (max-width:1439px) {
    .sa-hero { padding:22px 28px; margin:0 24px 20px; }
    .sa-greeting-name { font-size:20px; }
    .sa-clock { font-size:17px; }
  }

  /* xl — large monitors (1440px+) */
  @media (min-width:1440px) {
    .sa-hero { padding:26px 36px; margin:0 28px 24px; }
    .sa-greeting-name { font-size:24px; }
    .sa-clock { font-size:20px; }
  }


  /* ── Quick stat pills in hero ── */
  .sa-hero-pills {
    display:flex; gap:10px; flex-wrap:wrap; margin-top:22px; position:relative; z-index:1;
    animation:sa-fade-up 0.5s 0.35s both;
  }
  .sa-hero-pill {
    display:flex; align-items:center; gap:7px;
    background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);
    border-radius:30px; padding:7px 14px; font-size:12px; font-weight:600;
    color:rgba(224,231,255,0.9); backdrop-filter:blur(8px);
    transition:all 0.2s;
  }
  [data-theme="light"] .sa-hero-pill {
    background:rgba(99,102,241,0.08); border-color:rgba(99,102,241,0.2); color:#4338ca;
  }
  .sa-hero-pill:hover { background:rgba(255,255,255,0.1); transform:translateY(-1px); }
  .sa-hero-pill-dot {
    width:7px; height:7px; border-radius:50%;
  }

  /* ── Stat cards ── */
  .sa-stats-grid {
    display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
    gap:16px; padding:0 24px; margin-bottom:24px;
  }
  .sa-stat {
    background:var(--bg-card); border:1px solid var(--border);
    border-radius:16px; padding:20px; position:relative; overflow:hidden;
    transition:all 0.28s cubic-bezier(0.34,1.3,0.64,1);
    box-shadow:var(--shadow-sm);
    animation:sa-pop 0.45s cubic-bezier(0.34,1.3,0.64,1) both;
    cursor:default;
  }
  .sa-stat:hover {
    transform:translateY(-5px) scale(1.015);
    box-shadow:0 12px 36px rgba(0,0,0,0.25);
    border-color:var(--border-strong);
  }
  .sa-stat-shimmer {
    position:absolute; inset:0; pointer-events:none;
    background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.03) 50%,transparent 100%);
    background-size:400px 100%;
    animation:sa-shimmer 3s infinite;
  }
  .sa-stat-accent-bar {
    position:absolute; top:0; left:0; right:0; height:3px; border-radius:16px 16px 0 0;
    animation:sa-bar-grow 0.6s 0.3s both;
  }
  .sa-stat-icon {
    width:44px; height:44px; border-radius:12px;
    display:flex; align-items:center; justify-content:center;
    font-size:20px; margin-bottom:14px;
    animation:sa-pulse-ring 3s ease-in-out infinite;
  }
  .sa-stat-val {
    font-size:32px; font-weight:800; letter-spacing:-1.5px; line-height:1;
    font-family:'JetBrains Mono',monospace;
    animation:sa-count-up 0.6s 0.2s both;
  }
  .sa-stat-label {
    font-size:11px; font-weight:700; text-transform:uppercase;
    letter-spacing:0.6px; color:var(--text-muted); margin-top:5px;
  }
  .sa-stat-sub {
    font-size:11px; color:var(--text-muted); margin-top:6px;
    display:flex; align-items:center; gap:4px;
  }

  /* ── Section header ── */
  .sa-section-hd {
    display:flex; align-items:center; justify-content:space-between;
    padding:0 24px; margin-bottom:16px;
  }
  .sa-section-hd h2 {
    font-size:14px; font-weight:700; letter-spacing:0.3px;
    color:var(--text-primary); display:flex; align-items:center; gap:8px;
  }
  .sa-section-line {
    flex:1; height:1px; background:var(--border); margin:0 16px;
  }

  /* ── Restaurant cards ── */
  .sa-restaurants-grid {
    display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr));
    gap:16px; padding:0 24px;
  }
  .sa-rcard {
    background:var(--bg-card); border:1px solid var(--border);
    border-radius:16px; padding:20px; position:relative; overflow:hidden;
    transition:all 0.25s cubic-bezier(0.34,1.2,0.64,1);
    box-shadow:var(--shadow-sm);
    animation:sa-fade-up 0.4s both;
  }
  .sa-rcard:hover {
    transform:translateY(-4px);
    box-shadow:0 16px 40px rgba(0,0,0,0.2);
    border-color:var(--border-strong);
  }
  .sa-rcard-inactive { border-left:3px solid var(--danger); opacity:0.88; }

  .sa-rcard-top { display:flex; align-items:flex-start; gap:13px; margin-bottom:14px; }
  .sa-rcard-avatar {
    width:46px; height:46px; border-radius:12px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    font-size:22px; overflow:hidden;
  }
  .sa-rcard-avatar img { width:100%; height:100%; object-fit:cover; }
  .sa-rcard-name { font-size:15px; font-weight:700; color:var(--text-primary); line-height:1.25; }
  .sa-rcard-meta { font-size:11px; color:var(--text-muted); margin-top:3px; }

  .sa-status-badge {
    margin-left:auto; flex-shrink:0;
    font-size:11px; font-weight:700; padding:4px 10px; border-radius:20px;
    display:flex; align-items:center; gap:4px;
  }
  .sa-badge-active { background:rgba(16,185,129,0.12); color:var(--success); }
  .sa-badge-expiring { background:rgba(245,158,11,0.12); color:var(--warning); }
  .sa-badge-expired { background:rgba(239,68,68,0.12); color:var(--danger); }

  .sa-rcard-info { display:flex; flex-wrap:wrap; gap:10px; font-size:11px; color:var(--text-muted); margin-bottom:14px; }
  .sa-rcard-info span { display:flex; align-items:center; gap:4px; }

  .sa-rcard-progress { margin-bottom:14px; }
  .sa-rcard-progress-label { font-size:10px; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.4px; margin-bottom:5px; display:flex; justify-content:space-between; }
  .sa-rcard-progress-bar { height:5px; border-radius:10px; background:var(--bg-surface); overflow:hidden; }
  .sa-rcard-progress-fill { height:100%; border-radius:10px; animation:sa-bar-grow 0.8s 0.2s both; transition:width 0.4s; }

  .sa-rcard-actions { display:flex; gap:7px; flex-wrap:wrap; }
  .sa-action-btn {
    display:inline-flex; align-items:center; gap:5px;
    padding:6px 12px; border-radius:8px; border:1px solid var(--border);
    background:var(--bg-surface); color:var(--text-secondary);
    font-size:12px; font-weight:600; cursor:pointer;
    transition:all 0.18s; white-space:nowrap;
  }
  .sa-action-btn:hover { background:var(--bg-elevated); border-color:var(--border-strong); color:var(--text-primary); transform:translateY(-1px); }
  .sa-action-btn-primary { background:var(--gradient-brand); color:#fff; border-color:transparent; box-shadow:0 2px 8px rgba(99,102,241,0.35); }
  .sa-action-btn-primary:hover { opacity:0.9; }
  .sa-action-btn-danger { color:var(--danger); border-color:rgba(239,68,68,0.2); }
  .sa-action-btn-danger:hover { background:rgba(239,68,68,0.08); border-color:var(--danger); }

  /* ── Alert banner ── */
  .sa-alert-banner {
    margin:0 24px 20px; padding:14px 18px; border-radius:12px;
    display:flex; align-items:flex-start; gap:12px;
    animation:sa-notice-in 0.4s both;
  }
  .sa-alert-banner-warn {
    background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.25);
  }
  .sa-alert-banner-info {
    background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.2);
  }
  .sa-alert-banner-danger {
    background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2);
  }

  /* ── Filter tabs ── */
  .sa-filter-bar {
    display:flex; gap:6px; padding:0 24px; margin-bottom:20px; flex-wrap:wrap;
  }
  .sa-filter-btn {
    padding:7px 16px; border-radius:20px; border:1px solid var(--border);
    background:var(--bg-surface); color:var(--text-secondary);
    font-size:12px; font-weight:600; cursor:pointer;
    transition:all 0.18s; font-family:'Sora',sans-serif;
  }
  .sa-filter-btn:hover { border-color:var(--border-strong); color:var(--text-primary); }
  .sa-filter-btn.active { background:var(--gradient-brand); color:#fff; border-color:transparent; box-shadow:0 2px 8px rgba(99,102,241,0.3); }

  /* ── Suspended notice ── */
  .sa-suspended {
    background:rgba(239,68,68,0.07); border:1px solid rgba(239,68,68,0.2);
    border-radius:9px; padding:9px 13px; font-size:12px; color:var(--danger);
    margin-bottom:12px; display:flex; align-items:center; gap:8px;
  }

  /* ── Divider ── */
  .sa-divider { height:1px; background:var(--border); margin:20px 0; }

  /* ── Expiry countdown chip ── */
  .sa-expiry-chip {
    display:inline-flex; align-items:center; gap:5px;
    font-size:10px; font-weight:700; padding:3px 9px; border-radius:12px;
    margin-left:6px; vertical-align:middle;
  }
  .sa-expiry-chip.soon { background:rgba(245,158,11,0.15); color:var(--warning); }
  .sa-expiry-chip.critical { background:rgba(239,68,68,0.15); color:var(--danger); animation:sa-tick 1.5s ease-in-out infinite; }

  /* Sidebar super-admin tweaks */
  .sa-sidebar-badge {
    display:inline-flex; align-items:center; gap:5px;
    background:rgba(99,102,241,0.15); border:1px solid rgba(99,102,241,0.3);
    color:#a5b4fc; font-size:10px; font-weight:700; padding:3px 9px;
    border-radius:12px; letter-spacing:0.3px; margin-top:6px;
  }
`;

function injectSAStyles() {
  if (document.getElementById("sa-styles")) return;
  const el = document.createElement("style");
  el.id = "sa-styles";
  el.textContent = SA_STYLES;
  document.head.appendChild(el);
}

/* ─── Live clock ──────────────────────────────────────────────────────────── */
function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function getGreeting(name) {
  const h = new Date().getHours();
  const emoji = h < 12 ? "☀️" : h < 17 ? "👋" : h < 21 ? "🌆" : "🌙";
  const word  = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 21 ? "Good evening" : "Good night";
  return `${emoji} ${word}, ${name?.split(" ")[0] || "Admin"}!`;
}

const TABS = [
  { id: "overview",     label: "Overview",     icon: "📊" },
  { id: "restaurants",  label: "Restaurants",  icon: "🏪" },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function SuperAdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { user, logout, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { injectSAStyles(); }, []);

  const handleLogout = () => setShowLogoutModal(true);
  const confirmLogout = () => { logout(); navigate("/superadmin/login"); };

  return (
    <div className="dashboard sa-root">
      {/* Logout Modal */}
      {showLogoutModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,backdropFilter:"blur(4px)" }}>
          <div style={{ background:"var(--bg-card)",borderRadius:20,padding:"36px 32px",minWidth:320,textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,0.4)",border:"1px solid var(--border-strong)",animation:"sa-pop 0.3s both" }}>
            <div style={{ fontSize:44,marginBottom:14,animation:"sa-float 3s ease-in-out infinite" }}>🚪</div>
            <h2 style={{ margin:"0 0 8px",fontSize:20,fontWeight:800,letterSpacing:"-0.5px" }}>Ready to leave?</h2>
            <p style={{ margin:"0 0 28px",color:"var(--text-muted)",fontSize:13,lineHeight:1.5 }}>You'll need to log back in to access the control center.</p>
            <div style={{ display:"flex",gap:12,justifyContent:"center" }}>
              <button onClick={() => setShowLogoutModal(false)} style={{ padding:"10px 24px",borderRadius:10,border:"1px solid var(--border)",background:"var(--bg-surface)",cursor:"pointer",fontWeight:600,fontSize:13,color:"var(--text-secondary)",fontFamily:"inherit" }}>Stay</button>
              <button onClick={confirmLogout} style={{ padding:"10px 24px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#ef4444,#dc2626)",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit",boxShadow:"0 4px 14px rgba(239,68,68,0.4)" }}>Yes, Logout</button>
            </div>
          </div>
        </div>
      )}

      <div className={`sidebar-overlay${sidebarOpen ? " visible" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* ── Sidebar ── */}
      <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
        <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close menu">✕</button>
        <div className="sidebar-brand">
          <div className="brand-logo">
            <img src="/dinex-favicon-1.png" alt="DineX" style={{ width:44,height:44,objectFit:"contain" }} />
            <h2>DineX</h2>
          </div>
          <div className="brand-role">Control Center</div>
          <div className="sa-sidebar-badge">⚡ Super Admin</div>
        </div>
        <nav style={{ marginTop:8 }}>
          {TABS.map(t => (
            <button key={t.id} className={`nav-item ${tab === t.id ? "active" : ""}`}
              onClick={() => { setTab(t.id); setSidebarOpen(false); }}>
              <span className="nav-icon">{t.icon}</span>{t.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-name" style={{ fontWeight:700 }}>{user?.name}</div>
            <div className="user-role">Super Administrator</div>
          </div>
          <button className="nav-item" onClick={toggleTheme}>
            <span className="nav-icon">{theme === "dark" ? "☀️" : "🌙"}</span>
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          <button className="nav-item" style={{ color:"var(--danger)" }} onClick={handleLogout}>
            <span className="nav-icon">🚪</span>Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-content">
        <div className="mobile-topbar">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open menu">☰</button>
          <span className="mobile-topbar-title">
            {TABS.find(t => t.id === tab)?.icon} {TABS.find(t => t.id === tab)?.label || "Super Admin"}
          </span>
          <div style={{ width:40 }} />
        </div>
        {tab === "overview"    && <SAOverviewTab user={user} />}
        {tab === "restaurants" && <SARestaurantsTab />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
function SAOverviewTab({ user }) {
  const [stats, setStats] = useState({});
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const now = useClock();

  const load = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([
        API.get("/super-admin/stats"),
        API.get("/super-admin/restaurants"),
      ]);
      setStats(s.data);
      setRestaurants(r.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="page-body" style={{ display:"flex",alignItems:"center",justifyContent:"center",minHeight:300 }}><div className="spinner" /></div>;

  const expiringSoon = restaurants.filter(r => {
    const days = Math.ceil((new Date(r.subscription_end) - Date.now()) / 86400000);
    return days > 0 && days <= 30 && r.is_active;
  });
  const critical = expiringSoon.filter(r => Math.ceil((new Date(r.subscription_end) - Date.now()) / 86400000) <= 7);

  const activeCount   = Number(stats.active_subscriptions || 0);
  const totalCount    = Number(stats.total_restaurants || 0);
  const inactiveCount = Number(stats.inactive_restaurants || 0);
  const activeRatio   = totalCount > 0 ? (activeCount / totalCount) * 100 : 0;

  const timeStr = now.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", second:"2-digit" });
  const dateStr = now.toLocaleDateString([], { weekday:"long", month:"long", day:"numeric", year:"numeric" });

  return (
    <>
      {/* ── Greeting bar ── */}
      <div style={{ paddingTop:20 }}>
        <div className="sa-hero">
          <div className="sa-hero-orb sa-hero-orb1" />
          <div className="sa-hero-orb sa-hero-orb2" />
          <div className="sa-hero-grid" />
          <div className="sa-greeting-row">
            <div className="sa-greeting-name">{getGreeting(user?.name)}</div>
            <div className="sa-clock">{timeStr}</div>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="sa-stats-grid">
        {[
          { icon:"🏪", label:"Total Restaurants", val:totalCount,  color:"#6366f1", barColor:"var(--gradient-brand)",   delay:"0s",   sub:`${activeRatio.toFixed(0)}% healthy` },
          { icon:"✅", label:"Active Subs",       val:activeCount, color:"#10b981", barColor:"var(--gradient-success)",  delay:"0.07s",sub:`${inactiveCount} inactive` },
          { icon:"👥", label:"Total Users",       val:Number(stats.total_users||0), color:"#3b82f6", barColor:"linear-gradient(135deg,#3b82f6,#2563eb)", delay:"0.14s", sub:"across all venues" },
          { icon:"⚠️", label:"Expiring Soon",    val:expiringSoon.length, color:"#f59e0b", barColor:"var(--gradient-warm)", delay:"0.21s", sub:`${critical.length} critical (≤7d)` },
        ].map((c, i) => (
          <div key={i} className="sa-stat" style={{ animationDelay:c.delay }}>
            <div className="sa-stat-shimmer" />
            <div className="sa-stat-accent-bar" style={{ background:c.barColor }} />
            <div className="sa-stat-icon" style={{ background:`${c.color}18`, color:c.color }}>
              {c.icon}
            </div>
            <div className="sa-stat-val" style={{ color:c.color }}>{c.val}</div>
            <div className="sa-stat-label">{c.label}</div>
            <div className="sa-stat-sub">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Expiring Soon alert ── */}
      {expiringSoon.length > 0 && (
        <div className="sa-alert-banner sa-alert-banner-warn">
          <span style={{ fontSize:20 }}>⚠️</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:13, color:"var(--warning)", marginBottom:6 }}>
              {expiringSoon.length} subscription{expiringSoon.length > 1 ? "s" : ""} expiring within 30 days
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {expiringSoon.map(r => {
                const days = Math.ceil((new Date(r.subscription_end) - Date.now()) / 86400000);
                return (
                  <span key={r.id} style={{ background:"rgba(245,158,11,0.12)", border:"1px solid rgba(245,158,11,0.25)", borderRadius:8, padding:"3px 10px", fontSize:12, fontWeight:600, color:"var(--warning)" }}>
                    {r.name}
                    <span className={`sa-expiry-chip ${days <= 7 ? "critical" : "soon"}`}>{days}d</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Active Subscription Health ── */}
      <div className="sa-section-hd" style={{ marginBottom:16 }}>
        <h2>📈 Platform Health</h2>
        <div className="sa-section-line" />
        <button className="sa-action-btn" onClick={load} style={{ fontSize:12 }}>↻ Refresh</button>
      </div>
      <div style={{ padding:"0 24px", marginBottom:28 }}>
        <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:16, padding:20, display:"flex", gap:24, flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ flex:1, minWidth:180 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>Active Subscription Rate</div>
            <div style={{ height:10, borderRadius:20, background:"var(--bg-surface)", overflow:"hidden", marginBottom:8 }}>
              <div style={{ height:"100%", width:`${activeRatio}%`, borderRadius:20, background:"var(--gradient-success)", animation:"sa-bar-grow 1s 0.3s both", transition:"width 0.6s" }} />
            </div>
            <div style={{ fontSize:12, color:"var(--text-muted)" }}>{activeRatio.toFixed(1)}% — {activeCount} of {totalCount} restaurants active</div>
          </div>
          <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
            {[
              { label:"Active",   val:activeCount,  color:"var(--success)" },
              { label:"Inactive", val:inactiveCount, color:"var(--danger)"  },
              { label:"Expiring", val:expiringSoon.length, color:"var(--warning)" },
            ].map(item => (
              <div key={item.label} style={{ textAlign:"center" }}>
                <div style={{ fontSize:24, fontWeight:800, color:item.color, fontFamily:"'JetBrains Mono',monospace", letterSpacing:"-1px" }}>{item.val}</div>
                <div style={{ fontSize:11, color:"var(--text-muted)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px" }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── All Restaurants mini-grid ── */}
      <div className="sa-section-hd">
        <h2>🏪 All Restaurants</h2>
        <div className="sa-section-line" />
      </div>
      <div className="sa-restaurants-grid" style={{ marginBottom:32 }}>
        {restaurants.map((r, i) => <RestaurantMiniCard key={r.id} restaurant={r} animDelay={`${i * 0.05}s`} />)}
      </div>
    </>
  );
}

/* ─── Mini card for overview ────────────────────────────────────────────── */
function RestaurantMiniCard({ restaurant: r, animDelay }) {
  const days = Math.ceil((new Date(r.subscription_end) - Date.now()) / 86400000);
  const isActive   = r.is_active && days > 0;
  const isExpiring = isActive && days <= 30;
  const totalDays  = Math.ceil((new Date(r.subscription_end) - new Date(r.subscription_start)) / 86400000);
  const elapsed    = totalDays - Math.max(0, days);
  const pct        = totalDays > 0 ? Math.min(100, (elapsed / totalDays) * 100) : 100;
  const barColor   = isExpiring ? "var(--warning)" : isActive ? "var(--success)" : "var(--danger)";

  return (
    <div className={`sa-rcard ${!isActive ? "sa-rcard-inactive" : ""}`} style={{ animationDelay: animDelay || "0s" }}>
      <div className="sa-rcard-top">
        <div className="sa-rcard-avatar" style={{ background: isActive ? "var(--gradient-brand)" : "var(--bg-surface)" }}>
          {r.logo ? <img src={r.logo} alt={r.name} /> : "🍽️"}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div className="sa-rcard-name">{r.name}</div>
          <div className="sa-rcard-meta">{r.address}</div>
        </div>
        <span className={`sa-status-badge ${isExpiring ? "sa-badge-expiring" : isActive ? "sa-badge-active" : "sa-badge-expired"}`}>
          {isExpiring ? `⚠️ ${days}d` : isActive ? "✅ Active" : "❌ Expired"}
        </span>
      </div>
      <div className="sa-rcard-progress">
        <div className="sa-rcard-progress-label">
          <span>Subscription usage</span>
          <span style={{ color: barColor }}>{Math.round(pct)}%</span>
        </div>
        <div className="sa-rcard-progress-bar">
          <div className="sa-rcard-progress-fill" style={{ width:`${pct}%`, background: barColor }} />
        </div>
      </div>
      <div className="sa-rcard-info">
        <span>👥 {r.staff_count} staff</span>
        <span>📅 Until {new Date(r.subscription_end).toLocaleDateString()}</span>
        <span style={{
          display:"inline-flex", alignItems:"center", gap:4,
          background: r.subscription_plan === "pro" ? "rgba(139,92,246,0.12)" : r.subscription_plan === "business" ? "rgba(99,102,241,0.12)" : "rgba(107,114,128,0.12)",
          color: r.subscription_plan === "pro" ? "#8b5cf6" : r.subscription_plan === "business" ? "#6366f1" : "#6b7280",
          padding:"2px 8px", borderRadius:8, fontSize:10, fontWeight:700
        }}>
          {r.subscription_plan === "pro" ? "👑" : r.subscription_plan === "business" ? "⚡" : "🟡"} {(r.subscription_plan || "starter").charAt(0).toUpperCase() + (r.subscription_plan || "starter").slice(1)}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
function SARestaurantsTab() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [editModal, setEditModal]     = useState(null);
  const [renewModal, setRenewModal]   = useState(null);
  const [usersModal, setUsersModal]   = useState(null);
  const [filter, setFilter]           = useState("all");
  const [search, setSearch]           = useState("");
  const [form, setForm] = useState({ name:"", address:"", phone:"", pan_number:"", subscription_start:"", subscription_end:"", logo:"", subscription_plan:"business" });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const load = useCallback(async () => {
    try {
      const res = await API.get("/super-admin/restaurants");
      setRestaurants(res.data);
    } catch {}
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await API.post("/super-admin/restaurants", form);
      setShowModal(false);
      setForm({ name:"", address:"", phone:"", pan_number:"", subscription_start:"", subscription_end:"", logo:"", subscription_plan:"business" });
      await load();
    } catch (err) { setError(err.response?.data?.error || "Failed to create"); }
    setSaving(false);
  };

  const handleEdit = async (e) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await API.put(`/super-admin/restaurants/${editModal.id}`, editModal);
      setEditModal(null); await load();
    } catch (err) { setError(err.response?.data?.error || "Failed to update"); }
    setSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete restaurant "${name}" and all its data? This cannot be undone.`)) return;
    setSaving(true);
    setError("");
    try {
      await API.delete(`/super-admin/restaurants/${id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.msg || "Failed to delete restaurant. Check server logs for details.");
    }
    setSaving(false);
  };

  if (loading) return <div className="page-body" style={{ display:"flex",alignItems:"center",justifyContent:"center",minHeight:300 }}><div className="spinner" /></div>;

  const inactiveCount = restaurants.filter(r => { const d = Math.ceil((new Date(r.subscription_end) - Date.now()) / 86400000); return !r.is_active || d <= 0; }).length;

  const filtered = restaurants.filter(r => {
    const d = Math.ceil((new Date(r.subscription_end) - Date.now()) / 86400000);
    const isActive = r.is_active && d > 0;
    const matchFilter = filter === "active" ? isActive : filter === "inactive" ? !isActive : true;
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || (r.address||"").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <>
      {error && !showModal && !editModal && (
        <div style={{ margin:"12px 24px 0", padding:"10px 16px", background:"var(--danger-bg,#fee2e2)", border:"1px solid var(--danger,#ef4444)", borderRadius:8, color:"var(--danger,#dc2626)", fontSize:13, fontWeight:600, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          \u26a0\ufe0f {error}
          <button onClick={() => setError("")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, color:"inherit" }}>\u2715</button>
        </div>
      )}
      {/* Header */}
      <div className="page-header" style={{ padding:"24px 24px 16px" }}>
        <div>
          <h1 style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, letterSpacing:"-0.5px" }}>Restaurants</h1>
          <p style={{ color:"var(--text-muted)", fontSize:13, marginTop:2 }}>{restaurants.length} venues · {restaurants.length - inactiveCount} active</p>
        </div>
        <button className="btn btn-primary" style={{ fontFamily:"'Sora',sans-serif", fontWeight:700 }} onClick={() => setShowModal(true)}>＋ Add Restaurant</button>
      </div>

      {/* Search + Filter */}
      <div style={{ padding:"0 24px", marginBottom:16, display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
        <input
          placeholder="🔍 Search restaurants…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex:1, minWidth:180, maxWidth:280, padding:"8px 14px", borderRadius:10, border:"1px solid var(--border)", background:"var(--bg-surface)", color:"var(--text-primary)", fontSize:13, fontFamily:"'Sora',sans-serif", outline:"none" }}
        />
      </div>

      <div className="sa-filter-bar">
        {[
          { key:"all",      label:`All  (${restaurants.length})` },
          { key:"active",   label:`✅ Active (${restaurants.length - inactiveCount})` },
          { key:"inactive", label:`🔴 Inactive (${inactiveCount})` },
        ].map(f => (
          <button key={f.key} className={`sa-filter-btn ${filter === f.key ? "active" : ""}`} onClick={() => setFilter(f.key)}>{f.label}</button>
        ))}
      </div>

      {inactiveCount > 0 && filter !== "active" && (
        <div className="sa-alert-banner sa-alert-banner-danger">
          <span style={{ fontSize:20 }}>🔒</span>
          <span style={{ fontSize:13 }}><strong>{inactiveCount} restaurant{inactiveCount !== 1 ? "s" : ""}</strong> have inactive/expired subscriptions. All data is preserved — use <strong>🔄 Renew</strong> to restore access.</span>
        </div>
      )}

      {/* Cards */}
      <div className="sa-restaurants-grid" style={{ marginBottom:32 }}>
        {filtered.map((r, i) => {
          const days = Math.ceil((new Date(r.subscription_end) - Date.now()) / 86400000);
          const isActive   = r.is_active && days > 0;
          const isExpiring = isActive && days <= 30;
          const isInactive = !r.is_active;
          const isExpired  = r.is_active && days <= 0;
          const totalDays  = Math.ceil((new Date(r.subscription_end) - new Date(r.subscription_start)) / 86400000);
          const elapsed    = totalDays - Math.max(0, days);
          const pct        = totalDays > 0 ? Math.min(100, (elapsed / totalDays) * 100) : 100;
          const barColor   = isExpiring ? "var(--warning)" : isActive ? "var(--success)" : "var(--danger)";

          return (
            <div key={r.id} className={`sa-rcard ${!isActive ? "sa-rcard-inactive" : ""}`} style={{ animationDelay:`${i * 0.04}s` }}>
              {/* Top */}
              <div className="sa-rcard-top">
                <div className="sa-rcard-avatar" style={{ background: isActive ? "var(--gradient-brand)" : "var(--bg-surface)" }}>
                  {r.logo ? <img src={r.logo} alt={r.name} /> : "🍽️"}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="sa-rcard-name">{r.name}</div>
                  {r.address && <div className="sa-rcard-meta">📍 {r.address}</div>}
                  {r.phone   && <div className="sa-rcard-meta">📞 {r.phone}</div>}
                  {r.pan_number && <div className="sa-rcard-meta">🪪 {r.pan_number}</div>}
                </div>
                <span className={`sa-status-badge ${isExpiring ? "sa-badge-expiring" : isActive ? "sa-badge-active" : "sa-badge-expired"}`}>
                  {isInactive ? "🔴 Inactive" : isExpired ? "❌ Expired" : isExpiring ? `⚠️ ${days}d left` : "✅ Active"}
                </span>
              </div>

              {/* Subscription progress bar */}
              <div className="sa-rcard-progress">
                <div className="sa-rcard-progress-label">
                  <span>Subscription period</span>
                  <span style={{ color:barColor }}>{Math.round(pct)}% used</span>
                </div>
                <div className="sa-rcard-progress-bar">
                  <div className="sa-rcard-progress-fill" style={{ width:`${pct}%`, background:barColor }} />
                </div>
              </div>

              {/* Info chips */}
              <div className="sa-rcard-info">
                <span>👥 {r.staff_count} staff</span>
                <span>👔 {r.admin_count} admin</span>
                <span>📅 {new Date(r.subscription_start).toLocaleDateString()} → {new Date(r.subscription_end).toLocaleDateString()}</span>
                <span style={{
                  display:"inline-flex", alignItems:"center", gap:4,
                  background: r.subscription_plan === "pro" ? "rgba(139,92,246,0.12)" : r.subscription_plan === "business" ? "rgba(99,102,241,0.12)" : "rgba(107,114,128,0.12)",
                  color: r.subscription_plan === "pro" ? "#8b5cf6" : r.subscription_plan === "business" ? "#6366f1" : "#6b7280",
                  padding:"2px 8px", borderRadius:8, fontSize:10, fontWeight:700
                }}>
                  {r.subscription_plan === "pro" ? "👑" : r.subscription_plan === "business" ? "⚡" : "🟡"} {(r.subscription_plan || "starter").charAt(0).toUpperCase() + (r.subscription_plan || "starter").slice(1)}
                </span>
              </div>

              {/* Suspended notice */}
              {!isActive && (
                <div className="sa-suspended">
                  <span>🔒</span>
                  <span><strong>Service suspended.</strong> All data preserved. Renew to restore.</span>
                </div>
              )}

              {/* Actions */}
              <div className="sa-rcard-actions">
                <button className="sa-action-btn" onClick={() => setUsersModal(r)}>👥 Staff</button>
                <button className="sa-action-btn" onClick={() => setEditModal({ ...r })}>✏️ Edit</button>
                <button className={`sa-action-btn ${!isActive ? "sa-action-btn-primary" : ""}`} onClick={() => setRenewModal(r)}>🔄 Renew</button>
                <button className="sa-action-btn sa-action-btn-danger" style={{ marginLeft:"auto" }} onClick={() => handleDelete(r.id, r.name)}>🗑️</button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ gridColumn:"1/-1", textAlign:"center", color:"var(--text-muted)", padding:60, animation:"sa-fade-up 0.4s both" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
            <div style={{ fontWeight:700, fontSize:16 }}>No restaurants found</div>
            <div style={{ fontSize:13, marginTop:6 }}>{search ? `No results for "${search}"` : "Try a different filter"}</div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <RestaurantFormModal
          title="➕ Add New Restaurant"
          form={form}
          setForm={setForm}
          onSubmit={handleCreate}
          onClose={() => setShowModal(false)}
          saving={saving}
          error={error}
          submitLabel="Create Restaurant"
        />
      )}

      {/* Edit Modal */}
      {editModal && (
        <RestaurantFormModal
          title="✏️ Edit Restaurant"
          form={editModal}
          setForm={setEditModal}
          onSubmit={handleEdit}
          onClose={() => setEditModal(null)}
          saving={saving}
          error={error}
          submitLabel="Save Changes"
          isEdit
        />
      )}

      {renewModal && <RenewModal restaurant={renewModal} onClose={() => setRenewModal(null)} onRenewed={() => { setRenewModal(null); load(); }} />}
      {usersModal && <StaffModal restaurant={usersModal} onClose={() => setUsersModal(null)} />}
    </>
  );
}

/* ─── Shared Restaurant form modal ─────────────────────────────────────── */
function RestaurantFormModal({ title, form, setForm, onSubmit, onClose, saving, error, submitLabel, isEdit }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ fontFamily:"'Sora',sans-serif" }}>
        <div className="modal-header">
          <h3 style={{ fontWeight:800, letterSpacing:"-0.3px" }}>{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">⚠️ {error}</div>}
            <div className="form-group">
              <label>Restaurant Name {!isEdit && "*"}</label>
              <input required={!isEdit} placeholder="e.g. The Grand Kitchen" value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input placeholder="Full address" value={form.address || ""} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" placeholder="98XXXXXXXX" maxLength={10} value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g,"").slice(0,10) })} />
              </div>
              <div className="form-group">
                <label>PAN Number</label>
                <input placeholder="e.g. 123456789" value={form.pan_number || ""} onChange={e => setForm({ ...form, pan_number: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Restaurant Logo</label>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                {form.logo && <img src={form.logo} alt="preview" style={{ width:48,height:48,borderRadius:10,objectFit:"cover",border:"1px solid var(--border)" }} />}
                <input type="file" accept="image/*" style={{ flex:1 }} onChange={e => {
                  const file = e.target.files[0]; if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => setForm(f => ({ ...f, logo: ev.target.result }));
                  reader.readAsDataURL(file);
                }} />
                {form.logo && <button type="button" className="btn btn-ghost btn-sm" style={{ color:"var(--danger)" }} onClick={() => setForm(f => ({ ...f, logo:"" }))}>✕</button>}
              </div>
            </div>
            <div className="form-group">
              <label>Subscription Plan *</label>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:4 }}>
                {[
                  { id:"starter",  label:"Starter",  icon:"🟡", subtitle:"Small cafes",        color:"#6b7280" },
                  { id:"business", label:"Business", icon:"🔵", subtitle:"Growing restaurants", color:"#6366f1" },
                  { id:"pro",      label:"Pro",       icon:"🟣", subtitle:"Full-scale chains",   color:"#8b5cf6" },
                ].map(plan => {
                  const selected = (form.subscription_plan || "business") === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setForm({ ...form, subscription_plan: plan.id })}
                      style={{
                        flex:"1 1 120px", minWidth:110, padding:"12px 14px", borderRadius:12, cursor:"pointer",
                        border:`2px solid ${selected ? plan.color : "var(--border)"}`,
                        background: selected ? `${plan.color}12` : "var(--bg-surface)",
                        transition:"all 0.18s",
                        display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                      }}
                    >
                      <span style={{ fontSize:20 }}>{plan.icon}</span>
                      <span style={{ fontWeight:700, fontSize:13, color: selected ? plan.color : "var(--text-primary)" }}>{plan.label}</span>
                      <span style={{ fontSize:10, color:"var(--text-muted)", textAlign:"center" }}>{plan.subtitle}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label>Subscription Start {!isEdit && "*"}</label>
                <input type="date" required={!isEdit} value={(form.subscription_start||"").split("T")[0]} onChange={e => setForm({ ...form, subscription_start: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Subscription End {!isEdit && "*"}</label>
                <input type="date" required={!isEdit} value={(form.subscription_end||"").split("T")[0]} onChange={e => setForm({ ...form, subscription_end: e.target.value })} />
              </div>
            </div>
            {form.subscription_start && form.subscription_end && (
              <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:-8, marginBottom:8 }}>
                Duration: {Math.ceil((new Date(form.subscription_end) - new Date(form.subscription_start)) / 86400000)} days
              </div>
            )}
            {isEdit && (
              <div className="form-group">
                <label>Status</label>
                <select value={form.is_active ? "true" : "false"} onChange={e => setForm({ ...form, is_active: e.target.value === "true" })}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ fontFamily:"'Sora',sans-serif", fontWeight:700 }}>
              {saving ? <><span className="spinner-sm" /> Saving…</> : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Renew Modal ───────────────────────────────────────────────────────── */
function RenewModal({ restaurant, onClose, onRenewed }) {
  const today       = new Date().toISOString().split("T")[0];
  const oneYearLater = new Date(); oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
  const [form, setForm]       = useState({ subscription_start: today, subscription_end: oneYearLater.toISOString().split("T")[0] });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);

  const days    = Math.ceil((new Date(restaurant.subscription_end) - Date.now()) / 86400000);
  const wasActive = restaurant.is_active && days > 0;

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await API.post(`/super-admin/restaurants/${restaurant.id}/renew`, form);
      setSuccess(true);
      setTimeout(onRenewed, 1400);
    } catch (err) { setError(err.response?.data?.error || "Failed to renew"); }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:480, fontFamily:"'Sora',sans-serif" }}>
        <div className="modal-header">
          <h3 style={{ fontWeight:800 }}>🔄 Renew Subscription</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ background:"var(--bg-surface)", borderRadius:12, padding:"14px 16px", marginBottom:18, display:"flex", gap:12, alignItems:"center", border:"1px solid var(--border)" }}>
            <div style={{ fontSize:30 }}>🍽️</div>
            <div>
              <div style={{ fontWeight:700, fontSize:15 }}>{restaurant.name}</div>
              <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:3 }}>
                Current: {new Date(restaurant.subscription_start).toLocaleDateString()} → {new Date(restaurant.subscription_end).toLocaleDateString()}
              </div>
              <span style={{ marginTop:6, display:"inline-block", background: wasActive ? "var(--warning-bg)" : "var(--danger-bg)", color: wasActive ? "var(--warning)" : "var(--danger)", padding:"2px 10px", borderRadius:8, fontSize:11, fontWeight:700 }}>
                {wasActive ? "⚠️ Expiring" : "🔴 Currently Inactive"}
              </span>
            </div>
          </div>
          <div className="sa-alert-banner sa-alert-banner-info" style={{ marginBottom:20, padding:"10px 14px" }}>
            <span style={{ fontSize:18 }}>💾</span>
            <span style={{ fontSize:12 }}><strong>All data preserved.</strong> Menu, orders, staff, inventory — everything restores instantly on renewal.</span>
          </div>
          {success ? (
            <div className="alert alert-success" style={{ textAlign:"center", padding:24, fontSize:15, animation:"sa-pop 0.4s both" }}>
              ✅ Subscription renewed! Service is now live.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="alert alert-error" style={{ marginBottom:12 }}>⚠️ {error}</div>}
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label>New Start *</label>
                  <input type="date" required value={form.subscription_start} onChange={e => setForm({ ...form, subscription_start: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>New End *</label>
                  <input type="date" required min={form.subscription_start} value={form.subscription_end} onChange={e => setForm({ ...form, subscription_end: e.target.value })} />
                </div>
              </div>
              {form.subscription_start && form.subscription_end && (
                <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:-8, marginBottom:16 }}>
                  Duration: {Math.ceil((new Date(form.subscription_end) - new Date(form.subscription_start)) / 86400000)} days
                </div>
              )}
              <div className="modal-footer" style={{ padding:0, paddingTop:8 }}>
                <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ fontFamily:"'Sora',sans-serif", fontWeight:700 }}>
                  {saving ? <><span className="spinner-sm" /> Renewing…</> : "🔄 Renew & Activate"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Staff Modal ───────────────────────────────────────────────────────── */
function StaffModal({ restaurant, onClose }) {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]       = useState({ name:"", username:"", email:"", password:"", role:"admin" });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const load = useCallback(async () => {
    try { const res = await API.get(`/super-admin/restaurants/${restaurant.id}/admins`); setUsers(res.data); } catch {}
    setLoading(false);
  }, [restaurant.id]);
  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await API.post(`/super-admin/restaurants/${restaurant.id}/admins`, form);
      setForm({ name:"", username:"", email:"", password:"", role:"admin" });
      await load();
    } catch (err) { setError(err.response?.data?.msg || "Failed to create user"); }
    setSaving(false);
  };

  const handleDelete = async (uid) => {
    if (!window.confirm("Delete this user?")) return;
    try { await API.delete(`/super-admin/restaurants/${restaurant.id}/admins/${uid}`); await load(); } catch {}
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:640, fontFamily:"'Sora',sans-serif" }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontWeight:800 }}>👥 Staff — {restaurant.name}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="section-title">Add Staff Account</div>
          {error && <div className="alert alert-error">⚠️ {error}</div>}
          <form onSubmit={handleCreate} style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div className="form-grid form-grid-2">
              <div className="form-group"><label>Full Name *</label><input required placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="form-group"><label>Username *</label><input required placeholder="login username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></div>
              <div className="form-group"><label>Password *</label><input required type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
              <div className="form-group">
                <label>Role *</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="admin">Admin</option>
                  <option value="waiter">Waiter</option>
                  <option value="kitchen">Kitchen</option>
                  <option value="cashcounter">Cash Counter</option>
                </select>
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving} style={{ fontFamily:"'Sora',sans-serif" }}>
                {saving ? <><span className="spinner-sm" /> Adding…</> : "Add Staff"}
              </button>
            </div>
          </form>
          <div className="divider" />
          <div className="section-title">Current Staff ({users.length})</div>
          {loading ? <div className="spinner" /> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight:600 }}>{u.name}</td>
                      <td style={{ fontFamily:"monospace", color:"var(--text-muted)" }}>{u.username}</td>
                      <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                      <td><span className={`badge badge-${u.is_active ? "active" : "inactive"}`}>{u.is_active ? "Active" : "Inactive"}</span></td>
                      <td><button className="btn btn-ghost btn-sm" style={{ color:"var(--danger)" }} onClick={() => handleDelete(u.id)}>🗑️</button></td>
                    </tr>
                  ))}
                  {users.length === 0 && <tr><td colSpan="5" style={{ textAlign:"center", color:"var(--text-muted)", padding:24 }}>No staff yet</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}