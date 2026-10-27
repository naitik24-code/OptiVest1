import React, { useState } from 'react';
import { Brain, TrendingUp, TrendingDown, RefreshCw, Zap } from 'lucide-react';

const ALGORITHMS = ['LSTM','GRU','XGBOOST','LIGHTGBM','RANDOM_FOREST','EXTRA_TREES','LINEAR_REGRESSION'];
const HORIZONS   = ['1D','5D','10D','20D','30D'];
const ASSETS     = ['AAPL','MSFT','GOOGL','AMZN','NVDA','TSLA','META'];

const getH = (): HeadersInit => { const t = localStorage.getItem('access_token'); return t ? { Authorization: `Bearer ${t}` } : {}; };
const DIR_COLOR = (d: string) => d === 'UP' ? 'text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.3)]' : d === 'DOWN' ? 'text-[var(--danger)] drop-shadow-[0_0_5px_rgba(255,74,99,0.3)]' : 'text-[var(--text-muted)]';

export const PredictionExplorerPage: React.FC = () => {
  const [asset, setAsset] = useState('AAPL');
  const [horizon, setHorizon] = useState('5D');
  const [algorithm, setAlgorithm] = useState('LSTM');
  const [prediction, setPrediction] = useState<any>(null);
  const [multiPred, setMultiPred] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [batchResults, setBatchResults] = useState<any[]>([]);

  const runSingle = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/v1/ai/predict?asset_symbol=${asset}&prediction_horizon=${horizon}&algorithm=${algorithm}`, { headers: getH() });
      if (r.ok) setPrediction(await r.json());
    } catch (_) {}
    setLoading(false);
  };

  const runMultiModel = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/v1/ai/predict/multi-model?asset_symbol=${asset}&prediction_horizon=${horizon}`, { headers: getH() });
      if (r.ok) setMultiPred(await r.json());
    } catch (_) {}
    setLoading(false);
  };

  const runBatch = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/v1/ai/predict/batch?assets=${ASSETS.join(',')}&prediction_horizon=${horizon}&algorithm=${algorithm}`, { headers: getH() });
      if (r.ok) { const d = await r.json(); setBatchResults(d.predictions || []); }
    } catch (_) {}
    setLoading(false);
  };

  return (
    <div className="max-w-[1120px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[#a855f7] uppercase tracking-wider mb-1">
            <Zap className="w-4 h-4" />
            <span>Module 8 &bull; Prediction Engine</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
            Prediction Explorer
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">
            Generate confidence-scored AI predictions for any asset and horizon.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="inst-card p-[24px]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[16px] mb-[20px]">
          <div>
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Asset</label>
            <select value={asset} onChange={e => setAsset(e.target.value)} className="w-full bg-background border border-[var(--border-color)] rounded-[8px] px-[14px] py-[12px] text-[13px] font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-[#a855f7] transition-colors cursor-pointer">
              {ASSETS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Horizon</label>
            <select value={horizon} onChange={e => setHorizon(e.target.value)} className="w-full bg-background border border-[var(--border-color)] rounded-[8px] px-[14px] py-[12px] text-[13px] font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-[#a855f7] transition-colors cursor-pointer">
              {HORIZONS.map(h => <option key={h}>{h}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Algorithm</label>
            <select value={algorithm} onChange={e => setAlgorithm(e.target.value)} className="w-full bg-background border border-[var(--border-color)] rounded-[8px] px-[14px] py-[12px] text-[13px] font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-[#a855f7] transition-colors cursor-pointer">
              {ALGORITHMS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex flex-col justify-end gap-2">
            <button onClick={runSingle} disabled={loading} className="px-4 py-[14px] bg-[var(--primary)] hover:bg-[#ff7a45] disabled:opacity-50 text-[#050608] shadow-[0_0_15px_rgba(255,90,31,0.3)] text-[13px] font-bold font-mono tracking-wider rounded-[8px] flex items-center justify-center gap-2 transition-all cursor-pointer">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin fill-current" /> : <Brain className="w-4 h-4 fill-current" />}
              Predict
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-[12px] pt-[20px] border-t border-[var(--border-color)]">
          <button onClick={runMultiModel} disabled={loading} className="px-[16px] py-[10px] bg-[#a855f7]/10 hover:bg-[#a855f7]/20 border border-[#a855f7]/30 disabled:opacity-50 text-[#a855f7] shadow-[0_0_15px_rgba(168,85,247,0.1)] text-[11px] font-mono font-bold uppercase tracking-wider rounded-[6px] transition-all cursor-pointer">
            Multi-Model + Ensemble
          </button>
          <button onClick={runBatch} disabled={loading} className="px-[16px] py-[10px] bg-[var(--surface2)] hover:border-[var(--text-muted)] border border-[var(--border-color)] disabled:opacity-50 text-[var(--text-main)] text-[11px] font-mono font-bold uppercase tracking-wider rounded-[6px] transition-all cursor-pointer">
            Batch ({ASSETS.length} Assets)
          </button>
        </div>
      </div>

      {/* Single Prediction Result */}
      {prediction && (
        <div className="inst-card p-[32px] border-l-4 border-l-[var(--primary)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-[200px] h-[200px] bg-[radial-gradient(ellipse_at_top_left,rgba(255,90,31,0.1)_0%,rgba(0,0,0,0)_60%)] pointer-events-none" />
          
          <div className="flex items-start justify-between mb-8 z-10 relative">
            <div>
              <div className="text-[28px] font-extrabold font-heading text-[var(--text-main)] drop-shadow-sm">{prediction.asset_symbol}</div>
              <div className="text-[12px] font-mono text-[var(--text-muted)] uppercase tracking-wider mt-1">
                {prediction.algorithm} &bull; {prediction.prediction_horizon} &bull; {prediction.model_version}
              </div>
            </div>
            <div className={`text-[42px] font-extrabold font-mono ${DIR_COLOR(prediction.predicted_direction)}`}>
              {prediction.predicted_direction === 'UP' ? <TrendingUp className="w-10 h-10 drop-shadow-[0_0_8px_rgba(23,217,140,0.4)]" /> : <TrendingDown className="w-10 h-10 drop-shadow-[0_0_8px_rgba(255,74,99,0.4)]" />}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-[20px] z-10 relative">
            {[
              {l:'Expected Return', v:`${(prediction.predicted_return * 100).toFixed(3)}%`, c: prediction.predicted_return >= 0 ? 'text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.3)]' : 'text-[var(--danger)] drop-shadow-[0_0_5px_rgba(255,74,99,0.3)]'},
              {l:'Confidence', v:`${(prediction.confidence_score * 100).toFixed(1)}%`, c:'text-[var(--secondary)] drop-shadow-[0_0_5px_rgba(76,139,255,0.3)]'},
              {l:'Risk Score', v:`${(prediction.risk_score * 100).toFixed(1)}%`, c:'text-[#eab308] drop-shadow-[0_0_5px_rgba(234,179,8,0.3)]'},
              {l:'Prob UP', v:`${(prediction.probability_up * 100).toFixed(1)}%`, c:'text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.3)]'},
            ].map(item => (
              <div key={item.l} className="bg-background border border-[var(--border-color)] rounded-[8px] p-[20px] flex flex-col items-center justify-center transition-colors hover:border-[var(--primary)]/30">
                <div className={`text-[24px] font-extrabold font-mono ${item.c} mb-2 leading-none`}>{item.v}</div>
                <div className="text-[10px] uppercase tracking-wider font-bold font-mono text-[var(--text-muted)]">{item.l}</div>
              </div>
            ))}
          </div>

          <div className="mt-[24px] px-[20px] py-[16px] bg-background border border-[var(--border-color)] rounded-[8px] text-[13px] text-[var(--text-main)] font-mono z-10 relative">
            <span className="text-[#a855f7] font-extrabold mr-3 drop-shadow-[0_0_5px_rgba(168,85,247,0.3)]">{prediction.reason_code}</span>
            <span className="text-[var(--text-muted)]">— {prediction.reason_description}</span>
          </div>

          <div className="mt-[16px] grid grid-cols-1 sm:grid-cols-3 gap-[16px] text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] z-10 relative">
            <div className="bg-background px-[12px] py-[8px] rounded-[6px] border border-[var(--border-color)] text-center">
              CI: [{(prediction.confidence_interval_low * 100).toFixed(2)}%, {(prediction.confidence_interval_high * 100).toFixed(2)}%]
            </div>
            <div className="bg-background px-[12px] py-[8px] rounded-[6px] border border-[var(--border-color)] text-center">
              Signal Strength: <span className="text-[var(--text-main)]">{prediction.signal_strength?.toFixed(3)}</span>
            </div>
            <div className="bg-background px-[12px] py-[8px] rounded-[6px] border border-[var(--border-color)] text-center">
              Actionable: <span className={prediction.is_actionable ? 'text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.3)]' : 'text-[var(--danger)] drop-shadow-[0_0_5px_rgba(255,74,99,0.3)]'}>{prediction.is_actionable ? 'YES' : 'NO'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Model + Ensemble */}
      {multiPred && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="inst-card p-[24px] lg:col-span-2">
            <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] border-b border-[var(--border-color)] pb-4 mb-4">
              Individual Algorithm Predictions
            </h3>
            <div className="space-y-[8px]">
              {(multiPred.individual_predictions || []).map((p: any) => (
                <div key={p.model_id} className="flex items-center justify-between p-[12px] bg-background rounded-[6px] border border-[var(--border-color)] hover:border-[var(--primary)]/30 transition-colors">
                  <span className="text-[13px] font-mono font-bold text-[var(--text-main)] w-36 uppercase tracking-wider">{p.algorithm}</span>
                  <span className={`text-[13px] font-extrabold font-mono tracking-wider ${DIR_COLOR(p.predicted_direction)}`}>{p.predicted_direction}</span>
                  <span className="text-[14px] font-mono font-bold text-[var(--text-main)] w-24 text-right">{(p.predicted_return * 100).toFixed(3)}%</span>
                  
                  <div className="w-[100px] mx-4 bg-surface rounded-full h-[6px] overflow-hidden border border-[var(--border-color)]">
                    <div className="h-full bg-[var(--primary)] text-[#08090b] rounded-full shadow-[0_0_5px_rgba(255,90,31,0.5)]" style={{width: `${p.confidence_score * 100}%`}} />
                  </div>
                  <span className="text-[12px] font-mono font-bold text-[var(--text-muted)] w-12 text-right">{(p.confidence_score * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="inst-card p-[32px] bg-gradient-to-b from-[#a855f7]/10 to-[#050608] border-t-4 border-t-[#a855f7] shadow-[0_0_20px_rgba(168,85,247,0.1)] flex flex-col justify-center items-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.2)_0%,rgba(0,0,0,0)_60%)] pointer-events-none" />
             
            <h3 className="text-[12px] font-bold font-mono uppercase tracking-wider text-[#a855f7] mb-[24px] z-10 relative">
              Ensemble Prediction
            </h3>
            {multiPred.ensemble_prediction && (
              <div className="space-y-[16px] w-full z-10 relative">
                <div className={`text-[48px] font-extrabold font-mono text-center leading-none ${DIR_COLOR(multiPred.ensemble_prediction.predicted_direction)}`}>
                  {multiPred.ensemble_prediction.predicted_direction}
                </div>
                <div className="text-center text-[24px] font-extrabold font-mono text-[var(--text-main)]">
                  {(multiPred.ensemble_prediction.predicted_return * 100).toFixed(3)}%
                </div>
                <div className="text-center bg-background border border-[var(--border-color)] rounded-[6px] py-[8px] mt-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-[var(--text-muted)]">Agreement</span>
                  <div className="text-[14px] font-bold font-mono text-[var(--text-main)] mt-1">
                    {((multiPred.ensemble_prediction.model_agreement || 0) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Batch Results */}
      {batchResults.length > 0 && (
        <div className="inst-card p-[24px]">
          <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] mb-[24px] border-b border-[var(--border-color)] pb-4 flex justify-between items-center">
            <span>Batch Predictions</span>
            <span className="text-[11px] font-mono text-[var(--text-muted)] px-3 py-1 bg-background border border-[var(--border-color)] rounded-[4px]">{algorithm} &bull; {horizon}</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px]">
            {batchResults.map((p: any) => (
              <div key={p.asset_symbol} className="bg-background rounded-[8px] p-[16px] border border-[var(--border-color)] hover:border-[var(--primary)]/30 transition-colors group">
                <div className="flex justify-between items-center mb-[12px]">
                  <span className="text-[16px] font-extrabold font-heading text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors">{p.asset_symbol}</span>
                  <span className={`text-[12px] font-extrabold font-mono tracking-wider ${DIR_COLOR(p.predicted_direction)}`}>{p.predicted_direction}</span>
                </div>
                <div className={`text-[24px] font-extrabold font-mono leading-none mb-[16px] ${p.predicted_return >= 0 ? 'text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.2)]' : 'text-[var(--danger)] drop-shadow-[0_0_5px_rgba(255,74,99,0.2)]'}`}>
                  {(p.predicted_return * 100).toFixed(3)}%
                </div>
                <div className="flex justify-between mt-1 text-[10px] font-bold font-mono uppercase tracking-wider text-[var(--text-muted)] border-t border-[var(--border-color)] pt-3">
                  <span>Conf: {(p.confidence_score * 100).toFixed(1)}%</span>
                  <span>Risk: {(p.risk_score * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default PredictionExplorerPage;
