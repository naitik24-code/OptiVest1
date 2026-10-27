import os
import re

pages_dir = 'src/pages'
skip_files = ['LandingPage.tsx', 'DashboardPage.tsx', 'AdminOverviewPage.tsx']

replacements = {
    r'bg-slate-900': r'bg-[var(--bg-main)]',
    r'bg-slate-800': r'bg-[var(--bg-surface)]',
    r'bg-white': r'bg-[var(--bg-main)]',
    r'text-slate-900': r'text-[var(--text-main)]',
    r'text-slate-500': r'text-[var(--text-muted)]',
    r'text-slate-400': r'text-[var(--text-muted)]',
    r'text-slate-50': r'text-[var(--text-main)]',
    r'text-white': r'text-[var(--text-main)]',
    r'border-slate-200': r'border-[var(--border-color)]',
    r'border-slate-800': r'border-[var(--border-color)]',
    r'border-gray-200': r'border-[var(--border-color)]',
    r'border-gray-800': r'border-[var(--border-color)]',
    r'text-blue-600': r'text-[var(--secondary)]',
    r'bg-blue-600': r'bg-[var(--secondary)]',
    r'text-green-600': r'text-[var(--success)]',
    r'text-red-600': r'text-[var(--danger)]',
    r'bg-blue-500': r'bg-[var(--primary)] text-[#08090b]',
    r'text-emerald-500': r'text-[var(--success)]',
    r'text-red-500': r'text-[var(--danger)]',
    r'text-\[\#2563EB\]': r'text-[var(--secondary)]',
    r'text-\[\#16A34A\]': r'text-[var(--success)]',
    r'text-\[\#DC2626\]': r'text-[var(--danger)]',
    r'text-\[\#F87171\]': r'text-[var(--danger)]',
    r'text-xs': r'text-[13px]',
    r'text-sm': r'text-[14px]',
    r'font-mono': r'font-mono',
}

for root, _, files in os.walk(pages_dir):
    for file in files:
        if file.endswith('.tsx') and file not in skip_files:
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            for pattern, repl in replacements.items():
                content = re.sub(pattern, repl, content)

            # Change table styling
            content = re.sub(
                r'<th className="p-3">', 
                r'<th className="text-left font-mono font-semibold text-[var(--text-muted)] text-[11px] p-[8px_6px] border-b border-[var(--border-color)]">',
                content
            )
            content = re.sub(
                r'<th className="p-3 text-right">', 
                r'<th className="text-right font-mono font-semibold text-[var(--text-muted)] text-[11px] p-[8px_6px] border-b border-[var(--border-color)]">',
                content
            )
            content = re.sub(
                r'<td className="p-3', 
                r'<td className="p-[11px_6px] border-b border-[var(--border-color)]',
                content
            )
            content = re.sub(
                r'<table className="w-full text-left text-xs font-mono">',
                r'<table className="w-full border-collapse text-[13px]">',
                content
            )

            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)

print("Applied Regex to all other pages!")
