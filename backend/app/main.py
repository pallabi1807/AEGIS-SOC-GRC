from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import engine

from app.api.alerts import router as alerts_router
from app.api.assets import router as assets_router
from app.api.events import router as events_router
from app.api.detection import router as detection_router
from app.api.incidents import router as incidents_router
from app.api.risks import router as risks_router
from app.api.controls import router as controls_router
from app.api.risk_controls import router as risk_controls_router
from app.api.evidence import router as evidence_router
from app.api.control_tests import router as control_tests_router
from app.api.remediations import router as remediations_router
from app.api.verifications import router as verifications_router
from app.api.compliance import router as compliance_router
from app.api.scenarios import router as scenarios_router
from app.api.auth import router as auth_router
from app.api.audit import router as audit_router


app = FastAPI(
    title="AEGIS SOC-GRC",
    description=(
        "Security Operations and Governance, "
        "Risk & Compliance Platform"
    ),
    version="0.1.0",
)


# =========================================================
# CORS CONFIGURATION
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# API ROUTERS
# =========================================================

app.include_router(alerts_router)
app.include_router(assets_router)
app.include_router(events_router)
app.include_router(detection_router)
app.include_router(incidents_router)
app.include_router(risks_router)
app.include_router(controls_router)
app.include_router(risk_controls_router)
app.include_router(evidence_router)
app.include_router(control_tests_router)
app.include_router(remediations_router)
app.include_router(verifications_router)
app.include_router(compliance_router)
app.include_router(scenarios_router)
app.include_router(auth_router)
app.include_router(audit_router)


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "application": "AEGIS SOC-GRC",
        "status": "online",
        "version": "0.1.0",
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AEGIS API",
    }


# =========================================================
# DATABASE HEALTH CHECK
# =========================================================

@app.get("/health/database")
def database_health():
    try:
        with Session(engine) as session:
            session.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected",
        }

    except Exception as error:
        return {
            "status": "error",
            "database": "disconnected",
            "detail": str(error),
        }
