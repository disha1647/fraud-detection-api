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
    
    # ✅ DEBUG — yeh print karo
    print(f"Input columns: {df.columns.tolist()}")
    print(f"Amount: {df['Amount'].values}, Time: {df['Time'].values}")
    
    # Class column aa rahi ho toh drop karo
    if 'Class' in df.columns:
        df = df.drop(['Class'], axis=1)
    
    df['Amount_scaled'] = amount_scaler.transform(df[['Amount']])
    df['Time_scaled'] = time_scaler.transform(df[['Time']])
    df = df.drop(['Amount', 'Time'], axis=1)
    
    # Model ke expected features
    try:
        expected_cols = model.feature_name_
    except:
        expected_cols = model.booster_.feature_name()
    
    print(f"Expected cols: {expected_cols[:5]}")
    print(f"Got cols: {df.columns.tolist()[:5]}")
    
    for col in expected_cols:
        if col not in df.columns:
            df[col] = 0
    df = df[expected_cols]
    
    prob = model.predict_proba(df)[0][1]
    print(f"Probability: {prob}")
    
    prediction = int(prob > 0.3)
    
    return {
        "is_fraud": bool(prediction),
        "fraud_probability": round(float(prob), 4),
        "risk_level": "HIGH" if prob > 0.7 else "MEDIUM" if prob > 0.3 else "LOW"
    }