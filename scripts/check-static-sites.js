const fs = require('fs');
const path = require('path');

const roots = [
  path.join(__dirname, '..', 'sites', 'islandtech'),
  path.join(__dirname, '..', 'sites', 'mobilemeridian'),
];

const required = [
  'index.html',
  'styles.css',
];

let ok = true;

for (const root of roots) {
  for (const file of required) {
    const target = path.join(root, file);
    if (!fs.existsSync(target)) {
      console.error(`Missing ${target}`);
      ok = false;
    }
  }

  const htmlFiles = fs.readdirSync(root).filter((file) => file.endsWith('.html'));
  for (const file of htmlFiles) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const ref = match[1];
      if (/^(https?:|mailto:|tel:|#)/.test(ref)) continue;
      const local = path.join(root, ref);
      if (!fs.existsSync(local)) {
        console.error(`Broken local reference in ${path.join(root, file)}: ${ref}`);
        ok = false;
      }
    }
  }
}

if (!ok) process.exit(1);
console.log('Static site checks passed.');

