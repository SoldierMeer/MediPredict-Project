from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import pickle
import os

app = FastAPI()

MODEL_PATH = "medipredict_model.pkl"
DATA_PATH = "synthetic_adherence_data.csv"

def retrain_model_from_csv():
    """Trains the model using the synthetic CSV dataset."""
    if not os.path.exists(DATA_PATH):
        print(f"⚠️ {DATA_PATH} not found. Falling back to dummy training.")
        return train_dummy_model()

    df = pd.read_csv(DATA_PATH)
    # Ensure column names match exactly what we use for prediction
    features = ['avg_latency_minutes', 'missed_doses_last_7_days', 'late_doses_last_7_days']
    X = df[features]
    y = df['label']

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    print("✅ Model retrained successfully with feature names!")
    return model

def train_dummy_model():
    """Fallback training if CSV is missing."""
    data = {
        'avg_latency_minutes': [5, 45, 120, 0, 60],
        'missed_doses_last_7_days': [0, 1, 3, 0, 0],
        'late_doses_last_7_days': [1, 3, 2, 0, 4],
        'label': [0, 1, 2, 0, 1]
    }
    df = pd.DataFrame(data)
    X = df[['avg_latency_minutes', 'missed_doses_last_7_days', 'late_doses_last_7_days']]
    y = df['label']
    
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    return model

# --- LOAD OR TRAIN MODEL ON STARTUP ---
if os.path.exists(MODEL_PATH):
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
else:
    model = retrain_model_from_csv()

# --- API ENDPOINTS ---
class PatientData(BaseModel):
    avg_latency_minutes: float
    missed_doses_last_7_days: int
    late_doses_last_7_days: int

@app.post("/predict-risk")
async def predict_risk(data: PatientData):
    # ✅ FIX: Convert input to DataFrame with feature names to solve the warning
    input_df = pd.DataFrame([{
        "avg_latency_minutes": data.avg_latency_minutes,
        "missed_doses_last_7_days": data.missed_doses_last_7_days,
        "late_doses_last_7_days": data.late_doses_last_7_days
    }])
    
    try:
        # Predict probabilities and class
        prediction = model.predict(input_df)[0]
        probabilities = model.predict_proba(input_df)[0]
        
        risk_mapping = {0: "Stable", 1: "Warning", 2: "Critical"}
        predicted_level = risk_mapping.get(prediction, "Stable")
        
        # Generate dynamic insight
        insight = generate_insight(predicted_level, data)

        return {
            "level": predicted_level,
            "confidence": round(float(max(probabilities)) * 100, 2),
            "insight": insight
        }
    except Exception as e:
        print(f"🔴 Prediction Error: {e}")
        return {"level": "Stable", "confidence": 0, "insight": "Analysis unavailable."}

# ai_Service.py

def generate_insight(level, data):
    # ✅ Detect extreme gaps even if the model predicts "Stable"
    if data.avg_latency_minutes >= 480: # 8 Hours
        return f"Warning: Dangerous 8h+ delay detected. Medically equivalent to a missed dose."
    
    if level == "Critical":
        return f"Critical Alert: Significant instability. Avg delay: {int(data.avg_latency_minutes)}m."
    elif level == "Warning":
        return f"Unstable Routine: Medication frequently taken late ({int(data.avg_latency_minutes)}m avg)."
    
    return "Optimal timing: Medication taken within the recommended window."
# Run with: uvicorn ai_service:app --reload --port 8000