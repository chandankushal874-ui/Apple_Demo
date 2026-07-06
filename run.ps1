# Start the full app (production mode): FastAPI serves API + built React at /demo
Set-Location $PSScriptRoot\backend
.\venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
