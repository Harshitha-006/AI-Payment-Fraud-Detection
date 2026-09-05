from src.preprocessing import FEATURES, generate_synthetic_dataset


def test_synthetic_dataset_has_expected_shape_and_imbalance():
    data = generate_synthetic_dataset(rows=2_000)
    assert set(FEATURES).issubset(data.columns)
    assert "is_fraud" in data.columns
    fraud_rate = data["is_fraud"].mean()
    assert 0.005 < fraud_rate < 0.12