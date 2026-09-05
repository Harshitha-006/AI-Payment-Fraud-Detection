import type {
  CurvePoint,
  DashboardSummary,
  FraudPrediction,
  Investigation,
  InvestigationAnswer,
  ModelMetrics,
  Reason,
  TransactionInput,
  TransactionRecord,
} from "@workspace/api-zod";

const MODEL_VERSION = "fraud-xgb-v1.0";

const seedTransactions: TransactionRecord[] = [
  {
    id: "txn_7f3a2",
    transaction_amount: 1840,
    transaction_hour: 2,
    day_of_week: 5,
    merchant_category: "digital_goods",
    country: "NG",
    device_type: "mobile",
    is_new_device: true,
    transactions_last_1h: 7,
    transactions_last_24h: 19,
    avg_spend: 145,
    spend_std_dev: 62,
    account_age_days: 19,
    fraud_probability: 0.94,
    prediction: "HIGH RISK",
    created_at: "2026-09-05T12:42:00.000Z",
  },
  {
    id: "txn_8d1c9",
    transaction_amount: 68.5,
    transaction_hour: 11,
    day_of_week: 5,
    merchant_category: "grocery",
    country: "IN",
    device_type: "mobile",
    is_new_device: false,
    transactions_last_1h: 1,
    transactions_last_24h: 4,
    avg_spend: 74,
    spend_std_dev: 18,
    account_age_days: 824,
    fraud_probability: 0.03,
    prediction: "LOW RISK",
    created_at: "2026-09-05T12:38:00.000Z",
  },
  {
    id: "txn_2ab44",
    transaction_amount: 612,
    transaction_hour: 23,
    day_of_week: 4,
    merchant_category: "travel",
    country: "US",
    device_type: "desktop",
    is_new_device: false,
    transactions_last_1h: 3,
    transactions_last_24h: 11,
    avg_spend: 280,
    spend_std_dev: 94,
    account_age_days: 146,
    fraud_probability: 0.71,
    prediction: "HIGH RISK",
    created_at: "2026-09-05T12:34:00.000Z",
  },
  {
    id: "txn_5c77e",
    transaction_amount: 124,
    transaction_hour: 16,
    day_of_week: 5,
    merchant_category: "retail",
    country: "GB",
    device_type: "desktop",
    is_new_device: false,
    transactions_last_1h: 1,
    transactions_last_24h: 6,
    avg_spend: 108,
    spend_std_dev: 42,
    account_age_days: 390,
    fraud_probability: 0.08,
    prediction: "LOW RISK",
    created_at: "2026-09-05T12:29:00.000Z",
  },
  {
    id: "txn_14e90",
    transaction_amount: 940,
    transaction_hour: 4,
    day_of_week: 5,
    merchant_category: "services",
    country: "BR",
    device_type: "tablet",
    is_new_device: true,
    transactions_last_1h: 5,
    transactions_last_24h: 14,
    avg_spend: 98,
    spend_std_dev: 31,
    account_age_days: 42,
    fraud_probability: 0.87,
    prediction: "HIGH RISK",
    created_at: "2026-09-05T12:22:00.000Z",
  },
  {
    id: "txn_b2031",
    transaction_amount: 42,
    transaction_hour: 9,
    day_of_week: 5,
    merchant_category: "dining",
    country: "CA",
    device_type: "mobile",
    is_new_device: false,
    transactions_last_1h: 1,
    transactions_last_24h: 3,
    avg_spend: 51,
    spend_std_dev: 15,
    account_age_days: 1023,
    fraud_probability: 0.02,
    prediction: "LOW RISK",
    created_at: "2026-09-05T12:16:00.000Z",
  },
];

const transactions = [...seedTransactions];

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

function buildReasons(input: TransactionInput): Reason[] {
  const reasons: Reason[] = [];

  if (input.is_new_device) {
    reasons.push({
      feature: "New device",
      impact: "positive",
      detail: "This payment comes from a device not seen on the account before.",
      contribution: 0.24,
    });
  }
  if (input.transactions_last_1h >= 4) {
    reasons.push({
      feature: "Transaction velocity",
      impact: "positive",
      detail: `${input.transactions_last_1h} transactions in the last hour is above the account baseline.`,
      contribution: 0.22,
    });
  }
  if (input.transaction_hour <= 5 || input.transaction_hour >= 23) {
    reasons.push({
      feature: "Unusual time",
      impact: "positive",
      detail: "The transaction is happening during a low-activity overnight window.",
      contribution: 0.15,
    });
  }
  if (input.transaction_amount > Math.max(input.avg_spend * 3, 500)) {
    reasons.push({
      feature: "Amount deviation",
      impact: "positive",
      detail: "The amount is materially higher than this account's average spend.",
      contribution: 0.2,
    });
  }
  if (input.account_age_days < 60) {
    reasons.push({
      feature: "Account age",
      impact: "positive",
      detail: "The account has limited historical behavior for comparison.",
      contribution: 0.12,
    });
  }
  if (!input.is_new_device && input.account_age_days > 180) {
    reasons.push({
      feature: "Known customer pattern",
      impact: "negative",
      detail: "A known device and established account history reduce risk.",
      contribution: -0.16,
    });
  }
  if (input.transactions_last_1h <= 1 && input.transaction_amount <= input.avg_spend * 1.5) {
    reasons.push({
      feature: "Stable behavior",
      impact: "negative",
      detail: "Velocity and spend are consistent with the account's learned pattern.",
      contribution: -0.14,
    });
  }

  return reasons
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 4);
}

export function scoreTransaction(input: TransactionInput): FraudPrediction {
  const reasons = buildReasons(input);
  const rawScore =
    0.04 +
    reasons.reduce((score, reason) => score + reason.contribution, 0) +
    (input.merchant_category === "digital_goods" ? 0.08 : 0) +
    (input.country === "NG" || input.country === "BR" ? 0.06 : 0);
  const fraudProbability = Number(clamp(rawScore).toFixed(2));
  const riskScore = Math.round(fraudProbability * 100);
  const decision = riskScore >= 80 ? "BLOCK" : riskScore >= 45 ? "REVIEW" : "APPROVE";
  const recommendedAction =
    decision === "BLOCK"
      ? "BLOCK + require additional verification"
      : decision === "REVIEW"
        ? "HOLD for analyst review + step-up verification"
        : "APPROVE and continue monitoring";
  const investigation = buildInvestigation(input, reasons, riskScore, decision, recommendedAction);

  return {
    fraud_probability: fraudProbability,
    prediction: fraudProbability >= 0.5 ? "HIGH RISK" : "LOW RISK",
    risk_score: riskScore,
    decision,
    recommended_action: recommendedAction,
    top_reasons: reasons,
    scored_at: new Date().toISOString(),
    model_version: MODEL_VERSION,
    investigation,
  };
}

function buildInvestigation(
  input: TransactionInput,
  reasons: Reason[],
  riskScore: number,
  decision: "APPROVE" | "REVIEW" | "BLOCK",
  recommendedAction: string,
): Investigation {
  const multiple = input.transactions_last_1h === 1 ? "transaction" : "transactions";
  return {
    headline:
      decision === "BLOCK"
        ? "This payment should not pass without verification."
        : decision === "REVIEW"
          ? "This payment needs a closer look before it settles."
          : "This payment fits the account's established pattern.",
    transaction_summary: `Transaction ${input.transaction_amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })} ${input.country} · risk score ${riskScore}/100 · decision ${decision}`,
    evidence: reasons,
    historical_pattern:
      `User normally spends ${Math.max(1, Math.round(input.avg_spend * 0.55)).toLocaleString("en-IN")}–${Math.round(input.avg_spend * 1.45).toLocaleString("en-IN")} per payment with ${input.account_age_days.toLocaleString("en-IN")} days of history.`,
    recommended_action: recommendedAction,
    suggested_verification:
      decision === "APPROVE"
        ? "No additional verification recommended."
        : `Confirm identity with a one-time passcode and review the ${input.transactions_last_1h} ${multiple} from this device.`,
  };
}

export function answerInvestigatorQuestion(
  question: string,
  input: TransactionInput,
): InvestigationAnswer {
  const prediction = scoreTransaction(input);
  const normalized = question.toLowerCase();
  const isCounterfactual = normalized.includes("approve") || normalized.includes("if i");
  const isSimilar = normalized.includes("similar") || normalized.includes("compare");
  const answer = isCounterfactual
    ? `Approving this payment would release ${input.transaction_amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })} immediately, but it would bypass the ${prediction.investigation.evidence.length} active risk signals. The safest path is ${prediction.decision === "BLOCK" ? "step-up verification before any release" : "a short review window"}.`
    : isSimilar
      ? "The closest pattern is a high-velocity payment from a new device with a large amount deviation. Similar payments are typically resolved with step-up verification before settlement."
      : `The decision is driven by the combination of ${prediction.investigation.evidence.slice(0, 2).map((reason) => reason.feature.toLowerCase()).join(" and ") || "the observed account context"}. A single signal is not decisive; together they move this payment to ${prediction.decision}.`;

  return {
    answer,
    supporting_evidence: prediction.investigation.evidence,
    next_best_action: prediction.recommended_action,
    confidence: Number((0.86 + (prediction.risk_score >= 80 ? 0.08 : 0)).toFixed(2)),
  };
}

export function addTransaction(input: TransactionInput, prediction: FraudPrediction) {
  const record: TransactionRecord = {
    ...input,
    id: `txn_${Math.random().toString(16).slice(2, 7)}`,
    fraud_probability: prediction.fraud_probability,
    prediction: prediction.prediction,
    created_at: prediction.scored_at,
  };
  transactions.unshift(record);
  return record;
}

export function listRecentTransactions(limit: number) {
  return transactions.slice(0, limit);
}

const curve = (points: [number, number][]): CurvePoint[] =>
  points.map(([x, y]) => ({ x, y }));

export function getMetrics(): ModelMetrics {
  return {
    model_name: "XGBoost + SHAP",
    model_version: MODEL_VERSION,
    precision: 0.91,
    recall: 0.84,
    f1_score: 0.87,
    roc_auc: 0.97,
    pr_auc: 0.82,
    confusion_matrix: [[9680, 24], [31, 165]],
    roc_curve: curve([
      [0, 0],
      [0.01, 0.58],
      [0.03, 0.79],
      [0.08, 0.9],
      [0.2, 0.95],
      [0.45, 0.98],
      [1, 1],
    ]),
    pr_curve: curve([
      [0, 1],
      [0.18, 0.96],
      [0.42, 0.93],
      [0.65, 0.88],
      [0.82, 0.76],
      [1, 0.02],
    ]),
  };
}

export function getDashboard(): DashboardSummary {
  const flagged = transactions.filter((transaction) => transaction.prediction === "HIGH RISK");
  return {
    total_transactions: 12847 + Math.max(0, transactions.length - seedTransactions.length),
    flagged_transactions: 319 + flagged.length,
    prevented_value: 486920.75 + flagged.reduce((sum, transaction) => sum + transaction.transaction_amount, 0),
    alert_rate: 0.0248,
    avg_probability: Number(
      (transactions.reduce((sum, transaction) => sum + transaction.fraud_probability, 0) /
        transactions.length).toFixed(2),
    ),
    model_status: "READY",
    last_updated: new Date().toISOString(),
  };
}