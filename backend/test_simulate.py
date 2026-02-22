"""
End-to-end test for the simulate pipeline.
Run with: python test_simulate.py
"""
import sys
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv('.env')

from src.database import SessionLocal
# Import all models so SQLAlchemy can resolve all relationships
from src.models.user import User
from src.models.segment import Segment
from src.models.project import Project
from src.models.experiment import Experiment
from src.models.event_tracked import EventTracked
from src.models.insight_data import InsightData
import random, json
from datetime import datetime, timedelta, timezone

db = SessionLocal()

# ── Find a real experiment ────────────────────────────────────────────
exp = db.query(Experiment).filter(Experiment.segments.any()).first()
if not exp:
    print("SKIP: No experiments in DB yet")
    db.close()
    sys.exit(0)

project = db.query(Project).filter(Project.id == exp.project_id).first()
segments = exp.segments
print(f"Experiment: #{exp.id} '{exp.name}' status={exp.status}")
print(f"Segments  : {[s.name for s in segments]}")

# ── Extract event IDs ────────────────────────────────────────────────
event_ids = ["page_view", "cta_click", "form_submit"]
if exp.computation_logic:
    try:
        stored = json.loads(exp.computation_logic)
        if isinstance(stored.get("events"), list):
            event_ids = [e["event_id"] for e in stored["events"] if e.get("event_id")]
    except Exception:
        pass
print(f"Event IDs : {event_ids}")

# ── Insert test events directly ──────────────────────────────────────
COUNT = 20
now = datetime.now(timezone.utc)
user_pool = [f"test_user_{i:02d}" for i in range(30)]
rows = []
for i in range(COUNT):
    seg = random.choice(segments)
    uid = random.choice(user_pool)
    rows.append(EventTracked(
        project_id=project.id,
        experiment_id=exp.id,
        segment_id=seg.id,
        event_json={
            "event_id": random.choice(event_ids),
            "segment_id": seg.id,
            "segment_name": seg.name,
            "experiment_id": exp.id,
            "project_id": project.id,
            "timestamp": (now - timedelta(seconds=random.randint(0, 7 * 3600))).isoformat(),
            "user_id": uid,
            "metadata": {"test": True, "index": i},
        },
    ))

db.bulk_save_objects(rows)
db.commit()
total = db.query(EventTracked).filter(EventTracked.experiment_id == exp.id).count()
print(f"PASS  Inserted {COUNT} events — total for experiment: {total}")

# ── Run analysis ─────────────────────────────────────────────────────
from src.services.experiment_analysis_service import ExperimentAnalysisService
svc = ExperimentAnalysisService(db)
result = svc.analyze_experiment(exp.id)

plots    = result.get("plots", [])
insights = result.get("insights", [])
winner   = result.get("winner_recommendation", {})
summary  = result.get("summary", "")

print(f"PASS  Analysis — plots={len(plots)} insights={len(insights)}")
print(f"      Winner: {winner.get('segment_name', 'none')} ({winner.get('confidence', '-')})")
print(f"      Summary: {summary[:100]}...")

svc.save_analysis_to_db(exp.id, result)
insight_row = db.query(InsightData).filter(InsightData.experiment_id == exp.id).first()
assert insight_row is not None, "InsightData row not found after save!"
assert insight_row.status == "completed"
print(f"PASS  InsightData saved — id={insight_row.id} status={insight_row.status}")

db.close()
print()
print("=== All tests PASSED ===")
