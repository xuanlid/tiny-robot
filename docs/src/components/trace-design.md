---
outline: [1, 3]
---

# Trace 轨迹组件设计方案

## 1. 文档目的

本文档用于对齐 Trace 轨迹组件的产品目标、信息架构、数据协议、交互行为和工程边界。

本文档不是 API 使用手册，也不描述具体代码目录或当前实现方式。实现方可以使用原生 DOM、Angular、Vue、React 或其他技术，但最终行为应遵循本文档定义的产品契约。

## 2. 产品定位

Trace 用于展示 Agent 完整执行过程，帮助用户回答以下问题：

- 用户发送了什么请求？
- 模型实际收到的 Prompt 是什么？
- 模型调用了哪些工具？
- 工具之间是否存在嵌套或依赖关系？
- 每一步花费了多长时间？
- 哪一个请求产生了错误或重试？
- 当前输出是模型生成、上下文注入，还是工具返回？
- 模型使用了多少输入、输出和推理 Token？

Trace 不是普通聊天记录，也不是单纯的日志列表。它需要同时保留：

- 对话语义；
- Agent 执行层级；
- 请求生命周期；
- 工具调用关系；
- 时间和性能信息；
- 原始输入输出详情。

## 3. 设计原则

### 3.1 消息数据与 Trace 投影分离

Trace 的内容来自已有的消息和运行时数据，不要求业务消息本身包含完整的轨迹字段。

```text
Message / Request / Tool / Runtime data
                    ↓
              Trace Adapter
                    ↓
              Trace Projection
                    ↓
             Ledger / Timeline / Inspector
```

Trace Adapter 负责把不同来源的数据转换为统一记录：

| 数据来源 | Trace 展示记录 |
| --- | --- |
| User Message | USER |
| System Message | SYSTEM |
| Context Message | CONTEXT |
| Assistant Message | ASSISTANT |
| Request Metadata | REQUEST |
| Tool Call | TOOL / SUBTOOL |
| Tool Result | TOOL / SUBTOOL 的结果状态 |
| Turn / Step / Timing | 分组、耗时和 Timeline |

消息中没有的字段保持不可用状态，不进行推断或补造。例如没有完成时间时显示 Running 和 `—`，没有 Token Usage 时显示未提供。

### 3.2 稳定身份

每条请求、消息和工具调用必须有稳定身份：

- 请求使用 `requestId`；
- 工具使用 `callId`；
- 事件使用 `seq`；
- 展示记录使用独立的 `recordId`。

不能使用数组下标作为业务身份。

### 3.3 不伪造运行状态

当任务尚未结束时：

- 不显示虚构的完成时间；
- 不计算虚构的耗时；
- 不把 Running 显示成 Completed；
- 未收到结果的工具调用保留 `—` 耗时。

### 3.4 主列表保持紧凑

主列表用于扫描执行过程，不展示大段 JSON、完整 Prompt 或长文本。

完整内容放到详情面板，避免长内容破坏时间线和事件顺序。

### 3.5 框架无关

组件的核心行为不依赖 Angular、Vue 或 React。

Angular 只负责生命周期和业务数据接入，不应复制 Trace 内部状态。

## 4. 页面信息架构

```text
Trace Header
  ├── Trace 标题
  ├── 对话 / 轨迹视图切换
  └── 会话统计

Trace Toolbar
  ├── 时间模式
  ├── 折叠控制
  ├── 搜索
  └── 历史加载

Timeline Overview
  ├── Context Lane
  ├── Assistant Lane
  └── Tools Lane

Trace Content
  ├── Event Ledger
  └── Event Inspector（默认关闭）
```

## 5. Header 设计

Header 展示当前视图身份和会话概况。

建议内容：

```text
Trace       对话   轨迹                         7 records · 7 completed
```

规则：

- 当前选中的视图使用品牌色下划线；
- 不在 Header 中展示过多操作按钮；
- 统计信息使用弱化文本；
- Header 高度保持紧凑；
- 移动端隐藏次要统计信息。

## 6. Toolbar 设计

Toolbar 分为三类操作，避免语义重复。

### 6.1 时间模式

```text
Sequence | Duration | Actual time
```

- `Sequence`：按执行顺序等宽展示；
- `Duration`：按每条记录自身耗时展示；
- `Actual time`：按真实时间戳展示。

### 6.2 折叠控制

```text
Collapse turns
Collapse calls
Collapse subcalls
```

- `Collapse turns`：折叠整个 Turn；
- `Collapse calls`：折叠 Assistant 下的工具调用内容；
- `Collapse subcalls`：折叠父工具下的嵌套工具。

### 6.3 辅助操作

```text
Search trace                             Load older
```

搜索应作用于完整投影数据，即使记录当前处于折叠状态，也应该能被搜索到。

## 7. Timeline 设计

### 7.1 三条泳道

| 泳道 | 内容 |
| --- | --- |
| Context | System、User、Context、Compaction |
| Assistant | Request、Assistant、Reasoning |
| Tools | Tool、Subtool |

### 7.2 时间模式

```ts
type TimelineMode = 'sequence' | 'duration' | 'actual'
```

### 7.3 交互规则

- 点击 Timeline 区块选中对应记录；
- 选中记录同步高亮 Ledger 行；
- 拖动空白区域选择时间范围；
- Ledger 过滤所有不在范围内的记录；
- 右键清除时间范围；
- 滚轮缩放时间域；
- 已放大时拖动时间线可以平移；
- 搜索匹配项在 Timeline 中增加高亮；
- Running 记录只显示起点，不显示虚假跨度。

### 7.4 时间计算

```ts
interface TimelineSpan {
  recordId: string
  start: number
  end: number
  lane: 0 | 1 | 2
  status: 'running' | 'complete' | 'error'
}
```

缺少开始或结束时间时，记录可以出现在 Ledger 中，但不强行绘制 Timeline Span。

## 8. Event Ledger 设计

### 8.1 层级结构

```text
Turn 1
  Step 0
    SYSTEM
    USER
    CONTEXT

  Step 1
    REQUEST
    ASSISTANT
    TOOL
      SUBTOOL
```

### 8.2 记录行结构

```text
#12   TOOL      search · Found 3 matching files.      Completed 362ms  T1 · S1
```

每行包含：

- 事件序号；
- 类型标签；
- 正文摘要；
- 状态；
- 耗时；
- Turn / Step；
- 嵌套层级缩进。

主列表不重复展示一个额外的粗体标题。标题和正文应合并为一段可扫描内容。

记录行视觉规范：

- 类型标签右侧展示正文摘要；
- Tool 和 Subtool 行通过正文摘要、状态和 Inspector 表达结果；
- 记录序号、类型标签、正文和状态信息在同一行垂直居中；
- 标签宽度根据文本自适应，不使用统一固定宽度；
- 标签与正文之间保留稳定间距。

### 8.3 类型标签

类型统一使用英文，便于和开发者工具、日志系统以及接口字段保持一致：

```text
SYSTEM
USER
CONTEXT
REQUEST
ASSISTANT
TOOL
SUBTOOL
COMPACTION
```

标签颜色只表达记录类别，不表达成功或失败。成功、失败和运行状态使用独立状态字段展示。

### 8.4 标签尺寸

标签不使用固定宽度，应根据文本自适应，并保留统一的左右内边距和标签与正文之间的间距。

## 9. Inspector 设计

### 9.1 默认状态

Inspector 默认关闭：

- Ledger 使用全部可用宽度；
- 不显示空的详情提示；
- 不预留右侧空白区域。

### 9.2 打开和关闭

- 点击 Ledger 记录打开 Inspector；
- 点击 Timeline 记录同样打开 Inspector；
- Inspector 右上角提供关闭按钮；
- 关闭后恢复 Ledger 全宽；
- 选择其他记录时复用当前 Inspector，不重新创建整个页面；
- 键盘 Enter / Space 可以打开记录。

### 9.3 Inspector Tabs

```text
Summary | Payload | Result | Schema | Timing
```

### 9.4 Summary

展示：

- Status；
- Turn / Step；
- Request ID；
- Call ID；
- Tool Name；
- Provider；
- Model；
- 正文摘要；
- 思考内容；
- 错误信息。

### 9.5 Payload

展示：

- 用户输入；
- Request Prompt；
- System Prompt；
- 工具参数；
- 请求选项。

### 9.6 Result

展示：

- Assistant 输出；
- 工具结果；
- 结构化 JSON；
- 错误结果；
- 图片或附件占位信息。

### 9.7 Schema

展示：

- 当前工具 Schema；
- 当前请求的工具目录；
- 输入参数定义；
- 工具描述。

### 9.8 Timing

展示：

- Started；
- First token；
- Completed；
- Duration；
- TTFT；
- Decode time；
- Input tokens；
- Output tokens；
- Reasoning tokens；
- Cache read / write。

## 10. 标准化投影模型

Trace Adapter 可以接收任意业务消息模型，但需要输出以下标准化信息供视图使用。该模型是 Trace 内部的展示契约，不要求直接暴露给业务消息层。

### 10.1 Trace 输入事件

当数据源是流式消息或实时运行时，可以使用标准化输入事件：

```ts
interface TraceEvent {
  sessionId: string
  seq: number
  type: TraceEventType
  timestamp: number
  turn?: number
  step?: number
  requestId?: string
  callId?: string
  parentCallId?: string
  data: unknown
}
```

事件只是适配层的标准输入形式，业务方也可以直接从已有 Message、Request 和 Tool 数据生成 Trace Projection。

### 10.2 Message 到 Record 的转换

```text
user/message       → USER Record
system/message     → SYSTEM Record
context/message    → CONTEXT Record
assistant/message  → ASSISTANT Record
assistant/reasoning→ ASSISTANT 的 reasoning 字段
assistant/tool-call→ TOOL Record
tool/result        → TOOL Record 的 result 和 status
```

一个 Message 可以产生一条或多条 Trace Record。例如：

- 包含文本和工具调用的 Assistant Message，会生成 Assistant Record 和 Tool Record；
- 一个包含多个内容块的 Context Message，可以生成多个 Context Record；
- Tool Call 和 Tool Result 会根据 `callId` 合并为一条工具记录。

### 10.3 Request

```ts
interface TraceRequest {
  requestId: string
  turn: number
  step: number
  purpose: 'assistant' | 'compaction'
  provider?: string
  model?: string
  systemPrompt?: string
  prompt?: unknown
  tools?: TraceToolSchema[]
  options?: Record<string, unknown>
  status: 'running' | 'complete' | 'error'
  startedAt: number
  completedAt?: number
  retry?: number
  maxRetries?: number
  usage?: TraceUsage
  error?: TraceError
}
```

### 10.4 Tool Call

```ts
interface TraceToolCall {
  callId: string
  parentCallId?: string
  name: string
  argsRaw: string
  startedAt: number
  completedAt?: number
  status: 'running' | 'complete' | 'error'
  result?: unknown
  resultText?: string
  schema?: TraceToolSchema
  error?: TraceError
}
```

## 11. 生命周期规则

### 11.1 Request

```text
request.start → request.delta → request.end
```

Request 失败时：

```text
request.start → error
```

### 11.2 Assistant

```text
assistant.delta × N → assistant.end
```

多个 delta 必须合并为同一个 Assistant Record。

### 11.3 Tool

```text
tool.start(callId) → tool.result(callId)
```

Tool 结果可以晚于 Assistant 记录到达，也可以在历史分页中补齐。

### 11.4 错误

错误必须携带稳定来源：

```ts
interface TraceError {
  code?: string
  message: string
}
```

不能仅依赖 UI 文案判断错误类型。

## 12. Angular 接入边界

Angular Wrapper 负责：

- 创建 Trace 实例；
- 接入已有 Message、Request、Tool 和运行时数据；
- 接收实时消息或运行时更新；
- 监听记录选择；
- 监听时间范围选择；
- 销毁 Trace 实例。

Trace 内部负责：

- 事件聚合；
- 记录状态；
- Timeline；
- Ledger；
- Inspector；
- 搜索和折叠。

Angular 不应维护第二份 Record Store。

## 13. 流式和历史数据

### 13.1 流式事件

```text
SSE / WebSocket
        ↓
requestAnimationFrame 合并
        ↓
更新当前记录
        ↓
刷新 Timeline 和 Inspector
```

高频 token 不应逐字触发 Angular Change Detection。

### 13.2 历史加载

- 初始加载最新记录；
- 默认定位到末尾；
- 接近顶部时加载更早历史；
- 插入旧记录后保持当前可见位置；
- 用户向上查看旧记录时不自动跳回底部；
- 当前 Inspector 选中的记录不能因为分页而丢失。

## 14. 性能方案

### 第一阶段

- 完整事件投影；
- 只渲染当前窗口；
- 流式更新使用帧合并；
- 详情内容按 Tab 延迟渲染。

### 第二阶段

当记录超过约 300 条或事件超过约 1,000 条时启用虚拟列表：

- 保持稳定 recordId；
- 只挂载可见行；
- 保留少量 overscan；
- 详情面板不参与列表高度计算；
- 向前加载历史时保持滚动锚点。

## 15. 安全和隐私

Trace 可能展示敏感 Prompt、工具参数和模型结果，必须支持：

```ts
interface TraceVisibility {
  showPrompt: boolean
  showReasoning: boolean
  showToolArgs: boolean
  showToolResult: boolean
  showAttachments: boolean
}
```

安全要求：

- 默认不在主列表展示完整 Prompt；
- API Key、Cookie、Authorization 不得进入 TraceEvent；
- JSON 预览限制最大长度；
- Markdown / HTML 必须进行 XSS 清理；
- 图片和附件通过受控 loader 加载；
- 自定义 Renderer 不得直接修改内部 Store。

## 16. 扩展点

### Markdown Renderer

允许业务系统接入已有 Markdown 渲染器。

### Tool Renderer

允许为特定工具提供自定义卡片，例如：

- Todo；
- Search；
- Browser；
- Code execution；
- File operation。

### Attachment Renderer

允许接入：

- 图片预览；
- 文件信息；
- 下载链接；
- 授权加载器。

## 17. 交付阶段

### Phase 1：基础轨迹

- Event Protocol；
- Request；
- User；
- Assistant；
- Tool；
- Subtool；
- Turn / Step；
- Timeline；
- Ledger；
- Inspector。

### Phase 2：分析能力

- Token Usage；
- TTFT；
- Decode Time；
- Retry；
- Error；
- Compaction；
- Prompt Diff。

### Phase 3：生产能力

- SSE / WebSocket；
- 历史分页；
- 虚拟滚动；
- 附件；
- Markdown；
- 自定义 Tool Renderer；
- JSONL 回放。

## 18. 验收标准

1. Angular 可以通过一个 Wrapper 接入。
2. 主列表可以区分 System、User、Context、Request、Assistant、Tool、Subtool。
3. Tool Call 和 Tool Result 可以通过 `callId` 正确配对。
4. 嵌套 Tool 可以通过 `parentCallId` 正确缩进。
5. Inspector 默认关闭，点击记录后打开，支持关闭。
6. Timeline 与 Ledger 可以相互定位。
7. Running 状态不显示虚假耗时。
8. 长文本和 JSON 不会破坏主列表布局。
9. 流式更新不会导致整个页面闪烁或滚动跳动。
10. 组件销毁后不残留 DOM、监听器、定时器或数据订阅。
