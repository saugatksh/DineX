import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api";

/* ── Restaurant background animation CSS ── */
const LOGIN_BG_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');

.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: #0a0a0f;
  font-family: 'Inter', sans-serif;
}

/* Deep layered background */
.login-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

/* Animated gradient mesh */
.login-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 20% 20%, rgba(180, 83, 9, 0.18) 0%, transparent 60%),
    radial-gradient(ellipse 60% 80% at 80% 80%, rgba(99, 36, 7, 0.22) 0%, transparent 60%),
    radial-gradient(ellipse 50% 50% at 50% 50%, rgba(30, 20, 10, 0.9) 0%, transparent 100%);
  animation: meshShift 12s ease-in-out infinite alternate;
}
@keyframes meshShift {
  0%   { transform: scale(1) rotate(0deg); }
  100% { transform: scale(1.08) rotate(2deg); }
}

/* Floating food icons */
.food-particle {
  position: absolute;
  font-size: 28px;
  opacity: 0;
  animation: floatUp 9s ease-in infinite;
  pointer-events: none;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.5));
}
@keyframes floatUp {
  0%   { opacity: 0; transform: translateY(0) rotate(0deg) scale(0.7); }
  10%  { opacity: 0.55; }
  80%  { opacity: 0.3; }
  100% { opacity: 0; transform: translateY(-90vh) rotate(360deg) scale(1); }
}

/* Glowing orb lights (restaurant ambiance) */
.ambient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}
.orb-amber {
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.14) 0%, transparent 70%);
  top: -200px; left: -150px;
  animation: orbPulse 7s ease-in-out infinite;
}
.orb-crimson {
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(185, 28, 28, 0.12) 0%, transparent 70%);
  bottom: -150px; right: -100px;
  animation: orbPulse 9s ease-in-out infinite reverse;
}
.orb-gold {
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.08) 0%, transparent 70%);
  top: 50%; left: 60%;
  animation: orbPulse 11s ease-in-out infinite 2s;
}
@keyframes orbPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%       { transform: scale(1.15); opacity: 0.7; }
}

/* Steam lines */
.steam-line {
  position: absolute;
  width: 2px;
  background: linear-gradient(to top, transparent, rgba(255,255,255,0.04), transparent);
  border-radius: 1px;
  animation: steamRise 6s ease-in-out infinite;
  opacity: 0;
}
@keyframes steamRise {
  0%   { opacity: 0; transform: translateY(0) scaleX(1); }
  30%  { opacity: 1; }
  100% { opacity: 0; transform: translateY(-200px) scaleX(2); }
}

/* Subtle grid overlay */
.login-grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
}

/* Restaurant name watermark */
.login-watermark {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'Playfair Display', serif;
  font-size: 11px;
  letter-spacing: 6px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.08);
  white-space: nowrap;
  pointer-events: none;
}

/* Login card */
.login-card {
  position: relative;
  z-index: 2;
  background: rgba(18, 15, 12, 0.85);
  backdrop-filter: blur(24px) saturate(1.4);
  -webkit-backdrop-filter: blur(24px) saturate(1.4);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 20px;
  padding: 40px 38px 34px;
  width: 100%;
  max-width: 420px;
  box-shadow:
    0 0 0 1px rgba(0,0,0,0.5),
    0 24px 64px rgba(0,0,0,0.7),
    0 0 80px rgba(180, 83, 9, 0.1),
    inset 0 1px 0 rgba(255,255,255,0.06);
  animation: cardReveal 0.6s cubic-bezier(0.34, 1.4, 0.64, 1);
}
@keyframes cardReveal {
  from { opacity: 0; transform: translateY(30px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.login-logo {
  text-align: center;
  margin-bottom: 26px;
}
.logo-circle {
  width: 68px; height: 68px;
  background: linear-gradient(135deg, #f59e0b 0%, #b45309 100%);
  border-radius: 18px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 14px;
  font-size: 28px;
  box-shadow: 0 8px 28px rgba(245, 158, 11, 0.4), 0 2px 8px rgba(0,0,0,0.4);
}
.login-logo h1 {
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  font-weight: 700;
  color: #f0ece4;
  letter-spacing: 0.3px;
  margin-bottom: 5px;
}
.login-logo p {
  font-size: 12px;
  color: rgba(255,255,255,0.35);
  letter-spacing: 0.3px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-group label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: rgba(255,255,255,0.4);
  margin-bottom: 6px;
}
.form-group input {
  width: 100%;
  padding: 12px 14px;
  background: rgba(255,255,255,0.05);
  border: 1.5px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  color: #f0ece4;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}
.form-group input:focus {
  border-color: rgba(245, 158, 11, 0.6);
  background: rgba(255,255,255,0.07);
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}
.form-group input::placeholder { color: rgba(255,255,255,0.2); }

.login-btn {
  width: 100%;
  padding: 13px;
  margin-top: 4px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: none;
  border-radius: 10px;
  color: #0a0a0f;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.3px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: all 0.2s;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.35);
}
.login-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.5);
  filter: brightness(1.05);
}
.login-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.alert-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 9px;
  padding: 10px 14px;
  font-size: 13px;
  color: #fca5a5;
}

.login-links {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid rgba(255,255,255,0.07);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.login-link {
  font-size: 12px;
  color: rgba(255,255,255,0.35);
  text-align: center;
}
.login-link a {
  color: #f59e0b;
  text-decoration: none;
  font-weight: 600;
}
.login-link a:hover { text-decoration: underline; }

.theme-toggle {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 12px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  cursor: pointer;
  color: rgba(255,255,255,0.5);
  font-size: 13px;
  transition: all 0.2s;
}
.theme-toggle:hover {
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.8);
}
.toggle-track { width: 24px; height: 13px; background: rgba(255,255,255,0.15); border-radius: 7px; position: relative; }
.toggle-thumb { width: 9px; height: 9px; background: #f59e0b; border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: left 0.2s; }
[data-theme="dark"] .toggle-thumb { left: 13px; }

.spinner-sm {
  display: inline-block; width: 13px; height: 13px;
  border: 2px solid rgba(0,0,0,0.2);
  border-top-color: rgba(0,0,0,0.7);
  border-radius: 50%;
  animation: spinLogin 0.7s linear infinite;
}
@keyframes spinLogin { to { transform: rotate(360deg); } }
`;

/* Food particles config */
const FOOD_PARTICLES = [
  { emoji: "🍽️", left: "8%",  delay: "0s",   duration: "10s" },
  { emoji: "🥂",  left: "18%", delay: "1.5s", duration: "8s"  },
  { emoji: "🍷",  left: "28%", delay: "3s",   duration: "11s" },
  { emoji: "🫕",  left: "42%", delay: "0.7s", duration: "9s"  },
  { emoji: "🥗",  left: "55%", delay: "2.2s", duration: "12s" },
  { emoji: "🍰",  left: "65%", delay: "4s",   duration: "8s"  },
  { emoji: "☕",  left: "75%", delay: "1s",   duration: "10s" },
  { emoji: "🫙",  left: "85%", delay: "3.5s", duration: "9s"  },
  { emoji: "🍜",  left: "92%", delay: "0.3s", duration: "11s" },
  { emoji: "🥩",  left: "35%", delay: "5s",   duration: "9s"  },
  { emoji: "🍣",  left: "50%", delay: "2.8s", duration: "10s" },
  { emoji: "🧁",  left: "70%", delay: "6s",   duration: "8s"  },
];

const STEAM_LINES = [
  { left: "15%", height: "120px", delay: "0s",   duration: "5s"  },
  { left: "35%", height: "80px",  delay: "1.5s", duration: "6s"  },
  { left: "55%", height: "150px", delay: "0.8s", duration: "4s"  },
  { left: "75%", height: "100px", delay: "2s",   duration: "5.5s"},
  { left: "88%", height: "90px",  delay: "3s",   duration: "6s"  },
];

export default function LoginPage({ role, title, subtitle, icon, loginEndpoint, redirectTo, links }) {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let mac_address = null;
      try {
        const pc = new RTCPeerConnection({ iceServers: [] });
        pc.createDataChannel("");
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const match = offer.sdp?.match(/([0-9a-f]{2}:){5}[0-9a-f]{2}/i);
        if (match) mac_address = match[0];
        pc.close();
      } catch {}

      const payload = loginEndpoint === "/auth/super-login"
        ? { email: form.email, password: form.password }
        : { username: form.username, password: form.password, mac_address };

      const res = await API.post(loginEndpoint, payload);
      login(res.data.user, res.data.token);
      navigate(redirectTo);
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed. Please try again.");
    }
    setLoading(false);
  };

  const isSuperAdmin = loginEndpoint === "/auth/super-login";

  return (
    <>
      <style>{LOGIN_BG_STYLES}</style>
      <div className="login-page">
        {/* Animated background */}
        <div className="login-bg">
          <div className="ambient-orb orb-amber" />
          <div className="ambient-orb orb-crimson" />
          <div className="ambient-orb orb-gold" />
          <div className="login-grid-overlay" />

          {/* Floating food icons */}
          {FOOD_PARTICLES.map((p, i) => (
            <div
              key={i}
              className="food-particle"
              style={{
                left: p.left,
                bottom: "-60px",
                animationDelay: p.delay,
                animationDuration: p.duration,
              }}
            >
              {p.emoji}
            </div>
          ))}

          {/* Steam lines */}
          {STEAM_LINES.map((s, i) => (
            <div
              key={i}
              className="steam-line"
              style={{
                left: s.left,
                height: s.height,
                bottom: "10%",
                animationDelay: s.delay,
                animationDuration: s.duration,
              }}
            />
          ))}

          <div className="login-watermark">Fine Dining · Craft Kitchen · Premium Service</div>
        </div>

        {/* Theme toggle */}
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 10 }}>
          <button className="theme-toggle" onClick={toggleTheme}>
            <span>{theme === "dark" ? "🌙" : "☀️"}</span>
            <div className="toggle-track"><div className="toggle-thumb" /></div>
            <span style={{ fontSize: 11 }}>{theme === "dark" ? "Dark" : "Light"}</span>
          </button>
        </div>

        {/* Login card */}
        <div className="login-card">
          <div className="login-logo">
            <div className="logo-circle">{icon}</div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

          <form className="login-form" onSubmit={handleSubmit}>
            {isSuperAdmin ? (
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="superadmin@restopos.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            ) : (
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? <><span className="spinner-sm" /> Signing in...</> : `Sign In as ${title}`}
            </button>
          </form>

          {links && links.length > 0 && (
            <div className="login-links">
              {links.map((l, i) => (
                <div key={i} className="login-link">
                  {l.label} <Link to={l.to}>{l.linkText}</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
