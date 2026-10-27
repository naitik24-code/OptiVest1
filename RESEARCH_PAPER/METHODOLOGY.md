# III. PROPOSED METHODOLOGY

The computational methodology of OptiVest AI is bifurcated into two sequential optimization phases: the Candidate Discovery Engine (CDE) and the Adaptive Portfolio Decision Engine (APDE). This decoupled architectural approach ensures that the system can robustly handle dynamic market universes and highly constrained portfolio states, including pure-cash initializations.

## A. Candidate Discovery Engine (CDE)

The CDE functions as a pre-optimization intelligent filter. It evaluates the global asset registry to identify fundamentally sound and technically strong assets for subsequent presentation to the optimizer.

![CDE Framework](file:///e:/NAITIK%20PATHAK/PROJECT/StockProject/figures/output/fig06_cde_framework.png)
*Fig. 3. The Candidate Discovery Engine (CDE) logical flow for filtering and ranking the asset universe.*

### 1) Hard Eligibility Constraints
Before an asset is quantitatively scored, it must survive three strict elimination checks:
1. **Active Status**: The asset must be actively trading (`is_active = True`).
2. **Data Sufficiency**: The asset must possess a minimum threshold of valid historical price data (e.g., 10 days).
3. **Non-Duplication**: The asset must not already exist in the user's current holdings to prevent duplicate matrix pools during optimization.

### 2) Multi-Factor Scoring Formula
Eligible assets receive a deterministic ranking score. This score dynamically adjusts its factor weights based on the user's explicit Risk Tolerance profile (parameterized from 1 to 5).

TABLE II  
DYNAMIC FACTOR SCORING WEIGHTS IN THE CDE

| Factor | Description (Source) | Weight (Conservative Profile) | Weight (Aggressive Profile) |
| :--- | :--- | :---: | :---: |
| **Expected Return** | Normalized XGBoost prediction | Lower (0.15) | Higher (0.35) |
| **Volatility Risk** | Historical standard deviation | Higher Penalty (-0.25) | Lower Penalty (-0.05) |
| **Diversification** | Inverse correlation ($1.0 - corr$) | Higher (0.30) | Lower (0.10) |
| **Fundamental Quality** | Profitability, Debt, FCF metrics | Static (0.15) | Static (0.15) |
| **Momentum** | 30-90 day trend | Static (0.15) | Static (0.15) |

## B. Adaptive Portfolio Decision Engine (APDE)

The APDE operates as the mathematical core of the OptiVest framework. It ingests the highly ranked candidates discovered by the CDE and combines them with existing portfolio holdings to compute mathematically optimal allocation weights via quadratic programming.

![APDE Architecture](file:///e:/NAITIK%20PATHAK/PROJECT/StockProject/figures/output/fig07_apde_architecture.png)
*Fig. 4. The APDE multi-objective optimization architecture and constraint processing.*

### 1) Optimization Objective Function

Let $\mathbf{w}_0 = [w_{0,1}, \dots, w_{0,N}]^T$ denote the initial portfolio weight vector. The primary decision variable is defined as the allocation delta vector $\Delta \mathbf{w}$. The resultant portfolio is thus represented as $\mathbf{w}_{\text{new}} = \mathbf{w}_0 + \Delta \mathbf{w}$.

The APDE seeks to maximize the following multi-objective utility function:
$$ \max_{\Delta \mathbf{w}} \quad U(\Delta \mathbf{w}) = \mathbb{E}[R(\mathbf{w}_{\text{new}})] - \lambda \cdot \sigma^2(\mathbf{w}_{\text{new}}) - \gamma \cdot \text{Cost}(\Delta \mathbf{w}) $$

Where:
- $\mathbb{E}[R(\mathbf{w}_{\text{new}})] = \mathbf{w}_{\text{new}}^T \hat{\mathbf{r}}$ represents the expected portfolio return derived from the ML inference vector $\hat{\mathbf{r}}$.
- $\sigma^2(\mathbf{w}_{\text{new}}) = \mathbf{w}_{\text{new}}^T \mathbf{\Sigma} \mathbf{w}_{\text{new}}$ represents the portfolio variance parameterized by the estimated covariance matrix $\mathbf{\Sigma}$.
- $\lambda > 0$ defines the exogenous risk-aversion penalty parameter.
- $\gamma > 0$ models transaction cost decay, where $\text{Cost}(\Delta \mathbf{w}) = \sum_{i=1}^N |\Delta w_i|$.

### 2) Operational Constraints

To guarantee that APDE recommendations remain executable within a live brokerage environment, the mathematical optimization is strictly bounded by four constraints:

1. **Reallocation Cap ($C_{\text{realloc}}$)**: Limits maximum portfolio turnover to prevent excessive capital churn.
   $$\sum_{i: \Delta w_i < 0} |\Delta w_i| \le C_{\text{realloc}}$$
2. **Self-Financing**: Ensures no margin debt is unlawfully utilized by balancing buys and sells.
   $$\sum_{i=1}^N \Delta w_i = 0$$
3. **Long-Only Requirement**: Prevents non-compliant short-selling states.
   $$w_{0,i} + \Delta w_i \ge 0 \quad \forall i \in \{1, \dots, N\}$$
4. **Sector Concentration Limits**: Imposes capped maximum exposures to prevent catastrophic sector-specific drawdowns.

By systematically layering the heuristic filtering logic of the CDE preceding the mathematical rigor of the APDE, OptiVest creates a robust operational framework capable of optimizing portfolios from any arbitrary initial state.
