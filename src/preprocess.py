import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_and_clean():
    path = os.path.join(BASE_DIR, 'data', 'creditcard.csv')
    df = pd.read_csv(path)
    
    print(f"Dataset shape: {df.shape}")
    
    # NaN fix
    num_cols = df.select_dtypes(include=['float64', 'int64']).columns
    df[num_cols] = df[num_cols].fillna(df[num_cols].median())
    
    # Class force int
    df['Class'] = df['Class'].astype(int)
    
    print(f"Fraud cases: {df['Class'].sum()}")
    
    # ✅ Amount aur Time DONO scale karo alag alag scalers se
    amount_scaler = StandardScaler()
    time_scaler = StandardScaler()
    
    df['Amount_scaled'] = amount_scaler.fit_transform(df[['Amount']])
    df['Time_scaled'] = time_scaler.fit_transform(df[['Time']])
    
    # Original drop karo
    df = df.drop(['Amount', 'Time'], axis=1)
    
    # ✅ Scalers save karo
    models_dir = os.path.join(BASE_DIR, 'models')
    os.makedirs(models_dir, exist_ok=True)
    joblib.dump(amount_scaler, os.path.join(models_dir, 'amount_scaler.pkl'))
    joblib.dump(time_scaler, os.path.join(models_dir, 'time_scaler.pkl'))
    
    print(f"Columns: {df.columns.tolist()}")
    return df

def split_data(df):
    X = df.drop('Class', axis=1)
    y = df['Class'].astype(int)
    
    print(f"Class distribution:\n{y.value_counts()}")
    print(f"Feature columns: {X.columns.tolist()}")
    
    return train_test_split(
        X, y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )