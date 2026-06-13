import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api";
import SubscriptionInactive from "./SubscriptionInactive";

const ROLE_ROUTES = {
  admin: "/admin/dashboard",
  waiter: "/waiter",
  cashcounter: "/cash-counter/panel",
  kitchen: "/kitchen/panel",
  superadmin: "/superadmin/dashboard",
};

const ROLE_INFO = {
  admin:       { icon: "👔", label: "Admin",        color: "#6366f1" },
  waiter:      { icon: "🧑‍🍽️", label: "Waiter",       color: "#f59e0b" },
  cashcounter: { icon: "💰", label: "Cash Counter", color: "#10b981" },
  kitchen:     { icon: "👨‍🍳", label: "Kitchen Staff",color: "#ef4444" },
  superadmin:  { icon: "⚡", label: "Super Admin",  color: "#8b5cf6" },
};

const FOOD_EMOJIS = ["🍕","🍔","🍜","🍣","🥗","🍩","🧆","🌮","🍱","🥘","🍛","🧁","🍦","🥙","🫕"];

const NUM_PARTICLES = 18;
const REPEL_RADIUS = 120;
const REPEL_STRENGTH = 180;
const ATTRACT_RADIUS = 200;
const ATTRACT_STRENGTH = 0.012;

function initParticle(index) {
  const angle = (index / NUM_PARTICLES) * Math.PI * 2;
  const radius = 200 + Math.random() * 200;
  return {
    id: index,
    emoji: FOOD_EMOJIS[index % FOOD_EMOJIS.length],
    x: window.innerWidth / 2 + Math.cos(angle) * radius,
    y: window.innerHeight / 2 + Math.sin(angle) * radius,
    vx: (Math.random() - 0.5) * 1.2,
    vy: (Math.random() - 0.5) * 1.2,
    size: 22 + Math.random() * 18,
    rotation: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 2.5,
    opacity: 0.55 + Math.random() * 0.35,
    baseX: window.innerWidth / 2 + Math.cos(angle) * radius,
    baseY: window.innerHeight / 2 + Math.sin(angle) * radius,
  };
}

function FoodParticles() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef(null);

  useEffect(() => {
    particlesRef.current = Array.from({ length: NUM_PARTICLES }, (_, i) => initParticle(i));

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleTouchMove = (e) => {
      if (e.touches[0]) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      particlesRef.current = particlesRef.current.map((p) => {
        let { x, y, vx, vy, rotation, rotSpeed } = p;

        // Vector from particle to mouse
        const dx = mx - x;
        const dy = my - y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        if (dist < REPEL_RADIUS) {
          // Repel: push away from cursor
          const force = (REPEL_RADIUS - dist) / REPEL_RADIUS;
          vx -= (dx / dist) * force * 8;
          vy -= (dy / dist) * force * 8;
        } else if (dist < ATTRACT_RADIUS) {
          // Gentle drift toward cursor when farther away
          vx += (dx / dist) * ATTRACT_STRENGTH * dist;
          vy += (dy / dist) * ATTRACT_STRENGTH * dist;
        }

        // Drift back toward base position slowly
        vx += (p.baseX - x) * 0.0008;
        vy += (p.baseY - y) * 0.0008;

        // Damping
        vx *= 0.94;
        vy *= 0.94;

        // Speed cap
        const speed = Math.sqrt(vx * vx + vy * vy);
        if (speed > 12) {
          vx = (vx / speed) * 12;
          vy = (vy / speed) * 12;
        }

        x += vx;
        y += vy;
        rotation += rotSpeed + (speed > 2 ? speed * 0.5 : 0);

        // Bounce off edges softly
        if (x < 0) { x = 0; vx = Math.abs(vx) * 0.6; }
        if (x > canvas.width) { x = canvas.width; vx = -Math.abs(vx) * 0.6; }
        if (y < 0) { y = 0; vy = Math.abs(vy) * 0.6; }
        if (y > canvas.height) { y = canvas.height; vy = -Math.abs(vy) * 0.6; }

        // Dynamic opacity: get brighter when near cursor
        const proximity = Math.max(0, 1 - dist / ATTRACT_RADIUS);
        const dynamicOpacity = p.opacity + proximity * 0.3;

        // Draw emoji on canvas
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.min(dynamicOpacity, 0.95);
        const scale = 1 + proximity * 0.4 + (speed > 3 ? speed * 0.03 : 0);
        ctx.scale(scale, scale);
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Glow effect when near cursor
        if (proximity > 0.3) {
          ctx.shadowColor = "rgba(255,200,100,0.8)";
          ctx.shadowBlur = 12 * proximity;
        }

        ctx.fillText(p.emoji, 0, 0);
        ctx.restore();

        return { ...p, x, y, vx, vy, rotation };
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

export default function UnifiedLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [inactiveRestaurant, setInactiveRestaurant] = useState(null);

  const { login, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();

  if (inactiveRestaurant) {
    return <SubscriptionInactive restaurantName={inactiveRestaurant} />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      let mac_address = null;
      try {
        const pc = new RTCPeerConnection({ iceServers: [] });
        pc.createDataChannel("");
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const m = offer.sdp?.match(/([0-9a-f]{2}:){5}[0-9a-f]{2}/i);
        if (m) mac_address = m[0];
        pc.close();
      } catch {}

      const res = await API.post("/auth/login", { username, password, mac_address });
      login(res.data.user, res.data.token);
      navigate(ROLE_ROUTES[res.data.user.role] || "/");
    } catch (err) {
      if (err.response?.data?.subscription_inactive) {
        setInactiveRestaurant(err.response?.data?.restaurant_name || username);
        setLoading(false);
        return;
      }
      setError(err.response?.data?.msg || "Login failed. Check your credentials.");
    }
    setLoading(false);
  };

  return (
    <div className="unified-login-root">
      {/* Flying food particles canvas */}
      <FoodParticles />

      {/* Animated background orbs */}
      <div className="login-bg-orbs" style={{ zIndex: 0 }}>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Theme toggle */}
      <button className="login-theme-btn" onClick={toggleTheme} title="Toggle theme">
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      <div className="unified-login-card">
        {/* Brand */}
        <div className="unified-login-brand">
          <img src="/dinex-favicon-1.png" alt="DineX" style={{ width: 150, height: 80, objectFit: "contain", marginBottom: 4 }} />
          <h1 className="brand-title">DineX</h1>
          <p className="brand-sub">Restaurant Management System</p>
        </div>

        <p className="login-hint">Sign in with your username or email</p>

        {error && (
          <div className="login-error-banner">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="unified-login-form">
          <div className="login-field">
            <label>Username / Email</label>
            <div className="login-input-wrap">
              <span className="input-icon">👤</span>
              <input
                type="text"
                placeholder="Enter username or email"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>

          <div className="login-field">
            <label>Password</label>
            <div className="login-input-wrap">
              <span className="input-icon">🔒</span>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button type="button" className="pass-toggle" onClick={() => setShowPass(v => !v)}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? (
              <><span className="spinner-sm" /> Signing in...</>
            ) : (
              <><span>🔑</span> Sign In</>
            )}
          </button>
        </form>

        <div className="login-footer-note">
          Developed by <a href="https://www.saugatbohara.com.np" target="_blank" rel="noopener noreferrer">SAUGAT BOHARA</a>
        </div>
      </div>
    </div>
  );
}