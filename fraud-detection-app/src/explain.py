from __future__ import annotations

from typing import Any

import shap


def explain_transaction(pipeline: Any, transaction: Any, top_n: int = 5) -> list[dict[str, Any]]:
    """Return local SHAP contributions for one transaction.

    The trained pipeline is expected to end in a tree model and expose a
    named preprocessing step. This keeps explanations tied to the exact model
    artifact used for prediction.
    """
    preprocessor = pipeline.named_steps["preprocessor"]
    model = pipeline.named_steps["model"]
    transformed = preprocessor.transform(transaction)
    explainer = shap.TreeExplainer(model)
    values = explainer.shap_values(transformed)
    values = values[1] if isinstance(values, list) else values
    values = values[0] if getattr(values, "ndim", 1) > 1 else values
    names = preprocessor.get_feature_names_out()
    ranked = sorted(zip(names, values), key=lambda item: abs(float(item[1])), reverse=True)[:top_n]
    return [
        {
            "feature": feature.removeprefix("numeric__").removeprefix("categorical__"),
            "contribution": float(value),
            "impact": "positive" if value > 0 else "negative",
        }
        for feature, value in ranked
    ]