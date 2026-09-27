from fastapi import APIRouter
import json
from pathlib import Path
from app.config import settings
from app.ws import manager
import asyncio

router = APIRouter(prefix="/training", tags=["Training"])

# Load catalog on import
_catalog = []
_catalog_path = settings.DATA_DIR / "content" / "training_catalog.json"
if _catalog_path.exists():
    with open(_catalog_path, "r") as f:
        raw = json.load(f)
        # The JSON wraps modules under a "modules" key
        _catalog = raw.get("modules", raw) if isinstance(raw, dict) else raw

_queue = []

@router.get("/queue")
async def get_queue():
    return _queue

@router.get("/catalog")
async def get_catalog():
    return _catalog

@router.post("/enqueue")
async def enqueue_training(body: dict):
    item = {
        "id": f"TRN-{len(_queue)+1:03d}",
        "title": body.get("title", "Training Module"),
        "reason": body.get("reason", "Manually requested"),
        "duration_min": body.get("duration_min", 15),
        "status": "queued"
    }
    _queue.append(item)
    asyncio.create_task(manager.broadcast({"type": "training.queued", "payload": item}))
    return {"status": "queued", "item": item}

@router.post("/{task_id}/complete")
async def complete_training(task_id: str):
    for item in _queue:
        if item["id"] == task_id:
            item["status"] = "completed"
            break
    return {"status": "completed", "id": task_id}

@router.get("/slots")
async def get_slots():
    return [
        {"id": "slot-1", "date": "2025-05-02", "time": "09:00-10:00", "instructor": "Rajesh K.", "available": True},
        {"id": "slot-2", "date": "2025-05-02", "time": "14:00-15:00", "instructor": "Priya S.", "available": True},
        {"id": "slot-3", "date": "2025-05-03", "time": "09:00-10:00", "instructor": "Rajesh K.", "available": False},
    ]

@router.post("/bookings")
async def book_training(booking: dict):
    return {"status": "booked", "slot_id": booking.get("slot_id")}
