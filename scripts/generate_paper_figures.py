"""Generate the publication figure set from repository evidence.

All performance values in this script are read from results_v7/Table_Master_10Arm.csv.
The decision-score graphic is a formula schematic, not a TreeSHAP result.
"""
from pathlib import Path
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "RESEARCH_PAPER" / "figures" / "publication"
OUT.mkdir(parents=True, exist_ok=True)
BLUE, GREEN, ORANGE, GREY, DARK = "#1565c0", "#2e7d32", "#ef6c00", "#607d8b", "#263238"

def save(fig, name):
    fig.savefig(OUT / f"{name}.png", dpi=240, bbox_inches="tight")
    fig.savefig(OUT / f"{name}.pdf", bbox_inches="tight")
    plt.close(fig)

def architecture():
    fig, ax = plt.subplots(figsize=(14, 4)); ax.axis("off"); ax.set_xlim(0, 14); ax.set_ylim(0, 4)
    steps = [("Point-in-time\ndata", DARK), ("Candidate\ndiscovery", BLUE), ("Hold / trim /\nreplace / cash", "#6a1b9a"), ("APDE\noptimization", GREEN), ("Costs +\nconstraints", ORANGE), ("Decision card\n+ audit trail", "#ad1457"), ("Approval →\npaper trade", DARK)]
    for i, (label, color) in enumerate(steps):
        x = .2 + i * 2; ax.add_patch(FancyBboxPatch((x, 1.25), 1.65, 1.35, boxstyle="round,pad=.06", facecolor=color, edgecolor="white")); ax.text(x+.825, 1.93, label, ha="center", va="center", color="white", weight="bold", fontsize=10)
        if i < len(steps)-1: ax.add_patch(FancyArrowPatch((x+1.67,1.93),(x+1.96,1.93),arrowstyle="-|>",mutation_scale=13,color=GREY))
    ax.set_title("OptiVest research-to-decision pipeline", weight="bold", fontsize=15); save(fig, "system_architecture")

def validation():
    fig, ax = plt.subplots(figsize=(12, 3)); ax.axis("off"); ax.set_xlim(0, 12); ax.set_ylim(0, 3)
    blocks = [("Train\n4 years", DARK), ("Purge\n21 days", ORANGE), ("Forecast\n21 days", BLUE), ("Rebalance\nmonthly", GREEN), ("Evaluate\nnet returns", "#6a1b9a")]
    for i,(label,color) in enumerate(blocks):
        x=.3+i*2.35; ax.add_patch(FancyBboxPatch((x,.8),1.75,1.1,boxstyle="round,pad=.05",facecolor=color)); ax.text(x+.875,1.35,label,ha="center",va="center",color="white",weight="bold")
        if i<len(blocks)-1: ax.add_patch(FancyArrowPatch((x+1.78,1.35),(x+2.25,1.35),arrowstyle="-|>",mutation_scale=12,color=GREY))
    ax.set_title("Leakage-resistant monthly walk-forward validation", weight="bold", fontsize=15); save(fig,"walk_forward_validation")

def cde():
    fig, ax = plt.subplots(figsize=(10,5)); ax.axis("off"); ax.set_xlim(0,10); ax.set_ylim(0,5)
    blocks=[("Universe",DARK),("Eligibility\nfilter",BLUE),("Factor\nscoring",GREEN),("Ranked\nshortlist",ORANGE)]
    for i,(label,color) in enumerate(blocks):
        x=.4+i*2.4; ax.add_patch(FancyBboxPatch((x,2),1.8,1,boxstyle="round,pad=.06",facecolor=color)); ax.text(x+.9,2.5,label,ha="center",va="center",color="white",weight="bold")
        if i<len(blocks)-1: ax.add_patch(FancyArrowPatch((x+1.83,2.5),(x+2.35,2.5),arrowstyle="-|>",mutation_scale=13,color=GREY))
    ax.text(5,4.15,"CDE candidate discovery",ha="center",weight="bold",fontsize=15); ax.text(5,1.05,"Eligibility, data sufficiency, return, risk, diversification and fundamental evidence",ha="center",fontsize=9)
    save(fig,"candidate_discovery_engine")

def apde():
    fig, ax = plt.subplots(figsize=(11,5)); ax.axis("off"); ax.set_xlim(0,11); ax.set_ylim(0,5)
    inputs=["Forecast\nreturns","Covariance\nrisk","Current\nholdings","Candidates"]
    for i,label in enumerate(inputs):
        y=3.8-i*.95; ax.add_patch(FancyBboxPatch((.3,y-.3),2, .6,boxstyle="round,pad=.04",facecolor=GREY)); ax.text(1.3,y,label,ha="center",va="center",color="white",weight="bold",fontsize=9); ax.add_patch(FancyArrowPatch((2.35,y),(4.1,2.35),arrowstyle="-|>",mutation_scale=12,color=GREY))
    ax.add_patch(FancyBboxPatch((4.2,1.25),3.2,2.2,boxstyle="round,pad=.08",facecolor=BLUE)); ax.text(5.8,2.35,"APDE quadratic program\n\nlong-only • fully invested\n20% position cap\n15% L1 turnover cap",ha="center",va="center",color="white",weight="bold")
    ax.add_patch(FancyArrowPatch((7.5,2.35),(10.1,2.35),arrowstyle="-|>",mutation_scale=13,color=GREY)); ax.add_patch(FancyBboxPatch((9.1,1.8),1.6,1.1,boxstyle="round,pad=.05",facecolor=GREEN)); ax.text(9.9,2.35,"Proposed\nweights",ha="center",va="center",color="white",weight="bold")
    ax.set_title("Adaptive Portfolio Decision Engine",weight="bold",fontsize=15); save(fig,"apde_optimization")

def performance():
    data=pd.read_csv(ROOT/"results_v7"/"Table_Master_10Arm.csv"); names=["EW","APDE_full","APDE_soft_20cap","MV_20cap"]; d=data[data.Strategy.isin(names)].set_index("Strategy").loc[names]
    fig,axs=plt.subplots(1,2,figsize=(11,4.5)); colors=[GREY,GREEN,ORANGE,BLUE]
    axs[0].bar(d.index,d.Sharpe,color=colors); axs[0].set_ylabel("Sharpe ratio"); axs[0].set_title("Verified V7 Sharpe comparison"); axs[0].tick_params(axis="x",rotation=25)
    axs[1].bar(d.index,d.CAGR,color=colors); axs[1].set_ylabel("CAGR (%)"); axs[1].set_title("Verified V7 CAGR comparison"); axs[1].tick_params(axis="x",rotation=25)
    fig.tight_layout(); save(fig,"verified_performance_comparison")

def constraints():
    fig,ax=plt.subplots(figsize=(8,4.5)); ax.axis("off"); ax.set_xlim(0,8); ax.set_ylim(0,5)
    rows=[("Position weight", "0 ≤ wᵢ ≤ 20%"),("Turnover", "‖w − w_drift‖₁ ≤ 15%"),("Budget", "Σwᵢ = 1"),("Execution", "Approval → paper fill → reconcile")]
    ax.set_title("APDE guardrails and failure recovery",weight="bold",fontsize=15)
    for i,(a,b) in enumerate(rows):
        y=3.9-i*.8; ax.text(.4,y,a,weight="bold",color=BLUE); ax.text(3.1,y,b,color=DARK); ax.plot([.4,7.6],[y-.2,y-.2],color="#dddddd")
    save(fig,"constraints_and_recovery")

if __name__ == "__main__":
    architecture(); validation(); cde(); apde(); performance(); constraints(); print(f"Generated publication figures in {OUT}")
