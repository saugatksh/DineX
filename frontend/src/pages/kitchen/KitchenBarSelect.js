import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../api";

export default function KitchenBarSelect() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => setShowLogoutModal(true);
  const confirmLogout = async () => {
    try { await API.post("/auth/logout"); } catch {}
    logout(); navigate("/kitchen");
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg,#0b0d12 0%,#111318 100%)", fontFamily: "'Outfit',sans-serif",
      padding: 20,
    }}>
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

      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🍳</div>
        <h1 style={{ color: "#f0eee9", fontWeight: 800, fontSize: 24, margin: 0 }}>
          {user?.restaurant_name}
        </h1>
        <p style={{ color: "#6b6760", marginTop: 6, fontSize: 14 }}>
          Welcome, {user?.name} — Choose your station
        </p>
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center", width: "100%", maxWidth: 600 }}>
        {/* Kitchen */}
        <button
          onClick={() => navigate("/kitchen/panel?station=kitchen")}
          style={{
            flex: "1 1 220px", minWidth: 220, padding: "32px 24px",
            background: "#161921", border: "2px solid rgba(245,158,11,0.35)",
            borderRadius: 20, cursor: "pointer", textAlign: "center",
            transition: "all 0.2s", fontFamily: "inherit",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#f59e0b"; e.currentTarget.style.transform = "translateY(-4px)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.35)"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>👨‍🍳</div>
          <div style={{ color: "#f0eee9", fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Kitchen</div>
          <div style={{ color: "#6b6760", fontSize: 13, lineHeight: 1.5 }}>
            View and manage<br />food orders
          </div>
          <div style={{
            marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: 20, padding: "5px 14px", color: "#f59e0b", fontSize: 12, fontWeight: 700,
          }}>
            🍛 Food Orders →
          </div>
        </button>

        {/* Bar */}
        <button
          onClick={() => navigate("/kitchen/panel?station=bar")}
          style={{
            flex: "1 1 220px", minWidth: 220, padding: "32px 24px",
            background: "#161921", border: "2px solid rgba(56,189,248,0.35)",
            borderRadius: 20, cursor: "pointer", textAlign: "center",
            transition: "all 0.2s", fontFamily: "inherit",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#38bdf8"; e.currentTarget.style.transform = "translateY(-4px)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(56,189,248,0.35)"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>🍹</div>
          <div style={{ color: "#f0eee9", fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Bar</div>
          <div style={{ color: "#6b6760", fontSize: 13, lineHeight: 1.5 }}>
            View and manage<br />drink orders
          </div>
          <div style={{
            marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.3)",
            borderRadius: 20, padding: "5px 14px", color: "#38bdf8", fontSize: 12, fontWeight: 700,
          }}>
            🥤 Drink Orders →
          </div>
        </button>
      </div>

      <button
        onClick={handleLogout}
        style={{
          marginTop: 32, background: "none", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10, padding: "9px 20px", color: "#6b6760", cursor: "pointer",
          fontFamily: "inherit", fontSize: 13, fontWeight: 600,
        }}
      >
        🚪 Logout
      </button>
    </div>
  );
}
