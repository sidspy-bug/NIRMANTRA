"""
Regulatory Knowledge Base module for Delhi NCT.

Provides semantic and hybrid retrieval over verified building bye-laws,
fire safety codes, and master plan provisions.
"""

from nirmantra_ai.knowledge.embeddings import (
    DeterministicMockEmbeddingClient,
    EmbeddingClient,
    OpenAIEmbeddingClient,
)
from nirmantra_ai.knowledge.ingest import (
    RegulatoryIngester,
    get_default_delhi_seed_provisions,
)
from nirmantra_ai.knowledge.models import (
    RegulatoryAuthority,
    RegulatoryCategory,
    RegulatoryChunk,
    RetrievalMatch,
    SourceReference,
)
from nirmantra_ai.knowledge.retriever import HybridRetriever
from nirmantra_ai.knowledge.store import RegulatoryStore

__all__ = [
    "DeterministicMockEmbeddingClient",
    "EmbeddingClient",
    "HybridRetriever",
    "OpenAIEmbeddingClient",
    "RegulatoryAuthority",
    "RegulatoryCategory",
    "RegulatoryChunk",
    "RegulatoryIngester",
    "RegulatoryStore",
    "RetrievalMatch",
    "SourceReference",
    "get_default_delhi_seed_provisions",
]
