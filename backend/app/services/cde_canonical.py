import numpy as np

class CDE:
    @staticmethod
    def run(universe: list, market_data: dict, fundamentals: dict, config: dict) -> list:
        """
        Standardized Canonical CDE interface.
        Returns a deterministic set of candidates.
        """
        # Sort universe deterministically
        sorted_universe = sorted(universe)
        
        # Simple scoring mechanism for deterministic testing
        # In reality this uses ML and fundamentals.
        candidates = []
        for i, ticker in enumerate(sorted_universe):
            # Deterministic score based on config and ticker length
            score = (len(ticker) * 0.1) + config.get("base_score", 0.5)
            
            # Simple eligibility filter
            if score > config.get("threshold", 0.8):
                candidates.append({
                    "ticker": ticker,
                    "score": score,
                    "reason": "Passed canonical threshold"
                })
        
        # Sort by score descending, then ticker alphabetical
        candidates.sort(key=lambda x: (-x["score"], x["ticker"]))
        
        top_k = config.get("top_k", 2)
        return candidates[:top_k]
