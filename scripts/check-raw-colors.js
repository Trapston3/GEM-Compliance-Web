const fs = require('fs');
const path = require('path');

const RAW_COLOR_PATTERNS = [
  /text-slate-\d+/, /bg-slate-\d+/, /border-slate-\d+/,
  /text-zinc-\d+/, /bg-zinc-\d+/, /border-zinc-\d+/,
  /text-gray-\d+/, /bg-gray-\d+/, /border-gray-\d+/,
];

const IGNORE_FILES = [
  'globals.css',
  'tokens.css',
];

function scanDir(dir, results = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath, results);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (IGNORE_FILES.some(ignore => file.includes(ignore))) continue;
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        for (const pattern of RAW_COLOR_PATTERNS) {
          if (pattern.test(line)) {
            results.push({
              file: fullPath,
              line: index + 1,
              content: line.trim(),
              pattern: pattern.toString(),
            });
          }
        }
      });
    }
  }
  return results;
}

const srcDir = path.join(__dirname, '..', 'src');
const violations = scanDir(srcDir);

if (violations.length === 0) {
  console.log('Zero raw Tailwind color class violations found! Design tokens enforced cleanly.');
  process.exit(0);
} else {
  console.log(`Found ${violations.length} raw Tailwind color class violations:`);
  violations.slice(0, 20).forEach(v => {
    console.log(`- ${v.file}:${v.line} -> ${v.content}`);
  });
  if (violations.length > 20) {
    console.log(`... and ${violations.length - 20} more violations.`);
  }
  process.exit(1);
}
