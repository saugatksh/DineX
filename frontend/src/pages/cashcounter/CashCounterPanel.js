import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../api";

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString("en-NP", { hour: "2-digit", minute: "2-digit" });
}
function timeSince(ts) {
  const m = Math.floor((Date.now() - new Date(ts)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ${m % 60}m ago`;
}

function computeDiscount(totalWithTax, discountType, discountValue) {
  const val = parseFloat(discountValue) || 0;
  if (val <= 0) return { discountAmt: 0, grandTotal: totalWithTax };
  let discountAmt;
  if (discountType === "percent") {
    const pct = Math.min(100, Math.max(0, val));
    discountAmt = parseFloat((totalWithTax * pct / 100).toFixed(2));
  } else {
    discountAmt = Math.min(totalWithTax, Math.max(0, parseFloat(val.toFixed(2))));
  }
  const grandTotal = parseFloat((totalWithTax - discountAmt).toFixed(2));
  return { discountAmt, grandTotal };
}

/* ── inline responsive styles injected once ── */
const CASH_STYLES = `
/* Cash counter header */
.cc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 16px;
  background: linear-gradient(135deg,#1e293b,#0f172a);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 4px 24px rgba(0,0,0,0.3);
  flex-shrink: 0;
}
.cc-header-left  { display:flex; align-items:center; gap:12px; }
.cc-header-right { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.cc-stats-pill {
  background: rgba(255,255,255,0.06);
  border-radius: 20px;
  padding: 6px 14px;
  display: flex;
  gap: 14px;
  font-size: 12px;
}

/* Main two-column body */
.cc-body {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 420px;
  overflow: hidden;
}
.cc-left  { overflow: auto; padding: 20px; }
.cc-right {
  border-left: 1px solid var(--border);
  background: var(--bg-card);
  display: flex;
  flex-direction: column;
  overflow: auto;
}

/* Tablet: narrower right column */
@media (max-width: 1100px) {
  .cc-body { grid-template-columns: 1fr 340px; }
}

/* Mobile: stack columns + right panel becomes bottom sheet */
@media (max-width: 767px) {
  .cc-body {
    grid-template-columns: 1fr;
    overflow: visible;
  }
  .cc-left  { padding: 14px; }
  .cc-right {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    max-height: 75vh;
    border-left: none;
    border-radius: 20px 20px 0 0;
    box-shadow: 0 -8px 40px rgba(0,0,0,0.3);
    z-index: 300;
    transform: translateY(100%);
    transition: transform 0.32s cubic-bezier(0.4,0,0.2,1);
    overflow-y: auto;
  }
  .cc-right.open {
    transform: translateY(0);
  }
  /* FAB to open right panel */
  .cc-bill-fab { display: flex !important; }
  /* extra bottom space so orders list not hidden behind FAB */
  .cc-left { padding-bottom: 90px; }
  /* header stats: wrap gracefully */
  .cc-stats-pill { gap: 10px; padding: 6px 10px; font-size: 11px; }
  /* hide "Refresh" text label on xs */
  .cc-refresh-label { display: none; }
}

/* Bill panel FAB (hidden on desktop) */
.cc-bill-fab {
  display: none;
  position: fixed;
  bottom: 20px; right: 20px;
  z-index: 301;
  background: linear-gradient(135deg,#6366f1,#8b5cf6);
  color: #fff;
  border: none;
  border-radius: 50px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 800;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(99,102,241,0.45);
  gap: 8px;
  align-items: center;
  transition: transform 0.2s;
}
.cc-bill-fab:active { transform: scale(0.96); }

/* Drag handle */
.cc-sheet-handle {
  width: 40px; height: 4px;
  background: var(--border-md);
  border-radius: 2px;
  margin: 10px auto 0;
  cursor: pointer;
}

/* Overlay only shows on mobile */
.cc-mobile-overlay {
  display: none;
}
@media (max-width: 767px) {
  .cc-mobile-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    z-index: 299;
    backdropFilter: blur(2px);
  }
}

/* Takeaway modal: responsive grid */
@media (max-width: 600px) {
  .cc-takeaway-grid {
    grid-template-columns: 1fr !important;
  }
  .cc-takeaway-items-col {
    max-height: 220px !important;
  }
}
`;

export default function CashCounterPanel() {
  const [orders, setOrders]               = useState([]);
  const [tables, setTables]               = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [bill, setBill]                   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [billLoading, setBillLoading]     = useState(false);
  const [step, setStep]                   = useState("list");
  const [payMethod, setPayMethod]         = useState(null);
  const [paying, setPaying]               = useState(false);
  const [creditModal, setCreditModal]     = useState(false);
  const [creditForm, setCreditForm]       = useState({ customer_name: "", customer_phone: "", deadline: "", notes: "" });
  const [reserveModal, setReserveModal]   = useState(null);
  const [reserveForm, setReserveForm]     = useState({ reserved_by_name: "", reserved_by_phone: "", reservation_time: "" });
  const [reserving, setReserving]         = useState(false);
  const [takeawayModal, setTakeawayModal] = useState(false);
  const [menu, setMenu]                   = useState([]);
  const [takeawayItems, setTakeawayItems] = useState([]);
  const [takeawayOrder, setTakeawayOrder] = useState(null);
  const [savingTakeaway, setSavingTakeaway] = useState(false);
  const [finalBill, setFinalBill]         = useState(null);
  const [taxSettings, setTaxSettings]     = useState(null);
  const [billPanelOpen, setBillPanelOpen] = useState(false); // mobile sheet

  const [discountType,  setDiscountType]  = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [noShowNotifs, setNoShowNotifs]       = useState([]);

  const { user, logout, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();

  /* inject styles once */
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = CASH_STYLES;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const [ordRes, tblRes, taxRes] = await Promise.all([
        API.get("/orders"),
        API.get("/tables"),
        API.get("/extras/tax-settings"),
      ]);
      const allOrders = ordRes.data.filter(o =>
        ["served", "preparing", "pending", "ready"].includes(o.status)
      );
      const standaloneOrders = allOrders.filter(o => !(o.order_type === "takeaway" && o.table_id));
      const seen = new Set();
      const deduped = standaloneOrders.filter(o => {
        if (o.order_type === "takeaway") return true;
        if (!seen.has(o.table_id)) { seen.add(o.table_id); return true; }
        return false;
      });
      const tableAssignedTakeaways = allOrders.filter(o => o.order_type === "takeaway" && o.table_id);
      const dedupedWithMeta = deduped.map(o => {
        if (o.order_type !== "takeaway" && o.table_id) {
          const linked = tableAssignedTakeaways.filter(t => t.table_id === o.table_id);
          return { ...o, _takeawayOrders: linked };
        }
        return { ...o, _takeawayOrders: [] };
      });
      setOrders(dedupedWithMeta.sort((a, b) => a.id - b.id));
      setTables(tblRes.data);
      setTaxSettings(taxRes.data);
    } catch {}
    setLoading(false);
  }, []);

  const loadMenu = useCallback(async () => {
    try { const r = await API.get("/menu"); setMenu(r.data.filter(i => i.is_available)); } catch {}
  }, []);

  useEffect(() => { loadOrders(); loadMenu(); }, [loadOrders, loadMenu]);
  useEffect(() => { const t = setInterval(loadOrders, 15000); return () => clearInterval(t); }, [loadOrders]);

  // Poll reservation no-show notifications every 60 s
  const loadNoShowNotifs = useCallback(async () => {
    try {
      const r = await API.get("/notifications/reservation-noshow");
      setNoShowNotifs(r.data.filter(n => !n.is_read));
    } catch {}
  }, []);
  useEffect(() => { loadNoShowNotifs(); }, [loadNoShowNotifs]);
  useEffect(() => {
    const t = setInterval(loadNoShowNotifs, 60000);
    return () => clearInterval(t);
  }, [loadNoShowNotifs]);
  const dismissNoShow = async (id) => {
    try { await API.put(`/notifications/reservation-noshow/${id}/read`); } catch {}
    setNoShowNotifs(prev => prev.filter(n => n.id !== id));
  };

  const selectOrder = async (order) => {
    setSelectedOrder(order);
    setBillLoading(true);
    setStep("detail");
    setDiscountType("percent");
    setDiscountValue("");
    setBillPanelOpen(true); // open sheet on mobile
    try {
      const res = await API.get(`/orders/${order.id}/bill`);
      setBill(res.data);
    } catch {}
    setBillLoading(false);
  };

  const handleProceedPayment = () => setStep("payment");

  const handleChooseMethod = (method) => {
    setPayMethod(method);
    if (method === "credit") { setCreditModal(true); }
    else { setStep("confirm"); }
  };

  const getDiscountCalc = () => {
    if (!bill) return { discountAmt: 0, grandTotal: 0, totalWithTax: 0 };
    const totalWithTax = Number(bill.total);
    const { discountAmt, grandTotal } = computeDiscount(totalWithTax, discountType, discountValue);
    return { discountAmt, grandTotal, totalWithTax };
  };

  const handleConfirmPay = async () => {
    if (!selectedOrder || !payMethod) return;
    setPaying(true);
    const { discountAmt } = getDiscountCalc();
    try {
      await API.put(`/orders/${selectedOrder.id}/pay`, { method: payMethod, discount_amount: discountAmt });
      const r = await API.get(`/orders/${selectedOrder.id}/bill`);
      setFinalBill({ ...r.data, payment_method: payMethod, discount_amount: discountAmt });
      setStep("bill");
      await loadOrders();
    } catch {}
    setPaying(false);
  };

  const handleCreditPay = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !bill) return;
    setPaying(true);
    const { discountAmt, grandTotal } = getDiscountCalc();
    try {
      // First apply tax/discount to get final amount stored on the order
      // but DON'T mark as 'paid' — creditRoutes will mark as credit_pending
      await API.put(`/orders/${selectedOrder.id}/pay`, { method: "credit", discount_amount: discountAmt });
      // Then create the credit record — this marks order as credit_pending (overrides above)
      await API.post("/credits", {
        order_id: selectedOrder.id,
        customer_name: creditForm.customer_name,
        customer_phone: creditForm.customer_phone,
        amount: grandTotal,
        deadline: creditForm.deadline,
        notes: creditForm.notes,
      });
      const r = await API.get(`/orders/${selectedOrder.id}/bill`);
      setFinalBill({ ...r.data, payment_method: "credit", credit_customer: creditForm.customer_name, discount_amount: discountAmt });
      setCreditModal(false);
      setCreditForm({ customer_name: "", customer_phone: "", deadline: "", notes: "" });
      setStep("bill");
      await loadOrders();
    } catch (err) {
      alert(err.response?.data?.error || "Credit payment failed");
    }
    setPaying(false);
  };

  const handleReserveTable = async (e) => {
    e.preventDefault();
    if (!reserveModal) return;
    setReserving(true);
    try {
      await API.post(`/tables/${reserveModal.id}/reserve`, {
        ...reserveForm,
        reservation_time: reserveForm.reservation_time || null,
      });
      setReserveModal(null);
      setReserveForm({ reserved_by_name: "", reserved_by_phone: "", reservation_time: "" });
      await loadOrders();
    } catch (err) { alert(err.response?.data?.error || "Failed to reserve"); }
    setReserving(false);
  };

  const updateTableStatus = async (tableId, status) => {
    try { await API.put(`/tables/${tableId}`, { status }); await loadOrders(); } catch {}
  };

  const handleNewTakeaway = async () => {
    try {
      const res = await API.post("/orders", { order_type: "takeaway" });
      setTakeawayOrder(res.data);
      setTakeawayItems([]);
      setTakeawayModal(true);
    } catch {}
  };

  const addTakeawayItem = async (menuItem) => {
    if (!takeawayOrder) return;
    try {
      await API.post(`/orders/${takeawayOrder.id}/items`, { menu_id: menuItem.id, quantity: 1 });
      const detail = await API.get(`/orders/${takeawayOrder.id}`);
      setTakeawayItems(detail.data.items);
      setTakeawayOrder(detail.data.order);
    } catch {}
  };

  const confirmTakeaway = async () => {
    if (!takeawayOrder) return;
    setSavingTakeaway(true);
    try {
      await API.put(`/orders/${takeawayOrder.id}/confirm`);
      setTakeawayModal(false);
      setTakeawayOrder(null);
      setTakeawayItems([]);
      await loadOrders();
    } catch {}
    setSavingTakeaway(false);
  };

  const resetToList = () => {
    setStep("list");
    setSelectedOrder(null);
    setBill(null);
    setPayMethod(null);
    setFinalBill(null);
    setDiscountType("percent");
    setDiscountValue("");
    setBillPanelOpen(false);
  };

  const handleLogout = () => setShowLogoutModal(true);
  const confirmLogout = async () => {
    try { await API.post("/auth/logout"); } catch {}
    logout(); navigate("/cash-counter");
  };

  const handlePrint = () => {
    if (!finalBill) return;
    const printWin = window.open("", "_blank", "width=400,height=600");
    const receiptHTML = document.querySelector(".print-only")?.innerHTML || "";
    printWin.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  @page { size: 98mm auto; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; background: #fff; width: 98mm; }
  body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace; font-size: 12px; color: #111; line-height: 1.35; }
  .receipt-thermal { width: 98mm; padding: 5mm 4mm; }
  .receipt-restaurant-name { font-size: 16px; font-weight: 800; letter-spacing: 1px; text-align: center; margin-bottom: 2px; text-transform: uppercase; }
  .receipt-meta { text-align: center; font-size: 10px; color: #555; }
  .receipt-divider-dashed { border: none; border-top: 1px dashed #bbb; margin: 6px 0; }
  .receipt-divider-light { border: none; border-top: 1px solid #eee; margin: 4px 0; }
  .receipt-info-grid { display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; font-size: 11px; }
  .receipt-label { color: #666; }
  .receipt-value { font-weight: 600; }
  .receipt-bold { font-weight: 800; }
  .receipt-total-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 12px; }
  .receipt-grand-total { font-weight: 900; font-size: 15px; border-top: 2px solid #111; margin-top: 6px; padding-top: 6px; }
  .receipt-totals { margin: 4px 0; }
  .receipt-footer { text-align: center; font-size: 10px; color: #666; margin-top: 8px; }
</style>
</head>
<body>${receiptHTML}</body>
</html>`);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => { printWin.print(); printWin.close(); }, 300);
  };

  const handleSendWhatsApp = (phoneNumber) => {
  if (!finalBill) return;

  const bill = finalBill;
  const now = new Date();

  // ── layout config ───────────────────────────────────────
  const LINE_WIDTH = 40;

  const DIVIDER  = "-".repeat(LINE_WIDTH);
  const DIVIDER2 = "=".repeat(LINE_WIDTH);

  const ITEM_W = 22;
  const QTY_W  = 5;
  const AMT_W  = 13;

  const LABEL_W = 26;
  const VALUE_W = 14;

  // ── helpers ─────────────────────────────────────────────
  const left = (txt = "", width) =>
    String(txt).padEnd(width, " ");

  const right = (txt = "", width) =>
    String(txt).padStart(width, " ");

  const center = (txt = "") => {
    txt = String(txt);
    const pad = Math.max(
      0,
      Math.floor((LINE_WIDTH - txt.length) / 2)
    );
    return " ".repeat(pad) + txt;
  };

  const money = val =>
    `Rs. ${Number(val || 0).toLocaleString("en-NP")}`;

  // ── calculations ────────────────────────────────────────
  const discountAmount =
    parseFloat(bill.discount_amount) || 0;

  const subtotal =
    parseFloat(bill.subtotal) || 0;

  const tax =
    parseFloat(bill.tax) || 0;

  const totalWithTax = parseFloat(
    (subtotal + tax).toFixed(2)
  );

  const grandTotal =
    discountAmount > 0
      ? parseFloat(
          (totalWithTax - discountAmount).toFixed(2)
        )
      : parseFloat(bill.total) || 0;

  // ── header ──────────────────────────────────────────────
  const name =
    bill.restaurant_name || "Our Restaurant";

  const formatMoney = n => `Rs. ${Number(n || 0).toFixed(0)}`;

let msg = "";

msg += "╔════════════════════╗\n";
msg += `   🍽 ${name}\n`;
msg += "      🧾 BILL RECEIPT\n";
msg += "╚════════════════════╝\n\n";

msg += `📅 Date: ${now.toLocaleString("en-NP")}\n`;

const methodLabels = {
  cash: "CASH",
  online: "ONLINE",
  credit: "CREDIT",
  card: "CARD",
};

msg += `💳 Payment: ${
  methodLabels[bill.payment_method] ||
  bill.payment_method ||
  ""
}\n\n`;

msg += "━━━━━━━━━━━━━━━━━━\n";
msg += "🛒 ITEMS ORDERED\n";
msg += "━━━━━━━━━━━━━━━━━━\n";

(bill.items || []).forEach(item => {
  const itemName = item.name || item.item || "";
  const qty = Number(item.quantity || 1);
  const total = Number(item.price || 0);
  const unitPrice = total / qty;

  msg += `🍴 ${itemName}\n`;
  msg += `   ${qty} × ${formatMoney(
    unitPrice
  )} = ${formatMoney(total)}\n`;
});

msg += "━━━━━━━━━━━━━━━━━━\n";

if (bill.tax_enabled && tax > 0) {
  msg += `🧾 VAT: ${formatMoney(tax)}\n`;
}

if (discountAmount > 0) {
  msg += `🎁 Discount: -${formatMoney(
    discountAmount
  )}\n`;
}

msg += "━━━━━━━━━━━━━━━━━━\n";
msg += "💰 TOTAL AMOUNT\n";
msg += `💵 ${formatMoney(grandTotal)}\n`;
msg += "━━━━━━━━━━━━━━━━━━\n\n";

if (bill.payment_method === "credit") {
  msg += "⚠️ Payment Pending (Credit)\n\n";
} else {
  msg += "✅ Payment Received\n\n";
}

msg += "🙏 Thank you for dining with us!\n";
msg += "🌟 We hope to serve you again soon.";

    // ── send ──────────────────────────────────────────────────────────────────
    const encoded = encodeURIComponent(msg);
    let phone = (phoneNumber || "").replace(/[^0-9]/g, "");
    if (phone.startsWith("0"))                              phone = "977" + phone.slice(1);
    else if (phone.length === 10 && phone.startsWith("9")) phone = "977" + phone;
    else if (phone.length < 11)                            phone = "977" + phone;
    window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
  };

  const [whatsappModal, setWhatsappModal] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState("");



  const statusLabel = { pending: "Pending", preparing: "Preparing", ready: "Ready to Serve", served: "Served", credit_pending: "Credit" };
  const statusColor = { pending: "var(--warning)", preparing: "var(--info)", ready: "#10b981", served: "var(--success)", credit_pending: "#8b5cf6" };
  const catIcons    = { food: "🍛", drink: "🥤", dessert: "🍰", snack: "🍿" };
  const categories  = [...new Set(menu.map(m => m.category))];
  const roundColors = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#06b6d4", "#8b5cf6"];

  const groupItemsByRound = (items, roundMap) => {
    if (!items) return [];
    const groups = {};
    items.forEach(item => { const key = item.order_id; if (!groups[key]) groups[key] = []; groups[key].push(item); });
    return Object.entries(groups).map(([orderId, items]) => ({ orderId: parseInt(orderId), roundNumber: roundMap?.[orderId] || 1, items })).sort((a, b) => a.roundNumber - b.roundNumber);
  };

  const { discountAmt, grandTotal: liveGrandTotal } = getDiscountCalc();
  const hasDiscount = discountAmt > 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", flexDirection: "column" }}>
      {/* Reservation No-Show Alerts */}
      {noShowNotifs.length > 0 && (
        <div style={{ position: "sticky", top: 0, zIndex: 200 }}>
          {noShowNotifs.map(n => (
            <div key={n.id} style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              background: "#7c3aed", color: "#fff",
              padding: "10px 16px", fontSize: 13, fontWeight: 600,
              borderBottom: "1px solid rgba(255,255,255,0.15)"
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>🚫</span>
              <span style={{ flex: 1 }}>{n.title} — {n.message}</span>
              <button onClick={() => dismissNoShow(n.id)} style={{
                background: "rgba(255,255,255,0.2)", border: "none", color: "#fff",
                borderRadius: 6, padding: "2px 10px", cursor: "pointer", fontWeight: 700, fontSize: 13, flexShrink: 0
              }}>✕ Dismiss</button>
            </div>
          ))}
        </div>
      )}
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999 }}>
          <div style={{ background:"var(--bg-primary,#fff)", borderRadius:16, padding:"32px 28px", minWidth:300, textAlign:"center", boxShadow:"0 8px 32px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🚪</div>
            <h2 style={{ margin:"0 0 8px", fontSize:20, fontWeight:700 }}>Logout?</h2>
            <p style={{ margin:"0 0 24px", color:"var(--text-secondary,#666)", fontSize:14 }}>Are you sure you want to log out?</p>
            <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
              <button onClick={() => setShowLogoutModal(false)} style={{ padding:"10px 24px", borderRadius:8, border:"1px solid var(--border,#ddd)", background:"transparent", cursor:"pointer", fontWeight:600, fontSize:14 }}>Cancel</button>
              <button onClick={confirmLogout} style={{ padding:"10px 24px", borderRadius:8, border:"none", background:"#ef4444", color:"#fff", cursor:"pointer", fontWeight:600, fontSize:14 }}>Yes, Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <header className="cc-header no-print">
        <div className="cc-header-left">
          <div style={{ width: 40, height: 40, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, boxShadow: "0 0 16px rgba(99,102,241,0.4)", flexShrink: 0, overflow: "hidden" }}>
            {user?.restaurant_logo
              ? <img src={user.restaurant_logo} alt="logo" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              : "💰"}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#f1f5f9" }}>Cash Counter</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{user?.restaurant_name} · {user?.name}</div>
          </div>
        </div>
        <div className="cc-header-right">
          <div className="cc-stats-pill">
            <span style={{ color: "#fbbf24", fontWeight: 700, whiteSpace: "nowrap" }}>⏳ {orders.filter(o => ["pending","preparing"].includes(o.status)).length} Active</span>
            <span style={{ color: "#34d399", fontWeight: 700, whiteSpace: "nowrap" }}>✅ {orders.filter(o => ["served","ready"].includes(o.status)).length} Ready</span>
          </div>
          <button onClick={handleNewTakeaway} style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 800, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>📦 Takeaway</button>
          <button className="btn btn-secondary btn-sm" onClick={loadOrders}>↻ <span className="cc-refresh-label">Refresh</span></button>
          <button className="theme-toggle" onClick={toggleTheme}><span>{theme === "dark" ? "🌙" : "☀️"}</span><div className="toggle-track"><div className="toggle-thumb" /></div></button>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ color: "rgba(255,255,255,0.6)" }}>🚪</button>
        </div>
      </header>

      {/* ── MAIN BODY ── */}
      <div className="cc-body no-print">

        {/* LEFT: ORDERS LIST */}
        <div className="cc-left">
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>🧾 Active Orders</div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><div className="spinner" /></div>
          ) : orders.length === 0 ? (
            <div className="empty-state" style={{ marginBottom: 32 }}>
              <div className="empty-icon">🧾</div>
              <h3>No active orders</h3>
              <p>Waiter orders will appear here after confirmed.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {orders.map(order => {
                const isSelected = selectedOrder?.id === order.id;
                const isTakeaway = order.order_type === "takeaway";
                const subtotal   = Number(order.combined_total !== undefined ? order.combined_total : order.total) || 0;
                const cardTaxEnabled = taxSettings ? taxSettings.tax_enabled !== false : false;
                const cardTaxRate    = taxSettings ? (parseFloat(taxSettings.tax_rate) || 13) : 13;
                const cardTax        = cardTaxEnabled ? Math.round(subtotal * cardTaxRate) / 100 : 0;
                const displayTotal   = Math.round((subtotal + cardTax) * 100) / 100;
                return (
                  <div key={order.id} onClick={() => selectOrder(order)} style={{
                    background: isSelected ? "linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))" : "var(--bg-card)",
                    border: `2px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: 14, padding: "12px 16px", cursor: "pointer", transition: "all 0.2s",
                    display: "flex", alignItems: "center", gap: 12,
                  }}
                  onMouseOver={e => { if (!isSelected) e.currentTarget.style.borderColor = "var(--accent)"; }}
                  onMouseOut={e => { if (!isSelected) e.currentTarget.style.borderColor = "var(--border)"; }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: isTakeaway ? "linear-gradient(135deg,#f59e0b,#d97706)" : "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                      {isTakeaway ? "📦" : "🪑"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 800, fontSize: 14 }}>
                          {isTakeaway
                            ? <span style={{ color: "#f59e0b" }}>TAKEAWAY</span>
                            : <span>{order.table_label || `Table ${order.table_number}`}{order.table_section && order.table_section !== "Main" && <span style={{ fontWeight: 600, fontSize: 11, color: "var(--text-muted)", marginLeft: 4 }}>· {order.table_section}</span>}</span>
                          }
                        </span>
                        {!isTakeaway && order._takeawayOrders?.length > 0 && (
                          <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.35)", borderRadius: 20, padding: "2px 8px" }}>
                            📦 +Takeaway
                          </span>
                        )}
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${statusColor[order.status]}22`, color: statusColor[order.status], border: `1px solid ${statusColor[order.status]}44` }}>
                          {statusLabel[order.status] || order.status}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--text-muted)", flexWrap: "wrap" }}>
                        <span>🕐 {timeSince(order.created_at)}</span>
                        {order.waiter_name && <span>👤 {order.waiter_name}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: "var(--success)" }}>
                        Rs. {Number(displayTotal).toLocaleString()}
                      </div>
                      {cardTaxEnabled && cardTax > 0 && (
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>incl. {cardTaxRate}% VAT</div>
                      )}
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{formatTime(order.created_at)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TABLE STATUS */}
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>🪑 Table Status</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 10 }}>
            {tables.map(t => (
              <div key={t.id} className={`table-tile ${t.status}`} style={{ position: "relative" }}>
                <div className="tile-num" style={{ fontSize: t.table_label ? 18 : undefined }}>{t.table_label || `#${t.table_number}`}</div>
                {t.table_label && <div style={{ fontSize: 10, color: "var(--text-muted)" }}>No.{t.table_number}</div>}
                {t.table_section && t.table_section !== "Main" && (
                  <div style={{ fontSize: 10, color: "var(--info, #38bdf8)", fontWeight: 700 }}>📍 {t.table_section}</div>
                )}
                <div className="tile-status">{t.status}</div>
                {t.status === "reserved" && (
                  <div style={{ fontSize: 10, marginTop: 2, color: "var(--accent-light)", fontWeight: 600 }}>
                    📋 {t.reserved_by_name}
                    {t.reserved_by_phone && <div style={{ opacity: 0.8 }}>📞 {t.reserved_by_phone}</div>}
                    {t.reservation_time && <div style={{ opacity:0.85, color:"#fbbf24" }}>🕐 {new Date(t.reservation_time).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</div>}
                  </div>
                )}
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>👥 {t.capacity}</div>
                <div style={{ display: "flex", gap: 3, marginTop: 6, flexWrap: "wrap" }}>
                  {t.status !== "available" && (
                    <button onClick={() => updateTableStatus(t.id, "available")} style={{ flex: 1, minWidth: 44, background: "var(--success-bg)", border: "1px solid var(--success)", color: "var(--success)", borderRadius: 6, padding: "2px 4px", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>Free</button>
                  )}
                  {t.status !== "reserved" && (
                    <button onClick={() => { setReserveModal(t); setReserveForm({ reserved_by_name: "", reserved_by_phone: "", reservation_time: "" }); }} style={{ flex: 1, minWidth: 44, background: "var(--accent-bg,#eef2ff)", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: 6, padding: "2px 4px", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>Reserve</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: BILL PANEL */}
        <div className={`cc-right${billPanelOpen ? " open" : ""}`}>
          {/* drag handle on mobile */}
          <div className="cc-sheet-handle" onClick={() => setBillPanelOpen(false)} />

          {step === "list" && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "var(--text-muted)", padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: 52 }}>🧾</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Select an order</div>
              <div style={{ fontSize: 13 }}>Click any active order from the left panel to view and process payment.</div>
            </div>
          )}

          {(step === "detail" || step === "payment" || step === "confirm") && selectedOrder && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", background: "var(--bg-surface)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <button className="btn btn-ghost btn-sm" onClick={resetToList}>← Back</button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedOrder.order_type === "takeaway"
                      ? "📦 Takeaway Order"
                      : selectedOrder._takeawayOrders?.length > 0
                        ? `🪑 ${selectedOrder.table_label || `Table ${selectedOrder.table_number}`} + 📦`
                        : `🪑 ${selectedOrder.table_label || `Table ${selectedOrder.table_number}`}`}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>#{selectedOrder.id} · {selectedOrder.waiter_name || "—"}</div>
                </div>
                <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${statusColor[selectedOrder.status]}22`, color: statusColor[selectedOrder.status], flexShrink: 0 }}>
                  {statusLabel[selectedOrder.status] || selectedOrder.status}
                </span>
              </div>

              {billLoading ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><div className="spinner" /></div>
              ) : bill ? (
                <div style={{ flex: 1, overflow: "auto", padding: "14px 16px" }}>
                  {/* Multi-round notice */}
                  {bill.allOrderIds?.length > 1 && (
                    <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid var(--accent)33", borderRadius: 10, padding: "8px 12px", marginBottom: 12, fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>
                      📋 {bill.allOrderIds.length} orders combined — full bill
                      {selectedOrder?._takeawayOrders?.length > 0 && (
                        <span style={{ marginLeft: 8, background: "rgba(245,158,11,0.15)", color: "#f59e0b", borderRadius: 12, padding: "2px 8px", fontSize: 11 }}>
                          incl. 📦 {selectedOrder._takeawayOrders.length} takeaway
                        </span>
                      )}
                    </div>
                  )}

                  {/* Items */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Order Items {bill.allOrderIds?.length > 1 ? `(${bill.allOrderIds.length} rounds)` : ""}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {bill.items?.map((item, i) => (
                        <div key={i} style={{ background: "var(--bg-surface)", borderRadius: 10, border: "1px solid var(--border)", overflow: "hidden" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px" }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Qty: {item.quantity}</div>
                            </div>
                            <div style={{ fontWeight: 700, color: "var(--success)", fontSize: 14 }}>Rs. {Number(item.price).toLocaleString()}</div>
                          </div>
                          {item.special_request && (
                            <div style={{ padding: "4px 12px 8px", fontSize: 11, color: "#d97706", fontWeight: 600, borderTop: "1px dashed var(--border)" }}>
                              ⚠️ {item.special_request}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals + Discount */}
                  <div style={{ background: "var(--bg-surface)", borderRadius: 12, padding: 14, border: "1px solid var(--border)", marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
                      <span>Rs. {Number(bill.subtotal).toLocaleString()}</span>
                    </div>
                    {bill.tax_enabled && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 10 }}>
                        <span style={{ color: "var(--text-muted)" }}>VAT ({bill.tax_rate}%)</span>
                        <span>Rs. {Number(bill.tax).toLocaleString()}</span>
                      </div>
                    )}

                    {/* Discount section */}
                    <div style={{ borderTop: "1px dashed var(--border)", paddingTop: 12, marginBottom: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                        🎁 Discount <span style={{ fontWeight: 400, fontStyle: "italic", textTransform: "none" }}>(optional)</span>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
                        <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)", flexShrink: 0 }}>
                          {[{ key: "percent", label: "%" }, { key: "fixed", label: "Rs." }].map(opt => (
                            <button key={opt.key} type="button" onClick={() => { setDiscountType(opt.key); setDiscountValue(""); }}
                              style={{ padding: "7px 10px", fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", background: discountType === opt.key ? "var(--accent)" : "var(--bg-secondary)", color: discountType === opt.key ? "#fff" : "var(--text-muted)", transition: "all 0.15s" }}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        <input type="number" min="0" step={discountType === "percent" ? "0.5" : "1"} max={discountType === "percent" ? "100" : undefined}
                          placeholder={discountType === "percent" ? "e.g. 10" : "e.g. 150"}
                          value={discountValue} onChange={e => setDiscountValue(e.target.value)}
                          style={{ flex: 1, padding: "7px 10px", fontSize: 14, fontWeight: 600, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-primary)", color: "var(--text-primary)", outline: "none", minWidth: 0 }} />
                        {discountValue && (
                          <button type="button" onClick={() => setDiscountValue("")}
                            style={{ padding: "7px 9px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", color: "var(--text-muted)", fontSize: 14 }}>✕</button>
                        )}
                      </div>
                      {discountType === "percent" && (
                        <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
                          {[5, 10, 15, 20, 25, 50].map(pct => (
                            <button key={pct} type="button" onClick={() => setDiscountValue(String(pct))}
                              style={{ padding: "4px 10px", fontSize: 12, fontWeight: 700, borderRadius: 20, cursor: "pointer", border: "1px solid var(--border)", background: discountValue === String(pct) ? "var(--accent)" : "var(--bg-secondary)", color: discountValue === String(pct) ? "#fff" : "var(--text-secondary)", transition: "all 0.15s" }}>
                              {pct}%
                            </button>
                          ))}
                        </div>
                      )}
                      {hasDiscount && (
                        <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--danger, #ef4444)", fontWeight: 700 }}>
                          <span>Discount {discountType === "percent" ? `(${discountValue}%)` : ""}</span>
                          <span>− Rs. {discountAmt.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 20, color: "var(--success)", borderTop: "2px dashed var(--border)", paddingTop: 10 }}>
                      <span>Grand Total</span>
                      <span>Rs. {liveGrandTotal.toLocaleString()}</span>
                    </div>
                    {hasDiscount && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "right", marginTop: 2 }}>
                        (original Rs. {Number(bill.total).toLocaleString()})
                      </div>
                    )}
                  </div>

                  {step === "detail" && (
                    <button className="btn btn-primary" onClick={handleProceedPayment} style={{ width: "100%", padding: "13px 0", fontWeight: 900, fontSize: 15, borderRadius: 12 }}>
                      💳 Proceed to Payment
                    </button>
                  )}

                  {step === "payment" && (
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Select Payment Method</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {[
                          { method: "cash",   icon: "💵", label: "Cash",              desc: "Physical cash payment",    color: "#16a34a", bg: "#f0fdf4" },
                          { method: "online", icon: "📱", label: "Online / QR",       desc: "eSewa, Khalti, IME Pay",   color: "#2563eb", bg: "#eff6ff" },
                          { method: "credit", icon: "📋", label: "Credit (Pay Later)", desc: "Record as pending payment", color: "#8b5cf6", bg: "#f5f3ff" },
                        ].map(opt => (
                          <button key={opt.method} onClick={() => handleChooseMethod(opt.method)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, cursor: "pointer", background: opt.bg, border: `2px solid ${opt.color}33`, textAlign: "left", transition: "all 0.2s" }}
                          onMouseOver={e => { e.currentTarget.style.borderColor = opt.color; e.currentTarget.style.transform = "translateX(3px)"; }}
                          onMouseOut={e => { e.currentTarget.style.borderColor = `${opt.color}33`; e.currentTarget.style.transform = "translateX(0)"; }}>
                            <span style={{ fontSize: 26 }}>{opt.icon}</span>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: 14, color: opt.color }}>{opt.label}</div>
                              <div style={{ fontSize: 12, color: "#6b7280" }}>{opt.desc}</div>
                            </div>
                            <div style={{ marginLeft: "auto", color: opt.color, fontSize: 16 }}>→</div>
                          </button>
                        ))}
                      </div>
                      <button className="btn btn-ghost btn-sm" style={{ marginTop: 10, width: "100%" }} onClick={() => setStep("detail")}>← Back to Order Details</button>
                    </div>
                  )}

                  {step === "confirm" && payMethod && (
                    <div>
                      <div style={{ background: "var(--bg-surface)", border: "2px solid var(--accent)", borderRadius: 14, padding: 18, textAlign: "center", marginBottom: 14 }}>
                        <div style={{ fontSize: 38, marginBottom: 8 }}>{payMethod === "cash" ? "💵" : "📱"}</div>
                        <div style={{ fontWeight: 900, fontSize: 17 }}>{payMethod === "cash" ? "Cash Payment" : "Online Payment"}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 6 }}>Confirm payment of</div>
                        {hasDiscount && (
                          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4, textDecoration: "line-through" }}>
                            Rs. {Number(bill.total).toLocaleString()}
                          </div>
                        )}
                        <div style={{ fontSize: 30, fontWeight: 900, color: "var(--success)" }}>
                          Rs. {liveGrandTotal.toLocaleString()}
                        </div>
                        {hasDiscount && (
                          <div style={{ marginTop: 4, fontSize: 12, color: "#ef4444", fontWeight: 700 }}>
                            🎁 Discount: − Rs. {discountAmt.toLocaleString()}
                            {discountType === "percent" && ` (${discountValue}%)`}
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 5 }}>
                          {selectedOrder.order_type === "takeaway" ? "📦 Takeaway" : `🪑 ${selectedOrder.table_label || `Table ${selectedOrder.table_number}`}`}
                          {bill.allOrderIds?.length > 1 && ` · ${bill.allOrderIds.length} rounds`}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep("payment")}>← Change</button>
                        <button className="btn btn-success" style={{ flex: 2, fontWeight: 900, fontSize: 15, padding: "12px 0" }} onClick={handleConfirmPay} disabled={paying}>
                          {paying ? <><span className="spinner-sm" /> Processing...</> : "✅ Confirm Payment"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ color: "var(--text-muted)" }}>Failed to load bill</div>
                </div>
              )}
            </div>
          )}

          {step === "bill" && finalBill && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-surface)", display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="btn btn-primary btn-sm" onClick={handlePrint}>🖨️ Print Bill</button>
                <button
                  className="btn btn-sm"
                  style={{ background: "#25D366", color: "#fff", fontWeight: 700, border: "none", display: "flex", alignItems: "center", gap: 5 }}
                  onClick={() => { setWhatsappPhone(""); setWhatsappModal(true); }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Send on WhatsApp
                </button>
                <button className="btn btn-ghost btn-sm" onClick={resetToList}>← New Order</button>
              </div>
              <div style={{ flex: 1, overflow: "auto", padding: 18 }}>
                <Receipt bill={finalBill} roundColors={roundColors} groupItemsByRound={groupItemsByRound} />
              </div>
            </div>
          )}
        </div>

        {/* Mobile overlay — hidden on desktop via CSS */}
        {billPanelOpen && (
          <div className="cc-mobile-overlay" onClick={() => setBillPanelOpen(false)} style={{ backdropFilter: "blur(2px)" }} />
        )}
      </div>

      {/* PRINT-ONLY RECEIPT */}
      {step === "bill" && finalBill && (
        <div className="print-only">
          <Receipt bill={finalBill} roundColors={roundColors} groupItemsByRound={groupItemsByRound} />
        </div>
      )}

      {/* ── MOBILE FAB to open bill panel ── */}
      {selectedOrder && step !== "bill" && !billPanelOpen && (
        <button className="cc-bill-fab" onClick={() => setBillPanelOpen(o => !o)}>
          🧾 View Bill
          <span style={{ background: "#fff", color: "#6366f1", borderRadius: 20, padding: "1px 8px", fontSize: 12, fontWeight: 900 }}>
            Rs. {liveGrandTotal.toLocaleString()}
          </span>
        </button>
      )}

      {/* CREDIT MODAL */}
      {creditModal && (
        <div className="modal-overlay no-print" onClick={() => setCreditModal(false)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Credit Payment</h3>
              <button className="modal-close" onClick={() => setCreditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreditPay}>
              <div className="modal-body">
                <div style={{ background: "#f5f3ff", border: "1px solid #c4b5fd", borderRadius: 10, padding: "12px 14px", marginBottom: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>📋</div>
                  {hasDiscount && (
                    <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 700, marginBottom: 4 }}>🎁 Discount − Rs. {discountAmt.toLocaleString()} applied</div>
                  )}
                  <div style={{ fontWeight: 800, color: "#7c3aed", fontSize: 18 }}>Rs. {bill ? liveGrandTotal.toLocaleString() : ""}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Will be recorded as pending. Not counted in sales until received.</div>
                </div>
                <div className="form-group"><label>Customer Name *</label><input required placeholder="Full name" value={creditForm.customer_name} onChange={e => setCreditForm({ ...creditForm, customer_name: e.target.value })} /></div>
                <div className="form-group"><label>Contact Number *</label><input required placeholder="Phone number" value={creditForm.customer_phone} onChange={e => setCreditForm({ ...creditForm, customer_phone: e.target.value })} /></div>
                <div className="form-group"><label>Payment Deadline *</label><input required type="date" value={creditForm.deadline} onChange={e => setCreditForm({ ...creditForm, deadline: e.target.value })} /></div>
                <div className="form-group"><label>Notes (Optional)</label><input placeholder="Any notes..." value={creditForm.notes} onChange={e => setCreditForm({ ...creditForm, notes: e.target.value })} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setCreditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={paying}>{paying ? <><span className="spinner-sm" /> Saving...</> : "📋 Record Credit"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WHATSAPP BILL MODAL */}
      {whatsappModal && (
        <div className="modal-overlay no-print" onClick={() => setWhatsappModal(false)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Send Bill on WhatsApp
              </h3>
              <button className="modal-close" onClick={() => setWhatsappModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: "var(--bg-surface)", borderRadius: 10, padding: "12px 14px", marginBottom: 16, fontSize: 13, color: "var(--text-muted)" }}>
                📋 A formatted bill will be sent as a WhatsApp message to the customer.
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Customer WhatsApp Number *</label>
                <input
                  type="tel"
                  placeholder="e.g. 98XXXXXXXX"
                  value={whatsappPhone}
                  onChange={e => setWhatsappPhone(e.target.value.replace(/[^0-9+]/g, "").slice(0, 15))}
                  autoFocus
                  style={{ fontSize: 16, letterSpacing: 1 }}
                />
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                  Nepal numbers: enter 10-digit mobile number (e.g. 9841234567)
                </div>
              </div>
              {finalBill && (
                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", fontSize: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Bill Preview:</div>
                  <div style={{ color: "var(--text-muted)" }}>
                    {(finalBill.items || []).slice(0, 3).map((item, i) => {
                      const qty = item.quantity || 1;
                      const lineTotal = Number(item.price);
                      const unitPrice = qty > 1 ? Math.round(lineTotal / qty) : lineTotal;
                      return (
                        <div key={i}>• {item.name || item.item} ×{qty} — Rs. {lineTotal.toLocaleString()} {qty > 1 ? `(Rs.${unitPrice.toLocaleString()} each)` : ""}</div>
                      );
                    })}
                    {(finalBill.items || []).length > 3 && <div>... and {finalBill.items.length - 3} more items</div>}
                    <div style={{ marginTop: 6, fontWeight: 700, color: "var(--success)" }}>
                      Total: Rs. {Number(finalBill.total).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setWhatsappModal(false)}>Cancel</button>
              <button
                className="btn btn-sm"
                style={{ background: "#25D366", color: "#fff", fontWeight: 700, border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                onClick={() => { handleSendWhatsApp(whatsappPhone); setWhatsappModal(false); }}
                disabled={!whatsappPhone.trim()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Send via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}


      {/* RESERVE MODAL */}
      {reserveModal && (
        <div className="modal-overlay no-print" onClick={() => setReserveModal(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Reserve Table #{reserveModal.table_number}</h3>
              <button className="modal-close" onClick={() => setReserveModal(null)}>✕</button>
            </div>
            <form onSubmit={handleReserveTable}>
              <div className="modal-body">
                <div className="form-group"><label>Reserved By (Name) *</label><input required placeholder="Customer name" value={reserveForm.reserved_by_name} onChange={e => setReserveForm({ ...reserveForm, reserved_by_name: e.target.value })} /></div>
                <div className="form-group"><label>Contact Number *</label><input required placeholder="Phone number" value={reserveForm.reserved_by_phone} onChange={e => setReserveForm({ ...reserveForm, reserved_by_phone: e.target.value })} /></div>
                <div className="form-group"><label>Reservation Time</label><input type="datetime-local" value={reserveForm.reservation_time || ""} onChange={e => setReserveForm({ ...reserveForm, reservation_time: e.target.value || "" })} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setReserveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={reserving}>{reserving ? <><span className="spinner-sm" /> Reserving...</> : "📋 Reserve Table"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAKEAWAY MODAL */}
      {takeawayModal && (
        <div className="modal-overlay no-print" onClick={() => setTakeawayModal(false)}>
          <div className="modal" style={{ maxWidth: 680, width: "94vw" }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📦 New Takeaway Order</h3>
              <button className="modal-close" onClick={() => setTakeawayModal(false)}>✕</button>
            </div>
            <div className="modal-body cc-takeaway-grid" style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 16 }}>
              <div style={{ maxHeight: 380, overflow: "auto" }}>
                {categories.map(cat => (
                  <div key={cat} style={{ marginBottom: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>{catIcons[cat]} {cat}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                      {menu.filter(m => m.category === cat).map(item => (
                        <button key={item.id} onClick={() => addTakeawayItem(item)} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 10px", cursor: "pointer", textAlign: "left", color: "var(--text-primary)" }}>
                          <div style={{ fontWeight: 600, fontSize: 12 }}>{item.name}</div>
                          <div style={{ color: "var(--success)", fontWeight: 700, fontSize: 12 }}>Rs. {Number(item.price).toLocaleString()}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="cc-takeaway-items-col">
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Order Items</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, overflow: "auto" }}>
                  {takeawayItems.length === 0 ? (
                    <div style={{ color: "var(--text-muted)", fontSize: 12, textAlign: "center", padding: 20 }}>No items yet</div>
                  ) : takeawayItems.map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                      <span>{item.name} <span style={{ color: "var(--text-muted)" }}>×{item.quantity}</span></span>
                      <span style={{ fontWeight: 600 }}>Rs. {Number(item.price).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                {takeawayOrder && (
                  <div style={{ fontWeight: 800, fontSize: 16, color: "var(--success)", marginTop: 12, paddingTop: 8, borderTop: "2px dashed var(--border)" }}>
                    Total: Rs. {Number(takeawayOrder.total || 0).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setTakeawayModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ fontWeight: 800 }} onClick={confirmTakeaway} disabled={savingTakeaway || takeawayItems.length === 0}>
                {savingTakeaway ? <><span className="spinner-sm" /> Sending...</> : "📦 Send to Kitchen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── RECEIPT COMPONENT ────────────────────────────────────────────────────────
function Receipt({ bill, roundColors, groupItemsByRound }) {
  const now = new Date();
  const methodIcons = { cash: "💵", online: "📱", credit: "📋" };
  const hasMultipleRounds = bill.allOrderIds?.length > 1;
  const discountAmount = parseFloat(bill.discount_amount) || 0;
  const hasDiscount    = discountAmount > 0;
  const subtotal       = parseFloat(bill.subtotal)  || 0;
  const tax            = parseFloat(bill.tax)        || 0;
  const totalWithTax   = parseFloat((subtotal + tax).toFixed(2));
  const grandTotal     = hasDiscount ? parseFloat((totalWithTax - discountAmount).toFixed(2)) : parseFloat(bill.total) || 0;

  return (
    <div className="receipt-thermal">
      <div className="receipt-header">
        <div className="receipt-restaurant-name">{bill.restaurant_name || "Restaurant"}</div>
        {bill.restaurant_address && <div className="receipt-meta">{bill.restaurant_address}</div>}
        {bill.restaurant_phone  && <div className="receipt-meta">Tel: {bill.restaurant_phone}</div>}
        {bill.pan_number        && <div className="receipt-meta">PAN: {bill.pan_number}</div>}
      </div>
      <div className="receipt-divider-dashed" />
      <div className="receipt-info-grid">
        <span className="receipt-label">Bill No:</span><span className="receipt-value">#{bill.order?.id}</span>
        <span className="receipt-label">Date:</span><span className="receipt-value">{now.toLocaleDateString("en-NP")}</span>
        <span className="receipt-label">Time:</span><span className="receipt-value">{now.toLocaleTimeString("en-NP", { hour: "2-digit", minute: "2-digit" })}</span>
        <span className="receipt-label">Order:</span>
        <span className="receipt-value receipt-bold">{bill.order?.order_type === "takeaway" ? "Takeaway" : (bill.order?.table_label || `Table ${bill.order?.table_number}`)}</span>
        {bill.waiter_name && <><span className="receipt-label">Waiter:</span><span className="receipt-value">{bill.waiter_name}</span></>}
        {hasMultipleRounds && (<><span className="receipt-label">Rounds:</span><span className="receipt-value receipt-bold">{bill.allOrderIds.length}</span></>)}
        <span className="receipt-label">Payment:</span>
        <span className="receipt-value receipt-bold" style={{ textTransform: "capitalize" }}>
          {methodIcons[bill.payment_method]} {bill.payment_method}
          {bill.credit_customer && ` — ${bill.credit_customer}`}
        </span>
      </div>
      <div className="receipt-divider-dashed" />
      <div style={{display:"flex",alignItems:"center"}}>
        <span style={{flex:1,textAlign:"left",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>ITEM</span>
        <span style={{width:40,textAlign:"center"}}>QTY</span>
        <span style={{width:90,textAlign:"right"}}>AMT</span>
      </div>
      <div className="receipt-divider-light" />
      {bill.items?.map((item, i) => (
        <div key={i} style={{display: "flex",alignItems: "center",}}>
          <span style={{ flex: 1, overflow: "hidden",textOverflow: "ellipsis",whiteSpace: "nowrap", }}>{item.name}</span>
          <span style={{width:40,textAlign:"center"}}>{item.quantity}</span>
          <span style={{ width: 90, textAlign: "right" }}>Rs.{Number(item.price).toLocaleString()}</span>
        </div>
      ))}
      <div className="receipt-divider-dashed" />
      <div className="receipt-totals">
        <div className="receipt-total-row"><span>Subtotal</span><span>Rs. {subtotal.toLocaleString()}</span></div>
        {bill.tax_enabled && tax > 0 && (
          <div className="receipt-total-row"><span>VAT ({bill.tax_rate}%)</span><span>Rs. {tax.toLocaleString()}</span></div>
        )}
        {hasDiscount && (
          <div className="receipt-total-row" style={{ fontWeight: 700 }}>
            <span>Discount</span><span>− Rs. {discountAmount.toLocaleString()}</span>
          </div>
        )}
        <div className="receipt-total-row receipt-grand-total">
          <span>{hasDiscount ? "GRAND TOTAL" : "TOTAL"}</span>
          <span>Rs. {grandTotal.toLocaleString()}</span>
        </div>
      </div>
      <div className="receipt-divider-dashed" />
      <div className="receipt-footer">
        {bill.payment_method === "credit"
          ? <div style={{ color: "#7c3aed", fontWeight: 700 }}>⚠️ CREDIT — Payment Pending</div>
          : <div style={{ color: "#16a34a", fontWeight: 700 }}>✅ Payment Received</div>
        }
        <div style={{ marginTop: 6 }}>धन्यवाद! / Thank you for dining with us!</div>
      </div>
    </div>
  );
}