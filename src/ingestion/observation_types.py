"""
Shared type definitions for the ingestion pipeline.
"""
from typing import TypedDict


class ObservationRecord(TypedDict):
    """Observation record for Convex storage."""
    farmExternalId: str
    paddockExternalId: str
    date: str
    ndviMean: float
    ndviMin: float
    ndviMax: float
    ndviStd: float
    eviMean: float
    ndwiMean: float
    cloudFreePct: float
    pixelCount: int
    isValid: bool
    sourceProvider: str
    resolutionMeters: int
    createdAt: str
