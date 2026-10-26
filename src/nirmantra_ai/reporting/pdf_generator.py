"""
Publication-Quality PDF Audit Report Generator for Nirmantra AI.

Generates formal, printable Building Safety & Regulatory Compliance Audit Certificates
for Delhi NCT, India (Unified Building Bye-Laws for Delhi 2016, DFS Act, NBC 2016).
"""

from __future__ import annotations

import io
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, BinaryIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from nirmantra_ai.rag.models import GroundedFinding, RuleStatus
from nirmantra_ai.reporting.models import ComplianceReport, OverallComplianceStatus

logger = logging.getLogger(__name__)

# Color Palette
PRIMARY_NAVY = colors.HexColor("#0F172A")    # Deep slate navy
ACCENT_BLUE = colors.HexColor("#1D4ED8")     # Corporate royal blue
TEXT_DARK = colors.HexColor("#1E293B")       # Slate 800 body text
TEXT_MUTED = colors.HexColor("#64748B")      # Slate 500 secondary text
BG_LIGHT = colors.HexColor("#F8FAFC")        # Off-white card fill
BORDER_LIGHT = colors.HexColor("#E2E8F0")    # Subtle line gray

# Status Colors
STATUS_COLORS = {
    RuleStatus.PASS: {
        "text": colors.HexColor("#065F46"),
        "bg": colors.HexColor("#D1FAE5"),
        "label": "PASS",
    },
    RuleStatus.FAIL: {
        "text": colors.HexColor("#991B1B"),
        "bg": colors.HexColor("#FEE2E2"),
        "label": "FAIL",
    },
    RuleStatus.NEEDS_REVIEW: {
        "text": colors.HexColor("#92400E"),
        "bg": colors.HexColor("#FEF3C7"),
        "label": "NEEDS REVIEW",
    },
    RuleStatus.NOT_APPLICABLE: {
        "text": colors.HexColor("#475569"),
        "bg": colors.HexColor("#F1F5F9"),
        "label": "N/A",
    },
}


class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute and stamp 'Page X of Y' on footers."""

    def __init__(self, *args, **kwargs) -> None:  # noqa: ANN002, ANN003
        super().__init__(*args, **kwargs)
        self._saved_page_states: list[dict] = []

    def showPage(self) -> None:
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self) -> None:
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages: int) -> None:
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(TEXT_MUTED)

        # Running Footer
        page_w, page_h = A4
        margin = 36.0
        y_pos = 22.0

        self.setStrokeColor(BORDER_LIGHT)
        self.setLineWidth(0.5)
        self.line(margin, y_pos + 12, page_w - margin, y_pos + 12)

        footer_text = "NIRMAANTRA AI — Building Safety & Regulatory Compliance Platform (Delhi NCT)"
        self.drawString(margin, y_pos, footer_text)

        page_str = f"Page {self._pageNumber} of {total_pages}"
        self.drawRightString(page_w - margin, y_pos, page_str)

        self.restoreState()


class PdfReportGenerator:
    """Generates professional, printable compliance audit certificate PDFs."""

    def __init__(self) -> None:
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self) -> None:
        """Define fine-tuned typography styles for government / engineering audit format."""
        self.styles.add(
            ParagraphStyle(
                name="ReportTitle",
                fontName="Helvetica-Bold",
                fontSize=18,
                leading=22,
                textColor=PRIMARY_NAVY,
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="ReportSubtitle",
                fontName="Helvetica",
                fontSize=9,
                leading=12,
                textColor=TEXT_MUTED,
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="SectionHeader",
                fontName="Helvetica-Bold",
                fontSize=11,
                leading=14,
                textColor=PRIMARY_NAVY,
                spaceBefore=10,
                spaceAfter=4,
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="BodyDark",
                fontName="Helvetica",
                fontSize=8.5,
                leading=11.5,
                textColor=TEXT_DARK,
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="BodyDarkBold",
                fontName="Helvetica-Bold",
                fontSize=8.5,
                leading=11.5,
                textColor=TEXT_DARK,
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="CitationText",
                fontName="Helvetica-Oblique",
                fontSize=7.5,
                leading=10,
                textColor=TEXT_MUTED,
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="BadgeText",
                fontName="Helvetica-Bold",
                fontSize=8,
                leading=10,
                alignment=1,  # Centered
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="DisclaimerText",
                fontName="Helvetica",
                fontSize=7.5,
                leading=10.5,
                textColor=colors.HexColor("#78350F"),  # Dark amber
            )
        )

    def generate(
        self,
        report: ComplianceReport,
        target: str | Path | BinaryIO | None = None,
    ) -> bytes | Path:
        """Render the given ComplianceReport as a formatted PDF.

        Args:
            report: The populated ComplianceReport.
            target: Path or file-like stream. If None, returns bytes in-memory.

        Returns:
            Path if output was written to file, or bytes if target was None.
        """
        is_memory = target is None
        if is_memory:
            stream: Any = io.BytesIO()
        elif isinstance(target, Path):
            stream = str(target)
        else:
            stream = target

        page_w, page_h = A4
        margin = 36.0  # 0.5 in

        doc = SimpleDocTemplate(
            stream,
            pagesize=A4,
            leftMargin=margin,
            rightMargin=margin,
            topMargin=36.0,
            bottomMargin=42.0,
        )

        story = []

        # 1. Header Banner
        story.extend(self._build_header(report, page_w - (2 * margin)))
        story.append(Spacer(1, 10))

        # 2. Executive Scorecard
        story.append(self._build_scorecard(report, page_w - (2 * margin)))
        story.append(Spacer(1, 10))

        # 3. Project Metadata Grid
        story.append(self._build_metadata_table(report, page_w - (2 * margin)))
        story.append(Spacer(1, 12))

        # 4. Detailed Statutory Findings
        story.append(Paragraph("STATUTORY COMPLIANCE EVALUATION FINDINGS", self.styles["SectionHeader"]))
        story.append(self._build_findings_table(report, page_w - (2 * margin)))
        story.append(Spacer(1, 10))

        # 5. Missing Evidence Checklist (if any)
        if report.missing_information_checklist:
            story.append(Paragraph("MISSING DRAWING EVIDENCE & INSPECTION ADVISORIES", self.styles["SectionHeader"]))
            checklist_flowables = self._build_checklist(report)
            story.extend(checklist_flowables)
            story.append(Spacer(1, 8))

        # 6. Actionable Next Steps (if any)
        if report.actionable_recommendations:
            story.append(Paragraph("ACTIONABLE REMEDIATION RECOMMENDATIONS", self.styles["SectionHeader"]))
            recs_flowables = self._build_recommendations(report)
            story.extend(recs_flowables)
            story.append(Spacer(1, 10))

        # 7. Mandatory Legal Disclaimer Callout
        story.append(self._build_disclaimer_box(report, page_w - (2 * margin)))
        story.append(Spacer(1, 12))

        # 8. Architect / Engineering Endorsement Block
        story.append(KeepTogether(self._build_endorsement_block(page_w - (2 * margin))))

        # Build Document with running two-pass footer
        doc.build(story, canvasmaker=NumberedCanvas)

        if is_memory:
            assert isinstance(stream, io.BytesIO)
            return stream.getvalue()
        if isinstance(target, (str, Path)):
            return Path(target)
        return Path(".")

    def _build_header(self, report: ComplianceReport, content_width: float) -> list:
        flowables = []

        header_data = [
            [
                Paragraph("NIRMAANTRA AI", self.styles["ReportTitle"]),
                Paragraph(
                    f"<b>REPORT ID:</b> {report.report_id}<br/>"
                    f"<b>DATE:</b> {report.generated_at.strftime('%d-%b-%Y %H:%M UTC')}",
                    ParagraphStyle(
                        name="MetaRight",
                        parent=self.styles["BodyDark"],
                        alignment=2,  # Right-aligned
                        fontSize=8,
                        leading=11,
                    ),
                ),
            ],
            [
                Paragraph(
                    "<b>BUILDING SAFETY & REGULATORY COMPLIANCE AUDIT CERTIFICATE</b><br/>"
                    "Unified Building Bye-Laws for Delhi 2016 (UBBL-2016) • Delhi Fire Service Act • NBC 2016",
                    self.styles["ReportSubtitle"],
                ),
                "",
            ],
        ]

        t = Table(header_data, colWidths=[content_width * 0.65, content_width * 0.35])
        t.setStyle(
            TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("SPAN", (0, 1), (1, 1)),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ])
        )
        flowables.append(t)
        flowables.append(Spacer(1, 6))
        flowables.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY_NAVY, spaceBefore=0, spaceAfter=4))
        return flowables

    def _build_scorecard(self, report: ComplianceReport, content_width: float) -> Table:
        """Build executive scorecard with big status badge and score percentage."""
        status_labels = {
            OverallComplianceStatus.COMPLIANT: ("COMPLIANT", colors.HexColor("#065F46"), colors.HexColor("#D1FAE5")),
            OverallComplianceStatus.NON_COMPLIANT: ("NON-COMPLIANT", colors.HexColor("#991B1B"), colors.HexColor("#FEE2E2")),
            OverallComplianceStatus.REQUIRES_REVIEW: ("REQUIRES REVIEW", colors.HexColor("#92400E"), colors.HexColor("#FEF3C7")),
        }
        status_txt, fg_color, bg_color = status_labels.get(
            report.summary.overall_status,
            ("REQUIRES REVIEW", colors.HexColor("#92400E"), colors.HexColor("#FEF3C7")),
        )

        badge_p = Paragraph(
            f"<font color='{fg_color.hexval()}'><b>{status_txt}</b></font>",
            ParagraphStyle(
                name="BigBadge",
                fontName="Helvetica-Bold",
                fontSize=14,
                leading=16,
                alignment=1,
            ),
        )

        score_p = Paragraph(
            f"<b><font size='16' color='{PRIMARY_NAVY.hexval()}'>{report.summary.compliance_score_percent}%</font></b><br/>"
            f"<font size='7' color='{TEXT_MUTED.hexval()}'>COMPLIANCE SCORE</font>",
            ParagraphStyle(name="ScoreBox", alignment=1, leading=14),
        )

        metrics_p = Paragraph(
            f"<b>Requirements Evaluated:</b> {report.summary.total_requirements_checked} &nbsp;&nbsp;|&nbsp;&nbsp; "
            f"<font color='#059669'><b>Passed:</b> {report.summary.passed_count}</font> &nbsp;&nbsp;|&nbsp;&nbsp; "
            f"<font color='#DC2626'><b>Failed:</b> {report.summary.failed_count}</font> &nbsp;&nbsp;|&nbsp;&nbsp; "
            f"<font color='#D97706'><b>Review:</b> {report.summary.needs_review_count}</font>",
            ParagraphStyle(name="MetricSummary", parent=self.styles["BodyDark"], alignment=1),
        )

        data = [
            [badge_p, score_p],
            [metrics_p, ""],
        ]

        col_w = [content_width * 0.65, content_width * 0.35]
        t = Table(data, colWidths=col_w)
        t.setStyle(
            TableStyle([
                ("SPAN", (0, 1), (1, 1)),
                ("BACKGROUND", (0, 0), (0, 0), bg_color),
                ("BACKGROUND", (1, 0), (1, 0), BG_LIGHT),
                ("BACKGROUND", (0, 1), (1, 1), BG_LIGHT),
                ("BOX", (0, 0), (-1, -1), 1, BORDER_LIGHT),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ])
        )
        return t

    def _build_metadata_table(self, report: ComplianceReport, content_width: float) -> Table:
        """Two-column key-value grid for project parameters."""
        half_w = content_width / 2.0
        label_w = half_w * 0.38
        val_w = half_w * 0.62

        data = [
            [
                Paragraph("<b>Project Title:</b>", self.styles["BodyDark"]),
                Paragraph(report.project_name, self.styles["BodyDarkBold"]),
                Paragraph("<b>Jurisdiction:</b>", self.styles["BodyDark"]),
                Paragraph(report.jurisdiction, self.styles["BodyDarkBold"]),
            ],
            [
                Paragraph("<b>Site Address:</b>", self.styles["BodyDark"]),
                Paragraph(report.location_address or "As per architectural submission", self.styles["BodyDark"]),
                Paragraph("<b>Source Document:</b>", self.styles["BodyDark"]),
                Paragraph(report.source_document or "Direct drawing specification", self.styles["BodyDark"]),
            ],
        ]

        t = Table(data, colWidths=[label_w, val_w, label_w, val_w])
        t.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), BG_LIGHT),
                ("BOX", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ])
        )
        return t

    def _build_findings_table(self, report: ComplianceReport, content_width: float) -> Table:
        """Detailed table of each evaluated statutory rule."""
        col_w = [
            content_width * 0.28,  # Rule Name & Code
            content_width * 0.12,  # Status Pill
            content_width * 0.40,  # Explanation & Physical Findings
            content_width * 0.20,  # Statutory Citation
        ]

        table_data = [
            [
                Paragraph("<b>Statutory Rule & Code</b>", ParagraphStyle(name="TH1", parent=self.styles["BodyDarkBold"], textColor=colors.white)),
                Paragraph("<b>Status</b>", ParagraphStyle(name="TH2", parent=self.styles["BodyDarkBold"], textColor=colors.white, alignment=1)),
                Paragraph("<b>Audit Findings & Evaluation</b>", ParagraphStyle(name="TH3", parent=self.styles["BodyDarkBold"], textColor=colors.white)),
                Paragraph("<b>Delhi Citation</b>", ParagraphStyle(name="TH4", parent=self.styles["BodyDarkBold"], textColor=colors.white)),
            ]
        ]

        for finding in report.findings:
            cfg = STATUS_COLORS.get(finding.status, STATUS_COLORS[RuleStatus.NEEDS_REVIEW])
            badge_html = (
                f"<font color='{cfg['text'].hexval()}'><b>{cfg['label']}</b></font>"
            )

            rule_cell = Paragraph(
                f"<b>{finding.rule_name}</b><br/>"
                f"<font size='7' color='{TEXT_MUTED.hexval()}'>{finding.rule_id}</font>",
                self.styles["BodyDark"],
            )

            status_cell = Paragraph(badge_html, self.styles["BadgeText"])

            findings_cell = Paragraph(
                finding.explanation,
                self.styles["BodyDark"],
            )

            citation_str = (
                finding.regulatory_citations[0]
                if finding.regulatory_citations
                else "Unified Building Bye-Laws for Delhi 2016"
            )
            citation_cell = Paragraph(citation_str, self.styles["CitationText"])

            table_data.append([rule_cell, status_cell, findings_cell, citation_cell])

        t = Table(table_data, colWidths=col_w, repeatRows=1)
        t_style = [
            ("BACKGROUND", (0, 0), (-1, 0), PRIMARY_NAVY),
            ("BOX", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ]

        # Alternating row background colors and badge cell background
        for idx in range(1, len(table_data)):
            bg = BG_LIGHT if idx % 2 == 1 else colors.white
            t_style.append(("BACKGROUND", (0, idx), (-1, idx), bg))
            finding_status = report.findings[idx - 1].status
            status_bg = STATUS_COLORS.get(finding_status, STATUS_COLORS[RuleStatus.NEEDS_REVIEW])["bg"]
            t_style.append(("BACKGROUND", (1, idx), (1, idx), status_bg))

        t.setStyle(TableStyle(t_style))
        return t

    def _build_checklist(self, report: ComplianceReport) -> list:
        items = []
        for chk in report.missing_information_checklist:
            p = Paragraph(
                f"• <b>Advisory:</b> {chk}",
                self.styles["BodyDark"],
            )
            items.append(p)
            items.append(Spacer(1, 2))
        return items

    def _build_recommendations(self, report: ComplianceReport) -> list:
        items = []
        for rec in report.actionable_recommendations:
            p = Paragraph(
                f"• <b>Action:</b> {rec}",
                self.styles["BodyDark"],
            )
            items.append(p)
            items.append(Spacer(1, 2))
        return items

    def _build_disclaimer_box(self, report: ComplianceReport, content_width: float) -> Table:
        """Callout box rendering the mandatory statutory disclaimer."""
        p = Paragraph(
            f"<b>MANDATORY STATUTORY & LEGAL DISCLAIMER:</b> {report.disclaimer}",
            self.styles["DisclaimerText"],
        )
        t = Table([[p]], colWidths=[content_width])
        t.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFFBEB")),  # Soft amber
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#FDE68A")),      # Amber border
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ])
        )
        return t

    def _build_endorsement_block(self, content_width: float) -> Table:
        """Official sign-off / stamp box for Registered Architect & Structural Engineer."""
        half_w = content_width / 2.0
        data = [
            [
                Paragraph("<b>PREPARED & VERIFIED BY LICENSED ARCHITECT:</b>", self.styles["BodyDarkBold"]),
                Paragraph("<b>STRUCTURAL / LIFE SAFETY ENGINEER ENDORSEMENT:</b>", self.styles["BodyDarkBold"]),
            ],
            [
                Paragraph(
                    "<br/><br/><br/>"
                    "Name: ____________________________________<br/>"
                    "COA Registration No: CA / ____________ / ______<br/>"
                    "Signature & Seal: ________________________",
                    self.styles["BodyDark"],
                ),
                Paragraph(
                    "<br/><br/><br/>"
                    "Name: ____________________________________<br/>"
                    "Empanelment / MCD Reg. No: _______________<br/>"
                    "Signature & Seal: ________________________",
                    self.styles["BodyDark"],
                ),
            ],
        ]
        t = Table(data, colWidths=[half_w, half_w])
        t.setStyle(
            TableStyle([
                ("BOX", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
                ("BACKGROUND", (0, 0), (-1, 0), BG_LIGHT),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ])
        )
        return t


def generate_compliance_pdf(
    report: ComplianceReport,
    output_path: Path | str | None = None,
) -> bytes | Path:
    """Convenience functional interface to generate compliance PDF certificates."""
    generator = PdfReportGenerator()
    return generator.generate(report, target=output_path)
