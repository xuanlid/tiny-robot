import type { UseMessagePlugin } from '@opentiny/tiny-robot-kit'
import type { AssistantContext, AssistantContextFormatter, AssistantContextProvider } from './types'

const defaultFormatContext: AssistantContextFormatter = (context) =>
  [
    'Current page metadata from the host application.',
    'This metadata describes the page where the assistant is open; it is not retrieved documentation and must not replace the documentation excerpts provided separately.',
    JSON.stringify(context),
  ].join('\n')

export interface AssistantContextPluginOptions {
  getContext: () => AssistantContext | null | undefined | Promise<AssistantContext | null | undefined>
  formatContext?: AssistantContextFormatter
}

/** Adds host context to the request without persisting it as a conversation message. */
export function createAssistantContextPlugin(options: AssistantContextPluginOptions): UseMessagePlugin {
  return {
    name: 'tiny-robot-assistant-context',
    async onBeforeRequest({ requestBody }) {
      const context = await options.getContext()
      if (!context || Object.keys(context).length === 0) return

      const content = (options.formatContext ?? defaultFormatContext)(context)
      if (!content?.trim()) return

      requestBody.messages = [{ role: 'system', content }, ...requestBody.messages]
    },
  }
}

export function createContextResolver(
  source: AssistantContext | AssistantContextProvider | undefined,
  getAdditionalContext: () => AssistantContext | undefined,
): () => Promise<AssistantContext> {
  return async () => {
    const hostContext = typeof source === 'function' ? await source() : source
    return {
      ...(hostContext ?? {}),
      ...(getAdditionalContext() ?? {}),
    }
  }
}
