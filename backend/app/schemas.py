from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class Alert(BaseModel):
    id: str
    rule_id: str
    severity: str
    title: str
    detail: str
    ts: str
    requires_ack: bool = False
    say: bool = False
    options: List[str] = []
    data: Dict[str, Any] = {}

class Eta(BaseModel):
    original: int
    current: int

class Task(BaseModel):
    id: str
    type: str
    site: str
    status: str
    progress: int
    eta: Eta

class TelemetryTick(BaseModel):
    machine_id: str
    operator_id: str
    engine_hours: float
    fuel_used_l: float
    fuel_level_l: float
    load_cycles: int
    idling_time_min: int
    seatbelt_status: str
    safety_alert_triggered: str
    sim_time: str
    is_simulated: bool
    tick_step: Optional[int] = None

class WeatherData(BaseModel):
    condition: str
    temp: float

class FatigueScore(BaseModel):
    score: int
    band: str
    minutes_to_high: int

class IdleCost(BaseModel):
    wasted_l: float
    wasted_cost: float
    co2_kg: float
    label: str
    live_rate_per_min: float

class StreakData(BaseModel):
    points: int
    badges: List[str]
    shift_streak: int

class Nudge(BaseModel):
    text: str

class TrainingItem(BaseModel):
    module: str
    reason: str

class Incident(BaseModel):
    id: Optional[str] = None
    type: str
    description: str

class SimState(BaseModel):
    playing: bool
    speed: float
    sim_time: str
    elapsed_s: float

class VoiceReply(BaseModel):
    text: str