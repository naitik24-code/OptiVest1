import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Cpu, ShieldCheck, Database, Sliders, Play, CheckCircle2 } from 'lucide-react';


interface AIConfig {
  config_name: string;
  prediction_horizon: string;
  prediction_frequency: string;
  confidence_threshold: number;
  min_training_samples: number;
  training_frequency: string;
  feature_selection_strategy: string;
  algorithm_selection: string;
  validation_split: number;
  test_split: number;
  early_stopping: boolean;
  random_seed: number;
  gpu_enable_flag: boolean;
  model_auto_deployment: boolean;
}

export const AIConfigurationPage: React.FC = () => {
  const [config, setConfig] = useState<AIConfig>({
    config_name: 'DEFAULT_CONFIG',
    prediction_horizon: '30 Days',
    prediction_frequency: 'DAILY',
    confidence_threshold: 0.85,
    min_training_samples: 1000,
    training_frequency: 'WEEKLY',
    feature_selection_strategy: 'SHAP_TOP_K',
    algorithm_selection: 'LSTM',
    validation_split: 0.15,
    test_split: 0.15,
    early_stopping: true,
    random_seed: 42,
    gpu_enable_flag: false,
    model_auto_deployment: false,
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token') || '';
    fetch('/api/v1/ai-infra/config', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data && data.config_name) {
          setConfig(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = () => {
    setSaved(false);
    const params = new URLSearchParams({
      prediction_horizon: config.prediction_horizon,
      prediction_frequency: config.prediction_frequency,
      confidence_threshold: config.confidence_threshold.toString(),
      min_training_samples: config.min_training_samples.toString(),
      training_frequency: config.training_frequency,
      feature_selection_strategy: config.feature_selection_strategy,
      algorithm_selection: config.algorithm_selection,
      validation_split: config.validation_split.toString(),
      test_split: config.test_split.toString(),
      early_stopping: config.early_stopping.toString(),
      random_seed: config.random_seed.toString(),
      gpu_enable_flag: config.gpu_enable_flag.toString(),
      model_auto_deployment: config.model_auto_deployment.toString(),
    });

    const token = localStorage.getItem('access_token') || '';
    fetch(`/api/v1/ai-infra/config?${params.toString()}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data && data.config_name) {
          setConfig(data);
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        }
      });
  };

  if (loading) {
    return <div className="p-8 text-center text-[var(--text-muted)]">Loading AI Configuration Engine...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#0EA5E9] uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4" />
            <span>Module 1 &bull; Centralized AI Infrastructure</span>
          </div>
          <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">
            AI Configuration Engine
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Centralized hyperparameters, prediction horizons, algorithm selections, and hardware policies.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-2 transition-all"
        >
          {saved ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Sliders className="w-4 h-4" />}
          <span>{saved ? 'Configuration Saved' : 'Save Parameters'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Prediction & Frequency Controls */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-main)] border-b border-[var(--border-color)] pb-3">
            <Play className="w-4 h-4 text-[#0EA5E9]" />
            <span>Prediction Horizons &amp; Frequency</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Prediction Horizon</label>
              <select
                value={config.prediction_horizon}
                onChange={(e) => setConfig({ ...config, prediction_horizon: e.target.value })}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
              >
                {['1 Day', '5 Days', '30 Days', '90 Days', '180 Days', '365 Days'].map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Prediction Frequency</label>
              <select
                value={config.prediction_frequency}
                onChange={(e) => setConfig({ ...config, prediction_frequency: e.target.value })}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
              >
                {['REALTIME', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'].map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                Confidence Threshold ({Math.round(config.confidence_threshold * 100)}%)
              </label>
              <input
                type="range"
                min="0.5"
                max="0.99"
                step="0.01"
                value={config.confidence_threshold}
                onChange={(e) => setConfig({ ...config, confidence_threshold: parseFloat(e.target.value) })}
                className="w-full accent-[#2563EB]"
              />
            </div>
          </div>
        </Card>

        {/* Algorithm & Feature Selection */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-main)] border-b border-[var(--border-color)] pb-3">
            <Cpu className="w-4 h-4 text-[#16A34A]" />
            <span>Algorithm &amp; Feature Strategy</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Algorithm Selection</label>
              <select
                value={config.algorithm_selection}
                onChange={(e) => setConfig({ ...config, algorithm_selection: e.target.value })}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
              >
                {['LSTM', 'XGBOOST', 'TRANSFORMER', 'RANDOM_FOREST', 'ENSEMBLE_APDE'].map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Feature Selection Strategy</label>
              <select
                value={config.feature_selection_strategy}
                onChange={(e) => setConfig({ ...config, feature_selection_strategy: e.target.value })}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
              >
                {['SHAP_TOP_K', 'MUTUAL_INFORMATION', 'LASSO_REGULARIZED', 'ALL_ENGINEERED_FEATURES'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Minimum Training Samples</label>
              <input
                type="number"
                value={config.min_training_samples}
                onChange={(e) => setConfig({ ...config, min_training_samples: parseInt(e.target.value) || 1000 })}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>
        </Card>

        {/* Validation Splits & Reproducibility */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-main)] border-b border-[var(--border-color)] pb-3">
            <Database className="w-4 h-4 text-purple-400" />
            <span>Dataset Splits &amp; Random Seeds</span>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Validation Split</label>
                <input
                  type="number"
                  step="0.05"
                  value={config.validation_split}
                  onChange={(e) => setConfig({ ...config, validation_split: parseFloat(e.target.value) || 0.15 })}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Test Split</label>
                <input
                  type="number"
                  step="0.05"
                  value={config.test_split}
                  onChange={(e) => setConfig({ ...config, test_split: parseFloat(e.target.value) || 0.15 })}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Deterministic Random Seed</label>
              <input
                type="number"
                value={config.random_seed}
                onChange={(e) => setConfig({ ...config, random_seed: parseInt(e.target.value) || 42 })}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>
        </Card>

        {/* Hardware & Auto-Deployment Policies */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-main)] border-b border-[var(--border-color)] pb-3">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Hardware Acceleration &amp; Deployment</span>
          </div>

          <div className="space-y-4 pt-2">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-semibold text-[var(--text-main)]">Early Stopping Enforcement</span>
              <input
                type="checkbox"
                checked={config.early_stopping}
                onChange={(e) => setConfig({ ...config, early_stopping: e.target.checked })}
                className="accent-[#2563EB] w-4 h-4 rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-semibold text-[var(--text-main)]">GPU Compute Acceleration</span>
              <input
                type="checkbox"
                checked={config.gpu_enable_flag}
                onChange={(e) => setConfig({ ...config, gpu_enable_flag: e.target.checked })}
                className="accent-[#2563EB] w-4 h-4 rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-semibold text-[var(--text-main)]">Automated Model Production Deployment</span>
              <input
                type="checkbox"
                checked={config.model_auto_deployment}
                onChange={(e) => setConfig({ ...config, model_auto_deployment: e.target.checked })}
                className="accent-[#2563EB] w-4 h-4 rounded"
              />
            </label>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AIConfigurationPage;
