/// <reference types="vite/client" />

/** Optional environment variables used by the VitePress adapter. */
interface ImportMetaEnv {
  readonly VITE_DOCS_ASSISTANT_API_URL?: string
  readonly VITE_QWEN_API_URL?: string
  readonly VITE_DEEPSEEK_API_URL?: string
  readonly VITE_AMAP_MCP_URL?: string
  readonly VITE_ALIYUN_DASHSCOPE_KEY?: string
  readonly VITE_DEEPSEEK_API_KEY?: string
}
