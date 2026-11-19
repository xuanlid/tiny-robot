# @opentiny/tiny-robot-assistant

基于 TinyRobot Chat 构建的可嵌入式 Vue 3 AI 助手 SDK，提供 VitePress 适配、模型切换、MCP 工具和页面上下文注入能力。

## 安装

```bash
pnpm add @opentiny/tiny-robot-assistant
```

## VitePress 接入

VitePress 适配器会自动完成助手挂载、样式引入、当前路由上下文、历史会话入口、默认模型、MCP 配置和文档检索。需要在 VitePress 配置中注册文档索引插件：

```ts
// .vitepress/config.ts
import { defineConfig } from 'vitepress'
import { createVitePressAssistantPlugin } from '@opentiny/tiny-robot-assistant/vitepress-plugin'

export default defineConfig({
  vite: {
    plugins: [createVitePressAssistantPlugin()],
  },
})
```

然后在主题中挂载助手：

```ts
// .vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme'
import { createVitePressAssistantTheme } from '@opentiny/tiny-robot-assistant/vitepress'

export default createVitePressAssistantTheme({
  ...DefaultTheme,
})
```

插件会在构建时扫描 VitePress 的 `srcDir/**/*.md` 并生成轻量文档索引。用户提问时，SDK 会检索相关章节，只在命中文档后加载已发布的 HTML 和引用源码，优先保留命中章节及源码命中位置附近的片段，再将受长度限制的上下文发送给模型。

如果项目不需要文档检索，可以传入 `documentSearch: false` 关闭此功能；如果还需要扫描 VitePress 根目录之外的文档，可以使用 `createVitePressAssistantPlugin({ sourceDir: '../content' })` 指定目录。

默认模型包括 Qwen3.7 Flash、Qwen3.7 Plus、Qwen3.7 Max、DeepSeek V4 Flash 和 DeepSeek V4 Pro。默认还会注册 CLI 模板中的高德地图 MCP 服务。

开发环境可以配置：

```env
VITE_ALIYUN_DASHSCOPE_KEY=your_dashscope_key
VITE_DEEPSEEK_API_KEY=your_deepseek_key
VITE_AMAP_MCP_URL=
VITE_DOCS_ASSISTANT_API_URL=
```

`VITE_AMAP_MCP_URL` 用于覆盖 MCP 地址，`VITE_DOCS_ASSISTANT_API_URL` 用于为两个模型配置共用的 OpenAI 兼容代理地址。

### 自定义模型

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

示例使用同源服务端代理，API Key 应保存在服务端，不要写入前端代码。

### 自定义 MCP

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

如果传入 `runtimeOptions`，它会作为完整 Runtime 配置使用；此时可以直接在其中配置 `mcpServers` 或自定义 MCP 适配器。

## 通用 Vue 接入

非 VitePress 项目可以直接使用 `TinyRobotAssistant`：

```vue
<script setup lang="ts">
import { TinyRobotAssistant } from '@opentiny/tiny-robot-assistant'
import '@opentiny/tiny-robot-assistant/style.css'

const runtimeOptions = {
  modelProviders: [
    {
      type: 'deepseek' as const,
      apiUrl: '/api/assistant',
      models: [{ id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' }],
    },
  ],
}
</script>

<template>
  <TinyRobotAssistant mode="floating" :runtime-options="runtimeOptions" />
</template>
```

也可以使用 `createAssistant({ mount, runtimeOptions })` 进行命令式挂载。`runtimeOptions` 透传 `useChatRuntime` 的配置，支持自定义模型、MCP 服务、会话和请求处理逻辑。

通过 `context` 可以将当前页面信息附加到模型请求中；`formatContext` 可以自定义上下文格式。

## 生产环境配置

`VITE_*` 环境变量会被写入浏览器产物，只适合本地开发。生产环境应使用同源服务端代理，将模型密钥和 MCP 凭证保存在服务端，再通过 `apiUrl`、`modelProviders` 或 `runtimeOptions` 连接代理。
