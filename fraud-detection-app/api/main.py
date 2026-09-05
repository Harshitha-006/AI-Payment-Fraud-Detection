from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from src.explain import explain_transaction

MODEL_PATH = Path(__file__).resolve().parents[1] / "models" / "final_model.joblib"
app = FastAPI(title="AI Payment Fraud Detection API", version="1.0.0")
model = None


class Transaction(BaseModel):
    transaction_amount: float = Field(gt=0)
    transaction_hour: int = Field(ge=0, le=23)
    day_of_week: int = Field(ge=0, le=6)
    merchant_category: str
    country: str = Field(min_length=2, max_length=2)
    device_type: str
    is_new_device: bool
    transactions_last_1h: int = Field(ge=0)
    transactions_last_24h: int = Field(ge=0)
    avg_spend: float = Field(ge=0)
    spend_std_dev: float = Field(ge=0)
    account_age_days: int = Field(ge=0)


@app.on_event("startup")
def load_model() -> None:
    global model
    if MODEL_PATH.exists():
        model = joblib.load(MODEL_PATH)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "model": "loaded" if model else "missing"}


@app.post("/predict")
def predict(transaction: Transaction) -> dict:
    if model is None:
        raise HTTPException(status_code=503, detail="Train the model before serving predictions.")
    row = pd.DataFrame([transaction.model_dump()])
    probability = float(model.predict_proba(row)[0, 1])
    return {
        "fraud_probability": round(probability, 4),
        "prediction": "HIGH RISK" if probability >= 0.5 else "LOW RISK",
        "top_reasons": explain_transaction(model, row),
        "scored_at": datetime.now(timezone.utc).isoformat(),
    }