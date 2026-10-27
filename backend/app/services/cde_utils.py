from typing import Optional

def cde_score(exp_return: float, vol: float, div_benefit: float, momentum: float, fund_score_or_None: Optional[float], risk_level: int) -> float:
    """
    Pure function implementing the original CDE scoring logic from d5d28b7.
    """
    raw_w_ret = 0.25 + (risk_level - 3) * 0.1
    raw_w_vol = 0.25 - (risk_level - 3) * 0.1
    raw_w_div = 0.20 + (3 - risk_level) * 0.05
    raw_w_mom = 0.15 + (risk_level - 3) * 0.05
    raw_w_fund = 0.15
    
    n_ret = max(0.0, min(exp_return / 0.5, 1.0))
    n_vol = max(0.0, min(1.0 - (vol / 0.5), 1.0))
    n_div = max(0.0, min(div_benefit / 2.0, 1.0))
    n_mom = max(0.0, min((momentum + 0.2) / 0.4, 1.0))
    
    active_factors = [
        ("ret", raw_w_ret, n_ret),
        ("vol", raw_w_vol, n_vol),
        ("div", raw_w_div, n_div),
        ("mom", raw_w_mom, n_mom),
    ]
    
    if fund_score_or_None is not None:
        n_fund = fund_score_or_None / 100.0
        active_factors.append(("fund", raw_w_fund, n_fund))
        
    total_active_w = sum(w for _, w, _ in active_factors)
    if total_active_w > 0:
        total_score = sum((w / total_active_w) * val for _, w, val in active_factors) * 100.0
    else:
        total_score = 0.0
        
    return total_score
