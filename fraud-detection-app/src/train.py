from __future__ import annotations

import json
from pathlib import Path

import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from xgboost import XGBClassifier

from .evaluate import evaluate_model
from .preprocessing import FEATURES, build_preprocessor, load_or_generate

ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "models"


def train() -> dict:
    data = load_or_generate(ROOT / "data" / "transactions.csv")
    x_train, x_test, y_train, y_test = train_test_split(
        data[FEATURES], data["is_fraud"], test_size=0.2, stratify=data["is_fraud"], random_state=42
    )

    candidates = {
        "logistic_regression": LogisticRegression(max_iter=500, class_weight="balanced"),
        "random_forest": RandomForestClassifier(
            n_estimators=180, max_depth=12, class_weight="balanced_subsample", random_state=42, n_jobs=-1
        ),
        "xgboost": XGBClassifier(
            n_estimators=220,
            max_depth=5,
            learning_rate=0.08,
            subsample=0.85,
            colsample_bytree=0.8,
            eval_metric="logloss",
            random_state=42,
        ),
    }
    results = {}
    best_name = ""
    best_score = -1.0
    best_pipeline = None
    for name, classifier in candidates.items():
        pipeline = Pipeline([("preprocessor", build_preprocessor()), ("model", classifier)])
        pipeline.fit(x_train, y_train)
        probabilities = pipeline.predict_proba(x_test)[:, 1]
        metrics = evaluate_model(y_test.to_numpy(), probabilities)
        results[name] = metrics
        if metrics["pr_auc"] > best_score:
            best_name, best_score, best_pipeline = name, metrics["pr_auc"], pipeline

    assert best_pipeline is not None
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(best_pipeline, MODEL_DIR / "final_model.joblib")
    (MODEL_DIR / "metrics.json").write_text(
        json.dumps({"selected_model": best_name, "candidates": results}, indent=2)
    )
    return {"selected_model": best_name, "candidates": results}


if __name__ == "__main__":
    print(json.dumps(train(), indent=2))