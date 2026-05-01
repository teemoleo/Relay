from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.baton_status import normalize_baton_status
from app.orm_models.baton import Baton
from app.orm_models.person import Person
from app.orm_models.project import Project
from app.pydantic_schemas.baton_schema import BatonCreate, BatonResponse, BatonUpdate

router = APIRouter()

def determine_lifecycle_stage(baton: Baton) -> str:
    has_description = bool(baton.description and baton.description.strip())
    has_successors = bool(baton.successor_ids and len(baton.successor_ids) > 0)
    has_related_systems = _has_related_systems_content(baton)

    return "baton" if has_description and has_successors and has_related_systems else "imported_ticket"


def _normalize_text(value) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, (int, float)):
        return str(value)
    return ""


def _normalize_string_list(value) -> list[str]:
    if isinstance(value, list):
        return [item.strip() for item in value if isinstance(item, str) and item.strip()]
    if isinstance(value, str):
        return [line.strip() for line in value.splitlines() if line.strip()]
    return []


def _has_related_systems_content(baton: Baton) -> bool:
    if len(_normalize_string_list(baton.related_systems)) > 0:
        return True
    resources = baton.additional_resources or []
    for resource in resources:
        if not isinstance(resource, dict):
            continue
        if _normalize_text(resource.get("type")).lower() == "related_system" and _normalize_text(resource.get("title")):
            return True
    return False


def documentation_completeness_percent(baton: Baton) -> int:
    score = 0

    description = _normalize_text(baton.description)
    if len(description) >= 80:
        score += 25
    elif len(description) > 0:
        score += min(25, round((len(description) / 80) * 25))

    context = _normalize_text(baton.detailed_context)
    if len(context) >= 60:
        score += 20
    elif len(context) > 0:
        score += min(20, round((len(context) / 60) * 20))

    if _has_related_systems_content(baton):
        score += 20

    if len(_normalize_string_list(baton.dependencies)) > 0:
        score += 12

    implementation = _normalize_text(baton.implementation_state).lower()
    if implementation and implementation != "unknown":
        score += 10

    reconstruction_text = _normalize_text(baton.reconstruction_time).lower()
    if reconstruction_text and reconstruction_text != "n/a":
        score += 8

    troubleshooting_notes = _normalize_text(baton.troubleshooting_notes)
    resources = baton.additional_resources or []
    has_runbook = any(
        isinstance(resource, dict)
        and _normalize_text(resource.get("type")).lower() in {"runbook", "guide", "architecture_diagram", "api_docs"}
        for resource in resources
    )
    if troubleshooting_notes or has_runbook:
        score += 5

    return min(100, score)


def calculate_baton_risk(baton: Baton) -> tuple[int, str]:
    status = normalize_baton_status(baton.baton_status)
    doc_pct = documentation_completeness_percent(baton)
    doc_gap_points = round((100 - doc_pct) * 0.30)
    workflow_points = (
        5
        if status in {"done", "completed", "complete"}
        else 18
        if status == "in_progress"
        else 40
        if status in {"enrich_ticket", "enrich"}
        else 78
        if status in {"awaiting_handover", "handover_pending_approval"}
        else 16
    )
    successor_count = len(baton.successor_ids or [])
    successor_points = 24 if successor_count == 0 else 10 if successor_count == 1 else 0
    reconstruction_text = _normalize_text(baton.reconstruction_time).lower()
    reconstruction_points = (
        6
        if not reconstruction_text or reconstruction_text == "n/a"
        else 0
    )
    score = min(100, doc_gap_points + workflow_points + successor_points + reconstruction_points)

    if status in {"done", "completed", "complete"}:
        return 12, "Low Risk"

    if status in {"awaiting_handover", "handover_pending_approval"}:
        score = max(score, 72)

    if status == "in_progress":
        if successor_count >= 2:
            score = min(score, 34)
        elif successor_count == 1:
            score = min(max(score, 40), 62)
        else:
            score = max(score, 66)
        if doc_pct < 60:
            score = max(score, 40)

    if status in {"enrich_ticket", "enrich"} and successor_count == 0 and doc_pct >= 75:
        score = min(max(score, 44), 64)

    if score < 35:
        return score, "Low Risk"
    if score < 65:
        return score, "Medium Risk"
    return score, "High Risk"


def build_baton_response(db: Session, baton: Baton) -> BatonResponse:
    project = db.query(Project).filter(Project.id == baton.project_id).first()
    owner = db.query(Person).filter(Person.id == baton.owner_id).first()
    risk_score, risk_label = calculate_baton_risk(baton)
    documentation_completeness = documentation_completeness_percent(baton)

    return BatonResponse(
        id=baton.id,
        created_at=baton.created_at,
        updated_at=baton.updated_at,

        team_id=project.team_id if project else None,

        project_id=baton.project_id,
        project_name=project.name if project else None,

        owner_id=baton.owner_id,
        owner_name=owner.name if owner else None,

        successor_ids=baton.successor_ids,
        title=baton.title,
        description=baton.description,
        detailed_context=baton.detailed_context,
        implementation_state=baton.implementation_state,
        repo_link=baton.repo_link,
        branch_name=baton.branch_name,
        daily_logs=baton.daily_logs,
        additional_resources=baton.additional_resources,
        baton_status=baton.baton_status,
        lifecycle_stage=baton.lifecycle_stage,
        risk_label=risk_label,
        risk_score=risk_score,
        documentation_completeness=documentation_completeness,

        dependencies=baton.dependencies,
        related_systems=baton.related_systems,
        troubleshooting_notes=baton.troubleshooting_notes,
        reconstruction_time=baton.reconstruction_time,
    )


@router.get("/batons", response_model=list[BatonResponse], tags=["Batons"])
def list_batons(
    owner_id: int | None = Query(default=None),
    project_id: int | None = Query(default=None),
    team_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Baton)

    if owner_id is not None:
        query = query.filter(Baton.owner_id == owner_id)

    if project_id is not None:
        query = query.filter(Baton.project_id == project_id)

    if team_id is not None:
        query = query.join(Project, Baton.project_id == Project.id).filter(Project.team_id == team_id)

    batons = query.all()
    dirty = False
    for baton in batons:
        normalized_status = normalize_baton_status(baton.baton_status)
        if baton.baton_status != normalized_status:
            baton.baton_status = normalized_status
            dirty = True
    if dirty:
        db.commit()
        for baton in batons:
            db.refresh(baton)

    enriched_batons = []
    for baton in batons:
        enriched_batons.append(build_baton_response(db, baton))

    return enriched_batons


@router.get("/batons/{baton_id}", response_model=BatonResponse, tags=["Batons"])
def get_baton(baton_id: int, db: Session = Depends(get_db)):
    baton = db.query(Baton).filter(Baton.id == baton_id).first()

    if not baton:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Baton not found",
        )

    normalized_status = normalize_baton_status(baton.baton_status)
    if baton.baton_status != normalized_status:
        baton.baton_status = normalized_status
        db.commit()
        db.refresh(baton)

    return build_baton_response(db, baton)


@router.patch("/batons/{baton_id}", response_model=BatonResponse, tags=["Batons"])
def update_baton(baton_id: int, payload: BatonUpdate, db: Session = Depends(get_db)):
    baton = db.query(Baton).filter(Baton.id == baton_id).first()

    if not baton:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Baton not found",
        )

    previous_owner_id = baton.owner_id
    previous_owner = db.query(Person).filter(Person.id == previous_owner_id).first()
    previous_owner_name = previous_owner.name if previous_owner else f"User {previous_owner_id}"

    update_data = payload.model_dump(exclude_unset=True)
    if "baton_status" in update_data and update_data["baton_status"] is not None:
        update_data["baton_status"] = normalize_baton_status(update_data["baton_status"])

    if "daily_logs" in update_data and update_data["daily_logs"] is not None:
        normalized_logs = []
        for log in update_data["daily_logs"]:
            if hasattr(log, "model_dump"):
                normalized_logs.append(log.model_dump())
            elif isinstance(log, dict):
                normalized_logs.append(log)
        update_data["daily_logs"] = normalized_logs

    for field, value in update_data.items():
        setattr(baton, field, value)

    if "owner_id" in update_data and baton.owner_id != previous_owner_id:
        new_owner = db.query(Person).filter(Person.id == baton.owner_id).first()
        new_owner_name = new_owner.name if new_owner else f"User {baton.owner_id}"
        owner_change_entry = {
            "date": datetime.utcnow().date().isoformat(),
            "note": f"[OWNER_CHANGE] {previous_owner_name} -> {new_owner_name}",
        }
        existing_logs = list(baton.daily_logs or [])
        existing_logs.append(owner_change_entry)
        baton.daily_logs = existing_logs

    baton.lifecycle_stage = determine_lifecycle_stage(baton)

    db.commit()
    db.refresh(baton)

    return build_baton_response(db, baton)


@router.post("/batons", response_model=BatonResponse, tags=["Batons"], status_code=201)
def create_baton(payload: BatonCreate, db: Session = Depends(get_db)):
    baton = Baton(
        project_id=payload.project_id,
        owner_id=payload.owner_id,
        successor_ids=payload.successor_ids,
        title=payload.title,
        description=payload.description,
        detailed_context=payload.detailed_context,
        implementation_state=payload.implementation_state,
        repo_link=payload.repo_link,
        branch_name=payload.branch_name,
        additional_resources=payload.additional_resources or [],
        daily_logs=[],
        baton_status=normalize_baton_status(payload.baton_status),
        dependencies=payload.dependencies,
        related_systems=payload.related_systems,
        troubleshooting_notes=payload.troubleshooting_notes,
        reconstruction_time=payload.reconstruction_time,
        lifecycle_stage="imported_ticket",
    )

    baton.lifecycle_stage = determine_lifecycle_stage(baton)

    db.add(baton)
    db.commit()
    db.refresh(baton)

    return build_baton_response(db, baton)