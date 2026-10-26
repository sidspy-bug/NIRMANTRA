"""
FastAPI Application Factory for Nirmantra AI.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from nirmantra_ai.api.routes import router
from nirmantra_ai.config import configure_logging, get_settings
from nirmantra_ai.pipeline import CompliancePipeline

logger = logging.getLogger(__name__)


def create_app(pipeline: CompliancePipeline | None = None) -> FastAPI:
    """Create and configure the Nirmantra AI FastAPI application.

    Args:
        pipeline: Optional pre-configured CompliancePipeline instance.
                  If None, an instance is initialized during application lifespan.
    """
    settings = get_settings()
    configure_logging(settings.log_level)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
        # Startup: initialize pipeline if not already set
        if not hasattr(app.state, "pipeline") or app.state.pipeline is None:
            logger.info("Initializing Nirmantra CompliancePipeline on startup...")
            app.state.pipeline = pipeline or CompliancePipeline(settings=settings)
        logger.info("Nirmaantra AI API ready to receive requests.")
        yield
        # Shutdown cleanup if needed
        logger.info("Nirmaantra AI API shutting down.")

    app = FastAPI(
        title="NIRMAANTRA AI — Building Safety & Regulatory Compliance API",
        description=(
            "Autonomous AI layer providing automated building safety & regulatory compliance "
            "evaluations for Delhi NCT, India (Unified Building Bye-Laws for Delhi 2016, "
            "Master Plan for Delhi 2041, Delhi Fire Service Act, and NBC 2016 Part 4).\n\n"
            "Features:\n"
            "- Direct document upload (PDF drawings & Scanned image schedules via OCR)\n"
            "- LLM-powered schema extraction with provenance tracking\n"
            "- Deterministic statutory rule engine (Pass / Fail / Review)\n"
            "- Vector knowledge base with statutory citations\n"
            "- Audit-ready compliance reports with mandatory COA architect disclaimer"
        ),
        version="0.1.0",
        lifespan=lifespan,
    )

    # Enable CORS for frontend clients (Next.js, React, Vue, mobile, external portals)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register API endpoints
    app.include_router(router)

    if pipeline is not None:
        app.state.pipeline = pipeline

    return app


# Default ASGI application instance for 'uvicorn nirmantra_ai.api.app:app'
app = create_app()
