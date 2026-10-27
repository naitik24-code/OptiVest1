"""Generate reproducible OptiVest research figures.

The figures are diagrams of the implemented pipeline and validation protocol;
they do not invent performance numbers.  Run from the repository root:

    python scripts/generate_research_assets.py
"""
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "RESEARCH_PAPER" / "figures" / "generated"
OUT.mkdir(parents=True, exist_ok=True)


def flow_figure():
    fig, ax = plt.subplots(figsize=(14, 5.5))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 5)
    ax.axis("off")
    steps = [
        ("Data\nquality", "#263238"),
        ("Candidate\ndiscovery", "#1565c0"),
        ("Hold / trim /\nreplace / cash", "#6a1b9a"),
        ("APDE\noptimization", "#2e7d32"),
        ("Guardrails\n& costs", "#ef6c00"),
        ("Explainable\ndecision card", "#ad1457"),
        ("Approval → paper\ntrade → monitor", "#37474f"),
    ]
    xs = [0.2 + i * 2 for i in range(len(steps))]
    for i, ((label, color), x) in enumerate(zip(steps, xs)):
        box = FancyBboxPatch((x, 1.6), 1.65, 1.7, boxstyle="round,pad=0.06,rounding_size=0.08", facecolor=color, edgecolor="white", linewidth=1.2)
        ax.add_patch(box)
        ax.text(x + 0.825, 2.45, label, ha="center", va="center", color="white", fontsize=10, weight="bold")
        if i < len(steps) - 1:
            ax.add_patch(FancyArrowPatch((x + 1.67, 2.45), (xs[i + 1] - 0.04, 2.45), arrowstyle="-|>", mutation_scale=14, linewidth=1.4, color="#607d8b"))
    ax.text(7, 4.25, "OptiVest: Explainable Portfolio Reallocation Pipeline", ha="center", fontsize=16, weight="bold")
    ax.text(7, 0.65, "Every recommendation is evaluated against hold and cash before approval.", ha="center", fontsize=10, color="#455a64")
    fig.tight_layout()
    fig.savefig(OUT / "optivest_pipeline.png", dpi=220, bbox_inches="tight")
    fig.savefig(OUT / "optivest_pipeline.pdf", bbox_inches="tight")
    plt.close(fig)


def validation_figure():
    fig, ax = plt.subplots(figsize=(10, 5.5))
    ax.axis("off")
    rows = [
        ("Point-in-time data", "Prevents future information entering a decision"),
        ("Walk-forward test", "Measures decisions only after the training window"),
        ("Purging + embargo", "Reduces overlap and serial leakage"),
        ("Costs + taxes", "Reports net rather than frictionless results"),
        ("Baselines", "Compares against hold, equal-weight and index choices"),
        ("Stress tests", "Checks crashes, gaps, illiquidity and missing data"),
        ("Audit trail", "Makes each recommendation reproducible"),
    ]
    ax.text(0.5, 0.96, "OptiVest Validation and Governance Protocol", ha="center", va="top", fontsize=16, weight="bold", transform=ax.transAxes)
    y = 0.84
    for name, detail in rows:
        ax.add_patch(FancyBboxPatch((0.06, y - 0.055), 0.27, 0.075, boxstyle="round,pad=0.02", facecolor="#1565c0", transform=ax.transAxes))
        ax.text(0.195, y - 0.017, name, ha="center", va="center", color="white", fontsize=10, weight="bold", transform=ax.transAxes)
        ax.add_patch(FancyArrowPatch((0.34, y - 0.017), (0.43, y - 0.017), arrowstyle="-|>", mutation_scale=11, color="#607d8b", transform=ax.transAxes))
        ax.text(0.46, y - 0.017, detail, ha="left", va="center", fontsize=10, color="#263238", transform=ax.transAxes)
        y -= 0.105
    fig.tight_layout()
    fig.savefig(OUT / "validation_protocol.png", dpi=220, bbox_inches="tight")
    fig.savefig(OUT / "validation_protocol.pdf", bbox_inches="tight")
    plt.close(fig)


if __name__ == "__main__":
    flow_figure()
    validation_figure()
    print(f"Generated research assets in {OUT}")
