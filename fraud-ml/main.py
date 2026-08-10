from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import numpy as np
import joblib
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="FinFlow Fraud Detection ML", version="1.0.0")

# Load model (fallback to rule-based if no model file)
MODEL_PATH = os.getenv("MODEL_PATH", "fraud_model.pkl")
model = None

try:
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        logger.info("ML model loaded successfully")
    else:
        logger.warning("No model file found, using rule-based fallback")
except Exception as e:
    logger.error(f"Failed to load model: {e}")

class FraudCheckRequest(BaseModel):
    amount: float
    country: str
    hour: int
    merchant: str
    velocity: int
    transaction_id: Optional[str] = None
    from_account: Optional[str] = None
    to_account: Optional[str] = None

class FraudCheckResponse(BaseModel):
    fraud_score: float
    fraud_level: str
    reason: str
    blocked: bool

@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": model is not None}

@app.post("/predict", response_model=FraudCheckResponse)
def predict(request: FraudCheckRequest):
    try:
        if model is not None:
            # ML prediction
            features = np.array([[
                request.amount,
                request.hour,
                request.velocity,
                hash(request.country) % 1000,
                hash(request.merchant) % 1000
            ]])
            score = float(model.predict_proba(features)[0][1])
        else:
            # Rule-based fallback
            score = rule_based_score(request)

        level = "CRITICAL" if score > 0.8 else "HIGH" if score > 0.6 else "MEDIUM" if score > 0.3 else "LOW"
        reason = generate_reason(request, score)
        blocked = score > 0.8

        logger.info(f"Transaction {request.transaction_id}: score={score:.4f}, level={level}")

        return FraudCheckResponse(
            fraud_score=round(score, 4),
            fraud_level=level,
            reason=reason,
            blocked=blocked
        )
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def rule_based_score(request: FraudCheckRequest) -> float:
    score = 0.0
    if request.amount > 100000:
        score += 0.3
    if request.hour < 6 or request.hour > 23:
        score += 0.25
    if request.velocity > 5:
        score += 0.2
    if request.merchant == "UNKNOWN":
        score += 0.15
    if request.country not in ["TH", "US", "SG", "JP"]:
        score += 0.1
    return min(score, 1.0)

def generate_reason(request: FraudCheckRequest, score: float) -> str:
    reasons = []
    if request.amount > 100000:
        reasons.append("High transaction amount")
    if request.hour < 6 or request.hour > 23:
        reasons.append("Unusual transaction hour")
    if request.velocity > 5:
        reasons.append("High transaction velocity")
    if request.merchant == "UNKNOWN":
        reasons.append("Unknown merchant")
    if not reasons:
        reasons.append("Normal transaction pattern")
    return "; ".join(reasons)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
