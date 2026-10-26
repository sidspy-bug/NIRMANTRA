"""
Embedding client interfaces and implementations.

Provides an abstract Protocol, a production OpenAI embedding client,
and a deterministic mock embedding client for offline testing and local dry-runs.
"""

from __future__ import annotations

import hashlib
import math
import logging
from typing import Protocol, runtime_checkable

from nirmantra_ai.config import get_settings

logger = logging.getLogger(__name__)


@runtime_checkable
class EmbeddingClient(Protocol):
    """Protocol for generating vector embeddings."""

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for a batch of text passages."""
        ...

    def embed_query(self, query: str) -> list[float]:
        """Generate an embedding for a search query."""
        ...


class OpenAIEmbeddingClient:
    """Production client using OpenAI text-embedding models."""

    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        import openai

        settings = get_settings()
        self.model = model or settings.embedding_model
        self.client = openai.OpenAI(api_key=api_key) if api_key else openai.OpenAI()

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        response = self.client.embeddings.create(
            input=texts,
            model=self.model,
        )
        return [item.embedding for item in response.data]

    def embed_query(self, query: str) -> list[float]:
        return self.embed_texts([query])[0]


class DeterministicMockEmbeddingClient:
    """Offline deterministic embedding generator.

    Generates normalized 128-dimensional vectors based on word-token hashes.
    Ensures identical texts produce identical vectors, and texts sharing words
    have positive cosine similarity, enabling realistic offline retrieval tests.
    """

    def __init__(self, dimensions: int = 128) -> None:
        self.dimensions = dimensions

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        return [self._embed_single(t) for t in texts]

    def embed_query(self, query: str) -> list[float]:
        return self._embed_single(query)

    def _embed_single(self, text: str) -> list[float]:
        vec = [0.0] * self.dimensions
        words = text.lower().replace("\n", " ").split()

        if not words:
            # Neutral vector
            return [1.0 / math.sqrt(self.dimensions)] * self.dimensions

        for word in words:
            # Deterministically hash word to index and sign
            h = int(hashlib.sha256(word.encode("utf-8")).hexdigest(), 16)
            idx = h % self.dimensions
            sign = 1.0 if (h >> 16) % 2 == 0 else -1.0
            vec[idx] += sign

        # L2-normalize
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0.0:
            vec = [x / norm for x in vec]
        else:
            vec = [1.0 / math.sqrt(self.dimensions)] * self.dimensions

        return vec
