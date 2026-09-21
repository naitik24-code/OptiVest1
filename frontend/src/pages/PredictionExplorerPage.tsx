import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Brain, TrendingUp, TrendingDown, RefreshCw, Zap } from 'lucide-react';

const ALGORITHMS = ['LSTM','GRU','XGBOOST','LIGHTGBM','RANDOM_FOREST','EXTRA_TREES','LINEAR_REGRESSION'];
const HORIZONS   = ['1D','5D','10D','20D','30D'];
const ASSETS     = ['AAPL','MSFT','GOOGL','AMZN','NVDA','TSLA','META'];

const getH = (): HeadersInit => { const t = localStorage.getItem('access_token'); return t ? { Authorization: `Bearer ${t}` } : {}; };
const DIR_COLOR = (d: string) => d === 'UP' ? 'text-emerald-400' : d === 'DOWN' ? 'text-red-400' : 'text-slate-400';

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
    <div className="space-y-6 max-w-7xl">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-400 uppercase tracking-wider mb-1">
          <Zap className="w-4 h-4" /><span>Module 8 · Prediction Engine</span>
        </div>
        <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">Prediction Explorer</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">Generate confidence-scored AI predictions for any asset and horizon.</p>
      </div>

      {/* Controls */}
      <Card className="p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1 block">Asset</label>
            <select value={asset} onChange={e => setAsset(e.target.value)} className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]">
              {ASSETS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1 block">Horizon</label>
            <select value={horizon} onChange={e => setHorizon(e.target.value)} className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]">
              {HORIZONS.map(h => <option key={h}>{h}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1 block">Algorithm</label>
            <select value={algorithm} onChange={e => setAlgorithm(e.target.value)} className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]">
              {ALGORITHMS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex flex-col justify-end gap-2">
            <button onClick={runSingle} disabled={loading} className="px-4 py-2 bg-[#2563EB] hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all">
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
              Predict
            </button>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={runMultiModel} disabled={loading} className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all">
            Multi-Model + Ensemble
          </button>
          <button onClick={runBatch} disabled={loading} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all">
            Batch ({ASSETS.length} Assets)
          </button>
        </div>
      </Card>

      {/* Single Prediction Result */}
      {prediction && (
        <Card className="p-5 border-[var(--border-color)] bg-gradient-to-r from-slate-900/50 to-slate-950/50">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-lg font-extrabold text-[var(--text-main)]">{prediction.asset_symbol}</div>
              <div className="text-xs text-[var(--text-muted)]">{prediction.algorithm} · {prediction.prediction_horizon} · {prediction.model_version}</div>
            </div>
            <div className={`text-2xl font-extrabold font-mono ${DIR_COLOR(prediction.predicted_direction)}`}>
              {prediction.predicted_direction === 'UP' ? <TrendingUp className="w-8 h-8" /> : <TrendingDown className="w-8 h-8" />}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {l:'Expected Return', v:`${(prediction.predicted_return * 100).toFixed(3)}%`, c: prediction.predicted_return >= 0 ? 'text-emerald-400' : 'text-red-400'},
              {l:'Confidence', v:`${(prediction.confidence_score * 100).toFixed(1)}%`, c:'text-blue-400'},
              {l:'Risk Score', v:`${(prediction.risk_score * 100).toFixed(1)}%`, c:'text-amber-400'},
              {l:'Prob UP', v:`${(prediction.probability_up * 100).toFixed(1)}%`, c:'text-emerald-400'},
            ].map(item => (
              <div key={item.l} className="bg-[var(--bg-main)] rounded-lg p-3 text-center">
                <div className={`text-xl font-extrabold font-mono ${item.c}`}>{item.v}</div>
                <div className="text-[9px] uppercase font-bold text-[var(--text-muted)]">{item.l}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 px-3 py-2 bg-slate-800/60 rounded text-xs text-slate-300 font-mono">
            <span className="text-purple-400 font-bold">{prediction.reason_code}</span> — {prediction.reason_description}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-[var(--text-muted)]">
            <span>CI: [{(prediction.confidence_interval_low * 100).toFixed(2)}%, {(prediction.confidence_interval_high * 100).toFixed(2)}%]</span>
            <span>Signal Strength: {prediction.signal_strength?.toFixed(3)}</span>
            <span>Actionable: <span className={prediction.is_actionable ? 'text-emerald-400' : 'text-red-400'}>{prediction.is_actionable ? 'YES' : 'NO'}</span></span>
          </div>
        </Card>
      )}

      {/* Multi-Model + Ensemble */}
      {multiPred && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="lg:col-span-2 p-5 space-y-3">
            <h3 className="text-sm font-bold text-[var(--text-main)] border-b border-[var(--border-color)] pb-2">Individual Algorithm Predictions</h3>
            {(multiPred.individual_predictions || []).map((p: any) => (
              <div key={p.model_id} className="flex items-center justify-between py-1.5 border-b border-[var(--border-color)]/40">
                <span className="text-xs font-mono text-[var(--text-main)] w-36">{p.algorithm}</span>
                <span className={`text-xs font-bold ${DIR_COLOR(p.predicted_direction)}`}>{p.predicted_direction}</span>
                <span className="text-xs font-mono text-[var(--text-main)]">{(p.predicted_return * 100).toFixed(3)}%</span>
                <div className="w-20 bg-[var(--bg-main)] rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{width: `${p.confidence_score * 100}%`}} />
                </div>
                <span className="text-[11px] text-[var(--text-muted)]">{(p.confidence_score * 100).toFixed(1)}%</span>
              </div>
            ))}
          </Card>
          <Card className="p-5 bg-gradient-to-b from-purple-900/20 to-slate-950/50 border-purple-700/30">
            <h3 className="text-sm font-bold text-purple-300 mb-3">Ensemble Prediction</h3>
            {multiPred.ensemble_prediction && (
              <div className="space-y-3">
                <div className={`text-3xl font-extrabold font-mono text-center ${DIR_COLOR(multiPred.ensemble_prediction.predicted_direction)}`}>
                  {multiPred.ensemble_prediction.predicted_direction}
                </div>
                <div className="text-center text-lg font-mono text-[var(--text-main)]">
                  {(multiPred.ensemble_prediction.predicted_return * 100).toFixed(3)}%
                </div>
                <div className="text-center text-xs text-[var(--text-muted)]">
                  Agreement: {((multiPred.ensemble_prediction.model_agreement || 0) * 100).toFixed(1)}%
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Batch Results */}
      {batchResults.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-bold text-[var(--text-main)] mb-3 border-b border-[var(--border-color)] pb-2">
            Batch Predictions — {algorithm} · {horizon}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {batchResults.map((p: any) => (
              <div key={p.asset_symbol} className="bg-[var(--bg-main)] rounded-lg p-3 border border-[var(--border-color)]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-[var(--text-main)]">{p.asset_symbol}</span>
                  <span className={`text-xs font-bold ${DIR_COLOR(p.predicted_direction)}`}>{p.predicted_direction}</span>
                </div>
                <div className={`text-lg font-mono font-bold ${p.predicted_return >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {(p.predicted_return * 100).toFixed(3)}%
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-[var(--text-muted)]">
                  <span>Conf: {(p.confidence_score * 100).toFixed(1)}%</span>
                  <span>Risk: {(p.risk_score * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
export default PredictionExplorerPage;
