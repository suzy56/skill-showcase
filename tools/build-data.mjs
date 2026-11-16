#!/usr/bin/env node
// Build data/skills.json from the local inventory (git-ignored) and committed circuits/*/meta.json.
// Only categories listed in PUBLISHED_CATEGORIES are published. A circuit is linked only when its
// meta.json exists, records a license, and has been reviewed.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';

const PUBLISHED_CATEGORIES = [{ id: 'writing', zh: '写作与内容', en: 'Writing & Content' }];
const root = new URL('..', import.meta.url);
const inventory = JSON.parse(readFileSync(new URL('inventory.json', root), 'utf8'));

function fullDescription(location) {
  const text = readFileSync(`${location.replace('~', homedir())}/SKILL.md`, 'utf8');
  const lines = (/^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] || '').split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const match = /^description:\s*(.*)$/.exec(lines[i]);
    if (!match) continue;
    let value = match[1].trim();
    if (!value || /^[|>]/.test(value)) { const body = []; while (i + 1 < lines.length && /^\s+/.test(lines[i + 1])) body.push(lines[++i].trim()); value = body.join(' '); }
    return value.replace(/^["']|["']$/g, '');
  }
  return '';
}

const circuits = new Map();
const dir = new URL('circuits/', root);
if (existsSync(dir)) for (const name of readdirSync(dir)) {
  const metaPath = new URL(`circuits/${name}/meta.json`, root);
  if (!existsSync(metaPath)) continue;
  const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
  if (!meta.source?.license || !meta.reviewedBy) { console.warn(`skip circuit ${name}: missing license or review`); continue; }
  circuits.set(meta.skill, { href: `circuits/${name}/`, nodes: meta.nodes, edges: meta.edges, warnings: meta.warnings, license: meta.source.license });
}

const ids = new Set(PUBLISHED_CATEGORIES.map((category) => category.id));
const skills = inventory.filter((skill) => ids.has(skill.category)).map((skill) => {
  const repo = /^github\.com\/([^ ]+)/.exec(skill.source);
  return {
    name: skill.name, description: fullDescription(skill.location), category: skill.category,
    source: repo ? { label: repo[1], url: `https://${repo[0]}` } : { label: skill.source, url: null },
    ...(circuits.has(skill.name) ? { circuit: circuits.get(skill.name) } : {}),
  };
});
writeFileSync(new URL('data/skills.json', root), `${JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), categories: PUBLISHED_CATEGORIES, skills }, null, 1)}\n`);
console.log(`${skills.length} skills, ${skills.filter((skill) => skill.circuit).length} with circuits`);
