#!/usr/bin/env node
// Regenerate local WOFF2 subsets after UI copy/category changes: node tools/subset-fonts.mjs (needs pyftsubset on PATH or PYFTSUBSET)
// This development-only script fetches upstream files; the site never loads it.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const fonts = resolve(root, 'fonts');
const work = resolve(root, 'work/m3/font-sources');
await mkdir(work, { recursive: true });
await mkdir(resolve(fonts, 'LICENSES'), { recursive: true });
const app = await readFile(resolve(root, 'app.js'), 'utf8');
const declaration = app.match(/const text = ([\s\S]*?);\n\nfunction stored/);
if (!declaration) throw new Error('Cannot find the UI text dictionary in app.js');
const copy = runInNewContext(`(${declaration[1]})`, Object.create(null), { timeout: 1000 });
const data = JSON.parse(await readFile(resolve(root, 'data/skills.json'), 'utf8'));
const labels = Object.values(copy).flatMap(locale => Object.values(locale).filter(value => typeof value === 'string'));
labels.push(...data.categories.flatMap(category => [category.zh, category.en]), 'Skill Shelf HITS: 0123456789');
const characters = [...new Set(labels.join(''))].sort().join('');
const uiText = resolve(work, 'ui-characters.txt');
const numericText = resolve(work, 'numeric-characters.txt');
await writeFile(uiText, characters);
await writeFile(numericText, ' 0123456789+-/.,:—');
const families = [
  { directory: 'zcoolkuaile', ttf: 'ZCOOLKuaiLe-Regular.ttf', output: 'zcool-kuaile-ui.woff2', options: [`--text-file=${uiText}`] },
  { directory: 'silkscreen', ttf: 'Silkscreen-Regular.ttf', output: 'silkscreen-latin.woff2', options: ['--unicodes=U+0020-007E'] },
  { directory: 'vt323', ttf: 'VT323-Regular.ttf', output: 'vt323-numbers.woff2', options: [`--text-file=${numericText}`] },
];
for (const family of families) {
  const base = `https://raw.githubusercontent.com/google/fonts/main/ofl/${family.directory}/`;
  const [fontResponse, licenseResponse] = await Promise.all([fetch(base + family.ttf), fetch(base + 'OFL.txt')]);
  if (!fontResponse.ok || !licenseResponse.ok) throw new Error(`Upstream font download failed: ${family.directory}`);
  const ttf = resolve(work, family.ttf);
  await writeFile(ttf, Buffer.from(await fontResponse.arrayBuffer()));
  await writeFile(resolve(fonts, 'LICENSES', `${family.directory}-OFL.txt`), await licenseResponse.text());
  execFileSync(process.env.PYFTSUBSET || 'pyftsubset', [ttf, ...family.options, '--flavor=woff2', '--layout-features=*', `--output-file=${resolve(fonts, family.output)}`], { stdio: 'inherit' });
  console.log(`${family.output}: ${(await readFile(resolve(fonts, family.output))).byteLength} bytes`);
}
console.log(`Chinese UI subset collected ${characters.length} distinct UI/category characters (not skill descriptions).`);
