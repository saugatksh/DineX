import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../api";

/* ─── BAR categories ─────────────────────────────────────────────────────── */
const BAR_CATS = ["drink","drinks","beverage","beverages","bar","cocktail",
  "mocktail","juice","beer","wine","alcohol","soft drink","soft drinks"];

function isBarItem(cat = "", sub = "") {
  const c = (cat || "").toLowerCase().trim();
  const s = (sub || "").toLowerCase().trim();
  return BAR_CATS.includes(c) || BAR_CATS.includes(s);
}

function timeSince(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`;
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
}

/* ─── INJECTED CSS ────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=DM+Mono:wght@400;500&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

/* ── TOKEN SYSTEM ── */
:root{
  --f: 'DM Sans', system-ui, sans-serif;
  --fm: 'DM Mono', monospace;
  --ease-spring: cubic-bezier(0.34,1.56,0.64,1);
  --ease-out: cubic-bezier(0.22,1,0.36,1);
}

/* ── DARK (default) ── */
html{
  --bg:       #07080c;
  --bg1:      #0c0e14;
  --bg2:      #111520;
  --panel:    #0f1219;
  --card:     #131720;
  --card2:    #171c28;
  --line:     rgba(255,255,255,0.06);
  --line2:    rgba(255,255,255,0.10);
  --line3:    rgba(255,255,255,0.16);
  --t1:       #f0f2f8;
  --t2:       #7a84a0;
  --t3:       #40485e;
  /* accents */
  --amber:    #f5a623;
  --amber2:   #fbbf24;
  --amber-d:  rgba(245,166,35,0.18);
  --amber-s:  rgba(245,166,35,0.08);
  --amber-glow: 0 0 28px rgba(245,166,35,0.22);
  --cyan:     #22d3ee;
  --cyan2:    #67e8f9;
  --cyan-d:   rgba(34,211,238,0.18);
  --cyan-s:   rgba(34,211,238,0.07);
  --cyan-glow: 0 0 28px rgba(34,211,238,0.22);
  --green:    #10b981;
  --green-d:  rgba(16,185,129,0.15);
  --red:      #f43f5e;
  --red-d:    rgba(244,63,94,0.14);
  --violet:   #8b5cf6;
  --violet-d: rgba(139,92,246,0.15);
  --orange:   #fb923c;
  --orange-d: rgba(251,146,60,0.15);
  --scrim:    rgba(0,0,0,0.75);
}

/* ── LIGHT OVERRIDE ── */
[data-kp-theme="light"]{
  --bg:       #edf0f7;
  --bg1:      #e4e8f2;
  --bg2:      #dce1ee;
  --panel:    #ffffff;
  --card:     #ffffff;
  --card2:    #f6f8ff;
  --line:     rgba(0,0,0,0.06);
  --line2:    rgba(0,0,0,0.10);
  --line3:    rgba(0,0,0,0.16);
  --t1:       #0d1020;
  --t2:       #5a6282;
  --t3:       #9ba3bc;
  --amber:    #d97706;
  --amber2:   #f59e0b;
  --amber-d:  rgba(217,119,6,0.14);
  --amber-s:  rgba(217,119,6,0.07);
  --amber-glow: 0 0 20px rgba(217,119,6,0.15);
  --cyan:     #0891b2;
  --cyan2:    #06b6d4;
  --cyan-d:   rgba(8,145,178,0.12);
  --cyan-s:   rgba(8,145,178,0.06);
  --cyan-glow: 0 0 20px rgba(8,145,178,0.15);
  --green:    #059669;
  --green-d:  rgba(5,150,105,0.10);
  --red:      #e11d48;
  --red-d:    rgba(225,29,72,0.10);
  --violet:   #7c3aed;
  --violet-d: rgba(124,58,237,0.10);
  --orange:   #ea580c;
  --orange-d: rgba(234,88,12,0.10);
  --scrim:    rgba(0,0,0,0.5);
}

body,html{ font-family:var(--f); background:var(--bg); color:var(--t1); -webkit-font-smoothing:antialiased; }

/* ── KEYFRAMES ── */
@keyframes kp-spin { to{transform:rotate(360deg);} }
@keyframes kp-in { from{opacity:0;transform:translateY(10px);} to{opacity:1;transform:translateY(0);} }
@keyframes kp-pop { from{opacity:0;transform:scale(0.88);} to{opacity:1;transform:scale(1);} }
@keyframes kp-blink { 0%,100%{opacity:1;} 50%{opacity:0.38;} }
@keyframes kp-border-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(244,63,94,0);} 50%{box-shadow:0 0 0 3px rgba(244,63,94,0.35);} }
@keyframes kp-slide-r { from{transform:translateX(-6px);opacity:0;} to{transform:translateX(0);opacity:1;} }
@keyframes kp-count { from{transform:scale(0.6);opacity:0;} to{transform:scale(1);opacity:1;} }
@keyframes kp-live { 0%{box-shadow:0 0 0 0 rgba(16,185,129,0.5);} 70%{box-shadow:0 0 0 8px rgba(16,185,129,0);} 100%{box-shadow:0 0 0 0 rgba(16,185,129,0);} }

/* ── UTILITY ── */
.kp-spin { width:20px;height:20px;border:2px solid var(--line2);border-top-color:var(--amber);border-radius:50%;animation:kp-spin .7s linear infinite;flex-shrink:0; }
.kp-spin-sm { width:12px;height:12px;border:2px solid rgba(255,255,255,.2);border-top-color:#fff;border-radius:50%;animation:kp-spin .7s linear infinite;display:inline-block; }
.kp-blink { animation:kp-blink 1.2s ease infinite; }

/* ═══════════════════════════════════════════
   HEADER
═══════════════════════════════════════════ */
.kp-hdr {
  position:sticky;top:0;z-index:300;
  background:var(--panel);
  border-bottom:1px solid var(--line);
  /* subtle noise-like top line */
  box-shadow:0 1px 0 var(--line2), inset 0 1px 0 var(--line3);
}

.kp-hdr-inner {
  display:grid;
  grid-template-columns: auto 1fr auto;
  align-items:center;
  gap:12px;
  padding:0 20px;
  height:60px;
}

/* Left — logo + title */
.kp-hdr-l { display:flex;align-items:center;gap:10px;min-width:0; }

.kp-logo {
  width:38px;height:38px;border-radius:10px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  font-size:18px;position:relative;overflow:hidden;transition:box-shadow .3s;
}
.kp-logo img { width:100%;height:100%;object-fit:cover;border-radius:inherit; }
.kp-logo::after { content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.18) 0%,transparent 55%);pointer-events:none; }
.kp-logo-food { background:linear-gradient(140deg,#f5a623,#d97706); box-shadow:0 3px 14px rgba(245,166,35,.38); }
.kp-logo-bar  { background:linear-gradient(140deg,#22d3ee,#0891b2); box-shadow:0 3px 14px rgba(34,211,238,.38); }

.kp-hdr-info { min-width:0; }
.kp-hdr-title { font-size:15px;font-weight:800;color:var(--t1);letter-spacing:-.3px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
.kp-hdr-sub   { font-size:11px;color:var(--t3);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }

/* Center — station toggle */
.kp-hdr-c { display:flex;justify-content:center; }
.kp-seg {
  display:flex;background:var(--bg1);border:1px solid var(--line2);
  border-radius:10px;padding:3px;gap:2px;
}
.kp-seg-btn {
  padding:7px 16px;border-radius:7px;border:none;background:transparent;
  font-family:var(--f);font-size:12.5px;font-weight:700;cursor:pointer;
  transition:all .2s;color:var(--t3);display:flex;align-items:center;gap:5px;white-space:nowrap;
}
.kp-seg-btn:hover:not(.on-food):not(.on-bar) { color:var(--t2);background:var(--bg2); }
.kp-seg-btn.on-food { background:linear-gradient(135deg,#f5a623,#d97706);color:#fff;box-shadow:0 2px 10px rgba(245,166,35,.4); }
.kp-seg-btn.on-bar  { background:linear-gradient(135deg,#22d3ee,#0891b2);color:#fff;box-shadow:0 2px 10px rgba(34,211,238,.4); }

/* Right — actions */
.kp-hdr-r { display:flex;align-items:center;gap:6px; }

.kp-clock-badge {
  display:flex;align-items:center;gap:6px;
  background:var(--bg1);border:1px solid var(--line2);border-radius:8px;
  padding:6px 10px;font-family:var(--fm);font-size:12px;font-weight:500;color:var(--t2);
  white-space:nowrap;
}
.kp-clock-time { color:var(--amber);font-weight:500; }

.kp-ibtn {
  width:34px;height:34px;border-radius:9px;border:1px solid var(--line2);
  background:var(--bg1);cursor:pointer;display:flex;align-items:center;justify-content:center;
  font-size:15px;transition:all .18s;color:var(--t2);flex-shrink:0;
}
.kp-ibtn:hover { background:var(--card2);border-color:var(--line3);color:var(--t1);transform:scale(1.06); }
.kp-ibtn:active { transform:scale(.94); }
.kp-ibtn.spinning span { display:inline-block;animation:kp-spin .5s linear; }

.kp-logout-btn {
  display:flex;align-items:center;gap:5px;padding:6px 12px;border-radius:9px;
  border:1px solid var(--line2);background:transparent;
  font-family:var(--f);font-size:12px;font-weight:600;color:var(--t2);cursor:pointer;transition:all .18s;
  white-space:nowrap;
}
.kp-logout-btn:hover { background:var(--red-d);border-color:rgba(244,63,94,.3);color:var(--red); }

/* ── MOBILE: collapse header to 2 rows ── */
@media(max-width:700px){
  .kp-hdr-inner { grid-template-columns:auto 1fr;grid-template-rows:auto auto;height:auto;padding:10px 14px;gap:8px; }
  .kp-hdr-l { grid-column:1;grid-row:1; }
  .kp-hdr-r { grid-column:2;grid-row:1;justify-content:flex-end; }
  .kp-hdr-c { grid-column:1/-1;grid-row:2; }
  .kp-seg-btn { padding:7px 14px; font-size:12px; }
  .kp-clock-badge { display:none; }
  .kp-logout-btn span.kp-logout-lbl { display:none; }
}
@media(max-width:400px){
  .kp-seg-btn { padding:6px 10px; font-size:11.5px; }
}

/* ═══════════════════════════════════════════
   COMMAND BAR  (stats + greeting)
═══════════════════════════════════════════ */
.kp-cmd {
  background:var(--bg1);border-bottom:1px solid var(--line);
  padding:0 20px;
  display:flex;align-items:center;gap:12px;overflow-x:auto;
  scrollbar-width:none;min-height:52px;
}
.kp-cmd::-webkit-scrollbar{display:none;}

.kp-stat {
  display:flex;align-items:center;gap:8px;flex-shrink:0;
  padding:8px 14px;border-radius:10px;border:1px solid var(--line);
  background:var(--card);animation:kp-count .3s var(--ease-spring) both;
  cursor:default;transition:transform .2s,box-shadow .2s;
}
.kp-stat:hover { transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.2); }
.kp-stat-num { font-size:22px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums; }
.kp-stat-lbl { font-size:10px;color:var(--t3);font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-top:1px; }
.kp-stat.s-new  { border-color:var(--amber-d);background:var(--amber-s); } .kp-stat.s-new .kp-stat-num  { color:var(--amber); }
.kp-stat.s-cook { border-color:var(--cyan-d); background:var(--cyan-s);  } .kp-stat.s-cook .kp-stat-num { color:var(--cyan);  }
.kp-stat.s-all  { border-color:var(--line);   background:var(--card);    } .kp-stat.s-all  .kp-stat-num { color:var(--t1);   }

.kp-cmd-sep { width:1px;height:28px;background:var(--line2);flex-shrink:0; }

.kp-greet { display:flex;align-items:center;gap:6px;font-size:13px;color:var(--t2);font-weight:500;white-space:nowrap; }
.kp-greet strong { color:var(--t1); }

.kp-live-dot-wrap { margin-left:auto;flex-shrink:0;display:flex;align-items:center;gap:6px;font-size:11px;color:var(--t3); }
.kp-live-dot { width:7px;height:7px;border-radius:50%;background:var(--green);animation:kp-live 2s ease infinite; }

@media(max-width:600px){
  .kp-cmd { padding:0 14px;gap:8px;min-height:44px; }
  .kp-stat { padding:6px 10px; }
  .kp-stat-num { font-size:18px; }
  .kp-greet { display:none; }
}

/* ═══════════════════════════════════════════
   BODY / GRID
═══════════════════════════════════════════ */
.kp-body {
  flex:1;overflow-y:auto;overflow-x:hidden;
  padding:20px;
  display:flex;flex-direction:column;gap:28px;
}

/* Section header */
.kp-sec-hdr { display:flex;align-items:center;gap:10px;margin-bottom:14px; }
.kp-sec-pill {
  display:inline-flex;align-items:center;gap:6px;
  padding:5px 14px;border-radius:30px;
  font-size:11.5px;font-weight:800;letter-spacing:.3px;text-transform:uppercase;flex-shrink:0;
}
.sec-new  .kp-sec-pill { background:var(--amber-d);color:var(--amber);border:1px solid rgba(245,166,35,.3); }
.sec-cook .kp-sec-pill { background:var(--cyan-d); color:var(--cyan); border:1px solid rgba(34,211,238,.25); }
.kp-sec-line { flex:1;height:1px;background:var(--line); }

/* Card grid */
.kp-grid {
  display:grid;
  grid-template-columns:repeat(auto-fill, minmax(min(100%, 320px), 1fr));
  gap:16px;
}
@media(max-width:400px){ .kp-grid { grid-template-columns:1fr; gap:12px; } }

/* ═══════════════════════════════════════════
   ORDER CARD
═══════════════════════════════════════════ */
.kp-card {
  background:var(--card);
  border:1px solid var(--line);
  border-radius:18px;
  overflow:hidden;
  animation:kp-in .28s var(--ease-out) both;
  transition:transform .22s var(--ease-spring),box-shadow .22s,border-color .2s;
  display:flex;flex-direction:column;
}
.kp-card:hover { transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,.28); }
.kp-card.urg-warn { border-color:rgba(245,166,35,.5); }
.kp-card.urg-crit { animation:kp-in .28s var(--ease-out) both,kp-border-pulse 1.6s ease infinite; border-color:rgba(244,63,94,.5); }

/* Top glow line */
.kp-card-glow {
  height:2px;width:100%;flex-shrink:0;
}
.kp-card-glow.gl-food { background:linear-gradient(90deg,#f5a623 0%,transparent 70%); }
.kp-card-glow.gl-bar  { background:linear-gradient(90deg,#22d3ee 0%,transparent 70%); }
.kp-card-glow.gl-take { background:linear-gradient(90deg,#fb923c 0%,transparent 70%); }

/* Banner */
.kp-banner {
  padding:11px 15px;
  display:flex;align-items:center;gap:9px;
  position:relative;overflow:hidden;
}
.kp-banner::after { content:'';position:absolute;inset:0;background:linear-gradient(to right,rgba(255,255,255,.06),transparent);pointer-events:none; }
.kp-banner-icon { font-size:17px;flex-shrink:0;z-index:1; }
.kp-banner-tbl { font-size:15px;font-weight:800;color:#fff;letter-spacing:-.2px;z-index:1; }
.kp-banner-sub { font-size:11px;color:rgba(255,255,255,.65);z-index:1; }
.kp-banner-num {
  margin-left:auto;flex-shrink:0;
  font-family:var(--fm);font-size:11px;font-weight:500;
  background:rgba(0,0,0,.22);color:rgba(255,255,255,.8);
  padding:2px 8px;border-radius:20px;z-index:1;
}

/* Meta row */
.kp-card-meta {
  padding:9px 14px 6px;
  display:flex;align-items:center;gap:6px;flex-wrap:wrap;
}
.kp-tag {
  display:inline-flex;align-items:center;gap:3px;
  font-size:10.5px;font-weight:600;padding:2.5px 8px;border-radius:20px;flex-shrink:0;
}
.tag-waiter  { background:var(--violet-d);color:var(--violet); }
.tag-section { background:var(--cyan-s);  color:var(--cyan);   }
.tag-urg     { background:var(--red-d);   color:var(--red);    animation:kp-blink 1s ease infinite; }
.tag-late    { background:var(--amber-d); color:var(--amber);  }

.kp-timer {
  margin-left:auto;flex-shrink:0;
  display:flex;align-items:center;gap:4px;
  font-family:var(--fm);font-size:11px;font-weight:500;
  padding:3px 9px;border-radius:20px;border:1px solid var(--line2);
  background:var(--bg1);color:var(--t2);
}
.kp-timer.t-warn { color:var(--amber);background:var(--amber-s);border-color:rgba(245,166,35,.3); }
.kp-timer.t-urg  { color:var(--red);  background:var(--red-d);  border-color:rgba(244,63,94,.35); animation:kp-blink .9s ease infinite; }

/* Items */
.kp-items { flex:1; }
.kp-item {
  display:flex;align-items:flex-start;gap:10px;
  padding:10px 14px;
  border-top:1px solid var(--line);
  transition:background .15s;
}
.kp-item:hover { background:rgba(255,255,255,.025); }
.kp-item.done  { opacity:.45; }

.kp-item-indicator {
  width:3px;border-radius:3px;align-self:stretch;flex-shrink:0;min-height:20px;
  transition:background .2s;
}
.ind-pending   { background:var(--amber); }
.ind-preparing { background:var(--cyan);  }
.ind-ready     { background:var(--green); }

.kp-item-body { flex:1;min-width:0; }
.kp-item-name { font-size:13.5px;font-weight:700;color:var(--t1);line-height:1.3; }
.kp-item-name.crossed { text-decoration:line-through;color:var(--t3); }
.kp-item-cat  { font-size:10.5px;color:var(--t3);margin-top:1px;text-transform:capitalize; }
.kp-item-note {
  display:flex;align-items:flex-start;gap:5px;
  margin-top:5px;padding:5px 9px;
  background:rgba(251,146,60,.1);border:1px solid rgba(251,146,60,.25);
  border-radius:7px;font-size:11px;color:var(--orange);font-weight:600;line-height:1.4;
}

.kp-item-r { display:flex;align-items:center;gap:6px;flex-shrink:0; }
.kp-qty {
  font-family:var(--fm);font-size:13px;font-weight:500;
  min-width:32px;height:30px;display:flex;align-items:center;justify-content:center;
  border-radius:8px;flex-shrink:0;
}
.qty-food { background:var(--amber-d);color:var(--amber); }
.qty-bar  { background:var(--cyan-d); color:var(--cyan);  }

.kp-act {
  height:30px;min-width:68px;padding:0 10px;
  border-radius:8px;border:1px solid;
  font-family:var(--f);font-size:11px;font-weight:700;cursor:pointer;
  transition:all .16s;display:flex;align-items:center;justify-content:center;gap:3px;
  white-space:nowrap;
}
.kp-act:hover:not(:disabled) { filter:brightness(1.18);transform:scale(1.04); }
.kp-act:active:not(:disabled) { transform:scale(.95); }
.kp-act:disabled { opacity:.45;cursor:default; }
.act-pending   { background:var(--amber-d);color:var(--amber);border-color:rgba(245,166,35,.35); }
.act-preparing { background:var(--cyan-d); color:var(--cyan); border-color:rgba(34,211,238,.3);  }
.act-ready     { background:var(--green-d);color:var(--green);border-color:rgba(16,185,129,.3); cursor:default!important; }

/* Order notes */
.kp-order-note {
  margin:0 14px 10px;padding:8px 11px;
  background:var(--amber-s);border:1px solid rgba(245,166,35,.22);
  border-radius:9px;font-size:12px;color:var(--amber);font-weight:600;
  display:flex;align-items:flex-start;gap:6px;line-height:1.5;
}

/* Card footer */
.kp-foot {
  padding:11px 14px;border-top:1px solid var(--line);
  background:var(--card2);
  display:flex;gap:8px;flex-shrink:0;
}
.kp-foot-btn {
  flex:1;padding:11px 12px;border-radius:11px;border:none;
  font-family:var(--f);font-size:13px;font-weight:700;cursor:pointer;
  display:flex;align-items:center;justify-content:center;gap:6px;
  transition:all .2s var(--ease-spring);
}
.kp-foot-btn:hover:not(:disabled) { filter:brightness(1.1);transform:translateY(-1px); }
.kp-foot-btn:active:not(:disabled) { transform:scale(.97); }
.kp-foot-btn:disabled { opacity:.55;cursor:not-allowed; }
.fb-start   { background:linear-gradient(135deg,#f5a623,#d97706);color:#fff;box-shadow:0 4px 16px rgba(245,166,35,.32); }
.fb-ready   { background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:#fff;box-shadow:0 4px 16px rgba(139,92,246,.32); }
.fb-done-food { border:1px solid rgba(16,185,129,.35);background:var(--green-d);color:var(--green);box-shadow:none; cursor:default; }
.fb-done-bar  { border:1px solid rgba(34,211,238,.3); background:var(--cyan-d); color:var(--cyan); box-shadow:none; cursor:default; }

/* ═══════════════════════════════════════════
   EMPTY + LOADING
═══════════════════════════════════════════ */
.kp-empty {
  flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:60px 20px;text-align:center;animation:kp-pop .4s var(--ease-spring);
}
.kp-empty-orb {
  width:96px;height:96px;border-radius:50%;
  background:var(--card);border:1.5px solid var(--line2);
  display:flex;align-items:center;justify-content:center;font-size:42px;
  margin-bottom:22px;position:relative;
}
.kp-empty-orb::before {
  content:'';position:absolute;inset:-10px;border-radius:50%;
  border:1px dashed var(--line2);
}
.kp-empty-h  { font-size:18px;font-weight:800;color:var(--t2);margin-bottom:7px; }
.kp-empty-p  { font-size:13px;color:var(--t3);line-height:1.6;max-width:260px; }

.kp-loading  { flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px; }
.kp-loading-t{ font-size:13px;color:var(--t3);font-weight:600; }

/* ═══════════════════════════════════════════
   MODAL
═══════════════════════════════════════════ */
.kp-modal-bg {
  position:fixed;inset:0;background:var(--scrim);backdrop-filter:blur(8px);
  display:flex;align-items:center;justify-content:center;z-index:9999;
  padding:20px;animation:kp-in .2s ease;
}
.kp-modal {
  background:var(--card);border:1px solid var(--line2);border-radius:22px;
  padding:36px 28px;width:100%;max-width:340px;text-align:center;
  box-shadow:0 24px 60px rgba(0,0,0,.55);animation:kp-pop .25s var(--ease-spring);
}
.kp-modal-ico  { font-size:46px;margin-bottom:14px; }
.kp-modal-h    { font-size:21px;font-weight:800;color:var(--t1);margin-bottom:7px; }
.kp-modal-body { font-size:14px;color:var(--t2);margin-bottom:26px;line-height:1.55; }
.kp-modal-btns { display:flex;gap:10px;justify-content:center; }
.kp-modal-cancel  { padding:11px 26px;border-radius:11px;border:1px solid var(--line2);background:transparent;color:var(--t2);cursor:pointer;font-family:var(--f);font-size:14px;font-weight:600;transition:all .16s; }
.kp-modal-cancel:hover  { background:var(--card2); }
.kp-modal-confirm { padding:11px 26px;border-radius:11px;border:none;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;cursor:pointer;font-family:var(--f);font-size:14px;font-weight:700;box-shadow:0 4px 14px rgba(239,68,68,.35);transition:all .16s; }
.kp-modal-confirm:hover { filter:brightness(1.1); }

/* ── FOOTER ── */
.kp-pgfoot { text-align:center;padding:14px 0 10px;font-size:11px;color:var(--t3);border-top:1px solid var(--line);margin-top:4px; }
.kp-pgfoot a { color:var(--violet);text-decoration:none;font-weight:700; }
.kp-pgfoot a:hover { text-decoration:underline; }

/* ── SCROLLBAR ── */
::-webkit-scrollbar { width:4px;height:4px; }
::-webkit-scrollbar-track { background:transparent; }
::-webkit-scrollbar-thumb { background:var(--line2);border-radius:99px; }
::-webkit-scrollbar-thumb:hover { background:var(--t3); }

/* ── BODY PADDING ── */
@media(max-width:600px){
  .kp-body { padding:14px; gap:20px; }
}
@media(max-width:380px){
  .kp-body { padding:10px; }
  .kp-card { border-radius:14px; }
}
`;

/* ── Live Clock ── */
function KClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <div className="kp-clock-badge">
      <span>{t.toLocaleDateString("en-US",{ month:"short", day:"numeric" })}</span>
      <span style={{ color:"var(--line3)" }}>·</span>
      <span className="kp-clock-time">{t.toLocaleTimeString("en-US",{ hour:"2-digit", minute:"2-digit", second:"2-digit" })}</span>
    </div>
  );
}

/* ── Per-card live elapsed timer ── */
function Elapsed({ createdAt }) {
  const [label, setLabel] = useState("");
  const ageRef = useRef(0);
  useEffect(() => {
    const tick = () => { ageRef.current = Date.now() - new Date(createdAt); setLabel(timeSince(createdAt)); };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [createdAt]);
  const min = ageRef.current / 60000;
  const cls = min > 15 ? "t-urg" : min > 10 ? "t-warn" : "";
  return <div className={`kp-timer ${cls}`}>{min > 15 ? "🚨" : min > 10 ? "⏰" : "🕐"} {label}</div>;
}

/* ═══════════════════════════════════════════ MAIN ═══════════════════════════ */
export default function KitchenPanel() {
  const [station,   setStation]   = useState("food");
  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [updating,  setUpdating]  = useState(null);
  const [theme,     setTheme]     = useState("light");
  const [showLogout,setShowLogout]= useState(false);
  const [rSpin,     setRSpin]     = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /* inject CSS once */
  useEffect(() => {
    const el = document.createElement("style");
    el.id = "kp-css";
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-kp-theme", theme);
  }, [theme]);

  /* fetch */
  const load = useCallback(async (quiet=false) => {
    if (!quiet) setLoading(true);
    try { const r = await API.get("/admin/kitchen"); setOrders(r.data || []); } catch {}
    setLoading(false);
  }, []);

  const doRefresh = async () => {
    setRSpin(true);
    await load(true);
    setTimeout(() => setRSpin(false), 700);
  };

  useEffect(() => {
    load();

    // Poll every 5 s while tab is visible; pause when hidden, re-fetch instantly on focus
    let iv = null;

    const start = () => {
      if (iv) return;
      iv = setInterval(() => load(true), 5000);
    };
    const stop = () => {
      clearInterval(iv);
      iv = null;
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        load(true);   // instant fetch when tab becomes visible again
        start();
      }
    };

    const onFocus = () => { load(true); };  // instant fetch when window regains focus

    start();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  /* filter by station */
  const stationOrders = orders.map(o => {
    const items = (o.items || []);
    const filtered = station === "bar"
      ? items.filter(i => isBarItem(i.category, i.subcategory))
      : items.filter(i => !isBarItem(i.category, i.subcategory));
    return filtered.length ? { ...o, items: filtered } : null;
  }).filter(Boolean);

  const getStatus = o => {
    const ss = o.items.map(i => i.kitchen_status || "pending");
    if (ss.every(s => s === "ready")) return "ready";
    if (ss.some(s => s === "preparing" || s === "ready")) return "preparing";
    return "pending";
  };

  const visible   = stationOrders.filter(o => getStatus(o) !== "ready");
  const pending   = visible.filter(o => getStatus(o) === "pending");
  const preparing = visible.filter(o => getStatus(o) === "preparing");

  /* actions */
  const updateItem = async (itemId, status) => {
    setUpdating(itemId);
    try { await API.put(`/admin/kitchen/items/${itemId}/status`, { kitchen_status: status }); await load(true); } catch {}
    setUpdating(null);
  };

  const updateAll = async (order, status) => {
    setUpdating(order.id);
    try { await Promise.all(order.items.map(i => API.put(`/admin/kitchen/items/${i.id}/status`, { kitchen_status: status }))); await load(true); } catch {}
    setUpdating(null);
  };

  const confirmLogout = async () => {
    try { await API.post("/auth/logout"); } catch {}
    logout(); navigate("/");
  };

  const isBar = station === "bar";
  const hour  = new Date().getHours();
  const tod   = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", flexDirection:"column", overflowX:"hidden" }}>

      {/* ── Logout Modal ── */}
      {showLogout && (
        <div className="kp-modal-bg">
          <div className="kp-modal">
            <div className="kp-modal-ico">🚪</div>
            <div className="kp-modal-h">Sign out?</div>
            <div className="kp-modal-body">You'll need to sign back in to view orders.</div>
            <div className="kp-modal-btns">
              <button className="kp-modal-cancel" onClick={() => setShowLogout(false)}>Cancel</button>
              <button className="kp-modal-confirm" onClick={confirmLogout}>Yes, sign out</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="kp-hdr">
        <div className="kp-hdr-inner">
          {/* Left */}
          <div className="kp-hdr-l">
            <div className={`kp-logo ${isBar ? "kp-logo-bar" : "kp-logo-food"}`}>
              {user?.restaurant_logo
                ? <img src={user.restaurant_logo} alt="" />
                : (isBar ? "🍹" : "👨‍🍳")}
            </div>
            <div className="kp-hdr-info">
              <div className="kp-hdr-title">{isBar ? "Bar Panel" : "Kitchen Panel"}</div>
              <div className="kp-hdr-sub">{user?.restaurant_name}{user?.name ? ` · ${user.name}` : ""}</div>
            </div>
          </div>

          {/* Center */}
          <div className="kp-hdr-c">
            <div className="kp-seg">
              <button className={`kp-seg-btn ${station === "food" ? "on-food" : ""}`} onClick={() => setStation("food")}>
                🍳 Kitchen
              </button>
              <button className={`kp-seg-btn ${station === "bar" ? "on-bar" : ""}`} onClick={() => setStation("bar")}>
                🍹 Bar
              </button>
            </div>
          </div>

          {/* Right */}
          <div className="kp-hdr-r">
            <KClock />
            <button className="kp-ibtn" title="Toggle theme" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <button className={`kp-ibtn ${rSpin ? "spinning" : ""}`} title="Refresh" onClick={doRefresh}>
              <span style={{ display:"inline-block", transition:"transform .6s", transform: rSpin ? "rotate(360deg)" : "none" }}>↻</span>
            </button>
            <button className="kp-logout-btn" onClick={() => setShowLogout(true)}>
              🚪 <span className="kp-logout-lbl">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Command / Stats bar ── */}
      <div className="kp-cmd">
        <div className="kp-stat s-new">
          <div className="kp-stat-num">{pending.length}</div>
          <div className="kp-stat-lbl">New</div>
        </div>
        <div className="kp-stat s-cook">
          <div className="kp-stat-num">{preparing.length}</div>
          <div className="kp-stat-lbl">Cooking</div>
        </div>
        <div className="kp-stat s-all">
          <div className="kp-stat-num">{visible.length}</div>
          <div className="kp-stat-lbl">Active</div>
        </div>
        <div className="kp-cmd-sep" />
        <div className="kp-greet">Good {tod}, <strong>{user?.name || "Chef"}</strong> {isBar ? "🍹" : "👨‍🍳"}</div>
        <div className="kp-live-dot-wrap">
          <div className="kp-live-dot" />
          <span>Live · 5s</span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="kp-body">
        {loading ? (
          <div className="kp-loading">
            <div className="kp-spin" />
            <div className="kp-loading-t">Fetching orders…</div>
          </div>
        ) : visible.length === 0 ? (
          <div className="kp-empty">
            <div className="kp-empty-orb">{isBar ? "🍹" : "🍽️"}</div>
            <div className="kp-empty-h">Kitchen's clear!</div>
            <div className="kp-empty-p">{isBar ? "Drink" : "Food"} orders will appear here automatically once placed. Refreshes every 5 seconds.</div>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <section className="sec-new">
                <div className="kp-sec-hdr">
                  <div className="kp-sec-pill">🕐 New · {pending.length}</div>
                  <div className="kp-sec-line" />
                </div>
                <div className="kp-grid">
                  {pending.map(o => (
                    <KCard key={o.id} order={o} station={station}
                      updating={updating === o.id || o.items.some(i => updating === i.id)}
                      status={getStatus(o)}
                      onStartAll={() => updateAll(o, "preparing")}
                      onUpdateItem={updateItem} />
                  ))}
                </div>
              </section>
            )}
            {preparing.length > 0 && (
              <section className="sec-cook">
                <div className="kp-sec-hdr">
                  <div className="kp-sec-pill">🔥 Cooking · {preparing.length}</div>
                  <div className="kp-sec-line" />
                </div>
                <div className="kp-grid">
                  {preparing.map(o => (
                    <KCard key={o.id} order={o} station={station}
                      updating={updating === o.id || o.items.some(i => updating === i.id)}
                      status={getStatus(o)}
                      onReadyAll={() => updateAll(o, "ready")}
                      onUpdateItem={updateItem} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
        <div className="kp-pgfoot">
          Developed &amp; Powered by{" "}
          <a href="https://www.saugatbohara.com.np/Dinex.html" target="_blank" rel="noopener noreferrer">DineX</a>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ CARD ═══════════════════════════ */
function KCard({ order, station, updating, status, onStartAll, onReadyAll, onUpdateItem }) {
  const isBar      = station === "bar";
  const isTakeaway = order.order_type === "takeaway";
  const ageMs      = Date.now() - new Date(order.created_at);
  const isWarn     = ageMs > 10*60*1000 && ageMs <= 15*60*1000;
  const isUrgent   = ageMs > 15*60*1000;
  const allPending = status === "pending";
  const allReady   = order.items.every(i => (i.kitchen_status||"pending") === "ready");

  const bannerBg = isBar
    ? "linear-gradient(140deg,#22d3ee,#0891b2)"
    : isTakeaway ? "linear-gradient(140deg,#fb923c,#ea580c)"
    : "linear-gradient(140deg,#22c55e,#15803d)";

  const glowClass = isBar ? "gl-bar" : isTakeaway ? "gl-take" : "gl-food";
  const urgClass  = isUrgent && allPending ? "urg-crit" : isWarn && allPending ? "urg-warn" : "";

  const SC = { pending:"var(--amber)", preparing:"var(--cyan)", ready:"var(--green)" };
  const SI = { pending:"⏳", preparing:"🔥", ready:"✅" };

  return (
    <div className={`kp-card ${urgClass}`}>
      <div className={`kp-card-glow ${glowClass}`} />

      {/* Banner */}
      <div className="kp-banner" style={{ background: bannerBg }}>
        <span className="kp-banner-icon">{isBar ? "🍹" : isTakeaway ? "📦" : "🪑"}</span>
        <span className="kp-banner-tbl">{isTakeaway ? "Packing" : (order.table_label || `Table ${order.table_number}`)}</span>
        {isTakeaway && order.table_label && <span className="kp-banner-sub">· {order.table_label}</span>}
        <span className="kp-banner-num">#{order.id}</span>
      </div>

      {/* Meta */}
      <div className="kp-card-meta">
        {order.waiter_name && <span className="kp-tag tag-waiter">👤 {order.waiter_name}</span>}
        {order.table_section && order.table_section !== "Main" && <span className="kp-tag tag-section">📍 {order.table_section}</span>}
        {isUrgent && allPending && <span className="kp-tag tag-urg">⚠️ URGENT</span>}
        {isWarn && allPending && !isUrgent && <span className="kp-tag tag-late">⏰ LATE</span>}
        <Elapsed createdAt={order.created_at} />
      </div>

      {/* Items */}
      <div className="kp-items">
        {order.items.map((item, i) => {
          const ks = item.kitchen_status || "pending";
          return (
            <div key={i} className={`kp-item ${ks === "ready" ? "done" : ""}`}>
              <div className={`kp-item-indicator ind-${ks}`} />
              <div className="kp-item-body">
                <div className={`kp-item-name ${ks === "ready" ? "crossed" : ""}`}>{item.item || item.name}</div>
                {item.category && <div className="kp-item-cat">{item.category}</div>}
                {item.special_request && <div className="kp-item-note">⚠️ <span>{item.special_request}</span></div>}
              </div>
              <div className="kp-item-r">
                <div className={`kp-qty ${isBar ? "qty-bar" : "qty-food"}`}>×{item.quantity}</div>
                <button
                  className={`kp-act act-${ks}`}
                  disabled={updating || ks === "ready"}
                  onClick={() => {
                    const next = ks === "pending" ? "preparing" : "ready";
                    onUpdateItem(item.id, next);
                  }}
                >
                  {SI[ks]} {ks === "pending" ? "Start" : ks === "preparing" ? "Done" : "Ready"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {order.notes && <div className="kp-order-note">📝 <span>{order.notes}</span></div>}

      {/* Footer */}
      <div className="kp-foot">
        {allPending && (
          <button className="kp-foot-btn fb-start" onClick={onStartAll} disabled={updating}>
            {updating ? <span className="kp-spin-sm" /> : "🔥"} Start All
          </button>
        )}
        {!allPending && !allReady && (
          <button className="kp-foot-btn fb-ready" onClick={onReadyAll} disabled={updating}>
            {updating ? <span className="kp-spin-sm" /> : (isBar ? "🍹" : "✅")} Mark Ready
          </button>
        )}
        {allReady && (
          <div className={`kp-foot-btn ${isBar ? "fb-done-bar" : "fb-done-food"}`}>
            {isBar ? "🍹 Bar Ready!" : isTakeaway ? "📦 Ready for Pickup!" : "✅ Ready to Serve!"}
          </div>
        )}
      </div>
    </div>
  );
}