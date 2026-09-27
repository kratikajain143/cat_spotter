from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.routers import state, tasks, estimate, safety, incidents, training, voice, sim, analytics
from app.ws import manager
from app.db import db
from app.sim.clock import SimClock
from app.sim.telemetry import TelemetryReplay
from app.sim.scenario import ScenarioPlayer
import asyncio

app = FastAPI(title="CAT Spotter API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(state.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(estimate.router, prefix="/api")
app.include_router(safety.router, prefix="/api")
app.include_router(incidents.router, prefix="/api")
app.include_router(training.router, prefix="/api")
app.include_router(voice.router, prefix="/api")
app.include_router(sim.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")

clock = None
telemetry = None
scenario = None

@app.on_event("startup")
async def startup_event():
    await db.init_db()
    
    global clock, telemetry, scenario
    clock = SimClock()
    telemetry = TelemetryReplay(clock)
    
    def on_telemetry(msg_type, payload):
        import asyncio
        asyncio.create_task(manager.broadcast({"type": msg_type, "payload": payload}))
        
    telemetry.register_callback(on_telemetry)
    
    scenario = ScenarioPlayer(clock)
    
    import json
    from app.config import settings
    schedule_path = settings.DATA_DIR / "content" / "schedule_seed.json"
    task_list = []
    if schedule_path.exists():
        with open(schedule_path, "r") as f:
            data = json.load(f)
            task_list = data.get("tasks", [])
            for i, t in enumerate(task_list):
                t['status'] = 'active' if i == 0 else 'queued'
                t['progress'] = 35 if i == 0 else 0
                t['eta'] = {"original": 60, "current": 52}
    
    # Realistic initial state — no zeros anywhere
    manager.state = {
        "sim": {"playing": False, "speed": 1.0, "sim_time": "2025-05-01T09:15:00Z", "elapsed_s": 75.0, "window_index": 0},
        "tasks": task_list,
        "telemetry": {
            "machine_id": "EXC-320F-001",
            "operator_id": "OP-22",
            "engine_hours": 1247.5,
            "fuel_used_l": 3.8,
            "fuel_level_l": 24.2,
            "load_cycles": 11,
            "idling_time_min": 18,
            "seatbelt_status": "Fastened",
            "safety_alert_triggered": "No",
            "sim_time": "2025-05-01T09:15:00Z",
            "is_simulated": False,
            "fuel_per_cycle": 0.35
        },
        "fatigue": {
            "score": 15,
            "band": "Fresh",
            "minutes_to_high": 240,
            "hours_since_break": 1.2
        },
        "idleCost": {
            "wasted_l": 0.9,
            "wasted_cost": 82.80,
            "co2_kg": 2.41,
            "rate_per_min": 4.60,
            "is_idling": False
        },
        "streak": {
            "safe_hours": 6,
            "safe_shifts": 3,
            "points": 145,
            "badges": []
        },
        "weather": {
            "condition": "Sunny",
            "temperature_c": 30,
            "humidity_pct": 45,
            "wind_speed_kmh": 10,
            "forecast": []
        },
        "eta": {
            "task_id": "D-01",
            "predicted_min": 52.0,
            "low_min": 48.0,
            "high_min": 58.0,
            "range_low": 48.0,
            "range_high": 58.0,
            "confidence": 0.87,
            "baseline_min": 60.0,
            "drivers": [
                {"label": "Weather", "name": "Weather", "value": "Sunny", "impact": "+0", "delta_min": 0},
                {"label": "Operator Skill", "name": "Skill", "value": "Intermediate", "impact": "+3 min", "delta_min": 3},
                {"label": "Machine Age", "name": "Machine", "value": "3 yrs", "impact": "+2 min", "delta_min": 2}
            ]
        }
    }
    
    # Wire up scenario
    scenario.manager = manager
    scenario.tasks_state = task_list

@app.on_event("shutdown")
async def shutdown_event():
    if telemetry: telemetry.stop()
    if scenario: scenario.stop()

@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
