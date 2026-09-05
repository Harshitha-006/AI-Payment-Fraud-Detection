# AI Payment Fraud Detection

This folder contains the reproducible modeling pipeline and standalone FastAPI serving layer behind the AI Payment Fraud Detection workspace. The default path uses a realistic synthetic dataset so the project runs without Kaggle credentials; replace it with a public CSV at `data/transactions.csv` when available.

## Architecture

```text
transaction form ──POST /api/predict──> scoring service
       │                                  │
       │                                  ├── trained XGBoost pipeline
       │                                  ├── probability + risk label
       │                                  └── local SHAP reasons
       │
       └── dashboard <── /api/dashboard, /api/transactions, /api/metrics

training data → preprocessing → logistic baseline / random forest / XGBoost
             → imbalanced metrics → final_model.joblib + metrics.json
```

## Modeling pipeline

The training script generates behavioral features including amount, time, merchant, country, device novelty, velocity, average spend, spending variance, and account age. Missing values are imputed, numeric fields are standardized, categoricals are one-hot encoded, and the candidate models use class weighting or boosted-tree behavior to address the rare fraud class.

Models are compared using precision, recall, F1, ROC-AUC, and PR-AUC. The best PR-AUC candidate is saved as `models/final_model.joblib`, with `models/metrics.json` containing the complete comparison and curve data. SHAP values are produced for individual transactions by `src/explain.py`.

## Setup and commands

```bash
cd fraud-detection-app
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

python -m src.train
uvicorn api.main:app --reload --port 8000
pytest
```

The interactive React workspace lives in `artifacts/ai-payment-fraud-detection`. Its live endpoints are provided by the shared API server and are available under `/api`.

## Sample request

```json
{
  "transaction_amount": 840.0,
  "transaction_hour": 2,
  "day_of_week": 5,
  "merchant_category": "digital_goods",
  "country": "NG",
  "device_type": "mobile",
  "is_new_device": true,
  "transactions_last_1h": 6,
  "transactions_last_24h": 18,
  "avg_spend": 120.0,
  "spend_std_dev": 38.0,
  "account_age_days": 26
}
```

Example response:

```json
{
  "fraud_probability": 0.92,
  "prediction": "HIGH RISK",
  "top_reasons": [
    {"feature": "New device", "impact": "positive", "detail": "Device is new", "contribution": 0.24}
  ]
}
```

## Model summary

| Model | Role | Evaluation |
| --- | --- | --- |
| Logistic Regression | Interpretable baseline | Precision / recall / F1 / ROC-AUC / PR-AUC |
| Random Forest | Non-linear comparison | Precision / recall / F1 / ROC-AUC / PR-AUC |
| XGBoost | Selected primary model | Tuned for minority-class PR-AUC |

## Container

```bash
docker build -t ai-payment-fraud-detection .
docker run -p 8000:8000 ai-payment-fraud-detection
```