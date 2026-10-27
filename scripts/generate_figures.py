import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

# Create output directory
os.makedirs('figures/output', exist_ok=True)

# Styling configuration
plt.style.use('seaborn-v0_8-whitegrid')
COLORS = {
    'dark_blue': '#2B6CB0',
    'med_blue': '#3182CE',
    'light_blue': '#63B3ED',
    'dark_grey': '#4A5568',
    'med_grey': '#718096',
    'light_grey': '#E2E8F0',
    'red': '#E53E3E',
    'green': '#38A169'
}
FONT_SIZE_TITLE = 14
FONT_SIZE_LABEL = 12
FONT_SIZE_TICK = 10
DPI = 300
WIDTH = 7
HEIGHT = 4.5

def setup_diagram_axis(fig, ax):
    ax.axis('off')
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 10)

def draw_box(ax, x, y, width, height, text, bg_color=COLORS['light_grey'], text_color='black', fontsize=10):
    rect = patches.FancyBboxPatch((x, y), width, height, boxstyle="round,pad=0.1", 
                                  linewidth=1.5, edgecolor=COLORS['dark_grey'], facecolor=bg_color)
    ax.add_patch(rect)
    ax.text(x + width/2, y + height/2, text, ha='center', va='center', 
            fontsize=fontsize, color=text_color, wrap=True, fontweight='bold' if text_color=='black' else 'normal')
    return x + width, y + height/2, x, y + height/2, x + width/2, y, x + width/2, y + height

def draw_arrow(ax, x_start, y_start, x_end, y_end, connectionstyle="arc3"):
    ax.annotate("", xy=(x_end, y_end), xytext=(x_start, y_start),
                arrowprops=dict(arrowstyle="->", color=COLORS['dark_grey'], lw=2, 
                                connectionstyle=connectionstyle, shrinkA=5, shrinkB=5))

# ==========================================
# 1. System Architecture
# ==========================================
def fig01_system_architecture():
    fig, ax = plt.subplots(figsize=(WIDTH*1.2, HEIGHT))
    setup_diagram_axis(fig, ax)
    
    r1, my1, l1, _ , _, _, _, _ = draw_box(ax, 0.2, 4, 1.8, 2, "Data\nIngestion", COLORS['med_blue'], 'white')
    r2, my2, l2, _ , _, _, _, _ = draw_box(ax, 2.7, 4, 2.2, 2, "Candidate\nDiscovery Engine\n(CDE)")
    r3, my3, l3, _ , cb3, _, _, ct3 = draw_box(ax, 5.6, 4, 2.2, 2, "Adaptive Portfolio\nDecision Engine\n(APDE)", COLORS['med_blue'], 'white')
    r4, my4, l4, _ , _, _, _, _ = draw_box(ax, 8.5, 4, 1.8, 2, "Explainability\nLayer\n(XAI)")
    
    r_ex, my_ex, l_ex, _, _, _, cb_ex, ct_ex = draw_box(ax, 5.6, 7.5, 2.2, 1.2, "Existing\nHoldings")
    
    draw_arrow(ax, r1, my1, l2, my2)
    draw_arrow(ax, r2, my2, l3, my3)
    draw_arrow(ax, r3, my3, l4, my4)
    draw_arrow(ax, cb_ex, 7.5, ct3, 6)
    
    plt.savefig('figures/output/fig01_system_architecture.png', dpi=DPI, bbox_inches='tight')
    plt.close()

# ==========================================
# 2. Data Split
# ==========================================
def fig03_data_split():
    fig, ax = plt.subplots(figsize=(WIDTH, HEIGHT*0.5))
    ax.axis('off')
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 2)
    
    y = 0.5; h = 0.8
    ax.add_patch(patches.Rectangle((0, y), 3.5, h, facecolor=COLORS['dark_grey'], edgecolor='white'))
    ax.text(1.75, y+h/2, "Train\n(2013 - 2016)", color='white', ha='center', va='center', fontweight='bold')
    
    ax.add_patch(patches.Rectangle((3.5, y), 0.5, h, facecolor=COLORS['med_grey'], edgecolor='white'))
    ax.text(3.75, y+h/2+1.0, "Val", color='black', ha='center', va='center', fontweight='bold')
    ax.annotate("", xy=(3.75, y+h), xytext=(3.75, y+h+0.8), arrowprops=dict(arrowstyle="-", color='black'))
    
    ax.add_patch(patches.Rectangle((4.0, y), 6.0, h, facecolor=COLORS['med_blue'], edgecolor='white'))
    ax.text(7.0, y+h/2, "Test\n(2017 - 2023)", color='white', ha='center', va='center', fontweight='bold')
    
    ax.text(0, y-0.2, "Jan 2013", ha='center', va='top', fontsize=FONT_SIZE_TICK)
    ax.text(3.5, y-0.2, "Dec 2016", ha='center', va='top', fontsize=FONT_SIZE_TICK)
    ax.text(4.0, y-0.2, "Jan 2017", ha='center', va='top', fontsize=FONT_SIZE_TICK)
    ax.text(10, y-0.2, "Dec 2023", ha='center', va='top', fontsize=FONT_SIZE_TICK)
    
    plt.savefig('figures/output/fig03_data_split.png', dpi=DPI, bbox_inches='tight')
    plt.close()

# ==========================================
# 3. CDE Framework
# ==========================================
def fig06_cde_framework():
    fig, ax = plt.subplots(figsize=(WIDTH, HEIGHT*1.2))
    setup_diagram_axis(fig, ax)
    
    r1, my1, l1, _, cb1, _, _, ct1 = draw_box(ax, 3, 8, 4, 1.2, "Global Asset Universe", COLORS['dark_grey'], 'white')
    r2, my2, l2, _, cb2, _, _, ct2 = draw_box(ax, 2.5, 5.5, 5, 1.5, "Eligibility Filter\n(Active, Data-Sufficiency,\nNon-duplication)")
    r3, my3, l3, _, cb3, _, _, ct3 = draw_box(ax, 1.5, 2.5, 7, 2, "Multi-Factor Scoring\n(Return, Volatility, Diversification,\nFundamental Quality, Momentum)", COLORS['med_blue'], 'white')
    r4, my4, l4, _, cb4, _, _, ct4 = draw_box(ax, 3, 0.2, 4, 1.2, "Ranked Candidate List (top-k)")
    
    ax.text(1, 3.5, r"Risk Tolerance ($\tau$)", ha='center', va='center', fontweight='bold', fontsize=FONT_SIZE_LABEL)
    draw_arrow(ax, 1, 3.2, 1.5, 3.5)
    
    draw_arrow(ax, cb1, 8, ct2, 7)
    draw_arrow(ax, cb2, 5.5, ct3, 4.5)
    draw_arrow(ax, cb3, 2.5, ct4, 1.4)
    
    plt.savefig('figures/output/fig06_cde_framework.png', dpi=DPI, bbox_inches='tight')
    plt.close()

# ==========================================
# 4. APDE Architecture
# ==========================================
def fig07_apde_architecture():
    fig, ax = plt.subplots(figsize=(WIDTH*1.2, HEIGHT*1.2))
    setup_diagram_axis(fig, ax)
    
    r1, my1, l1, _, _, _, _, _ = draw_box(ax, 0.2, 7.5, 3.0, 1.5, "ML Forecast\n(Expected Returns)", COLORS['med_grey'], 'white')
    r2, my2, l2, _, _, _, _, _ = draw_box(ax, 0.2, 5.0, 3.0, 1.5, "Covariance Matrix\n(Risk Model)", COLORS['med_grey'], 'white')
    r3, my3, l3, _, _, _, _, _ = draw_box(ax, 0.2, 2.5, 3.0, 1.5, "Current Holdings +\nCDE Candidates", COLORS['med_grey'], 'white')
    
    solver_text = "Quadratic Program Solver\n\nConstraints:\n• Self-financing\n• Long-only\n• Reallocation cap\n• Sector cap"
    r_sol, my_sol, l_sol, _, _, _, _, _ = draw_box(ax, 4.5, 3.5, 3.8, 4.5, solver_text, COLORS['med_blue'], 'white', fontsize=11)
    
    r_out, my_out, l_out, _, _, _, _, _ = draw_box(ax, 9.0, 5.0, 1.8, 1.5, "Executed\nWeight\nDelta ($\\Delta w$)", COLORS['dark_grey'], 'white')
    
    draw_arrow(ax, r1, my1, l_sol, 6.5)
    draw_arrow(ax, r2, my2, l_sol, 5.75)
    draw_arrow(ax, r3, my3, l_sol, 4.5)
    draw_arrow(ax, r_sol, my_sol, l_out, my_out)
    
    plt.savefig('figures/output/fig07_apde_architecture.png', dpi=DPI, bbox_inches='tight')
    plt.close()

# ==========================================
# 5. Model Comparison
# ==========================================
def fig08_model_comparison():
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(WIDTH, HEIGHT*1.2), gridspec_kw={'height_ratios': [2, 1]})
    
    models = ['Linear Regression', 'Random Forest', 'XGBoost']
    rmse = [0.0834, 0.0870, 0.0860]
    mae = [0.0591, 0.0607, 0.0605]
    rank_ic = [-0.0338, 0.0214, 0.0237]
    
    x = np.arange(len(models))
    width = 0.35
    
    ax1.bar(x - width/2, rmse, width, label='RMSE', color=COLORS['dark_blue'])
    ax1.bar(x + width/2, mae, width, label='MAE', color=COLORS['med_grey'])
    
    ax1.set_ylabel('Error Score', fontsize=FONT_SIZE_LABEL)
    ax1.set_xticks(x)
    ax1.set_xticklabels(models, fontsize=FONT_SIZE_LABEL)
    ax1.legend(loc='upper left')
    
    colors = [COLORS['red'] if ic < 0 else COLORS['green'] for ic in rank_ic]
    ax2.bar(x, rank_ic, width=0.5, color=colors)
    ax2.axhline(0, color='black', linewidth=1)
    ax2.set_ylabel('Rank IC', fontsize=FONT_SIZE_LABEL)
    ax2.set_xticks(x)
    ax2.set_xticklabels(models, fontsize=FONT_SIZE_LABEL)
    
    plt.tight_layout()
    plt.savefig('figures/output/fig08_model_comparison.png', dpi=DPI, bbox_inches='tight')
    plt.close()

# ==========================================
# 6. APDE Scalability
# ==========================================
def fig09_apde_scalability():
    fig, ax = plt.subplots(figsize=(WIDTH, HEIGHT))
    
    N = [50, 100, 250, 500]
    median_latency = [44.98, 260.35, 2295.60, 7194.78]
    p95_latency = [99.83, 509.67, 3122.09, 10943.24]
    
    ax.plot(N, median_latency, marker='o', linewidth=2, color=COLORS['dark_blue'], label='Median Latency')
    ax.plot(N, p95_latency, marker='s', linewidth=2, linestyle='--', color=COLORS['med_grey'], label='95th Percentile Latency')
    
    ax.set_yscale('log')
    ax.set_xlabel('Universe Size (N)', fontsize=FONT_SIZE_LABEL)
    ax.set_ylabel('Solve Latency (ms) [Log Scale]', fontsize=FONT_SIZE_LABEL)
    ax.set_xticks(N)
    ax.set_xticklabels(N, fontsize=FONT_SIZE_TICK)
    ax.legend(fontsize=FONT_SIZE_LABEL)
    ax.grid(True, which="both", ls="-", alpha=0.2)
    
    plt.tight_layout()
    plt.savefig('figures/output/fig09_apde_scalability.png', dpi=DPI, bbox_inches='tight')
    plt.close()

# ==========================================
# 7. Decision Score Waterfall
# ==========================================
def fig10_decision_score():
    fig, ax = plt.subplots(figsize=(WIDTH, HEIGHT))
    
    labels = ['Base Value', '60-day Mom.', 'Op. Margin', 'Debt Ratio', 'Risk Penalty', 'Cost Penalty', 'Final Score']
    values = [0.02, 0.035, 0.015, -0.008, -0.012, -0.005, 0.045]
    
    colors = [COLORS['dark_grey'], COLORS['green'], COLORS['green'], COLORS['red'], COLORS['red'], COLORS['red'], COLORS['dark_blue']]
    y_pos = np.arange(len(labels))[::-1] 
    
    lefts = [0, 0.02, 0.055, 0.062, 0.050, 0.045, 0]
    lengths = [0.02, 0.035, 0.015, 0.008, 0.012, 0.005, 0.045]
    
    ax.barh(y_pos, lengths, left=lefts, color=colors, height=0.6)
    
    for i, (l, v, left) in enumerate(zip(lengths, values, lefts)):
        x_text = left + l + 0.002
        if v < 0:
            x_text = left - 0.002
            ha = 'right'
            text_str = f"{v:.3f}"
        else:
            ha = 'left'
            text_str = f"+{v:.3f}" if i != 0 and i != len(values)-1 else f"{v:.3f}"
            
        ax.text(x_text, y_pos[i], text_str, va='center', ha=ha, fontsize=FONT_SIZE_TICK)

    ax.set_yticks(y_pos)
    ax.set_yticklabels(labels, fontsize=FONT_SIZE_LABEL)
    ax.set_xlabel('SHAP / Score Contribution', fontsize=FONT_SIZE_LABEL)
    ax.set_xlim(0, 0.09)
    
    plt.tight_layout()
    plt.savefig('figures/output/fig10_decision_score.png', dpi=DPI, bbox_inches='tight')
    plt.close()

if __name__ == "__main__":
    print("Generating Figure 1...")
    fig01_system_architecture()
    print("Generating Figure 2...")
    fig03_data_split()
    print("Generating Figure 3...")
    fig06_cde_framework()
    print("Generating Figure 4...")
    fig07_apde_architecture()
    print("Generating Figure 5...")
    fig08_model_comparison()
    print("Generating Figure 6...")
    fig09_apde_scalability()
    print("Generating Figure 7...")
    fig10_decision_score()
    print("Done generating all figures.")
