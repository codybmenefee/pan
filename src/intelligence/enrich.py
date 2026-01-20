from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List
import os


@dataclass
class PaddockContext:
    external_id: str
    name: str
    area: float
    ndvi_mean: float
    ndvi_std: float
    ndvi_trend: str
    rest_days: int
    days_grazed: int
    total_planned: int
    deterministic_score: float
    last_grazed: Optional[str] = None
    geometry: Optional[dict] = None


@dataclass
class FarmContext:
    external_id: str
    name: str
    active_paddock: PaddockContext
    alternatives: List[PaddockContext]
    min_ndvi_threshold: float
    min_rest_period: int
    default_section_pct: float
    date: str


@dataclass
class PreviousSection:
    date: str
    vertices: list
    area: float


def load_context_from_convex(convex_data: dict) -> FarmContext:
    """
    Transform Convex query results into FarmContext.

    convex_data should contain:
    - farm: {externalId, name}
    - observations: list of {paddockExternalId, ndviMean, ndviStd, date}
    - grazingEvents: list of {paddockExternalId, date}
    - settings: {minNDVIThreshold, minRestPeriod}
    """
    farm = convex_data.get("farm", {})
    observations = convex_data.get("observations", [])
    grazing_events = convex_data.get("grazingEvents", [])
    settings = convex_data.get("settings", {})

    observations_by_paddock = {}
    for obs in observations:
        pid = obs.get("paddockExternalId")
        if pid not in observations_by_paddock:
            observations_by_paddock[pid] = []
        observations_by_paddock[pid].append(obs)

    latest_observations = {}
    for pid, obs_list in observations_by_paddock.items():
        sorted_obs = sorted(obs_list, key=lambda x: x.get("date", ""), reverse=True)
        if sorted_obs:
            latest_observations[pid] = sorted_obs[0]

    last_grazed_by_paddock = {}
    for event in grazing_events:
        pid = event.get("paddockExternalId")
        event_date = event.get("date", "")
        if pid not in last_grazed_by_paddock:
            last_grazed_by_paddock[pid] = event_date
        elif event_date > last_grazed_by_paddock[pid]:
            last_grazed_by_paddock[pid] = event_date

    today = datetime.now().strftime("%Y-%m-%d")

    paddock_contexts = []
    for obs in latest_observations.values():
        pid = obs.get("paddockExternalId", "")
        obs_date = obs.get("date", "")
        last_grazed = last_grazed_by_paddock.get(pid)

        rest_days = 0
        if last_grazed:
            try:
                last_date = datetime.fromisoformat(last_grazed)
                rest_days = (datetime.fromisoformat(obs_date) - last_date).days
            except ValueError:
                rest_days = 999

        context = PaddockContext(
            external_id=pid,
            name=_get_paddock_name(pid, observations),
            area=_get_paddock_area(pid, observations),
            ndvi_mean=obs.get("ndviMean", 0.45),
            ndvi_std=obs.get("ndviStd", 0.08),
            ndvi_trend=_calculate_trend(obs.get("ndviMean", 0.45), observations_by_paddock.get(pid, [])),
            rest_days=rest_days,
            days_grazed=0,
            total_planned=0,
            deterministic_score=0.5,
            last_grazed=last_grazed,
        )
        paddock_contexts.append(context)

    if not paddock_contexts:
        dummy_paddock = PaddockContext(
            external_id="p1",
            name="Default Paddock",
            area=42.5,
            ndvi_mean=0.52,
            ndvi_std=0.08,
            ndvi_trend="stable",
            rest_days=28,
            days_grazed=2,
            total_planned=4,
            deterministic_score=0.78,
        )
        paddock_contexts = [dummy_paddock]

    active_paddock = paddock_contexts[0]
    alternatives = paddock_contexts[1:4] if len(paddock_contexts) > 1 else []

    return FarmContext(
        external_id=farm.get("externalId", ""),
        name=farm.get("name", "Unknown Farm"),
        active_paddock=active_paddock,
        alternatives=alternatives,
        min_ndvi_threshold=settings.get("minNDVIThreshold", 0.40),
        min_rest_period=settings.get("minRestPeriod", 21),
        default_section_pct=0.20,
        date=today,
    )


def enrich_with_deterministic_scores(
    context: FarmContext,
) -> FarmContext:
    """
    Run deterministic scorer on all paddocks to enrich context.
    """
    from .planner import PaddockScorer, PaddockObservation

    scorer = PaddockScorer(
        min_ndvi_threshold=context.min_ndvi_threshold,
        min_rest_period_days=context.min_rest_period,
    )

    all_paddocks = [context.active_paddock] + context.alternatives

    for paddock in all_paddocks:
        if paddock.deterministic_score == 0.5:
            obs = PaddockObservation(
                external_id=paddock.external_id,
                name=paddock.name,
                ndvi_mean=paddock.ndvi_mean,
                ndvi_std=paddock.ndvi_std,
                ndvi_min=0.0,
                ndvi_max=1.0,
                evi_mean=0.0,
                ndwi_mean=0.0,
                cloud_free_pct=0.9,
                pixel_count=1000,
                date=context.date,
                area=paddock.area,
            )
            score = scorer.score_paddock(
                observation=obs,
                last_grazed_date=paddock.last_grazed,
            )
            paddock.deterministic_score = score.readiness_score

    return context


def render_user_prompt(template_path: str, context: FarmContext) -> str:
    """
    Render the user prompt template with context values.
    """
    with open(template_path) as f:
        template = f.read()

    alternatives_table_rows = []
    for alt in context.alternatives:
        alternatives_table_rows.append(
            f"| {alt.external_id} | {alt.name} | {alt.area:.1f} | {alt.ndvi_mean:.2f} | {alt.rest_days} | {alt.deterministic_score:.2f} |"
        )
    alternatives_table = "\n".join(alternatives_table_rows) if alternatives_table_rows else "| | | | | |\n"

    all_paddocks = [context.active_paddock] + context.alternatives
    deterministic_rows = []
    for p in all_paddocks:
        ndvi_check = "✓" if p.ndvi_mean >= context.min_ndvi_threshold else "✗"
        rest_check = "✓" if p.rest_days >= context.min_rest_period else "✗"
        slope_check = "✓" if p.ndvi_trend in ["stable", "increasing"] else "✗"
        deterministic_rows.append(
            f"| {p.external_id} | {p.deterministic_score:.2f} | {ndvi_check} | {rest_check} | {slope_check} |"
        )
    deterministic_scores = "\n".join(deterministic_rows)

    previous_sections = _format_previous_sections(context.active_paddock)

    active_progress = 0
    if context.active_paddock.total_planned > 0:
        active_progress = (context.active_paddock.days_grazed / context.active_paddock.total_planned) * 100

    values = {
        "farm_name": context.name,
        "date": context.date,
        "active_paddock_id": context.active_paddock.external_id,
        "active_paddock_name": context.active_paddock.name,
        "active_paddock_area": f"{context.active_paddock.area:.1f}",
        "active_ndvi_mean": f"{context.active_paddock.ndvi_mean:.2f}",
        "active_ndvi_std": f"{context.active_paddock.ndvi_std:.3f}",
        "active_ndvi_trend": context.active_paddock.ndvi_trend,
        "active_rest_days": str(context.active_paddock.rest_days),
        "active_days_grazed": str(context.active_paddock.days_grazed),
        "active_total_planned": str(context.active_paddock.total_planned),
        "active_progress_pct": f"{active_progress:.0f}",
        "alternatives_table": alternatives_table,
        "deterministic_scores_table": deterministic_scores,
        "previous_sections": previous_sections,
        "min_ndvi_threshold": f"{context.min_ndvi_threshold:.2f}",
        "min_rest_period": str(context.min_rest_period),
        "default_section_pct": f"{context.default_section_pct * 100:.0f}",
    }

    for key, value in values.items():
        template = template.replace(f"{{{{{key}}}}}", str(value))

    return template


def _get_paddock_name(paddock_id: str, observations: list) -> str:
    """Extract paddock name from observations or use ID."""
    return f"Paddock {paddock_id}"


def _get_paddock_area(paddock_id: str, observations: list) -> float:
    """Get paddock area from observations or use default."""
    for obs in observations:
        if obs.get("paddockExternalId") == paddock_id:
            return obs.get("area", 42.5)
    return 42.5


def _calculate_trend(current_ndvi: float, observations: list) -> str:
    """Calculate NDVI trend from historical observations."""
    if len(observations) < 2:
        return "stable"

    sorted_obs = sorted(observations, key=lambda x: x.get("date", ""))
    if len(sorted_obs) >= 2:
        prev_ndvi = sorted_obs[-2].get("ndviMean", current_ndvi)
        diff = current_ndvi - prev_ndvi
        if diff > 0.02:
            return "increasing"
        elif diff < -0.02:
            return "decreasing"
    return "stable"


def _format_previous_sections(paddock: PaddockContext) -> str:
    """Format previous sections for prompt."""
    return "No previous sections recorded for this rotation."


def load_context_from_dict(data: dict) -> FarmContext:
    """Create FarmContext from a dictionary (for testing)."""
    return FarmContext(
        external_id=data.get("externalId", ""),
        name=data.get("name", "Test Farm"),
        active_paddock=PaddockContext(
            external_id=data.get("activePaddockId", "p1"),
            name=data.get("activePaddockName", "Test Paddock"),
            area=data.get("activeArea", 42.5),
            ndvi_mean=data.get("activeNdvi", 0.52),
            ndvi_std=data.get("activeNdviStd", 0.08),
            ndvi_trend=data.get("activeNdviTrend", "stable"),
            rest_days=data.get("activeRestDays", 28),
            days_grazed=data.get("activeDaysGrazed", 2),
            total_planned=data.get("activeTotalPlanned", 4),
            deterministic_score=data.get("activeScore", 0.78),
        ),
        alternatives=[],
        min_ndvi_threshold=data.get("minNdviThreshold", 0.40),
        min_rest_period=data.get("minRestPeriod", 21),
        default_section_pct=data.get("defaultSectionPct", 0.20),
        date=data.get("date", datetime.now().strftime("%Y-%m-%d")),
    )
