# ACKNOWLEDGMENT

The architectural development of the OptiVest AI platform would not have been possible without the foundational academic contributions of the broader quantitative finance and open-source software communities.

I extend my deepest gratitude to the academic researchers and financial engineers who continuously challenge the rigid boundaries of classical modern portfolio theory. Their published insights directly catalyzed the dual-layer architecture of the Candidate Discovery Engine (CDE) and the Adaptive Portfolio Decision Engine (APDE).

Furthermore, this research relies heavily on a sophisticated ecosystem of open-source libraries. The ability to seamlessly integrate real-time market telemetry, train robust predictive models, and perform computationally intensive mathematical optimizations with sub-second latency is a testament to the maintainers of these frameworks.

TABLE V  
OPEN-SOURCE TECHNOLOGIES AND FRAMEWORKS ACKNOWLEDGED

| Category | Framework / Library | Critical Contribution to OptiVest AI |
| :--- | :--- | :--- |
| **Market Data** | `yfinance` | Facilitated the extraction of point-in-time fundamental financial statements (ROE, margins, debt ratios) and historical price time-series for the CDE. |
| **Machine Learning** | `XGBoost` & `scikit-learn` | Powered the core non-linear expected return prediction algorithms that significantly outperformed baseline linear regression architectures. |
| **Explainable AI** | `SHAP` (TreeSHAP) | Resolved the Black-Box Dilemma by generating deterministic, mathematically sound narrations for every portfolio reallocation. |
| **Backend Architecture** | `FastAPI` & `SQLAlchemy` | Engineered the high-performance, asynchronous REST API and robust database ORM required for enterprise-scale latency requirements. |
| **Mathematical Optimization**| `scipy.optimize` | Executed the complex, multi-objective quadratic programming required to solve the bounded APDE constraints. |

Finally, I acknowledge the continuous evolution of the FinTech regulatory space, which provided the ultimate mandate to build a system that is not only mathematically optimal but also fully transparent and ready for rigorous compliance scrutiny.
