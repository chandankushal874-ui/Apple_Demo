# Development mode with hot reload.
# Terminal 1: backend
#   cd backend; .\venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
# Terminal 2: frontend (Vite dev server on 5173, proxies /api to :8000)
#   cd frontend; npm run dev
Write-Host "See comments in this file for dev instructions."
