"""
CLI Utility to ingest new Unified Building Bye-Laws (UBBL) files into Nirmantra AI knowledge base.

Usage:
    python scripts/ingest_regulations.py path/to/byelaw.pdf
    python scripts/ingest_regulations.py data/regulations/delhi_ubbl_2016_sample.json --authority DDA
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Add src to path if run standalone
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir / "src"))

from nirmantra_ai.config import configure_logging
from nirmantra_ai.knowledge.embeddings import DeterministicMockEmbeddingClient, OpenAIEmbeddingClient
from nirmantra_ai.knowledge.ingest import RegulatoryIngester
from nirmantra_ai.knowledge.models import RegulatoryAuthority
from nirmantra_ai.knowledge.store import RegulatoryStore


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Ingest Unified Building Bye-Laws (UBBL) documents into Nirmantra AI Vector Store."
    )
    parser.add_argument(
        "file_path",
        type=str,
        help="Path to the bye-law document (.json, .pdf, .txt, .md).",
    )
    parser.add_argument(
        "--title",
        type=str,
        default=None,
        help="Document title override (e.g., 'Unified Building Bye-Laws for Delhi 2016').",
    )
    parser.add_argument(
        "--authority",
        type=str,
        default="DDA",
        choices=["DDA", "MCD", "NDMC", "DFS", "DUAC", "NATIONAL"],
        help="Issuing regulatory authority.",
    )
    parser.add_argument(
        "--effective-date",
        type=str,
        default="2016-03-22",
        help="Effective date of notification.",
    )
    parser.add_argument(
        "--in-memory",
        action="store_true",
        help="Use temporary in-memory store for verification testing.",
    )

    args = parser.parse_args()
    configure_logging("INFO")

    target_path = Path(args.file_path)
    if not target_path.exists():
        print(f"Error: File '{args.file_path}' does not exist.", file=sys.stderr)
        sys.exit(1)

    authority = RegulatoryAuthority[args.authority]
    store = RegulatoryStore(in_memory=args.in_memory)
    embedder = DeterministicMockEmbeddingClient(dimensions=64)
    ingester = RegulatoryIngester(store=store, embedding_client=embedder)

    print(f"Ingesting '{target_path.name}' for {authority.value}...")
    count = ingester.ingest_document(
        file_path=target_path,
        document_title=args.title,
        authority=authority,
        effective_date=args.effective_date,
    )

    print(f"Success: Ingested {count} statutory clauses into collection '{store.collection_name}'. Total: {store.count()}")


if __name__ == "__main__":
    main()
