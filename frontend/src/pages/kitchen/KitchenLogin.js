import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../api";

export default function KitchenLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await API.post("/auth/login", { username, password });
      login(res.data.user, res.data.token);
      navigate("/kitchen/select");
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.msg || "Invalid credentials");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg,#0b0d12 0%,#111318 100%)", fontFamily: "'Outfit',sans-serif",
      padding: 20,
    }}>
      <div style={{
        background: "#161921", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20,
        padding: "36px 32px", width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: "linear-gradient(135deg,#f59e0b,#d97706)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, margin: "0 auto 14px", boxShadow: "0 4px 20px rgba(245,158,11,0.4)",
          }}>🍳</div>
          <h1 style={{ color: "#f0eee9", fontWeight: 800, fontSize: 22, margin: 0 }}>Kitchen / Bar Login</h1>
          <p style={{ color: "#6b6760", fontSize: 13, marginTop: 6 }}>Station Staff Sign In</p>
        </div>

        {error && (
          <div style={{
            background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)",
            borderRadius: 10, padding: "10px 14px", marginBottom: 16,
            color: "#f43f5e", fontSize: 13, fontWeight: 600,
          }}>⚠️ {error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", color: "#b0aaa0", fontSize: 12, fontWeight: 700, marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>Username</label>
            <input
              value={username} onChange={e => setUsername(e.target.value)} required
              placeholder="Enter username"
              style={{
                width: "100%", padding: "11px 14px", background: "#0e1016",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                color: "#f0eee9", fontSize: 14, fontFamily: "inherit", outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", color: "#b0aaa0", fontSize: 12, fontWeight: 700, marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="Enter password"
              style={{
                width: "100%", padding: "11px 14px", background: "#0e1016",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                color: "#f0eee9", fontSize: 14, fontFamily: "inherit", outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#fff",
            fontFamily: "inherit", fontWeight: 800, fontSize: 15, cursor: "pointer",
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </form>

        <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 20 }}>
          <a href="/" style={{ color: "#6b6760", fontSize: 12, textDecoration: "none" }}>← Waiter Login</a>
          <a href="/admin/login" style={{ color: "#6b6760", fontSize: 12, textDecoration: "none" }}>Admin Login</a>
        </div>
      </div>
    </div>
  );
}
