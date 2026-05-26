import { useState, useEffect, useCallback, useRef } from "react";
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell, Tooltip } from "recharts";

const C = {
  bg: "#030712", surface: "#0a0f1e", card: "#0d1424",
  border: "#1a2540", cyan: "#00d4ff", green: "#00ff88",
  red: "#ff3355", amber: "#ffaa00", purple: "#a855f7",
  text: "#e2e8f0", muted: "#64748b", dim: "#1a2540"
};

const API = "http://localhost:8000";

function generateTx() {
  const fraud = Math.random() < 0.15;
  const vf = {};
  
  if (fraud) {
    // Real fraud patterns from dataset
    const fraudPatterns = [
      { V1: -2.31, V2: 1.95, V3: -1.61, V4: 3.99, V14: -4.29, V17: -2.83 },
      { V1: -1.13, V2: 1.73, V3: -1.34, V4: 2.77, V14: -3.11, V17: -1.99 },
      { V1: -3.04, V2: 2.11, V3: -2.01, V4: 4.12, V14: -5.01, V17: -3.12 },
    ];
    const pattern = fraudPatterns[Math.floor(Math.random() * fraudPatterns.length)];
    for (let i = 1; i <= 28; i++) {
      vf[`V${i}`] = pattern[`V${i}`] !== undefined 
        ? pattern[`V${i}`] + (Math.random() - 0.5) * 0.5
        : (Math.random() - 0.5) * 4;
    }
    return { 
      Time: Math.random() * 172792, 
      Amount: 800 + Math.random() * 4200, 
      ...vf 
    };
  } else {
    for (let i = 1; i <= 28; i++) {
      vf[`V${i}`] = (Math.random() - 0.5) * (fraud ? 8:2);
    }
    return { 
      Time: Math.random() * 172792, 
      Amount: 5 + Math.random() * 395, 
      ...vf 
    };
  }
}

function KPICard({ label, value, sub, color }) {
  return (
    <div style={{ background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", position: "relative", overflow: "hidden", flex: 1 }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: color }} />
      <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: "monospace", letterSpacing: -1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function TxRow({ tx }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "8px 12px", borderRadius: 6, marginBottom: 4,
      background: tx.isFraud ? "rgba(255,51,85,0.08)" : "rgba(0,255,136,0.06)",
      borderLeft: `3px solid ${tx.isFraud ? C.red : C.green}`,
      animation: "slidein 0.3s ease"
    }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: tx.isFraud ? C.red : C.green }}>
          {tx.isFraud ? "⬡ FRAUD" : "● SAFE"} · {tx.time}
        </div>
        <div style={{ fontSize: 10, color: C.muted }}>ID: {tx.id} · {tx.risk}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.text, fontFamily: "monospace" }}>${parseFloat(tx.amount).toLocaleString()}</div>
        <div style={{ fontSize: 10, color: tx.prob > 0.5 ? C.red : C.muted }}>{(tx.prob * 100).toFixed(1)}% risk</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [running, setRunning] = useState(false);
  const [txs, setTxs] = useState([]);
  const [tab, setTab] = useState("live");
  const [fraudTrend, setFraudTrend] = useState([]);
  const [uploading, setUploading] = useState(false);
  const intervalRef = useRef(null);

  // ── Live loop ──────────────────────────────────────────
  const tick = useCallback(async () => {
    const raw = generateTx();
    try {
      const res = await fetch(`${API}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(raw)
      });
      const data = await res.json();
      const tx = {
        id: Math.random().toString(36).substr(2, 8).toUpperCase(),
        time: new Date().toLocaleTimeString(),
        amount: raw.Amount.toFixed(2),
        isFraud: data.is_fraud,
        prob: data.fraud_probability,
        risk: data.risk_level,
      };
      setTxs(prev => {
        const updated = [tx, ...prev].slice(0, 500);
        const r10 = updated.slice(0, 10);
        const rate = (r10.filter(t => t.isFraud).length / r10.length) * 100;
        setFraudTrend(p => [...p.slice(-40), { v: rate }]);
        return updated;
      });
    } catch (e) {
      console.error("API error:", e);
    }
  }, []);

  // ── CSV Upload ─────────────────────────────────────────
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    const text = await file.text();
    const rows = text.split("\n").slice(1).filter(r => r.trim());

    for (const row of rows.slice(0, 50)) {
      const cols = row.split(",");
      if (cols.length < 30) continue;

      const tx = {
        Time: parseFloat(cols[0]),
        V1: parseFloat(cols[1]),  V2: parseFloat(cols[2]),
        V3: parseFloat(cols[3]),  V4: parseFloat(cols[4]),
        V5: parseFloat(cols[5]),  V6: parseFloat(cols[6]),
        V7: parseFloat(cols[7]),  V8: parseFloat(cols[8]),
        V9: parseFloat(cols[9]),  V10: parseFloat(cols[10]),
        V11: parseFloat(cols[11]), V12: parseFloat(cols[12]),
        V13: parseFloat(cols[13]), V14: parseFloat(cols[14]),
        V15: parseFloat(cols[15]), V16: parseFloat(cols[16]),
        V17: parseFloat(cols[17]), V18: parseFloat(cols[18]),
        V19: parseFloat(cols[19]), V20: parseFloat(cols[20]),
        V21: parseFloat(cols[21]), V22: parseFloat(cols[22]),
        V23: parseFloat(cols[23]), V24: parseFloat(cols[24]),
        V25: parseFloat(cols[25]), V26: parseFloat(cols[26]),
        V27: parseFloat(cols[27]), V28: parseFloat(cols[28]),
        Amount: parseFloat(cols[29])
      };

      try {
        const res = await fetch(`${API}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tx)
        });
        const data = await res.json();
        setTxs(prev => [{
          id: Math.random().toString(36).substr(2, 8).toUpperCase(),
          time: new Date().toLocaleTimeString(),
          amount: tx.Amount.toFixed(2),
          isFraud: data.is_fraud,
          prob: data.fraud_probability,
          risk: data.risk_level,
        }, ...prev].slice(0, 200));
      } catch (e) { console.error(e); }
    }
    setUploading(false);
  };

  // ── CSV Download ───────────────────────────────────────
  const downloadCSV = () => {
    const headers = "id,time,amount,is_fraud,fraud_probability,risk_level";
    const rows = txs.map(t => `${t.id},${t.time},${t.amount},${t.isFraud},${t.prob.toFixed(4)},${t.risk}`);
    const blob = new Blob([[headers, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "fraudshield_results.csv"; a.click();
  };

  useEffect(() => {
    if (running) {
      tick();
      intervalRef.current = setInterval(tick, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, tick]);

  // ── Stats ─────────────────────────────────────────────
  const total = txs.length;
  const frauds = txs.filter(t => t.isFraud).length;
  const safe = total - frauds;
  const fraudRate = total > 0 ? (frauds / total * 100) : 0;
  const fraudAmt = txs.filter(t => t.isFraud).reduce((s, t) => s + parseFloat(t.amount), 0);
  const safeAmt = txs.filter(t => !t.isFraud).reduce((s, t) => s + parseFloat(t.amount), 0);

  const scatterData = txs.slice(-40).map((t, i) => ({ x: i, y: t.prob, fraud: t.isFraud }));
  const barData = txs.slice(-25).map((t, i) => ({ x: i, amt: parseFloat(t.amount), fraud: t.isFraud }));
  const pieData = [{ name: "Safe", value: safe || 1 }, { name: "Fraud", value: frauds || 0 }];

  const tabs = ["live", "charts", "summary"];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: 16, fontFamily: "'Sora', sans-serif, system-ui" }}>
      <style>{`
        @keyframes slidein { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1a2540; border-radius: 3px; }
        * { box-sizing: border-box; }
      `}</style>

      {/* Hidden CSV input */}
      <input
        id="csvInput"
        type="file"
        accept=".csv"
        style={{ display: "none" }}
        onChange={handleUpload}
      />
      {uploading && (
        <div style={{ color: C.amber, fontSize: 12, textAlign: "center", marginBottom: 8, padding: "6px", background: `${C.amber}11`, borderRadius: 8 }}>
          ⏳ Processing CSV... please wait
        </div>
      )}

      {/* TOPBAR */}
      <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg, ${C.cyan}22, ${C.purple}22)`, border: `1px solid ${C.cyan}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🛡️</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, background: `linear-gradient(90deg, ${C.cyan}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>FraudShield AI</div>
            <div style={{ fontSize: 10, color: C.muted }}>Real-time transaction intelligence · LightGBM · ROC-AUC 0.97 · Built by Disha</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 11, color: C.dim, fontFamily: "monospace" }}>{new Date().toLocaleString()}</div>
          <div style={{ padding: "4px 12px", borderRadius: 20, background: running ? "rgba(0,255,136,0.1)" : "rgba(100,116,139,0.1)", border: `0.5px solid ${running ? C.green : C.muted}`, fontSize: 10, fontWeight: 600, color: running ? C.green : C.muted, letterSpacing: 1 }}>
            ● {running ? "LIVE" : "PAUSED"}
          </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {[
          { label: "▶ Start", color: C.cyan, action: () => setRunning(true) },
          { label: "⏹ Stop", color: C.red, action: () => setRunning(false) },
          { label: "🗑 Clear", color: C.muted, action: () => { setTxs([]); setFraudTrend([]); } },
          { label: uploading ? "⏳ Processing..." : "⬆ Upload CSV", color: C.purple, action: () => document.getElementById('csvInput').click() },
          { label: "⬇ Download CSV", color: C.green, action: downloadCSV },
        ].map(({ label, color, action }) => (
          <button key={label} onClick={action} style={{
            flex: 1, padding: "9px 16px", borderRadius: 8,
            border: `0.5px solid ${color}44`,
            background: `${color}11`, color, cursor: "pointer",
            fontSize: 12, fontWeight: 500, fontFamily: "inherit",
            transition: "all 0.15s"
          }}>{label}</button>
        ))}
      </div>

      {/* KPIs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <KPICard label="Transactions" value={total.toLocaleString()} sub="processed" color={C.cyan} />
        <KPICard label="Fraud detected" value={frauds} sub={`${fraudRate.toFixed(1)}% rate`} color={C.red} />
        <KPICard label="Safe" value={safe.toLocaleString()} sub={`$${safeAmt.toLocaleString("en", { maximumFractionDigits: 0 })} cleared`} color={C.green} />
        <KPICard label="Amount at risk" value={`$${fraudAmt.toLocaleString("en", { maximumFractionDigits: 0 })}`} sub="flagged" color={C.red} />
        <KPICard label="Avg risk" value={`${total > 0 ? (txs.reduce((s, t) => s + t.prob, 0) / total * 100).toFixed(1) : 0}%`} sub="model confidence" color={C.amber} />
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 4, marginBottom: 12, background: C.surface, padding: 4, borderRadius: 10, border: `0.5px solid ${C.border}`, width: "fit-content" }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "6px 16px", borderRadius: 7, border: tab === t ? `0.5px solid ${C.border}` : "none",
            background: tab === t ? C.card : "transparent",
            color: tab === t ? C.cyan : C.muted,
            cursor: "pointer", fontSize: 12, fontWeight: 500, fontFamily: "inherit"
          }}>
            {t === "live" ? "📡 Live" : t === "charts" ? "📊 Charts" : "📋 Summary"}
          </button>
        ))}
      </div>

      {/* TAB: LIVE */}
      {tab === "live" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>📡 Live feed</div>
            <div style={{ fontSize: 11, color: C.dim, marginBottom: 12 }}>Real-time predictions — red = fraud, green = safe</div>
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {txs.length === 0
                ? <div style={{ color: C.dim, fontSize: 12, textAlign: "center", padding: "40px 0" }}>▶ Start monitoring or upload CSV</div>
                : txs.slice(0, 20).map(tx => <TxRow key={tx.id} tx={tx} />)
              }
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>📈 Fraud rate trend</div>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 8 }}>Rolling 10-tx average — spikes = suspicious activity</div>
              <ResponsiveContainer width="100%" height={110}>
                <LineChart data={fraudTrend}>
                  <Line type="monotone" dataKey="v" stroke={C.red} strokeWidth={2} dot={false} />
                  <ReferenceLine y={50} stroke={C.amber} strokeDasharray="3 3" />
                  <YAxis domain={[0, 100]} tick={{ fill: C.dim, fontSize: 10 }} tickFormatter={v => `${v}%`} width={30} />
                  <XAxis hide />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>🎯 Risk score timeline</div>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 8 }}>Dot = safe · Circle = fraud · Yellow = 50% threshold</div>
              <ResponsiveContainer width="100%" height={110}>
                <ScatterChart>
                  <XAxis dataKey="x" hide />
                  <YAxis dataKey="y" domain={[0, 1]} tick={{ fill: C.dim, fontSize: 10 }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} width={35} />
                  <ReferenceLine y={0.5} stroke={C.amber} strokeDasharray="3 3" />
                  <Scatter data={scatterData.filter(d => !d.fraud)} fill={C.green} opacity={0.7} r={4} />
                  <Scatter data={scatterData.filter(d => d.fraud)} fill={C.red} opacity={0.9} r={6} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CHARTS */}
      {tab === "charts" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div style={{ background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>💰 Amount distribution</div>
            <div style={{ fontSize: 11, color: C.dim, marginBottom: 8 }}>Red = fraud (usually higher value)</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData}>
                <XAxis hide />
                <YAxis tick={{ fill: C.dim, fontSize: 10 }} tickFormatter={v => `$${v}`} width={45} />
                <Tooltip contentStyle={{ background: C.card, border: `0.5px solid ${C.border}`, color: C.text, fontSize: 11 }} formatter={(v) => [`$${v.toFixed(2)}`, "Amount"]} />
                <Bar dataKey="amt" radius={[2, 2, 0, 0]}>
                  {barData.map((d, i) => <Cell key={i} fill={d.fraud ? C.red : C.green} opacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>🔵 Detection split</div>
            <div style={{ fontSize: 11, color: C.dim, marginBottom: 8 }}>Safe vs fraud ratio</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" opacity={0.85}>
                  <Cell fill={C.green} />
                  <Cell fill={C.red} />
                </Pie>
                <Tooltip contentStyle={{ background: C.card, border: `0.5px solid ${C.border}`, color: C.text, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, fontSize: 11 }}>
              <span style={{ color: C.green }}>● Safe {(100 - fraudRate).toFixed(1)}%</span>
              <span style={{ color: C.red }}>● Fraud {fraudRate.toFixed(1)}%</span>
            </div>
          </div>

          <div style={{ background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>⚡ Model performance</div>
            {[["ROC-AUC", 97.8, C.cyan], ["Precision", 86, C.green], ["Recall", 63, C.amber], ["F1 Score", 73, C.purple]].map(([label, val, color]) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: C.muted }}>{label}</span>
                  <span style={{ color, fontFamily: "monospace", fontWeight: 600 }}>{val}%</span>
                </div>
                <div style={{ height: 4, background: C.border, borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${val}%`, background: color, borderRadius: 2, opacity: 0.8 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: SUMMARY */}
      {tab === "summary" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>📋 Session summary</div>
            {[
              ["Total processed", `${total} transactions`, C.cyan],
              ["Fraud detected", `${frauds} (${fraudRate.toFixed(2)}%)`, C.red],
              ["Safe passed", `${safe} transactions`, C.green],
              ["Safe amount", `$${safeAmt.toLocaleString("en", { maximumFractionDigits: 0 })}`, C.green],
              ["Fraud amount", `$${fraudAmt.toLocaleString("en", { maximumFractionDigits: 0 })}`, C.red],
              ["Model ROC-AUC", "0.9780", C.cyan],
              ["False negatives", "13 / 98", C.purple],
            ].map(([label, val, color]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `0.5px solid ${C.border}`, fontSize: 12 }}>
                <span style={{ color: C.muted }}>{label}</span>
                <span style={{ color, fontFamily: "monospace", fontWeight: 600 }}>{val}</span>
              </div>
            ))}
          </div>

          <div style={{ background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>🚨 Fraud alerts</div>
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {txs.filter(t => t.isFraud).slice(0, 15).length === 0
                ? <div style={{ color: C.dim, fontSize: 12, textAlign: "center", padding: "40px 0" }}>No fraud detected yet</div>
                : txs.filter(t => t.isFraud).slice(0, 15).map(tx => <TxRow key={tx.id} tx={tx} />)
              }
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 16, fontSize: 10, color: C.dim, fontFamily: "monospace", letterSpacing: 2 }}>
        FRAUDSHIELD AI · LIGHTGBM · ROC-AUC 0.9780 · BUILT BY DISHA
      </div>
    </div>
  );
}
