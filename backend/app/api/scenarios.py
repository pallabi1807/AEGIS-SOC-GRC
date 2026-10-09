from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from simulator.scenario_engine import SCENARIOS, run_scenario


router = APIRouter(prefix="/scenarios", tags=["Scenarios"])


class ScenarioRunRequest(BaseModel):
    asset_id: str | None = None


def _scenario_metadata(scenario) -> dict[str, Any]:
    return {
        "scenario_id": scenario.scenario_id,
        "category": scenario.category,
        "name": scenario.name,
        "description": scenario.description,
        "severity": scenario.severity,
        "mitre_technique": scenario.mitre_technique,
        "detection_rules": list(scenario.detection_rules),
        "expected_outcome": scenario.expected_outcome,
        "steps": list(scenario.steps),
        "scenario_type": scenario.scenario_type,
    }


@router.get("")
def list_scenarios() -> dict[str, Any]:
    """Return the authoritative AEGIS scenario catalog."""
    scenarios = [_scenario_metadata(s) for s in SCENARIOS.values()]

    return {
        "count": len(scenarios),
        "scenarios": scenarios,
    }


@router.get("/{scenario_id}")
def get_scenario(scenario_id: str) -> dict[str, Any]:
    scenario = SCENARIOS.get(scenario_id.upper())

    if scenario is None:
        raise HTTPException(
            status_code=404,
            detail=f"Scenario '{scenario_id}' was not found.",
        )

    return _scenario_metadata(scenario)


@router.post("/{scenario_id}/run")
def execute_scenario(
    scenario_id: str,
    request: ScenarioRunRequest | None = None,
) -> dict[str, Any]:
    """Execute one safe synthetic AEGIS scenario through the real pipeline."""
    scenario_key = scenario_id.upper()

    if scenario_key not in SCENARIOS:
        raise HTTPException(
            status_code=404,
            detail=f"Scenario '{scenario_id}' was not found.",
        )

    try:
        result = run_scenario(
            scenario_key,
            asset_id=request.asset_id if request else None,
        )

        return {
            "status": "completed",
            "simulation": True,
            "message": "Synthetic scenario completed successfully.",
            "result": result,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Scenario execution failed: {error}",
        ) from error
