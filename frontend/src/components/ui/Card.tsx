import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-surface border border-[var(--border-color)] rounded-[14px] p-[20px] transition-colors duration-200',
        className
      )}
      {...props}
    >
      {(title || subtitle || action) && (
        <h4 className="m-0 mb-[14px] text-[13px] text-[var(--text-muted)] font-semibold flex items-center justify-between normal-case border-b-0">
          <div>
            <span className="block text-[var(--text-main)] font-heading text-base font-bold mb-1">{title}</span>
            {subtitle && <span className="block text-[11px] font-mono mt-1 opacity-80">{subtitle}</span>}
          </div>
          {action && <div>{action}</div>}
        </h4>
      )}
      {children}
    </div>
  );
};
