import React, { useState, useRef, useCallback } from 'react';

export interface ChartDataPoint {
  date: string;
  price: number;
  volume?: number;
}

export interface ChartStats {
  open?: number;
  high?: number;
  low?: number;
  prevClose?: number;
  marketCap?: string | number;
  peRatio?: number | string;
  volume?: number;
  week52High?: number;
  week52Low?: number;
}

interface InteractiveChartProps {
  companyName?: string;
  ticker?: string;
  data: ChartDataPoint[];
  timeframes?: string[];
  activeTimeframe?: string;
  onTimeframeChange?: (tf: string) => void;
  stats?: ChartStats;
  height?: number;
  showPercentageAxis?: boolean;
}

function fmtPrice(n?: number): string {
  if (n === undefined || n === null) return '—';
  if (n >= 1000) return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n.toFixed(2);
}

function fmtShort(n?: number | string): string {
  if (n === undefined || n === null) return '—';
  if (typeof n === 'string') return n;
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  companyName,
  ticker,
  data,
  timeframes = ['1M', '3M', '6M', '1Y', '5Y', 'MAX'],
  activeTimeframe = '1M',
  onTimeframeChange,
  stats,
  height = 220,
  showPercentageAxis = true,
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // ── Layout ─────────────────────────────────────────────────────────────────
  const PL = 58;   // left  — price labels
  const PR = showPercentageAxis ? 58 : 14;  // right — % labels
  const PT = 48;   // top   — space for floating tooltip
  const PB = 30;   // bottom— date labels
  const W  = 860;
  const H  = height + PT + PB;
  const PW = W - PL - PR;
  const PH = height;

  // ── Data ──────────────────────────────────────────────────────────────────
  const prices  = (data || []).map(d => d.price);
  const hasData = prices.length > 1;
  const first   = prices[0] ?? 0;
  const last    = prices[prices.length - 1] ?? first;
  const minP    = hasData ? Math.min(...prices) : 0;
  const maxP    = hasData ? Math.max(...prices) : 1;
  const range   = maxP - minP || 1;
  const isUp    = last >= first;
  const lineClr = isUp ? '#16A34A' : '#DC2626';

  const totalPct = first ? ((last - first) / first) * 100 : 0;

  // ── Points ─────────────────────────────────────────────────────────────────
  const pts = prices.map((p, i) => ({
    x:     PL + (i / Math.max(prices.length - 1, 1)) * PW,
    y:     PT + PH - ((p - minP) / range) * PH,
    price: p,
    date:  data[i]?.date ?? '',
    pct:   first ? ((p - first) / first) * 100 : 0,
    abs:   p - first,
  }));

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');
  const area     = `${PL},${PT + PH} ${polyline} ${PL + PW},${PT + PH}`;

  const active = hoverIdx !== null ? pts[hoverIdx] : pts[pts.length - 1];

  // ── Y ticks (5) ───────────────────────────────────────────────────────────
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const frac = i / 4;
    const val  = minP + frac * range;
    const y    = PT + PH - frac * PH;
    const pct  = first ? ((val - first) / first) * 100 : 0;
    return { val, y, pct };
  });

  // ── X ticks (5 dates) ─────────────────────────────────────────────────────
  const xCount = Math.min(5, prices.length);
  const xTicks = Array.from({ length: xCount }, (_, i) => {
    const idx = Math.round((i / (xCount - 1)) * (prices.length - 1));
    return pts[idx];
  }).filter(Boolean);

  // ── Floating tooltip clamp ─────────────────────────────────────────────────
  const ttW = 130;
  const ttH = 38;
  let ttX = (active?.x ?? 0) - ttW / 2;
  if (ttX < PL)         ttX = PL;
  if (ttX + ttW > W - PR) ttX = W - PR - ttW;
  const ttY = PT - ttH - 8;   // floats above the plot area

  // ── Mouse tracking ────────────────────────────────────────────────────────
  const handleMove = useCallback((e: React.MouseEvent<SVGSVGElement> | React.PointerEvent<SVGSVGElement>) => {
    const el = svgRef.current;
    if (!el || !hasData) return;
    const rect  = el.getBoundingClientRect();
    const mx    = (e as React.MouseEvent).clientX - rect.left;
    const svgX  = (mx / rect.width) * W;
    const cx    = Math.max(PL, Math.min(W - PR, svgX));
    const ratio = (cx - PL) / PW;
    const idx   = Math.round(ratio * (prices.length - 1));
    setHoverIdx(Math.max(0, Math.min(prices.length - 1, idx)));
  }, [hasData, prices.length, PL, PR, PW, W]);

  const handleLeave = () => setHoverIdx(null);

  // ── Empty ─────────────────────────────────────────────────────────────────
  if (!hasData) {
    return (
      <div className="w-full rounded-2xl bg-surface border border-[var(--border-color)] p-10 text-center">
        <p className="text-sm text-[var(--text-muted)] font-sans">No chart data available for this period.</p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full rounded-2xl bg-surface border border-[var(--border-color)] overflow-hidden select-none">

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <div className="px-6 pt-5 pb-1">
        {/* Company name + ticker */}
        {(companyName || ticker) && (
          <div className="flex items-baseline gap-2 mb-1">
            {companyName && (
              <span className="text-[15px] font-semibold text-[var(--text-main)] font-sans">
                {companyName}
              </span>
            )}
            {ticker && (
              <span className="text-[12px] text-[var(--text-muted)] font-sans">· {ticker}</span>
            )}
          </div>
        )}

        {/* Big price + change — updates live on hover */}
        <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1">
          <span className="text-[1.6rem] font-bold leading-none tracking-tight text-[var(--text-main)] font-sans">
            {fmtPrice(active?.price)}
          </span>
          <span
            className="text-[16px] font-semibold font-sans tabular-nums"
            style={{ color: (active?.abs ?? 0) >= 0 ? '#16A34A' : '#DC2626' }}
          >
            {(active?.abs ?? 0) >= 0 ? '+' : ''}{fmtPrice(active?.abs)}
            {' '}({(active?.pct ?? 0) >= 0 ? '+' : ''}{(active?.pct ?? 0).toFixed(2)}%)
          </span>
          {hoverIdx !== null && (
            <span className="text-[12px] text-[var(--text-muted)] font-sans ml-1">{active?.date}</span>
          )}
          {hoverIdx === null && (
            <span className="text-[12px] text-[var(--text-muted)] font-sans ml-1">
              Total return: {totalPct >= 0 ? '+' : ''}{totalPct.toFixed(2)}%
            </span>
          )}
        </div>
      </div>

      {/* ══ TIMEFRAME TABS ═══════════════════════════════════════════════════ */}
      <div className="flex items-center gap-0.5 px-5 pt-3 pb-1">
        {timeframes.map(tf => (
          <button
            key={tf}
            onClick={() => onTimeframeChange?.(tf)}
            className={[
              'px-3.5 py-1 rounded-full text-[13px] font-sans font-medium transition-all duration-150',
              activeTimeframe === tf
                ? 'bg-[var(--bg-card)] text-[var(--text-main)] font-semibold shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]/60',
            ].join(' ')}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* ══ SVG ══════════════════════════════════════════════════════════════ */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto cursor-crosshair touch-none overflow-visible"
        style={{ display: 'block' }}
        onMouseMove={handleMove}
        onPointerMove={handleMove}
        onMouseLeave={handleLeave}
        onPointerLeave={handleLeave}
      >
        <defs>
          <linearGradient id={`gf-fill-${isUp}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={lineClr} stopOpacity="0.22" />
            <stop offset="100%" stopColor={lineClr} stopOpacity="0.01" />
          </linearGradient>
          <clipPath id="gf-plot-clip">
            <rect x={PL} y={PT} width={PW} height={PH} />
          </clipPath>
        </defs>

        {/* ── Y-axis grid + left price labels + right % labels ── */}
        {yTicks.map((t, i) => (
          <g key={i}>
            {/* grid line */}
            <line
              x1={PL} y1={t.y} x2={PL + PW} y2={t.y}
              stroke="var(--border-color)" strokeWidth="0.7" strokeDasharray="4 4"
            />
            {/* left: price */}
            <text
              x={PL - 6} y={t.y + 4}
              textAnchor="end" fontSize="11"
              fontFamily="Inter, Roboto, system-ui, sans-serif"
              fill="var(--text-muted)"
            >
              {t.val >= 1000 ? `${(t.val / 1000).toFixed(1)}k` : t.val.toFixed(2)}
            </text>
            {/* right: percentage */}
            {showPercentageAxis && (
              <text
                x={PL + PW + 6} y={t.y + 4}
                textAnchor="start" fontSize="11" fontWeight="600"
                fontFamily="Inter, Roboto, system-ui, sans-serif"
                fill={t.pct >= 0 ? '#16A34A' : '#DC2626'}
              >
                {t.pct >= 0 ? '+' : ''}{t.pct.toFixed(1)}%
              </text>
            )}
          </g>
        ))}

        {/* ── X-axis date labels ── */}
        {xTicks.map((t, i) => (
          <text
            key={i}
            x={t.x} y={H - 6}
            textAnchor="middle" fontSize="11"
            fontFamily="Inter, Roboto, system-ui, sans-serif"
            fill="var(--text-muted)"
          >
            {t.date}
          </text>
        ))}

        {/* ── Area fill ── */}
        <polygon
          points={area}
          fill={`url(#gf-fill-${isUp})`}
          clipPath="url(#gf-plot-clip)"
        />

        {/* ── Line ── */}
        <polyline
          points={polyline}
          fill="none"
          stroke={lineClr}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          clipPath="url(#gf-plot-clip)"
        />

        {/* ── Hover overlay ── */}
        {hoverIdx !== null && active && (
          <g pointerEvents="none">
            {/* vertical dashed crosshair */}
            <line
              x1={active.x} y1={PT}
              x2={active.x} y2={PT + PH}
              stroke="var(--text-muted)"
              strokeWidth="1"
              strokeDasharray="5 4"
            />

            {/* floating tooltip pill — Google Finance style */}
            <rect
              x={ttX} y={ttY}
              width={ttW} height={ttH}
              rx="8"
              fill="var(--bg-card)"
              stroke="var(--border-color)"
              strokeWidth="1"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.18))' }}
            />
            <text
              x={ttX + ttW / 2} y={ttY + 15}
              textAnchor="middle" fontSize="13" fontWeight="700"
              fontFamily="Inter, Roboto, system-ui, sans-serif"
              fill="var(--text-main)"
            >
              {fmtPrice(active.price)}
            </text>
            <text
              x={ttX + ttW / 2} y={ttY + 30}
              textAnchor="middle" fontSize="10"
              fontFamily="Inter, Roboto, system-ui, sans-serif"
              fill="var(--text-muted)"
            >
              {active.date} · {active.pct >= 0 ? '+' : ''}{active.pct.toFixed(2)}%
            </text>

            {/* dot on line */}
            <circle
              cx={active.x} cy={active.y}
              r="5"
              fill={lineClr}
              stroke="var(--bg-surface)"
              strokeWidth="2.5"
            />
          </g>
        )}

        {/* transparent catch-all overlay */}
        <rect
          x="0" y="0" width={W} height={H}
          fill="transparent"
          style={{ pointerEvents: 'all' }}
          onMouseMove={handleMove as any}
          onPointerMove={handleMove as any}
        />
      </svg>

      {/* ══ STATS GRID — 3 columns like Google Finance ═══════════════════════ */}
      {stats && (
        <div className="grid grid-cols-3 divide-x divide-[var(--border-color)] border-t border-[var(--border-color)]">
          <div className="px-5 py-4 space-y-2.5">
            {[
              { label: 'Open', value: fmtPrice(stats.open) },
              { label: 'High', value: fmtPrice(stats.high) },
              { label: 'Low',  value: fmtPrice(stats.low)  },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-[13px] text-[var(--text-muted)] font-sans">{r.label}</span>
                <span className="text-[13px] font-semibold text-[var(--text-main)] font-sans tabular-nums">{r.value}</span>
              </div>
            ))}
          </div>

          <div className="px-5 py-4 space-y-2.5">
            {[
              { label: 'Mkt Cap',   value: fmtShort(stats.marketCap) },
              { label: 'P/E ratio', value: stats.peRatio !== undefined ? String(stats.peRatio) : '—' },
              { label: 'Volume',    value: stats.volume !== undefined ? `${(stats.volume / 1e6).toFixed(1)}M` : '—' },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-[13px] text-[var(--text-muted)] font-sans">{r.label}</span>
                <span className="text-[13px] font-semibold text-[var(--text-main)] font-sans tabular-nums">{r.value}</span>
              </div>
            ))}
          </div>

          <div className="px-5 py-4 space-y-2.5">
            {[
              { label: 'Prev close', value: fmtPrice(stats.prevClose)  },
              { label: '52W high',   value: fmtPrice(stats.week52High) },
              { label: '52W low',    value: fmtPrice(stats.week52Low)  },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-[13px] text-[var(--text-muted)] font-sans">{r.label}</span>
                <span className="text-[13px] font-semibold text-[var(--text-main)] font-sans tabular-nums">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveChart;
