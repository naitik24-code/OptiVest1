import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas
import pypdf

# Primary Color Palette (Deep Executive Navy, Slate, Teal Accent, Warm Neutral)
PRIMARY = colors.HexColor("#0F172A")    # Deep Slate / Navy
SECONDARY = colors.HexColor("#1E3A8A")  # Royal Navy
ACCENT = colors.HexColor("#0284C7")     # Active Ocean Blue
ACCENT_GREEN = colors.HexColor("#0D9488") # Teal / Emerald
TEXT_DARK = colors.HexColor("#1E293B")  # Charcoal Text
TEXT_MUTED = colors.HexColor("#64748B") # Muted Gray Text
BG_LIGHT = colors.HexColor("#F8FAFC")   # Cool Off-White
BORDER_COLOR = colors.HexColor("#E2E8F0")# Subtle Border Gray
WHITE = colors.HexColor("#FFFFFF")
CARD_BG = colors.HexColor("#F1F5F9")

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and stamp exact total page counts,
    running headers, and running footers on all pages except the cover page.
    """
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            # Suppress headers/footers on Cover Page
            return

        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(SECONDARY)
        self.drawString(54, 752, "OPTIVEST AI")
        
        self.setFont("Helvetica", 8)
        self.setFillColor(TEXT_MUTED)
        self.drawString(116, 752, "— Explainable AI Portfolio Management Platform")
        
        # Header rule
        self.setStrokeColor(BORDER_COLOR)
        self.setLineWidth(0.75)
        self.line(54, 744, 558, 744)

        # Footer rule
        self.setStrokeColor(BORDER_COLOR)
        self.setLineWidth(0.75)
        self.line(54, 42, 558, 42)

        # Footer text
        self.setFont("Helvetica", 8)
        self.setFillColor(TEXT_MUTED)
        self.drawString(54, 30, "Academic Project Technical Report | Chandigarh University")
        
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 30, page_str)
        self.restoreState()


def build_pdf(filename="OptiVest_AI_Project_Report.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=28,
        leading=34,
        textColor=PRIMARY,
        alignment=0,
        spaceAfter=10
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=18,
        textColor=SECONDARY,
        alignment=0,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'PageH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=17,
        leading=21,
        textColor=PRIMARY,
        spaceAfter=4
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=SECONDARY,
        spaceBefore=7,
        spaceAfter=3
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.8,
        textColor=TEXT_DARK,
        spaceAfter=5
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.2,
        leading=11.2,
        textColor=TEXT_DARK,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=2.5
    )

    caption_style = ParagraphStyle(
        'ImgCaption',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=7.5,
        leading=10,
        textColor=TEXT_MUTED,
        alignment=1,
        spaceBefore=2,
        spaceAfter=4
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=WHITE,
        alignment=1
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.2,
        leading=9.2,
        textColor=TEXT_DARK,
        alignment=1
    )

    table_cell_left = ParagraphStyle(
        'TableCellLeft',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.2,
        leading=9.2,
        textColor=TEXT_DARK,
        alignment=0
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.2,
        leading=9.2,
        textColor=TEXT_DARK,
        alignment=1
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.0,
        leading=11.0,
        textColor=PRIMARY
    )

    def create_callout(text, bg=CARD_BG, border=ACCENT):
        p = Paragraph(f"<b>Key Insight:</b> {text}", callout_style)
        t = Table([[p]], colWidths=[504])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg),
            ('BOX', (0,0), (-1,-1), 1, border),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        return t

    story = []

    # =========================================================================
    # PAGE 1: COVER PAGE
    # =========================================================================
    story.append(Spacer(1, 10))
    # Institution Badge
    inst_table = Table([[
        Paragraph("<font color='#0284C7'><b>CHANDIGARH UNIVERSITY</b></font> &nbsp;|&nbsp; DEPARTMENT OF AITCSE", 
                  ParagraphStyle('Inst', fontName='Helvetica-Bold', fontSize=9, textColor=TEXT_MUTED))
    ]], colWidths=[504])
    inst_table.setStyle(TableStyle([
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LINEBELOW', (0,0), (-1,-1), 1.5, ACCENT)
    ]))
    story.append(inst_table)
    story.append(Spacer(1, 14))

    # Official OptiVest Brand Logo
    logo_path = "figures/optivest_logo.jpg"
    if os.path.exists(logo_path):
        story.append(Image(logo_path, width=175, height=52))
        story.append(Spacer(1, 10))

    story.append(Paragraph("OptiVest AI", title_style))
    story.append(Paragraph("An Explainable AI-Driven Autonomous Wealth Management Platform with Intelligent Portfolio Reallocation", subtitle_style))
    
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceBefore=0, spaceAfter=14))

    abstract_text = (
        "<b>Executive Summary:</b> Modern retail wealth management and quantitative trading face two fundamental hurdles: "
        "the <i>Prediction Fallacy</i> (treating raw asset price forecasts as execution commands while ignoring risk, covariance, "
        "and transaction costs) and the <i>Black-Box Dilemma</i> (opaque machine learning models outputting recommendations "
        "without auditable justification). <b>OptiVest AI</b> resolves both challenges through an integrated institutional pipeline "
        "combining deterministic multi-factor Candidate Discovery (CDE), a canonical convex quadratic Adaptive Portfolio "
        "Decision Engine (APDE) solved via CVXPY/SCS under hard turnover and concentration bounds, and TreeSHAP explainability "
        "coupled with an exact mathematical Decision Score ($DS_i$)."
    )
    story.append(Paragraph(abstract_text, body_style))
    story.append(Spacer(1, 20))

    # Project Details Grid
    details_data = [
        [Paragraph("<b>Project Category:</b>", body_style), Paragraph("Algorithmic Trading & AI-Powered FinTech System", body_style)],
        [Paragraph("<b>Core Stack:</b>", body_style), Paragraph("Python 3.14+, FastAPI, React 18, TypeScript, Tailwind CSS, SQLite/PostgreSQL", body_style)],
        [Paragraph("<b>Quantitative Stack:</b>", body_style), Paragraph("CVXPY (SCS Conic Solver), XGBoost, scikit-learn, SHAP (TreeSHAP), Pandas", body_style)],
        [Paragraph("<b>Walk-Forward Sample:</b>", body_style), Paragraph("N = 50 Large-Cap Equities | 78 Monthly Rebalances (2017–2023) | Out-of-sample", body_style)],
        [Paragraph("<b>Authors & Contributors:</b>", body_style), Paragraph("Naitik Pathak, Aditi, Palak Jain, Aryan Rana, Divya, Yogiraj Bhale", body_style)],
        [Paragraph("<b>Project Repository:</b>", body_style), Paragraph("OptiVest AI Core Engine (Local Deployment & Research Workspace)", body_style)]
    ]
    t_details = Table(details_data, colWidths=[130, 374])
    t_details.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_details)
    
    story.append(Spacer(1, 35))
    story.append(create_callout(
        "OptiVest AI bridges active quantitative portfolio optimization with strict temporal discipline and auditability. "
        "This report provides an end-to-end technical breakdown of the system architecture, mathematical formulations, "
        "empirical benchmark results, and software implementation.",
        bg=CARD_BG, border=SECONDARY
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: PROJECT INTRODUCTION
    # =========================================================================
    story.append(Paragraph("1. Project Introduction", h1_style))
    story.append(Paragraph("Background, Motivation, Core Objectives, and Solution Overview", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=SECONDARY, spaceBefore=0, spaceAfter=10))

    story.append(Paragraph("1.1 The Industry Problem", h2_style))
    story.append(Paragraph(
        "Quantitative wealth management systems in retail and regulated environments face two severe, interconnected bottlenecks:",
        body_style
    ))
    story.append(Paragraph(
        "• <b>The Prediction Fallacy:</b> Over-indexing on forecast accuracy as the sole driver of investment decisions. "
        "A model that accurately predicts a 3% price rise for a stock is practically unviable if buying it over-concentrates the portfolio, "
        "violates client risk tolerance, or generates turnover whose transaction friction entirely consumes the expected gain.",
        bullet_style
    ))
    story.append(Paragraph(
        "• <b>The Black-Box Dilemma:</b> High-capacity machine learning models (gradient-boosted trees, deep networks) recommend reallocations "
        "without transparent justification. Fiduciaries and retail clients cannot accept portfolio changes without human-auditable rationales.",
        bullet_style
    ))
    story.append(Paragraph(
        "• <b>The Degenerate Cash-Lock Trap:</b> Optimizers restricted strictly to existing holdings can only sell down or hold, causing portfolios "
        "in drawdown regimes to degenerate into 100% cash with no mathematical mechanism to discover and onboard new assets.",
        bullet_style
    ))

    story.append(Paragraph("1.2 Project Objectives", h2_style))
    story.append(Paragraph(
        "The OptiVest AI platform was engineered to achieve five explicit engineering and quantitative goals:",
        body_style
    ))
    story.append(Paragraph("1. <b>Separate Prediction from Allocation:</b> Treat return forecasts as noisy utility inputs rather than absolute trading commands.", bullet_style))
    story.append(Paragraph("2. <b>Dynamic Candidate Discovery (CDE):</b> Implement a multi-factor screening layer to identify fundamentally sound entry candidates.", bullet_style))
    story.append(Paragraph("3. <b>Constrained Quadratic Programming (APDE):</b> Directly optimize target portfolio weights under single-asset caps (20%) and hard $\\ell_1$ turnover caps (15%).", bullet_style))
    story.append(Paragraph("4. <b>Native Mathematical Explainability:</b> Pair TreeSHAP feature attributions with a mathematically rigorous Decision Score ($DS_i$).", bullet_style))
    story.append(Paragraph("5. <b>Enterprise-Grade Production Platform:</b> Deliver a full-stack SaaS platform with real-time autonomous job scheduling and paper-trading simulation.", bullet_style))

    story.append(Paragraph("1.3 Paradigm Comparison", h2_style))
    story.append(Paragraph(
        "Table 1 contrasts OptiVest AI against conventional quantitative and machine learning paradigms.",
        body_style
    ))

    comp_headers = [Paragraph("<b>Framework</b>", table_header_style), Paragraph("<b>Non-lin. Forecast</b>", table_header_style), 
                    Paragraph("<b>Cash-Heavy Allocation</b>", table_header_style), Paragraph("<b>Turnover & Risk Constr.</b>", table_header_style), 
                    Paragraph("<b>Auditable XAI</b>", table_header_style)]
    comp_rows = [
        [Paragraph("Classical MPT (Markowitz)", table_cell_left), Paragraph("No", table_cell_style), Paragraph("Infeasible (needs $\\ge 2$ assets)", table_cell_style), Paragraph("Partial (no turnover cap)", table_cell_style), Paragraph("Yes (Linear)", table_cell_style)],
        [Paragraph("Black-Litterman", table_cell_left), Paragraph("No", table_cell_style), Paragraph("Infeasible", table_cell_style), Paragraph("Partial", table_cell_style), Paragraph("Yes (Linear)", table_cell_style)],
        [Paragraph("ML Alpha Forecasting", table_cell_left), Paragraph("Yes (Trees/NN)", table_cell_style), Paragraph("No (Ignores cash)", table_cell_style), Paragraph("No (Raw forecasts)", table_cell_style), Paragraph("Partial (Global)", table_cell_style)],
        [Paragraph("Deep Reinforcement Learning", table_cell_left), Paragraph("Yes", table_cell_style), Paragraph("Partial", table_cell_style), Paragraph("Partial (Penalty soft)", table_cell_style), Paragraph("No (Opaque)", table_cell_style)],
        [Paragraph("<b>OptiVest AI (This Work)</b>", table_cell_left), Paragraph("<b>Yes (XGBoost)</b>", table_cell_bold), Paragraph("<b>Yes (via CDE Engine)</b>", table_cell_bold), Paragraph("<b>Yes (Hard $\\ell_1$ & Asset Caps)</b>", table_cell_bold), Paragraph("<b>Yes (TreeSHAP + $DS_i$)</b>", table_cell_bold)]
    ]
    t_comp = Table([comp_headers] + comp_rows, colWidths=[124, 75, 115, 110, 80])
    t_comp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SECONDARY),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
    ]))
    story.append(t_comp)
    story.append(Paragraph("<b>Table 1:</b> Architectural comparison of portfolio management frameworks.", caption_style))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 3: SYSTEM ARCHITECTURE
    # =========================================================================
    story.append(Paragraph("2. System Architecture", h1_style))
    story.append(Paragraph("Tiered Architecture, Service Interactions, and Component Topology", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=SECONDARY, spaceBefore=0, spaceAfter=8))

    story.append(Paragraph(
        "OptiVest AI is architected as an institutional-grade, multi-tier software system separating front-end interaction, "
        "API orchestration, quantitative optimization, and persistence.",
        body_style
    ))

    arch_img_path = "figures/output/fig01_system_architecture.png"
    if os.path.exists(arch_img_path):
        story.append(Image(arch_img_path, width=490, height=195))
        story.append(Paragraph("<b>Figure 1:</b> High-level OptiVest AI layered platform topology.", caption_style))

    story.append(Paragraph("2.1 Layer Breakdown", h2_style))
    story.append(Paragraph(
        "• <b>Presentation Layer (React 18 + TypeScript + Vite):</b> A feature-first SPA with Tailwind CSS, Lucide icons, and Recharts. "
        "Delivers dedicated investor workspaces (portfolio summary, trade execution, candidate exploration) and a Founder Command Center "
        "for real-time scheduler supervision and multi-model performance tracking.",
        bullet_style
    ))
    story.append(Paragraph(
        "• <b>API Gateway & Service Layer (FastAPI 0.115+):</b> Asynchronous REST backend structuring business logic across modular routers "
        "(`/auth`, `/portfolios`, `/apde`, `/assets`, `/autonomous`). Handles JWT authentication, correlation-ID request tracing, and CORS security.",
        bullet_style
    ))
    story.append(Paragraph(
        "• <b>Core Quantitative & Optimization Engine:</b> Houses the Candidate Discovery Engine (CDE) for deterministic ranking, "
        "the Adaptive Portfolio Decision Engine (APDE) built on CVXPY 1.6+ using the Splitting Conic Solver (SCS), and TreeSHAP explainability.",
        bullet_style
    ))
    story.append(Paragraph(
        "• <b>Autonomous Background Worker:</b> APScheduler-driven engine managing market regime classification, model health drift checks, "
        "and periodic prediction refreshes, streaming state changes to connected frontends via WebSockets.",
        bullet_style
    ))
    story.append(Paragraph(
        "• <b>Persistence Tier:</b> SQLAlchemy 2.0 ORM with PostgreSQL 16 compatibility in staging/production and zero-config SQLite "
        "fallback (`optivest_dev.db`) in local developer workstations.",
        bullet_style
    ))

    story.append(Paragraph("2.2 Inter-Service Communication Flow", h2_style))
    story.append(Paragraph(
        "The frontend communicates with FastAPI endpoints over JSON envelopes (`ResponseEnvelope[T]`). When an investor requests portfolio rebalancing, "
        "the API securely extracts current holdings, queries CDE for top-ranked market candidates, constructs the covariance matrix $\\Sigma_h$ from "
        "trailing prices, and invokes the APDE conic solver. Real-time background events broadcast over `/api/v1/autonomous/ws` to live-update UI dashboards.",
        body_style
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 4: COMPLETE PROJECT WORKFLOW
    # =========================================================================
    story.append(Paragraph("3. Complete Project Workflow", h1_style))
    story.append(Paragraph("End-to-End Operational Pipeline: From Raw Market Ingestion to Rebalancing Execution", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=SECONDARY, spaceBefore=0, spaceAfter=8))

    story.append(Paragraph(
        "OptiVest AI executes a four-phase sequential pipeline every rebalance cycle, enforcing strict data hygiene and operational controls.",
        body_style
    ))

    # Flowchart visual using structured Table
    wf_nodes = [
        [Paragraph("<b>Phase 1: Ingestion & Purging</b>", table_header_style), Paragraph("<b>Phase 2: Alpha & Candidate Discovery</b>", table_header_style), 
         Paragraph("<b>Phase 3: APDE Conic Optimization</b>", table_header_style), Paragraph("<b>Phase 4: Audit & Paper Trade</b>", table_header_style)],
        [
            Paragraph("• Download daily prices via yfinance.<br/>• Filter 50 liquid S&P 500 stocks.<br/>• 21-day embargo (purge) to prevent lookahead leak.", table_cell_left),
            Paragraph("• XGBoost forecasts 21-day return $\\hat{r}_i$.<br/>• CDE scores global assets on 5 factors.<br/>• Shortlist top $k$ candidates for feasible entry.", table_cell_left),
            Paragraph("• Compute empirical covariance $\\Sigma_h$.<br/>• Formulate QP in CVXPY.<br/>• SCS solver applies 15% turnover & 20% position caps.", table_cell_left),
            Paragraph("• Compute TreeSHAP attributions.<br/>• Calculate Decision Score $DS_i$.<br/>• Display narrative card; update paper trading ledger.", table_cell_left)
        ]
    ]
    t_wf = Table(wf_nodes, colWidths=[126, 126, 126, 126])
    t_wf.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('BACKGROUND', (0,1), (-1,1), BG_LIGHT),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_wf)
    story.append(Paragraph("<b>Figure 2:</b> OptiVest AI four-phase project operational workflow.", caption_style))
    story.append(Spacer(1, 4))

    story.append(Paragraph("3.1 Detailed Step-by-Step Execution Flow", h2_style))
    story.append(Paragraph(
        "1. <b>Temporal Ingestion:</b> On every monthly decision date $t$, the system queries adjusted prices and live fundamentals. "
        "In the walk-forward validation framework, a 21-trading-day purge window separates training targets from date $t$, ensuring zero lookahead bias.",
        bullet_style
    ))
    story.append(Paragraph(
        "2. <b>Candidate Pre-Filtering:</b> Existing holdings are merged with external discovery candidates from CDE. Non-held assets survive "
        "three hard checks: actively trading, minimum 10-day history, and non-duplicate ticker.",
        bullet_style
    ))
    story.append(Paragraph(
        "3. <b>Multi-Factor Scoring:</b> Eligible external candidates receive a scalar score $S_i(\\tau_{\\text{CDE}})$. High-scoring assets join the optimization universe.",
        bullet_style
    ))
    story.append(Paragraph(
        "4. <b>Conic Optimization (APDE):</b> CVXPY sets up the utility maximization problem. The first-order operator-splitting SCS solver solves "
        "the exact split-variable $L_1$ turnover bounded program in under 10 milliseconds.",
        bullet_style
    ))
    story.append(Paragraph(
        "5. <b>Audit Trail & Paper Fill:</b> Once optimal weights $w^*$ are resolved, TreeSHAP decomposes the forecast into feature contributions. "
        "The mathematical Decision Score ($DS_i$) is calculated, generating an auditable Decision Card before updating user paper positions.",
        bullet_style
    ))

    # Existing split visual
    split_img_path = "figures/output/fig03_data_split.png"
    if os.path.exists(split_img_path):
        story.append(Image(split_img_path, width=490, height=130))
        story.append(Paragraph("<b>Figure 3:</b> Walk-forward evaluation split with trailing 4-year training and 21-day purge window.", caption_style))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 5: DATA AND MACHINE LEARNING
    # =========================================================================
    story.append(Paragraph("4. Data and Machine Learning", h1_style))
    story.append(Paragraph("Dataset Architecture, Walk-Forward Protocol, XGBoost Model, and Empirical Metrics", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=SECONDARY, spaceBefore=0, spaceAfter=8))

    story.append(Paragraph("4.1 Dataset & Feature Engineering", h2_style))
    story.append(Paragraph(
        "The historical evaluation uses daily adjusted prices for $N = 50$ liquid large-cap U.S. equities over 2013–2023 obtained via yfinance. "
        "The model predicts the raw forward simple return $r_{i,t+21}$ over a 21-trading-day horizon ($h = 21$). Five features are computed at date $t$:",
        body_style
    ))
    story.append(Paragraph("• <b>Momentum Signals:</b> Cumulative price returns over 21 days (`mom_1m`), 42 days (`mom_2m`), and 63 days (`mom_3m`).", bullet_style))
    story.append(Paragraph("• <b>Realized Volatility:</b> Trailing 21-day standard deviation of daily returns (`vol_1m`).", bullet_style))
    story.append(Paragraph("• <b>Macro Proxy:</b> Raw closing level of the CBOE Volatility Index (`vix`).", bullet_style))

    story.append(Paragraph("4.2 Walk-Forward Temporal Discipline", h2_style))
    story.append(Paragraph(
        "To prevent lookahead bias and overfitting, evaluation is structured as a rolling walk-forward backtest over 78 monthly rebalances "
        "(2017-06-05 to 2023-11-06). At each rebalance date, the forecaster refits strictly on trailing 4 years of data excluding the 21-day purge window. "
        "Features are raw (un-standardized); only the training target is winsorized at the 1st and 99th percentiles.",
        body_style
    ))

    story.append(Paragraph("4.3 Reported Forecasting Performance (Table III of Research Paper)", h2_style))
    story.append(Paragraph(
        "Table 2 reports out-of-sample forecast accuracy against benchmark models across all 78 rebalance dates.",
        body_style
    ))

    f_headers = [Paragraph("<b>Model</b>", table_header_style), Paragraph("<b>RMSE</b>", table_header_style), 
                 Paragraph("<b>MAE</b>", table_header_style), Paragraph("<b>Directional Acc.</b>", table_header_style), 
                 Paragraph("<b>Rank IC (t-stat)</b>", table_header_style), Paragraph("<b>Out-of-Sample $R^2$</b>", table_header_style)]
    f_rows = [
        [Paragraph("Linear Regression (OLS)", table_cell_left), Paragraph("0.0832", table_cell_style), Paragraph("0.0590", table_cell_style), Paragraph("56.08%", table_cell_style), Paragraph("-0.033 (-1.17)", table_cell_style), Paragraph("+1.1%", table_cell_style)],
        [Paragraph("Random Forest", table_cell_left), Paragraph("0.0845", table_cell_style), Paragraph("0.0595", table_cell_style), Paragraph("57.49%", table_cell_style), Paragraph("+0.030 (+1.34)", table_cell_style), Paragraph("-2.1%", table_cell_style)],
        [Paragraph("<b>XGBoost (OptiVest Forecaster)</b>", table_cell_left), Paragraph("<b>0.0845</b>", table_cell_bold), Paragraph("<b>0.0598</b>", table_cell_bold), Paragraph("<b>56.28%</b>", table_cell_bold), Paragraph("<b>+0.008 (+0.34)</b>", table_cell_bold), Paragraph("<b>-2.1%</b>", table_cell_bold)],
        [Paragraph("Zero Forecast Benchmark", table_cell_left), Paragraph("0.0836", table_cell_style), Paragraph("—", table_cell_style), Paragraph("—", table_cell_style), Paragraph("—", table_cell_style), Paragraph("0.0%", table_cell_style)],
        [Paragraph("Trailing Mean Benchmark", table_cell_left), Paragraph("0.0828", table_cell_style), Paragraph("—", table_cell_style), Paragraph("—", table_cell_style), Paragraph("—", table_cell_style), Paragraph("+1.9%", table_cell_style)],
        [Paragraph("Always 'Up' Baseline", table_cell_left), Paragraph("—", table_cell_style), Paragraph("—", table_cell_style), Paragraph("58.21%", table_cell_style), Paragraph("—", table_cell_style), Paragraph("—", table_cell_style)],
    ]
    t_f = Table([f_headers] + f_rows, colWidths=[144, 60, 60, 80, 85, 75])
    t_f.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SECONDARY),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
    ]))
    story.append(t_f)
    story.append(Paragraph("<b>Table 2:</b> Out-of-sample forecast accuracy over 78 monthly rebalances (Source: results_v7/Forecast_Metrics.csv).", caption_style))
    story.append(Spacer(1, 4))

    story.append(create_callout(
        "<b>Critical Scientific Finding:</b> XGBoost exhibits no detectable forecasting skill in this sample (Rank IC = +0.008, t = 0.34; "
        "R² = -2.1%). Directional accuracy (56.28%) is below the random upward base rate (58.21%). OptiVest AI explicitly acknowledges this "
        "reality: XGBoost is retained for its exact TreeSHAP polynomial-time tractability, and downstream APDE constraints are designed "
        "to shield portfolios from forecast noise.",
        bg=CARD_BG, border=ACCENT
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 6: CDE AND APDE MODULES
    # =========================================================================
    story.append(Paragraph("5. CDE and APDE Modules", h1_style))
    story.append(Paragraph("Candidate Screening, Multi-Factor Scoring, and Quadratic Programming Allocation", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=SECONDARY, spaceBefore=0, spaceAfter=8))

    story.append(Paragraph("5.1 Candidate Discovery Engine (CDE)", h2_style))
    story.append(Paragraph(
        "The CDE prevents the 'cash-lock' failure mode where a portfolio holding mostly cash cannot enter new positions. "
        "Eligible non-held stocks receive a deterministic composite score based on client risk tolerance $\\tau_{\\text{CDE}} \\in \\{1, \\dots, 5\\}$:",
        body_style
    ))
    story.append(Paragraph(
        "$$S_i(\\tau_{\\text{CDE}}) = \\omega_R f_i^R + \\omega_V f_i^V + \\omega_D f_i^D + \\omega_Q f_i^Q + \\omega_M f_i^M$$",
        body_style
    ))
    story.append(Paragraph(
        "• $f^R$: Expected return factor $\\text{clip}(\\hat{r}_i / 0.5)$ | $f^V$: Inverted volatility $\\text{clip}(1 - \\hat{\\sigma}_i / 0.5)$<br/>"
        "• $f^D$: Holdings correlation $\\text{clip}((1 - \\bar{\\rho}_{i,P})/2)$ | $f^M$: 90-day momentum $\\text{clip}((m_i + 0.2)/0.4)$<br/>"
        "• $f^Q$: Fundamental composite (ROE, operating margin, debt-to-equity, free cash flow yield).",
        bullet_style
    ))
    story.append(Paragraph(
        "At $\\tau_{\\text{CDE}} = 1$ (conservative), volatility and diversification dominate ($\\omega_V = 0.45, \\omega_D = 0.30$). "
        "At $\\tau_{\\text{CDE}} = 5$ (aggressive), return and momentum dominate ($\\omega_R = 0.45, \\omega_M = 0.25$).",
        body_style
    ))

    story.append(Paragraph("5.2 Adaptive Portfolio Decision Engine (APDE)", h2_style))
    story.append(Paragraph(
        "The APDE formulates portfolio allocation as a convex quadratic program maximizing risk-adjusted return net of turnover penalties:",
        body_style
    ))
    story.append(Paragraph(
        "$$\\max_{w} \\quad U(w) = w^\\top \\hat{r} - \\tau w^\\top \\Sigma_h w - \\gamma \\|w - w_0\\|_1$$",
        body_style
    ))
    story.append(Paragraph(
        "Subject to the canonical institutional constraint set:<br/>"
        "1. <b>Fully Invested:</b> $\\sum_{i=1}^N w_i = 1$ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"
        "2. <b>Long-Only:</b> $w_i \\ge 0 \\quad \\forall i$<br/>"
        "3. <b>Single-Asset Cap:</b> $w_i \\le 0.20 \\quad \\forall i$ (max 20% capital in any single stock)<br/>"
        "4. <b>Hard Turnover Limit:</b> $\\|w - w_0\\|_1 \\le 0.15$ (max 15% portfolio turnover per monthly rebalance)",
        bullet_style
    ))
    story.append(Paragraph(
        "Here, $\\hat{r}$ is the 21-day forecast, $\\Sigma_h$ is the empirical covariance of 21-day returns (scaled from 252 trading days), "
        "$\\tau > 0$ is the risk-aversion parameter (fixed at $\\tau = 3$ in research; dynamically mapped 0.5–5.0 in production), "
        "and $\\gamma = 0.0010$ (10 bps) is the transaction cost penalty.",
        body_style
    ))

    apde_img_path = "figures/output/fig07_apde_architecture.png"
    if os.path.exists(apde_img_path):
        story.append(Image(apde_img_path, width=490, height=140))
        story.append(Paragraph("<b>Figure 4:</b> APDE optimization architecture and constraint formulation.", caption_style))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 7: RISK MANAGEMENT AND EXPLAINABILITY
    # =========================================================================
    story.append(Paragraph("6. Risk Management and Explainability", h1_style))
    story.append(Paragraph("Turnover Guardrails, Conic Solvers, TreeSHAP Attribution, and Decision Scores", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=SECONDARY, spaceBefore=0, spaceAfter=8))

    story.append(Paragraph("6.1 Risk Guardrails & The Turnover Cap", h2_style))
    story.append(Paragraph(
        "In active ML trading, models frequently trigger high portfolio churn. APDE enforces a <b>hard 15% $\\ell_1$ turnover cap</b>. "
        "Because this cap binds at every monthly rebalance, realized annual turnover is capped at $0.15 \\times 12 = 180\\%$ by construction. "
        "This mechanical regularization dampens portfolio volatility from 19.6% to 14.3% and reduces maximum drawdown from 32.6% to 19.1%.",
        body_style
    ))

    story.append(Paragraph("6.2 Conic Solver Formulation vs. SLSQP Non-Convergence", h2_style))
    story.append(Paragraph(
        "The non-smooth $\\|w - w_0\\|_1$ term is linearized via variable splitting: $w - w_0 = u - v$ with $u, v \\ge 0$, solved using "
        "the first-order <b>Splitting Conic Solver (SCS)</b> in CVXPY. Benchmark tests demonstrate that standard non-linear solvers (SciPy SLSQP) "
        "fail to converge on $\\ell_1$ turnover constraints (exceeding caps by up to 0.0674 at $N=100$), whereas SCS solves to exact tolerance "
        "($\\text{violation} < 10^{-15}$) in under 10 ms at $N = 50$.",
        body_style
    ))

    story.append(Paragraph("6.3 TreeSHAP Feature Decomposition", h2_style))
    story.append(Paragraph(
        "TreeSHAP provides exact local feature attribution for tree ensembles in polynomial time. For every stock $i$:",
        body_style
    ))
    story.append(Paragraph(
        "$$\\hat{r}_i = \\phi_0 + \\sum_{j=1}^m \\phi_{ij}$$",
        body_style
    ))
    story.append(Paragraph(
        "where $\\phi_0$ is the base expected return across the training distribution, and $\\phi_{ij}$ is the marginal additive contribution "
        "of feature $j$ (`mom_1m`, `mom_2m`, `mom_3m`, `vol_1m`, `vix`). Numerical verification in the project environment confirms exact reconstruction "
        "($|\\hat{r}_i - (\\phi_0 + \\sum_j \\phi_{ij})| = 2.33 \\times 10^{-9} < 10^{-6}$).",
        body_style
    ))

    story.append(Paragraph("6.4 The Mathematical Decision Score ($DS_i$)", h2_style))
    story.append(Paragraph(
        "Attributions explain the model's return prediction, but not why the optimizer executed a specific trade. OptiVest AI introduces the "
        "<b>Decision Score ($DS_i$)</b>, representing the exact marginal utility of asset $i$'s weight under Eq. (4):",
        body_style
    ))
    story.append(Paragraph(
        "$$DS_i = \\underbrace{\\hat{r}_i}_{\\text{Forecast Term}} - \\underbrace{2\\tau (\\Sigma_h w)_i}_{\\text{Marginal Risk Penalty}} - \\underbrace{\\gamma \\operatorname{sgn}(w_i - w_{0,i})}_{\\text{Transaction Friction}}$$",
        body_style
    ))
    story.append(Paragraph(
        "By substituting the TreeSHAP decomposition into $\\hat{r}_i$, every portfolio trade is explained by its underlying market features, "
        "its marginal contribution to portfolio covariance risk, and execution friction, eliminating the black-box dilemma.",
        body_style
    ))

    dec_img_path = "figures/output/fig10_decision_score.png"
    if os.path.exists(dec_img_path):
        story.append(Image(dec_img_path, width=490, height=135))
        story.append(Paragraph("<b>Figure 5:</b> Decision Score decomposition combining TreeSHAP alpha, marginal covariance risk, and cost.", caption_style))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 8: EXPERIMENTS AND RESULTS
    # =========================================================================
    story.append(Paragraph("7. Experiments and Results", h1_style))
    story.append(Paragraph("Master 10-Arm Evaluation, Turnover Cap Sweeps, and CDE Ablation Rerun", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=SECONDARY, spaceBefore=0, spaceAfter=8))

    story.append(Paragraph("7.1 Primary 10-Arm Backtest Results (Table IV of Research Paper)", h2_style))
    story.append(Paragraph(
        "Table 3 presents net-of-cost performance across 78 monthly rebalances (June 2017 – November 2023) at 10 bps per side transaction costs.",
        body_style
    ))

    p_headers = [Paragraph("<b>Arm</b>", table_header_style), Paragraph("<b>CAGR</b>", table_header_style), 
                 Paragraph("<b>Ann. Vol</b>", table_header_style), Paragraph("<b>Sharpe</b>", table_header_style), 
                 Paragraph("<b>Sortino</b>", table_header_style), Paragraph("<b>Max DD</b>", table_header_style), 
                 Paragraph("<b>Ann. Turnover</b>", table_header_style), Paragraph("<b>$\\Delta$Sharpe vs EW</b>", table_header_style)]
    p_rows = [
        [Paragraph("EW (monthly 1/N)", table_cell_left), Paragraph("14.83%", table_cell_style), Paragraph("14.73%", table_cell_style), Paragraph("1.02", table_cell_bold), Paragraph("1.74", table_cell_style), Paragraph("17.76%", table_cell_style), Paragraph("57.8%", table_cell_style), Paragraph("—", table_cell_style)],
        [Paragraph("EW Buy-and-Hold", table_cell_left), Paragraph("15.03%", table_cell_style), Paragraph("16.74%", table_cell_style), Paragraph("0.92", table_cell_style), Paragraph("1.54", table_cell_style), Paragraph("23.58%", table_cell_style), Paragraph("0.0%", table_cell_style), Paragraph("[-0.36, 0.17]", table_cell_style)],
        [Paragraph("MV (20% cap, mean return)", table_cell_left), Paragraph("20.26%", table_cell_style), Paragraph("19.56%", table_cell_style), Paragraph("1.05", table_cell_style), Paragraph("1.92", table_cell_style), Paragraph("18.73%", table_cell_style), Paragraph("700.7%", table_cell_style), Paragraph("[-0.61, 0.54]", table_cell_style)],
        [Paragraph("MV (no cap, mean return)", table_cell_left), Paragraph("20.02%", table_cell_style), Paragraph("26.90%", table_cell_style), Paragraph("0.81", table_cell_style), Paragraph("1.44", table_cell_style), Paragraph("33.38%", table_cell_style), Paragraph("789.3%", table_cell_style), Paragraph("[-0.89, 0.39]", table_cell_style)],
        [Paragraph("MV (15% turnover, mean return)", table_cell_left), Paragraph("19.83%", table_cell_style), Paragraph("21.50%", table_cell_style), Paragraph("0.95", table_cell_style), Paragraph("1.60", table_cell_style), Paragraph("24.22%", table_cell_style), Paragraph("179.6%", table_cell_style), Paragraph("[-0.70, 0.46]", table_cell_style)],
        [Paragraph("MV-ML (20% cap, XGBoost)", table_cell_left), Paragraph("5.40%", table_cell_style), Paragraph("19.65%", table_cell_style), Paragraph("0.37", table_cell_style), Paragraph("0.54", table_cell_style), Paragraph("32.93%", table_cell_style), Paragraph("1628.4%", table_cell_style), Paragraph("[-1.18, -0.15]", table_cell_style)],
        [Paragraph("MV-ML (no cap, XGBoost)", table_cell_left), Paragraph("0.32%", table_cell_style), Paragraph("22.10%", table_cell_style), Paragraph("0.13", table_cell_style), Paragraph("0.18", table_cell_style), Paragraph("39.27%", table_cell_style), Paragraph("1895.0%", table_cell_style), Paragraph("[-1.36, -0.52]", table_cell_style)],
        [Paragraph("APDE Soft Penalty (20% cap)", table_cell_left), Paragraph("4.39%", table_cell_style), Paragraph("19.64%", table_cell_style), Paragraph("0.32", table_cell_style), Paragraph("0.47", table_cell_style), Paragraph("32.59%", table_cell_style), Paragraph("1383.8%", table_cell_style), Paragraph("[-1.28, -0.20]", table_cell_style)],
        [Paragraph("APDE Soft Penalty (no cap)", table_cell_left), Paragraph("-0.15%", table_cell_style), Paragraph("21.92%", table_cell_style), Paragraph("0.10", table_cell_style), Paragraph("0.15", table_cell_style), Paragraph("40.68%", table_cell_style), Paragraph("1702.0%", table_cell_style), Paragraph("[-1.39, -0.54]", table_cell_style)],
        [Paragraph("<b>APDE Full (15% Hard Cap)</b>", table_cell_left), Paragraph("<b>8.19%</b>", table_cell_bold), Paragraph("<b>14.31%</b>", table_cell_bold), Paragraph("<b>0.62</b>", table_cell_bold), Paragraph("<b>0.98</b>", table_cell_bold), Paragraph("<b>19.12%</b>", table_cell_bold), Paragraph("<b>180.0%</b>", table_cell_bold), Paragraph("<b>[-0.89, 0.02]</b>", table_cell_bold)],
    ]
    t_p = Table([p_headers] + p_rows, colWidths=[124, 46, 52, 42, 44, 48, 70, 78])
    t_p.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_p)
    story.append(Paragraph("<b>Table 3:</b> Primary portfolio performance over 78 rebalances (Source: results_v7/Table_Master_10Arm.csv).", caption_style))
    story.append(Spacer(1, 4))

    story.append(Paragraph("7.2 Analysis of Results & Turnover Sensitivity", h2_style))
    story.append(Paragraph(
        "• <b>No ML Arm Beats Equal Weight (EW):</b> Naive 1/N achieves Sharpe 1.02. ML-driven models without caps generate disastrous churn "
        "(> 1,600% annual turnover) and low Sharpe (0.13–0.37).",
        bullet_style
    ))
    story.append(Paragraph(
        "• <b>The Cap as Risk Shrinkage:</b> Adding the 15% turnover cap cuts annual churn from 1,384% to 180% (87% reduction), lowers volatility "
        "from 19.64% to 14.31%, and cuts max drawdown from 32.59% to 19.12%. As shown in Table 4, relaxing the cap monotonically degrades "
        "APDE performance, proving the cap acts as shrinkage against forecast noise rather than an alpha generator.",
        bullet_style
    ))

    # CDE Ablation snippet table
    story.append(Paragraph("7.3 50-Asset CDE Ablation Study (Table VI)", h2_style))
    cde_headers = [Paragraph("<b>Pipeline</b>", table_header_style), Paragraph("<b>Annual Return</b>", table_header_style), 
                   Paragraph("<b>Volatility</b>", table_header_style), Paragraph("<b>Sharpe Ratio</b>", table_header_style), 
                   Paragraph("<b>Average Turnover</b>", table_header_style)]
    cde_rows = [
        [Paragraph("No CDE (Full 50-Asset Universe)", table_cell_left), Paragraph("11.85%", table_cell_style), Paragraph("15.71%", table_cell_style), Paragraph("0.754", table_cell_style), Paragraph("15.00%", table_cell_style)],
        [Paragraph("CDE $\\to$ APDE (Top-10 Candidates)", table_cell_left), Paragraph("10.49%", table_cell_style), Paragraph("13.90%", table_cell_style), Paragraph("0.755", table_cell_style), Paragraph("13.43%", table_cell_style)],
    ]
    t_cde = Table([cde_headers] + cde_rows, colWidths=[164, 85, 85, 85, 85])
    t_cde.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SECONDARY),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_cde)
    story.append(Paragraph("<b>Table 4:</b> CDE pre-filtering ablation over 82 rebalances (Source: research_backtest_50asset_comparison.json).", caption_style))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 9: IMPLEMENTATION AND TECHNOLOGY STACK
    # =========================================================================
    story.append(Paragraph("8. Implementation and Technology Stack", h1_style))
    story.append(Paragraph("Technology Specifications, Database Persistence, API Contracts, and Automated Testing", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=SECONDARY, spaceBefore=0, spaceAfter=8))

    story.append(Paragraph("8.1 Full-Stack Technical Specifications", h2_style))
    
    stack_data = [
        [Paragraph("<b>Subsystem</b>", table_header_style), Paragraph("<b>Technologies Used</b>", table_header_style), Paragraph("<b>Implementation Role</b>", table_header_style)],
        [Paragraph("Frontend SPA", table_cell_left), Paragraph("React 18, TypeScript, Tailwind CSS, Vite, Recharts, Lucide Icons", table_cell_left), Paragraph("User/Admin dashboards, portfolio holdings view, ledger, rebalancing UI", table_cell_left)],
        [Paragraph("Backend REST API", table_cell_left), Paragraph("FastAPI 0.115+, Pydantic v2, Uvicorn, Python 3.14.3", table_cell_left), Paragraph("Modular REST routing, request tracing, CORS security, JWT auth", table_cell_left)],
        [Paragraph("Database & ORM", table_cell_left), Paragraph("SQLAlchemy 2.0, SQLite (dev) / PostgreSQL 16 (prod)", table_cell_left), Paragraph("87 relational tables persisting users, holdings, transactions, and logs", table_cell_left)],
        [Paragraph("Quantitative Optimization", table_cell_left), Paragraph("CVXPY 1.6+, SCS 3.2+ (Splitting Conic Solver)", table_cell_left), Paragraph("Convex quadratic programming, hard turnover cap, position constraints", table_cell_left)],
        [Paragraph("Predictive Modeling", table_cell_left), Paragraph("XGBoost 3.0+, scikit-learn, SHAP 0.52.0", table_cell_left), Paragraph("Walk-forward training, return forecasting, TreeSHAP decomposition", table_cell_left)],
        [Paragraph("Autonomous Engine", table_cell_left), Paragraph("APScheduler, WebSockets, asyncio event bus", table_cell_left), Paragraph("Background workers for regime monitoring, model health, real-time alerts", table_cell_left)],
    ]
    t_stack = Table(stack_data, colWidths=[100, 194, 210])
    t_stack.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SECONDARY),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
    ]))
    story.append(t_stack)
    story.append(Paragraph("<b>Table 5:</b> OptiVest AI implementation architecture and technical dependencies.", caption_style))
    story.append(Spacer(1, 4))

    story.append(Paragraph("8.2 Solver Performance Benchmarks (Table VIII of Paper)", h2_style))
    story.append(Paragraph(
        "Solver latency was measured on synthetic candidate pools ($N \\in \\{50, 100, 250, 500\\}$). SCS demonstrates rapid execution "
        "with median wall-clock time of <b>9.07 ms</b> at $N = 50$, <b>12.93 ms</b> at $N = 100$, <b>58.01 ms</b> at $N = 250$, and <b>309.95 ms</b> at $N = 500$. "
        "This confirms that the quadratic optimization step introduces negligible latency into real-time wealth management workflows.",
        body_style
    ))

    story.append(Paragraph("8.3 Testing & Quality Assurance", h2_style))
    story.append(Paragraph(
        "The codebase includes a comprehensive Pytest test suite covering APDE mathematical constraints, CDE deterministic ranking, "
        "Decision Score signs, autonomous background workers, and paper-trade reconciliation. Execution in the local workspace verified: "
        "<b>40 of 40 unit and integration tests passed</b> in 62.91 seconds without regressions.",
        body_style
    ))

    story.append(Paragraph("8.4 Live Database Persistence Verification", h2_style))
    story.append(Paragraph(
        "Direct SQL audit of `optivest_dev.db` (30.26 MB) verified active persistence: 172 registered users, 133 created portfolios, "
        "48 current holdings, 36 chronological buy/sell transaction ledger records, 7,453 decision explanation cards, and 18,104 streaming event records.",
        body_style
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 10: CONCLUSION AND LIMITATIONS
    # =========================================================================
    story.append(Paragraph("9. Conclusion and Limitations", h1_style))
    story.append(Paragraph("Project Contributions, Empirical Takeaways, Current Limitations, and Future Roadmap", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=SECONDARY, spaceBefore=0, spaceAfter=8))

    story.append(Paragraph("9.1 Core Project Contributions", h2_style))
    story.append(Paragraph(
        "OptiVest AI successfully demonstrates a production-grade architecture that resolves the two central barriers to deploying "
        "machine learning in wealth management:",
        body_style
    ))
    story.append(Paragraph(
        "1. <b>Overcoming the Prediction Fallacy:</b> Rather than executing noisy raw forecasts, OptiVest treats predictions as single inputs "
        "into a constrained quadratic optimization engine. The 15% $\\ell_1$ turnover cap acts as a crucial regularizer, reducing turnover by 87% "
        "and dampening maximum drawdown from 32.6% to 19.1%.",
        bullet_style
    ))
    story.append(Paragraph(
        "2. <b>Resolving the Black-Box Dilemma:</b> Exact TreeSHAP feature attribution combined with the mathematical Decision Score ($DS_i$) "
        "ensures that every proposed rebalancing trade is decomposed into underlying feature signals, marginal covariance risk, and cost friction.",
        bullet_style
    ))
    story.append(Paragraph(
        "3. <b>Preventing Degenerate Cash Locking:</b> The deterministic Candidate Discovery Engine (CDE) dynamically screens non-held assets, "
        "enabling cash-heavy portfolios to deploy capital into high-quality equities.",
        bullet_style
    ))

    story.append(Paragraph("9.2 Scientific Takeaways & Boundaries", h2_style))
    story.append(Paragraph(
        "The project provides a vital, scientifically honest insight: <b>forecasting models in liquid equities exhibit near-zero predictive skill "
        "(Rank IC = +0.008, Out-of-sample $R^2 = -2.1%$) and cannot outperform naive 1/N equal weighting in isolation</b>. "
        "The value of OptiVest AI lies in its <i>decision architecture</i>: making algorithmic trading executable, auditable, and risk-controlled.",
        body_style
    ))

    story.append(Paragraph("9.3 Current Limitations", h2_style))
    story.append(Paragraph("• <b>Hindsight Universe Selection:</b> Evaluation uses 50 currently listed large-cap equities, introducing survivorship bias.", bullet_style))
    story.append(Paragraph("• <b>Static Calendar Rebalancing:</b> Portfolios rebalance on a fixed 21-day schedule rather than triggering dynamically on risk threshold breaches.", bullet_style))
    story.append(Paragraph("• <b>Linear Friction Assumptions:</b> Costs are modeled at a flat 10 bps per side, omitting non-linear market impact and bid-ask spread dynamics.", bullet_style))
    story.append(Paragraph("• <b>Live Fundamental Snapshots:</b> CDE currently consumes current yfinance fundamental metrics rather than point-in-time historical filings.", bullet_style))

    story.append(Paragraph("9.4 Future System Roadmap", h2_style))
    story.append(Paragraph(
        "Planned enhancements include incorporating valuation multiples (P/E, PEG, P/B) into CDE pre-filtering, dynamic covariance risk penalties "
        "derived from NLP news sentiment, fractional share execution for retail micro-investing, and tax-loss harvesting constraints.",
        body_style
    ))
    story.append(Spacer(1, 10))

    story.append(create_callout(
        "<b>Final Summary:</b> OptiVest AI shifts algorithmic finance from speculative return prediction to robust, constrained, "
        "and explainable portfolio decision-making. The system is fully realized across a production FastAPI backend, React dashboard, "
        "and rigorous quadratic optimization engine.",
        bg=CARD_BG, border=PRIMARY
    ))

    # Build the document with the NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Built PDF: {filename}")

if __name__ == "__main__":
    out_pdf = "OptiVest_AI_Project_Report.pdf"
    build_pdf(out_pdf)
    reader = pypdf.PdfReader(out_pdf)
    print(f"Generated PDF Page Count: {len(reader.pages)}")
