import streamlit as st
import streamlit_authenticator as stauth
import requests
import numpy as np
import random
import time
import pandas as pd
import plotly.graph_objects as go
from datetime import datetime
import yaml
st.set_page_config(
    page_title="FraudShield AI",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="collapsed"
)
import streamlit_authenticator as stauth

credentials = {
    "usernames": {
        "disha": {
            "name": "Disha",
            "password": "$2b$12$aF4aLRe.8OQ6i.cAI56o8.vFe.SsT/Qor8Kh82t5rGtQ.1jzaKxWe"
        },
        "demo": {
            "name": "Demo User",
            "password": "$2b$12$t2MtaQidzrT816/sDI9Khu7tDmXNGCsJidKC/V6NMyZsqHYe8N1.6"
        }
    }
}

authenticator = stauth.Authenticate(
    credentials,
    "fraudshield",
    "abcdef123",
    cookie_expiry_days=1
)

authenticator.login("main")
name = st.session_state.get("name")
auth_status = st.session_state.get("authentication_status")
username = st.session_state.get("username")

if auth_status == False:
    st.error("Username ya password galat hai!")
    st.stop()
elif auth_status is None:
    st.markdown("### 🛡️ FraudShield AI")
    st.warning("Please login karein")
    
    col1, col2 = st.columns(2)
    with col1:
        st.info("**Demo credentials:**\nUsername: `demo`\nPassword: `demo123`")
    with col2:
        st.info("**Your account:**\nUsername: `disha`\nPassword: `password123`")
    
    if st.button("🚀 Guest Demo Access — No login needed", type="primary", use_container_width=True):
        st.session_state["authentication_status"] = True
        st.session_state["name"] = "Guest"
        st.session_state["username"] = "guest"
        st.rerun()
    
    st.stop()

authenticator.logout("Logout", "sidebar", key="logout_btn")
st.sidebar.write(f"Welcome, **{name}**!")

# ✅ Yahan se neeche poora dashboard code aayega
authenticator.logout("Logout", "sidebar")
st.sidebar.write(f"Welcome, **{name}**!")




st.markdown("""
<style>
    .stApp { background: #060B18; color: #E2E8F0; }
    #MainMenu, footer, header { visibility: hidden; }
    
    .top-bar {
        background: linear-gradient(90deg, #0A1628 0%, #0D1F3C 100%);
        border-bottom: 1px solid #1E3A5F;
        padding: 16px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-radius: 12px;
        margin-bottom: 20px;
    }
    .brand { font-size: 22px; font-weight: 800; 
        background: linear-gradient(90deg, #00D4FF, #0077FF);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .brand-sub { font-size: 11px; color: #4A90A4; margin-top: 2px; }
    .pill-live { background: #0A2E18; border: 1px solid #00C851;
        color: #00C851; padding: 4px 14px; border-radius: 20px;
        font-size: 11px; font-weight: 700; letter-spacing: 1px; }
    .pill-stopped { background: #2E1A0A; border: 1px solid #FF6B35;
        color: #FF6B35; padding: 4px 14px; border-radius: 20px;
        font-size: 11px; font-weight: 700; letter-spacing: 1px; }

    .kpi-card {
        background: #0A1628;
        border: 1px solid #1E3A5F;
        border-radius: 12px;
        padding: 18px 20px;
        text-align: center;
    }
    .kpi-label { font-size: 10px; color: #4A90A4; 
        text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px; }
    .kpi-val { font-size: 30px; font-weight: 800; }
    .kpi-sub { font-size: 11px; color: #4A90A4; margin-top: 4px; }
    .blue { color: #00D4FF; }
    .red { color: #FF4757; }
    .green { color: #00C851; }
    .yellow { color: #FFD700; }

    .tx-row-fraud {
        background: #1A0808;
        border-left: 3px solid #FF4757;
        border-radius: 8px;
        padding: 10px 14px;
        margin: 4px 0;
        font-size: 12px;
        color: #FFB3B8;
        display: flex;
        justify-content: space-between;
    }
    .tx-row-safe {
        background: #071510;
        border-left: 3px solid #00C851;
        border-radius: 8px;
        padding: 10px 14px;
        margin: 4px 0;
        font-size: 12px;
        color: #A8FFB8;
    }
    .section-title {
        font-size: 13px; font-weight: 600;
        color: #4A90A4; text-transform: uppercase;
        letter-spacing: 1px; margin-bottom: 10px;
    }
    .stButton > button {
        border-radius: 10px !important;
        font-weight: 600 !important;
        height: 44px !important;
    }
    div[data-testid="stSelectbox"] { margin-top: 0 !important; }
</style>
""", unsafe_allow_html=True)

# ── Session state ──────────────────────────────────────────
for key, val in [("txs", []), ("running", False), ("total_checked", 0)]:
    if key not in st.session_state:
        st.session_state[key] = val

API_URL = "http://localhost:8000/predict"

def generate_tx():
    fraud = random.random() < 0.08
    vf = {f"V{i}": np.random.normal(0, 3 if fraud else 1) for i in range(1, 29)}
    amt = random.uniform(800, 5000) if fraud else random.uniform(5, 400)
    return {"Time": random.uniform(0, 172792), "Amount": round(amt, 2), **vf}

def predict(tx):
    try:
        r = requests.post(API_URL, json=tx, timeout=3)
        return r.json()
    except:
        return {"is_fraud": False, "fraud_probability": 0.01, "risk_level": "LOW"}

# ── Top bar ────────────────────────────────────────────────
total = len(st.session_state.txs)
frauds = sum(1 for t in st.session_state.txs if t["is_fraud"])
fraud_rate = (frauds / total * 100) if total > 0 else 0
status = "LIVE" if st.session_state.running else "PAUSED"
pill_class = "pill-live" if st.session_state.running else "pill-stopped"

st.markdown(f"""
<div class="top-bar">
  <div>
    <div class="brand">🛡️ FraudShield AI</div>
    <div class="brand-sub">Real-Time Transaction Intelligence · LightGBM · ROC-AUC 0.97 · Built by Disha</div>
  </div>
  <div>
    <span class="{pill_class}">● {status}</span>
    <span style="color:#4A90A4;font-size:11px;margin-left:16px">
      {datetime.now().strftime("%d %b %Y · %H:%M:%S")}
    </span>
  </div>
</div>
""", unsafe_allow_html=True)

# ── Controls ───────────────────────────────────────────────
b1, b2, b3, b4 = st.columns([2, 1, 1, 1])
with b1:
    start = st.button("▶️ Start Monitoring", type="primary", use_container_width=True)
with b2:
    stop = st.button("⏹️ Stop", use_container_width=True)
with b3:
    clear = st.button("🗑️ Clear All", use_container_width=True)
with b4:
    speed = st.selectbox("", ["Normal (1s)", "Fast (0.5s)", "Slow (2s)"], label_visibility="collapsed")

delay_map = {"Normal (1s)": 1, "Fast (0.5s)": 0.5, "Slow (2s)": 2}
delay = delay_map[speed]

if start: st.session_state.running = True
if stop:  st.session_state.running = False
if clear:
    st.session_state.txs = []
    st.session_state.total_checked = 0

st.markdown("---")

# ── KPI Cards ──────────────────────────────────────────────
k1, k2, k3, k4, k5 = st.columns(5)

fraud_amt = sum(t["amount"] for t in st.session_state.txs if t["is_fraud"])
safe_amt  = sum(t["amount"] for t in st.session_state.txs if not t["is_fraud"])
avg_prob  = np.mean([t["prob"] for t in st.session_state.txs]) if st.session_state.txs else 0

k1.markdown(f"""<div class="kpi-card">
  <div class="kpi-label">Transactions</div>
  <div class="kpi-val blue">{total}</div>
  <div class="kpi-sub">processed</div>
</div>""", unsafe_allow_html=True)

k2.markdown(f"""<div class="kpi-card">
  <div class="kpi-label">Fraud Detected</div>
  <div class="kpi-val red">{frauds}</div>
  <div class="kpi-sub">{fraud_rate:.1f}% rate</div>
</div>""", unsafe_allow_html=True)

k3.markdown(f"""<div class="kpi-card">
  <div class="kpi-label">Safe</div>
  <div class="kpi-val green">{total - frauds}</div>
  <div class="kpi-sub">${safe_amt:,.0f} cleared</div>
</div>""", unsafe_allow_html=True)

k4.markdown(f"""<div class="kpi-card">
  <div class="kpi-label">Amount at Risk</div>
  <div class="kpi-val red">${fraud_amt:,.0f}</div>
  <div class="kpi-sub">flagged</div>
</div>""", unsafe_allow_html=True)

k5.markdown(f"""<div class="kpi-card">
  <div class="kpi-label">Avg Risk Score</div>
  <div class="kpi-val yellow">{avg_prob:.1%}</div>
  <div class="kpi-sub">model confidence</div>
</div>""", unsafe_allow_html=True)

st.markdown("---")

# ── Main layout ────────────────────────────────────────────
left, right = st.columns([2, 3])

# ── LEFT: Live feed ────────────────────────────────────────
with left:
    st.markdown('<div class="section-title">📡 Live Transaction Feed</div>', unsafe_allow_html=True)
    feed_box = st.empty()

# ── RIGHT: Charts ──────────────────────────────────────────
with right:
    r1, r2 = st.columns(2)
    with r1:
        st.markdown('<div class="section-title">📈 Fraud Rate Trend</div>', unsafe_allow_html=True)
        chart1 = st.empty()
    with r2:
        st.markdown('<div class="section-title">💰 Amount Distribution</div>', unsafe_allow_html=True)
        chart2 = st.empty()

    st.markdown('<div class="section-title" style="margin-top:16px">🎯 Risk Score Timeline</div>', unsafe_allow_html=True)
    chart3 = st.empty()

# ── Render functions ───────────────────────────────────────
def render_feed():
    recent = st.session_state.txs[-12:]
    html = ""
    for t in reversed(recent):
        if t["is_fraud"]:
            html += f"""<div class="tx-row-fraud">
              <span>🚨 <b>FRAUD</b> &nbsp;·&nbsp; {t['time']}</span>
              <span><b>${t['amount']:,.2f}</b> &nbsp;·&nbsp; {t['prob']:.0%} risk</span>
            </div>"""
        else:
            html += f"""<div class="tx-row-safe">
              ✅ <b>SAFE</b> &nbsp;·&nbsp; {t['time']} &nbsp;·&nbsp; 
              <b>${t['amount']:,.2f}</b> &nbsp;·&nbsp; {t['prob']:.0%} risk
            </div>"""
    if not html:
        html = "<p style='color:#4A90A4;font-size:13px'>Waiting for transactions...</p>"
    feed_box.markdown(html, unsafe_allow_html=True)

def render_charts():
    if len(st.session_state.txs) < 2:
        return

    df = pd.DataFrame(st.session_state.txs).tail(60)
    df['fraud_int'] = df['is_fraud'].astype(int)
    df['rolling'] = df['fraud_int'].rolling(10, min_periods=1).mean() * 100
    df['idx'] = range(len(df))

    # Chart 1 — Fraud rate line
    fig1 = go.Figure()
    fig1.add_trace(go.Scatter(
        x=df['idx'], y=df['rolling'],
        fill='tozeroy',
        line=dict(color='#FF4757', width=2),
        fillcolor='rgba(255,71,87,0.15)',
        mode='lines', name='Fraud Rate %'
    ))
    fig1.update_layout(
        paper_bgcolor='#0A1628', plot_bgcolor='#060B18',
        margin=dict(l=0, r=0, t=10, b=0), height=180,
        xaxis=dict(showgrid=False, color='#4A90A4', showticklabels=False),
        yaxis=dict(showgrid=True, gridcolor='#1E3A5F', color='#4A90A4',
                   ticksuffix='%', range=[0, 100]),
        showlegend=False, font=dict(color='#4A90A4')
    )
    chart1.plotly_chart(fig1, use_container_width=True, config={'displayModeBar': False})

    # Chart 2 — Amount bars
    colors = ['#FF4757' if f else '#00C851' for f in df['is_fraud']]
    fig2 = go.Figure(go.Bar(
        x=df['idx'], y=df['amount'],
        marker_color=colors, name='Amount'
    ))
    fig2.update_layout(
        paper_bgcolor='#0A1628', plot_bgcolor='#060B18',
        margin=dict(l=0, r=0, t=10, b=0), height=180,
        xaxis=dict(showgrid=False, showticklabels=False, color='#4A90A4'),
        yaxis=dict(showgrid=True, gridcolor='#1E3A5F', color='#4A90A4',
                   tickprefix='$'),
        showlegend=False, font=dict(color='#4A90A4')
    )
    chart2.plotly_chart(fig2, use_container_width=True, config={'displayModeBar': False})

    # Chart 3 — Risk score scatter
    fig3 = go.Figure()
    df_safe  = df[~df['is_fraud']]
    df_fraud = df[df['is_fraud']]
    fig3.add_trace(go.Scatter(
        x=df_safe['idx'], y=df_safe['prob'],
        mode='markers', name='Safe',
        marker=dict(color='#00C851', size=7, opacity=0.8)
    ))
    fig3.add_trace(go.Scatter(
        x=df_fraud['idx'], y=df_fraud['prob'],
        mode='markers', name='Fraud',
        marker=dict(color='#FF4757', size=10, opacity=1,
                    symbol='diamond')
    ))
    fig3.add_hline(y=0.5, line=dict(color='#FFD700', dash='dash', width=1))
    fig3.update_layout(
        paper_bgcolor='#0A1628', plot_bgcolor='#060B18',
        margin=dict(l=0, r=0, t=10, b=0), height=160,
        xaxis=dict(showgrid=False, showticklabels=False, color='#4A90A4'),
        yaxis=dict(showgrid=True, gridcolor='#1E3A5F', color='#4A90A4',
                   tickformat='.0%', range=[0, 1]),
        legend=dict(orientation='h', yanchor='bottom', y=1,
                    bgcolor='rgba(0,0,0,0)', font=dict(color='#4A90A4')),
        font=dict(color='#4A90A4')
    )
    chart3.plotly_chart(fig3, use_container_width=True, config={'displayModeBar': False})

# ── Loop ───────────────────────────────────────────────────
if st.session_state.running:
    tx     = generate_tx()
    result = predict(tx)

    st.session_state.txs.append({
        "time":     datetime.now().strftime("%H:%M:%S"),
        "amount":   tx["Amount"],
        "is_fraud": result.get("is_fraud", False),
        "prob":     result.get("fraud_probability", 0),
        "risk":     result.get("risk_level", "LOW"),
    })

    render_feed()
    render_charts()
    time.sleep(delay)
    st.rerun()

else:
    render_feed()
    render_charts()
    if not st.session_state.txs:
        with feed_box:
            st.info("▶️press Start Monitoring ! and SEE the magic of AI in action. FraudShield AI is ready to protect your transactions in real-time. 🚀")
