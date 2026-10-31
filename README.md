# DPR — Daily Production Report (MERN)

A React + Express + MongoDB version of your existing Daily Production Report. The original product list and September 8, 2026 opening-stock snapshot were carried over from the supplied HTML code.

## Features

- React dashboard with the DPR product categories and stock table.
- Express REST API and MongoDB persistence.
- Opens on **today's local date** each time the frontend is opened or refreshed.
- Date picker to open historical reports.
- Add/update product movements for a selected date.
- Download the selected day's PDF.
- Download all saved report dates into one PDF, with a separate page per date.
- Reset a selected date's report after confirmation.

## Requirements

- Node.js 18 or newer
- MongoDB Community Server locally, or a MongoDB Atlas connection string

## Setup on Windows / VS Code

### 1. Configure the backend

Open a terminal in this project folder:

```powershell
cd backend
Copy-Item .env.example .env
```

Open `backend/.env` and set `MONGODB_URI`.

For local MongoDB, use:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/dpr_daily_report
PORT=4000
CLIENT_URL=http://localhost:5173
```

If you use MongoDB Atlas, replace the URI with your Atlas connection string. Keep credentials private and do not commit `.env`.

### 2. Install dependencies

Open the terminal in the project root:

```powershell
npm install
npm install --prefix backend
npm install --prefix frontend
```

### 3. Start both applications

From the project root:

```powershell
npm run dev
```

The frontend runs at http://localhost:5173 and the API runs at http://localhost:4000.

If `npm run dev` reports that `concurrently` is missing, run `npm install` in the project root and try again.

## Initial report data

When the backend first connects to a fresh database, it inserts the supplied snapshot dated `2026-09-08`. It does not overwrite a report that already exists for that date. Other dates start empty and are saved when transactions are added.

## API endpoints

- `GET /api/health`
- `GET /api/reports` — all saved reports
- `GET /api/reports/dates` — dates that have saved reports
- `GET /api/reports/:date` — one date, format `YYYY-MM-DD`
- `POST /api/reports/:date/transactions` — add movements
- `DELETE /api/reports/:date` — delete the selected date's report

## Notes

- PDF creation happens in the browser through jsPDF; no external PDF service is needed.
- The PDF export uses the currently saved database data, not unsaved form input.
- Keep backups of your MongoDB database. Browser storage is not used for report records.
- The original HTML's daily stock calculation is preserved: `Closing = Opening + Production - Return - Dispatch`.
- When the same product/date is entered more than once, movements are accumulated. A positive opening value replaces the existing opening value.
