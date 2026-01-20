import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class LLMConfig:
    provider: str
    model: str
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    max_tokens: int = 4096
    temperature: float = 0.1
    timeout_seconds: int = 60


def get_config() -> LLMConfig:
    provider = os.getenv("LLM_PROVIDER", "anthropic").lower()

    if provider == "anthropic":
        return LLMConfig(
            provider="anthropic",
            model=os.getenv("ANTHROPIC_MODEL", "claude-haiku-4-5-20251001"),
            api_key=os.getenv("ANTHROPIC_API_KEY"),
            max_tokens=int(os.getenv("ANTHROPIC_MAX_TOKENS", "4096")),
            temperature=float(os.getenv("ANTHROPIC_TEMPERATURE", "0.1")),
            timeout_seconds=int(os.getenv("ANTHROPIC_TIMEOUT", "60")),
        )
    elif provider == "openrouter":
        return LLMConfig(
            provider="openrouter",
            model=os.getenv("OPENROUTER_MODEL", "anthropic/claude-haiku-4.5"),
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
            max_tokens=int(os.getenv("OPENROUTER_MAX_TOKENS", "4096")),
            temperature=float(os.getenv("OPENROUTER_TEMPERATURE", "0.1")),
            timeout_seconds=int(os.getenv("OPENROUTER_TIMEOUT", "60")),
        )
    else:
        raise ValueError(f"Unknown LLM provider: {provider}")


@dataclass
class ConvexConfig:
    url: str
    deploy_url: str

    def __post_init__(self):
        self.url = os.getenv("CONVEX_URL", "")
        self.deploy_url = os.getenv("CONVEX_DEPLOY_URL", "")


def get_convex_config() -> ConvexConfig:
    return ConvexConfig(
        url=os.getenv("CONVEX_URL", ""),
        deploy_url=os.getenv("CONVEX_DEPLOY_URL", ""),
    )


@dataclass
class IntelligenceConfig:
    llm: LLMConfig
    convex: ConvexConfig
    default_ndvi_threshold: float = 0.40
    default_rest_period_days: int = 21
    default_section_percent: float = 0.20

    def __post_init__(self):
        self.default_ndvi_threshold = float(
            os.getenv("DEFAULT_NDVI_THRESHOLD", "0.40")
        )
        self.default_rest_period_days = int(
            os.getenv("DEFAULT_REST_PERIOD_DAYS", "21")
        )
        self.default_section_percent = float(
            os.getenv("DEFAULT_SECTION_PERCENT", "0.20")
        )


def get_intelligence_config() -> IntelligenceConfig:
    return IntelligenceConfig(
        llm=get_config(),
        convex=get_convex_config(),
    )
