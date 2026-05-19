import lightgbm as lgb
import joblib
import os
import sys
import numpy as np
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix
from imblearn.over_sampling import SMOTE

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from src.preprocess import load_and_clean, split_data

def train_model():
    print("📦 Data load ho raha hai...")
    df = load_and_clean()
    X_train, X_test, y_train, y_test = split_data(df)
    
    print(f"Train size: {X_train.shape}, Test size: {X_test.shape}")
    print(f"Fraud in train: {y_train.sum()}")

    # SMOTE — extreme imbalance handle karo
    print("⚖️ SMOTE apply ho raha hai...")
    sm = SMOTE(random_state=42)
    X_res, y_res = sm.fit_resample(X_train, y_train)
    print(f"After SMOTE — Total: {len(X_res)}, Fraud: {y_res.sum()}")

    # LightGBM model
    print("🚀 Training shuru...")
    model = lgb.LGBMClassifier(
        n_estimators=500,
        learning_rate=0.05,
        max_depth=6,
        num_leaves=31,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        verbose=-1
    )

    model.fit(
        X_res, y_res,
        eval_set=[(X_test, y_test)],
    )

    # Evaluate
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    print("\n📊 Results:")
    print(classification_report(y_test, y_pred))
    print(f"ROC-AUC: {roc_auc_score(y_test, y_prob):.4f}")

    cm = confusion_matrix(y_test, y_pred)
    print(f"Confusion Matrix:\n{cm}")
    print(f"False Positives: {cm[0][1]} | False Negatives: {cm[1][0]}")

    # Save model aur scaler
    models_dir = os.path.join(BASE_DIR, 'models')
    os.makedirs(models_dir, exist_ok=True)
    
    joblib.dump(model, os.path.join(models_dir, 'lgbm_model.pkl'))
    
    
    print("\n✅ Model saved!")
    return model, X_test, y_test

if __name__ == '__main__':
    train_model()