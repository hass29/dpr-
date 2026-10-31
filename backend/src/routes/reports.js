import express from "express";
import Report from "../models/Report.js";

const router = express.Router();

const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
const numberOrZero = (value) => {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n < 0) throw new Error("Values must be non-negative numbers.");
  return Math.floor(n);
};

router.get("/dates", async (_req, res, next) => {
  try {
    const dates = await Report.find({}, { date: 1, _id: 0 }).sort({ date: -1 }).lean();
    res.json(dates.map(x => x.date));
  } catch (err) { next(err); }
});

router.get("/:date", async (req, res, next) => {
  try {
    if (!validDate(req.params.date)) return res.status(400).json({ message: "Use date format YYYY-MM-DD." });
    const report = await Report.findOne({ date: req.params.date }).lean();
    res.json(report || { date: req.params.date, rows: [] });
  } catch (err) { next(err); }
});

router.get("/", async (_req, res, next) => {
  try {
    const reports = await Report.find({}).sort({ date: -1 }).lean();
    res.json(reports);
  } catch (err) { next(err); }
});

router.post("/:date/transactions", async (req, res, next) => {
  try {
    const { date } = req.params;
    if (!validDate(date)) return res.status(400).json({ message: "Use date format YYYY-MM-DD." });
    const { product } = req.body || {};
    if (!product || typeof product !== "string") return res.status(400).json({ message: "A product is required." });

    const incoming = {
      opening: numberOrZero(req.body.opening),
      production: numberOrZero(req.body.production),
      return: numberOrZero(req.body.return),
      dispatch: numberOrZero(req.body.dispatch)
    };

    let report = await Report.findOne({ date });
    if (!report) report = new Report({ date, rows: [] });
    let row = report.rows.find(r => r.product === product);
    if (row) {
      // Keep the existing opening unless the user enters a positive replacement.
      if (incoming.opening > 0) row.opening = incoming.opening;
      row.production += incoming.production;
      row.return += incoming.return;
      row.dispatch += incoming.dispatch;
    } else {
      report.rows.push({ product, ...incoming });
    }
    await report.save();
    res.status(200).json(report);
  } catch (err) {
    if (err.message?.includes("non-negative")) return res.status(400).json({ message: err.message });
    next(err);
  }
});

router.delete("/:date", async (req, res, next) => {
  try {
    if (!validDate(req.params.date)) return res.status(400).json({ message: "Use date format YYYY-MM-DD." });
    await Report.deleteOne({ date: req.params.date });
    res.json({ message: `Report ${req.params.date} deleted.` });
  } catch (err) { next(err); }
});

export default router;
