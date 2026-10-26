"""
Prompts for generating grounded statutory explanations from retrieved legal passages.
"""

from __future__ import annotations

RAG_EXPLANATION_SYSTEM_PROMPT = """\
You are an expert civil and regulatory compliance engineer for Delhi NCT, India.

Your task is to generate clear, professional, evidence-backed explanations for building compliance evaluation findings.

STRICT RULES:
1. NEVER alter or contradict the provided deterministic rule status (PASS, FAIL, NEEDS_REVIEW, NOT_APPLICABLE).
2. Base your explanation strictly on:
   a) The measured building values and statutory limits provided in the finding.
   b) The retrieved statutory bye-law passages.
3. NEVER fabricate regulations, clauses, or notifications. Cite ONLY the clauses present in the context.
4. For FAIL findings: clearly explain the deficiency (excess FAR, deficient setback, etc.) and recommend specific design modifications.
5. For NEEDS_REVIEW findings: specify exactly which evidence is missing and instruct what drawing or document the applicant must submit.
6. For PASS findings: confirm compliance against the statutory threshold.
7. Output strictly valid JSON matching the required schema:
   {
     "explanation": "...",
     "next_steps": ["step 1", "step 2"]
   }
"""

RAG_EXPLANATION_USER_PROMPT = """\
Generate a grounded explanation and actionable next steps for the following compliance finding:

Rule Evaluated: {rule_name} ({rule_id})
Deterministic Status: {status}
Measured Value: {measured_value} {unit}
Permissible Limit: {permissible_limit} {unit}
Evaluation Details: {details}
Missing Evidence: {missing_evidence}
{building_context_section}
Applicable Regulatory Passages:
<regulatory_passages>
{regulatory_passages}
</regulatory_passages>
"""


def format_rag_prompt(
    rule_id: str,
    rule_name: str,
    status: str,
    measured_value: str,
    permissible_limit: str,
    unit: str,
    details: str,
    missing_evidence: list[str],
    passages: list[str],
    building_context: str = "",
) -> str:
    """Format user prompt for grounded finding explanation."""
    passages_text = "\n\n".join(
        f"[{idx+1}] {p}" for idx, p in enumerate(passages)
    ) if passages else "No specific passages retrieved."

    b_section = f"Building Context:\n{building_context}\n" if building_context else ""

    return RAG_EXPLANATION_USER_PROMPT.format(
        rule_id=rule_id,
        rule_name=rule_name,
        status=status,
        measured_value=measured_value or "N/A",
        permissible_limit=permissible_limit or "N/A",
        unit=unit or "",
        details=details,
        missing_evidence=", ".join(missing_evidence) if missing_evidence else "None",
        building_context_section=b_section,
        regulatory_passages=passages_text,
    )
