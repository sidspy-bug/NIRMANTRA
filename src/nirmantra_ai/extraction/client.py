"""
LLM Client interfaces and implementations.

Provides an abstract Protocol, an OpenAI production client, and a Mock client
for offline testing and development without live API keys.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Protocol, runtime_checkable

from nirmantra_ai.config import get_settings

logger = logging.getLogger(__name__)


@runtime_checkable
class LLMClient(Protocol):
    """Protocol defining the interface for LLM completions."""

    def complete_json(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.0,
    ) -> dict[str, Any]:
        """Generate a JSON response from the given prompts."""
        ...


class OpenAILLMClient:
    """Production client using OpenAI API."""

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        base_url: str | None = None,
    ) -> None:
        """
        Args:
            api_key: Optional explicit key; if None, openai reads OPENAI_API_KEY from env.
            model: Optional model override; defaults to settings.llm_model.
            base_url: Optional base URL override; defaults to settings.openai_base_url.
        """
        import os
        import openai
        from dotenv import dotenv_values

        settings = get_settings()
        env_file_vals = dotenv_values(".env") if os.path.exists(".env") else {}
        raw_key = api_key.llm_api_key if hasattr(api_key, "llm_api_key") else api_key
        resolved_key = str(
            raw_key
            or env_file_vals.get("OPENAI_API_KEY")
            or os.environ.get("OPENAI_API_KEY", "")
        ).strip()
        resolved_base_url = (
            base_url
            or env_file_vals.get("OPENAI_BASE_URL")
            or settings.openai_base_url
        )

        # Auto-detect OpenRouter keys (sk-or-v1-...)
        if resolved_key.startswith("sk-or-v1-"):
            if not resolved_base_url:
                resolved_base_url = "https://openrouter.ai/api/v1"
            # Ensure model ID is formatted for OpenRouter if using default gpt-4o
            default_model = "openai/gpt-4o-mini" if settings.llm_model in {"gpt-4o", "gpt-4o-mini"} else settings.llm_model
            self.model = model or default_model
        else:
            self.model = model or settings.llm_model

        kwargs: dict[str, Any] = {}
        if resolved_key:
            kwargs["api_key"] = resolved_key
        if resolved_base_url:
            kwargs["base_url"] = resolved_base_url

        self.client = openai.OpenAI(**kwargs)

    def complete_json(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.0,
    ) -> dict[str, Any]:
        """Request JSON structured completion from OpenAI / OpenRouter."""
        sys_msg = system_prompt
        if "json" not in sys_msg.lower():
            sys_msg = f"{sys_msg}\n\nYou must respond with valid JSON."

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": sys_msg},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            max_tokens=2500,
            temperature=temperature,
        )
        content = response.choices[0].message.content or "{}"
        return json.loads(content)


class MockLLMClient:
    """Deterministic mock client for offline tests and local development.

    Accepts pre-configured responses or returns standard synthetic building data.
    """

    def __init__(self, response_override: dict[str, Any] | None = None) -> None:
        self.response_override = response_override
        self.call_history: list[dict[str, str]] = []

    def complete_json(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.0,
    ) -> dict[str, Any]:
        """Record the call and return the mock JSON."""
        self.call_history.append(
            {"system_prompt": system_prompt, "user_prompt": user_prompt}
        )

        if self.response_override is not None:
            return self.response_override

        # Default synthetic response representing a typical extracted plan
        return {
            "project_name": {
                "value": "Test Residential Complex",
                "raw_snippet": "Building Name: Test Residential Complex",
                "page_number": 1,
                "confidence": "high",
                "is_inferred": False,
            },
            "location_address": {
                "value": "Plot No. 42, Sector 5, Dwarka, New Delhi",
                "raw_snippet": "Location: Plot No. 42, Sector 5, Dwarka, New Delhi",
                "page_number": 1,
                "confidence": "high",
                "is_inferred": False,
            },
            "occupancy_type": {
                "value": "residential",
                "raw_snippet": "Residential Complex",
                "page_number": 1,
                "confidence": "high",
                "is_inferred": False,
            },
            "plot_area_sqm": {
                "value": 500.0,
                "raw_snippet": "Plot Area: 500 sq. m.",
                "page_number": 1,
                "confidence": "high",
                "is_inferred": False,
            },
            "total_builtup_area_sqm": {
                "value": 1200.0,
                "raw_snippet": "Total Built-up Area: 1200 sq. m.",
                "page_number": 1,
                "confidence": "high",
                "is_inferred": False,
            },
            "ground_coverage_sqm": {
                "value": 300.0,
                "raw_snippet": None,
                "page_number": None,
                "confidence": "low",
                "is_inferred": True,
            },
            "building_height_m": {
                "value": 15.5,
                "raw_snippet": "Building Height: 15.5 metres",
                "page_number": 1,
                "confidence": "high",
                "is_inferred": False,
            },
            "number_of_floors": {
                "value": 5,
                "raw_snippet": "Number of Floors: Ground + 4",
                "page_number": 1,
                "confidence": "medium",
                "is_inferred": True,
            },
            "road_width_m": {
                "value": 12.0,
                "raw_snippet": "12m wide road",
                "page_number": 1,
                "confidence": "high",
                "is_inferred": False,
            },
            "parking_spaces_provided": {
                "value": 8,
                "raw_snippet": "8 parking bays",
                "page_number": 1,
                "confidence": "high",
                "is_inferred": False,
            },
            "setbacks": {
                "front_m": {
                    "value": 6.0,
                    "raw_snippet": "Front setback: 6.0 metres",
                    "page_number": 2,
                    "confidence": "high",
                    "is_inferred": False,
                },
                "rear_m": {
                    "value": 3.0,
                    "raw_snippet": "Rear setback: 3.0 metres",
                    "page_number": 2,
                    "confidence": "high",
                    "is_inferred": False,
                },
                "side1_m": {
                    "value": 3.0,
                    "raw_snippet": "Side setback (left): 3.0 metres",
                    "page_number": 2,
                    "confidence": "high",
                    "is_inferred": False,
                },
                "side2_m": {
                    "value": 3.0,
                    "raw_snippet": "Side setback (right): 3.0 metres",
                    "page_number": 2,
                    "confidence": "high",
                    "is_inferred": False,
                },
            },
            "fire_safety": {
                "staircase_width_m": {
                    "value": 1.2,
                    "raw_snippet": "Emergency staircase width: 1.2 metres",
                    "page_number": 2,
                    "confidence": "high",
                    "is_inferred": False,
                },
                "fire_extinguishers_present": {
                    "value": True,
                    "raw_snippet": "Fire extinguishers on each floor",
                    "page_number": 2,
                    "confidence": "high",
                    "is_inferred": False,
                },
                "fire_alarm_present": {
                    "value": True,
                    "raw_snippet": "Fire alarm system installed",
                    "page_number": 2,
                    "confidence": "high",
                    "is_inferred": False,
                },
                "sprinklers_present": {
                    "value": None,
                    "raw_snippet": None,
                    "page_number": None,
                    "confidence": "unknown",
                    "is_inferred": False,
                },
                "emergency_exits_count": {
                    "value": 2,
                    "raw_snippet": "2 emergency exits provided",
                    "page_number": 2,
                    "confidence": "high",
                    "is_inferred": False,
                },
                "refuge_area_present": {
                    "value": True,
                    "raw_snippet": "Refuge area on 3rd floor",
                    "page_number": 2,
                    "confidence": "high",
                    "is_inferred": False,
                },
            },
        }
