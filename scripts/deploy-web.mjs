import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT_DIR = 'web-dist';
const BASE_PATH = '/color-memory/';

execSync(`npx expo export --platform web --output-dir ${OUT_DIR}`, { stdio: 'inherit' });

const indexPath = join(OUT_DIR, 'index.html');
let html = readFileSync(indexPath, 'utf8');

// GitHub Pages serves the app from a subdirectory, so absolute "/..." paths
// resolve to the domain root and 404. Anchor them with <base> and strip the
// leading slash off local asset references.
if (!html.includes('<base ')) {
  html = html.replace('<meta charset="utf-8" />', `<meta charset="utf-8" />\n    <base href="${BASE_PATH}" />`);
}
html = html.replace(/(src|href)="\/(?!\/)/g, '$1="');
writeFileSync(indexPath, html);

// Jekyll strips directories beginning with "_" (killing _expo/), and gh-pages
// skips dotfiles unless --dotfiles is passed — both are required here.
writeFileSync(join(OUT_DIR, '.nojekyll'), '');
copyFileSync(indexPath, join(OUT_DIR, '404.html'));

execSync(`npx gh-pages -d ${OUT_DIR} --dotfiles`, { stdio: 'inherit' });

console.log(`\nDeployed: https://rad1994.github.io${BASE_PATH}`);
