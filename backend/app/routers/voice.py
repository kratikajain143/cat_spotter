from fastapi import APIRouter
from app.voice.intents import parser
from app.ws import manager
from pydantic import BaseModel
from typing import Dict, Any
import asyncio

router = APIRouter(prefix="/voice", tags=["Voice"])

class VoiceReq(BaseModel):
    text: str
    context: Dict[str, Any] = {}

def _get_live_values():
    """Pull latest values from manager state for voice responses."""
    s = getattr(manager, 'state', {})
    telem = s.get('telemetry', {})
    eta_data = s.get('eta', {})
    weather = s.get('weather', {})
    fatigue = s.get('fatigue', {})
    return {
        'fuel': telem.get('fuel_level_l', 24.2),
        'idle': telem.get('idling_time_min', 18),
        'cycles': telem.get('load_cycles', 11),
        'engine_hrs': telem.get('engine_hours', 1247.5),
        'eta': eta_data.get('predicted_min', 52),
        'weather': weather.get('condition', 'Sunny'),
        'temp': weather.get('temperature_c', 30),
        'wind': weather.get('wind_speed_kmh', 10),
        'fatigue_score': fatigue.get('score', 15),
        'fatigue_band': fatigue.get('band', 'Fresh'),
    }

INTENT_TEMPLATES = {
    'status': {'reply': 'Current task is on track. Fuel at {fuel}L, {idle} min idle time, {cycles} cycles completed. Engine hours: {engine_hrs}.', 'ui_actions': []},
    'eta': {'reply': 'Estimated completion in about {eta} minutes based on current conditions ({weather}, {temp}°C).', 'ui_actions': []},
    'log_incident': {'reply': 'Opening incident form for you.', 'ui_actions': [{'type': 'open_incidents', 'payload': {}}]},
    'report_hazard': {'reply': 'Opening incident form to log the hazard.', 'ui_actions': [{'type': 'open_incidents', 'payload': {}}]},
    'training': {'reply': 'Opening your training queue.', 'ui_actions': [{'type': 'open_training', 'payload': {}}]},
    'break': {'reply': 'Noted. Logging a break. Your fatigue score is {fatigue_score} ({fatigue_band}). Remember to stretch and hydrate!', 'ui_actions': []},
    'refuel': {'reply': 'Fuel level is {fuel}L. Alerting site manager for refuel at next break.', 'ui_actions': []},
    'weather': {'reply': 'Current conditions: {weather}, {temp}°C, wind at {wind} km/h.', 'ui_actions': []},
    'schedule': {'reply': 'Here\'s your task schedule for today.', 'ui_actions': [{'type': 'open_insights', 'payload': {}}]},
    'help': {'reply': 'You can say: status, ETA, log incident, request training, take break, check weather, or show schedule.', 'ui_actions': []},
    'acknowledge': {'reply': 'Alert acknowledged. Stay safe.', 'ui_actions': []},
    'start_task': {'reply': 'Starting the task now.', 'ui_actions': []},
    'complete_task': {'reply': 'Task marked as complete. Good work!', 'ui_actions': []},
}

@router.post("/command")
async def voice_command(req: VoiceReq):
    res = parser.parse(req.text)
    intent = res['intent']
    template = INTENT_TEMPLATES.get(intent, {'reply': f'Understood: {intent}', 'ui_actions': []})
    
    # Interpolate live values into the reply template
    values = _get_live_values()
    try:
        reply_text = template['reply'].format(**values)
    except (KeyError, IndexError):
        reply_text = template['reply']
    
    # Broadcast via WS so the NudgeBubble shows it
    asyncio.create_task(manager.broadcast({"type": "nudge", "payload": {
        "say": reply_text,
        "options": []
    }}))
    
    return {
        "reply": reply_text,
        "action": intent,
        "slots": res['slots'],
        "ui_actions": template['ui_actions']
    }
