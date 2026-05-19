import joblib
import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

model = None
amount_scaler = None
time_scaler = None

def load_model():
    global model, amount_scaler, time_scaler
    if model is None:
        model = joblib.load(os.path.join(BASE_DIR, 'models', 'lgbm_model.pkl'))
        amount_scaler = joblib.load(os.path.join(BASE_DIR, 'models', 'amount_scaler.pkl'))
        time_scaler = joblib.load(os.path.join(BASE_DIR, 'models', 'time_scaler.pkl'))
    return model, amount_scaler, time_scaler

def predict_transaction(features: dict):
    model, amount_scaler, time_scaler = load_model()
    
    df = pd.DataFrame([features])
    
    # ✅ Alag alag scale karo
    df['Amount_scaled'] = amount_scaler.transform(df[['Amount']])
    df['Time_scaled'] = time_scaler.transform(df[['Time']])
    
    # Original drop karo
    df = df.drop(['Amount', 'Time'], axis=1)
    
    prob = model.predict_proba(df)[0][1]
    prediction = int(prob > 0.5)
    
    return {
        "is_fraud": bool(prediction),
        "fraud_probability": round(float(prob), 4),
        "risk_level": "HIGH" if prob > 0.7 else "MEDIUM" if prob > 0.3 else "LOW"
    }