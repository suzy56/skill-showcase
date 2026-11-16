# Skill Shelf 后续方案

状态：方案稿，暂不实现。日期：2026-11-13（2026-11-15 更新组件库为 neo-brutalism-ui，配色改为沿用 momozi.vip）。

当前线上版本（https://skills.pigee.top）是零依赖的静态页，只展示「写作与内容」分类的 20 个 skill 的名称、简介和来源。下一阶段有两个目标：

1. **逻辑电路图**：每个公开的 skill 附一张由 `visualizing-skill-packages` 生成、可审计的交互式逻辑图，点开即可查看它的执行流程、分支、检查点和原文证据。
2. **视觉改版**：参考 [momozi.vip/skills](https://momozi.vip/skills) 的新粗野主义（neo-brutalism）风格，组件参考 [homayounmmdy/neo-brutalism-ui](https://github.com/homayounmmdy/neo-brutalism-ui)（MIT，React + Next.js + TypeScript + Tailwind v4）。

---

## 1. 页面结构

| 页面 | 路径 | 内容 |
|---|---|---|
| 首页 | `/` | Hero（标题 + 一句话定位 + 统计块：skill 数、分类数、已出图数、来源仓库数）、分类筛选条 + 搜索、「精选」区（2 张大卡，放审计质量最好的图）、全部 skill 卡片墙 |
| 分类 | `/c/<category>` | 同首页卡片墙，预选分类；URL 可分享 |
| 详情 | `/s/<skill>` | 名称、简介、分类、来源链接、**逻辑电路图**（嵌入）、图的元信息（节点/边数、缺口警告数、原文 SHA-256、审计日期）、「查看原文」「下载 graph.json」 |
| 关于 | `/about` | 这些图怎么生成、什么是「源事实 / 抽象 / 缺口」、免责声明（图是解释，不代表 skill 被执行过） |

卡片上用徽标区分：`已出图`、`仅简介`（还没有图）、`来源未记录`。

## 2. 视觉方向（参考 momozi.vip，配色沿用）

以下数值于 2026-11-15 从 momozi.vip/skills 的 CSS 变量和计算样式中读取。

### 配色（沿用参考站）

| 令牌 | 值 | 用途（参考站中的实际用法） |
|---|---|---|
| `--ink` | `#0B0B0F` | 描边、硬阴影、正文主色、深色反白卡片底 |
| `--paper` | `#FFFFFF` | 卡片、按钮底 |
| `--hall` | `#F3F5FA` | 页面底色（大面积） |
| `--yellow` | `#FFC53D` | 主强调：选中态、主按钮、标签、彩色硬阴影 |
| `--yellow-soft` | `#FFD76B` | 强调色的浅一级（悬停） |
| `--blue` | `#1E5EFF` | 次强调：图标、链接、角标 |
| `--red` | `#F04438` | 角标（FLAGSHIP）、警示 |
| `--green` | `#22B07D` | 成功/状态点 |
| `--text` | `#4A5164` | 次要正文 |
| `--muted` | `#8A90A0` | 说明文字、计数 |
| `--line` | `#E4E7EF` | 浅分隔线、网格纹理 |

另有一个淡紫 `#ABA7E5` 只在个别装饰处出现，可作为分类色备用。

我们的扩展（参考站没有暗色模式）：
- **暗色模式**：`--hall` → `#0B0B0F`，`--paper` → `#16171D`，描边和中性阴影改为 `#F3F5FA`，黄/蓝/红/绿强调色保持不变，正文改浅色。跟随系统，可手动切换。
- **分类色**：每个分类配一个强调色做卡片顶条或角标，从上表的黄、蓝、红、绿、淡紫中选取，不另造颜色。
- **逻辑图查看器**：生成的电路图 HTML 是独立页面，不改它的配色；只在详情页外框使用上述配色。
- 上线前用对比度工具核对：黄底配 `--ink` 文字，蓝/红/绿上的白字至少达到 AA。

### 形状与阴影

- 直角（圆角 0），描边全部 `--ink`：常规 2px，重点容器 3px，细节 1px。
- 硬阴影无模糊：小控件 `2px 2px 0 var(--ink)`，卡片 `4px 4px 0 var(--ink)`，主视觉块 `10px 10px 0 var(--yellow)`。
- 悬停：元素向右下平移 2px、阴影同步缩短，形成"按下"效果；尊重 `prefers-reduced-motion`。

### 字体（参考站用法）

| 用途 | 参考站字体 | 我们的做法 |
|---|---|---|
| 正文 | Noto Sans SC / PingFang SC | 系统字体栈（PingFang SC、Noto Sans SC 等），不下载 |
| 中文大标题 | ZCOOL KuaiLe（站酷快乐体，OFL） | 自托管，按页面实际用到的字做子集 |
| 英文小标签、计数 | Silkscreen（OFL） | 自托管 Latin 子集 |
| 统计大数字 | VT323（OFL） | 自托管数字子集 |

全部自托管，不请求 Google Fonts；许可文件随仓库保存。

### 版式元素

- 页面底色上叠一层细网格纸纹理（`--line` 色）。
- 统计数字放在方框里，大号像素数字 + 小号 Silkscreen 标签。
- 分类筛选是一排方块按钮，选中态填 `--yellow`；搜索框同样是方框，右侧显示 HITS 计数。
- 卡片角上斜贴小标签（如"已出图"、"NEW"），配色用红或黄。

### 边界

- 沿用配色、形状和版式语言；**不复制参考站的 logo、站名、文案、插画和具体页面结构**，站名保持 Skill Shelf。
- 组件以 neo-brutalism-ui 为基础，按上面的设计令牌统一改写（见第 3 节）。

## 3. 技术方案

### 组件库：homayounmmdy/neo-brutalism-ui

调研结果（2026-11-15，读取 GitHub 仓库）：
- MIT 许可，Next.js 16 + React 19 + TypeScript + Tailwind v4，附 Storybook（https://homayounmmdy.github.io/neo-brutalism-ui/）。
- **不是 npm 包**，组件以源码形式放在 `app/components/`：Button、Input、Select、Checkbox、Textarea、Alert、Stat / Stats、SectionHeader、ContentFrame、Navigation、Table、ThemeToggle、DatePicker 等；另有 dashboard、登录、表单示例页。
- 体量小（6 star，个人项目），定位是「风格参考 + 可复制的组件」，不是长期维护的依赖。

我们需要的部件和它的对应关系：

| 本站部件 | neo-brutalism-ui 可直接借用 | 需要自己写 |
|---|---|---|
| 顶部导航 | Navigation | — |
| 统计方块 | Stat / Stats | — |
| 分区标题 | SectionHeader | — |
| 搜索框、按钮、主题切换 | Input、Button、ThemeToggle | — |
| 卡片外框 | ContentFrame | Skill 卡片（徽标、角标、来源链接） |
| 分类筛选条 | Button 组合 | 选中态、计数、键盘导航 |
| 逻辑图外框 | ContentFrame | 嵌入 iframe、图元信息栏 |

用法：挑需要的组件**复制源码**进 `src/components/ui/`，统一设计令牌（描边宽度、阴影偏移、主色），保留 MIT 声明；不引入它的 Recharts、react-query、表单、鉴权等用不到的依赖。

### 框架：Astro + React 组件岛 + Tailwind v4（推荐）

- neo-brutalism-ui 的组件是 React + Tailwind，在 Astro 里作为 React 岛直接可用；
- 页面全部静态生成，每个 skill 一个详情页，链接可分享、可被收录；只有筛选、搜索、主题切换用 React；
- Vercel 自动识别 Astro，`git push` 即部署（项目 skill-showcase 已连接 GitHub）。

备选：直接用 Next.js（与组件库同栈，复制成本最低），`output: 'export'` 静态导出。代价是运行时更重；如果后面要加服务端功能可以改选它。不推荐 Vite SPA，详情页不利于分享。

数据和逻辑图都在构建时读取，运行时不调用任何接口。

## 4. 数据与逻辑图流水线

```
本地 skill 目录
  └─ tools/scan.mjs          扫描 name/description/位置/来源
  └─ tools/categorize.mjs    分类 + 标记（私人名单在本地 ignore 文件）
  └─ 人工审阅排除清单         inventory-review.md（不入库）
  └─ data/skills.json        公开字段：name, description, category, source
  └─ circuits/<skill>/       每个 skill 的审计产物（见下）
       graph.json            语义图（含原文快照 + SHA-256）
       coverage.json         覆盖记录
       index.html            render.mjs 生成的自包含查看器
       meta.json             节点/边/警告数、审计日期、审计者
```

生成方式（由 omp 执行，Claude 审查）：
1. `scaffold.mjs init <SKILL.md> [--include references/*.md] --out graph.json`
2. 按 `visualizing-skill-packages` 的 SKILL.md 流程做语义提取、逐边审查、覆盖记录
3. `scaffold.mjs fill` → `scaffold.mjs coverage` → `validate.mjs` 必须 0 错误，提示逐条处理
4. `render.mjs graph.json --out circuits/<skill>/index.html`
5. 写 `meta.json`

## 5. 和 omp 的分工（通过 herdr 通信）

| 谁 | 做什么 |
|---|---|
| Claude | 定任务规格、挑选批次、审查每张图（抽查证据和边、核对缺口是否真实）、浏览器验收、合并发布 |
| omp | 按规格逐个 skill 跑审计流水线、从 neo-brutalism-ui 移植组件并写站点代码、本地自测 |

每个批次一条 herdr 消息，附任务文件路径（`docs/tasks/<batch>.md`），限定目录、禁止推送和部署；omp 回复 DONE/BLOCKED + 产物路径。

前置事项：
- omp 当前 skills 目录没有 `visualizing-skill-packages`，需要软链或复制 `~/.agents/skills/visualizing-skill-packages` 到 omp 可发现的位置，并确认它能找到 `scripts/*.mjs`（Node 18+ 即可，无需 npm）。
- 先用 1 个许可明确的 skill（`writing-shape`）跑通一遍，对照本仓库已有的审计样例（nuwa、interview-recall-training）校准质量，再批量。

## 6. 质量门槛（每张图上线前）

- `validate.mjs`：0 错误；每条提示都有处理说明（确认是缺口，或修正图）。
- 原文非空行 100% 有覆盖记录；skill 依赖的 references 文件按需 `--include`。
- 抽查：每张图随机 5 条边，核对引文确实支持该关系；所有 decision 节点的分支条件来自原文。
- 浏览器：零重叠、能适应画布、证据跳转正确、无控制台错误、无外部请求。
- 图不声称任何脚本已执行；缺口以警告呈现，不补线。

## 7. 版权与隐私（需要你确认）

逻辑图的查看器会**内嵌 skill 的 SKILL.md 全文**（这是可审计性的来源）。公开前要区分：

| 情况 | 处理建议 |
|---|---|
| 上游仓库有开源许可（MIT/Apache 等） | 可出图公开，详情页注明许可和来源 |
| 你自己写的 skill | 你决定是否公开原文 |
| 来源未记录 / 许可不明（目前 43 个，含写作类的 wewrite 系列、humanizer、doc-coauthoring 等） | 先补查来源和许可；查不到的**不出图**，只保留简介 |
| 私人/个人工具（排除清单） | 不出现在站点 |

## 8. 里程碑

1. **M1 管线打通**：omp 能加载可视化 skill；`writing-shape` 出图并通过质量门槛，再做 `chinese-novelist`（多文件）。
2. **M2 写作类出图**：白名单内的写作 skill 全部出图，同时完成其余 15 个的来源补查；当前静态页加「查看逻辑图」链接（不改版也能先上线）。
3. **M3 改版**：Astro + neo-brutalism-ui 组件重做首页/分类/详情页，迁移现有数据和图。
4. **M4 扩充分类**：按排除清单逐类上线其余分类，每类一批图。

## 9. 已定决策（2026-11-15）

### 9.1 出图白名单：只给许可可核实的 skill 出图

- **出图条件**：上游仓库可定位，且 LICENSE 允许再分发（MIT / Apache-2.0 / BSD / CC-BY 等）。详情页注明许可名称和上游链接。
- **来源未记录或许可不明**：先做一轮补查（交给 omp：按 skill 名称和描述在 GitHub 搜索上游、读取 LICENSE，结果写入 `data/sources.json` 供 Claude 复核）。查实前**只展示名称和简介，不出图、不公开原文**。
- **疑似自写的 skill**（例如 wewrite 系列、humanizer 等目前无上游记录的）：默认按「许可不明」处理，不公开原文。若之后确认是自己写的、愿意公开，在 `data/publish.json` 里逐个加 `allowCircuit: true` 即可，不需要改代码。
- 已确认的写作类白名单（GitHub LICENSE 已核对）：

| Skill | 上游 | 许可 |
|---|---|---|
| chinese-novelist | penglonghuang/chinese-novelist-skill | MIT |
| vibe-knowledge-film | HeyChengC/vibe-knowledge-film | MIT |
| writing-beats / writing-fragments / writing-shape | mattpocock/skills | MIT |

注意：MIT 要求保留版权和许可声明，详情页和图的查看器旁边都要附上原许可文本链接。

### 9.2 M1 试点：writing-shape

选它做第一张图：MIT、篇幅短、单文件，适合先跑通 omp 执行 → Claude 审查 → 上线的完整链路。跑通后再做体量更大的 chinese-novelist（含 11 个 references 文件，用 `--include` 验证多文件证据）。

### 9.3 精选区：chinese-novelist + vibe-knowledge-film

理由：两者都是许可明确的中文 skill，流程完整（多阶段、有检查点和分支），图的信息量足，上游也有一定关注度。前提是它们的图都通过第 6 节的质量门槛；若某张图有未解决的缺口过多，则换成通过门槛的其他白名单 skill。精选名单写在 `data/featured.json`，随时可改。
