import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../api";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

/* ── KEYFRAMES ── */
@keyframes bs-fadein  { from{opacity:0;transform:translateY(18px);} to{opacity:1;transform:translateY(0);} }
@keyframes bs-pop     { from{opacity:0;transform:scale(0.86);} to{opacity:1;transform:scale(1);} }
@keyframes bs-spin    { to{transform:rotate(360deg);} }
@keyframes bs-float   { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-9px);} }
@keyframes bs-orb1    { 0%,100%{transform:translate(0,0);} 50%{transform:translate(35px,-28px);} }
@keyframes bs-orb2    { 0%,100%{transform:translate(0,0);} 50%{transform:translate(-28px,35px);} }
@keyframes bs-glow    { 0%,100%{opacity:.7;} 50%{opacity:1;} }
@keyframes bs-shimmer { 0%{background-position:-200% center;} 100%{background-position:200% center;} }

/* ── ROOT ── */
.bs {
  min-height:100vh;min-height:100dvh;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  background:#07080c;
  font-family:'DM Sans',system-ui,sans-serif;
  padding:clamp(16px,4vw,32px);
  position:relative;overflow:hidden;
}

/* ── AMBIENT BACKGROUND ── */
.bs-bg { position:absolute;inset:0;pointer-events:none;z-index:0; }

/* Grid mesh */
.bs-mesh {
  position:absolute;inset:0;
  background-image:
    linear-gradient(rgba(255,255,255,.028) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.028) 1px,transparent 1px);
  background-size:40px 40px;
  mask-image:radial-gradient(ellipse 70% 70% at 50% 50%,black 0%,transparent 100%);
}

/* Orbs */
.bs-orb {
  position:absolute;border-radius:50%;filter:blur(80px);animation:bs-glow 4s ease infinite;
}
.bs-orb-a {
  width:clamp(200px,40vw,480px);height:clamp(200px,40vw,480px);
  top:-15%;right:-10%;
  background:radial-gradient(circle,rgba(245,166,35,.13) 0%,transparent 70%);
  animation:bs-orb1 10s ease-in-out infinite, bs-glow 4s ease infinite;
}
.bs-orb-b {
  width:clamp(160px,35vw,400px);height:clamp(160px,35vw,400px);
  bottom:-12%;left:-8%;
  background:radial-gradient(circle,rgba(34,211,238,.13) 0%,transparent 70%);
  animation:bs-orb2 12s ease-in-out infinite, bs-glow 5s 1s ease infinite;
}
.bs-orb-c {
  width:clamp(120px,25vw,280px);height:clamp(120px,25vw,280px);
  top:50%;left:50%;transform:translate(-50%,-50%);
  background:radial-gradient(circle,rgba(139,92,246,.055) 0%,transparent 70%);
}

/* ── CONTENT WRAPPER ── */
.bs-wrap { position:relative;z-index:1;width:100%;max-width:580px; }

/* ── HEADER ROW ── */
.bs-hdr {
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:clamp(28px,5vw,52px);
  animation:bs-fadein .5s .05s ease both;
}

.bs-brand { display:flex;align-items:center;gap:10px; }
.bs-brand-icon {
  width:clamp(38px,6vw,48px);height:clamp(38px,6vw,48px);border-radius:12px;
  background:linear-gradient(140deg,#f5a623,#d97706);
  display:flex;align-items:center;justify-content:center;
  font-size:clamp(18px,3vw,24px);
  box-shadow:0 6px 22px rgba(245,166,35,.35);
  position:relative;overflow:hidden;flex-shrink:0;
}
.bs-brand-icon::after { content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.22) 0%,transparent 55%); }
.bs-brand-icon img { width:100%;height:100%;object-fit:cover;border-radius:inherit; }
.bs-brand-text { line-height:1.1; }
.bs-brand-name { font-size:clamp(16px,3vw,20px);font-weight:800;color:#fff;letter-spacing:-.3px; }
.bs-brand-tag  { font-size:10px;color:rgba(255,255,255,.35);font-weight:600;text-transform:uppercase;letter-spacing:.8px; }

.bs-logout-pill {
  display:flex;align-items:center;gap:5px;
  background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
  border-radius:30px;padding:7px 14px;
  font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;
  color:rgba(255,255,255,.35);cursor:pointer;transition:all .2s;
}
.bs-logout-pill:hover { background:rgba(244,63,94,.12);border-color:rgba(244,63,94,.3);color:#f43f5e; }

/* ── WELCOME BLOCK ── */
.bs-welcome { text-align:center;margin-bottom:clamp(24px,4vw,44px);animation:bs-fadein .5s .12s ease both; }
.bs-rest-name {
  font-size:clamp(22px,5vw,34px);font-weight:800;
  letter-spacing:-.8px;line-height:1.1;margin-bottom:8px;
  background:linear-gradient(135deg,#fff 30%,rgba(255,255,255,.55));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.bs-welcome-sub { font-size:clamp(13px,2vw,15px);color:rgba(255,255,255,.38);font-weight:500;line-height:1.5; }
.bs-welcome-name { color:rgba(255,255,255,.65);font-weight:700; }

/* ── STATION CARDS ── */
.bs-cards {
  display:grid;
  grid-template-columns:repeat(2, 1fr);
  gap:clamp(10px,2vw,18px);
  margin-bottom:clamp(20px,3vw,36px);
}
@media(max-width:480px){
  .bs-cards { grid-template-columns:1fr;max-width:320px;margin-left:auto;margin-right:auto; }
}

.bs-card {
  background:rgba(255,255,255,.035);
  border:1px solid rgba(255,255,255,.075);
  border-radius:clamp(16px,2vw,22px);
  padding:clamp(22px,3.5vw,32px) clamp(18px,3vw,26px);
  cursor:pointer;text-align:center;
  transition:transform .26s cubic-bezier(.34,1.56,.64,1), box-shadow .26s, border-color .26s;
  position:relative;overflow:hidden;
  animation:bs-fadein .5s ease both;
}
.bs-card:nth-child(2){ animation-delay:.1s; }

/* Hover glow layer */
.bs-card::before {
  content:'';position:absolute;inset:0;border-radius:inherit;
  opacity:0;transition:opacity .26s;pointer-events:none;
}
.bs-card-k::before { background:radial-gradient(ellipse at 50% -10%,rgba(245,166,35,.14) 0%,transparent 65%); }
.bs-card-b::before { background:radial-gradient(ellipse at 50% -10%,rgba(34,211,238,.13) 0%,transparent 65%); }

.bs-card:hover { transform:translateY(-6px); }
.bs-card-k:hover { border-color:rgba(245,166,35,.45);box-shadow:0 18px 50px rgba(245,166,35,.18); }
.bs-card-b:hover { border-color:rgba(34,211,238,.4); box-shadow:0 18px 50px rgba(34,211,238,.18); }
.bs-card:hover::before { opacity:1; }
.bs-card:active { transform:scale(.97); }

/* Emoji bubble */
.bs-card-bubble {
  width:clamp(56px,8vw,72px);height:clamp(56px,8vw,72px);border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-size:clamp(24px,4vw,34px);
  margin:0 auto clamp(14px,2vw,20px);
  position:relative;transition:transform .3s;
}
.bs-card:hover .bs-card-bubble { animation:bs-float 2.2s ease infinite; }
.bs-card-k .bs-card-bubble { background:rgba(245,166,35,.12);box-shadow:0 0 28px rgba(245,166,35,.2); }
.bs-card-b .bs-card-bubble { background:rgba(34,211,238,.1); box-shadow:0 0 28px rgba(34,211,238,.18); }

/* Card text */
.bs-card-title { font-size:clamp(17px,2.5vw,21px);font-weight:800;color:#fff;margin-bottom:6px;letter-spacing:-.3px; }
.bs-card-desc  { font-size:clamp(11.5px,1.5vw,13px);color:rgba(255,255,255,.38);line-height:1.6;margin-bottom:clamp(16px,2.5vw,24px); }

/* CTA chip */
.bs-card-cta {
  display:inline-flex;align-items:center;gap:6px;
  padding:8px 18px;border-radius:30px;
  font-size:clamp(11px,1.5vw,12px);font-weight:700;letter-spacing:.2px;
  transition:transform .2s;
}
.bs-card-k .bs-card-cta { background:rgba(245,166,35,.15);color:#f5a623;border:1px solid rgba(245,166,35,.3); }
.bs-card-b .bs-card-cta { background:rgba(34,211,238,.1); color:#22d3ee;border:1px solid rgba(34,211,238,.28); }
.bs-card:hover .bs-card-cta { transform:translateX(4px); }

/* ── DIVIDER ── */
.bs-divider {
  display:flex;align-items:center;gap:12px;margin-bottom:clamp(16px,2.5vw,26px);
  animation:bs-fadein .5s .3s ease both;
}
.bs-divider-line { flex:1;height:1px;background:rgba(255,255,255,.065); }
.bs-divider-txt  { font-size:10px;color:rgba(255,255,255,.2);font-weight:600;text-transform:uppercase;letter-spacing:1.2px; }

/* ── FOOTER ── */
.bs-footer { text-align:center;animation:bs-fadein .5s .4s ease both; }
.bs-footer-txt { font-size:11px;color:rgba(255,255,255,.15); }
.bs-footer-txt a { color:rgba(139,92,246,.7);text-decoration:none;font-weight:700; }
.bs-footer-txt a:hover { color:#8b5cf6; }

/* ── MODAL ── */
.bs-modal-bg {
  position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(10px);
  display:flex;align-items:center;justify-content:center;z-index:9999;
  padding:20px;animation:bs-fadein .2s ease;
}
.bs-modal {
  background:#131720;border:1px solid rgba(255,255,255,.1);border-radius:22px;
  padding:clamp(24px,4vw,36px) clamp(20px,3.5vw,30px);
  width:100%;max-width:320px;text-align:center;
  box-shadow:0 24px 60px rgba(0,0,0,.65);animation:bs-pop .25s cubic-bezier(.34,1.56,.64,1);
}
.bs-modal-ico  { font-size:44px;margin-bottom:12px; }
.bs-modal-h    { font-size:20px;font-weight:800;color:#f0f2f8;margin-bottom:7px; }
.bs-modal-body { font-size:14px;color:#6b7a99;margin-bottom:24px;line-height:1.5; }
.bs-modal-btns { display:flex;gap:10px;justify-content:center; }
.bs-modal-cancel  { padding:10px 24px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:transparent;color:#94a3b8;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;transition:all .15s; }
.bs-modal-cancel:hover  { background:rgba(255,255,255,.05); }
.bs-modal-confirm { padding:10px 24px;border-radius:10px;border:none;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:700;box-shadow:0 4px 14px rgba(239,68,68,.35);transition:all .15s; }
.bs-modal-confirm:hover { filter:brightness(1.1); }

/* Touch target minimum sizes */
@media(hover:none){
  .bs-card { min-height:160px; }
  .bs-card-cta { padding:10px 20px; }
}
`;

export default function KitchenBarSelect() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [showLogout, setShowLogout] = useState(false);

  const confirmLogout = async () => {
    try { await API.post("/auth/logout"); } catch {}
    logout(); navigate("/kitchen");
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="bs">
        {/* Background */}
        <div className="bs-bg">
          <div className="bs-mesh" />
          <div className="bs-orb bs-orb-a" />
          <div className="bs-orb bs-orb-b" />
          <div className="bs-orb bs-orb-c" />
        </div>

        {/* Logout Modal */}
        {showLogout && (
          <div className="bs-modal-bg">
            <div className="bs-modal">
              <div className="bs-modal-ico">🚪</div>
              <div className="bs-modal-h">Sign out?</div>
              <div className="bs-modal-body">You'll need to sign back in to manage orders.</div>
              <div className="bs-modal-btns">
                <button className="bs-modal-cancel"  onClick={() => setShowLogout(false)}>Cancel</button>
                <button className="bs-modal-confirm" onClick={confirmLogout}>Yes, sign out</button>
              </div>
            </div>
          </div>
        )}

        <div className="bs-wrap">
          {/* Header row: brand + logout */}
          <div className="bs-hdr">
            <div className="bs-brand">
              <div className="bs-brand-icon">
                {user?.restaurant_logo
                  ? <img src={user.restaurant_logo} alt="logo" />
                  : "🍽️"}
              </div>
              <div className="bs-brand-text">
                <div className="bs-brand-name">DineX</div>
                <div className="bs-brand-tag">Kitchen OS</div>
              </div>
            </div>
            <button className="bs-logout-pill" onClick={() => setShowLogout(true)}>
              🚪 Sign out
            </button>
          </div>

          {/* Welcome */}
          <div className="bs-welcome">
            <div className="bs-rest-name">{user?.restaurant_name || "Your Restaurant"}</div>
            <div className="bs-welcome-sub">
              Welcome back, <span className="bs-welcome-name">{user?.name || "Chef"}</span><br />
              Choose your station to get started
            </div>
          </div>

          {/* Station cards */}
          <div className="bs-cards">
            <div className="bs-card bs-card-k" onClick={() => navigate("/kitchen/panel?station=kitchen")}>
              <div className="bs-card-bubble">👨‍🍳</div>
              <div className="bs-card-title">Kitchen</div>
              <div className="bs-card-desc">Manage food orders and track cooking in real-time</div>
              <div className="bs-card-cta">🍛 Open Kitchen →</div>
            </div>

            <div className="bs-card bs-card-b" onClick={() => navigate("/kitchen/panel?station=bar")}>
              <div className="bs-card-bubble">🍹</div>
              <div className="bs-card-title">Bar</div>
              <div className="bs-card-desc">Fulfill drink orders and keep the bar flowing</div>
              <div className="bs-card-cta">🥤 Open Bar →</div>
            </div>
          </div>

          {/* Divider + footer */}
          <div className="bs-divider">
            <div className="bs-divider-line" />
            <span className="bs-divider-txt">powered by</span>
            <div className="bs-divider-line" />
          </div>

          <div className="bs-footer">
            <div className="bs-footer-txt">
              <a href="https://www.saugatbohara.com.np/Dinex.html" target="_blank" rel="noopener noreferrer">DineX</a>
              {" "}· Restaurant Management Platform
            </div>
          </div>
        </div>
      </div>
    </>
  );
}