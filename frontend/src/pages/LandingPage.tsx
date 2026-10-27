import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/shared/Navbar';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-[var(--text-main)] flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      <section className="pt-[70px] pb-[90px] px-[22px]">
        <div className="max-w-[1120px] mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-[46px] items-center">
          <div>
            <div className="font-mono text-[12px] text-[var(--primary)] flex items-center gap-[8px] mb-[18px] font-bold tracking-wider">
              <span className="w-[16px] h-[1px] bg-[var(--primary)] block"></span>
              ADAPTIVE PORTFOLIO DECISION ENGINE
            </div>
            <h1 className="text-[clamp(2.4rem,6vw,4.4rem)] leading-[0.98] font-bold tracking-[-0.03em] m-0 mb-[20px] font-heading">
              Your portfolio,<br />
              thinking <em className="not-italic text-[var(--primary)] font-heading drop-shadow-[0_0_15px_rgba(255,90,31,0.3)]">for itself.</em>
            </h1>
            <p className="text-[var(--text-muted)] text-[16px] leading-[1.6] max-w-[46ch] m-0 mb-[28px] font-mono">
              OptiVest reallocates, hedges, and explains every move in real time &mdash; bounded by the risk limits you set, never the other way around.
            </p>
            <div className="flex gap-[12px] flex-wrap">
              <Link to="/register">
                <button className="cursor-pointer px-[24px] py-[14px] rounded-[8px] font-bold text-[14px] transition-all bg-[var(--primary)] text-[#08090b] hover:bg-[#ff713b] hover:-translate-y-[1px] shadow-[0_0_15px_rgba(255,90,31,0.2)]">
                  Open an account
                </button>
              </Link>
              <Link to="/login">
                <button className="cursor-pointer px-[24px] py-[14px] rounded-[8px] font-bold text-[14px] transition-all border border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--primary)] hover:text-[var(--primary)]">
                  See it live
                </button>
              </Link>
            </div>
          </div>

          <div className="inst-card p-[24px] relative overflow-hidden pulse-card shadow-[0_0_30px_rgba(255,90,31,0.05)] border-[rgba(255,90,31,0.2)]">
            <div className="flex justify-between items-baseline mb-[4px]">
              <div>
                <div className="text-[12px] text-[var(--text-muted)] font-mono uppercase tracking-wider font-bold">AI Portfolio &bull; Live</div>
                <div className="font-mono text-[34px] font-bold mt-1 text-[var(--text-main)] drop-shadow-[0_0_10px_rgba(255,90,31,0.15)]" id="pv">$1,248,950</div>
              </div>
              <div className="font-mono text-[14px] font-bold text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.5)]">&#9650; +1.15%</div>
            </div>
            
            <svg className="w-full h-[120px] block mt-[14px]" viewBox="0 0 400 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity=".25" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon className="chart-fill transition-all duration-1000" points="0,110 0,80 40,86 80,60 120,68 160,42 200,50 240,28 280,36 320,18 360,24 400,8 400,120 0,120" fill="url(#g1)" />
              <polyline className="chart-path transition-all duration-1000" stroke="var(--primary)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" points="0,80 40,86 80,60 120,68 160,42 200,50 240,28 280,36 320,18 360,24 400,8" />
            </svg>
          </div>
        </div>
      </section>

      <section className="pt-0 pb-[64px] px-[22px]">
        <div className="max-w-[1120px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-[var(--border-color)] border border-[var(--border-color)] rounded-[12px] overflow-hidden mt-[72px]">
            <div className="bg-background hover:bg-[var(--surface2)] transition-colors p-[30px_20px] text-center md:text-left">
              <div className="font-mono text-[32px] font-extrabold text-[var(--primary)] drop-shadow-[0_0_8px_rgba(255,90,31,0.2)]">2.48</div>
              <div className="text-[12px] font-mono text-[var(--text-muted)] mt-[6px] uppercase tracking-wider font-bold">Sharpe ratio, trailing 12mo</div>
            </div>
            <div className="bg-background hover:bg-[var(--surface2)] transition-colors p-[30px_20px] text-center md:text-left">
              <div className="font-mono text-[32px] font-extrabold text-[var(--primary)] drop-shadow-[0_0_8px_rgba(255,90,31,0.2)]">15%</div>
              <div className="text-[12px] font-mono text-[var(--text-muted)] mt-[6px] uppercase tracking-wider font-bold">Max reallocation cap (C_realloc)</div>
            </div>
            <div className="bg-background hover:bg-[var(--surface2)] transition-colors p-[30px_20px] text-center md:text-left">
              <div className="font-mono text-[32px] font-extrabold text-[var(--primary)] drop-shadow-[0_0_8px_rgba(255,90,31,0.2)]">&lt;15ms</div>
              <div className="text-[12px] font-mono text-[var(--text-muted)] mt-[6px] uppercase tracking-wider font-bold">Decision latency</div>
            </div>
          </div>

          <div className="mt-[72px]">
            <h2 className="text-[26px] tracking-[-0.02em] m-0 mb-[8px] font-heading font-bold text-[var(--text-main)]">Three governed steps, continuously</h2>
            <p className="text-[var(--text-muted)] text-[14px] font-mono m-0 mb-[32px]">Nothing moves outside the bounds you set at onboarding.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px] mt-[20px]">
              <div className="inst-card p-[24px] transition-transform duration-300 hover:-translate-y-[4px]">
                <div className="w-[40px] h-[40px] rounded-[10px] bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-mono font-bold mb-5 border border-[var(--primary)]/20 shadow-[0_0_10px_rgba(255,90,31,0.1)]">01</div>
                <h3 className="text-[16px] font-bold mb-[10px] font-heading text-[var(--text-main)]">Read the regime</h3>
                <p className="text-[13px] text-[var(--text-muted)] leading-[1.6] m-0 font-mono">Volatility, momentum and macro signals are scored every session, across every held asset.</p>
              </div>
              <div className="inst-card p-[24px] transition-transform duration-300 hover:-translate-y-[4px]">
                <div className="w-[40px] h-[40px] rounded-[10px] bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-mono font-bold mb-5 border border-[var(--primary)]/20 shadow-[0_0_10px_rgba(255,90,31,0.1)]">02</div>
                <h3 className="text-[16px] font-bold mb-[10px] font-heading text-[var(--text-main)]">Propose a shift</h3>
                <p className="text-[13px] text-[var(--text-muted)] leading-[1.6] m-0 font-mono">A bounded reallocation is proposed &mdash; capped by your C_realloc and risk penalty &lambda;, never exceeding them.</p>
              </div>
              <div className="inst-card p-[24px] transition-transform duration-300 hover:-translate-y-[4px]">
                <div className="w-[40px] h-[40px] rounded-[10px] bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-mono font-bold mb-5 border border-[var(--primary)]/20 shadow-[0_0_10px_rgba(255,90,31,0.1)]">03</div>
                <h3 className="text-[16px] font-bold mb-[10px] font-heading text-[var(--text-main)]">Explain the why</h3>
                <p className="text-[13px] text-[var(--text-muted)] leading-[1.6] m-0 font-mono">Every trade ships with a plain-language reason: why this asset, why now, why this size.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <footer className="mt-auto border-t border-[var(--border-color)] p-[30px_22px] text-center text-[var(--text-muted)] text-[11px] font-mono font-bold tracking-wider uppercase">
        OptiVest AI &mdash; Institutional Portfolio Intelligence
      </footer>
    </div>
  );
};

export default LandingPage;
