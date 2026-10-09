AEGIS Scenario API — Stage 2
=============================

Files:
- scenarios.py -> copy to backend/app/api/scenarios.py
- main.py      -> replace backend/app/main.py

This exposes:
GET  /scenarios
GET  /scenarios/{scenario_id}
POST /scenarios/{scenario_id}/run

The run endpoint calls the existing scenario_engine.py and therefore uses
the same safe synthetic telemetry -> detection -> alert/incident pipeline
that was already validated from PowerShell.

Before testing:
1. Make sure PostgreSQL container is running.
2. Make sure the expanded scenario_engine.py is installed at:
   backend/simulator/scenario_engine.py
3. Start the backend:
   uvicorn app.main:app

Test:
GET http://127.0.0.1:8000/scenarios

Then:
POST http://127.0.0.1:8000/scenarios/AUTH-003/run
with JSON:
{}

Important:
Do not run the full ALL scenario suite from the frontend. Stage 2 exposes
one scenario at a time to keep the UI controlled and predictable.
