import React, { useEffect, useState } from 'react';

const mockSymbols = [
  ['NVDA', 788.17, 1], ['MSFT', 410.34, 1], ['TSLA', 197.40, -1],
  ['AAPL', 182.52, 1], ['AMD', 176.50, 1], ['SPX', 5088.80, 1],
  ['NDX', 17937.60, 1], ['DJI', 38989.84, -1]
] as [string, number, number][];

export const TickerTape: React.FC = () => {
  const [symbols, setSymbols] = useState(mockSymbols);

  useEffect(() => {
    const interval = setInterval(() => {
      setSymbols(current => 
        current.map(s => {
          let newPrice = s[1] + (Math.random() - 0.5) * 1.2;
          let newDir = s[2];
          if (Math.random() < 0.5) newDir = Math.random() > 0.5 ? 1 : -1;
          return [s[0], newPrice, newDir];
        })
      );
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const renderItems = () => (
    <>
      {symbols.map((s, idx) => (
        <span key={idx}>
          {s[0]} <b>${s[1].toFixed(2)}</b> 
          <span className={s[2] > 0 ? 'text-success' : 'text-danger'}>
            {s[2] > 0 ? '▲' : '▼'} {(Math.random() * 2).toFixed(2)}%
          </span>
        </span>
      ))}
    </>
  );

  return (
    <div className="ticker-wrap">
      <div className="ticker">
        {renderItems()}
        {renderItems()}
      </div>
    </div>
  );
};
