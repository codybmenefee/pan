from dataclasses import dataclass
from typing import Optional
from datetime import datetime, timedelta


@dataclass
class PaddockObservation:
    external_id: str
    name: str
    ndvi_mean: float
    ndvi_std: float
    ndvi_min: float
    ndvi_max: float
    evi_mean: float
    ndwi_mean: float
    cloud_free_pct: float
    pixel_count: int
    date: str
    area: float


@dataclass
class GrazingEvent:
    paddock_external_id: str
    date: str
    duration_days: Optional[int] = None
    notes: Optional[str] = None


@dataclass
class PaddockScore:
    external_id: str
    name: str
    is_ready: bool
    readiness_score: float
    confidence: float
    reasons: list[str]
    suggestions: list[str]


@dataclass
class PlanRecommendation:
    primary_paddock: Optional[PaddockScore]
    alternatives: list[PaddockScore]
    overall_confidence: float
    reasoning: list[str]
    is_low_confidence: bool


class PaddockScorer:
    NDVI_READY_THRESHOLD = 0.40
    NDVI_SLOPE_MIN = -0.01
    MIN_REST_PERIOD_DAYS = 21
    CLOUD_FREE_MIN = 0.50
    CLOUD_FREE_TARGET = 0.75
    NDVI_STD_THRESHOLD = 0.15
    SLOPE_AMBIGUOUS = 0.005

    def __init__(
        self,
        min_ndvi_threshold: float = None,
        min_rest_period_days: int = None,
        cloud_cover_tolerance: float = None,
    ):
        self.min_ndvi_threshold = min_ndvi_threshold or self.NDVI_READY_THRESHOLD
        self.min_rest_period_days = min_rest_period_days or self.MIN_REST_PERIOD_DAYS
        self.cloud_cover_tolerance = cloud_cover_tolerance or self.CLOUD_FREE_MIN

    def calculate_rest_days(
        self, observation_date: str, last_grazed_date: Optional[str]
    ) -> int:
        if not last_grazed_date:
            return float('inf')
        obs = datetime.fromisoformat(observation_date)
        grazed = datetime.fromisoformat(last_grazed_date)
        return (obs - grazed).days

    def calculate_ndvi_slope(
        self, current_ndvi: float, previous_ndvi: Optional[float], days_diff: int = 7
    ) -> float:
        if not previous_ndvi or days_diff == 0:
            return 0.0
        return (current_ndvi - previous_ndvi) / days_diff

    def score_paddock(
        self,
        observation: PaddockObservation,
        last_grazed_date: Optional[str] = None,
        previous_ndvi: Optional[float] = None,
        days_since_previous: int = 7,
    ) -> PaddockScore:
        rest_days = self.calculate_rest_days(observation.date, last_grazed_date)
        ndvi_slope = self.calculate_ndvi_slope(
            observation.ndvi_mean, previous_ndvi, days_since_previous
        )

        reasons = []
        suggestions = []
        base_score = 0.0
        confidence = 1.0

        ndvi_ok = observation.ndvi_mean >= self.min_ndvi_threshold
        slope_ok = ndvi_slope >= self.NDVI_SLOPE_MIN
        rest_ok = rest_days >= self.min_rest_period_days if rest_days != float('inf') else False
        cloud_ok = observation.cloud_free_pct >= self.cloud_cover_tolerance

        if ndvi_ok:
            base_score += 0.4
        else:
            deficit = self.min_ndvi_threshold - observation.ndvi_mean
            base_score += max(0, 0.4 - deficit * 2)
            reasons.append(f"NDVI below threshold ({observation.ndvi_mean:.2f} < {self.min_ndvi_threshold:.2f})")
            days_to_recovery = int(deficit / 0.01) if ndvi_slope > 0 else float('inf')
            if days_to_recovery != float('inf'):
                suggestions.append(f"Expected ready in ~{days_to_recovery} days")
            else:
                suggestions.append("Monitor recovery trend")

        if slope_ok:
            base_score += 0.2
        else:
            base_score += max(0, 0.2 + ndvi_slope * 5)
            if ndvi_slope < -0.02:
                reasons.append("Vegetation declining rapidly")
                suggestions.append("Consider grazing to prevent further decline")
            else:
                reasons.append("Vegetation trend unclear or declining")

        if rest_ok:
            base_score += 0.2
        else:
            if rest_days == float('inf'):
                reasons.append("No grazing history recorded")
                suggestions.append("Manual grazing tracking recommended")
            else:
                deficit_days = self.min_rest_period_days - rest_days
                base_score += max(0, 0.2 - deficit_days * 0.01)
                reasons.append(f"Insufficient rest ({rest_days} days < {self.min_rest_period_days})")
                suggestions.append(f"Wait ~{deficit_days} more days")

        if cloud_ok:
            base_score += 0.2
        else:
            reasons.append(f"Low data quality ({observation.cloud_free_pct:.0%} cloud-free)")
            confidence *= 0.6

        if observation.ndvi_std > self.NDVI_STD_THRESHOLD:
            confidence *= 0.85
            reasons.append(f"Uneven vegetation (std: {observation.ndvi_std:.3f})")

        if abs(ndvi_slope) < self.SLOPE_AMBIGUOUS:
            confidence *= 0.9

        if observation.cloud_free_pct < self.CLOUD_FREE_TARGET:
            confidence *= 0.8

        confidence = round(max(0.1, min(1.0, confidence)), 2)
        base_score = round(max(0.0, min(1.0, base_score)), 2)

        is_ready = ndvi_ok and slope_ok and rest_ok and cloud_ok

        return PaddockScore(
            external_id=observation.external_id,
            name=observation.name,
            is_ready=is_ready,
            readiness_score=base_score,
            confidence=confidence,
            reasons=reasons,
            suggestions=suggestions,
        )


class PlanGenerator:
    def __init__(self, scorer: PaddockScorer = None):
        self.scorer = scorer or PaddockScorer()

    def generate_plan(
        self,
        observations: list[PaddockObservation],
        grazing_events: list[GrazingEvent] = None,
        previous_observations: dict[str, PaddockObservation] = None,
    ) -> PlanRecommendation:
        if not observations:
            return PlanRecommendation(
                primary_paddock=None,
                alternatives=[],
                overall_confidence=0.0,
                reasoning=["No observation data available"],
                is_low_confidence=True,
            )

        grazing_events = grazing_events or []
        previous_observations = previous_observations or {}

        last_grazed_by_paddock: dict[str, str] = {}
        for event in grazing_events:
            if event.paddock_external_id not in last_grazed_by_paddock:
                last_grazed_by_paddock[event.paddock_external_id] = event.date
            elif event.date > last_grazed_by_paddock[event.paddock_external_id]:
                last_grazed_by_paddock[event.paddock_external_id] = event.date

        scored_paddocks: list[PaddockScore] = []
        for obs in observations:
            prev_obs = previous_observations.get(obs.external_id)
            prev_date = prev_obs.date if prev_obs else None
            days_diff = 7
            if prev_obs and prev_date:
                try:
                    days_diff = (datetime.fromisoformat(obs.date) - datetime.fromisoformat(prev_date)).days
                except ValueError:
                    days_diff = 7

            last_grazed = last_grazed_by_paddock.get(obs.external_id)
            score = self.scorer.score_paddock(
                obs, last_grazed, prev_obs.ndvi_mean if prev_obs else None, days_diff
            )
            scored_paddocks.append(score)

        ready_paddocks = [p for p in scored_paddocks if p.is_ready]
        not_ready = [p for p in scored_paddocks if not p.is_ready]

        ready_paddocks.sort(key=lambda x: (x.readiness_score * x.confidence), reverse=True)
        not_ready.sort(key=lambda x: (x.readiness_score * x.confidence), reverse=True)

        reasoning = []
        is_low_confidence = False

        if ready_paddocks:
            primary = ready_paddocks[0]
            alternatives = ready_paddocks[1:3]
            avg_confidence = sum(p.confidence for p in ready_paddocks[:3]) / len(ready_paddocks[:3])
            overall_confidence = round(avg_confidence, 2)

            if len(ready_paddocks) == 1:
                reasoning.append(f"Single paddock ready: {primary.name}")
            else:
                reasoning.append(f"{len(ready_paddocks)} paddocks ready for grazing")

            if primary.reasons:
                reasoning.extend(primary.reasons[:2])

            if overall_confidence < 0.7:
                is_low_confidence = True

        elif not_ready:
            best = not_ready[0]
            alternatives = not_ready[1:3]
            overall_confidence = round(best.confidence * 0.7, 2)
            is_low_confidence = True

            reasoning.append(f"No paddocks fully ready. Closest: {best.name}")
            if best.suggestions:
                reasoning.append(f"Suggestion: {best.suggestions[0]}")
        else:
            return PlanRecommendation(
                primary_paddock=None,
                alternatives=[],
                overall_confidence=0.0,
                reasoning=["Unable to assess paddocks - check data quality"],
                is_low_confidence=True,
            )

        return PlanRecommendation(
            primary_paddock=ready_paddocks[0] if ready_paddocks else not_ready[0],
            alternatives=alternatives,
            overall_confidence=overall_confidence,
            reasoning=reasoning,
            is_low_confidence=is_low_confidence,
        )


def observation_to_recommendation(plan: PlanRecommendation) -> dict:
    return {
        "primaryPaddock": {
            "externalId": plan.primary_paddock.external_id,
            "name": plan.primary_paddock.name,
            "readinessScore": plan.primary_paddock.readiness_score,
            "confidence": plan.primary_paddock.confidence,
            "reasons": plan.primary_paddock.reasons,
            "suggestions": plan.primary_paddock.suggestions,
        } if plan.primary_paddock else None,
        "alternatives": [
            {
                "externalId": p.external_id,
                "name": p.name,
                "readinessScore": p.readiness_score,
                "confidence": p.confidence,
                "reasons": p.reasons,
                "suggestions": p.suggestions,
            }
            for p in plan.alternatives
        ],
        "overallConfidence": plan.overall_confidence,
        "reasoning": plan.reasoning,
        "isLowConfidence": plan.is_low_confidence,
    }
