from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import numpy as np
import joblib
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="FinFlow Fraud Detection ML", version="2.0.0")

MODEL_PATH = os.getenv("MODEL_PATH", "fraud_model.pkl")
MODEL_VERSION = "2.0.0-engineered-features"
model = None

try:
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        logger.info("ML model loaded successfully")
    else:
        logger.warning("No model file found, using rule-based fallback")
except Exception as e:
    logger.error(f"Failed to load model: {e}")

TRUSTED_COUNTRIES = {"TH", "US", "SG", "JP", "GB", "AU"}
HIGH_RISK_TYPES = {"WITHDRAW", "PAYMENT"}

FEATURE_NAMES = [
    "amount", "hour", "velocity", "country_risk", "merchant_risk",
    "is_round_amount", "is_weekend", "type_risk", "amount_velocity_interaction"
]


class FraudCheckRequest(BaseModel):
    amount: float
    country: str
    hour: int
    merchant: str
    velocity: int
    transaction_id: Optional[str] = None
    from_account: Optional[str] = None
    to_account: Optional[str] = None
    transaction_type: Optional[str] = None
    day_of_week: Optional[int] = None  # ISO 1=Monday .. 7=Sunday


class Signal(BaseModel):
    name: str
    weight: float
    detail: str


class FraudCheckResponse(BaseModel):
    fraud_score: float
    fraud_level: str
    reason: str
    blocked: bool
    signals: List[Signal] = []
    model_version: str = MODEL_VERSION


def is_night_hour(hour: int) -> bool:
    return hour < 6 or hour > 23


def is_weekend(day_of_week: Optional[int]) -> bool:
    return day_of_week is not None and day_of_week >= 6


def is_round_amount(amount: float) -> bool:
    return amount > 1000 and amount % 1000 == 0


def build_signals(request: FraudCheckRequest) -> List[Signal]:
    """
    Deterministic, explainable risk signals. Used directly as the rule-based
    fallback score, and reported alongside the ML score so a human reviewer
    can see *why* a transaction was flagged regardless of which scoring path ran.
    """
    signals: List[Signal] = []

    if request.amount > 200000:
        signals.append(Signal(name="very_high_amount", weight=0.35,
                               detail="Very high transaction amount"))
    elif request.amount > 100000:
        signals.append(Signal(name="high_amount", weight=0.25,
                               detail="High transaction amount"))

    if is_night_hour(request.hour):
        signals.append(Signal(name="unusual_hour", weight=0.2,
                               detail="Unusual transaction hour"))

    if request.velocity > 8:
        signals.append(Signal(name="very_high_velocity", weight=0.3,
                               detail="Very high transaction velocity"))
    elif request.velocity > 5:
        signals.append(Signal(name="high_velocity", weight=0.2,
                               detail="High transaction velocity"))

    if request.merchant == "UNKNOWN":
        signals.append(Signal(name="unknown_merchant", weight=0.15,
                               detail="Unknown merchant"))

    if request.country not in TRUSTED_COUNTRIES:
        signals.append(Signal(name="uncommon_country", weight=0.1,
                               detail=f"Uncommon country ({request.country})"))

    if is_round_amount(request.amount) and request.velocity > 3 and request.amount > 5000:
        signals.append(Signal(name="structuring_pattern", weight=0.3,
                               detail="Repeated round-number amounts at elevated velocity "
                                      "(possible structuring)"))
    elif is_round_amount(request.amount):
        signals.append(Signal(name="round_amount", weight=0.1,
                               detail="Round-number amount (possible structuring)"))

    if is_weekend(request.day_of_week):
        signals.append(Signal(name="weekend", weight=0.05,
                               detail="Weekend transaction"))

    if request.transaction_type in HIGH_RISK_TYPES and request.velocity > 3:
        signals.append(Signal(name="rapid_high_risk_type", weight=0.1,
                               detail=f"Rapid {request.transaction_type.lower()} activity"))

    # Interaction signal: large amount moved during a burst of activity is a stronger
    # signal together than either factor alone (classic account-takeover pattern).
    if request.amount > 50000 and request.velocity > 5:
        signals.append(Signal(name="amount_velocity_combo", weight=0.15,
                               detail="Large amount combined with high velocity"))

    return signals


def rule_based_score(signals: List[Signal]) -> float:
    return min(sum(s.weight for s in signals), 1.0)


def engineer_features(request: FraudCheckRequest) -> np.ndarray:
    country_risk = 0.0 if request.country in TRUSTED_COUNTRIES else 1.0
    merchant_risk = 1.0 if request.merchant == "UNKNOWN" else 0.0
    type_risk = 1.0 if request.transaction_type in HIGH_RISK_TYPES else 0.0
    return np.array([[
        request.amount,
        request.hour,
        request.velocity,
        country_risk,
        merchant_risk,
        1.0 if is_round_amount(request.amount) else 0.0,
        1.0 if is_weekend(request.day_of_week) else 0.0,
        type_risk,
        request.amount * request.velocity,
    ]])


def rank_reason(signals: List[Signal]) -> str:
    if not signals:
        return "Normal transaction pattern"
    ranked = sorted(signals, key=lambda s: s.weight, reverse=True)
    return "; ".join(s.detail for s in ranked)


@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": model is not None, "model_version": MODEL_VERSION}


@app.get("/model/info")
def model_info():
    return {
        "model_loaded": model is not None,
        "model_version": MODEL_VERSION,
        "features": FEATURE_NAMES,
        "scoring_mode": "ml" if model is not None else "rule_based_fallback"
    }


@app.post("/predict", response_model=FraudCheckResponse)
def predict(request: FraudCheckRequest):
    try:
        signals = build_signals(request)
        rule_score = rule_based_score(signals)

        if model is not None:
            features = engineer_features(request)
            ml_score = float(model.predict_proba(features)[0][1])
            # Blend: ML score carries the pattern learned from training data, the rule
            # score keeps the decision explainable and prevents the model drifting away
            # from known-bad patterns when it sees inputs unlike its training distribution.
            score = round(0.7 * ml_score + 0.3 * rule_score, 4)
        else:
            score = round(rule_score, 4)

        level = "CRITICAL" if score > 0.8 else "HIGH" if score > 0.6 else "MEDIUM" if score > 0.3 else "LOW"
        reason = rank_reason(signals)
        blocked = score > 0.8

        logger.info(f"Transaction {request.transaction_id}: score={score:.4f}, level={level}, "
                    f"signals={[s.name for s in signals]}")

        return FraudCheckResponse(
            fraud_score=score,
            fraud_level=level,
            reason=reason,
            blocked=blocked,
            signals=sorted(signals, key=lambda s: s.weight, reverse=True),
            model_version=MODEL_VERSION
        )
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
