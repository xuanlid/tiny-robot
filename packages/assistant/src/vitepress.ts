import './style.css'

import type { ChatMcpServers, ChatProviderConfig, UseChatRuntimeOptions } from '@opentiny/tiny-robot-chat'
import { IconBailian, IconDeepseek } from '@opentiny/tiny-robot-svgs'
import { defineComponent, Fragment, h } from 'vue'
import { useRoute, type Theme } from 'vitepress'
import TinyRobotAssistant from './Assistant.vue'
import type { AssistantContext, AssistantOptions } from './types'
import { createVitePressDocumentSearch, type VitePressDocumentSearchOptions } from './vitepressSearch'

export interface VitePressAssistantOptions {
  runtimeOptions?: UseChatRuntimeOptions
  modelProviders?: readonly ChatProviderConfig[]
  mcpServers?: ChatMcpServers
  documentSearch?: false | VitePressDocumentSearchOptions
  apiUrl?: string
  title?: string
  launcherLabel?: string
  assistant?: Omit<Partial<AssistantOptions>, 'runtimeOptions' | 'context' | 'documentSearch'>
  context?: AssistantContext | (() => AssistantContext | Promise<AssistantContext>)
}

function env(name: string): string | undefined {
  return (import.meta.env as Record<string, string | undefined>)[name]?.trim() || undefined
}

function defaultApiUrl(): string {
  const origin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin
  return new URL(`${import.meta.env.BASE_URL || '/'}api`, origin).toString()
}

function defaultModelProviders(apiUrl?: string): ChatProviderConfig[] {
  const qwenApiKey = env('VITE_ALIYUN_DASHSCOPE_KEY')
  const deepseekApiKey = env('VITE_DEEPSEEK_API_KEY')
  const qwenApiUrl = env('VITE_QWEN_API_URL')
  const deepseekApiUrl = env('VITE_DEEPSEEK_API_URL')
  const fallback = apiUrl ?? env('VITE_DOCS_ASSISTANT_API_URL') ?? defaultApiUrl()

  return [
    {
      type: 'qwen',
      label: 'DashScope',
      apiUrl: apiUrl || qwenApiUrl || (qwenApiKey ? undefined : fallback),
      apiKey: qwenApiKey,
      models: [
        {
          id: 'qwen3.7-flash',
          label: 'Qwen3.7 Flash',
          icon: IconBailian,
          capabilities: { thinking: true, search: true },
        },
        {
          id: 'qwen3.7-plus',
          label: 'Qwen3.7 Plus',
          icon: IconBailian,
          capabilities: { thinking: true, search: true },
        },
        { id: 'qwen3.7-max', label: 'Qwen3.7 Max', icon: IconBailian, capabilities: { thinking: true, search: true } },
      ],
    },
    {
      type: 'deepseek',
      apiUrl: apiUrl || deepseekApiUrl || (deepseekApiKey ? undefined : fallback),
      apiKey: deepseekApiKey,
      models: [
        { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash', icon: IconDeepseek, capabilities: { thinking: true } },
        { id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro', icon: IconDeepseek, capabilities: { thinking: true } },
      ],
    },
  ]
}

function defaultMcpServers(): ChatMcpServers {
  const apiKey = env('VITE_ALIYUN_DASHSCOPE_KEY')

  return [
    {
      id: 'amap-maps',
      name: '\u9ad8\u5fb7\u5730\u56fe',
      description:
        '\u63d0\u4f9b\u5730\u56fe\u3001\u5bfc\u822a\u3001\u5929\u6c14\u3001\u8def\u5f84\u89c4\u5212\u548c\u5468\u8fb9\u641c\u7d22\u7b49\u5730\u7406\u4fe1\u606f\u670d\u52a1\u3002',
      baseUrl: env('VITE_AMAP_MCP_URL') ?? 'https://dashscope.aliyuncs.com/api/v1/mcps/amap-maps/mcp',
      icon: 'https://img.alicdn.com/imgextra/i4/O1CN01iPPabT1EGRN6uatHP_!!6000000000324-0-tps-512-512.jpg',
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
    },
  ]
}

export function createVitePressAssistantTheme(theme: Theme, options: VitePressAssistantOptions = {}): Theme {
  const BaseLayout = theme.Layout
  if (!BaseLayout) return theme

  const runtimeOptions = options.runtimeOptions ?? {
    modelProviders: options.modelProviders ?? defaultModelProviders(options.apiUrl),
    mcpServers: options.mcpServers ?? defaultMcpServers(),
  }

  const AssistantLayout = defineComponent({
    name: 'TinyRobotVitePressAssistantLayout',
    setup() {
      const route = useRoute()
      const getContext = async () => {
        const customContext = options.context
          ? typeof options.context === 'function'
            ? await options.context()
            : options.context
          : {}

        return {
          path: route.path,
          title: typeof document === 'undefined' ? undefined : document.title,
          url: typeof window === 'undefined' ? undefined : window.location.href,
          ...customContext,
        }
      }

      return () =>
        h(Fragment, [
          h(BaseLayout),
          h(TinyRobotAssistant, {
            ...options.assistant,
            runtimeOptions,
            documentSearch:
              options.documentSearch === false ? undefined : createVitePressDocumentSearch(options.documentSearch),
            context: getContext,
            title: options.title ?? 'TinyRobot 文档助手',
            launcherLabel: options.launcherLabel ?? '打开 TinyRobot 文档助手',
            mode: options.assistant?.mode ?? 'floating',
          }),
        ])
    },
  })

  return { ...theme, Layout: AssistantLayout }
}
