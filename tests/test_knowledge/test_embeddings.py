"""
Tests for deterministic mock and embedding clients.
"""

from __future__ import annotations

import math

from nirmantra_ai.knowledge.embeddings import DeterministicMockEmbeddingClient


def test_mock_embedding_dimensions_and_normalization() -> None:
    client = DeterministicMockEmbeddingClient(dimensions=64)
    vec = client.embed_query("fire safety staircase requirements")

    assert len(vec) == 64
    # Ensure vector is L2 normalized: sum(x^2) ≈ 1.0
    norm = math.sqrt(sum(x * x for x in vec))
    assert abs(norm - 1.0) < 1e-4


def test_mock_embedding_is_deterministic() -> None:
    client = DeterministicMockEmbeddingClient(dimensions=32)
    t1 = "Plot area 500 sq m"
    t2 = "Plot area 500 sq m"
    v1 = client.embed_query(t1)
    v2 = client.embed_query(t2)
    assert v1 == v2


def test_mock_embedding_batch() -> None:
    client = DeterministicMockEmbeddingClient(dimensions=32)
    texts = ["First clause", "Second clause", "Third clause"]
    vectors = client.embed_texts(texts)
    assert len(vectors) == 3
    assert len(vectors[0]) == 32
