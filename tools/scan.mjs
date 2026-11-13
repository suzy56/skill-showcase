// Inventory local skills: frontmatter name/description, location, git remote, plugin/marketplace metadata.
import { readFileSync, readdirSync, statSync, existsSync, realpathSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { execSync } from 'node:child_process';
import { homedir } from 'node:os';
const H = homedir();
const roots = [['agents', join(H, '.agents/skills')], ['codex', join(H, '.codex/skills')], ['claude', join(H, '.claude/skills')], ['claude-plugin', join(H, '.claude/plugins')]];
const found = [];
const walk = (dir, depth, root) => {
  if (depth > 7) return;
  let entries; try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  if (entries.some((e) => e.name === 'SKILL.md' && e.isFile())) { found.push({ root, dir }); return; }
  for (const e of entries) if ((e.isDirectory() || e.isSymbolicLink()) && !['node_modules', '.git', 'cache'].includes(e.name)) walk(join(dir, e.name), depth + 1, root);
};
for (const [root, dir] of roots) walk(dir, 0, root);
const front = (text) => {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text); if (!m) return {};
  const out = {}; const lines = m[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const k = /^([A-Za-z_-]+):\s*(.*)$/.exec(lines[i]); if (!k) continue;
    let v = k[2].trim();
    if (/^[|>]/.test(v)) { const body = []; while (i + 1 < lines.length && /^\s+/.test(lines[i + 1])) body.push(lines[++i].trim()); v = body.join(' '); }
    out[k[1]] = v.replace(/^["']|["']$/g, '');
  }
  return out;
};
const remote = (dir) => { try { return execSync('git config --get remote.origin.url', { cwd: dir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim().replace(/^git@github\.com:/, 'https://github.com/').replace(/\.git$/, ''); } catch { return ''; } };
const seen = new Map();
for (const { root, dir } of found) {
  const real = realpathSync(dir);
  const f = front(readFileSync(join(dir, 'SKILL.md'), 'utf8'));
  const name = f.name || dir.split('/').pop();
  const rel = dir.replace(H, '~');
  const plugin = /plugins\/marketplaces\/([^/]+)\/plugins\/([^/]+)/.exec(dir) || /plugins\/cache\/([^/]+)\/([^/]+)/.exec(dir);
  const system = /\/\.system\//.test(dir) || /\.claude\/skills\/synced\//.test(dir);
  const rec = { name, description: (f.description || '').replace(/\s+/g, ' ').slice(0, 300), location: rel, root, system, plugin: plugin ? `${plugin[1]}/${plugin[2]}` : '', repo: f.repository || remote(real) };
  if (!seen.has(name)) seen.set(name, rec); else seen.get(name).alsoAt = [...(seen.get(name).alsoAt || []), rel];
}
process.stdout.write(JSON.stringify([...seen.values()].sort((a, b) => a.name.localeCompare(b.name)), null, 1));
