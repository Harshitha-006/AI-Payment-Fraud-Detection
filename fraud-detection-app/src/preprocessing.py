from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

NUMERIC_FEATURES = [
    "transaction_amount",
    "transaction_hour",
    "day_of_week",
    "transactions_last_1h",
    "transactions_last_24h",
    "avg_spend",
    "spend_std_dev",
    "account_age_days",
]
CATEGORICAL_FEATURES = ["merchant_category", "country", "device_type", "is_new_device"]
FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES


def generate_synthetic_dataset(rows: int = 20_000, seed: int = 42) -> pd.DataFrame:
    """Generate an imbalanced, behavior-aware dataset when Kaggle is unavailable."""
    rng = np.random.default_rng(seed)
    categories = np.array(["retail", "travel", "digital_goods", "grocery", "dining", "services"])
    countries = np.array(["US", "IN", "GB", "CA", "DE", "BR", "NG", "SG"])
    devices = np.array(["mobile", "desktop", "tablet"])

    account_age = rng.integers(7, 2_000, rows)
    avg_spend = np.round(rng.lognormal(mean=4.3, sigma=0.65, size=rows), 2)
    spend_std = np.round(avg_spend * rng.uniform(0.12, 0.75, rows), 2)
    amount = np.round(rng.lognormal(mean=4.4, sigma=0.85, size=rows), 2)
    hour = rng.integers(0, 24, rows)
    day = rng.integers(0, 7, rows)
    velocity_1h = rng.poisson(1.2, rows)
    velocity_24h = velocity_1h + rng.poisson(4.5, rows)
    new_device = rng.random(rows) < 0.14
    merchant = rng.choice(categories, rows, p=[0.28, 0.12, 0.08, 0.22, 0.18, 0.12])
    country = rng.choice(countries, rows)
    device = rng.choice(devices, rows, p=[0.57, 0.35, 0.08])

    risk = (
        -5.0
        + 1.25 * new_device
        + 0.48 * np.maximum(velocity_1h - 2, 0)
        + 0.72 * ((hour <= 4) | (hour >= 23))
        + 0.8 * (amount > np.maximum(avg_spend * 3, 500))
        + 0.48 * (account_age < 60)
        + 0.35 * np.isin(country, ["NG", "BR"])
        + 0.25 * (merchant == "digital_goods")
    )
    probability = 1 / (1 + np.exp(-risk))
    fraud = rng.random(rows) < probability * 0.34

    return pd.DataFrame(
        {
            "transaction_amount": amount,
            "transaction_hour": hour,
            "day_of_week": day,
            "merchant_category": merchant,
            "country": country,
            "device_type": device,
            "is_new_device": new_device,
            "transactions_last_1h": velocity_1h,
            "transactions_last_24h": velocity_24h,
            "avg_spend": avg_spend,
            "spend_std_dev": spend_std,
            "account_age_days": account_age,
            "is_fraud": fraud.astype(int),
        }
    )


def load_or_generate(path: str | Path | None = None) -> pd.DataFrame:
    if path and Path(path).exists():
        return pd.read_csv(path)
    return generate_synthetic_dataset()


def build_preprocessor() -> ColumnTransformer:
    numeric = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    categorical = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("one_hot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )
    return ColumnTransformer(
        [("numeric", numeric, NUMERIC_FEATURES), ("categorical", categorical, CATEGORICAL_FEATURES)]
    )