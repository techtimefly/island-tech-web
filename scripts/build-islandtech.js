const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const source = path.join(root, 'sites', 'islandtech');
const output = path.join(root, 'dist', 'islandtech');
const placeholder = 'YOUR_WEB3FORMS_ACCESS_KEY';
const accessKey = (process.env.WEB3FORMS_ACCESS_KEY || '').trim();
const requireKey = process.env.REQUIRE_WEB3FORMS_KEY === '1';

if (requireKey && !accessKey) {
  console.error('WEB3FORMS_ACCESS_KEY is required for this deployment. Add it as a GitHub Actions secret.');
  process.exit(1);
}

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.cpSync(source, output, { recursive: true });

const indexPath = path.join(output, 'index.html');
let index = fs.readFileSync(indexPath, 'utf8');

if (accessKey) {
  index = index.replaceAll(placeholder, accessKey);
  fs.writeFileSync(indexPath, index, 'utf8');
  console.log('Built Island Tech site with injected Web3Forms access key.');
} else {
  console.log('Built Island Tech site with placeholder Web3Forms key for local/homelab preview.');
}

if (requireKey && fs.readFileSync(indexPath, 'utf8').includes(placeholder)) {
  console.error('Web3Forms placeholder remains in production build.');
  process.exit(1);
}
