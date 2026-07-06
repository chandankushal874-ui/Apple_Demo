# Apple Demo Store (Ollabear widget test harness)

A fake Apple product storefront built ONLY for testing the Ollabear chat widget.
Not affiliated with Apple Inc. All product data is fictional/demo data.

## Stack
- Backend: FastAPI (Python) + SQLAlchemy + SQLite (local `apple_store.db`)
- Frontend: React + Vite
- Widget: Ollabear (`https://app.ollabear.com/widget.js`) embedded in `frontend/index.html`

## Features
- Store listings for iPhone, iPad and Mac with original prices
- Add to Cart / bag drawer + checkout (creates orders in SQLite)
- Analytics dashboard: items sold, items shipped, revenue, units by category
- Deals & Contracts: pipeline deals + signed contracts, plus sign a new contract
- Ollabear widget loaded on every page

## Setup

### 1. Backend
```
cd backend
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
```
The database is auto-created and seeded on first run.

### 2. Frontend
```
cd frontend
npm install
npm run build
```

### 3. Run (production mode)
From the project root:
```
.\run.ps1
```
Then open:
- App:  http://127.0.0.1:8000/demo/
- API docs: http://127.0.0.1:8000/docs

### Dev mode (hot reload)
```
# Terminal 1
cd backend; .\venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
# Terminal 2
cd frontend; npm run dev
```
Open http://localhost:5173/demo/ (Vite proxies /api to the backend).

## Ollabear widget
Configured in `frontend/index.html`:
```html
<script
  src="https://app.ollabear.com/widget.js"
  data-api-key="qk_ddkMz2rt_YOUR_FULL_KEY"
  defer
></script>
```
Replace `data-api-key` with your full Ollabear API key, then rebuild the frontend
(`npm run build`) so the change is served at /demo.

## API endpoints
- `GET  /api/products`               list products (optional `?category=iPhone|iPad|Mac`)
- `GET  /api/products/{id}`          single product
- `POST /api/checkout`               body: `{ "items": [{ "product_id": 1, "quantity": 2 }] }`
- `POST /api/orders/{id}/ship`       mark an order shipped
- `GET  /api/analytics`              aggregate sales / shipping / contract stats
- `GET  /api/contracts`              list deals & contracts
- `POST /api/contracts`              body: `{ "company": "...", "value": 100000, "status": "signed" }`
