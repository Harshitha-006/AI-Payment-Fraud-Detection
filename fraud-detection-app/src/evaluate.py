from __future__ import annotations

from typing import Any

import numpy as np
from sklearn.metrics import (
    average_precision_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)


def evaluate_model(y_true: np.ndarray, probabilities: np.ndarray, threshold: float = 0.5) -> dict[str, Any]:
    predictions = (probabilities >= threshold).astype(int)
    fpr, tpr, _ = roc_curve(y_true, probabilities)
    precision, recall, _ = __import__("sklearn.metrics", fromlist=["precision_recall_curve"]).precision_recall_curve(
        y_true, probabilities
    )
    return {
        "precision": float(precision_score(y_true, predictions, zero_division=0)),
        "recall": float(recall_score(y_true, predictions, zero_division=0)),
        "f1_score": float(f1_score(y_true, predictions, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_true, probabilities)),
        "pr_auc": float(average_precision_score(y_true, probabilities)),
        "confusion_matrix": confusion_matrix(y_true, predictions).tolist(),
        "roc_curve": [{"x": float(x), "y": float(y)} for x, y in zip(fpr, tpr)],
        "pr_curve": [{"x": float(x), "y": float(y)} for x, y in zip(recall, precision)],
    }