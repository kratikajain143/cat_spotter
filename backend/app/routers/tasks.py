from fastapi import APIRouter
from app.ws import manager
from app.engines.sequencing import optimize_sequence
import asyncio
import json
import uuid
from app.config import settings
from pydantic import BaseModel
from typing import Optional

router = APIRouter(tags=["Tasks"])

class TaskCreate(BaseModel):
    task_type: str
    site: str = "A"
    planned_start: str = ""
    pinned: bool = False
    notes: str = ""

# Load from schedule_seed
_tasks = []
_schedule_path = settings.DATA_DIR / "content" / "schedule_seed.json"
if _schedule_path.exists():
    with open(_schedule_path, "r") as f:
        data = json.load(f)
        for t in data.get("tasks", []):
            _tasks.append({
                "id": t["id"],
                "task_type": t["task_type"],
                "site": t["site"],
                "planned_start": t.get("planned_start", ""),
                "pinned": t.get("pinned", False),
                "status": "queued",
                "progress": 0,
                "eta": {"original": 60, "current": 60}
            })

@router.get("/tasks/today")
async def get_tasks():
    return _tasks

@router.post("/tasks/{task_id}/start")
async def start_task(task_id: str):
    for t in _tasks:
        if t["id"] == task_id:
            t["status"] = "active"
            t["progress"] = 0
            asyncio.create_task(manager.broadcast({"type": "task.updated", "payload": t}))
            return {"status": "started", "task": t}
    return {"status": "not_found"}

@router.post("/tasks/{task_id}/complete")
async def complete_task(task_id: str):
    for t in _tasks:
        if t["id"] == task_id:
            t["status"] = "completed"
            t["progress"] = 100
            asyncio.create_task(manager.broadcast({"type": "task.updated", "payload": t}))
            return {"status": "completed", "task": t}
    return {"status": "not_found"}

@router.post("/schedule/optimize")
async def optimize_schedule():
    result = optimize_sequence(_tasks, [{"condition": "Sunny"}])
    asyncio.create_task(manager.broadcast({"type": "schedule.reordered", "payload": _tasks}))
    return result

@router.post("/tasks/schedule")
async def schedule_task(task: TaskCreate):
    new_task = {
        "id": f"D-{len(_tasks)+1:02d}",
        "task_type": task.task_type,
        "site": task.site,
        "planned_start": task.planned_start,
        "pinned": task.pinned,
        "notes": task.notes,
        "status": "pending",
        "progress": 0,
        "eta": {"original": 60, "current": 60}
    }
    _tasks.append(new_task)
    asyncio.create_task(manager.broadcast({"type": "task.updated", "payload": new_task}))
    asyncio.create_task(manager.broadcast({"type": "schedule.reordered", "payload": _tasks}))
    return {"status": "scheduled", "task": new_task}

@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    global _tasks
    _tasks = [t for t in _tasks if t["id"] != task_id]
    asyncio.create_task(manager.broadcast({"type": "schedule.reordered", "payload": _tasks}))
    return {"status": "removed", "id": task_id}

