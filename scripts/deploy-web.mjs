import { execSync } from 'node:child_process';
import { writeFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT_DIR = 'web-dist';

// The subdirectory prefix is baked in by expo.experiments.baseUrl in app.json,
// which covers assets fetched at runtime (the icon font) as well as the script
// tag. Do not rewrite paths here — a <base> tag cannot fix the absolute URLs
// the bundle builds for those assets, and stripping their leading slash only
// produces a doubled "/color-memory/color-memory/" path.
execSync(`npx expo export --platform web --output-dir ${OUT_DIR}`, { stdio: 'inherit' });

// Jekyll strips directories beginning with "_" (killing _expo/), and gh-pages
// skips dotfiles unless --dotfiles is passed — both are required here.
writeFileSync(join(OUT_DIR, '.nojekyll'), '');
copyFileSync(join(OUT_DIR, 'index.html'), join(OUT_DIR, '404.html'));

// gh-pages stages the published files inside a git clone, so any .gitignore
// left on the branch still applies. The project's own ignore rules include
// node_modules/, and Expo emits the icon fonts under assets/node_modules/ —
// which silently dropped them and rendered every icon as an empty box. Shipping
// an empty ignore file overwrites whatever the branch is carrying.
writeFileSync(join(OUT_DIR, '.gitignore'), '');

execSync(`npx gh-pages -d ${OUT_DIR} --dotfiles`, { stdio: 'inherit' });

console.log('\nDeployed: https://rad1994.github.io/color-memory/');
