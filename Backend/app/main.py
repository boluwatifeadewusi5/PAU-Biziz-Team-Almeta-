import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import init_db, query
from .seed import seed
from .routes import auth, public, engagement, owner, media

@asynccontextmanager
async def lifespan(app):
    init_db()
    if os.getenv("SEED_DEMO", "false").lower() == "true":
        seed()
    yield

app = FastAPI(title="PAU biziz", version="0.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware,
    allow_origins=[x.strip() for x in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",") if x.strip()],
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "x-client-id"])
media.MEDIA_DIR.mkdir(parents=True, exist_ok=True)
for module in (auth, public, engagement, owner, media):
    app.include_router(module.router, tags=[module.__name__.rsplit(".", 1)[-1]])
app.mount('/media', StaticFiles(directory=media.MEDIA_DIR, check_dir=False), name='media')

@app.get("/health", tags=["system"])
def health():
    query("SELECT 1")
    return {"status": "ok"}
