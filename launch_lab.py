"""Serve the production React build and Python API on one local origin."""
from pathlib import Path
from fastapi.staticfiles import StaticFiles
import uvicorn
from backend.api import app

if __name__ == '__main__':
    build = Path(__file__).parent / 'frontend' / 'dist'
    if not build.exists():
        raise SystemExit('Build frontend first: cd frontend && npm run build')
    app.mount('/', StaticFiles(directory=build, html=True), name='frontend')
    uvicorn.run(app, host='127.0.0.1', port=8000)
