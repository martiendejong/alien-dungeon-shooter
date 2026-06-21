// Build the game and publish dist/ to the gh-pages branch (GitHub Pages).
// Usage: npm run deploy
import { execSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';

const REMOTE = 'https://github.com/martiendejong/alien-dungeon-shooter.git';
const run = (c) => execSync(c, { stdio: 'inherit', shell: true });

run('npm run build');
writeFileSync('dist/.nojekyll', '');           // tell Pages not to run Jekyll
rmSync('dist/.git', { recursive: true, force: true });
run('git -C dist init -q -b gh-pages');
run('git -C dist add -A');
run('git -C dist -c user.name=deploy -c user.email=deploy@local commit -q -m "deploy"');
try { run('gh auth switch --user martiendejong'); } catch { /* gh may not be installed / different setup */ }
run(`git -C dist -c credential.helper= -c credential.helper="!gh auth git-credential" push --force ${REMOTE} gh-pages`);
console.log('\n✓ Deployed → https://martiendejong.github.io/alien-dungeon-shooter/');
