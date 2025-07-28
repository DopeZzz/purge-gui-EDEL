# rr_api/main.py
import logging
import uvicorn
from fastapi import FastAPI
from .routes import router
from fastapi.middleware.cors import CORSMiddleware
from .config import SHARED

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
app.include_router(router)

if not SHARED:
    logging.warning("API_WEB_SECRET not set; HMAC-protected endpoints will fail")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://notepadhelper.space"],          # o ["*"] mientras pruebas
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
