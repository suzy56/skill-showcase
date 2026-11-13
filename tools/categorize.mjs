import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
const inv = JSON.parse(readFileSync('inventory.raw.json', 'utf8'));
const lock = JSON.parse(readFileSync(`${homedir()}/.agents/.skill-lock.json`, 'utf8'));
const locked = lock.skills || lock;
const CATS = [
  ['writing', '写作与内容', /^(wewrite|writing-(beats|fragments|shape)|chinese-novelist|liurun|luozhenyu|humanizer|internal-comms|doc-coauthoring|vibe-knowledge-film)/],
  ['office', '文档与办公', /^(docx|pdf|pptx|xlsx|docs|google-workspace|guizang-ppt-skill|prd|morning)$/],
  ['visual', '设计与可视化', /^(algorithmic-art|canvas-design|brand-guidelines|frontend-design|theme-factory|visual-explainer|visualizing-skill-packages|graphify|slack-gif-creator|playground|imagegen|generate2d|hatch-pet|web-artifacts-builder|project-artifact|session-report|receipts)/],
  ['engineering', '工程开发', /^(code-review|tdd|diagnosing-bugs|codebase-design|domain-modeling|implement|git-|pr$|setup-|migrate-|resolving-merge|using-git-worktrees|triage|to-spec|to-tickets|wayfinder|prototype|improve-codebase|receiving-code-review|requesting-code-review|webapp-testing|retro|scaffold-exercises|claude-security|review-agent)/],
  ['agent', 'Agent 与 Claude Code 扩展', /^(agent-development|command-development|hook-development|plugin-|skill-|mcp-|build-mcp|claude-(api|md|automation|handoff)|writing-(skills|for-agents|hookify)|find-skills|example-|herdr|ccb-|ask$|chief-of-staff|handoff|reconnect|loop-me|routines|office-hours|built-in-browser|chrome-browser|computer-use|import-memory|openai-docs|access|configure)/],
  ['learning', '研究、学习与思考', /^(research|deep-research|teach|grill|ask-matt|to-questionnaire|interview-recall-training|math-olympiad|siege|solo|wait-what|wizard)/],
  ['team', '团队与组织', /^(climb|faq|hackathon|maturity|patterns)$/],
  ['hardware', '硬件与其他', /^(m5-onboard|cardputer-buddy)$/],
];
// Names to flag for review live in a local, git-ignored file so private skills are never published.
let PRIVATE = new Set();
try { PRIVATE = new Set(JSON.parse(readFileSync(new URL('./private-skills.local.json', import.meta.url), 'utf8'))); } catch {}
const out = inv.map((s) => {
  const cat = CATS.find(([, , re]) => re.test(s.name)) || ['other', '未分类'];
  const lockSrc = locked[s.name]?.source;
  const source = lockSrc ? `github.com/${lockSrc}` : s.plugin ? `github.com/anthropics/claude-plugins-official (${s.plugin.split('/')[1]})` : s.repo ? s.repo.replace(/^https:\/\//, '') : s.system ? '平台内置' : '未记录';
  return { ...s, category: cat[0], categoryLabel: cat[1], source, flag: s.system ? 'system' : PRIVATE.has(s.name) ? 'private?' : '' };
});
writeFileSync('inventory.json', JSON.stringify(out, null, 1));
const lines = ['# Skill 清单（待勾选排除）', '', '在要排除的行前把 `[ ]` 改成 `[x]`。标记：⚙️ 平台内置，🔒 可能偏私人/个人工具。', ''];
for (const [key, label] of [...CATS, ['other', '未分类']]) {
  const rows = out.filter((s) => s.category === key);
  if (!rows.length) continue;
  lines.push(`## ${label}（${rows.length}）`, '');
  for (const s of rows) lines.push(`- [ ] ${s.flag === 'system' ? '⚙️ ' : s.flag ? '🔒 ' : ''}**${s.name}** — ${s.source} — ${s.description.slice(0, 80)}`);
  lines.push('');
}
writeFileSync('inventory-review.md', lines.join('\n'));
const by = {}; for (const s of out) by[s.categoryLabel] = (by[s.categoryLabel] || 0) + 1;
console.log(by, 'system', out.filter((s) => s.flag === 'system').length, 'private?', out.filter((s) => s.flag === 'private?').length, 'unknown source', out.filter((s) => s.source === '未记录').length);
console.log(out.filter((s) => s.category === 'other').map((s) => s.name).join(', '));
