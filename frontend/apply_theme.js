const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace Card structure
    content = content.replace(/<Card\s+title="([^"]+)"\s+subtitle="([^"]+)"\s*>/g, '<Card title={<span> <span className="font-mono text-[var(--success)] ml-2">Active</span></span>} subtitle="">');
    
    // Replace common bg/text generic classes that might look bad
    content = content.replace(/className="([^"]+)"/g, (match, p1) => {
        let cls = p1;
        cls = cls.replace(/\bbg-white\b/g, 'bg-[var(--bg-card)]');
        cls = cls.replace(/\btext-slate-900\b/g, 'text-[var(--text-main)]');
        cls = cls.replace(/\btext-slate-500\b/g, 'text-[var(--text-muted)]');
        return className="";
    });

    fs.writeFileSync(filePath, content, 'utf8');
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            processFile(fullPath);
        }
    }
}

walkDir(pagesDir);
console.log('Processed all 46 pages with new Card updates!');
