---
outline: [1, 3]
---

# VitePress 文档助手接入

`@opentiny/tiny-robot-assistant` 提供了 VitePress 专用适配器。接入后，文档站会显示 TinyRobot 助手，并可以检索当前 VitePress 项目中的 Markdown 文档，再基于命中的内容回答问题。

CLI 的 `add chat` 适合生成一个可以深度修改的 Chat 页面；VitePress 文档站推荐使用 SDK，不需要复制 Chat 模板源码。

## 接入后的结构

VitePress 接入需要两个入口：

| 入口 | 运行位置 | 作用 |
| --- | --- | --- |
| `@opentiny/tiny-robot-assistant/vitepress-plugin` | VitePress/Vite 构建侧 | 扫描 Markdown 并生成文档索引 |
| `@opentiny/tiny-robot-assistant/vitepress` | VitePress 主题运行时 | 挂载助手、注入路由上下文并连接文档检索 |

插件依赖 Node.js 文件系统，主题适配器运行在浏览器和 VitePress 主题中，因此两个入口需要分别配置。

## 安装

```bash
pnpm add @opentiny/tiny-robot-assistant
```

## 第一步：注册文档索引插件

编辑 `.vitepress/config.mts`：

```ts
import { defineConfig } from 'vitepress'
import { createVitePressAssistantPlugin } from '@opentiny/tiny-robot-assistant/vitepress-plugin'

export default defineConfig({
  vite: {
    plugins: [createVitePressAssistantPlugin()],
  },
})
```

如果项目已经配置了其他 Vite 插件，将助手插件追加到现有数组中：

```ts
vite: {
  plugins: [existingPlugin(), createVitePressAssistantPlugin()],
}
```

插件会在开发服务中动态提供索引，并在生产构建时生成：

```text
tiny-robot-assistant-docs.json
```

插件会扫描 Markdown 文档，并解析当前页面引用的本地源码文件，包括：

- `<demo vue="..." />`、`vueFiles`、`htmlFiles`、`tsFiles` 等文档示例配置。
- Markdown、Vue、TS、JS 和样式文件中的相对 `import`。
- VitePress 的 `@include` 文件引用。

这些引用文件会递归合并到所属 Markdown 页面的检索内容中。因此，文档中的 Vue Demo、TypeScript 配置和辅助文件也可以被助手检索到。外部 npm 包和非相对路径不会被读取。

默认扫描 VitePress 的 `srcDir/**/*.md`。如果配置了 `srcDir: 'content'`，插件会扫描 `content` 目录。

如果需要扫描 `srcDir` 之外的目录，可以指定相对 Vite 根目录的路径：

```ts
createVitePressAssistantPlugin({
  sourceDir: '../shared-docs',
})
```

### 文档索引与按需检索

插件会在构建阶段生成轻量文档索引。用户提问时，助手先匹配相关文档，再读取对应的 VitePress 页面和文档引用的 Vue/TS 源码，最后将相关片段作为上下文发送给模型。

```ts
createVitePressAssistantPlugin()
```

索引只保存每篇文档和源码的少量关键词，不保存正文，也不会把 CSS 数值、颜色值和大段代码 token 放进索引。正文和引用源码会在命中后按需读取，因此不会把整站内容放进单个索引文件。中文优先使用 `Intl.Segmenter` 分词，旧环境才回退到基础匹配。

## 第二步：接入 VitePress 主题

编辑 `.vitepress/theme/index.ts`：

```ts
import DefaultTheme from 'vitepress/theme'
import { createVitePressAssistantTheme } from '@opentiny/tiny-robot-assistant/vitepress'

export default createVitePressAssistantTheme({
  ...DefaultTheme,
})
```

主题适配器会自动处理：

- 助手浮动按钮和聊天窗口。
- 窗口拖拽、缩放和移动端布局。
- 右上角历史会话入口和历史会话弹层。
- SDK 样式引入。
- 当前页面的 `path`、`title` 和 `url` 上下文。
- 默认 Qwen、DeepSeek 模型列表。
- 默认 MCP 配置。
- 文档索引读取和问题检索。

不需要再创建 `DocsAssistant.vue`，也不需要在 `Layout.vue` 中重复挂载助手。

## 第三步：配置模型

VitePress 适配器默认提供以下模型：

- Qwen3.7 Flash
- Qwen3.7 Plus
- Qwen3.7 Max
- DeepSeek V4 Flash
- DeepSeek V4 Pro

### 本地直连测试

在 VitePress 项目根目录创建 `.env.local`：

```env
VITE_ALIYUN_DASHSCOPE_KEY=your_dashscope_key
VITE_DEEPSEEK_API_KEY=your_deepseek_key
```

配置后必须重启 VitePress：

```bash
pnpm dev
```

没有配置 Key 时，默认 Provider 会使用同源的 `/api` 地址，适合文档站的本地模拟接口。

### 使用服务端代理

生产环境推荐使用代理，不要把真实 Key 放进 `VITE_*` 变量：

```env
VITE_QWEN_API_URL=/api/qwen
VITE_DEEPSEEK_API_URL=/api/deepseek
```

也可以让两个 Provider 共用一个代理：

```env
VITE_DOCS_ASSISTANT_API_URL=/api/assistant
```

优先级如下：

```text
apiUrl 参数
  > VITE_QWEN_API_URL / VITE_DEEPSEEK_API_URL
  > VITE_DOCS_ASSISTANT_API_URL
  > 同源 /api
```

服务端代理负责保存模型 API Key，并将浏览器请求转发到模型 Provider。

## 自定义模型列表

如果不需要默认模型，可以通过 `runtimeOptions` 覆盖：

```ts
import DefaultTheme from 'vitepress/theme'
import type { ChatProviderConfig } from '@opentiny/tiny-robot-chat'
import { createVitePressAssistantTheme } from '@opentiny/tiny-robot-assistant/vitepress'

const modelProviders: ChatProviderConfig[] = [
  {
    type: 'deepseek',
    label: 'DeepSeek',
    apiUrl: '/api/assistant',
    models: [{ id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' }],
  },
]

export default createVitePressAssistantTheme(
  { ...DefaultTheme },
  {
    runtimeOptions: { modelProviders },
  },
)
```

传入 `runtimeOptions` 后，它会作为完整 Runtime 配置使用；此时 `modelProviders`、`mcpServers` 等配置应放在 `runtimeOptions` 内。

## 配置 MCP

适配器默认注册 CLI 模板中的高德地图 MCP 服务。可以使用环境变量覆盖地址：

```env
VITE_AMAP_MCP_URL=/api/mcp/amap
```

默认 MCP 会读取 `VITE_ALIYUN_DASHSCOPE_KEY` 作为请求凭证。生产环境应通过服务端代理保护 MCP 凭证。

也可以完全替换 MCP 服务：

```ts
import DefaultTheme from 'vitepress/theme'
import { createVitePressAssistantTheme } from '@opentiny/tiny-robot-assistant/vitepress'

export default createVitePressAssistantTheme(
  { ...DefaultTheme },
  {
    mcpServers: [
      {
        id: 'my-mcp',
        name: '我的 MCP 服务',
        baseUrl: '/api/mcp',
        installed: true,
      },
    ],
  },
)
```

MCP 服务需要支持浏览器可访问的 Streamable HTTP 连接。

## 文档检索流程

用户发送问题时，SDK 会执行以下流程：

```text
用户问题
  ↓
读取 tiny-robot-assistant-docs.json
  ↓
关键词匹配文档标题和索引词
  ↓
选取相关章节和正文片段
  ↓
作为 system message 注入模型请求
  ↓
模型基于文档内容回答
```

当前检索是浏览器端关键词检索：

- 不需要向量数据库。
- 文档重新构建后索引会更新。
- 适合公开文档和中小规模文档站。

命中文档后，页面正文会优先保留与问题相关的章节；引用源码只保留命中位置附近的代码。同一个文档的页面和源码片段会合并限制在 `maxExcerptLength` 内，默认值为 `1600`，避免把整篇文档或完整源码发送给模型。

这套检索能力不替换 VitePress 自带的站内搜索，两者可以同时使用。

### 排除文档

不希望参与检索的 Markdown 文件，可以设置：

```md
---
search: false
---
```

### 关闭检索

如果只需要展示助手，不需要检索文档：

```ts
export default createVitePressAssistantTheme(
  { ...DefaultTheme },
  {
    documentSearch: false,
  },
)
```

## 页面上下文和路由切换

主题适配器会在每次发送时读取当前路由：

```ts
{
  path: route.path,
  title: document.title,
  url: window.location.href,
}
```

因此页面切换后不需要重新创建助手或 Runtime，下一次发送时会使用新的页面上下文。

如果需要追加业务上下文，可以传入 `context`：

```ts
export default createVitePressAssistantTheme(theme, {
  context: () => ({
    product: 'TinyRobot',
    version: 'latest',
  }),
})
```

上下文中不要放访问令牌、用户隐私或其他不应该发送给模型服务的数据。

## 生产环境建议

推荐的请求链路是：

```text
浏览器
  ↓
VitePress + Assistant SDK
  ↓ 同源 /api 请求
服务端代理
  ├── 模型 Provider
  └── MCP 服务
```

需要遵守以下规则：

1. `VITE_*` 变量会进入浏览器产物，只适合本地测试。
2. 模型 API Key 和 MCP Token 必须保存在服务端。
3. 文档索引默认适合公开文档，不适合直接发布敏感内容。
4. 私有文档需要在服务端完成权限过滤后再返回检索结果。
5. 服务端应限制模型和 MCP 请求的来源、权限和调用范围。

## 常见问题

### 启动时报 `node:path` 或 `vite-browser-external`

确认使用了最新 SDK，并且 `vitepress-plugin` 只在 VitePress/Vite 配置侧引入，不要在 Vue 组件或浏览器代码中导入：

```ts
import { createVitePressAssistantPlugin } from '@opentiny/tiny-robot-assistant/vitepress-plugin'
```

### 仍然显示模拟回复

检查浏览器 Network：

- 请求为 `/api/chat/completions`：当前仍在使用同源模拟接口或代理。
- 请求为真实 Provider 地址：检查 API Key、模型名称、CORS 和服务端返回状态。

修改 `.env.local` 后必须重启 VitePress。如果浏览器注册过旧版 Service Worker，需要在开发者工具的 Application → Service Workers 中注销，再强制刷新页面。

### 文档检索没有命中

依次检查：

1. 是否注册了 `createVitePressAssistantPlugin()`。
2. 是否能访问 `/tiny-robot-assistant-docs.json`。
3. 文档是否位于 VitePress 的 `srcDir` 下。
4. 文档 frontmatter 是否设置了 `search: false`。
5. 是否重启了 VitePress 开发服务。

还要确认 Network 中可以访问：

```text
tiny-robot-assistant-docs.json
对应的 VitePress HTML 页面和 `tiny-robot-assistant-raw/<source-id>.txt`
```

如果问题涉及 Demo 中的 Vue 或 TS 文件，请确认 Markdown 使用了相对路径引用，例如 `:vueFiles="['../../demos/chat/basic.vue']"`，或在被引用文件中使用相对 `import`。没有被文档引用的孤立源码文件不会自动归入某个文档页面。

### Markdown 表格显示错乱

SDK 已为 Markdown 表格、代码块和窄窗口增加适配样式。更新 SDK 或源码后需要重启 VitePress，并刷新浏览器缓存。
