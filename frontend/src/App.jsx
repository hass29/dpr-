import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Download, FileDown, Plus, RotateCcw, RefreshCw, Trash2 } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { PRODUCTS, CATEGORIES, getCategory } from "./products";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const localToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};
const emptyRow = product => ({ product, opening: 0, production: 0, return: 0, dispatch: 0 });
const fmt = n => Number(n || 0).toLocaleString();

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || `Request failed (${response.status})`);
  return payload;
}

function normalizeRows(report) {
  const byProduct = new Map((report?.rows || []).map(row => [row.product, row]));
  return PRODUCTS.map(product => ({ ...emptyRow(product), ...(byProduct.get(product) || {}) }));
}

function calculate(row) {
  return Number(row.opening || 0) + Number(row.production || 0) - Number(row.return || 0) - Number(row.dispatch || 0);
}

function App() {
  const [date, setDate] = useState(localToday);
  const [rows, setRows] = useState(() => PRODUCTS.map(emptyRow));
  const [savedDates, setSavedDates] = useState([]);
  const [form, setForm] = useState({ product: PRODUCTS[0], opening: "0", production: "0", return: "0", dispatch: "0" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadDate = useCallback(async (selectedDate) => {
    if (!selectedDate) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const report = await api(`/reports/${selectedDate}`);
      setRows(normalizeRows(report));
      setDate(selectedDate);
      const dates = await api("/reports/dates");
      setSavedDates(dates);
    } catch (err) {
      setError(`${err.message}. Check that the backend and MongoDB are running.`);
      setRows(PRODUCTS.map(emptyRow));
    } finally { setBusy(false); }
  }, []);

  useEffect(() => {
    // Always start on today's local date. Historical reports remain available via the calendar.
    loadDate(localToday());
  }, [loadDate]);

  const grouped = useMemo(() => {
    const groups = CATEGORIES.map(category => ({
      category,
      rows: rows.filter(row => getCategory(row.product) === category)
    })).filter(group => group.rows.length);
    const known = new Set(groups.flatMap(group => group.rows.map(row => row.product)));
    const other = rows.filter(row => !known.has(row.product));
    if (other.length) groups.push({ category: "OTHER", rows: other });
    return groups;
  }, [rows]);

  const totals = useMemo(() => rows.reduce((acc, row) => {
    acc.opening += Number(row.opening || 0);
    acc.production += Number(row.production || 0);
    acc.return += Number(row.return || 0);
    acc.dispatch += Number(row.dispatch || 0);
    acc.closing += calculate(row);
    return acc;
  }, { opening: 0, production: 0, return: 0, dispatch: 0, closing: 0 }), [rows]);

  function updateForm(key, value) { setForm(current => ({ ...current, [key]: value })); }

  async function addTransaction(event) {
    event.preventDefault();
    setError(""); setNotice("");
    const numeric = ["opening", "production", "return", "dispatch"];
    for (const key of numeric) {
      if (form[key] === "" || !Number.isFinite(Number(form[key])) || Number(form[key]) < 0) {
        setError(`${key[0].toUpperCase() + key.slice(1)} must be zero or a positive number.`);
        return;
      }
    }
    setBusy(true);
    try {
      await api(`/reports/${date}/transactions`, {
        method: "POST",
        body: JSON.stringify({
          product: form.product,
          opening: Number(form.opening),
          production: Number(form.production),
          return: Number(form.return),
          dispatch: Number(form.dispatch)
        })
      });
      await loadDate(date);
      setForm(current => ({ ...current, opening: "0", production: "0", return: "0", dispatch: "0" }));
      setNotice("Transaction saved successfully.");
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function resetDate() {
    if (!window.confirm(`Delete the entire report for ${date}? This cannot be undone.`)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await api(`/reports/${date}`, { method: "DELETE" });
      await loadDate(date);
      setNotice(`Report for ${date} was cleared.`);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  function pdfHeader(doc, reportDate, all = false) {
    doc.setFontSize(17);
    doc.setTextColor(31, 58, 104);
    doc.text("Daily Production Report (DPR)", 14, 16);
    doc.setFontSize(10);
    doc.setTextColor(70, 85, 105);
    doc.text(all ? "All saved report dates" : `Report date: ${reportDate}`, 14, 23);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 29);
  }

  function tableBodyForReport(reportRows) {
    const data = normalizeRows({ rows: reportRows });
    const body = [];
    CATEGORIES.forEach(category => {
      const categoryRows = data.filter(row => getCategory(row.product) === category);
      if (!categoryRows.length) return;
      body.push([{ content: category, colSpan: 8, styles: { fillColor: [230, 237, 248], textColor: [16, 36, 63], fontStyle: "bold" } }]);
      let subtotal = { opening: 0, production: 0, return: 0, dispatch: 0, closing: 0 };
      categoryRows.forEach(row => {
        const closing = calculate(row);
        subtotal.opening += Number(row.opening || 0);
        subtotal.production += Number(row.production || 0);
        subtotal.return += Number(row.return || 0);
        subtotal.dispatch += Number(row.dispatch || 0);
        subtotal.closing += closing;
        body.push([row.product, fmt(row.opening), fmt(row.production), fmt(row.return), fmt(row.dispatch), fmt(closing), fmt(row.production), fmt(row.dispatch)]);
      });
      body.push([
        `${category} Total`, fmt(subtotal.opening), fmt(subtotal.production), fmt(subtotal.return),
        fmt(subtotal.dispatch), fmt(subtotal.closing), fmt(subtotal.production), fmt(subtotal.dispatch)
      ]);
    });
    const total = data.reduce((acc, row) => {
      acc.opening += Number(row.opening || 0); acc.production += Number(row.production || 0);
      acc.return += Number(row.return || 0); acc.dispatch += Number(row.dispatch || 0); acc.closing += calculate(row);
      return acc;
    }, { opening: 0, production: 0, return: 0, dispatch: 0, closing: 0 });
    body.push(["GRAND TOTAL", fmt(total.opening), fmt(total.production), fmt(total.return), fmt(total.dispatch), fmt(total.closing), fmt(total.production), fmt(total.dispatch)]);
    return body;
  }

  function addPdfTable(doc, reportRows, startY) {
    autoTable(doc, {
      startY,
      head: [["Product / Category", "Opening", "Production", "Return", "Dispatch", "Closing", "Total Production", "Total Dispatch"]],
      body: tableBodyForReport(reportRows),
      theme: "grid",
      styles: { fontSize: 6.5, cellPadding: 2, overflow: "linebreak" },
      headStyles: { fillColor: [31, 58, 104], textColor: 255, fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 64 } },
      margin: { left: 8, right: 8, bottom: 12 },
      didParseCell(data) {
        if (data.row.raw?.[0]?.content?.includes?.("Total") || data.row.raw?.[0] === "GRAND TOTAL") {
          data.cell.styles.fontStyle = "bold";
        }
      }
    });
  }

  async function downloadCurrentPdf() {
    setError(""); setNotice("");
    try {
      const report = await api(`/reports/${date}`);
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      pdfHeader(doc, date);
      addPdfTable(doc, report.rows || [], 35);
      doc.save(`DPR-${date}.pdf`);
      setNotice(`PDF downloaded for ${date}.`);
    } catch (err) { setError(err.message); }
  }

  async function downloadAllPdfs() {
    setError(""); setNotice("");
    try {
      const reports = await api("/reports");
      if (!reports.length) { setError("There are no saved reports to export yet."); return; }
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      reports.sort((a, b) => a.date.localeCompare(b.date)).forEach((report, index) => {
        if (index) doc.addPage();
        pdfHeader(doc, report.date);
        addPdfTable(doc, report.rows || [], 35);
      });
      doc.save("DPR-All-Saved-Dates.pdf");
      setNotice(`PDF downloaded with ${reports.length} saved report date(s).`);
    } catch (err) { setError(err.message); }
  }

  return <main className="app-shell">
    <header className="top-bar">
      <div className="brand">
        <div className="brand-icon">DPR</div>
        <div><h1>Daily Production Report</h1><p>Production, stock and dispatch overview</p></div>
      </div>
      <div className="date-actions">
        <label className="date-picker"><CalendarDays size={18} /><span>Report date</span>
          <input type="date" value={date} onChange={e => loadDate(e.target.value)} />
        </label>
        <button className="btn" onClick={() => loadDate(date)} disabled={busy}><RefreshCw size={16}/> Load date</button>
      </div>
    </header>

    <section className="toolbar">
      <form className="transaction-form" onSubmit={addTransaction}>
        <div className="form-heading"><div><h2>Add transaction</h2><p>Movements will be saved to MongoDB for {date}.</p></div><span className="date-pill">{date}</span></div>
        <div className="form-grid">
          <label className="field product-field"><span>Product</span><select value={form.product} onChange={e => updateForm("product", e.target.value)}>{PRODUCTS.map(p => <option key={p}>{p}</option>)}</select></label>
          {["opening", "production", "return", "dispatch"].map(key => <label className="field" key={key}><span>{key}</span><input type="number" min="0" step="1" value={form[key]} onChange={e => updateForm(key, e.target.value)} /></label>)}
          <div className="form-buttons"><button className="btn btn-primary" type="submit" disabled={busy}><Plus size={17}/> Add transaction</button><button className="btn btn-danger" type="button" onClick={resetDate} disabled={busy}><Trash2 size={16}/> Reset date</button></div>
        </div>
      </form>
    </section>

    <div className="report-actions">
      <div><h2>Stock report</h2><p>{savedDates.length} saved report date(s) · Current view: <strong>{date}</strong></p></div>
      <div className="action-group">
        <button className="btn btn-pdf" onClick={downloadCurrentPdf}><FileDown size={17}/> Download this date PDF</button>
        <button className="btn btn-primary" onClick={downloadAllPdfs}><Download size={17}/> Download all dates PDF</button>
      </div>
    </div>

    {error && <div className="message error" role="alert">{error}</div>}
    {notice && <div className="message success" role="status">{notice}</div>}

    <section className="summary-grid">
      {[["Opening stock", totals.opening], ["Production", totals.production], ["Returns", totals.return], ["Dispatch", totals.dispatch], ["Closing stock", totals.closing]].map(([label, value]) =>
        <div className="summary-card" key={label}><span>{label}</span><strong>{fmt(value)}</strong></div>)}
    </section>

    <section className="table-card">
      <div className="table-scroll">
        <table>
          <thead><tr><th>Product / Category</th><th>Opening</th><th>Production</th><th>Return</th><th>Dispatch</th><th>Closing</th><th>Total Production</th><th>Total Dispatch</th></tr></thead>
          <tbody>
            {grouped.map(group => {
              const sub = group.rows.reduce((acc, row) => {
                acc.opening += Number(row.opening || 0); acc.production += Number(row.production || 0);
                acc.return += Number(row.return || 0); acc.dispatch += Number(row.dispatch || 0); acc.closing += calculate(row); return acc;
              }, { opening: 0, production: 0, return: 0, dispatch: 0, closing: 0 });
              return <React.Fragment key={group.category}>
                <tr className="category-row"><td colSpan="8">{group.category}</td></tr>
                {group.rows.map(row => <tr key={row.product}>
                  <td className="product-name">{row.product}</td><td>{fmt(row.opening)}</td><td>{fmt(row.production)}</td><td>{fmt(row.return)}</td><td>{fmt(row.dispatch)}</td><td>{fmt(calculate(row))}</td><td>{fmt(row.production)}</td><td>{fmt(row.dispatch)}</td>
                </tr>)}
                <tr className="total-row"><td>{group.category} Total</td><td>{fmt(sub.opening)}</td><td>{fmt(sub.production)}</td><td>{fmt(sub.return)}</td><td>{fmt(sub.dispatch)}</td><td>{fmt(sub.closing)}</td><td>{fmt(sub.production)}</td><td>{fmt(sub.dispatch)}</td></tr>
              </React.Fragment>;
            })}
            <tr className="grand-total-row"><td>GRAND TOTAL</td><td>{fmt(totals.opening)}</td><td>{fmt(totals.production)}</td><td>{fmt(totals.return)}</td><td>{fmt(totals.dispatch)}</td><td>{fmt(totals.closing)}</td><td>{fmt(totals.production)}</td><td>{fmt(totals.dispatch)}</td></tr>
          </tbody>
        </table>
      </div>
      <footer className="table-footer"><span><RotateCcw size={14}/> Closing = Opening + Production − Return − Dispatch</span><span>{busy ? "Loading…" : "Data stored in MongoDB"}</span></footer>
    </section>
    <footer className="page-footer">DPR · Daily Production Report <span>Historical dates can be opened using the date picker.</span></footer>
  </main>;
}

export default App;
