import os
import sys
import numpy as np
import pandas as pd
import pytest
from xgboost import XGBRegressor

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from app.services.explain_service import ExplainService
from app.models.decision_audit import DecisionAudit

def test_shap_audit_records():
    """
    Test that the ExplainService generates valid TreeSHAP explanations where
    r_hat = base_value + sum(shap_values)
    """
    # Create mock data and model
    X_train = pd.DataFrame(np.random.randn(100, 5), columns=['f1', 'f2', 'f3', 'f4', 'f5'])
    y_train = np.random.randn(100)
    
    model = XGBRegressor(n_estimators=10, max_depth=3, random_state=42)
    model.fit(X_train, y_train)
    
    explain_service = ExplainService(model)
    
    # Test on a few samples
    for i in range(5):
        sample = X_train.iloc[[i]]
        explanation = explain_service.explain_prediction(sample)
        
        base_val = explanation["base_value"]
        r_hat = explanation["r_hat"]
        shap_vals = list(explanation["shap_values"].values())
        sum_phi = sum(shap_vals)
        
        # Verify r_hat = base + sum(phi)
        assert np.isclose(r_hat, base_val + sum_phi, atol=1e-5), \
            f"Failed on sample {i}: r_hat={r_hat}, base={base_val}, sum(phi)={sum_phi}"
            
        # Create mock DecisionAudit record to ensure it can hold the data
        audit = DecisionAudit(
            base_value=base_val,
            r_hat=r_hat,
            shap_values=explanation["shap_values"],
            narrative=explain_service.generate_narrative("AAPL", "BUY", explanation)
        )
        assert audit.r_hat == r_hat
        assert "AAPL" in audit.narrative
