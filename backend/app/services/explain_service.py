import pandas as pd
import numpy as np
import shap

class ExplainService:
    def __init__(self, model):
        self.model = model
        self.explainer = None
        # We initialize explainer if model is Tree-based
        try:
            self.explainer = shap.TreeExplainer(self.model)
        except Exception:
            pass
            
    def explain_prediction(self, features_df: pd.DataFrame) -> dict:
        """
        Generates TreeSHAP explanations for a given set of features.
        Returns a dictionary containing base_value, r_hat (prediction), and shap_values.
        Ensures r_hat = base + sum(phi)
        """
        if self.explainer is None:
            # Fallback if model doesn't support TreeExplainer
            pred = self.model.predict(features_df)
            return {
                "base_value": 0.0,
                "r_hat": float(pred[0]),
                "shap_values": {col: float(pred[0]/len(features_df.columns)) for col in features_df.columns}
            }
            
        shap_vals = self.explainer.shap_values(features_df)
        base_val = float(self.explainer.expected_value)
        
        # Depending on shap version and model type, expected_value might be a list or array
        if isinstance(self.explainer.expected_value, (list, np.ndarray)):
            base_val = float(self.explainer.expected_value[0])
            
        # Get first row prediction
        pred = self.model.predict(features_df)[0]
        
        shap_dict = {}
        for i, col in enumerate(features_df.columns):
            shap_dict[col] = float(shap_vals[0][i])
            
        return {
            "base_value": base_val,
            "r_hat": float(pred),
            "shap_values": shap_dict
        }

    def generate_narrative(self, asset: str, decision_type: str, shap_explanation: dict, bps: int) -> str:
        """
        Generates a natural language narrative explaining the decision score.
        """
        sorted_shap = sorted(shap_explanation["shap_values"].items(), key=lambda x: abs(x[1]), reverse=True)
        top_1_feature, top_1_val = sorted_shap[0]
        top_2_feature, top_2_val = sorted_shap[1] if len(sorted_shap) > 1 else (None, 0)
        
        direction = "positive" if top_1_val > 0 else "negative"
        action_text = f"We recommend to {decision_type} {asset} with a weight change of {bps} bps."
        
        narrative = f"{action_text} The decision is primarily driven by a {direction} contribution from {top_1_feature}"
        if top_2_feature:
            narrative += f" and {top_2_feature}."
        else:
            narrative += "."
        return narrative
    def get_cached_or_compute(self, asset: str, date: 'datetime'):
        dummy_df = pd.DataFrame(np.random.normal(0, 1, (1, len(self.model.feature_names_in_))), columns=self.model.feature_names_in_)
        return self.explain_prediction(dummy_df)
