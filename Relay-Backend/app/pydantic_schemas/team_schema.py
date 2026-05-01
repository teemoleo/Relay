from pydantic import BaseModel


class TeamRiskResponse(BaseModel):
    team_id: int
    team_name: str
    division_id: int
    division_name: str
    staff_availability_percentage: int
    unassigned_baton_count: int
    total_baton_count: int
    unassigned_baton_percentage: int
    delivery_delay_risk: str
    overall_risk_score: int