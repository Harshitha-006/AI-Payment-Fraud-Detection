import { Router, type IRouter } from "express";
import {
  GetDashboardSummaryResponse,
  GetModelMetricsResponse,
  AskRiskInvestigatorBody,
  AskRiskInvestigatorResponse,
  ListTransactionsQueryParams,
  ListTransactionsResponse,
  PredictTransactionBody,
  PredictTransactionResponse,
} from "@workspace/api-zod";
import {
  addTransaction,
  getDashboard,
  getMetrics,
  listRecentTransactions,
  scoreTransaction,
  answerInvestigatorQuestion,
} from "../lib/fraud-model";

const router: IRouter = Router();

router.post("/predict", (req, res) => {
  const parsed = PredictTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Transaction details are invalid." });
    return;
  }

  const prediction = PredictTransactionResponse.parse(scoreTransaction(parsed.data));
  addTransaction(parsed.data, prediction);
  res.json(prediction);
});

router.get("/transactions", (req, res) => {
  const parsed = ListTransactionsQueryParams.safeParse(req.query);
  const limit = parsed.success ? parsed.data.limit : 8;
  res.json(ListTransactionsResponse.parse(listRecentTransactions(limit)));
});

router.get("/metrics", (_req, res) => {
  res.json(GetModelMetricsResponse.parse(getMetrics()));
});

router.get("/dashboard", (_req, res) => {
  res.json(GetDashboardSummaryResponse.parse(getDashboard()));
});

router.post("/investigator/ask", (req, res) => {
  const parsed = AskRiskInvestigatorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ask a question with the scored payment context." });
    return;
  }

  res.json(
    AskRiskInvestigatorResponse.parse(
      answerInvestigatorQuestion(parsed.data.question, parsed.data.transaction),
    ),
  );
});

export default router;