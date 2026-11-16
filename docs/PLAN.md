# Skill Shelf 后续方案

状态：方案稿，暂不实现。日期：2026-11-13（2026-11-15 更新组件库为 neo-brutalism-ui）。

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

## 2. 视觉方向（参考 momozi.vip）

观察到的要素：
- 2–3px 纯黑描边、无圆角或小圆角、**硬阴影**（向右下偏移的黄色/黑色色块，不用模糊阴影）；
- 浅灰底 + 细网格纸纹理背景；
- 像素/街机风格的标题字体，正文用常规无衬线；
- 高饱和强调色（黄 `#F7C948` 一类）做选中态、按钮和角标；
- 统计数字用方框大字；筛选用一排方块按钮，选中态填色；
- 卡片角上贴斜放的小标签（FLAGSHIP / NEW）。

我们的取舍：
- 参考站的具体组件实现未公开；我们用 neo-brutalism-ui 的组件做基础，自行还原上述视觉要素。
- 保留这些元素，但**不复制它的品牌、文案和配色方案**，换一套自己的主色（建议沿用当前站的墨绿 + 一个高亮黄，与 pigee 其他站区分）。
- 暗色模式：黑底 + 白描边 + 彩色硬阴影，跟随系统，可手动切换。
- 字体：标题用开源像素字体（如 OFL 授权的 Zpix 或 Fusion Pixel 做中文、Press Start 2P/Silkscreen 做英文数字），**按实际用到的字做子集并自托管**，不请求 Google Fonts；正文用系统字体。中文像素字体全量很大，必须子集化。
- 逻辑图本身保持当前查看器的样式（它是独立的 HTML），详情页外框用新粗野主义风格包住它。

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
- 先用 1 个已知 skill（如 `humanizer`）跑通一遍，对照本仓库已有的审计样例（nuwa、interview-recall-training）校准质量，再批量。

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

1. **M1 管线打通**：omp 能加载可视化 skill；`humanizer` 出图并通过质量门槛。
2. **M2 写作类出图**：20 个写作 skill 中许可明确的部分全部出图；当前静态页加「查看逻辑图」链接（不改版也能先上线）。
3. **M3 改版**：Astro + neo-brutalism-ui 组件重做首页/分类/详情页，迁移现有数据和图。
4. **M4 扩充分类**：按排除清单逐类上线其余分类，每类一批图。

## 9. 待定问题

1. 来源未记录的 skill：是否先花一轮补查上游和许可？
2. 你自己写的 skill（如 wewrite 系列，如果是你的）是否公开原文和逻辑图？
3. 主色和像素字体的偏好，是否要和 pigee.top 其他站统一？
4. 精选区放哪几个 skill？
