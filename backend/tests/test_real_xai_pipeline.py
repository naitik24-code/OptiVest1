import os
import sys
import json
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def test_real_xai_pipeline():
    result_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../scripts/xai_real_data_example.json'))
    
    if not os.path.exists(result_path):
        pytest.skip("Real XAI data example not generated due to execution restrictions.")
        
    with open(result_path, 'r') as f:
        data = json.load(f)
        
    # 1. SHAP reconstruction
    base = data["base_value"]
    shap_sum = sum(data["shap_contributions"].values())
    reconstructed = base + shap_sum
    
    # 2. Prediction equals reconstructed SHAP prediction within tolerance
    assert abs(data["prediction"] - reconstructed) < 1e-6
    assert abs(data["prediction"] - data["reconstructed_prediction"]) < 1e-6
    
    # 3. Decision Score decomposition
    ds = data["forecast_term"] + data["risk_term"] + data["cost_term"]
    
    # 4. Decision Score forecast equals SHAP-explained forecast
    assert abs(ds - data["decision_score"]) < 1e-6
    assert abs(data["forecast_term"] - data["prediction"]) < 1e-6
    
    # 5. No NaN/inf values
    for v in data.values():
        if isinstance(v, (int, float)):
            assert not (v != v) # NaN check
            assert v != float('inf') and v != float('-inf')
            
if __name__ == "__main__":
    pytest.main(["-v", __file__])
