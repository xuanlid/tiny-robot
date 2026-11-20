---
outline: [1, 3]
---

<script setup>
import vanillaUmdUrl from '../../../packages/components/dist/vanilla/vanilla.umd.js?url'

if (typeof window !== 'undefined') {
  window.__tinyRobotVanillaDemoUmdUrl = vanillaUmdUrl
}
</script>

# Trace 轨迹

Trace 是一个与框架无关的 Agent 执行轨迹组件，使用原生 DOM 展示请求、Assistant 输出、工具调用、工具结果和执行时间线。

它适合接入任意前端项目。组件只依赖标准 DOM API，不依赖 Vue、React、Angular 等框架运行时。

## 在线示例

下面的示例就是当前仓库中已经实现的完整轨迹面板，可以直接操作：

- 点击记录，在右侧打开 Inspector；
- Inspector 默认关闭，点击记录后展开，点击右上角 `×` 可关闭并恢复 Ledger 全宽；
- 点击 `Payload`、`Result`、`Timing` 查看详情；
- 切换顶部 `Sequence / Duration / Actual time` 时间线模式；
- 使用 `Collapse turns / Collapse calls / Collapse subcalls` 控制折叠；
- 点击“追加 Assistant 流”模拟流式输出；
- 点击“启动工具”和“完成工具”观察 running / complete 状态；
- 点击“加载更早历史”测试历史分页。

<div class="trajectory-demo">

<demo html="../../demos/trace/vanilla.html" title="Trace Vanilla 轨迹面板" description="查看系统提示词、用户消息、请求、上下文、助手输出、嵌套工具、时间线、流式更新和历史加载。" />

</div>

## 安装与引入

### NPM / ESM

```bash
npm install @opentiny/tiny-robot
```

```ts
import {
  createTrace,
  type TraceEvent,
} from '@opentiny/tiny-robot/vanilla'
import '@opentiny/tiny-robot/vanilla/style.css'
```

### UMD

```html
<script src="/assets/vanilla.umd.js"></script>
<script>
  const trace = window.TinyRobotVanilla.createTrace({
    container: document.querySelector('#trace'),
    events: [],
  })
</script>
```

UMD 入口会自动安装 Vanilla 样式。ESM 入口需要显式引入 `@opentiny/tiny-robot/vanilla/style.css`。

## 代码示例

### 基础用法

```html
<div id="trace"></div>
```

```ts
import { createTrace } from '@opentiny/tiny-robot/vanilla'
import '@opentiny/tiny-robot/vanilla/style.css'

const instance = createTrace({
  container: document.querySelector('#trace')!,
  events: [
    {
      sessionId: 'session-1',
      seq: 1,
      type: 'request.start',
      timestamp: Date.now(),
      requestId: 'request-1',
      turn: 1,
      step: 1,
      data: {
        provider: 'deepseek',
        model: 'deepseek-reasoner',
        prompt: 'Inspect the workspace.',
      },
    },
  ],
})

// 页面或路由销毁时调用。
instance.destroy()
```

### 从已有消息数据接入

Trace 可以直接读取应用已有的 Message、Request、Tool Call 和 Tool Result 数据，并将它们投影成轨迹记录。业务方不需要额外维护一套完整的 Trace 事件列表。

```ts
const trace = createTrace({
  container,
  input: {
    sessionId: 'session-1',
    messages,
    requests,
    toolCalls,
    toolResults,
  },
})
```

数据映射关系：

| 业务数据 | Trace 记录 |
| --- | --- |
| User Message | USER |
| System Message | SYSTEM |
| Context Message | CONTEXT |
| Assistant Message | ASSISTANT |
| Assistant Tool Call | TOOL / SUBTOOL |
| Request Metadata | REQUEST |
| Tool Result | TOOL / SUBTOOL 的结果 |

Message 中没有的时间、Token 或错误字段会保持不可用，不会被组件推断或伪造。

### 流式更新

已有消息更新时，可以追加新的业务数据：

```ts
trace.append({
  sessionId: 'session-1',
  messages: [nextAssistantMessage],
  toolResults: [nextToolResult],
})
```

如果数据源本身是事件流，也可以追加标准化事件：

```ts
trace.append(event)
```

组件通过 `container` 接收 DOM 容器。宿主框架只需要负责创建容器、同步业务数据和销毁实例，不需要引入专用框架适配层。

## 数据接入

业务数据经过 Trace Adapter 转换后，形成统一的展示模型。应用可以直接传入已有消息数据，也可以接入实时事件流。

### 已有消息数据

使用 `input` 传入已有的 Message、Request、Tool Call 和 Tool Result：

```ts
createTrace({
  container,
  input: {
    sessionId: 'session-1',
    messages,
    requests,
    toolCalls,
    toolResults,
  },
})
```

Message 会根据角色和内容块转换为 USER、SYSTEM、CONTEXT、ASSISTANT、TOOL 和 SUBTOOL 记录。业务数据中不存在的时间、Token 或错误字段保持不可用。

```ts
interface TraceInput {
  sessionId: string
  messages?: readonly TraceMessage[]
  requests?: readonly TraceRequestInput[]
  toolCalls?: readonly TraceToolCallInput[]
  toolResults?: readonly TraceToolResultInput[]
  events?: readonly TraceEvent[]
}
```

其中 `TraceMessage`、`TraceRequestInput`、`TraceToolCallInput` 和 `TraceToolResultInput` 分别对应应用已有的消息、请求、工具调用和工具结果数据。

### TraceEvent

```ts
export interface TraceEvent {
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

`seq` 用于确定事件顺序，`timestamp` 用于计算 Timeline。两者不能互相替代。

### 事件类型

```ts
export type TraceEventType =
  | 'turn.start'
  | 'turn.end'
  | 'step.start'
  | 'step.end'
  | 'request.start'
  | 'request.delta'
  | 'request.end'
  | 'assistant.delta'
  | 'assistant.end'
  | 'user.message'
  | 'tool.start'
  | 'tool.result'
  | 'context.update'
  | 'system.update'
  | 'compaction.start'
  | 'compaction.end'
  | 'error'
```

实时事件适合用于流式更新和运行中状态。

## 请求、消息与工具

### 请求

请求开始：

```ts
instance.append({
  sessionId: 'session-1',
  seq: 10,
  type: 'request.start',
  timestamp: Date.now(),
  requestId: 'request-2',
  turn: 1,
  step: 2,
  data: {
    provider: 'deepseek',
    model: 'deepseek-reasoner',
    systemPrompt: 'You are a helpful assistant.',
    prompt: [{ role: 'user', content: 'Read the project files.' }],
    tools: [
      {
        name: 'read_file',
        description: 'Read one file',
        inputSchema: { type: 'object' },
      },
    ],
    options: {
      temperature: 0.2,
      maxTokens: 2048,
    },
  },
})
```

请求完成：

```ts
instance.append({
  sessionId: 'session-1',
  seq: 20,
  type: 'request.end',
  timestamp: Date.now(),
  requestId: 'request-2',
  turn: 1,
  step: 2,
  data: {
    status: 'complete',
    usage: {
      inputTokens: 1200,
      outputTokens: 240,
      reasoningTokens: 80,
      cacheReadTokens: 600,
    },
  },
})
```

请求详情面板会展示 Provider、Model、Prompt、System Prompt、请求参数、Tool Schema、Token Usage、耗时和错误。

### 用户消息与上下文

用户消息和上下文更新会作为独立流水账记录展示，便于区分“用户输入”和“模型实际看到的上下文”：

```ts
instance.append({
  sessionId: 'session-1',
  seq: 9,
  type: 'user.message',
  timestamp: Date.now(),
  turn: 1,
  step: 0,
  data: {
    text: '请检查工作区并总结结果。',
    source: 'human',
  },
})

instance.append({
  sessionId: 'session-1',
  seq: 10,
  type: 'context.update',
  timestamp: Date.now(),
  turn: 1,
  step: 0,
  data: {
    title: 'Session context',
    text: 'Current directory: /workspace/demo',
  },
})
```

### Assistant 流式输出

```ts
instance.append({
  sessionId: 'session-1',
  seq: 11,
  type: 'assistant.delta',
  timestamp: Date.now(),
  requestId: 'request-2',
  turn: 1,
  step: 2,
  data: { text: 'I will inspect the workspace.' },
})
```

多个 `assistant.delta` 会合并到同一条记录。完成时发送 `assistant.end`。进行中的 Assistant 不会显示虚构的完成时间或耗时。

### 工具调用

工具调用和结果通过 `callId` 配对：

```ts
instance.append({
  sessionId: 'session-1',
  seq: 13,
  type: 'tool.start',
  timestamp: Date.now(),
  requestId: 'request-2',
  turn: 1,
  step: 2,
  callId: 'call-1',
  data: {
    name: 'read_file',
    argsRaw: '{"path":"README.md"}',
  },
})

instance.append({
  sessionId: 'session-1',
  seq: 14,
  type: 'tool.result',
  timestamp: Date.now(),
  requestId: 'request-2',
  turn: 1,
  step: 2,
  callId: 'call-1',
  data: {
    resultText: 'README.md loaded successfully.',
    result: { lines: 120 },
  },
})
```

Tool Inspector 支持工具名、Call ID、Parent Call ID、参数、结果、Schema、耗时和错误。工具结果未到达时状态为 `running`，耗时显示 `—`。

嵌套工具通过 `parentCallId` 建立层级，轨迹表会自动缩进为 Subtool：

```ts
instance.append({
  sessionId: 'session-1',
  seq: 15,
  type: 'tool.start',
  timestamp: Date.now(),
  callId: 'child-call-1',
  parentCallId: 'call-1',
  turn: 1,
  step: 2,
  data: {
    name: 'read_file',
    argsRaw: '{"path":"trajectory.md"}',
  },
})
```

## 时间线与记录表

顶部 Timeline 有三条泳道：

| 泳道 | 内容 |
| --- | --- |
| Context | System、User、Context、Compaction |
| Assistant | Request、Assistant、Reasoning |
| Tools | Tool、Subtool |

当前支持三种模式：`Sequence`、`Duration`、`Actual time`。点击区块会选中对应记录，拖动空白区域可以选择范围，右键清除范围。

## 历史数据

```ts
const instance = createTrace({
  container,
  source: {
    async loadInitial() {
      return { events: latestEvents, cursor: 'cursor-1', hasMore: true }
    },
    async loadOlder(cursor) {
      const response = await fetch(`/api/trace?before=${cursor}`)
      return response.json()
    },
  },
})

await instance.loadOlder()
```

组件会在 Ledger 接近顶部时自动调用 `loadOlder()`，插入旧记录后尽量保持当前可见位置。

## API

### `createTrace(options)`

```ts
interface TrajectoryOptions {
  root?: Document
  container: HTMLElement
  input?: TraceInput
  events?: readonly TraceEvent[]
  source?: TraceSource
  locale?: { locale?: string; translate?: (key: string, params?: Record<string, unknown>) => string }
  theme?: 'inherit' | 'light' | 'dark'
  virtualize?: boolean
  showReasoning?: boolean
  renderMarkdown?: (text: string, context: MarkdownRenderContext) => Node
  renderTool?: (context: ToolRenderContext) => Node | null
  messages?: Partial<TrajectoryMessages>
  onEvent?: (event: TrajectoryEvent) => void
}
```

### 实例方法

```ts
interface TrajectoryInstance {
  append(input: TraceInput | TraceEvent | readonly TraceEvent[]): void
  replace(input: TraceInput | readonly TraceEvent[]): void
  loadOlder(): Promise<boolean>
  select(recordId: string | null): void
  clearSelection(): void
  updateOptions(options: Partial<TrajectoryOptions>): void
  getSnapshot(): Readonly<TraceSnapshot>
  destroy(): void
}
```

### `onEvent`

```ts
type TrajectoryEvent =
  | { type: 'record_select'; recordId: string | null }
  | { type: 'timeline_select'; range: { start: number; end: number } | null }
  | { type: 'load_older_start' }
  | { type: 'load_older_end'; loaded: boolean }
  | { type: 'collapse_change'; scope: 'turn' | 'assistant' | 'tool'; id: string; collapsed: boolean }
  | { type: 'error'; stage: string; error: Error }
```

### 自定义渲染

```ts
createTrace({
  container,
  renderMarkdown(text, context) {
    const node = document.createElement('p')
    node.textContent = text
    node.dataset.recordId = context.recordId
    return node
  },
  renderTool({ record, document }) {
    if (record.toolName !== 'todo_write') return null
    const node = document.createElement('div')
    node.textContent = `自定义 Todo：${record.preview ?? ''}`
    return node
  },
})
```

如果接入 Markdown/HTML 渲染器，必须在渲染前完成 XSS 清理。

## 样式与主题

```ts
import '@opentiny/tiny-robot/vanilla/style.css'
```

组件样式都以 `.tr-trajectory` 为根，不会污染宿主全局样式。宿主可以覆盖 Vanilla 主题变量：

```css
.my-trace-host {
  --tr-container-bg-default: #fff;
  --tr-container-bg-default-2: #f5f7fa;
  --tr-container-bg-hover: #eef4ff;
  --tr-text-primary: #222b36;
  --tr-text-secondary: #536171;
  --tr-border-color-default: #cbd3dd;
  --tr-color-primary: #1476ff;
}
```

## 能力概览

Trace 支持：

- Request、Assistant、Tool、Subtool、System、Context、Compaction；
- Tool Call / Tool Result 配对；
- running / complete / error 状态；
- 请求、工具参数、工具结果、Schema、Timing Inspector；
- 三泳道 Timeline；
- Sequence / Duration / Actual Time；
- Timeline 选择和记录定位；
- 搜索、Turn 折叠、Subcall 折叠；
- 流式 `append()`；
- `loadInitial()` / `loadOlder()`；
- ESM、UMD 和任意框架的 DOM 接入；
- `destroy()` 生命周期清理。

可按需扩展：

- 完整虚拟滚动；
- Markdown 默认解析器；
- 图片和文件附件灯箱；
- Code Tool 专用代码查看器；
- JSON Tree 展开器；
- 复杂 Prompt Diff 和重试链视图。

## 相关参考

- [QuickAssist Vanilla 文档](./quick-assist)
- [Trace 实现源码](https://github.com/opentiny/tiny-robot/tree/master/packages/components/src/vanilla/trace)
- [DeepSeek Harness Trajectory](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/client/ui-trajectory)
