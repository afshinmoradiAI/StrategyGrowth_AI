"""PDF generation for a completed plan using reportlab."""
from __future__ import annotations

from io import BytesIO
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    HRFlowable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

BRAND_BLUE = colors.HexColor("#1d4ed8")
BRAND_BLUE_DARK = colors.HexColor("#1e3a8a")
LIGHT_GREY = colors.HexColor("#f1f5f9")
TEXT_DARK = colors.HexColor("#0f172a")


def _styles() -> dict:
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "Title", parent=base["Title"], fontSize=28, textColor=BRAND_BLUE_DARK,
            spaceAfter=12, leading=32,
        ),
        "subtitle": ParagraphStyle(
            "Subtitle", parent=base["Normal"], fontSize=11, textColor=colors.grey,
            spaceAfter=20,
        ),
        "h1": ParagraphStyle(
            "H1", parent=base["Heading1"], fontSize=18, textColor=BRAND_BLUE,
            spaceBefore=16, spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "H2", parent=base["Heading2"], fontSize=13, textColor=BRAND_BLUE_DARK,
            spaceBefore=10, spaceAfter=4, leading=15,
        ),
        "body": ParagraphStyle(
            "Body", parent=base["Normal"], fontSize=10, textColor=TEXT_DARK,
            spaceAfter=6, leading=14,
        ),
        "bullet": ParagraphStyle(
            "Bullet", parent=base["Normal"], fontSize=10, textColor=TEXT_DARK,
            leftIndent=14, bulletIndent=4, spaceAfter=2, leading=13,
        ),
        "small": ParagraphStyle(
            "Small", parent=base["Normal"], fontSize=8, textColor=colors.grey,
        ),
    }


def _bullets(items: list[str], styles: dict) -> list:
    return [Paragraph(f"• {item}", styles["bullet"]) for item in items]


def _section(title: str, styles: dict) -> list:
    return [
        Spacer(1, 0.3 * cm),
        HRFlowable(width="100%", thickness=2, color=BRAND_BLUE, spaceAfter=4),
        Paragraph(title, styles["h1"]),
    ]


def generate_plan_pdf(plan: dict[str, Any]) -> bytes:
    """Render the plan as a polished PDF, return bytes."""
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=2 * cm, rightMargin=2 * cm,
        topMargin=2 * cm, bottomMargin=2 * cm,
        title="StrategyGrowth AI — Project Plan",
    )
    styles = _styles()
    story: list = []

    brief = plan.get("brief") or {}
    research = plan.get("research") or {}
    strategy = plan.get("strategy") or {}
    roadmap = plan.get("roadmap") or {}
    risks = plan.get("risks") or {}

    # Cover
    project_name = brief.get("project_name", "Untitled Project")
    story.append(Paragraph(project_name, styles["title"]))
    if brief.get("domain"):
        story.append(Paragraph(brief["domain"].upper(), styles["subtitle"]))
    if brief.get("summary"):
        story.append(Paragraph(brief["summary"], styles["body"]))

    # Project Brief
    if brief:
        story.extend(_section("📋 Project Brief", styles))
        if brief.get("goals"):
            story.append(Paragraph("Goals", styles["h2"]))
            story.extend(_bullets(brief["goals"], styles))
        if brief.get("target_audience"):
            story.append(Paragraph("Target Audience", styles["h2"]))
            story.extend(_bullets(brief["target_audience"], styles))
        if brief.get("constraints"):
            story.append(Paragraph("Constraints", styles["h2"]))
            story.extend(_bullets(brief["constraints"], styles))
        if brief.get("success_criteria"):
            story.append(Paragraph("Success Criteria", styles["h2"]))
            story.extend(_bullets(brief["success_criteria"], styles))
        meta_rows = [
            ["Timeline", brief.get("timeline") or "—"],
            ["Budget", brief.get("budget") or "—"],
        ]
        t = Table(meta_rows, colWidths=[4 * cm, 12 * cm])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), LIGHT_GREY),
            ("TEXTCOLOR", (0, 0), (0, -1), BRAND_BLUE_DARK),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.lightgrey),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("PADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(Spacer(1, 0.3 * cm))
        story.append(t)

    # Research
    if research:
        story.append(PageBreak())
        story.extend(_section("🔍 Market Research", styles))
        if research.get("market_overview"):
            story.append(Paragraph(research["market_overview"], styles["body"]))
        if research.get("trends"):
            story.append(Paragraph("Trends", styles["h2"]))
            story.extend(_bullets(research["trends"], styles))
        if research.get("benchmarks"):
            story.append(Paragraph("Benchmarks", styles["h2"]))
            story.extend(_bullets(research["benchmarks"], styles))
        if research.get("competitors"):
            story.append(Paragraph("Competitors", styles["h2"]))
            for c in research["competitors"]:
                story.append(Paragraph(
                    f"<b>{c.get('name', '')}</b> — {c.get('description', '')}",
                    styles["body"],
                ))
                if c.get("strengths"):
                    story.append(Paragraph(
                        f"<font color='#15803d'>+ {', '.join(c['strengths'])}</font>",
                        styles["body"],
                    ))
                if c.get("weaknesses"):
                    story.append(Paragraph(
                        f"<font color='#b91c1c'>− {', '.join(c['weaknesses'])}</font>",
                        styles["body"],
                    ))

    # Strategy
    if strategy:
        story.append(PageBreak())
        story.extend(_section("📊 Go-To-Market Strategy", styles))
        if strategy.get("positioning"):
            story.append(Paragraph(
                f"<i>{strategy['positioning']}</i>", styles["body"],
            ))
        if strategy.get("value_propositions"):
            story.append(Paragraph("Value Propositions", styles["h2"]))
            story.extend(_bullets(strategy["value_propositions"], styles))
        if strategy.get("differentiators"):
            story.append(Paragraph("Differentiators", styles["h2"]))
            story.extend(_bullets(strategy["differentiators"], styles))
        if strategy.get("objectives"):
            story.append(Paragraph("Objectives", styles["h2"]))
            for o in strategy["objectives"]:
                story.append(Paragraph(
                    f"<b>{o.get('objective', '')}</b><br/>{o.get('rationale', '')}",
                    styles["body"],
                ))

    # Roadmap
    if roadmap:
        story.append(PageBreak())
        story.extend(_section("🗺️ Project Roadmap", styles))
        for i, p in enumerate(roadmap.get("phases", []), start=1):
            story.append(Paragraph(
                f"<b>Phase {i}: {p.get('name', '')}</b> "
                f"<font color='grey'>({p.get('duration', '')})</font>",
                styles["h2"],
            ))
            if p.get("objective"):
                story.append(Paragraph(p["objective"], styles["body"]))
            for m in p.get("milestones", []):
                story.append(Paragraph(
                    f"<b>{m.get('title', '')}</b> — {m.get('target', '')}",
                    styles["body"],
                ))
                for t in m.get("tasks", []):
                    est = f" ({t['estimate']})" if t.get("estimate") else ""
                    story.append(Paragraph(
                        f"• <b>{t.get('title', '')}</b>{est}: {t.get('description', '')}",
                        styles["bullet"],
                    ))
        if roadmap.get("kpis"):
            story.append(Paragraph("Key Performance Indicators", styles["h2"]))
            rows = [["Metric", "Target", "Measurement"]] + [
                [k.get("name", ""), k.get("target", ""), k.get("measurement", "")]
                for k in roadmap["kpis"]
            ]
            t = Table(rows, colWidths=[5 * cm, 4 * cm, 7 * cm])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), BRAND_BLUE),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.lightgrey),
                ("PADDING", (0, 0), (-1, -1), 6),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]))
            story.append(t)

    # Risks
    if risks:
        story.append(PageBreak())
        story.extend(_section("⚠️ Risk Register", styles))
        for r in risks.get("risks", []):
            story.append(Paragraph(
                f"<b>{r.get('id', '')}</b> — {r.get('description', '')}",
                styles["h2"],
            ))
            story.append(Paragraph(
                f"<b>Category:</b> {r.get('category', '')} | "
                f"<b>Likelihood:</b> {r.get('likelihood', '')} | "
                f"<b>Impact:</b> {r.get('impact', '')}",
                styles["body"],
            ))
            story.append(Paragraph(
                f"<b>Mitigation:</b> {r.get('mitigation', '')}",
                styles["body"],
            ))

    # Footer
    story.append(Spacer(1, 1 * cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.lightgrey))
    story.append(Paragraph(
        "Generated by StrategyGrowth AI — powered by Claude AI",
        styles["small"],
    ))

    doc.build(story)
    pdf = buf.getvalue()
    buf.close()
    return pdf
