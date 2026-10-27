# II. RELATED WORK

The intersection of machine learning, portfolio optimization, and explainable artificial intelligence (XAI) has experienced rapid evolution over the past decade. Traditional financial literature has long relied on linear models and static risk assumptions, paradigms which modern computational methods are now aggressively challenging.

## A. Evolution of Portfolio Optimization

The foundation of modern portfolio theory (MPT) stems from Markowitz [4], which introduced mean-variance optimization. While theoretically profound, MPT in practice is notoriously sensitive to estimation errors in expected returns and covariance matrices. Black and Litterman [5] improved upon this foundational framework by incorporating subjective investor views into equilibrium returns; however, the framework remained largely linear and parametric.

In recent years, the academic literature has shifted towards machine learning approaches to forecast returns (the $\alpha$ component). Gu, Kelly, and Xiu [6] demonstrated that non-linear models, particularly random forests and neural networks, significantly outperform linear regressions in predicting equity returns. However, the vast majority of these papers treat the prediction step in isolation—a phenomenon we term the *Prediction Fallacy*. They systematically fail to bridge the gap between theoretical asset forecasting and the constrained, multi-objective reality of active portfolio management.

![Literature Evolution](file:///e:/NAITIK%20PATHAK/PROJECT/StockProject/figure_1_literature_evolution.png)
*Fig. 2. The historical evolution from classical linear optimization to ML-driven and XAI-integrated portfolio engines.*

## B. Explainable AI (XAI) in Finance

As predictive models grew in algorithmic complexity, the Black-Box Dilemma emerged as a critical barrier in FinTech. Regulatory mandates (e.g., the GDPR's "right to explanation") and retail investors necessitate transparency. Lundberg and Lee [7] unified several methods of explainability with SHAP (SHapley Additive exPlanations). 

While SHAP has been widely adopted in credit scoring and fraud detection, its application in dynamic portfolio reallocation remains sparse. Existing literature predominantly utilizes SHAP to explain a model's global accuracy over a dataset, rather than employing it dynamically to justify a real-time execution decision to a retail user.

## C. The OptiVest Differentiation

OptiVest AI bridges these isolated theoretical domains. It explicitly solves the Prediction Fallacy by chaining ML-driven Expected Returns and Fundamental Intelligence into a robust Adaptive Portfolio Decision Engine (APDE). Furthermore, it resolves the Black-Box Dilemma by generating deterministic, SHAP-derived narrative audits for every recommended optimization.

TABLE I  
COMPARISON OF QUANTITATIVE PORTFOLIO PARADIGMS

| Methodology / Framework | Non-Linear Return Forecasting | Handles Cash-Heavy Initial States | Constrained Optimization (Turnover/Sector) | Explainable Decisions (XAI) |
| :--- | :---: | :---: | :---: | :---: |
| **Classical MPT (Markowitz)** | No | No | Partial | Yes |
| **Black-Litterman (1992)** | No | No | Partial | Yes |
| **Pure Deep Learning (LSTMs)** | Yes | No | No | No |
| **OptiVest AI (CDE + APDE)** | Yes | Yes (Via CDE) | Yes | Yes (TreeSHAP) |

By integrating candidate discovery (CDE) with constrained optimization (APDE) and XAI, OptiVest represents a comprehensive architectural leap forward from the fragmented approaches historically present in the literature.
